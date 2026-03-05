import { useState, useEffect } from 'react'
import { X, Copy, Check, Loader2, Video } from 'lucide-react'
import { getLandingSettings } from '../services/memberService'
import './LandingPage.css'

function LandingPage() {
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    introLine1: '짜임새 있는 기획과 새로운 네트워크로',
    introLine2: '현장을 바꾸는 사람들,',
    introLine3: '제도혁신 SINCE 2022',
    accountBank: '카카오뱅크',
    accountNumber: '79421308150',
    donationLink: '',
    landingImageUrl: '',
    zoomUrl: '',
    zoomPassword: ''
  })
  const [showZoomModal, setShowZoomModal] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getLandingSettings()
      setSettings(data)
    } catch (error) {
      console.error('랜딩페이지 설정 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(settings.accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDonation = () => {
    if (settings.donationLink) {
      window.open(settings.donationLink, '_blank')
    } else {
      alert('후원 링크가 아직 설정되지 않았습니다.')
    }
  }

  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-loading">
          <Loader2 size={32} className="spinner-icon" />
        </div>
      </div>
    )
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-image-wrapper">
          <img
            src={settings.landingImageUrl || "/picture/lidmember.png"}
            alt="제도혁신분과 구성원"
            className="landing-image"
          />
        </div>

        <div className="landing-text">
          <p className="landing-line">{settings.introLine1}</p>
          <p className="landing-line">{settings.introLine2}</p>
          <p className="landing-line">{settings.introLine3}</p>
        </div>

        <div className="landing-buttons">
          <button
            className="landing-btn account-btn"
            onClick={() => setShowAccountModal(true)}
          >
            회비계좌
          </button>
          <button
            className="landing-btn zoom-btn"
            onClick={() => setShowZoomModal(true)}
          >
            줌 미팅주소
          </button>
          <button
            className="landing-btn donation-btn"
            onClick={handleDonation}
          >
            후원하기
          </button>
        </div>
      </div>

      {/* 계좌 모달 */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowAccountModal(false)}
            >
              <X size={20} />
            </button>

            <h3 className="modal-title">회비 납부 계좌</h3>

            <div className="account-info">
              <p className="account-bank">{settings.accountBank}</p>
              <p className="account-number">{settings.accountNumber}</p>
            </div>

            <div className="modal-buttons">
              <button
                className="modal-btn copy-btn"
                onClick={handleCopyAccount}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '복사됨' : '복사하기'}
              </button>
              <button
                className="modal-btn close-btn"
                onClick={() => setShowAccountModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 줌 미팅 모달 */}
      {showZoomModal && (
        <div className="modal-overlay" onClick={() => setShowZoomModal(false)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginTop: '16px' }}>
              <Video size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              줌 미팅 정보
            </h3>

            <div className="account-info">
              <div className="info-group" style={{ marginBottom: '16px' }}>
                <p className="info-label" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>입장 링크</p>
                {settings.zoomUrl ? (
                  <a href={settings.zoomUrl} target="_blank" rel="noopener noreferrer" className="account-number" style={{ color: '#2563eb', textDecoration: 'none' }}>
                    바로가기
                  </a>
                ) : (
                  <p className="account-number" style={{ color: '#999' }}>(미설정)</p>
                )}
              </div>

              <div className="info-group">
                <p className="info-label" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>입장 비밀번호</p>
                <p className="account-number" style={{ color: '#666' }}>{settings.zoomPassword || '(미설정)'}</p>
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="modal-btn close-btn"
                onClick={() => setShowZoomModal(false)}
                style={{ width: '100%' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
