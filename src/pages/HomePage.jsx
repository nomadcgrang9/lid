import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Calendar, User, Loader2 } from 'lucide-react'
import { getArticles } from '../services/articleService'
import './HomePage.css'

function HomePage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await getArticles()
      setArticles(data)
    } catch (err) {
      console.error('글 목록 로딩 오류:', err)
      setError('글 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace('.', '')
  }

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-state">
          <Loader2 size={32} className="spinner-icon" />
          <p>글 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadArticles} className="btn btn-primary">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h2 className="page-title">작성된 글 목록</h2>
      </div>

      <div className="article-list">
        {articles.length === 0 ? (
          <div className="empty-state">
            <p>아직 작성된 글이 없습니다.</p>
            <Link to="/write" className="btn btn-primary">
              첫 글 작성하기
            </Link>
          </div>
        ) : (
          articles.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="article-card"
            >
              <div className="article-card-header">
                <span className="article-category">{article.category}</span>
              </div>
              <h3 className="article-title">{article.title}</h3>
              <div className="article-meta">
                <span className="meta-item">
                  <User size={14} />
                  {article.authorName}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  {formatDate(article.createdAt)}
                </span>
                <span className="meta-item">
                  <MessageSquare size={14} />
                  댓글 {article.commentCount || 0}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default HomePage
