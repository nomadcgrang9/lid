import { MoreVertical, ExternalLink, Smartphone } from 'lucide-react'
import './ManualBrowserGuide.css'

function ManualBrowserGuide({ isOpen, onDismiss }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content manual-guide-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">자동으로 열리지 않나요?</h2>

        <p className="modal-description">
          카카오톡 브라우저에서는 앱 설치가<br />
          지원되지 않아요
        </p>

        <div className="guide-section">
          <h3 className="guide-title">
            <Smartphone size={20} />
            다른 브라우저로 열기
          </h3>

          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <MoreVertical size={18} className="step-icon" />
                <span>오른쪽 상단 [...] 메뉴 터치</span>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <ExternalLink size={18} className="step-icon" />
                <span>"다른 브라우저에서 열기" 선택</span>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <Smartphone size={18} className="step-icon" />
                <span>Chrome 또는 Samsung Internet 선택</span>
              </div>
            </div>
          </div>
        </div>

        <button className="primary-button" onClick={onDismiss}>
          알겠어요
        </button>
      </div>
    </div>
  )
}

export default ManualBrowserGuide
