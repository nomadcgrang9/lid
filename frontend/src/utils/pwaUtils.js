/**
 * PWA 설치 관련 유틸리티 함수
 */

/**
 * 카카오톡 브라우저인지 확인
 */
export function isKakaoTalkBrowser() {
  return /kakaotalk/i.test(navigator.userAgent)
}

/**
 * iOS 기기인지 확인
 */
export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Android 기기인지 확인
 */
export function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

/**
 * 모바일 기기인지 확인
 */
export function isMobile() {
  return isIOS() || isAndroid() || window.innerWidth <= 768
}

/**
 * 진짜 최초 방문인지 확인
 * localStorage와 sessionStorage 모두 체크
 */
export function isTrueFirstVisit() {
  const hasVisited = localStorage.getItem('hasVisited')
  const currentSession = sessionStorage.getItem('currentSession')
  return hasVisited === null && currentSession === null
}

/**
 * 방문 기록 저장
 */
export function markAsVisited() {
  localStorage.setItem('hasVisited', 'true')
  sessionStorage.setItem('currentSession', 'true')
}

/**
 * PWA가 이미 설치되었는지 확인
 */
export function isPWAInstalled() {
  // Standalone 모드로 실행 중인지 확인
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

/**
 * 외부 브라우저로 열기 시도
 * @param {string} url - 열고자 하는 URL
 * @returns {Promise<string>} 'success' 또는 'fallback_needed'
 */
export function openInExternalBrowser(url) {
  return new Promise((resolve, reject) => {
    const isIOSDevice = isIOS()

    if (isIOSDevice) {
      // iOS: Safari로 열기 (URL scheme은 검색용이므로 사용 안 함)
      // 대신 클립보드 복사 후 Safari 열기
      navigator.clipboard.writeText(url)
        .then(() => {
          // Safari 열기 (빈 페이지)
          window.location.href = 'x-web-search://'
          resolve('clipboard_success')
        })
        .catch(() => {
          // 클립보드 권한 거부됨
          reject('clipboard_denied')
        })
    } else if (isAndroid()) {
      // Android: Intent로 Chrome/Samsung Internet 열기
      const cleanUrl = url.replace(/^https?:\/\//, '')
      const intent = `intent://${cleanUrl}#Intent;` +
        `scheme=https;` +
        `action=android.intent.action.VIEW;` +
        `category=android.intent.category.BROWSABLE;` +
        `end;`

      window.location.href = intent

      // 2초 후 확인 (페이지가 숨겨졌으면 성공)
      setTimeout(() => {
        if (document.hidden) {
          resolve('success')
        } else {
          reject('fallback_needed')
        }
      }, 2000)
    } else {
      reject('not_mobile')
    }
  })
}

/**
 * 현재 URL 가져오기
 */
export function getCurrentURL() {
  return window.location.href
}
