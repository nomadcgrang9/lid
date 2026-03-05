import { Smartphone } from 'lucide-react'
import './FirstVisitInstallPrompt.css'

function FirstVisitInstallPrompt({ isOpen, onInstall, onDismiss }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content first-visit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <Smartphone size={48} />
        </div>

        <h2 className="modal-title">
          제도분과 홈페이지를<br />
          앱으로 설치해보세요
        </h2>

        <ul className="benefits-list">
          <li>홈 화면에서 바로 접속되고</li>
          <li>앱으로도 한번에 실행되요</li>
          <li>일정 바뀔 때 알림도 보내드려요 (준비 중)</li>
        </ul>

        <button className="primary-button" onClick={onInstall}>
          앱으로 설치하기
          <span className="arrow">→</span>
        </button>

        <button className="secondary-button" onClick={onDismiss}>
          나중에 할게요
        </button>
      </div>
    </div>
  )
}

export default FirstVisitInstallPrompt
