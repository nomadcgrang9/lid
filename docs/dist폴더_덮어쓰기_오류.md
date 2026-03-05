# dist 폴더 덮어쓰기 오류 해결 가이드

## 📋 문제 증상

### 발생 현상
1. `npm run build` 실행 시 멈춤
   ```
   ✓ 1780 modules transformed.
   [여기서 멈춤 - 진행 안 됨]
   ```

2. `dist` 폴더 확인 시 CSV 파일만 존재
   ```
   dist/
   ├── 회원데이터_2025.csv
   └── 회원등록_템플릿.csv
   (index.html, assets 폴더 등 없음)
   ```

3. Firebase 배포 시도
   ```
   found 2 files in frontend/dist  ← CSV 2개만!
   Deploy complete!  ← 배포는 성공하지만 사이트 작동 안 함
   ```

---

## 🔍 근본 원인

### 1. VitePWA 플러그인의 동작 방식

VitePWA는 빌드 시 `dist` 폴더의 상태를 검사합니다:

```
dist 폴더 상태 확인
  ↓
이미 파일이 있나? (CSV만 있음)
  ↓
"이상한데? 빌드된 파일인지 아닌지 모르겠는데?"
  ↓
Service Worker 생성 중 혼란
  ↓
빌드 멈춤 (Silent fail)
```

### 2. CSV 파일 자동 복사 메커니즘

**Vite의 정상 동작**:
```
빌드 시작
  ↓
1. public/ 폴더의 모든 파일을 dist/로 복사
   ├── picture/
   ├── vite.svg
   ├── 회원데이터_2025.csv      ← 자동 복사
   └── 회원등록_템플릿.csv       ← 자동 복사
  ↓
2. React 앱 빌드 (index.html, assets/)
  ↓
3. VitePWA Service Worker 생성
```

**문제 시나리오**:
```
초기: dist에 CSV만 있음 (이전 빌드 잔여물)
  ↓
빌드 시도
  ↓
VitePWA: "dist에 이미 파일 있네? 뭐지?"
  ↓
멈춤 ❌
```

### 3. 사용자가 경험한 혼란

```
사용자: "dist에서 CSV 지웠는데..."
  ↓
빌드 실행
  ↓
빌드 성공 (CSV가 public에서 다시 복사됨)
  ↓
사용자: "어? CSV가 다시 생겼네? 내가 안 지운건가?"
```

**진실**:
- ✅ 사용자가 dist에서 CSV 지운 것 맞음
- ✅ Vite가 public에서 자동으로 다시 복사한 것
- ❌ CSV가 "자동 생성"된 것이 아님

---

## ✅ 해결 방법

### 최종 해결책: `emptyOutDir: true` 추가

**파일**: `c:\PRODUCT\LID\frontend\vite.config.js`

```javascript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* ... */ })
  ],
  build: {
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    emptyOutDir: true  // ← 이 한 줄 추가!
  }
})
```

### 효과

```
빌드 시작
  ↓
emptyOutDir: true 실행
  ↓
dist 폴더 완전히 삭제 및 재생성
  ↓
깨끗한 빈 폴더 상태
  ↓
VitePWA: "비어있네! 정상!"
  ↓
빌드 진행
  ↓
1. public 파일 복사 (CSV 포함)
2. React 앱 빌드
3. Service Worker 생성
  ↓
성공 ✅
```

---

## 🎯 빌드 및 배포 절차

### 1. 빌드

```bash
cd c:\PRODUCT\LID\frontend
npm run build
```

**예상 결과**:
```
✓ 1780 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 7-8s

PWA v1.2.0
files generated
  dist/sw.js
  dist/workbox-*.js
```

### 2. dist 폴더 확인

```bash
ls -la dist/
```

**정상 출력**:
```
drwxr-xr-x assets/                ← JS/CSS
-rw-r--r-- index.html             ← 메인 HTML ✅
-rw-r--r-- manifest.webmanifest   ← PWA
drwxr-xr-x picture/               ← 이미지
-rw-r--r-- registerSW.js          ← PWA 등록
-rw-r--r-- sw.js                  ← Service Worker ✅
-rw-r--r-- workbox-*.js           ← Workbox
-rw-r--r-- 회원데이터_2025.csv     ← public에서 복사 (정상)
-rw-r--r-- 회원등록_템플릿.csv      ← public에서 복사 (정상)
```

### 3. Firebase 배포

```bash
cd c:\PRODUCT\LID
firebase deploy --only hosting
```

