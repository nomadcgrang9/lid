# 글쓰기 AI 연동 수정 백엔드 구현 가이드

## 개요
관리자 페이지에서 수정한 AI 지침과 근거자료 업로드 기능을 실제 AI 글 생성에 반영하는 백엔드 작업

---

## 현재 상태

### ✅ 완료된 프론트엔드
1. **관리자 페이지**: AI 지침을 Firestore에 저장/수정 가능
2. **글쓰기 페이지**: 근거자료 파일 업로드 UI 완성 (최대 3개, 10MB, PDF/TXT/Excel/CSV/이미지)

### ❌ 아직 안된 백엔드
1. **Firestore에서 AI 지침 불러오기**: Cloud Functions가 고정된 프롬프트 사용 중
2. **근거자료 파일 처리**: 업로드된 파일이 AI에게 전달 안 됨
3. **태그 치환**: `[근거자료내용]` 태그가 실제 내용으로 치환 안 됨

---

## 구현 단계

### 1단계: Firestore에서 AI 지침 불러오기

**파일**: `functions/index.js`

**현재 코드**:
```javascript
// 하드코딩된 프롬프트 사용
const prompt = `당신은 교육 정책 전문 작가입니다...`
```

**수정할 코드**:
```javascript
// Firestore에서 AI 지침 가져오기
const admin = require('firebase-admin');
const db = admin.firestore();

async function getAiPrompt() {
  const doc = await db.collection('settings').doc('ai_prompts').get();
  if (doc.exists) {
    return doc.data().articleGeneration;
  }
  // 기본값 반환 (memberService.js의 DEFAULT_ARTICLE_PROMPT와 동일)
  return DEFAULT_ARTICLE_PROMPT;
}

// generateArticle 함수에서 사용
exports.generateArticle = functions.https.onRequest(async (req, res) => {
  // Firestore에서 최신 AI 지침 불러오기
  const promptTemplate = await getAiPrompt();

  // ... 나머지 로직
});
```

**효과**: 관리자가 수정한 AI 지침이 실시간 반영됨

---

### 2단계: 근거자료 파일 처리 추가

**파일**: `frontend/src/services/geminiService.js`

**현재 코드 (PDF 처리 부분)**:
```javascript
// PDF 내용 추출
let pdfContents = '';
const pdfFilesToProcess = formData.pdfFiles || (pdfFile ? [pdfFile] : []);

if (pdfFilesToProcess.length > 0) {
  const contents = [];
  for (let i = 0; i < pdfFilesToProcess.length; i++) {
    const file = pdfFilesToProcess[i];
    const content = await extractPdfContent(file);
    contents.push(content);
  }
  pdfContents = contents.join('\n\n');
}
```

**추가할 코드 (근거자료 처리)**:
```javascript
// 근거자료 내용 추출
let referenceContents = '';
const referenceFilesToProcess = formData.referenceFiles || [];

if (referenceFilesToProcess.length > 0) {
  const contents = [];
  for (let i = 0; i < referenceFilesToProcess.length; i++) {
    const file = referenceFilesToProcess[i];

    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'pdf') {
      // PDF 처리 (기존 extractPdfContent 함수 재사용)
      const content = await extractPdfContent(file);
      contents.push(`[문서: ${file.name}]\n${content}`);
    } else if (fileExt === 'txt') {
      // TXT 파일 처리
      const content = await extractTextContent(file);
      contents.push(`[문서: ${file.name}]\n${content}`);
    } else if (['xlsx', 'xls', 'csv'].includes(fileExt)) {
      // Excel/CSV 처리
      const content = await extractExcelContent(file);
      contents.push(`[문서: ${file.name}]\n${content}`);
    } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
      // 이미지 처리
      const content = await extractImageContent(file);
      contents.push(`[이미지: ${file.name}]\n${content}`);
    }
  }
  referenceContents = contents.join('\n\n');
}

// Cloud Functions에 전송
const response = await fetch(`${FUNCTIONS_BASE_URL}/generateArticle`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customTopic,
    cases,
    pdfContents,
    referenceContents,  // ← 추가!
    structuralProblems,
    alternatives,
    articleLength,
    customLengthMin,
    customLengthMax
  })
});
```

