// Firebase Functions를 통해 Gemini API 호출 (API 키 보안)
// 로컬/배포 환경 모두 실제 Cloud Functions 사용
const FUNCTIONS_BASE_URL = 'https://asia-northeast3-lid-publishing-helper.cloudfunctions.net'

// PDF에서 Base64 추출
async function extractBase64FromPDF(pdfFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1]
        resolve(base64Data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(pdfFile)
  })
}

// PDF 내용 추출 (Functions 호출)
async function extractPdfContent(pdfFile) {
  try {
    const pdfBase64 = await extractBase64FromPDF(pdfFile)
    const response = await fetch(`${FUNCTIONS_BASE_URL}/extractPdfContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, fileName: pdfFile.name })
    })

    if (!response.ok) throw new Error('PDF 추출 실패')
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error(`PDF 처리 오류 (${pdfFile.name}):`, error)
    return `[문서: ${pdfFile.name}]\n(PDF 내용 추출 실패)`
  }
}

// 파일을 Base64로 변환
async function extractBase64FromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// TXT 파일 읽기
async function extractTextContent(txtFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(txtFile)
  })
}

// Excel/CSV 처리 (Cloud Functions에 전달)
async function extractExcelContent(excelFile) {
  try {
    const base64Data = await extractBase64FromFile(excelFile)
    const response = await fetch(`${FUNCTIONS_BASE_URL}/extractExcelContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: base64Data, fileName: excelFile.name })
    })

    if (!response.ok) throw new Error('Excel 추출 실패')
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error(`Excel 처리 오류 (${excelFile.name}):`, error)
    return `[문서: ${excelFile.name}]\n(Excel 내용 추출 실패)`
  }
}

// 이미지 처리 (Vision API 사용)
async function extractImageContent(imageFile) {
  try {
    const base64Data = await extractBase64FromFile(imageFile)
    const response = await fetch(`${FUNCTIONS_BASE_URL}/extractImageContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, fileName: imageFile.name })
    })

    if (!response.ok) throw new Error('이미지 추출 실패')
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error(`이미지 처리 오류 (${imageFile.name}):`, error)
    return `[이미지: ${imageFile.name}]\n(이미지 내용 추출 실패)`
  }
}

// 4단 구조 글 생성 (스트리밍)
export async function generateArticle(formData, onProgress) {
  const { customTopic, cases, pdfFile, structuralProblems, alternatives, articleLength, customLengthMin, customLengthMax } = formData

  // PDF 내용 추출
  let pdfContents = ''
  const pdfFilesToProcess = formData.pdfFiles || (pdfFile ? [pdfFile] : [])

  if (pdfFilesToProcess.length > 0) {
    if (onProgress) onProgress({ type: 'progress', step: 'extracting', message: 'PDF 내용 추출 중...' })
    const contents = []
    for (let i = 0; i < pdfFilesToProcess.length; i++) {
      const file = pdfFilesToProcess[i]
      const content = await extractPdfContent(file)
      contents.push(content)
    }
    pdfContents = contents.join('\n\n')
  }

  // 근거자료 내용 추출
  let referenceContents = ''
  const referenceFilesToProcess = formData.referenceFiles || []

  if (referenceFilesToProcess.length > 0) {
    if (onProgress) onProgress({ type: 'progress', step: 'extracting', message: '근거자료 분석 중...' })
    const contents = []
    for (let i = 0; i < referenceFilesToProcess.length; i++) {
      const file = referenceFilesToProcess[i]

      // 파일 확장자 확인
      const fileExt = file.name.split('.').pop().toLowerCase()

      if (fileExt === 'pdf') {
        const content = await extractPdfContent(file)
        contents.push(`[문서: ${file.name}]\n${content}`)
      } else if (fileExt === 'txt') {
        const content = await extractTextContent(file)
        contents.push(`[문서: ${file.name}]\n${content}`)
      } else if (['xlsx', 'xls', 'csv'].includes(fileExt)) {
        const content = await extractExcelContent(file)
        contents.push(`[문서: ${file.name}]\n${content}`)
      } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
        const content = await extractImageContent(file)
        contents.push(`[이미지: ${file.name}]\n${content}`)
      }
    }
    referenceContents = contents.join('\n\n')
  }

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateArticle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customTopic,
        cases,
        pdfContents,
        referenceContents,
        structuralProblems,
        alternatives,
        articleLength,
        customLengthMin,
        customLengthMax
      })
    })

    if (!response.ok) {
      throw new Error('서버 응답 오류: ' + response.status)
    }

    // SSE 스트리밍 응답 처리
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'complete') {
              result = event.data
            } else if (event.type === 'error') {
              throw new Error(event.error)
            } else if (event.type === 'progress' && onProgress) {
              onProgress(event)
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }
    }

    if (!result) throw new Error('글 생성 결과를 받지 못했습니다.')
    return result
  } catch (error) {
    console.error('글 생성 오류:', error)
    throw error
  }
}

// 글 수정/보완 요청
export async function refineArticle(currentArticle, userRequest) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/refineArticle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentArticle, userRequest })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '글 수정 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('글 수정 오류:', error)
    throw error
  }
}

// 토의 질문 생성
export async function generateQuestions(article, questionCount = 10) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article, questionCount })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '질문 생성 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('질문 생성 오류:', error)
    throw error
  }
}

// 질문 수정/보완 요청
export async function refineQuestions(currentQuestions, userRequest, article) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/refineQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentQuestions, userRequest, article })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '질문 수정 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('질문 수정 오류:', error)
    throw error
  }
}

// 진행자 가이드 생성 (1편당 30분)
export async function generateFacilitatorGuide(article, questions) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateFacilitatorGuide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article, questions })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '가이드 생성 실패')
    }

    const data = await response.json()
    return data.guide
  } catch (error) {
    console.error('가이드 생성 오류:', error)
    throw error
  }
}

// 발제 요약 카드 생성
export async function generateSummaryCard(article, questions) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateSummaryCard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article, questions })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '발제 카드 생성 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('발제 카드 생성 오류:', error)
    throw error
  }
}

// 발제 요약 카드 수정
export async function refineSummaryCard(currentCard, userRequest, article, questions) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/refineSummaryCard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentCard, userRequest, article, questions })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '발제 카드 수정 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('발제 카드 수정 오류:', error)
    throw error
  }
}

// 진행자 가이드 수정
export async function refineFacilitatorGuide(currentGuide, userRequest, article, questions) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/refineFacilitatorGuide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentGuide, userRequest, article, questions })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '가이드 수정 실패')
    }

    const data = await response.json()
    return data.guide
  } catch (error) {
    console.error('가이드 수정 오류:', error)
    throw error
  }
}
