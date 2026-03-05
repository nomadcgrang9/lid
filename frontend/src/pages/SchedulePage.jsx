import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit3, Trash2, Save, X, ChevronDown, ChevronUp, Loader, Upload, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  getAllSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule
} from '../services/scheduleService'
import './SchedulePage.css'

function SchedulePage() {
  const [schedules, setSchedules] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()))
  const [expandedId, setExpandedId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [continuousAdd, setContinuousAdd] = useState(false)
  const fileInputRef = useRef(null)
  const [isDraggingExcel, setIsDraggingExcel] = useState(false)
  const [formData, setFormData] = useState({
    round: '',
    date: '',
    topic: '',
    presenter: '',
    recorder: '',
    meetingNote: '',
    attendees: ''
  })

  // 연도 유효성 검증 (2021 ~ 2040)
  const MIN_YEAR = 2021
  const MAX_YEAR = 2040

  const isValidYear = (year) => {
    const num = Number(year)
    return !isNaN(num) && num >= MIN_YEAR && num <= MAX_YEAR
  }

  // 연도 입력 처리
  const handleYearInputChange = (e) => {
    setYearInput(e.target.value)
  }

  const handleYearInputBlur = () => {
    if (isValidYear(yearInput)) {
      setSelectedYear(Number(yearInput))
    } else {
      // 유효하지 않으면 현재 선택된 연도로 복원
      setYearInput(String(selectedYear))
    }
  }

  const handleYearInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isValidYear(yearInput)) {
        setSelectedYear(Number(yearInput))
      } else {
        alert(`${MIN_YEAR}년부터 ${MAX_YEAR}년 사이의 연도를 입력해주세요.`)
        setYearInput(String(selectedYear))
      }
    }
  }

  // 일정 목록 불러오기
  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const data = await getAllSchedules()
      setSchedules(data)
    } catch (error) {
      console.error('일정 목록 불러오기 실패:', error)
      alert('일정 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  // 모달 열림/닫힘 시 body 스크롤 제어
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const filteredSchedules = schedules
    .filter(s => s.year === selectedYear)
    .sort((a, b) => a.round - b.round)

  const resetForm = () => {
    setFormData({
      round: '',
      date: '',
      topic: '',
      presenter: '',
      recorder: '',
      meetingNote: '',
      attendees: ''
    })
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      round: filteredSchedules.length + 1,
      date: '',
      topic: '',
      presenter: '',
      recorder: '',
      meetingNote: '',
      attendees: ''
    })
    setIsModalOpen(true)
  }

  const handleEdit = (schedule) => {
    setEditingId(schedule.id)
    setFormData({
      round: schedule.round,
      date: schedule.date,
      topic: schedule.topic,
      presenter: schedule.presenter || '',
      recorder: schedule.recorder || '',
      meetingNote: schedule.meetingNote || '',
      attendees: schedule.attendees || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.date || !formData.topic) {
      alert('일자와 주제는 필수 입력입니다.')
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updateSchedule(editingId, formData)
        setEditingId(null)
        setIsModalOpen(false)
        resetForm()
      } else {
        await addSchedule({
          year: selectedYear,
          ...formData
        })

        if (continuousAdd) {
          // 연속 추가 모드: 폼 초기화하고 모달 유지
          setFormData({
            round: Number(formData.round) + 1,
            date: '',
            topic: '',
            presenter: '',
            recorder: '',
            meetingNote: '',
            attendees: ''
          })
        } else {
          setIsModalOpen(false)
          resetForm()
        }
      }
      await loadSchedules()
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setContinuousAdd(false)
    resetForm()
  }

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '회차': 1,
        '일자': '4월3일',
        '주제': '주제를 입력하세요',
        '진행/발표': '홍길동',
        '기록자': '김철수',
        '모임기록': '모임 내용을 입력하세요',
        '참석자': '홍길동, 김철수, 이영희'
      },
      {
        '회차': 2,
        '일자': '5월1일',
        '주제': '두번째 주제',
        '진행/발표': '김철수',
        '기록자': '이영희',
        '모임기록': '',
        '참석자': ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '일정목록')

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 8 },   // 회차
      { wch: 12 },  // 일자
      { wch: 40 },  // 주제
      { wch: 15 },  // 진행/발표
      { wch: 10 },  // 기록자
      { wch: 50 },  // 모임기록
      { wch: 30 }   // 참석자
    ]

    XLSX.writeFile(wb, `일정_템플릿_${selectedYear}.xlsx`)
  }

  // 엑셀 파일 업로드 처리
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    await processExcelFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processExcelFile = async (file) => {

    setIsLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.')
        return
      }

      // 데이터 검증 및 변환
      const schedulesToAdd = jsonData.map((row, index) => ({
        round: Number(row['회차']) || index + 1,
        date: String(row['일자'] || ''),
        topic: String(row['주제'] || ''),
        presenter: String(row['진행/발표'] || ''),
        recorder: String(row['기록자'] || ''),
        meetingNote: String(row['모임기록'] || ''),
        attendees: String(row['참석자'] || '')
      })).filter(s => s.date && s.topic) // 필수 필드 검증

      if (schedulesToAdd.length === 0) {
        alert('유효한 일정 데이터가 없습니다. 일자와 주제는 필수입니다.')
        return
      }

      // 일괄 추가
      for (const schedule of schedulesToAdd) {
        await addSchedule({
          year: selectedYear,
          ...schedule
        })
      }

      alert(`${schedulesToAdd.length}개의 일정이 추가되었습니다.`)
      await loadSchedules()
    } catch (error) {
      console.error('엑셀 업로드 오류:', error)
      alert('엑셀 파일 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await deleteSchedule(id)
        await loadSchedules()
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h2 className="page-title">일정 및 내용기록</h2>
        <div className="header-actions">
          <div className="year-input-wrapper">
            <input
              type="number"
              className="year-input"
              value={yearInput}
              onChange={handleYearInputChange}
              onBlur={handleYearInputBlur}
              onKeyDown={handleYearInputKeyDown}
              min={MIN_YEAR}
              max={MAX_YEAR}
            />
            <span className="year-suffix">년</span>
          </div>
          <div
            className={`excel-buttons${isDraggingExcel ? ' dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDraggingExcel(true) }}
            onDragLeave={() => setIsDraggingExcel(false)}
            onDrop={e => {
              e.preventDefault()
              setIsDraggingExcel(false)
              const file = e.dataTransfer.files[0]
              if (file) processExcelFile(file)
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button className="btn btn-outline" onClick={handleDownloadTemplate}>
              <Download size={16} />
              템플릿
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              {isDraggingExcel ? '놓으세요' : '엑셀 업로드'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            일정 추가
          </button>
        </div>
      </div>

      <div className="schedule-table-wrapper">
        {isLoading ? (
          <div className="loading-overlay">
            <Loader size={24} className="spinning" />
            <span>불러오는 중...</span>
          </div>
        ) : (
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="col-round">회차</th>
                <th className="col-date">일자</th>
                <th className="col-topic">주제 및 내용기록</th>
                <th className="col-presenter">진행/발표</th>
                <th className="col-recorder">기록자</th>
                <th className="col-actions">내용기록</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <React.Fragment key={schedule.id}>
                  <tr className={`schedule-row ${expandedId === schedule.id ? 'expanded' : ''}`} onClick={() => toggleExpand(schedule.id)}>
                    <td className="center">{schedule.round}</td>
                    <td className="date-cell">{schedule.date}</td>
                    <td className="topic-cell">
                      <div className="topic-wrapper">
                        <span className="topic-text">{schedule.topic?.replace(/[\r\n]+/g, ' ')}</span>
                        {(schedule.meetingNote || schedule.attendees || schedule.topic?.includes('\n')) && (
                          <span className="expand-icon">
                            {expandedId === schedule.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="presenter-cell" title={schedule.presenter}>{schedule.presenter}</td>
                    <td className="recorder-cell">{schedule.recorder}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn edit" onClick={() => handleEdit(schedule)}><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(schedule.id)}><Trash2 size={16} /></button>
                    </td>
                    {/* 모바일용 확장 내용 - 카드 내부 */}
                    {expandedId === schedule.id && (
                      <td className="mobile-expanded-content">
                        <div className="expanded-card">
                          {schedule.topic?.includes('\n') && (
                            <div className="expanded-section">
                              <div className="section-header">
                                <span className="section-icon">📌</span>
                                <span className="section-title">주제 상세</span>
                              </div>
                              <pre className="meeting-note">{schedule.topic}</pre>
                            </div>
                          )}
                          {schedule.meetingNote && (
                            <div className="expanded-section">
                              <div className="section-header">
                                <span className="section-icon">📋</span>
                                <span className="section-title">모임 기록</span>
                              </div>
                              <pre className="meeting-note">{schedule.meetingNote}</pre>
                            </div>
                          )}
                          {schedule.attendees && (
                            <div className="expanded-section attendees-section">
                              <div className="section-header">
                                <span className="section-icon">👥</span>
                                <span className="section-title">참석자</span>
                              </div>
                              <span className="attendees-list">{schedule.attendees}</span>
                            </div>
                          )}
                          {!schedule.meetingNote && !schedule.attendees && !schedule.topic?.includes('\n') && (
                            <p className="no-content">기록된 내용이 없습니다.</p>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {/* 데스크톱용 확장 행 */}
                  {expandedId === schedule.id && (
                    <tr className="expanded-row desktop-only">
                      <td colSpan={6}>
                        <div className="expanded-content">
                          <div className="expanded-card">
                            {schedule.topic?.includes('\n') && (
                              <div className="expanded-section">
                                <div className="section-header">
                                  <span className="section-icon">📌</span>
                                  <span className="section-title">주제 상세</span>
                                </div>
                                <pre className="meeting-note">{schedule.topic}</pre>
                              </div>
                            )}
                            {schedule.meetingNote && (
                              <div className="expanded-section">
                                <div className="section-header">
                                  <span className="section-icon">📋</span>
                                  <span className="section-title">모임 기록</span>
                                </div>
                                <pre className="meeting-note">{schedule.meetingNote}</pre>
                              </div>
                            )}
                            {schedule.attendees && (
                              <div className="expanded-section attendees-section">
                                <div className="section-header">
                                  <span className="section-icon">👥</span>
                                  <span className="section-title">참석자</span>
                                </div>
                                <span className="attendees-list">{schedule.attendees}</span>
                              </div>
                            )}
                            {!schedule.meetingNote && !schedule.attendees && !schedule.topic?.includes('\n') && (
                              <p className="no-content">기록된 내용이 없습니다.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredSchedules.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>등록된 일정이 없습니다.</p>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            첫 일정 추가하기
          </button>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '일정 수정' : '일정 추가'}</h3>
              <button className="modal-close" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group round">
                  <label>회차 *</label>
                  <input
                    type="number"
                    value={formData.round}
                    onChange={(e) => setFormData({...formData, round: e.target.value})}
                    placeholder="회차"
                  />
                </div>
                <div className="form-group">
                  <label>일자 *</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    placeholder="예: 4월3일"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>진행/발표</label>
                  <input
                    type="text"
                    value={formData.presenter}
                    onChange={(e) => setFormData({...formData, presenter: e.target.value})}
                    placeholder="진행자, 발표자"
                  />
                </div>
                <div className="form-group recorder">
                  <label>기록자</label>
                  <input
                    type="text"
                    value={formData.recorder}
                    onChange={(e) => setFormData({...formData, recorder: e.target.value})}
                    placeholder="기록자"
                  />
                </div>
              </div>
              <div className="form-group full">
                <label>주제 *</label>
                <textarea
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="주제를 입력하세요"
                  rows={2}
                />
              </div>
              <div className="form-group full">
                <label>참석자</label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                  placeholder="예: 홍길동, 김철수, 이영희"
                />
              </div>
              <div className="form-group full">
                <label>모임 기록</label>
                <textarea
                  value={formData.meetingNote}
                  onChange={(e) => setFormData({...formData, meetingNote: e.target.value})}
                  placeholder="모임 내용을 자유롭게 기록하세요..."
                  rows={6}
                />
              </div>
            </div>
            <div className="modal-footer">
              {!editingId && (
                <label className="continuous-add-checkbox">
                  <input
                    type="checkbox"
                    checked={continuousAdd}
                    onChange={(e) => setContinuousAdd(e.target.checked)}
                  />
                  <span>연속 추가</span>
                </label>
              )}
              <div className="modal-actions">
                <button className="btn btn-cancel" onClick={handleCancel} disabled={isSaving}>
                  취소
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader size={16} className="spinning" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? '수정' : '저장'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulePage
