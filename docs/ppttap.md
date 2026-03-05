# 발표자료 만들기 기능 설계 문서

## 📊 개요

**기능명**: 발표자료 만들기 (Presentation Builder)

**핵심 개념**: 작성된 글을 AI가 분석하여 발표용 인포그래픽 슬라이드로 자동 변환하고, 사용자가 수정 가능하며, 다운로드 또는 웹에서 직접 프레젠테이션할 수 있는 기능

---

## 📋 사용자 시나리오

```
1. [발표자료 탭 클릭]
   ↓
2. [작성된 글 목록 표시]
   - 제목, 작성자, 날짜 리스트
   ↓
3. [특정 글 선택]
   ↓
4. [슬라이드 생성 옵션 설정]
   - 장수 입력 (자유 타이핑: 예: 10장, 15장, 20장)
   - "발표자료 생성" 버튼 클릭
   ↓
5. [AI 자동 생성 중...]
   - 글 내용 분석
   - 핵심 맥락/키워드 추출
   - 토의 질문 포함
   - 지정 장수에 맞게 인포그래픽 슬라이드 생성
   ↓
6. [생성된 슬라이드 미리보기]
   - HTML/CSS 기반 인포그래픽
   - 장별로 핵심 문구만 표시 (줄글 X)
   ↓
7. [슬라이드 편집 모드]
   - 각 슬라이드의 텍스트 수정 가능
   - 실시간 미리보기
   ↓
8. [완성 및 활용]
   Option A: 이미지 파일로 다운로드 (PNG/JPG)
   Option B: 웹에서 직접 프레젠테이션 모드 실행
```

---

## 🎯 주요 기능 요소

### 1️⃣ 글 목록 화면
- **표시 내용**: 작성된 모든 글 (제목, 작성자, 날짜, 카테고리)
- **액션**: 각 글마다 "발표자료 만들기" 버튼

### 2️⃣ 슬라이드 생성 설정
- **장수 입력 필드**: 사용자가 직접 타이핑 (예: 10, 15, 20)
- **기본값 제안**: 글 분량에 따라 추천 장수 표시
- **토의 질문 포함 여부**: 자동 포함

### 3️⃣ AI 자동 생성 로직
- **입력**: `article` 객체 (sections, questions 등)
- **처리**:
  - 4단 구조 섹션별 핵심 맥락 추출
  - 줄글 → 키워드/핵심 문구로 압축
  - 토의 질문 배치
  - 지정 장수에 맞게 분배
- **출력**: 슬라이드 배열

### 4️⃣ 인포그래픽 슬라이드 렌더링
- **HTML/CSS 기반**: Flexbox, Grid 활용
- **디자인 스타일**: 미니멀 (텍스트 중심, 심플)
  - 깔끔한 레이아웃
  - 아이콘 활용 (Lucide React)
  - 최소한의 색상 (primary, secondary)
  - 반응형 (16:9 비율 유지)
- **줄글 금지**: 키워드, 짧은 문구만 표시

### 5️⃣ 슬라이드 편집 기능
- **장별 편집 모드**:
  - 제목 수정
  - 핵심 포인트 추가/삭제/수정
  - 간략 설명 수정
- **실시간 미리보기**: 편집 즉시 반영

### 6️⃣ 다운로드 기능
- **이미지 파일 저장**:
  - `html2canvas` 라이브러리 활용
  - 각 슬라이드를 PNG/JPG로 변환
  - ZIP 파일로 일괄 다운로드 (선택사항)
- **파일명**: `발표자료_글제목_20250101.zip`

### 7️⃣ 웹 프레젠테이션 모드
- **전체화면 모드**:
  - 슬라이드 네비게이션 (← → 키)
  - 진행 상태 표시 (1/10)
  - ESC로 종료
- **URL 공유 가능**: 발표자료 ID로 접근

---

## 🛠️ 기술 스택

### Frontend
- **React 18 + Vite**
- **React Router v6**: 라우팅
- **Lucide React**: 아이콘
- **html2canvas**: HTML을 Canvas/Image로 변환
- **jszip**: 여러 이미지를 ZIP으로 압축 (선택)
- **Firebase SDK**: Firestore, Storage

### Backend
- **Firebase Cloud Functions** (Node.js)
- **Gemini 2.5 Pro API**: AI 슬라이드 생성

### Database
- **Firestore**: presentations 컬렉션
- **Firebase Storage**: 이미지 저장 (선택)

---

## 📁 파일 구조

```
frontend/src/
├── pages/
│   ├── PresentationPage.jsx              (메인: 글 목록 + 생성)
│   ├── PresentationPage.css
│   ├── PresentationEditorPage.jsx        (편집 페이지)
│   ├── PresentationEditorPage.css
│   ├── PresentationViewerPage.jsx        (전체화면 보기)
│   └── PresentationViewerPage.css
│
├── components/
│   └── presentation/
│       ├── ArticleListItem.jsx           (글 목록 항목)
│       ├── ArticleListItem.css
│       ├── SlidePreview.jsx              (슬라이드 미리보기/편집)
│       ├── SlidePreview.css
│       ├── PresentationSlide.jsx         (슬라이드 렌더링)
│       ├── PresentationSlide.css
│       ├── SlideThumbnail.jsx            (썸네일)
│       ├── SlideThumbnail.css
│       ├── SlideEditor.jsx               (편집 컨트롤)
│       ├── SlideViewer.jsx               (전체화면 뷰어)
│       └── DownloadButton.jsx            (다운로드 버튼)
│
├── services/
│   └── presentationService.js            (API 호출 + Firestore)
│
└── App.jsx                                (라우팅 추가)

functions/
└── index.js                               (generatePresentation 함수 추가)
```

---

## 🗄️ Database 구조

### Firestore Collection: `presentations`

```javascript
{
  id: "pres_abc123",
  articleId: "article123",  // 원본 글 참조
  title: "발표 제목",
  authorName: "작성자",
  slideCount: 10,
  slides: [
    {
      id: 1,
      type: "title",  // title | content | question | closing
      title: "발표 제목",
      subtitle: "부제목",
      author: "작성자"
    },
    {
      id: 2,
      type: "content",
      title: "섹션 제목",
      keyPoints: [
        "핵심 포인트 1",
        "핵심 포인트 2",
        "핵심 포인트 3"
      ]
    },
    {
      id: 3,
      type: "question",
      title: "토의 질문",
      questions: [
        "질문 1",
        "질문 2"
      ]
    },
    {
      id: 10,
      type: "closing",
      title: "감사합니다",
      message: "마무리 메시지"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 슬라이드 타입별 구조

#### Type: title (제목 슬라이드)
```javascript
{
  id: 1,
  type: "title",
  title: "발표 제목",
  subtitle: "부제목 또는 한 줄 요약",
  author: "작성자"
}
```

#### Type: content (내용 슬라이드)
```javascript
{
  id: 2,
  type: "content",
  title: "섹션 제목",
  keyPoints: [
    "핵심 포인트 1 (20자 이내)",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ]
}
```

#### Type: question (질문 슬라이드)
```javascript
{
  id: 3,
  type: "question",
  title: "토의 질문",
  questions: [
    "질문 1 (article.questions에서 가져옴)",
    "질문 2"
  ]
}
```

#### Type: closing (마무리 슬라이드)
```javascript
{
  id: 4,
  type: "closing",
  title: "감사합니다",
  message: "마무리 메시지 (선택사항)"
}
```

---

## 🎨 미니멀 디자인 가이드

### 슬라이드 레이아웃
- **비율**: 16:9 (표준 프레젠테이션)
- **배경**: 흰색 (#ffffff)
- **여백**: 상하좌우 충분한 패딩 (60px 80px)
- **폰트**: 'Noto Sans KR', sans-serif

### 타이포그래피
- **제목**: 3rem, 진한 회색 (#1e293b), 700 weight
- **부제목**: 1.5rem, 중간 회색 (#64748b), 400 weight
- **키포인트**: 1.5rem, 진한 회색 (#475569), 불릿 포인트
- **작성자**: 1.2rem, 연한 회색 (#94a3b8)

### 색상 팔레트
- **Primary**: var(--primary-color) - 강조 요소
- **Text Primary**: #1e293b - 제목
- **Text Secondary**: #64748b - 부제목
- **Text Tertiary**: #94a3b8 - 메타 정보
- **Background**: #ffffff - 배경
- **Background Light**: #f8fafc - 질문 박스

### 구성 요소
- **불릿 포인트**: 큰 둥근 점 (•), primary color
- **구분선**: 3px solid, primary color
- **박스**: 연한 배경 + 좌측 테두리 강조

---

## 🤖 AI 프롬프트 설계

### Cloud Function: `generatePresentation`

#### 입력 형식
```javascript
{
  articleId: "article123",
  slideCount: 10
}
```

#### AI 프롬프트 구조

```
[프레젠테이션 생성 전문가]
당신은 교육 정책 전문 발표자료 제작자입니다.
주어진 글을 분석하여 ${slideCount}장의 인포그래픽 슬라이드를 생성하세요.

[원본 글]
제목: ${article.title}
${article.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}

[토의 질문]
${article.questions?.map((q, i) => `Q${i+1}. ${q.text}`).join('\n') || ''}

