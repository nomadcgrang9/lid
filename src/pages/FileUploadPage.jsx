import { useState, useRef, useEffect } from 'react'
import { Pencil, X, Upload, Download, Plus, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import {
  getParts, getAllTopics, addTopic, updateTopic, deleteTopic,
  uploadTopicFile, deleteTopicFile, updatePart, seedPublicationData,
  deduplicatePublicationData
} from '../services/publicationService'
import { verifyAdminPassword } from '../services/articleService'
import './FileUploadPage.css'

// ==================== SVG Circular Progress ====================
function CircularProgress({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const r = 26
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const color = pct === 100 ? 'var(--success-color)' : 'var(--primary-color)'

  return (
    <svg width="76" height="76" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-color)" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x="32" y="32" textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fill="var(--text-primary)">{pct}%</text>
    </svg>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[1]}/${parts[2]}`
}

// ==================== Main Component ====================
export default function FileUploadPage() {
  const [parts, setParts] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Part inline edit
  const [editingPartId, setEditingPartId] = useState(null)
  const [editingPartForm, setEditingPartForm] = useState({ name: '', displayName: '' })

  // Upload modal
  const [uploadModal, setUploadModal] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Edit topic modal
  const [editTopicModal, setEditTopicModal] = useState(null)
  const [editTopicForm, setEditTopicForm] = useState({ title: '', assignedPerson: '', presentationDate: '' })

  // Add topic modal
  const [addTopicPartId, setAddTopicPartId] = useState(null)
  const [addTopicForm, setAddTopicForm] = useState({ title: '', assignedPerson: '', presentationDate: '' })

  const [savingTopic, setSavingTopic] = useState(false)

  // Collapse state: Set of partIds that are collapsed
  const [collapsedParts, setCollapsedParts] = useState(new Set())

  const togglePart = (partId) => {
    setCollapsedParts(prev => {
      const next = new Set(prev)
      next.has(partId) ? next.delete(partId) : next.add(partId)
      return next
    })
  }

  const collapseAll = () => setCollapsedParts(new Set(parts.map(p => p.id)))
  const expandAll = () => setCollapsedParts(new Set())

  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // 중복 파트가 있으면 먼저 정리
      await deduplicatePublicationData()
      let [partsData, topicsData] = await Promise.all([getParts(), getAllTopics()])
      if (partsData.length === 0) {
        await seedPublicationData()
        ;[partsData, topicsData] = await Promise.all([getParts(), getAllTopics()])
      }
      setParts(partsData)
      setTopics(topicsData)
    } catch {
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== Computed ====================
  const totalTopics = topics.length
  const completedTopics = topics.filter(t => t.fileUrl).length

  const getPartTopics = (partId) =>
    topics.filter(t => t.partId === partId).sort((a, b) => a.order - b.order)

  const getPartStats = (partId) => {
    const pt = getPartTopics(partId)
    const done = pt.filter(t => t.fileUrl).length
    const total = pt.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { done, total, pct }
  }

  // ==================== Edit Mode ====================
  const handleEditClick = () => {
    if (editMode) {
      setEditMode(false)
      setEditingPartId(null)
    } else {
      setPasswordInput('')
      setPasswordError('')
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = () => {
    if (verifyAdminPassword(passwordInput)) {
      setEditMode(true)
      setShowPasswordModal(false)
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.')
    }
  }

  // ==================== Part Editing ====================
  const handlePartEditStart = (part) => {
    setEditingPartId(part.id)
    setEditingPartForm({ name: part.name, displayName: part.displayName })
  }

  const handlePartEditSave = async (partId) => {
    try {
      await updatePart(partId, editingPartForm)
      setParts(prev => prev.map(p => p.id === partId ? { ...p, ...editingPartForm } : p))
      setEditingPartId(null)
    } catch {
      alert('저장에 실패했습니다.')
    }
  }

  // ==================== Topic Editing ====================
  const handleEditTopicOpen = (topic) => {
    setEditTopicModal(topic)
    setEditTopicForm({
      title: topic.title,
      assignedPerson: topic.assignedPerson,
      presentationDate: topic.presentationDate || ''
    })
  }

  const handleEditTopicSave = async () => {
    if (!editTopicForm.title.trim()) return alert('주제명을 입력해주세요.')
    try {
      setSavingTopic(true)
      await updateTopic(editTopicModal.id, editTopicForm)
      setTopics(prev => prev.map(t =>
        t.id === editTopicModal.id ? { ...t, ...editTopicForm } : t
      ))
      setEditTopicModal(null)
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSavingTopic(false)
    }
  }

  const handleDeleteTopic = async (topicId) => {
    if (!confirm('이 주제를 삭제하시겠습니까?')) return
    try {
      await deleteTopic(topicId)
      setTopics(prev => prev.filter(t => t.id !== topicId))
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  // ==================== Add Topic ====================
  const handleAddTopicOpen = (partId) => {
    setAddTopicPartId(partId)
    setAddTopicForm({ title: '', assignedPerson: '', presentationDate: '' })
  }

  const handleAddTopicSave = async () => {
    if (!addTopicForm.title.trim()) return alert('주제명을 입력해주세요.')
    if (!addTopicForm.assignedPerson.trim()) return alert('담당자를 입력해주세요.')
    try {
      setSavingTopic(true)
      const partTopics = getPartTopics(addTopicPartId)
      const maxOrder = partTopics.length > 0 ? Math.max(...partTopics.map(t => t.order)) : 0
      const newId = await addTopic({ ...addTopicForm, partId: addTopicPartId, order: maxOrder + 1 })
      setTopics(prev => [...prev, {
        id: newId, ...addTopicForm, partId: addTopicPartId,
        order: maxOrder + 1, fileUrl: null, fileName: null, storagePath: null, uploadedAt: null
      }])
      setAddTopicPartId(null)
    } catch {
      alert('추가에 실패했습니다.')
    } finally {
      setSavingTopic(false)
    }
  }

  // ==================== File Upload ====================
  const handleUploadOpen = (topic) => {
    const fresh = topics.find(t => t.id === topic.id) || topic
    setUploadModal(fresh)
    setSelectedFile(null)
  }

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0])
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return alert('파일을 선택해주세요.')
    try {
      setUploading(true)
      const result = await uploadTopicFile(uploadModal.id, selectedFile, uploadModal.storagePath)
      setTopics(prev => prev.map(t => t.id === uploadModal.id ? { ...t, ...result } : t))
      setUploadModal(null)
      setSelectedFile(null)
    } catch {
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async () => {
    if (!confirm('파일을 삭제하시겠습니까?')) return
    try {
      setUploading(true)
      await deleteTopicFile(uploadModal.id, uploadModal.storagePath)
      setTopics(prev => prev.map(t =>
        t.id === uploadModal.id
          ? { ...t, fileUrl: null, fileName: null, storagePath: null, uploadedAt: null }
          : t
      ))
      setUploadModal(null)
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const closeUploadModal = () => { setUploadModal(null); setSelectedFile(null) }

  const handleDownload = (topic) => {
    if (topic.fileUrl) window.open(topic.fileUrl, '_blank')
  }

  // ==================== Render ====================
  if (loading) {
    return (
      <div className="pub-page">
        <div className="pub-loading">데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="pub-page">

      {/* ── Page Header ── */}
      <div className="pub-page-header">
        <div>
          <h1 className="page-title">글 파일로 올리기</h1>
          <p className="pub-subtitle">2026 출판 프로젝트 진도 현황</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="btn btn-sm btn-secondary" onClick={expandAll}>모두 열기</button>
          <button className="btn btn-sm btn-secondary" onClick={collapseAll}>모두 닫기</button>
          <button
            className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={handleEditClick}
          >
            {editMode ? '편집 완료' : '편집'}
          </button>
        </div>
      </div>

      {/* ── Overall Progress ── */}
      <div className="pub-overall">
        <CircularProgress value={completedTopics} total={totalTopics} />
        <div className="pub-overall-right">
          <div className="pub-overall-count">
            <span className="pub-overall-done">{completedTopics}</span>
            <span className="pub-overall-sep"> / {totalTopics}</span>
            <span className="pub-overall-label"> 제출 완료</span>
          </div>
          <div className="pub-part-chips">
            {parts.map(part => {
              const s = getPartStats(part.id)
              return (
                <div key={part.id} className={`pub-part-chip ${s.pct === 100 ? 'chip-complete' : ''}`}>
                  <span className="pub-part-chip-name">{part.name}</span>
                  <span className="pub-part-chip-pct">{s.pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Parts ── */}
      {parts.map(part => {
        const partTopics = getPartTopics(part.id)
        const stats = getPartStats(part.id)
        const isEditingThis = editingPartId === part.id
        const isCollapsed = collapsedParts.has(part.id)

        return (
          <div key={part.id} className={`pub-part ${stats.pct === 100 ? 'part-complete' : ''}`}>

            {/* Part Header */}
            <div className="pub-part-header">
              {isEditingThis ? (
                <div className="pub-part-edit-row">
                  <input
                    className="form-input pub-input-sm"
                    value={editingPartForm.name}
                    onChange={e => setEditingPartForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="파트명"
                  />
                  <input
                    className="form-input pub-input-sm pub-input-wide"
                    value={editingPartForm.displayName}
                    onChange={e => setEditingPartForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="부제목"
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handlePartEditSave(part.id)}>
                    <Check size={14} style={{ marginRight: '2px' }} />저장
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingPartId(null)}>
                    취소
                  </button>
                </div>
              ) : (
                <div className="pub-part-title-row">
                  <span className="pub-part-name">{part.name}</span>
                  <span className="pub-part-dot">·</span>
                  <span className="pub-part-display">{part.displayName}</span>
                  {editMode && (
                    <button className="pub-icon-btn" onClick={() => handlePartEditStart(part)} title="파트명 수정">
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    className="pub-collapse-btn"
                    onClick={() => togglePart(part.id)}
                    title={isCollapsed ? '펼치기' : '접기'}
                  >
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>
              )}

              <div className="pub-part-progress-row">
                <span className={`pub-part-count ${stats.pct === 100 ? 'count-complete' : ''}`}>
                  {stats.done}/{stats.total}
                </span>
                <div className="pub-progress-track">
                  <div
                    className={`pub-progress-fill ${stats.pct === 100 ? 'fill-complete' : ''}`}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
                <span className="pub-part-pct">{stats.pct}%</span>
                {stats.pct === 100 && <span className="pub-complete-badge">완성</span>}
              </div>
            </div>

            {/* Topic Table */}
            {!isCollapsed && <div className="pub-table-wrap">
              <table className="pub-table">
                <thead>
                  <tr>
                    <th className="th-date">날짜</th>
                    <th className="th-title">주제</th>
                    <th className="th-person">담당</th>
                    <th className="th-status">상태</th>
                    {editMode && <th className="th-actions"></th>}
                  </tr>
                </thead>
                <tbody>
                  {partTopics.map(topic => (
                    <tr key={topic.id} className={topic.fileUrl ? 'tr-done' : 'tr-pending'}>
                      <td className="td-date">{formatDate(topic.presentationDate)}</td>
                      <td className="td-title">{topic.title}</td>
                      <td className="td-person">{topic.assignedPerson}</td>
                      <td className="td-status">
                        {topic.fileUrl ? (
                          <button
                            className="pub-status-done"
                            onClick={() => handleUploadOpen(topic)}
                            title={topic.fileName}
                          >
                            <Check size={12} />완료
                          </button>
                        ) : (
                          <button
                            className="pub-status-pending"
                            onClick={() => handleUploadOpen(topic)}
                          >
                            <Upload size={12} />업로드
                          </button>
                        )}
                      </td>
                      {editMode && (
                        <td className="td-actions">
                          <button className="pub-icon-btn" onClick={() => handleEditTopicOpen(topic)} title="수정">
                            <Pencil size={13} />
                          </button>
                          <button className="pub-icon-btn pub-icon-danger" onClick={() => handleDeleteTopic(topic.id)} title="삭제">
                            <X size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {editMode && (
                <button className="pub-add-topic-btn" onClick={() => handleAddTopicOpen(part.id)}>
                  <Plus size={14} style={{ marginRight: '4px' }} />주제 추가
                </button>
              )}
            </div>}
          </div>
        )
      })}

      {/* ══════════ Modals ══════════ */}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>편집 모드</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">관리자 비밀번호</label>
                <input
                  type="password" className="form-input"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="비밀번호를 입력하세요"
                  autoFocus
                />
                {passwordError && <p className="form-error">{passwordError}</p>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handlePasswordSubmit}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload / File Management Modal */}
      {uploadModal && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{uploadModal.assignedPerson} 님의 글</h3>
                <p className="pub-modal-subtitle">{uploadModal.title}</p>
              </div>
              <button className="close-btn" onClick={closeUploadModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {uploadModal.fileUrl && (
                <div className="file-info-card">
                  <FileText size={28} className="text-primary" />
                  <div className="file-details">
                    <p className="file-name-large">{uploadModal.fileName}</p>
                    <p className="file-date">
                      {topics.find(t => t.id === uploadModal.id)?.uploadedAt
                        ? new Date(topics.find(t => t.id === uploadModal.id).uploadedAt).toLocaleDateString('ko-KR') + ' 업로드됨'
                        : '업로드됨'}
                    </p>
                  </div>
                </div>
              )}
              {uploadModal.fileUrl && <p className="pub-reupload-text">파일 교체</p>}
              <div
                className="file-drop-area"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="file-selected">
                    <FileText size={22} className="text-primary" />
                    <span className="file-name">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload size={22} className="text-secondary" />
                    <span className="drop-text">파일 선택 또는 드래그</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden-input" onChange={handleFileSelect} />
              </div>
            </div>
            <div className="modal-footer space-between">
              <div style={{ display: 'flex', gap: '8px' }}>
                {uploadModal.fileUrl && (
                  <button className="btn btn-secondary" onClick={() => handleDownload(uploadModal)}>
                    <Download size={14} style={{ marginRight: '4px' }} />다운로드
                  </button>
                )}
                {uploadModal.fileUrl && (
                  <button className="btn pub-btn-danger-text" onClick={handleFileDelete} disabled={uploading}>삭제</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={closeUploadModal}>닫기</button>
                {selectedFile && (
                  <button className="btn btn-primary" onClick={handleFileUpload} disabled={uploading}>
                    {uploading ? '업로드 중...' : '등록'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      {editTopicModal && (
        <div className="modal-overlay" onClick={() => setEditTopicModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>주제 수정</h3>
              <button className="close-btn" onClick={() => setEditTopicModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">주제명 <span className="required">*</span></label>
                <input type="text" className="form-input"
                  value={editTopicForm.title}
                  onChange={e => setEditTopicForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="주제명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label className="form-label">담당자 <span className="required">*</span></label>
                <input type="text" className="form-input"
                  value={editTopicForm.assignedPerson}
                  onChange={e => setEditTopicForm(f => ({ ...f, assignedPerson: e.target.value }))}
                  placeholder="담당자 이름"
                />
              </div>
              <div className="form-group">
                <label className="form-label">발제 날짜</label>
                <input type="date" className="form-input"
                  value={editTopicForm.presentationDate}
                  onChange={e => setEditTopicForm(f => ({ ...f, presentationDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditTopicModal(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleEditTopicSave} disabled={savingTopic}>
                {savingTopic ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {addTopicPartId && (
        <div className="modal-overlay" onClick={() => setAddTopicPartId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>주제 추가</h3>
              <button className="close-btn" onClick={() => setAddTopicPartId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">주제명 <span className="required">*</span></label>
                <input type="text" className="form-input"
                  value={addTopicForm.title}
                  onChange={e => setAddTopicForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="주제명을 입력하세요"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">담당자 <span className="required">*</span></label>
                <input type="text" className="form-input"
                  value={addTopicForm.assignedPerson}
                  onChange={e => setAddTopicForm(f => ({ ...f, assignedPerson: e.target.value }))}
                  placeholder="담당자 이름"
                />
              </div>
              <div className="form-group">
                <label className="form-label">발제 날짜</label>
                <input type="date" className="form-input"
                  value={addTopicForm.presentationDate}
                  onChange={e => setAddTopicForm(f => ({ ...f, presentationDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddTopicPartId(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleAddTopicSave} disabled={savingTopic}>
                {savingTopic ? '저장 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
