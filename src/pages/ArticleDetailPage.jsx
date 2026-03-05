import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Lock, Calendar, User, MessageSquare, ChevronDown, ChevronUp, Send, Loader2, Trash2, FileText } from 'lucide-react'
import { getArticle, getComments, addComment, verifyPassword, deleteArticle } from '../services/articleService'
import { downloadAsHwpx } from '../utils/hwpxExport'
import './ArticleDetailPage.css'

function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showSummaryCard, setShowSummaryCard] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState('edit') // 'edit' or 'delete'
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [newComment, setNewComment] = useState({ author: '', content: '' })
  const [comments, setComments] = useState([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    loadArticle()
    loadComments()
  }, [id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const data = await getArticle(id)
      if (data) {
        setArticle(data)
      } else {
        setError('글을 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error('글 로딩 오류:', err)
      setError('글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const data = await getComments(id)
      setComments(data)
    } catch (err) {
      console.error('댓글 로딩 오류:', err)
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

  const handleEdit = () => {
    setPasswordAction('edit')
    setShowPasswordModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handleDelete = () => {
    if (!window.confirm('정말로 이 글을 삭제하시겠습니까?')) return
    setPasswordAction('delete')
    setShowPasswordModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handlePasswordSubmit = async () => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.')
      return
    }

    const isValid = await verifyPassword(id, password)
    if (!isValid) {
      setPasswordError('비밀번호가 일치하지 않습니다.')
      return
    }

    setShowPasswordModal(false)

    if (passwordAction === 'delete') {
      try {
        await deleteArticle(id)
        alert('글이 삭제되었습니다.')
        navigate('/')
      } catch (err) {
        console.error('삭제 오류:', err)
        alert('글 삭제에 실패했습니다.')
      }
    } else {
      // 편집 기능은 추후 구현
      alert('편집 기능은 준비 중입니다.')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.author.trim() || !newComment.content.trim()) return

    setIsSubmittingComment(true)
    try {
      await addComment(id, newComment.author.trim(), newComment.content.trim())
      setNewComment({ author: '', content: '' })
      await loadComments()
    } catch (err) {
      console.error('댓글 등록 오류:', err)
      alert('댓글 등록에 실패했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDownloadHwpx = async () => {
    if (!article) return
    try {
      await downloadAsHwpx(article)
    } catch (err) {
      console.error('HWPX 다운로드 오류:', err)
      alert('다운로드에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="loading-state">
          <Loader2 size={32} className="spinner-icon" />
          <p>글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="article-detail-page">
        <div className="error-state">
          <p>{error || '글을 찾을 수 없습니다.'}</p>
          <Link to="/" className="btn btn-primary">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 질문을 섹션별로 그룹화
  const groupedQuestions = (article.questions || []).reduce((acc, q) => {
    const section = q.sectionId || 1
    if (!acc[section]) acc[section] = []
    acc[section].push(q)
    return acc
  }, {})

  let questionNumber = 0

  return (
    <div className="article-detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          목록으로
        </Link>
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={handleDownloadHwpx}>
            <Download size={18} />
            다운로드
          </button>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Lock size={18} />
            수정
          </button>
          <button className="btn btn-secondary" onClick={handleDelete}>
            <Trash2 size={18} />
            삭제
          </button>
        </div>
      </div>

      <article className="article-detail">
        <header className="article-header">
          <span className="article-category">{article.category || '기타'}</span>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="meta-item">
              <User size={16} />
              {article.authorName}
            </span>
            <span className="meta-item">
              <Calendar size={16} />
              {formatDate(article.createdAt)}
            </span>
          </div>
        </header>

        <div className="article-body">
          {article.sections?.map((section) => (
            <section key={section.id} className="article-section">
              <h2 className="section-title">{section.title}</h2>
              <div className="section-content">{section.content}</div>

              {groupedQuestions[section.id] && groupedQuestions[section.id].length > 0 && (
                <div className="section-questions">
                  <div className="questions-header">
                    <MessageSquare size={18} />
                    <span>토의 질문</span>
                  </div>
                  {groupedQuestions[section.id].map((q) => {
                    questionNumber++
                    return (
                      <div key={q.id} className="question-item">
                        Q{questionNumber}. {q.text}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        {article.facilitatorGuide && (
          <div className="facilitator-guide-section">
            <button
              className="guide-toggle-btn"
              onClick={() => setShowGuide(!showGuide)}
            >
              📋 진행자 가이드
              {showGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showGuide && (
              <div className="guide-content">
                <pre>{article.facilitatorGuide}</pre>
              </div>
            )}
          </div>
        )}

        {article.summaryCard && (
          <div className="summary-card-section">
            <button
              className="card-toggle-btn"
              onClick={() => setShowSummaryCard(!showSummaryCard)}
            >
              <FileText size={18} />
              발제 요약 카드
              {showSummaryCard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showSummaryCard && (
              <div className="summary-card-content">
                <div className="summary-card-detail">
                  {article.summaryCard.oneLiner && (
                    <div className="card-item">
                      <h4 className="card-item-title">한 줄 요약</h4>
                      <p className="card-item-text">{article.summaryCard.oneLiner}</p>
                    </div>
                  )}

                  {article.summaryCard.keyPoints && article.summaryCard.keyPoints.length > 0 && (
                    <div className="card-item">
                      <h4 className="card-item-title">핵심 포인트</h4>
                      <ul className="card-item-list">
                        {article.summaryCard.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {article.summaryCard.relatedLaws && article.summaryCard.relatedLaws.length > 0 && (
                    <div className="card-item">
                      <h4 className="card-item-title">관련 법령</h4>
                      <ul className="card-item-list laws">
                        {article.summaryCard.relatedLaws.map((law, idx) => (
                          <li key={idx}>{law}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {article.summaryCard.discussionQuestions && article.summaryCard.discussionQuestions.length > 0 && (
                    <div className="card-item">
                      <h4 className="card-item-title">토의 질문</h4>
                      <ol className="card-item-list numbered">
                        {article.summaryCard.discussionQuestions.map((q, idx) => (
                          <li key={idx}>{typeof q === 'string' ? q : q.text}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      <section className="comments-section">
        <h3 className="comments-title">
          <MessageSquare size={20} />
          댓글 ({comments.length})
        </h3>

        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">아직 댓글이 없습니다.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <div className="comment-form-header">댓글 작성</div>
          <div className="comment-form-row">
            <input
              type="text"
              placeholder="이름"
              value={newComment.author}
              onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
              className="comment-author-input"
              required
            />
          </div>
          <div className="comment-form-row">
            <textarea
              placeholder="댓글 내용을 입력하세요..."
              value={newComment.content}
              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
              className="comment-content-input"
              rows={3}
              required
            />
          </div>
          <div className="comment-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmittingComment}>
              {isSubmittingComment ? <Loader2 size={16} className="spinner-icon" /> : <Send size={16} />}
              {isSubmittingComment ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </form>
      </section>

      {/* 비밀번호 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{passwordAction === 'delete' ? '글 삭제 권한 확인' : '글 수정 권한 확인'}</h3>
            <p>비밀번호를 입력해주세요.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modal-input"
              placeholder="비밀번호"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            {passwordError && <p className="password-error">{passwordError}</p>}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleDetailPage
