const functions = require('firebase-functions')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const admin = require('firebase-admin')
const xlsx = require('xlsx')

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp()
}
const db = admin.firestore()

// Gemini API 키는 환경변수에서 가져옴
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: {
    maxOutputTokens: 65536
  }
})

// 기본 AI 프롬프트
const DEFAULT_ARTICLE_PROMPT = `당신은 교육 정책 전문 작가입니다. 현직 교사가 제공한 정보를 바탕으로 교육 정책 관련 글을 작성해주세요.

[글의 구조 - 4단 구조]
1. 사례 제시: 현직교사 입장에서 민원/문제를 직접 겪어본 사례들 제시
2. 관련 법령: 관련된 법령이나 규칙을 조문번호와 함께 정확히 제시
3. 구조적 문제 - 학교현실: 학교 현장에서의 구조적 문제점 분석
4. 대안 제시: 문제 해결을 위한 구체적인 대안 제시

[작성 지침]
- [분량지침] 작성해주세요
- 이것은 가장 중요한 지침입니다: 요청된 글자 수를 반드시 충족해야 합니다. 절대로 짧게 요약하거나 축소하지 마세요.
- 각 섹션은 여러 문단으로 구성하고, 각 문단은 최소 5~8문장 이상으로 충분히 풀어서 서술하세요
- 사례는 구체적인 대화, 감정, 상황 묘사를 포함하여 생생하게 작성하세요
- 법령 분석은 조문 원문 인용 후 해석과 현장 적용 사례를 상세히 설명하세요
- 구조적 문제는 다양한 관점(교사, 학부모, 학생, 행정)에서 깊이 있게 분석하세요
- 대안 제시는 단계별로 구체적인 실행 방안과 기대 효과를 포함하세요
- 반드시 "~습니다", "~입니다" 형태의 경어체(존댓말)로 일관되게 작성하세요
- 전문적이면서도 읽기 쉬운 문체로 작성
- 법령 인용 시 조문번호를 정확히 명시

[중요 - 서식 금지사항]
- 절대로 마크다운 문법을 사용하지 마세요
- 별표(*), 이중별표(**), 샵(#), 백틱(\`) 등의 기호를 텍스트 강조용으로 사용하지 마세요
- 순수한 일반 텍스트로만 작성하세요
- 글머리 기호가 필요하면 "- " 또는 숫자 "1. 2. 3."만 사용하세요

[제공된 정보]
주제: [사용자주제]
사례 (작성자 제공): [사용자사례]
관련 법령/지침 (PDF에서 추출): [PDF내용]
근거자료 (작성자 제공): [근거자료내용]
구조적 문제점 (작성자 의견): [구조적문제점]
대안 (작성자 의견): [대안제시]

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. JSON 외의 텍스트는 출력하지 마세요:
{
  "title": "글 제목",
  "sections": [
    { "id": 1, "title": "1. 사례", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 2, "title": "2. 관련 법령", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 3, "title": "3. 구조적 문제 - 학교 현실", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 4, "title": "4. 대안 제시", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" }
  ]
}`

// Firestore에서 AI 지침 가져오기
async function getAiPrompt() {
  try {
    const docRef = db.collection('app_settings').doc('ai_prompts')
    const docSnap = await docRef.get()
    if (docSnap.exists) {
      const data = docSnap.data()
      return data.articleGeneration || DEFAULT_ARTICLE_PROMPT
    }
    return DEFAULT_ARTICLE_PROMPT
  } catch (error) {
    console.error('AI 프롬프트 조회 오류:', error)
    return DEFAULT_ARTICLE_PROMPT
  }
}

// CORS 설정
const corsHandler = (req, res, handler) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Max-Age', '3600')

  if (req.method === 'OPTIONS') {
    res.status(200).send('')
    return
  }

  return handler(req, res)
}

// PDF 내용 추출 (Gemini로 분석)
async function extractPdfContent(pdfBase64, fileName) {
  try {
    const pdfResult = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64
        }
      },
      '이 PDF 문서에서 법령, 지침, 규정과 관련된 핵심 내용을 조문번호와 함께 추출해주세요.'
    ])
    return `[문서: ${fileName}]\n${pdfResult.response.text()}`
  } catch (error) {
    console.error(`PDF 처리 오류 (${fileName}):`, error)
    return `[문서: ${fileName}]\n(PDF 내용 추출 실패)`
  }
}

