import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { verifyEntrancePassword } from '../../services/memberService'
import './EntrancePasswordModal.css'

function EntrancePasswordModal({ isOpen, onAuthenticate }) {
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
      const isValid = await verifyEntrancePassword(password)
      if (isValid) {
        setPassword('')
        onAuthenticate()
      } else {
        setError('비밀번호가 일치하지 않습니다.')
        setPassword('')
      }
    } catch (error) {
      setError('인증 중 오류가 발생했습니다.')
      console.error('Entrance password verification error:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="modal-overlay entrance-modal-overlay">
      <div className="modal-content entrance-modal-content">
        <div className="modal-icon">
          <Lock size={48} />
        </div>

        <h2 className="modal-title">입장 비밀번호</h2>
        <p className="modal-description">
          분과에서 안내받은<br />
          비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="entrance-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="entrance-input"
            autoFocus
            disabled={isVerifying}
          />

          {error && <p className="entrance-error">{error}</p>}

          <button
            type="submit"
            className="primary-button entrance-button"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                확인 중...
              </>
            ) : (
              '확인'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EntrancePasswordModal
