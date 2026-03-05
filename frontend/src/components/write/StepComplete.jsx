import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, RefreshCw, Plus, Edit3, Trash2, Send, Bot, User, Download, Upload, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { generateQuestions as generateQuestionsAPI, refineQuestions, generateSummaryCard as generateCardAPI, refineSummaryCard } from '../../services/geminiService'
import { saveArticleWithFiles } from '../../services/articleService'
import { downloadAsHwpx } from '../../utils/hwpxExport'
import './WriteSteps.css'

function StepComplete({ formData, updateFormData, onPrev, onDeleteDraft }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('questions') // questions, card, preview
  const [questionCount, setQuestionCount] = useState(formData.questionCount || 10)
  const [isUploading, setIsUploading] = useState(false)
  const [questions, setQuestions] = useState(formData.questions || [])
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [summaryCard, setSummaryCard] = useState(formData.summaryCard || null)
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingQuestionText, setEditingQuestionText] = useState('')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [showGuideExpanded, setShowGuideExpanded] = useState(false)

  // AI 수정 요청 관련
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (questions.length === 0 && !isGeneratingQuestions) {
      generateQuestions()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const generateQuestions = async () => {
    setIsGeneratingQuestions(true)
    try {
      const generatedQuestions = await generateQuestionsAPI(formData.generatedArticle, questionCount)
      setQuestions(generatedQuestions)
      updateFormData({ questions: generatedQuestions, questionCount })
    } catch (error) {
      console.error('질문 생성 오류:', error)
      alert('질문 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const generateSummaryCard = async () => {
    if (questions.length === 0) {
      alert('먼저 토의 질문을 생성해주세요.')
      return
    }
    setIsGeneratingCard(true)
    try {
      const card = await generateCardAPI(formData.generatedArticle, questions)
      setSummaryCard(card)
      updateFormData({ summaryCard: card })
    } catch (error) {
      console.error('발제 카드 생성 오류:', error)
      alert('발제 카드 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsGeneratingCard(false)
    }
  }

  const handleQuestionCountChange = (newCount) => {
    setQuestionCount(newCount)
  }

  const handleRegenerateQuestions = () => {
    generateQuestions()
  }

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question.id)
    setEditingQuestionText(question.text)
  }

  const handleSaveQuestion = (questionId) => {
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, text: editingQuestionText } : q
    )
    setQuestions(updatedQuestions)
    updateFormData({ questions: updatedQuestions })
    setEditingQuestionId(null)
  }

  const handleDeleteQuestion = (questionId) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId)
    setQuestions(updatedQuestions)
    updateFormData({ questions: updatedQuestions })
  }

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return
    const newQuestion = {
      id: Date.now(),
      sectionId: 4, // 기본적으로 대안 섹션에 추가
      text: newQuestionText.trim()
    }
    const updatedQuestions = [...questions, newQuestion]
    setQuestions(updatedQuestions)
    updateFormData({ questions: updatedQuestions })
    setNewQuestionText('')
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isAiProcessing) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsAiProcessing(true)

    try {
      if (activeTab === 'questions') {
        // 질문 수정 요청
        const refinedQuestions = await refineQuestions(questions, userMessage, formData.generatedArticle)
        setQuestions(refinedQuestions)
        updateFormData({ questions: refinedQuestions })
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `요청하신 "${userMessage}"에 따라 질문을 수정했습니다. 수정된 내용을 확인해주세요.`
        }])
      } else if (activeTab === 'card') {
        // 발제 카드 수정 요청
        const refinedCard = await refineSummaryCard(summaryCard, userMessage, formData.generatedArticle, questions)
        setSummaryCard(refinedCard)
        updateFormData({ summaryCard: refinedCard })
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `요청하신 "${userMessage}"에 따라 발제 카드를 수정했습니다. 수정된 내용을 확인해주세요.`
        }])
      }
    } catch (error) {
      console.error('수정 오류:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 수정 중 오류가 발생했습니다. 다시 시도해주세요.'
      }])
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (isUploading) return

    setIsUploading(true)
    try {
      const articleData = {
        title: formData.generatedArticle?.title || formData.customTopic,
        authorName: formData.authorName,
        password: formData.password,
        category: formData.category || '기타',
        articleLength: formData.articleLength,
        sections: formData.generatedArticle?.sections || [],
        questions: questions,
        summaryCard: summaryCard,
        customTopic: formData.customTopic,
        cases: formData.cases,
        structuralProblems: formData.structuralProblems,
        alternatives: formData.alternatives
      }

      // PDF 파일과 근거자료 파일을 함께 업로드
      const pdfFiles = formData.pdfFiles || (formData.pdfFile ? [formData.pdfFile] : [])
      const referenceFiles = formData.referenceFiles || []

      const articleId = await saveArticleWithFiles(articleData, pdfFiles, referenceFiles)
      // 업로드 성공 시 임시저장 삭제
      if (onDeleteDraft) {
        await onDeleteDraft()
      }
      alert('글이 성공적으로 업로드되었습니다!')
      navigate(`/article/${articleId}`)
    } catch (error) {
      console.error('업로드 오류:', error)
      alert('업로드 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadHwpx = async () => {
    const article = {
      ...formData.generatedArticle,
      authorName: formData.authorName,
      questions,
      summaryCard,
      facilitatorGuide: formData.generatedArticle?.facilitatorGuide
    }
    try {
      await downloadAsHwpx(article)
    } catch (err) {
      console.error('HWPX 다운로드 오류:', err)
      alert('다운로드에 실패했습니다.')
    }
  }

  const getSectionName = (sectionId) => {
    const names = { 1: '1단 - 사례', 2: '2단 - 법령', 3: '3단 - 구조적 문제', 4: '4단 - 대안' }
    return names[sectionId] || ''
  }

  const groupedQuestions = questions.reduce((acc, q) => {
    const section = q.sectionId
    if (!acc[section]) acc[section] = []
    acc[section].push(q)
    return acc
  }, {})

  return (
    <div className="step-complete">
      {/* 탭 네비게이션 */}
      <div className="complete-tabs">
        <button
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          토의 질문
        </button>
        <button
          className={`tab-btn ${activeTab === 'card' ? 'active' : ''}`}
          onClick={() => setActiveTab('card')}
        >
          발제 카드
        </button>
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          최종 미리보기
        </button>
      </div>

      {/* 토의 질문 탭 */}
      {activeTab === 'questions' && (
        <div className="tab-content questions-tab">
          <div className="questions-layout">
            <div className="questions-main">
              <div className="questions-header">
                <div className="question-count-control">
                  <label>토의 질문 개수:</label>
                  <select
                    value={questionCount}
                    onChange={(e) => handleQuestionCountChange(Number(e.target.value))}
                  >
                    {[5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                      <option key={n} value={n}>{n}개</option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-outline" onClick={handleRegenerateQuestions}>
                    <RefreshCw size={14} /> 질문 생성하기
                  </button>
                </div>
              </div>

              {isGeneratingQuestions ? (
                <div className="loading-state">
                  <Loader2 size={32} className="spinner-icon" />
                  <p>토의 질문을 생성하고 있습니다...</p>
                </div>
              ) : (
                <div className="questions-list">
                  {Object.entries(groupedQuestions).map(([sectionId, sectionQuestions]) => (
                    <div key={sectionId} className="questions-section">
                      <h4 className="questions-section-title">【{getSectionName(Number(sectionId))} 관련】</h4>
                      {sectionQuestions.map((question, idx) => (
                        <div key={question.id} className="question-item">
                          {editingQuestionId === question.id ? (
                            <div className="question-editing">
                              <textarea
                                value={editingQuestionText}
                                onChange={(e) => setEditingQuestionText(e.target.value)}
                                rows={2}
                              />
                              <div className="question-edit-btns">
                                <button className="btn btn-sm btn-primary" onClick={() => handleSaveQuestion(question.id)}>저장</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditingQuestionId(null)}>취소</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="question-number">Q{questions.indexOf(question) + 1}.</span>
                              <span className="question-text">{question.text}</span>
                              <div className="question-actions">
                                <button className="icon-btn" onClick={() => handleEditQuestion(question)}>
                                  <Edit3 size={14} />
                                </button>
                                <button className="icon-btn danger" onClick={() => handleDeleteQuestion(question.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="add-question">
                    <input
                      type="text"
                      placeholder="직접 질문 추가하기..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleAddQuestion}>
                      <Plus size={14} /> 추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI 수정 요청 패널 */}
            <div className="ai-chat-panel">
              <div className="chat-header">
                <Bot size={20} />
                <span>AI에게 질문 수정/보완 요청</span>
              </div>

              <div className="chat-examples">
                <p>예시:</p>
                <ul>
                  <li>"질문들을 더 토론하기 좋게 바꿔줘"</li>
                  <li>"Q3을 초임교사도 답하기 쉽게 수정해줘"</li>
                  <li>"예/아니오로 답할 수 없는 질문으로 바꿔줘"</li>
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
                      <Loader2 size={16} className="spinner-icon" /> 처리 중...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  className="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="AI에게 질문 수정 요청..."
                  disabled={isAiProcessing}
                />
                <button type="submit" className="chat-send-btn" disabled={isAiProcessing || !chatInput.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 발제 카드 탭 */}
      {activeTab === 'card' && (
        <div className="tab-content card-tab">
          <div className="card-layout">
            <div className="card-main">
              <div className="card-header">
                <h3>발제 카드</h3>
                <button className="btn btn-sm btn-outline" onClick={generateSummaryCard} disabled={questions.length === 0}>
                  <RefreshCw size={14} /> {summaryCard ? '카드 재생성' : '카드 생성'}
                </button>
              </div>

              {isGeneratingCard ? (
                <div className="loading-state">
                  <Loader2 size={32} className="spinner-icon" />
                  <p>발제 카드를 생성하고 있습니다...</p>
                </div>
              ) : summaryCard ? (
                <div className="summary-card">
                  <div className="summary-card-title">
                    <h4>{summaryCard.title}</h4>
                  </div>

                  <div className="summary-card-section">
                    <h5>한 줄 요약</h5>
                    <p className="one-liner">{summaryCard.oneLiner}</p>
                  </div>

                  <div className="summary-card-section">
                    <h5>핵심 포인트</h5>
                    <ul className="key-points">
                      {summaryCard.keyPoints?.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  {summaryCard.relatedLaws && summaryCard.relatedLaws.length > 0 && (
                    <div className="summary-card-section">
                      <h5>관련 법령</h5>
                      <ul className="related-laws">
                        {summaryCard.relatedLaws.map((law, i) => (
                          <li key={i}>{law}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="summary-card-section">
                    <h5>토의 질문 ({summaryCard.discussionQuestions?.length || 0}개)</h5>
                    <ol className="discussion-questions">
                      {summaryCard.discussionQuestions?.map((q, i) => (
                        <li key={i}>{q.text || q}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="empty-card-state">
                  <p>토의 질문을 먼저 생성한 후, 발제 카드를 생성해주세요.</p>
                  <button className="btn btn-primary" onClick={generateSummaryCard} disabled={questions.length === 0}>
                    발제 카드 생성하기
                  </button>
                </div>
              )}

              <p className="card-hint">발제자가 연구회/독서모임에서 바로 활용할 수 있는 요약 카드입니다.</p>
            </div>

            {/* AI 수정 요청 패널 */}
            <div className="ai-chat-panel">
              <div className="chat-header">
                <Bot size={20} />
                <span>AI에게 발제 카드 수정 요청</span>
              </div>

              <div className="chat-examples">
                <p>예시:</p>
                <ul>
                  <li>"핵심 포인트를 5개로 늘려줘"</li>
                  <li>"한 줄 요약을 더 간결하게 해줘"</li>
                  <li>"관련 법령 설명을 추가해줘"</li>
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
                      <Loader2 size={16} className="spinner-icon" /> 처리 중...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  className="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="AI에게 발제 카드 수정 요청..."
                  disabled={isAiProcessing}
                />
                <button type="submit" className="chat-send-btn" disabled={isAiProcessing || !chatInput.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 최종 미리보기 탭 */}
      {activeTab === 'preview' && (
        <div className="tab-content preview-tab">
          <div className="preview-container">
            <div className="preview-article">
              <h2 className="preview-title">{formData.generatedArticle?.title}</h2>
              <p className="preview-author">작성자: {formData.authorName}</p>

              {formData.generatedArticle?.sections.map((section) => (
                <div key={section.id} className="preview-section">
                  <h4>{section.title}</h4>
                  <div className="preview-content">{section.content}</div>

                  {groupedQuestions[section.id] && (
                    <div className="preview-questions">
                      <div className="preview-questions-header">💬 토의 질문</div>
                      {groupedQuestions[section.id].map((q, idx) => (
                        <div key={q.id} className="preview-question">
                          Q{questions.indexOf(q) + 1}. {q.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {summaryCard && (
                <div className="preview-card">
                  <button
                    className="card-toggle"
                    onClick={() => setShowGuideExpanded(!showGuideExpanded)}
                  >
                    발제 카드 {showGuideExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showGuideExpanded && (
                    <div className="card-expanded">
                      <div className="preview-card-content">
                        <p><strong>한 줄 요약:</strong> {summaryCard.oneLiner}</p>
                        <p><strong>핵심 포인트:</strong></p>
                        <ul>
                          {summaryCard.keyPoints?.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                        {summaryCard.relatedLaws?.length > 0 && (
                          <>
                            <p><strong>관련 법령:</strong></p>
                            <ul>
                              {summaryCard.relatedLaws.map((law, i) => <li key={i}>{law}</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={18} />
          수정하기
        </button>
        <button type="button" className="btn btn-outline" onClick={handleDownloadHwpx}>
          <Download size={18} />
          PDF 다운로드
        </button>
        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? <Loader2 size={18} className="spinner-icon" /> : <Upload size={18} />}
          {isUploading ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  )
}

export default StepComplete
