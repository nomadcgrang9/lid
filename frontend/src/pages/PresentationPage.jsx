import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Presentation, Loader2, Plus, FileText } from 'lucide-react'
import { getArticles } from '../services/articleService'
import { generatePresentation, savePresentation, getPresentationsByArticleId } from '../services/presentationService'
import './PresentationPage.css'

export default function PresentationPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState(null)
  const [slideCounts, setSlideCounts] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalPresentations, setModalPresentations] = useState([])
  const [selectedArticleTitle, setSelectedArticleTitle] = useState('')

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    try {
      setLoading(true)
      const data = await getArticles()
      setArticles(data)

      // 기본 슬라이드 장수 설정 (10장)
      const defaultCounts = {}
      data.forEach(article => {
        defaultCounts[article.id] = 10
      })
      setSlideCounts(defaultCounts)
    } catch (error) {
      console.error('글 목록 로딩 오류:', error)
      alert('글 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSlideCountChange(articleId, value) {
    // Allow empty string during typing
    if (value === '') {
      setSlideCounts(prev => ({
        ...prev,
        [articleId]: ''
      }))
      return
    }

    // Just store the value without restricting range during typing
    const count = parseInt(value)
    if (!isNaN(count)) {
      setSlideCounts(prev => ({
        ...prev,
        [articleId]: count  // Store as-is, no range restriction yet
      }))
    }
  }

  function handleSlideCountBlur(articleId) {
    const value = slideCounts[articleId]

    // When user finishes typing, set to default if empty
    if (value === '' || value === undefined) {
      setSlideCounts(prev => ({
        ...prev,
        [articleId]: 10
      }))
      return
    }

    // Apply range restriction only on blur
    const count = parseInt(value)
    if (!isNaN(count)) {
      setSlideCounts(prev => ({
        ...prev,
        [articleId]: Math.min(Math.max(count, 5), 30) // 5-30장 제한
      }))
    }
  }

  async function handleGeneratePresentation(article) {
    try {
      setGeneratingId(article.id)

      // AI로 슬라이드 생성
      const result = await generatePresentation(article.id, slideCounts[article.id])

      if (result && result.slides) {
        // Firestore에 저장
        const presentationData = {
          articleId: article.id,
          title: article.title,
          slides: result.slides,
          slideCount: result.slides.length
        }
        const presentationId = await savePresentation(presentationData)

        alert(`"${article.title}" 발표자료 생성 완료!\n총 ${result.slides.length}장의 슬라이드가 생성되었습니다.`)

        // 편집 페이지로 이동
        navigate(`/presentation/${presentationId}/edit`)
      } else {
        throw new Error('슬라이드 생성 결과가 올바르지 않습니다.')
      }

    } catch (error) {
      console.error('발표자료 생성 오류:', error)
      alert(`발표자료 생성에 실패했습니다.\n${error.message}`)
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleViewPresentations(article) {
    try {
      const presentations = await getPresentationsByArticleId(article.id)

      if (presentations.length === 0) {
        alert('아직 생성된 발표자료가 없습니다.')
        return
      }

      if (presentations.length === 1) {
        // 1개면 바로 이동
        navigate(`/presentation/${presentations[0].id}/edit`)
      } else {
        // 여러 개면 모달 표시
        setSelectedArticleTitle(article.title)
        setModalPresentations(presentations)
        setShowModal(true)
      }
    } catch (error) {
      console.error('발표자료 조회 오류:', error)
      alert('발표자료를 불러오는데 실패했습니다.')
    }
  }

  function handleSelectPresentation(presentationId) {
    setShowModal(false)
    navigate(`/presentation/${presentationId}/edit`)
  }

  function formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="presentation-page">
        <div className="loading-container">
          <Loader2 className="loading-spinner" size={40} />
          <p>글 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="presentation-page">
      <div className="page-header">
        <h2 className="page-title">발표자료 만들기</h2>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <Presentation size={64} className="empty-icon" />
          <h2>작성된 글이 없습니다</h2>
          <p>글쓰기 탭에서 글을 작성한 후 발표자료를 만들어보세요.</p>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(article => (
            <div key={article.id} className="article-card">
              <div className="article-header">
                <h3 className="article-title">{article.title}</h3>
              </div>

              <div className="article-meta">
                <span className="article-author">작성자: {article.authorName}</span>
                <span className="article-date">{formatDate(article.createdAt)}</span>
              </div>

              {article.sections && article.sections.length > 0 && (
                <div className="article-preview">
                  {article.sections[0]?.content?.substring(0, 100)}...
                </div>
              )}

              <div className="article-actions">
                <div className="slide-count-input">
                  <input
                    type="text"
                    id={`slides-${article.id}`}
                    value={slideCounts[article.id] === undefined ? 10 : slideCounts[article.id]}
                    onChange={(e) => handleSlideCountChange(article.id, e.target.value)}
                    onBlur={() => handleSlideCountBlur(article.id)}
                    disabled={generatingId === article.id}
                    placeholder="10"
                  />
                  <span className="slides-suffix">장</span>
                </div>

                <button
                  className="generate-btn"
                  onClick={() => handleGeneratePresentation(article)}
                  disabled={generatingId === article.id}
                >
                  {generatingId === article.id ? (
                    <>
                      <Loader2 className="btn-spinner" size={18} />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      자료생성
                    </>
                  )}
                </button>

                <button
                  className="view-btn"
                  onClick={() => handleViewPresentations(article)}
                >
                  <FileText size={18} />
                  자료열람
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 발표자료 선택 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedArticleTitle}</h3>
              <p>발표자료를 선택하세요</p>
            </div>
            <div className="modal-body">
              {modalPresentations.map((ppt) => (
                <div
                  key={ppt.id}
                  className="presentation-item"
                  onClick={() => handleSelectPresentation(ppt.id)}
                >
                  <div className="presentation-info">
                    <span className="presentation-date">{formatDateTime(ppt.createdAt)}</span>
                    <span className="presentation-slides">{ppt.slideCount}장</span>
                  </div>
                  <button className="select-btn">열기</button>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
