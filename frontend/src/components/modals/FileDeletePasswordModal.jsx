import { useState } from 'react'
import { Trash2, Loader2, X } from 'lucide-react'
import { verifyFileDeletePassword } from '../../services/fileManagementService'
import './FileDeletePasswordModal.css'

function FileDeletePasswordModal({ isOpen, onClose, onConfirm, fileCount }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const isValid = await verifyFileDeletePassword(password)
      if (isValid) {
        setPassword('')
        setError('')
        onConfirm()
      } else {
        setError('비밀번호가 일치하지 않습니다.')
        setPassword('')
      }
    } catch (error) {
      setError('인증 중 오류가 발생했습니다.')
      console.error('File delete password verification error:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay file-delete-modal-overlay" onClick={handleClose}>
      <div className="modal-content file-delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="modal-icon delete-icon">
          <Trash2 size={36} />
        </div>

        <h2 className="modal-title">파일 삭제 확인</h2>
        <p className="modal-description">
          선택한 <strong>{fileCount}개</strong> 파일을 삭제합니다.<br />
          삭제 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="delete-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="삭제 비밀번호 입력"
            className="delete-input"
            autoFocus
            disabled={isVerifying}
          />

          {error && <p className="delete-error">{error}</p>}

          <div className="delete-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isVerifying}
            >
              취소
            </button>
            <button
              type="submit"
              className="confirm-delete-button"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  확인 중...
                </>
              ) : (
                '삭제하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FileDeletePasswordModal
