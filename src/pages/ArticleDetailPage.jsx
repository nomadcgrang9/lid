import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Lock, Save, X, Calendar, User, MessageSquare, ChevronDown, ChevronUp, Send, Loader2, Trash2, FileText } from 'lucide-react'
import { getArticle, getComments, addComment, verifyPassword, deleteArticle, updateArticle } from '../services/articleService'
import { downloadAsHwpx } from '../utils/hwpxExport'
import './ArticleDetailPage.css'

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}일 전`
  return `${Math.floor(diff / (86400 * 30))}달 전`
}

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function buildCommentTree(flat) {
  const byId = {}
  const roots = []
  flat.forEach(c => { byId[c.id] = { ...c, replies: [] } })
  flat.forEach(c => {
    if (c.parentId && byId[c.parentId]) byId[c.parentId].replies.push(byId[c.id])
    else roots.push(byId[c.id])
  })
  return roots
}

// ─── ParagraphComments ────────────────────────────────────────────────────────

function ParagraphComments({ paragraphKey, flatComments, savedName, onSaveName, onSubmitComment }) {
  const [collapsed, setCollapsed] = useState(false)
  const [name, setName] = useState(savedName || '')
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (savedName && !name) setName(savedName)
  }, [savedName])

  const tree = buildCommentTree(flatComments)
  const count = flatComments.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    const author = name.trim() || '익명'
    setSubmitting(true)
    try {
      await onSubmitComment(paragraphKey, author, content.trim(), null, 0)
      if (name.trim()) onSaveName(name.trim())
      setContent('')
    } catch {
      alert('댓글 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyContent.trim() || !replyTo) return
    const author = name.trim() || '익명'
    setSubmitting(true)
    try {
      await onSubmitComment(paragraphKey, author, replyContent.trim(), replyTo.id, (replyTo.depth || 0) + 1)
      if (name.trim()) onSaveName(name.trim())
      setReplyContent('')
      setReplyTo(null)
    } catch {
      alert('댓글 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleReply = (comment) => {
    setReplyTo(prev => prev?.id === comment.id ? null : { id: comment.id, author: comment.author, depth: comment.depth || 0 })
    setReplyContent('')
  }

  const renderComment = (comment, depth) => (
    <div key={comment.id} className={`pc-comment pc-depth-${Math.min(depth, 2)}`}>
      <div className="pc-avatar" style={{ backgroundColor: avatarColor(comment.author) }}>
        {(comment.author || '?')[0]}
      </div>
      <div className="pc-comment-right">
        <div className="pc-meta">
          <span className="pc-author">{comment.author}</span>
          <span className="pc-time">{relativeTime(comment.createdAt)}</span>
        </div>
        <p className="pc-text">{comment.content}</p>
        {depth < 2 && (
          <button className="pc-reply-btn" onClick={() => toggleReply(comment)}>
            {replyTo?.id === comment.id ? '취소' : '답글달기'}
          </button>
        )}
        {replyTo?.id === comment.id && (
          <form className="pc-inline-reply" onSubmit={handleReplySubmit}>
            <div className="pc-form-row">
              <textarea
                className="pc-textarea"
                placeholder={`@${comment.author}에게 답글...`}
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                rows={2}
                autoFocus
              />
              <button type="submit" className="pc-send-btn" disabled={submitting}>
                {submitting ? <Loader2 size={14} className="spinner-icon" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        )}
        {comment.replies?.map(r => renderComment(r, depth + 1))}
      </div>
    </div>
  )

  return (
    <div className="paragraph-comments">
      <div className="pc-bar">
        <button className="pc-add-btn" title={collapsed ? '댓글열기' : '댓글닫기'} onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <button className="pc-count-btn" title="댓글달기" onClick={() => setCollapsed(v => !v)}>
          <MessageSquare size={13} />
          {count}
        </button>
      </div>

      {!collapsed && (
        <div className="pc-panel">
          {tree.map(c => renderComment(c, 0))}

          <form className="pc-new-form" onSubmit={handleSubmit}>
            <input
              className="pc-name-input"
              placeholder="이름 (빈칸 = 익명)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="pc-form-row">
              <textarea
                className="pc-textarea"
                placeholder="댓글을 입력하세요..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={2}
              />
              <button type="submit" className="pc-send-btn" disabled={submitting || !content.trim()}>
                {submitting ? <Loader2 size={14} className="spinner-icon" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── ArticleDetailPage ────────────────────────────────────────────────────────

function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showSummaryCard, setShowSummaryCard] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState('edit')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [allComments, setAllComments] = useState([])
  const [savedName, setSavedName] = useState(() => localStorage.getItem('commentAuthorName') || '')

  const [isEditMode, setIsEditMode] = useState(false)
  const [editedArticle, setEditedArticle] = useState(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    loadArticle()
    loadComments()
  }, [id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const data = await getArticle(id)
      if (data) setArticle(data)
      else setError('글을 찾을 수 없습니다.')
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
      setAllComments(data)
    } catch (err) {
      console.error('댓글 로딩 오류:', err)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '')
  }

  const handleSaveName = (name) => {
    setSavedName(name)
    localStorage.setItem('commentAuthorName', name)
  }

  const handleParagraphCommentSubmit = async (paragraphKey, author, content, parentId, depth) => {
    await addComment(id, author, content, paragraphKey, parentId, depth)
    await loadComments()
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
    if (!password) { setPasswordError('비밀번호를 입력해주세요.'); return }
    const isValid = await verifyPassword(id, password)
    if (!isValid) { setPasswordError('비밀번호가 일치하지 않습니다.'); return }

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
      setEditedArticle({
        ...article,
        sections: (article.sections || []).map(s => ({ ...s })),
        questions: (article.questions || []).map(q => ({ ...q })),
      })
      setIsEditMode(true)
    }
  }

  const updateSectionField = (sectionId, field, value) => {
    setEditedArticle(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
    }))
  }

  const updateQuestionText = (questionId, value) => {
    setEditedArticle(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === questionId ? { ...q, text: value } : q)
    }))
  }

  // Bug fix: exclude undefined facilitatorGuide to prevent Firestore rejection
  const handleSaveEdit = async () => {
    setIsSavingEdit(true)
    try {
      const updateData = {
        title: editedArticle.title,
        sections: editedArticle.sections,
        questions: editedArticle.questions,
      }
      if (editedArticle.facilitatorGuide !== undefined) {
        updateData.facilitatorGuide = editedArticle.facilitatorGuide
      }
      await updateArticle(id, updateData)
      setArticle(prev => ({
        ...prev,
        title: editedArticle.title,
        sections: editedArticle.sections,
        questions: editedArticle.questions,
        ...(editedArticle.facilitatorGuide !== undefined && { facilitatorGuide: editedArticle.facilitatorGuide }),
      }))
      setIsEditMode(false)
      setEditedArticle(null)
    } catch (err) {
      console.error('수정 저장 오류:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditedArticle(null)
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
          <Link to="/" className="btn btn-primary">목록으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const activeArticle = isEditMode ? editedArticle : article

  const groupedQuestions = (activeArticle.questions || []).reduce((acc, q) => {
    const key = q.sectionId || 1
    if (!acc[key]) acc[key] = []
    acc[key].push(q)
    return acc
  }, {})

  // Group paragraph comments by key
  const commentsByParagraph = allComments.reduce((acc, c) => {
    if (!c.paragraphKey) return acc
    if (!acc[c.paragraphKey]) acc[c.paragraphKey] = []
    acc[c.paragraphKey].push(c)
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
          {isEditMode ? (
            <>
              <button className="btn btn-outline" onClick={handleCancelEdit}>
                <X size={18} />
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? <Loader2 size={18} className="spinner-icon" /> : <Save size={18} />}
                {isSavingEdit ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <article className={`article-detail${isEditMode ? ' edit-mode' : ''}`}>
        {isEditMode && (
          <div className="edit-banner">
            ✏️ 수정 모드 — 내용을 수정한 뒤 [저장]을 눌러주세요.
          </div>
        )}

        <header className="article-header">
          <span className="article-category">{activeArticle.category || '기타'}</span>
          {isEditMode ? (
            <input
              className="edit-input edit-title-input"
              value={editedArticle.title}
              onChange={(e) => setEditedArticle(prev => ({ ...prev, title: e.target.value }))}
            />
          ) : (
            <h1 className="article-title">{article.title}</h1>
          )}
          <div className="article-meta">
            <span className="meta-item"><User size={16} />{article.authorName}</span>
            <span className="meta-item"><Calendar size={16} />{formatDate(article.createdAt)}</span>
          </div>
        </header>

        <div className="article-body">
          {activeArticle.sections?.map((section) => (
            <section key={section.id} className="article-section">
              {isEditMode ? (
                <input
                  className="edit-input edit-section-title-input"
                  value={section.title}
                  onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
                />
              ) : (
                <h2 className="section-title">{section.title}</h2>
              )}

              {isEditMode ? (
                <textarea
                  className="edit-textarea"
                  value={section.content}
                  onChange={(e) => updateSectionField(section.id, 'content', e.target.value)}
                  rows={8}
                />
              ) : (
                <div className="section-paragraphs">
                  {(section.content || '').split(/\n\n+/).filter(p => p.trim()).map((para, idx) => {
                    const pKey = `s${section.id}_p${idx}`
                    return (
                      <div key={pKey} className="paragraph-block">
                        <p className="paragraph-text">{para}</p>
                        <ParagraphComments
                          paragraphKey={pKey}
                          flatComments={commentsByParagraph[pKey] || []}
                          savedName={savedName}
                          onSaveName={handleSaveName}
                          onSubmitComment={handleParagraphCommentSubmit}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {groupedQuestions[section.id]?.length > 0 && (
                <div className="section-questions">
                  <div className="questions-header">
                    <MessageSquare size={18} />
                    <span>토의 질문</span>
                  </div>
                  {groupedQuestions[section.id].map((q) => {
                    questionNumber++
                    return (
                      <div key={q.id} className={`question-item${isEditMode ? ' question-item-edit' : ''}`}>
                        {isEditMode ? (
                          <div className="question-edit-row">
                            <span className="question-number">Q{questionNumber}.</span>
                            <textarea
                              className="edit-textarea question-edit-textarea"
                              value={q.text}
                              onChange={(e) => updateQuestionText(q.id, e.target.value)}
                              rows={2}
                            />
                          </div>
                        ) : (
                          `Q${questionNumber}. ${q.text}`
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        {(article.facilitatorGuide || isEditMode) && (
          <div className="facilitator-guide-section">
            {isEditMode ? (
              <div className="edit-section-block">
                <p className="edit-section-label">📋 진행자 가이드</p>
                <textarea
                  className="edit-textarea"
                  value={editedArticle.facilitatorGuide || ''}
                  onChange={(e) => setEditedArticle(prev => ({ ...prev, facilitatorGuide: e.target.value }))}
                  rows={10}
                />
              </div>
            ) : (
              <>
                <button className="guide-toggle-btn" onClick={() => setShowGuide(!showGuide)}>
                  📋 진행자 가이드
                  {showGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showGuide && (
                  <div className="guide-content">
                    <pre>{article.facilitatorGuide}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {article.summaryCard && (
          <div className="summary-card-section">
            <button className="card-toggle-btn" onClick={() => setShowSummaryCard(!showSummaryCard)}>
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
                  {article.summaryCard.keyPoints?.length > 0 && (
                    <div className="card-item">
                      <h4 className="card-item-title">핵심 포인트</h4>
                      <ul className="card-item-list">
                        {article.summaryCard.keyPoints.map((point, idx) => <li key={idx}>{point}</li>)}
                      </ul>
                    </div>
                  )}
                  {article.summaryCard.relatedLaws?.length > 0 && (
                    <div className="card-item">
                      <h4 className="card-item-title">관련 법령</h4>
                      <ul className="card-item-list laws">
                        {article.summaryCard.relatedLaws.map((law, idx) => <li key={idx}>{law}</li>)}
                      </ul>
                    </div>
                  )}
                  {article.summaryCard.discussionQuestions?.length > 0 && (
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
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handlePasswordSubmit}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleDetailPage
