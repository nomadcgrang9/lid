# LID (제도혁신분과 출판 도우미)

교육정책 관련 글쓰기 도우미 + 분과 관리 도구

- **배포 URL**: https://lid-publishing-helper.web.app
- **대상 사용자**: 약 20명 내외의 소규모 분과 회원
- **최종 업데이트**: 2025-12-30

---

## 빠른 시작

### 로컬 개발
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

### 배포
```bash
# 프론트엔드 빌드 및 배포
cd frontend && npm run build && cd ..
firebase deploy --only hosting

# Functions 배포
firebase deploy --only functions

# 전체 배포
cd frontend && npm run build && cd .. && firebase deploy
```

**중요**: `firebase deploy`는 프로젝트 루트에서 실행

---

## 프로젝트 구조

```
LID/
├── docs/                      # 📄 문서 폴더 (MD/TXT 파일)
├── scripts/                   # 유틸리티 스크립트
├── output/                    # 스크립트 출력
├── functions/                 # Cloud Functions (AI 처리)
├── frontend/                  # React 앱
└── README.md                  # 이 파일
```

---

## 주요 기능

1. **AI 기반 글쓰기**: 4단 구조 (사례 → 법령 → 문제 → 대안)
2. **진행자료 생성**: 토의 질문, 진행자 가이드, 발제 요약 카드
3. **일정 관리**: 년도별 일정 및 내용기록
4. **회비 관리**: 수입/지출 자동 계산
5. **인원 현황**: 엑셀 업로드 지원
6. **활동 사진**: 갤러리 기능

---

## 기술 스택

- Frontend: React 19 + Vite 5.4
- Backend: Firebase (Firestore, Storage, Cloud Functions)
- AI: Google Gemini 2.5 Pro
- Hosting: Firebase Hosting
- PWA: 모바일 앱 설치 지원

---


## 🔄 업데이트 로그

### 2025-12-30: 줌(Zoom) 기능 및 회비관리 UX 개선
1. **줌 미팅 기능 추가**
   - **User**: 홈 화면에 '줌 미팅주소' 버튼 및 정보 확인용 모달(URL 바로가기, 비밀번호) 추가
   - **Admin**: 관리자 페이지 > 랜딩페이지 설정에 줌 URL 및 비밀번호 관리 기능 추가
   - **UI**: 이모지 대신 아이콘(Video, X 등)을 활용한 담백하고 깔끔한 디자인 적용

2. **회비관리(지출내역) UI/UX 개선**
   - **테이블**: 불필요한 '참석자' 텍스트 열 삭제 → '영수증' 아이콘/개수 배지로 대체하여 가독성 확보
   - **입력 양식**: '참석자' 입력 필드 제거 및 그리드 최적화 (7개 → 6개 항목, 2열 x 3행 배치)
   - **용어 변경**: '장소' → '장소 또는 내역'으로 변경하여 식비 외 지출 내역도 자연스럽게 입력 가능하게 개선

3. **배포 안정화**
   - 중복된 State 초기화(Duplicate keys) 오류 수정
   - `dist` 폴더 클린 빌드 적용 및 프로덕션 배포 완료

---

## 주요 해결 이슈 (참고용)

### AI 프롬프트 경로 오류 (2025-12-30)
- 문제: Backend가 `settings/ai_prompts` 찾았으나 실제는 `app_settings/ai_prompts`
- 해결: functions/index.js:63 수정

### dist 빌드 멈춤 (2025-12-29)
- 문제: VitePWA가 잔여 파일로 인해 중단
- 해결: vite.config.js에 `emptyOutDir: true` 추가

---

## 문서

상세 문서는 [docs/](./docs/) 폴더 참조:
- 빌드 로그, 배포 가이드, 문제 해결 가이드 등

---

**관리자**: l30417305@gmail.com
