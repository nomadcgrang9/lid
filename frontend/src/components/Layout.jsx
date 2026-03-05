import { useState, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, X, Download, Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'
import EntrancePasswordModal from './modals/EntrancePasswordModal'
import FirstVisitInstallPrompt from './modals/FirstVisitInstallPrompt'
import ManualBrowserGuide from './modals/ManualBrowserGuide'
import IOSInstallGuide from './modals/IOSInstallGuide'
import {
  isKakaoTalkBrowser,
  isIOS,
  isAndroid,
  isMobile,
  isTrueFirstVisit,
  markAsVisited,
  isPWAInstalled,
  openInExternalBrowser,
  getCurrentURL
} from '../utils/pwaUtils'
import { getEntrancePassword } from '../services/memberService'
import './Layout.css'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // 입장 비밀번호 상태
  const [entrancePasswordEnabled, setEntrancePasswordEnabled] = useState(false)
  const [isEntranceAuthenticated, setIsEntranceAuthenticated] = useState(false)
  const [showEntranceModal, setShowEntranceModal] = useState(false)
  const [isCheckingEntrance, setIsCheckingEntrance] = useState(true)

  // 모달 상태 관리
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false)
  const [showManualGuide, setShowManualGuide] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [clipboardSuccess, setClipboardSuccess] = useState(false)
  const [platform, setPlatform] = useState('') // 'android' | 'ios' | ''

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // 입장 비밀번호 확인 (최우선 실행)
  useEffect(() => {
    const checkEntrancePassword = async () => {
      try {
        const settings = await getEntrancePassword()
        setEntrancePasswordEnabled(settings.enabled)

        if (settings.enabled) {
          // localStorage 확인
          const authenticated = localStorage.getItem('entranceAuthenticated')
          if (authenticated === 'true') {
            setIsEntranceAuthenticated(true)
          } else {
            setShowEntranceModal(true)
          }
        } else {
          // 비활성화 상태면 자동 인증 처리
          setIsEntranceAuthenticated(true)
        }
      } catch (error) {
        console.error('입장 비밀번호 확인 오류:', error)
        // 오류 시 안전하게 진입 허용 (fail-open)
        setIsEntranceAuthenticated(true)
      } finally {
        setIsCheckingEntrance(false)
      }
    }

    checkEntrancePassword()
  }, [])

  // 환경 감지 및 최초 방문 모달 표시
  useEffect(() => {
    // 입장 비밀번호 인증이 필요하면 PWA 모달 표시 안 함
    if (entrancePasswordEnabled && !isEntranceAuthenticated) {
      return
    }
    // PWA가 이미 설치되어 있으면 모달 표시 안 함
    if (isPWAInstalled()) {
      return
    }

    // 모바일이 아니면 모달 표시 안 함
    if (!isMobile()) {
      return
    }

    // 카카오톡 브라우저이고 최초 방문이면 모달 표시
    if (isKakaoTalkBrowser() && isTrueFirstVisit()) {
      setShowFirstVisitModal(true)

      // 플랫폼 감지
      if (isIOS()) {
        setPlatform('ios')
      } else if (isAndroid()) {
        setPlatform('android')
      }
    }
  }, [entrancePasswordEnabled, isEntranceAuthenticated])

  // 최초 방문 모달 - 설치하기 클릭
  const handleFirstVisitInstall = async () => {
    setShowFirstVisitModal(false)
    markAsVisited()

    if (platform === 'android') {
      // Android: Intent로 외부 브라우저 열기
      try {
        await openInExternalBrowser(getCurrentURL())
        // 성공 - 외부 브라우저로 이동됨
      } catch (error) {
        // 실패 - 수동 안내 모달 표시
        if (error === 'fallback_needed') {
          setShowManualGuide(true)
        }
      }
    } else if (platform === 'ios') {
      // iOS: 클립보드 복사 + Safari 열기
      try {
        const result = await openInExternalBrowser(getCurrentURL())
        if (result === 'clipboard_success') {
          setClipboardSuccess(true)
        }
        setShowIOSGuide(true)
      } catch (error) {
        // 클립보드 실패 - 수동 복사 필요
        if (error === 'clipboard_denied') {
          setClipboardSuccess(false)
          setShowIOSGuide(true)
        }
      }
    }
  }

  // 최초 방문 모달 - 나중에 할게요 클릭
  const handleFirstVisitDismiss = () => {
    setShowFirstVisitModal(false)
    markAsVisited()
  }

  // 입장 비밀번호 인증 성공 핸들러
  const handleEntranceAuthenticate = () => {
    localStorage.setItem('entranceAuthenticated', 'true')
    setIsEntranceAuthenticated(true)
    setShowEntranceModal(false)
  }

  // PWA 설치 프롬프트 이벤트 리스너
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // 브라우저 기본 설치 배너 차단
      e.preventDefault()

      // 이벤트 저장 (나중에 prompt() 호출용)
      setDeferredPrompt(e)

      // 모바일 환경 체크
      const isMobile = window.innerWidth <= 768
      if (isMobile) {
        setShowInstallButton(true)
      }
    }

    // 앱 설치 완료 이벤트 리스너
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
      console.log('PWA가 성공적으로 설치되었습니다')
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 클린업
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // PWA 설치 버튼 클릭 핸들러
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // 설치 프롬프트 표시
    deferredPrompt.prompt()

    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('사용자가 PWA 설치를 수락했습니다')
    } else {
      console.log('사용자가 PWA 설치를 거부했습니다')
    }

    // 사용된 프롬프트 초기화 (재사용 불가)
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  return (
    <div className="layout">
      <header className="header">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <Link to="/" className="header-logo">
          <span className="logo-text logo-z">Z</span>
          <span className="logo-text logo-bunka">분과</span>
        </Link>
        {showInstallButton && (
          <button
            className="install-btn"
            onClick={handleInstallClick}
            aria-label="앱 설치하기"
          >
            <Download size={20} />
            <span className="install-text">앱 설치</span>
          </button>
        )}
      </header>
      <div className="layout-body">
        {/* 모바일 오버레이 */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
        )}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="main-content">
          {isCheckingEntrance ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <Loader2 size={32} className="spinner-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#718096', fontSize: '0.95rem' }}>확인 중...</p>
            </div>
          ) : isEntranceAuthenticated ? (
            <Outlet />
          ) : null}
        </main>
      </div>

      {/* 입장 비밀번호 모달 (최우선) */}
      <EntrancePasswordModal
        isOpen={showEntranceModal}
        onAuthenticate={handleEntranceAuthenticate}
      />

      {/* PWA 설치 모달 (입장 인증 후에만 표시) */}
      <FirstVisitInstallPrompt
        isOpen={showFirstVisitModal}
        onInstall={handleFirstVisitInstall}
        onDismiss={handleFirstVisitDismiss}
      />

      <ManualBrowserGuide
        isOpen={showManualGuide}
        onDismiss={() => setShowManualGuide(false)}
      />

      <IOSInstallGuide
        isOpen={showIOSGuide}
        clipboardSuccess={clipboardSuccess}
        onDismiss={() => setShowIOSGuide(false)}
      />
    </div>
  )
}

export default Layout