// ==================== 글 생성 (스트리밍) ====================
exports.generateArticle = functions.runWith({ timeoutSeconds: 540, memory: '1GB' }).region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { customTopic, cases, pdfContents, referenceContents, structuralProblems, alternatives, articleLength, customLengthMin, customLengthMax } = req.body

      // SSE 헤더 설정
      res.set('Content-Type', 'text/event-stream')
      res.set('Cache-Control', 'no-cache')
      res.set('Connection', 'keep-alive')

      const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      sendEvent({ type: 'progress', step: 'prompt', message: '프롬프트 준비 중...' })

      // Firestore에서 최신 AI 지침 불러오기
      const promptTemplate = await getAiPrompt()

      // 분량 지침 생성 (A4 1쪽 ≈ 1,000~1,200자 기준)
      let lengthInstruction = ''
      let estimatedTotal = 10000
      switch (articleLength) {
        case 'pages_10_12':
          lengthInstruction = '반드시 총 10,000자~12,000자 이상(공백 포함, A4 10~12쪽 분량)으로, 각 섹션당 최소 2,500자 이상'
          estimatedTotal = 11000
          break
        case 'pages_13_15':
          lengthInstruction = '반드시 총 13,000자~15,000자 이상(공백 포함, A4 13~15쪽 분량)으로, 각 섹션당 최소 3,200자 이상'
          estimatedTotal = 14000
          break
        case 'pages_16_18':
          lengthInstruction = '반드시 총 16,000자~18,000자 이상(공백 포함, A4 16~18쪽 분량)으로, 각 섹션당 최소 4,000자 이상'
          estimatedTotal = 17000
          break
        case 'custom': {
          const min = customLengthMin || 10
          const max = customLengthMax || 12
          const charMin = min * 1000
          const charMax = max * 1000
          const perSection = Math.round(charMin / 4)
          lengthInstruction = `반드시 총 ${charMin}자~${charMax}자 이상(공백 포함, A4 ${min}~${max}쪽 분량)으로, 각 섹션당 최소 ${perSection}자 이상`
          estimatedTotal = Math.round((charMin + charMax) / 2)
          break
        }
        default:
          lengthInstruction = '반드시 총 10,000자~12,000자 이상(공백 포함, A4 10~12쪽 분량)으로, 각 섹션당 최소 2,500자 이상'
          estimatedTotal = 11000
      }

      // 태그 치환
      const finalPrompt = promptTemplate
        .replace('[분량지침]', lengthInstruction)
        .replace('[사용자주제]', customTopic || '(주제 없음)')
        .replace('[사용자사례]', cases || '(사례 없음)')
        .replace('[PDF내용]', pdfContents || '(PDF 없음)')
        .replace('[근거자료내용]', referenceContents || '(근거자료 없음)')
        .replace('[구조적문제점]', structuralProblems || '(작성자가 입력하지 않음 - AI가 분석하여 작성)')
        .replace('[대안제시]', alternatives || '(작성자가 입력하지 않음 - AI가 제안)')

      sendEvent({ type: 'progress', step: 'requesting', message: 'AI에 요청 전송 완료' })

      // 스트리밍으로 생성
      const streamResult = await model.generateContentStream(finalPrompt)

      let fullText = ''
      let lastDetectedSection = 0

      sendEvent({ type: 'progress', step: 'writing', message: '글 작성 시작...', section: 0, chars: 0, estimatedTotal })

      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text()
        fullText += chunkText

        // 섹션 감지 (JSON 내 "id": N 패턴으로 판별)
        const sectionMatches = fullText.match(/"id"\s*:\s*(\d)/g)
        const currentSection = sectionMatches ? sectionMatches.length : 0

        if (currentSection > lastDetectedSection) {
          lastDetectedSection = currentSection
          sendEvent({ type: 'progress', step: 'writing', message: `${currentSection}단계 작성 중...`, section: currentSection, chars: fullText.length, estimatedTotal })
        } else if (fullText.length % 500 < (fullText.length - chunkText.length) % 500 || chunkText.length > 200) {
          // 약 500자마다 진행 업데이트
          sendEvent({ type: 'progress', step: 'writing', message: `글 작성 중...`, section: lastDetectedSection, chars: fullText.length, estimatedTotal })
        }
      }

      sendEvent({ type: 'progress', step: 'parsing', message: '결과 정리 중...' })

      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const articleData = JSON.parse(jsonMatch[0])
        sendEvent({ type: 'complete', data: articleData })
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }

      res.end()
    } catch (error) {
      console.error('글 생성 오류:', error)
      try {
        const sendError = (data) => { res.write(`data: ${JSON.stringify(data)}\n\n`) }
        sendError({ type: 'error', error: error.message })
        res.end()
      } catch {
        res.status(500).json({ error: error.message })
      }
    }
  })
})

