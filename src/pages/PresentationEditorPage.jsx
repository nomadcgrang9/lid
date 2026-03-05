import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Play, Edit2, Save, Trash2 } from 'lucide-react'
import { getPresentation, updatePresentation } from '../services/presentationService'
import './PresentationEditorPage.css'

export default function PresentationEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [presentation, setPresentation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState(null)
  const [slides, setSlides] = useState([])

  useEffect(() => {
    loadPresentation()
  }, [id])

  async function loadPresentation() {
    try {
      setLoading(true)
      const data = await getPresentation(id)
      if (data) {
        setPresentation(data)
        setSlides(data.slides || [])
      } else {
        alert('프레젠테이션을 찾을 수 없습니다.')
        navigate('/presentation')
      }
    } catch (error) {
      console.error('프레젠테이션 로딩 오류:', error)
      alert('프레젠테이션을 불러오는데 실패했습니다.')
      navigate('/presentation')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      await updatePresentation(id, { slides })
      alert('저장되었습니다.')
      setEditingSlide(null)
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장에 실패했습니다.')
    }
  }

  function handleEditSlide(slideId) {
    setEditingSlide(slideId)
  }

  function handleUpdateSlide(slideId, field, value) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId) {
        return { ...slide, [field]: value }
      }
      return slide
    }))
  }

  function handleUpdateKeyPoint(slideId, index, value) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.keyPoints) {
        const newKeyPoints = [...slide.keyPoints]
        newKeyPoints[index] = value
        return { ...slide, keyPoints: newKeyPoints }
      }
      return slide
    }))
  }

  function handleAddKeyPoint(slideId) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.keyPoints) {
        return { ...slide, keyPoints: [...slide.keyPoints, ''] }
      }
      return slide
    }))
  }

  function handleDeleteKeyPoint(slideId, index) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.keyPoints) {
        const newKeyPoints = slide.keyPoints.filter((_, i) => i !== index)
        return { ...slide, keyPoints: newKeyPoints }
      }
      return slide
    }))
  }

  function handleUpdateQuestion(slideId, index, value) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.questions) {
        const newQuestions = [...slide.questions]
        newQuestions[index] = value
        return { ...slide, questions: newQuestions }
      }
      return slide
    }))
  }

  function handleAddQuestion(slideId) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.questions) {
        return { ...slide, questions: [...slide.questions, ''] }
      }
      return slide
    }))
  }

  function handleDeleteQuestion(slideId, index) {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId && slide.questions) {
        const newQuestions = slide.questions.filter((_, i) => i !== index)
        return { ...slide, questions: newQuestions }
      }
      return slide
    }))
  }

  function renderSlideContent(slide) {
    const isEditing = editingSlide === slide.id

    if (slide.type === 'title') {
      return (
        <div className="slide-content title-slide">
          {isEditing ? (
            <>
              <input
                type="text"
                className="edit-input title-input"
                value={slide.title || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                placeholder="제목"
              />
              <input
                type="text"
                className="edit-input subtitle-input"
                value={slide.subtitle || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'subtitle', e.target.value)}
                placeholder="부제목"
              />
              <input
                type="text"
                className="edit-input author-input"
                value={slide.author || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'author', e.target.value)}
                placeholder="작성자"
              />
            </>
          ) : (
            <>
              <h1 className="slide-title">{slide.title}</h1>
              {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
              {slide.author && <p className="slide-author">{slide.author}</p>}
            </>
          )}
        </div>
      )
    }

    if (slide.type === 'content') {
      return (
        <div className="slide-content content-slide">
          {isEditing ? (
            <>
              <input
                type="text"
                className="edit-input content-title-input"
                value={slide.title || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                placeholder="슬라이드 제목"
              />
              <div className="keypoints-edit">
                {slide.keyPoints?.map((point, index) => (
                  <div key={index} className="keypoint-edit-row">
                    <input
                      type="text"
                      className="edit-input keypoint-input"
                      value={point}
                      onChange={(e) => handleUpdateKeyPoint(slide.id, index, e.target.value)}
                      placeholder={`키포인트 ${index + 1}`}
                    />
                    <button
                      className="delete-keypoint-btn"
                      onClick={() => handleDeleteKeyPoint(slide.id, index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button className="add-keypoint-btn" onClick={() => handleAddKeyPoint(slide.id)}>
                  + 키포인트 추가
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="slide-content-title">{slide.title}</h2>
              <ul className="keypoints-list">
                {slide.keyPoints?.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )
    }

    if (slide.type === 'question') {
      return (
        <div className="slide-content question-slide">
          {isEditing ? (
            <>
              <input
                type="text"
                className="edit-input question-title-input"
                value={slide.title || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                placeholder="질문 슬라이드 제목"
              />
              <div className="questions-edit">
                {slide.questions?.map((question, index) => (
                  <div key={index} className="question-edit-row">
                    <textarea
                      className="edit-textarea question-textarea"
                      value={question}
                      onChange={(e) => handleUpdateQuestion(slide.id, index, e.target.value)}
                      placeholder={`질문 ${index + 1}`}
                      rows={2}
                    />
                    <button
                      className="delete-question-btn"
                      onClick={() => handleDeleteQuestion(slide.id, index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button className="add-question-btn" onClick={() => handleAddQuestion(slide.id)}>
                  + 질문 추가
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="slide-question-title">{slide.title}</h2>
              <div className="questions-list">
                {slide.questions?.map((question, index) => (
                  <div key={index} className="question-item">
                    <span className="question-number">Q{index + 1}.</span>
                    <p className="question-text">{question}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )
    }

    if (slide.type === 'closing') {
      return (
        <div className="slide-content closing-slide">
          {isEditing ? (
            <>
              <input
                type="text"
                className="edit-input closing-title-input"
                value={slide.title || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                placeholder="마무리 제목"
              />
              <textarea
                className="edit-textarea closing-message-textarea"
                value={slide.message || ''}
                onChange={(e) => handleUpdateSlide(slide.id, 'message', e.target.value)}
                placeholder="마무리 메시지"
                rows={3}
              />
            </>
          ) : (
            <>
              <h1 className="slide-closing-title">{slide.title}</h1>
              {slide.message && <p className="slide-closing-message">{slide.message}</p>}
            </>
          )}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="editor-page">
        <div className="loading-container">
          <p>불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate('/presentation')}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="editor-title">{presentation?.title || '발표자료 편집'}</h2>
        <div className="editor-actions">
          <button className="save-btn" onClick={handleSave}>
            <Save size={18} />
            저장
          </button>
        </div>
      </div>

      <div className="slides-grid">
        {slides.map((slide) => (
          <div key={slide.id} className="slide-card">
            <div className="slide-card-header">
              <span className="slide-number">슬라이드 {slide.id}</span>
              <button
                className="edit-slide-btn"
                onClick={() => editingSlide === slide.id ? setEditingSlide(null) : handleEditSlide(slide.id)}
              >
                <Edit2 size={16} />
                {editingSlide === slide.id ? '완료' : '편집'}
              </button>
            </div>
            <div className="slide-preview">
              {renderSlideContent(slide)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