**예상 결과**:
```
found 13 files in frontend/dist  ← 13개 파일 (CSV 포함)
✓ Deploy complete!
Hosting URL: https://lid-publishing-helper.web.app
```

---

## ⚠️ 문제 재발 시 체크리스트

### 증상: 빌드가 멈춤

1. **vite.config.js 확인**
   ```javascript
   build: {
     emptyOutDir: true  // ← 이게 있는지 확인
   }
   ```

2. **dist 폴더 수동 삭제 후 재시도**
   ```bash
   cd frontend
   rm -rf dist
   npm run build
   ```

3. **개발 서버 종료 확인**
   - 백그라운드에서 `npm run dev`가 실행 중이면 빌드 충돌 가능
   ```bash
   # Windows
   taskkill /F /IM node.exe

   # Linux/Mac
   killall node
   ```

### 증상: dist에 CSV만 있음

**원인**: `emptyOutDir: true`가 없어서 이전 빌드 잔여물 남음

**해결**:
1. vite.config.js에 `emptyOutDir: true` 추가
2. dist 폴더 삭제 후 재빌드

### 증상: 배포는 성공하는데 사이트 작동 안 함

**확인 사항**:
```bash
ls dist/index.html  # index.html이 있는지 확인
```

- index.html 없음 → 빌드 실패 (위 체크리스트 참고)
- index.html 있음 → Firebase 캐시 문제 (브라우저 캐시 삭제)

---

## 📚 기술적 배경

### public 폴더의 역할

Vite는 `public/` 폴더의 파일들을 **있는 그대로** `dist/`로 복사합니다:

```
frontend/
├── public/
│   ├── picture/
│   ├── vite.svg
│   ├── 회원데이터_2025.csv      ← 원본
│   └── 회원등록_템플릿.csv       ← 원본
│
└── dist/ (빌드 후)
    ├── picture/
    ├── vite.svg
    ├── 회원데이터_2025.csv      ← 복사본
    └── 회원등록_템플릿.csv       ← 복사본
```

**이것은 정상 동작입니다!**

### CSV 파일 용도

- **회원데이터_2025.csv**: 실제 회원 데이터 (테스트용?)
- **회원등록_템플릿.csv**: 템플릿 파일

사용자가 웹에서 `/회원등록_템플릿.csv`로 접근하여 다운로드 가능하도록 하기 위함.

**삭제 여부**:
- 필요하면 유지 ✅ (빌드에 영향 없음)
- 불필요하면 public 폴더에서 삭제

---

## 🔧 추가 최적화 (선택사항)

### 1. 빌드 경고 해결

빌드 시 다음 경고가 나타날 수 있습니다:
```
(!) Some chunks are larger than 500 kB after minification.
```

**해결** (선택사항):
```javascript
build: {
  sourcemap: false,
  minify: 'terser',
  target: 'esnext',
  emptyOutDir: true,
  rollupOptions: {  // ← 추가
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom', 'react-router-dom'],
        'firebase': ['firebase/app', 'firebase/firestore'],
      }
    }
  }
}
```

### 2. 빌드 속도 개선

```javascript
build: {
  sourcemap: false,
  minify: 'esbuild',  // terser보다 빠름 (하지만 VitePWA와 충돌 가능)
  target: 'esnext',
  emptyOutDir: true
}
```

**주의**: `minify: 'esbuild'`는 일부 환경에서 VitePWA와 충돌할 수 있음. 문제 발생 시 `terser` 사용.

---

## 📝 요약

### 핵심 해결책
```javascript
// vite.config.js
build: {
  emptyOutDir: true  // ← 이것만 추가!
}
```

### 이유
- VitePWA가 dist 폴더 상태에 민감함
- 이전 빌드 잔여물(CSV)이 있으면 혼란
- 매번 깨끗하게 시작하면 문제 없음

### CSV 파일은 정상
- public 폴더에서 자동 복사되는 것
- 빌드 실패 원인 아님
- 삭제할 필요 없음 (필요하면 public에서 삭제)

### 빌드 성공 확인
```bash
npm run build
# ✓ built in 7-8s 확인
# dist/index.html 존재 확인
```

### 배포 성공 확인
```bash
firebase deploy --only hosting
# found 13 files 확인 (2개만 나오면 문제)
```

---

**작성일**: 2025-12-29
**최종 수정**: 2025-12-29
**해결 시간**: 약 2시간 (문제 파악 및 근본 원인 분석)
