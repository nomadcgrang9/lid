import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ResetPage.css'

function ResetPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // localStorage와 sessionStorage 모두 초기화
    localStorage.clear()
    sessionStorage.clear()

    // 3초 후 홈으로 이동
    const timer = setTimeout(() => {
      navigate('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="reset-page">
      <div className="reset-container">
        <div className="reset-icon">🔄</div>
        <h1 className="reset-title">초기화 완료!</h1>
        <p className="reset-description">
          브라우저 저장 데이터가 모두 삭제되었습니다.
        </p>
        <p className="reset-redirect">
          3초 후 홈으로 이동합니다...
        </p>
        <button
          className="reset-button"
          onClick={() => navigate('/')}
        >
          지금 바로 이동하기
        </button>
      </div>
    </div>
  )
}

export default ResetPage
