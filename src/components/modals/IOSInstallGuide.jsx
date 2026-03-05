import { Search, Share2, PlusSquare, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { getCurrentURL } from '../../utils/pwaUtils'
import './IOSInstallGuide.css'

function IOSInstallGuide({ isOpen, clipboardSuccess, onDismiss }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentURL())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content ios-guide-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Safari에서 앱 설치하기</h2>

        {clipboardSuccess ? (
          <div className="clipboard-status success">
            <Check size={20} />
            <span>주소가 복사되었어요</span>
          </div>
        ) : (
          <div className="clipboard-status fail">
            <Copy size={20} />
            <span>주소 복사가 필요해요</span>
            <button className="copy-url-button" onClick={handleCopyURL}>
              {copied ? '✓ 복사됨' : '📋 복사하기'}
            </button>
            <div className="current-url">
              {getCurrentURL()}
            </div>
          </div>
        )}

        <div className="ios-steps">
          <div className="ios-step">
            <div className="step-header">
              <Search size={24} className="step-icon-large" />
              <span className="step-label">Step 1</span>
            </div>
            <div className="step-description">
              상단 주소창 길게 터치<br />
              "붙여넣고 이동" 선택
            </div>
          </div>

          <div className="ios-step">
            <div className="step-header">
              <Share2 size={24} className="step-icon-large" />
              <span className="step-label">Step 2</span>
            </div>
            <div className="step-description">
              하단 공유 버튼 터치
            </div>
          </div>

          <div className="ios-step">
            <div className="step-header">
              <PlusSquare size={24} className="step-icon-large" />
              <span className="step-label">Step 3</span>
            </div>
            <div className="step-description">
              "홈 화면에 추가" 선택
            </div>
          </div>

          <div className="ios-step">
            <div className="step-header">
              <Check size={24} className="step-icon-large" />
              <span className="step-label">Step 4</span>
            </div>
            <div className="step-description">
              "추가" 버튼 터치
            </div>
          </div>
        </div>

        <button className="secondary-button" onClick={onDismiss}>
          나중에 할게요
        </button>
      </div>
    </div>
  )
}

export default IOSInstallGuide
