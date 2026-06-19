import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Upload, Loader2 } from 'lucide-react'
import { saveArticle, getCategories } from '../../services/articleService'
import './ManualUploadModal.css'

// 완성 원고를 직접 붙여넣어 글읽기에 등록하는 모달.
// AI 글쓰기를 거치지 않은 글도 동일한 articles 문서로 저장되어
// 글읽기 목록 노출 + 문단별 댓글/대댓글 실시간 기능이 똑같이 동작한다.
function ManualUploadModal({ onClose }) {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    authorName: '',
    password: '',
    category: '',
    title: '',
    content: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e) => console.error('카테고리 로딩 오류:', e))
  }, [])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSaving) return

    if (!form.authorName.trim()) return setError('성명을 입력해주세요.')
    if (!form.password.trim()) return setError('비밀번호를 입력해주세요.')
    if (!form.title.trim()) return setError('제목을 입력해주세요.')

    // 본문을 줄 단위로 분리해 문단으로 만든다.
    // ArticleDetailPage가 content를 \n\n 기준으로 쪼개 문단별 댓글을 붙이므로,
    // 빈 줄을 정리하고 각 문단을 \n\n로 연결해 문단별 댓글이 정확히 달리게 한다.
    const paragraphs = form.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (paragraphs.length === 0) return setError('본문을 입력해주세요.')

    const articleData = {
      title: form.title.trim(),
      authorName: form.authorName.trim(),
      password: form.password,
      category: form.category || '기타',
      sections: [{ id: 1, title: '', content: paragraphs.join('\n\n') }],
      questions: [],
      // 수동 업로드 글 표시. 상세 페이지에서 소제목·법조문 등 '뼈대 줄'에는
      // 댓글칸을 붙이지 않고 줄글에만 댓글칸을 다는 데 사용된다.
      source: 'manual'
    }

    setIsSaving(true)
    try {
      const articleId = await saveArticle(articleData)
      navigate(`/article/${articleId}`)
    } catch (err) {
      console.error('수동 업로드 오류:', err)
      setError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsSaving(false)
    }
  }

  return (
    <div className="mu-overlay" onClick={onClose}>
      <div className="mu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mu-header">
          <div>
            <h3 className="mu-title">수동 업로드</h3>
            <p className="mu-subtitle">완성한 원고를 붙여넣으면 글읽기에 등록되고, 문단별 댓글이 달립니다.</p>
          </div>
          <button type="button" className="mu-close" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <form className="mu-body" onSubmit={handleSubmit}>
          <div className="mu-row">
            <div className="mu-field">
              <label className="mu-label">성명 (실명) <span className="mu-required">*</span></label>
              <input
                type="text"
                className="mu-input"
                value={form.authorName}
                onChange={(e) => update('authorName', e.target.value)}
                placeholder="실명을 입력해주세요"
                autoFocus
              />
            </div>
            <div className="mu-field">
              <label className="mu-label">비밀번호 (글 수정 시 필요) <span className="mu-required">*</span></label>
              <input
                type="password"
                className="mu-input"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div className="mu-field">
            <label className="mu-label">카테고리</label>
            <select
              className="mu-input"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              <option value="">카테고리 선택 (미선택 시 '기타')</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="mu-field">
            <label className="mu-label">제목 <span className="mu-required">*</span></label>
            <input
              type="text"
              className="mu-input"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="글 제목을 입력해주세요"
            />
          </div>

          <div className="mu-field">
            <label className="mu-label">본문 <span className="mu-required">*</span></label>
            <textarea
              className="mu-textarea"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="완성한 원고 본문을 그대로 붙여넣어 주세요.&#10;&#10;문단은 자동으로 구분됩니다."
              rows={14}
            />
            <p className="mu-hint">
              문단은 자동으로 구분되어 줄글마다 댓글칸이 생깁니다. 소제목·법조문·각주에는 댓글칸이 붙지 않습니다.
              특정 부분에서 댓글을 더 잘게 나누고 싶으면 그 부분을 엔터로 문단을 나눠 주세요.
            </p>
          </div>

          {error && <p className="mu-error">{error}</p>}

          <div className="mu-footer">
            <button type="button" className="mu-btn mu-btn-secondary" onClick={onClose} disabled={isSaving}>
              취소
            </button>
            <button type="submit" className="mu-btn mu-btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 size={18} className="mu-spin" /> : <Upload size={18} />}
              {isSaving ? '업로드 중...' : '글읽기에 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManualUploadModal
