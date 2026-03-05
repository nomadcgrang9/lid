import { useState } from 'react'
import { Lock, Video, ExternalLink, Loader2 } from 'lucide-react'
import { verifyZoomPassword } from '../services/memberService'
import './ZoomPage.css'

const ZOOM_ONEDRIVE_URL = 'https://1drv.ms/f/c/7b77903722d22f5c/IgBcL9IiN5B3IIB7SzoAAAAAAUGdEfUj5wlas0l58C9uX_E?e=M8blST'

function ZoomPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const isValid = await verifyZoomPassword(password)
      if (isValid) {
        setIsAuthenticated(true)
        setPasswordError('')
        // 인증 성공 시 원드라이브로 이동
        window.open(ZOOM_ONEDRIVE_URL, '_blank')
      } else {
        setPasswordError('비밀번호가 일치하지 않습니다.')
      }
    } catch (error) {
      setPasswordError('인증 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenLink = () => {
    window.open(ZOOM_ONEDRIVE_URL, '_blank')
  }

  // 비밀번호 인증 화면
  if (!isAuthenticated) {
    return (
      <div className="zoom-page">
        <div className="auth-container">
          <div className="auth-icon">
            <Video size={48} />
          </div>
          <h2>줌 미팅 다시보기</h2>
          <p>녹화 영상에 접근하려면 비밀번호를 입력해주세요.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="auth-input"
              autoFocus
            />
            {passwordError && <p className="auth-error">{passwordError}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="spinner-icon" /> : <Lock size={18} />}
              {isLoading ? '확인 중...' : '확인'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 인증 완료 후 화면
  return (
    <div className="zoom-page">
      <div className="auth-container success">
        <div className="auth-icon success">
          <Video size={48} />
        </div>
        <h2>인증 완료</h2>
        <p>줌 미팅 녹화 영상 폴더가 새 탭에서 열렸습니다.</p>
        <p className="sub-text">새 탭이 열리지 않았다면 아래 버튼을 클릭하세요.</p>

        <button className="btn btn-primary btn-full" onClick={handleOpenLink}>
          <ExternalLink size={18} />
          원드라이브 폴더 열기
        </button>
      </div>
    </div>
  )
}

export default ZoomPage