// ==================== 글 수정 ====================
exports.refineArticle = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { currentArticle, userRequest } = req.body

      const prompt = `현재 작성된 글을 사용자의 요청에 따라 수정해주세요.

[현재 글]
${JSON.stringify(currentArticle, null, 2)}

[사용자 요청]
${userRequest}

[지침]
- 요청된 부분만 수정하고 나머지는 유지
- 수정된 섹션의 id를 명시
- 반드시 "~습니다", "~입니다" 형태의 경어체(존댓말)로 일관되게 작성하세요
- 절대로 마크다운 문법(**, *, #, \` 등)을 사용하지 마세요
- 순수한 일반 텍스트로만 작성하세요

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요:
{
  "title": "글 제목",
  "sections": [...],
  "modifiedSections": [수정된 섹션 id 배열]
}`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]))
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }
    } catch (error) {
      console.error('글 수정 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 토의 질문 생성 ====================
exports.generateQuestions = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { article, questionCount = 10 } = req.body

      const prompt = `다음 글을 바탕으로 교사들의 온라인 미팅에서 토의할 수 있는 질문 ${questionCount}개를 생성해주세요.

[글 내용]
${JSON.stringify(article, null, 2)}

[중요 - 질문 대상]
- 이 질문은 현직 교사들끼리 모임에서 토의하는 데 사용됩니다
- 학부모에게 묻는 질문이 아니라, 교사들이 이 글을 읽고 서로 토의하기 위한 질문입니다
- "학부모님" 같은 호칭을 사용하지 마세요

[지침]
- 각 섹션(단락)별로 적절히 배분하여 질문 생성
- 예/아니오로 답할 수 없는 열린 질문으로 작성
- 교사들이 이 글의 내용을 바탕으로 자신의 교육 현장 경험과 의견을 나눌 수 있는 질문
- 교사들 간의 토론을 촉진할 수 있는 질문
- 반드시 경어체(존댓말, "~할까요?", "~있을까요?")로 작성하세요
- 마크다운 기호(**, *, # 등)를 사용하지 마세요

[출력 형식]
반드시 아래 JSON 배열 형식으로만 출력하세요:
[
  { "id": 1, "sectionId": 1, "text": "질문 내용" },
  { "id": 2, "sectionId": 1, "text": "질문 내용" },
  ...
]`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]))
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }
    } catch (error) {
      console.error('질문 생성 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 질문 수정 ====================
exports.refineQuestions = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { currentQuestions, userRequest, article } = req.body

      const prompt = `현재 토의 질문을 사용자의 요청에 따라 수정해주세요.

[원본 글]
${JSON.stringify(article, null, 2)}

[현재 질문 목록]
${JSON.stringify(currentQuestions, null, 2)}

[사용자 요청]
${userRequest}

[지침]
- 반드시 경어체(존댓말)로 작성하세요
- 마크다운 기호(**, *, # 등)를 사용하지 마세요

[출력 형식]
수정된 전체 질문 목록을 JSON 배열로 출력:
[
  { "id": 1, "sectionId": 1, "text": "질문 내용" },
  ...
]`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]))
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }
    } catch (error) {
      console.error('질문 수정 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 진행자 가이드 생성 ====================
exports.generateFacilitatorGuide = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { article, questions } = req.body

      const prompt = `다음 글과 토의 질문을 바탕으로 온라인 미팅 진행자 가이드를 생성해주세요.

[글 내용]
${JSON.stringify(article, null, 2)}

[토의 질문]
${JSON.stringify(questions, null, 2)}

[지침]
- 총 소요시간: 30분 (1편 기준)
- 각 섹션별 읽기 시간과 토의 시간 배분
- 진행자를 위한 실용적인 팁 포함
- 시간이 부족하거나 남을 경우 대처법 포함
- 반드시 경어체(존댓말, "~하세요", "~합니다")로 작성하세요
- 마크다운 기호(**, *, # 등)를 사용하지 마세요. 순수 텍스트로만 작성하세요.

[출력 형식]
읽기 쉬운 텍스트 형식으로 출력해주세요. 이모지를 적절히 사용하여 가독성을 높여주세요.`

      const result = await model.generateContent(prompt)
      res.json({ guide: result.response.text() })
    } catch (error) {
      console.error('가이드 생성 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 진행자 가이드 수정 ====================
exports.refineFacilitatorGuide = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { currentGuide, userRequest, article, questions } = req.body

      const prompt = `현재 진행자 가이드를 사용자의 요청에 따라 수정해주세요.

[현재 가이드]
${currentGuide}

[사용자 요청]
${userRequest}

[원본 글]
${JSON.stringify(article, null, 2)}

[토의 질문]
${JSON.stringify(questions, null, 2)}

[지침]
- 반드시 경어체(존댓말)로 작성하세요
- 마크다운 기호(**, *, # 등) 사용 금지. 순수 텍스트만 사용하세요.

[출력 형식]
수정된 전체 가이드를 텍스트로 출력해주세요.`

      const result = await model.generateContent(prompt)
      res.json({ guide: result.response.text() })
    } catch (error) {
      console.error('가이드 수정 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 발제 요약 카드 생성 ====================
exports.generateSummaryCard = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { article, questions } = req.body

      const prompt = `다음 글과 토의 질문을 바탕으로 발제 요약 카드를 생성해주세요.

[글 내용]
${JSON.stringify(article, null, 2)}

[토의 질문]
${JSON.stringify(questions, null, 2)}

[요청사항]
발제자가 연구회나 독서모임에서 바로 활용할 수 있는 간결한 요약 카드를 만들어주세요.

[지침]
- 이모지 사용 금지
- 마크다운 기호(**, *, # 등) 사용 금지. 순수 텍스트만 사용하세요.
- 간결하고 핵심만
- 발제자가 한눈에 볼 수 있는 분량
- 토의 질문은 전달받은 것을 모두 포함 (축소하지 않음)

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요:
{
  "title": "글 제목",
  "oneLiner": "한 줄 요약 (50자 이내)",
  "keyPoints": [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ],
  "relatedLaws": ["관련 법령 조문 (있다면)"],
  "discussionQuestions": [전달받은 토의 질문 전체를 그대로 포함]
}`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]))
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }
    } catch (error) {
      console.error('발제 카드 생성 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== 발제 요약 카드 수정 ====================
exports.refineSummaryCard = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { currentCard, userRequest, article, questions } = req.body

      const prompt = `현재 발제 카드를 사용자의 요청에 따라 수정해주세요.

[현재 발제 카드]
${JSON.stringify(currentCard, null, 2)}

[사용자 요청]
${userRequest}

[원본 글]
${JSON.stringify(article, null, 2)}

[토의 질문]
${JSON.stringify(questions, null, 2)}

[지침]
- 이모지 사용 금지
- 마크다운 기호(**, *, # 등) 사용 금지
- 요청된 부분만 수정하고 나머지는 유지

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요:
{
  "title": "글 제목",
  "oneLiner": "한 줄 요약 (50자 이내)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "relatedLaws": ["관련 법령 조문"],
  "discussionQuestions": [전달받은 토의 질문 전체]
}`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]))
      } else {
        throw new Error('JSON 형식 파싱 실패')
      }
    } catch (error) {
      console.error('발제 카드 수정 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== PDF 내용 추출 ====================
exports.extractPdfContent = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { pdfBase64, fileName } = req.body
      const content = await extractPdfContent(pdfBase64, fileName)
      res.json({ content })
    } catch (error) {
      console.error('PDF 추출 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// ==================== Excel 내용 추출 ====================
exports.extractExcelContent = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { fileBase64, fileName } = req.body

      // Base64 → Buffer
      const buffer = Buffer.from(fileBase64, 'base64')

      // Excel 파싱
      const workbook = xlsx.read(buffer, { type: 'buffer' })

      // 모든 시트 읽기
      let content = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        const csvData = xlsx.utils.sheet_to_csv(sheet)
        content += `[시트: ${sheetName}]\n${csvData}\n\n`
      })

      res.json({ content })
    } catch (error) {
      console.error('Excel 추출 오류:', error)
      res.status(500).json({ error: 'Excel 추출 실패' })
    }
  })
})