[중요 지침]
1. 줄글을 그대로 옮기지 마세요
2. 핵심 맥락만 추출하여 키워드/짧은 문구로 변환
3. 각 슬라이드는 3-5개의 키포인트만 포함
4. 토의 질문은 기존 questions 재활용
5. 총 ${slideCount}장으로 구성

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
    "author": "작성자"
  },
  {
    "type": "content",
    "title": "섹션 제목",
    "keyPoints": [
      "핵심 포인트 1 (짧게)",
      "핵심 포인트 2 (짧게)",
      "핵심 포인트 3 (짧게)"
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
]
```

#### 출력 형식
```javascript
{
  slides: [
    { id: 1, type: "title", title: "...", subtitle: "...", author: "..." },
    { id: 2, type: "content", title: "...", keyPoints: ["...", "..."] },
    ...
  ]
}
```

---

## 🔌 API & 서비스

### presentationService.js

#### 주요 함수

```javascript
// AI로 프레젠테이션 생성
generatePresentation(articleId: string, slideCount: number): Promise<{slides: Array}>

// Firestore에 저장
savePresentation(presentationData: Object): Promise<string>

// 프레젠테이션 조회
getPresentation(presentationId: string): Promise<Object>

// 글에 연결된 프레젠테이션 목록
getPresentationsByArticle(articleId: string): Promise<Array>

// 프레젠테이션 업데이트
updatePresentation(presentationId: string, updates: Object): Promise<boolean>

// 프레젠테이션 삭제
deletePresentation(presentationId: string): Promise<boolean>

// 슬라이드를 이미지로 다운로드
downloadSlideAsImage(slideElement: HTMLElement, fileName: string): Promise<boolean>

// 모든 슬라이드를 ZIP으로 다운로드
downloadAllSlidesAsZip(slideElements: Array<HTMLElement>, title: string): Promise<boolean>
```

---

## 🚀 라우팅 구조

### App.jsx 추가 라우트

```javascript
import PresentationPage from './pages/PresentationPage'
import PresentationEditorPage from './pages/PresentationEditorPage'
import PresentationViewerPage from './pages/PresentationViewerPage'

<Route path="presentation" element={<PresentationPage />} />
<Route path="presentation/:id/edit" element={<PresentationEditorPage />} />
<Route path="presentation/:id/present" element={<PresentationViewerPage />} />
```

### Sidebar.jsx 추가 네비게이션

```javascript
import { Presentation } from 'lucide-react'

<NavLink to="/presentation">
  <Presentation size={20} />
  <span>발표자료 만들기</span>
</NavLink>
```

---

## 📦 필요 라이브러리

### 설치 명령

```bash
cd frontend
npm install html2canvas jszip
```

### package.json

```json
"dependencies": {
  "html2canvas": "^1.4.1",
  "jszip": "^3.10.1"
}
```

---

## 🔄 구현 순서

### Phase 1: 기본 구조
1. PresentationPage.jsx 생성 (글 목록 표시)
2. presentationService.js 생성 (기본 CRUD)
3. Firestore 컬렉션 생성
4. 라이브러리 설치 (html2canvas, jszip)

### Phase 2: AI 생성
1. functions/index.js에 generatePresentation 함수 추가
2. AI 프롬프트 작성 및 최적화
3. 생성 테스트

### Phase 3: 슬라이드 렌더링
1. PresentationSlide.jsx 컴포넌트 생성
2. 슬라이드 타입별 레이아웃 구현
3. CSS 미니멀 디자인 적용

### Phase 4: 편집 기능
1. PresentationEditorPage.jsx 생성
2. SlidePreview.jsx (편집 가능)
3. 자동 저장 기능

### Phase 5: 프레젠테이션 모드
1. PresentationViewerPage.jsx 생성
2. 전체화면 API 적용
3. 키보드 네비게이션 (← →)

### Phase 6: 다운로드
1. html2canvas 통합
2. 단일 슬라이드 다운로드
3. 전체 슬라이드 ZIP 다운로드

### Phase 7: 라우팅 및 네비게이션
1. App.jsx 라우트 추가
2. Sidebar.jsx 링크 추가
3. 전체 흐름 테스트

---

## ✅ 핵심 차별점

1. **줄글 → 키워드 변환**: AI가 핵심만 추출
2. **인포그래픽 중심**: 시각적으로 깔끔한 슬라이드
3. **토의 질문 자동 포함**: 기존 질문 재활용
4. **편집 가능**: 사용자 맞춤 수정
5. **이중 활용**: 다운로드 + 웹 프레젠테이션
6. **미니멀 디자인**: 텍스트 중심, 심플한 레이아웃
7. **Firestore 저장**: 언제든 재편집 가능

---

## 📝 주의사항

1. **줄글 금지**: AI가 반드시 키워드/짧은 문구로 변환해야 함
2. **슬라이드 분량 조절**: 너무 많은 내용을 한 슬라이드에 담지 않기
3. **일관성**: 모든 슬라이드가 동일한 디자인 스타일 유지
4. **반응형**: 16:9 비율 유지하며 다양한 화면 크기 대응
5. **성능**: html2canvas 변환 시 로딩 표시 필수

---

## 🎯 목표

교사들이 작성한 정책 제안 글을 손쉽게 발표자료로 변환하여, 온라인 미팅이나 발표 시 효과적으로 활용할 수 있도록 지원하는 것.

---

**작성일**: 2025-12-30
**버전**: 1.0
**작성자**: Claude Code