**추가로 필요한 헬퍼 함수들**:

```javascript
// TXT 파일 읽기
async function extractTextContent(txtFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(txtFile);
  });
}

// Excel/CSV 처리 (Cloud Functions에 전달)
async function extractExcelContent(excelFile) {
  try {
    const base64Data = await extractBase64FromFile(excelFile);
    const response = await fetch(`${FUNCTIONS_BASE_URL}/extractExcelContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: base64Data, fileName: excelFile.name })
    });

    if (!response.ok) throw new Error('Excel 추출 실패');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error(`Excel 처리 오류 (${excelFile.name}):`, error);
    return `[문서: ${excelFile.name}]\n(Excel 내용 추출 실패)`;
  }
}

// 이미지 처리 (Vision API 사용)
async function extractImageContent(imageFile) {
  try {
    const base64Data = await extractBase64FromFile(imageFile);
    const response = await fetch(`${FUNCTIONS_BASE_URL}/extractImageContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, fileName: imageFile.name })
    });

    if (!response.ok) throw new Error('이미지 추출 실패');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error(`이미지 처리 오류 (${imageFile.name}):`, error);
    return `[이미지: ${imageFile.name}]\n(이미지 내용 추출 실패)`;
  }
}

// 파일을 Base64로 변환
async function extractBase64FromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

### 3단계: Cloud Functions에서 근거자료 처리

**파일**: `functions/index.js`

**Excel 추출 함수 추가**:
```javascript
const xlsx = require('xlsx'); // npm install xlsx 필요

exports.extractExcelContent = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { fileBase64, fileName } = req.body;

      // Base64 → Buffer
      const buffer = Buffer.from(fileBase64, 'base64');

      // Excel 파싱
      const workbook = xlsx.read(buffer, { type: 'buffer' });

      // 모든 시트 읽기
      let content = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csvData = xlsx.utils.sheet_to_csv(sheet);
        content += `[시트: ${sheetName}]\n${csvData}\n\n`;
      });

      res.json({ content });
    } catch (error) {
      console.error('Excel 추출 오류:', error);
      res.status(500).json({ error: 'Excel 추출 실패' });
    }
  });
});
```

**이미지 OCR 함수 추가** (Gemini Vision API 사용):
```javascript
exports.extractImageContent = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { imageBase64, fileName } = req.body;

      // Gemini Vision API로 이미지 분석
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg', // 또는 image/png
            data: imageBase64
          }
        },
        '이 이미지에 있는 모든 텍스트, 숫자, 그래프 데이터를 추출해주세요.'
      ]);

      const content = result.response.text();
      res.json({ content });
    } catch (error) {
      console.error('이미지 추출 오류:', error);
      res.status(500).json({ error: '이미지 추출 실패' });
    }
  });
});
```

**generateArticle 함수 수정**:
```javascript
exports.generateArticle = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const {
        customTopic,
        cases,
        pdfContents,
        referenceContents,  // ← 추가!
        structuralProblems,
        alternatives,
        articleLength,
        customLengthMin,
        customLengthMax
      } = req.body;

      // Firestore에서 최신 AI 지침 불러오기
      const promptTemplate = await getAiPrompt();

      // 분량 지침 생성
      let lengthInstruction = '';
      if (articleLength === 'custom') {
        lengthInstruction = `A4 ${customLengthMin}~${customLengthMax}쪽 분량으로`;
      } else {
        const lengthMap = {
          'short': 'A4 4~6쪽 분량으로',
          'medium': 'A4 7~9쪽 분량으로',
          'long': 'A4 10~12쪽 분량으로'
        };
        lengthInstruction = lengthMap[articleLength] || 'A4 7~9쪽 분량으로';
      }

      // 태그 치환
      const finalPrompt = promptTemplate
        .replace('[분량지침]', lengthInstruction)
        .replace('[사용자주제]', customTopic || '(주제 없음)')
        .replace('[사용자사례]', cases || '(사례 없음)')
        .replace('[PDF내용]', pdfContents || '(PDF 없음)')
        .replace('[근거자료내용]', referenceContents || '(근거자료 없음)')  // ← 추가!
        .replace('[구조적문제점]', structuralProblems || '(작성자가 입력하지 않음 - AI가 분석하여 작성)')
        .replace('[대안제시]', alternatives || '(작성자가 입력하지 않음 - AI가 제안)');

      // Gemini API 호출
      const result = await model.generateContent(finalPrompt);
      const generatedText = result.response.text();

      // ... JSON 파싱 및 응답
    } catch (error) {
      console.error('글 생성 오류:', error);
      res.status(500).json({ error: '글 생성 실패' });
    }
  });
});
```

---

## 작동 흐름 (최종)

```
1. 관리자 페이지
   ├─ AI 지침 수정 → Firestore 저장
   └─ (settings/ai_prompts 문서에 저장)

2. 사용자가 글쓰기
   ├─ 주제, 사례 입력
   ├─ PDF 업로드 (법령/지침)
   ├─ 근거자료 업로드 (통계, 뉴스 등) ← 신규!
   ├─ 구조적 문제점, 대안 입력 (선택)
   └─ "글 생성하기" 클릭

3. geminiService.js
   ├─ PDF 내용 추출
   ├─ 근거자료 내용 추출 ← 신규!
   │  ├─ TXT: 직접 읽기
   │  ├─ PDF: extractPdfContent()
   │  ├─ Excel/CSV: extractExcelContent()
   │  └─ 이미지: extractImageContent() (Vision API)
   └─ Cloud Functions로 전송

4. Cloud Functions (generateArticle)
   ├─ Firestore에서 최신 AI 지침 불러오기 ← 신규!
   ├─ 태그 치환
   │  ├─ [분량지침] → "A4 10~12쪽 분량으로"
   │  ├─ [사용자주제] → "아동학대 신고의 딜레마"
   │  ├─ [사용자사례] → "학교에서 아동학대 의심..."
   │  ├─ [PDF내용] → "아동복지법 제10조의4..."
   │  ├─ [근거자료내용] → "2023년 교육부 통계..." ← 신규!
   │  ├─ [구조적문제점] → 사용자 입력 or AI 생성
   │  └─ [대안제시] → 사용자 입력 or AI 생성
   ├─ Gemini API 호출
   └─ 생성된 글 반환

5. 사용자
   └─ 근거자료가 반영된 글 확인 ✅
```

---

## 필요한 패키지 설치

```bash
# Cloud Functions에서
cd functions
npm install xlsx
```

---

## 테스트 방법

### 1. AI 지침 수정 테스트
1. 관리자 페이지 → AI 글쓰기 지침
2. `[근거자료내용]` 부분이 있는지 확인
3. 지침 수정 후 저장
4. 글쓰기에서 글 생성 → 수정된 지침 반영 확인

### 2. 근거자료 업로드 테스트
1. 글쓰기 → 새 글 작성
2. 근거자료 업로드 (Excel 파일 예시: `교육부통계.xlsx`)
3. 글 생성
4. 생성된 글에 Excel 데이터가 반영되었는지 확인

---

## 주의사항

1. **Excel 파일 크기**: 10MB 제한, 시트가 너무 많으면 처리 시간 증가
2. **이미지 OCR**: Gemini Vision API 비용 발생 (이미지 1장당 약 $0.0025)
3. **에러 처리**: 파일 추출 실패 시에도 글 생성은 계속 진행 (에러 메시지만 표시)
4. **Firestore 읽기**: generateArticle 호출마다 Firestore 1회 읽기 발생

---

## 예상 비용 (월 100명 사용 시)

- Firestore 읽기: 100회 × $0.00006 = $0.006
- Gemini API: 100회 × $0.01 = $1.00
- Excel 처리: Cloud Functions 실행 무료 (월 200만건)
- **총합: 약 $1.01/월**

---

## 다음 단계

1. ✅ 프론트엔드 완료
2. ⬜ Cloud Functions에 Excel/이미지 추출 함수 추가
3. ⬜ geminiService.js에 근거자료 처리 로직 추가
4. ⬜ generateArticle에서 Firestore 연동
5. ⬜ 테스트 및 배포
