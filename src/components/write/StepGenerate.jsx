import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Save, RotateCcw, Send, Bot, User, Check, X, Loader2 } from 'lucide-react'
import { generateArticle as generateArticleAPI, refineArticle } from '../../services/geminiService'
import './WriteSteps.css'

const SECTION_LABELS = ['사례 제시', '관련 법령', '구조적 문제', '대안 제시']

function StepGenerate({ formData, updateFormData, onNext, onPrev, onSaveDraft, isSaving }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [article, setArticle] = useState(formData.generatedArticle || null)
  const [editingSection, setEditingSection] = useState(null)
  const [editedContent, setEditedContent] = useState('')

  // 진행 상태 추적
  const [progress, setProgress] = useState({ step: '', message: '', section: 0, chars: 0, estimatedTotal: 10000 })
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef(null)

  // AI 수정 요청 관련 상태
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [pendingChange, setPendingChange] = useState(null)

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  // textarea 자동 높이 조절 (위로 확장)
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 150) // 최대 150px
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    if (!article && !isGenerating) {
      generateArticle()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [chatInput, adjustTextareaHeight])

  const generateArticle = async () => {
    setIsGenerating(true)
    setElapsedTime(0)
    setProgress({ step: '', message: '준비 중...', section: 0, chars: 0, estimatedTotal: 10000 })

    // 경과 시간 타이머
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    try {
      const generatedArticle = await generateArticleAPI(formData, (event) => {
        setProgress(prev => ({ ...prev, ...event }))
      })
      setArticle(generatedArticle)
      updateFormData({
        generatedArticle: generatedArticle,
        sections: generatedArticle.sections
      })
    } catch (error) {
      console.error('글 생성 오류:', error)
      alert('글 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      clearInterval(timerRef.current)
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setArticle(null)
    setChatMessages([])
    generateArticle()
  }

  const handleSectionEdit = (section) => {
    setEditingSection(section.id)
    setEditedContent(section.content)
  }

  const handleSectionSave = (sectionId) => {
    const updatedSections = article.sections.map(s =>
      s.id === sectionId ? { ...s, content: editedContent } : s
    )
    const updatedArticle = { ...article, sections: updatedSections }
    setArticle(updatedArticle)
    updateFormData({ generatedArticle: updatedArticle, sections: updatedSections })
    setEditingSection(null)
  }

  const handleSectionCancel = () => {
    setEditingSection(null)
    setEditedContent('')
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isAiProcessing) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsAiProcessing(true)

    try {
      const refinedResult = await refineArticle(article, userMessage)

      const aiResponse = `요청하신 "${userMessage}"에 대해 수정을 완료했습니다. 수정된 부분을 확인해주세요.`
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])

      // 수정된 섹션이 있으면 pendingChange 설정
      if (refinedResult.modifiedSections && refinedResult.modifiedSections.length > 0) {
        const modifiedSectionId = refinedResult.modifiedSections[0]
        const originalSection = article.sections.find(s => s.id === modifiedSectionId)
        const newSection = refinedResult.sections.find(s => s.id === modifiedSectionId)

        if (originalSection && newSection) {
          setPendingChange({
            sectionId: modifiedSectionId,
            originalContent: originalSection.content,
            newContent: newSection.content,
            fullArticle: refinedResult
          })
        }
      } else {
        // 전체 글이 수정된 경우
        setArticle(refinedResult)
        updateFormData({ generatedArticle: refinedResult, sections: refinedResult.sections })
      }
    } catch (error) {
      console.error('글 수정 오류:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 수정 중 오류가 발생했습니다. 다시 시도해주세요.'
      }])
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleApplyChange = () => {
    if (pendingChange) {
      // fullArticle이 있으면 전체 적용, 없으면 해당 섹션만 적용
      if (pendingChange.fullArticle) {
        setArticle(pendingChange.fullArticle)
        updateFormData({ generatedArticle: pendingChange.fullArticle, sections: pendingChange.fullArticle.sections })
      } else {
        const updatedSections = article.sections.map(s =>
          s.id === pendingChange.sectionId ? { ...s, content: pendingChange.newContent } : s
        )
        const updatedArticle = { ...article, sections: updatedSections }
        setArticle(updatedArticle)
        updateFormData({ generatedArticle: updatedArticle, sections: updatedSections })
      }
      setPendingChange(null)
    }
  }

  const handleRejectChange = () => {
    setPendingChange(null)
  }

  const handleNext = () => {
    updateFormData({
      generatedArticle: article,
      sections: article.sections
    })
    onNext()
  }

  if (isGenerating) {
    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return m > 0 ? `${m}분 ${s}초` : `${s}초`
    }

    const progressPercent = progress.estimatedTotal > 0
      ? Math.min(Math.round((progress.chars / progress.estimatedTotal) * 100), 95)
      : 0

    const steps = [
      { key: 'extracting', label: '자료 분석' },
      { key: 'prompt', label: '프롬프트 준비' },
      { key: 'requesting', label: 'AI 요청 전송' },
      { key: 'writing', label: '글 작성 중' },
      { key: 'parsing', label: '결과 정리' },
    ]

    const currentStepIdx = steps.findIndex(s => s.key === progress.step)

    return (
      <div className="generating-state">
        <div className="generating-spinner">
          <Loader2 size={48} className="spinner-icon" />
        </div>
        <h3>글을 생성하고 있습니다...</h3>

        <div className="generating-steps">
          {steps.map((s, idx) => {
            let status = 'pending'
            if (idx < currentStepIdx) status = 'done'
            else if (idx === currentStepIdx) status = 'active'

            return (
              <div key={s.key} className={`generating-step ${status}`}>
                <span className="gen-step-indicator">
                  {status === 'done' ? '✓' : status === 'active' ? <Loader2 size={14} className="spinner-icon" /> : '○'}
                </span>
                <span className="step-label">{s.label}</span>
              </div>
            )
          })}
        </div>

        {progress.step === 'writing' && (
          <div className="generating-detail">
            <div className="section-progress">
              {SECTION_LABELS.map((label, idx) => (
                <span key={idx} className={`section-badge ${idx + 1 <= progress.section ? 'done' : idx + 1 === progress.section + 1 && progress.section > 0 ? 'active' : ''}`}>
                  {idx + 1}. {label}
                </span>
              ))}
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="progress-chars">{progress.chars.toLocaleString()}자 / 약 {progress.estimatedTotal.toLocaleString()}자</span>
          </div>
        )}

        <span className="generating-time">⏱ 경과 시간: {formatTime(elapsedTime)}</span>
      </div>
    )
  }

  return (
    <div className="step-generate">
      <div className="generate-layout">
        {/* 왼쪽: 글 편집 영역 */}
        <div className="article-editor">
          <div className="editor-header">
            <h3>글 편집</h3>
            <button className="btn btn-outline btn-sm" onClick={handleRegenerate}>
              <RotateCcw size={16} />
              처음부터 다시
            </button>
          </div>

          <div className="article-content">
            <h2 className="article-title">{article?.title}</h2>
            <p className="article-author">작성자: {formData.authorName}</p>

            {article?.sections.map((section) => (
              <div
                key={section.id}
                className={`article-section ${pendingChange?.sectionId === section.id ? 'has-pending-change' : ''}`}
              >
                <h4 className="section-title">{section.title}</h4>

                {editingSection === section.id ? (
                  <div className="section-editing">
                    <textarea
                      className="section-textarea"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={8}
                    />
                    <div className="section-edit-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleSectionSave(section.id)}>
                        <Check size={14} /> 저장
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={handleSectionCancel}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {pendingChange?.sectionId === section.id ? (
                      <div className="pending-change-view">
                        <div className="change-label">수정됨</div>
                        <div className="section-content new-content">
                          {pendingChange.newContent}
                        </div>
                        <div className="change-actions">
                          <button className="btn btn-sm btn-primary" onClick={handleApplyChange}>
                            <Check size={14} /> 이 수정 적용
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={handleRejectChange}>
                            <X size={14} /> 원래대로
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="section-content"
                        onClick={() => handleSectionEdit(section)}
                      >
                        {section.content}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <p className="editor-hint">내용을 직접 클릭하여 수정할 수 있습니다.</p>
        </div>

        {/* 오른쪽: AI 수정 요청 채팅 */}
        <div className="ai-chat-panel">
          <div className="chat-header">
            <Bot size={20} />
            <span>AI에게 수정/보완 요청</span>
          </div>

          <div className="chat-examples">
            <p>예시:</p>
            <ul>
              <li>"2단 법령 부분을 더 자세하게 써줘"</li>
              <li>"전체적으로 문장을 더 부드럽게 다듬어줘"</li>
              <li>"대안 부분에 예산 관련 내용도 추가해줘"</li>
            </ul>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-icon">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isAiProcessing && (
              <div className="chat-message assistant">
                <div className="message-icon"><Bot size={16} /></div>
                <div className="message-content">
                  <Loader2 size={16} className="spinner-icon" /> 수정 중...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleChatSubmit}>
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (chatInput.trim() && !isAiProcessing) {
                      handleChatSubmit(e)
                    }
                  }
                }}
                placeholder="AI에게 수정 요청을 입력하세요..."
                disabled={isAiProcessing}
                rows={1}
              />
              <button type="submit" className="chat-send-btn" disabled={isAiProcessing || !chatInput.trim()}>
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={18} />
          이전
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onSaveDraft}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={18} className="spinner-icon" /> : <Save size={18} />}
          {isSaving ? '저장 중...' : '임시저장'}
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          완료
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default StepGenerate