// ==================== 이미지 내용 추출 (OCR) ====================
exports.extractImageContent = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body

      // 파일 확장자로 MIME 타입 결정
      const ext = fileName.split('.').pop().toLowerCase()
      let mimeType = 'image/jpeg'
      if (ext === 'png') {
        mimeType = 'image/png'
      } else if (ext === 'jpg' || ext === 'jpeg') {
        mimeType = 'image/jpeg'
      }

      // Gemini Vision API로 이미지 분석
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        '이 이미지에 있는 모든 텍스트, 숫자, 표, 그래프 데이터를 추출해주세요. 이미지에 통계나 차트가 있다면 핵심 수치와 내용을 정리해주세요.'
      ])

      const content = result.response.text()
      res.json({ content })
    } catch (error) {
      console.error('이미지 추출 오류:', error)
      res.status(500).json({ error: '이미지 추출 실패' })
    }
  })
})

// ==================== 발표자료 생성 ====================
exports.generatePresentation = functions.region('asia-northeast3').https.onRequest((req, res) => {
  return corsHandler(req, res, async (req, res) => {
    try {
      const { articleId, slideCount = 10 } = req.body

      if (!articleId) {
        return res.status(400).json({ error: 'articleId가 필요합니다.' })
      }

      // Firestore에서 글 가져오기
      const articleDoc = await db.collection('articles').doc(articleId).get()
      if (!articleDoc.exists) {
        return res.status(404).json({ error: '글을 찾을 수 없습니다.' })
      }

      const article = articleDoc.data()

      // AI 프롬프트 생성
      const prompt = `[프레젠테이션 생성 전문가]
당신은 교육 정책 전문 발표자료 제작자입니다.
주어진 글을 분석하여 ${slideCount}장의 발표 슬라이드를 생성하세요.

[원본 글]
제목: ${article.title}
${article.sections?.map(s => `${s.title}\n${s.content}`).join('\n\n') || ''}

[토의 질문]
${article.questions?.map((q, i) => `Q${i + 1}. ${q.text}`).join('\n') || ''}

[중요 지침]
1. 줄글을 그대로 옮기지 마세요
2. 핵심 맥락만 추출하여 키워드/짧은 문구로 변환
3. 각 슬라이드는 3-5개의 키포인트만 포함
4. 토의 질문은 기존 questions 재활용
5. 총 ${slideCount}장으로 구성
6. 마크다운 기호(**, *, # 등) 사용 금지
7. 이모지 사용 금지

[슬라이드 타입]
- title: 제목 슬라이드 (1장)
- content: 내용 슬라이드 (본문 핵심)
- question: 토의 질문 슬라이드
- closing: 마무리 슬라이드 (1장)

[슬라이드 배분 예시 (10장 기준)]
1. 제목 슬라이드
2-3. 사례 핵심 (섹션 1)
4-5. 관련 법령 (섹션 2)
6-7. 구조적 문제 (섹션 3)
8. 대안 제시 (섹션 4)
9. 토의 질문
10. 마무리

[출력 형식]
반드시 아래 JSON 배열 형식으로만 출력하세요:
[
  {
    "type": "title",
    "title": "발표 제목",
    "subtitle": "부제목 또는 한 줄 요약",
    "author": "${article.authorName || '작성자'}"
  },
  {
    "type": "content",
    "title": "섹션 제목",
    "keyPoints": [
      "핵심 포인트 1 (20자 이내)",
      "핵심 포인트 2 (20자 이내)",
      "핵심 포인트 3 (20자 이내)"
    ]
  },
  {
    "type": "question",
    "title": "토의 질문",
    "questions": ["질문1", "질문2"]
  },
  {
    "type": "closing",
    "title": "감사합니다",
    "message": "마무리 메시지"
  }
]`

      // Gemini API 호출
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // JSON 파싱
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('슬라이드 생성 실패: JSON 파싱 오류')
      }

      const slides = JSON.parse(jsonMatch[0])

      // 슬라이드 ID 추가
      const slidesWithId = slides.map((slide, index) => ({
        id: index + 1,
        ...slide
      }))

      res.json({ slides: slidesWithId })
    } catch (error) {
      console.error('프레젠테이션 생성 오류:', error)
      res.status(500).json({ error: error.message })
    }
  })
})
