import { useState, useRef, useEffect } from 'react'
import { Lock, Plus, Edit3, Trash2, Save, X, Search, Users, Upload, FileSpreadsheet, Loader, Download, UserCheck, ChevronUp, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  addMembersBatch,
  verifyMembersPassword
} from '../services/memberService'
import './MembersPage.css'

function MembersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    school: '',
    phone: '',
    role: ''
  })
  const [tableExpanded, setTableExpanded] = useState(true)
  const [showExcelUpload, setShowExcelUpload] = useState(false)
  const [excelFileName, setExcelFileName] = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [isDraggingExcel, setIsDraggingExcel] = useState(false)
  const fileInputRef = useRef(null)

  // 회원 목록 불러오기
  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const data = await getMembers()
      setMembers(data)
    } catch (error) {
      console.error('회원 목록 불러오기 실패:', error)
      alert('회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 인증 후 회원 목록 불러오기
  useEffect(() => {
    if (isAuthenticated) {
      loadMembers()
    }
  }, [isAuthenticated])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const isValid = await verifyMembersPassword(password)
      if (isValid) {
        setIsAuthenticated(true)
        setPasswordError('')
      } else {
        setPasswordError('비밀번호가 일치하지 않습니다.')
      }
    } catch (error) {
      setPasswordError('인증 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMembers = members.filter(m =>
    m.name.includes(searchTerm) ||
    m.region.includes(searchTerm) ||
    m.school.includes(searchTerm) ||
    m.role.includes(searchTerm)
  )

  const handleAdd = () => {
    setIsAdding(true)
    setFormData({ name: '', region: '', school: '', phone: '', role: '' })
  }

  const handleEdit = (member) => {
    setEditingId(member.id)
    setFormData({
      name: member.name,
      region: member.region,
      school: member.school,
      phone: member.phone,
      role: member.role
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('성함을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      if (isAdding) {
        await addMember(formData)
        setIsAdding(false)
      } else if (editingId) {
        await updateMember(editingId, formData)
        setEditingId(null)
      }
      setFormData({ name: '', region: '', school: '', phone: '', role: '' })
      await loadMembers() // 목록 새로고침
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', region: '', school: '', phone: '', role: '' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('이 회원을 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await deleteMember(id)
        await loadMembers() // 목록 새로고침
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 엑셀 업로드 핸들러
  const handleExcelFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setExcelFileName(file.name)
      setExcelFile(file)
    }
  }

  const handleExcelDrop = (e) => {
    e.preventDefault()
    setIsDraggingExcel(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setExcelFileName(file.name)
      setExcelFile(file)
    }
  }

  const handleExcelUpload = async () => {
    if (!excelFile) {
      alert('엑셀 파일을 선택해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const data = await excelFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // 첫 번째 행이 헤더인지 확인 (성함, 지역, 학교명, 전화번호, 역할)
      const startRow = jsonData[0]?.some(cell =>
        typeof cell === 'string' && (cell.includes('성함') || cell.includes('이름') || cell.includes('지역'))
      ) ? 1 : 0

      const membersToAdd = []
      for (let i = startRow; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row && row[0]) { // 이름이 있는 행만
          membersToAdd.push({
            name: String(row[0] || '').trim(),
            region: String(row[1] || '').trim(),
            school: String(row[2] || '').trim(),
            phone: String(row[3] || '').trim(),
            role: String(row[4] || '').trim()
          })
        }
      }

      if (membersToAdd.length === 0) {
        alert('추가할 회원 데이터가 없습니다.')
        return
      }

      await addMembersBatch(membersToAdd)
      alert(`${membersToAdd.length}명의 회원이 추가되었습니다.`)

      setShowExcelUpload(false)
      setExcelFileName('')
      setExcelFile(null)
      await loadMembers() // 목록 새로고침
    } catch (error) {
      console.error('엑셀 업로드 오류:', error)
      alert('엑셀 파일 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExcelCancel = () => {
    setShowExcelUpload(false)
    setExcelFileName('')
    setExcelFile(null)
  }

  // 템플릿 다운로드 (xlsx 형식으로 생성)
  const handleDownloadTemplate = () => {
    const templateData = [
      ['성함', '지역', '학교명', '전화번호', '역할'],
      ['홍길동', '서울', '서울초등학교', '010-1234-5678', '출판']
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '회원목록')
    XLSX.writeFile(wb, '회원등록_템플릿.xlsx')
  }

  // 비밀번호 인증 화면
  if (!isAuthenticated) {
    return (
      <div className="members-page">
        <div className="auth-container">
          <div className="auth-icon">
            <Lock size={48} />
          </div>
          <h2>인원현황 접근</h2>
          <p>개인정보 보호를 위해 비밀번호를 입력해주세요.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="auth-input"
              autoFocus
            />
            {passwordError && <p className="auth-error">{passwordError}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? '확인 중...' : '확인'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="members-page">
      <div className="page-header">
        <h2 className="page-title">인원현황</h2>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="이름, 지역, 학교, 역할 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={() => setShowExcelUpload(true)}>
            <Upload size={18} />
            엑셀 업로드
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            회원 추가
          </button>
        </div>
      </div>

      {/* 엑셀 업로드 폼 */}
      {showExcelUpload && (
        <div className="excel-upload-form">
          <div className="excel-upload-header">
            <FileSpreadsheet size={20} />
            <h3>엑셀 파일로 회원 일괄 등록</h3>
          </div>
          <p className="excel-upload-desc">
            엑셀 파일 형식: 성함, 지역, 학교명, 전화번호, 역할 순서로 작성해주세요.
            <button className="template-download-btn" onClick={handleDownloadTemplate}>
              <Download size={14} />
              템플릿 다운로드
            </button>
          </p>
          <div className="excel-upload-input">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              onChange={handleExcelFileSelect}
              style={{ display: 'none' }}
            />
            <div
              className={`file-select-box${isDraggingExcel ? ' dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDraggingExcel(true) }}
              onDragLeave={() => setIsDraggingExcel(false)}
              onDrop={handleExcelDrop}
            >
              {excelFileName ? (
                <span className="file-name">{excelFileName}</span>
              ) : (
                <span className="file-placeholder">
                  {isDraggingExcel ? '여기에 놓으세요' : '파일을 선택하거나 드래그하세요 (.xlsx, .xls, .csv)'}
                </span>
              )}
            </div>
            <button className="btn btn-browse" onClick={() => fileInputRef.current?.click()}>
              찾아보기
            </button>
          </div>
          <div className="excel-upload-actions">
            <button className="btn btn-cancel" onClick={handleExcelCancel}>취소</button>
            <button className="btn btn-primary" onClick={handleExcelUpload}>
              <Upload size={16} />
              업로드
            </button>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="stats-cards">
        <div className="stat-card">
          <Users size={24} />
          <div className="stat-info">
            <div className="stat-value">{members.length}</div>
            <div className="stat-label">전체 회원</div>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <div className="stat-value">{members.filter(m => m.role).length}</div>
            <div className="stat-label">역할 배정</div>
          </div>
        </div>
      </div>

      <div className="members-table-wrapper">
        {isLoading && !isAdding && !editingId ? (
          <div className="loading-overlay">
            <Loader size={24} />
            <span>불러오는 중...</span>
          </div>
        ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th></th>
              <th>성함</th>
              <th>지역/학교명</th>
              <th>전화번호</th>
              <th>비고 (역할)</th>
              <th>관리</th>
              <th className="toggle-col">
                <button className="icon-btn toggle-table" onClick={() => setTableExpanded(!tableExpanded)}>
                  {tableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </th>
            </tr>
          </thead>
          {tableExpanded && (
          <tbody>
            {isAdding && (
              <tr className="adding-row">
                <td className="center">-</td>
                <td>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="성함"
                    className="table-input"
                  />
                </td>
                <td>
                  <div className="region-school-input">
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      placeholder="지역"
                      className="table-input small"
                    />
                    <span>/</span>
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) => setFormData({...formData, school: e.target.value})}
                      placeholder="학교명"
                      className="table-input"
                    />
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="010-0000-0000"
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="역할"
                    className="table-input"
                  />
                </td>
                <td className="actions-cell">
                  <div className="actions-inner">
                    <button className="icon-btn save" onClick={handleSave}><Save size={16} /></button>
                    <button className="icon-btn cancel" onClick={handleCancel}><X size={16} /></button>
                  </div>
                </td>
                <td></td>
              </tr>
            )}
            {filteredMembers.map((member, index) => (
              editingId === member.id ? (
                <tr key={member.id} className="editing-row">
                  <td className="center">{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <div className="region-school-input">
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                        className="table-input small"
                      />
                      <span>/</span>
                      <input
                        type="text"
                        value={formData.school}
                        onChange={(e) => setFormData({...formData, school: e.target.value})}
                        className="table-input"
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="table-input"
                    />
                  </td>
                  <td className="actions-cell">
                    <div className="actions-inner">
                      <button className="icon-btn save" onClick={handleSave}><Save size={16} /></button>
                      <button className="icon-btn cancel" onClick={handleCancel}><X size={16} /></button>
                    </div>
                  </td>
                  <td></td>
                </tr>
              ) : (
                <tr key={member.id} className="member-row">
                  <td className="center">{index + 1}</td>
                  <td className="name-cell">{member.name}</td>
                  <td>{member.region}/{member.school}</td>
                  <td>{member.phone}</td>
                  <td>
                    {member.role && <span className="role-badge">{member.role}</span>}
                  </td>
                  <td className="actions-cell">
                    <div className="actions-inner">
                      <button className="icon-btn edit" onClick={() => handleEdit(member)}><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(member.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                  <td></td>
                </tr>
              )
            ))}
          </tbody>
          )}
        </table>
        )}
      </div>

      {filteredMembers.length === 0 && !isAdding && !isLoading && (
        <div className="empty-state">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default MembersPage
