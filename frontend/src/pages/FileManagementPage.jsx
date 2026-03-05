import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronDown, Download, Trash2, FileText, File, Image, Table, Loader2, RefreshCw } from 'lucide-react'
import { getAllUploadedFiles, deleteFiles, checkFileDeletePasswordEnabled } from '../services/fileManagementService'
import FileDeletePasswordModal from '../components/modals/FileDeletePasswordModal'
import './FileManagementPage.css'

function FileManagementPage() {
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('전체')
  const [sortBy, setSortBy] = useState('최신순')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  // 삭제 모달 관련 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const typeOptions = ['전체', '법령/지침', '통계자료', '기타']
  const sortOptions = ['최신순', '오래된순', '파일명순', '크기순']

  // 파일 목록 로드
  const loadFiles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const loadedFiles = await getAllUploadedFiles()
      setFiles(loadedFiles)
    } catch (err) {
      console.error('파일 목록 로드 오류:', err)
      setError('파일 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  // 날짜 포맷팅
  const formatDate = (date) => {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  // 파일 아이콘 반환
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText size={18} />
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <Table size={18} />
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image size={18} />
      default:
        return <File size={18} />
    }
  }

  // 필터링 및 정렬된 파일 목록
  const filteredFiles = useMemo(() => {
    let result = [...files]

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(file =>
        file.fileName.toLowerCase().includes(query) ||
        file.uploadedBy.toLowerCase().includes(query)
      )
    }

    // 유형 필터
    if (selectedType !== '전체') {
      result = result.filter(file => file.category === selectedType)
    }

    // 정렬
    switch (sortBy) {
      case '최신순':
        result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        break
      case '오래된순':
        result.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
        break
      case '파일명순':
        result.sort((a, b) => a.fileName.localeCompare(b.fileName, 'ko'))
        break
      case '크기순':
        result.sort((a, b) => b.fileSize - a.fileSize)
        break
      default:
        break
    }

    return result
  }, [files, searchQuery, selectedType, sortBy])

  // 전체 선택 / 해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFiles(filteredFiles.map(f => f.id))
    } else {
      setSelectedFiles([])
    }
  }

  // 개별 선택
  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId)
      } else {
        return [...prev, fileId]
      }
    })
  }

  // 더블클릭 다운로드
  const handleDoubleClick = (file) => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank')
    }
  }

  // 일괄 다운로드
  const handleBulkDownload = () => {
    if (selectedFiles.length === 0) {
      alert('다운로드할 파일을 선택해주세요.')
      return
    }

    const selectedFilesData = files.filter(f => selectedFiles.includes(f.id))
    selectedFilesData.forEach(file => {
      if (file.downloadUrl) {
        window.open(file.downloadUrl, '_blank')
      }
    })
  }

  // 선택 삭제 버튼 클릭
  const handleBulkDeleteClick = async () => {
    if (selectedFiles.length === 0) {
      alert('삭제할 파일을 선택해주세요.')
      return
    }

    // 비밀번호 보호 활성화 여부 확인
    const isPasswordEnabled = await checkFileDeletePasswordEnabled()

    if (isPasswordEnabled) {
      setIsDeleteModalOpen(true)
    } else {
      // 비밀번호 비활성화 시 바로 삭제 확인
      if (window.confirm(`선택된 ${selectedFiles.length}개 파일을 삭제하시겠습니까?`)) {
        executeDelete()
      }
    }
  }

  // 실제 삭제 실행
  const executeDelete = async () => {
    setIsDeleting(true)
    setIsDeleteModalOpen(false)

    try {
      const pathsToDelete = files
        .filter(f => selectedFiles.includes(f.id))
        .map(f => f.storagePath)

      const result = await deleteFiles(pathsToDelete)

      if (result.succeeded > 0) {
        alert(`${result.succeeded}개 파일이 삭제되었습니다.`)
        setSelectedFiles([])
        await loadFiles() // 목록 새로고침
      }

      if (result.failed > 0) {
        alert(`${result.failed}개 파일 삭제에 실패했습니다.`)
      }
    } catch (err) {
      console.error('파일 삭제 오류:', err)
      alert('파일 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 드롭다운 외부 클릭 시 닫기
  const handleClickOutside = () => {
    setIsTypeDropdownOpen(false)
    setIsSortDropdownOpen(false)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="file-management-page">
        <div className="page-header">
          <h1 className="page-title">업로드 파일 관리</h1>
        </div>
        <div className="loading-state">
          <Loader2 size={32} className="spinner-icon" />
          <p>파일 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="file-management-page">
        <div className="page-header">
          <h1 className="page-title">업로드 파일 관리</h1>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={loadFiles}>
            <RefreshCw size={16} />
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="file-management-page" onClick={handleClickOutside}>
      <div className="page-header">
        <h1 className="page-title">업로드 파일 관리</h1>
        <button className="refresh-btn" onClick={loadFiles} title="새로고침">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="file-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="파일명 또는 올린이로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          {/* 유형 드롭다운 */}
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className="dropdown-btn"
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen)
                setIsSortDropdownOpen(false)
              }}
            >
              {selectedType}
              <ChevronDown size={16} className={isTypeDropdownOpen ? 'rotate' : ''} />
            </button>
            {isTypeDropdownOpen && (
              <div className="dropdown-menu">
                {typeOptions.map(option => (
                  <button
                    key={option}
                    className={`dropdown-item ${selectedType === option ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType(option)
                      setIsTypeDropdownOpen(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 정렬 드롭다운 */}
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className="dropdown-btn"
              onClick={() => {
                setIsSortDropdownOpen(!isSortDropdownOpen)
                setIsTypeDropdownOpen(false)
              }}
            >
              {sortBy}
              <ChevronDown size={16} className={isSortDropdownOpen ? 'rotate' : ''} />
            </button>
            {isSortDropdownOpen && (
              <div className="dropdown-menu">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    className={`dropdown-item ${sortBy === option ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(option)
                      setIsSortDropdownOpen(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 파일 테이블 */}
      <div className="file-table-wrapper">
        <table className="file-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={filteredFiles.length > 0 && selectedFiles.length === filteredFiles.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>파일명</th>
              <th>유형</th>
              <th>크기</th>
              <th>날짜</th>
              <th>올린이</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {searchQuery || selectedType !== '전체'
                    ? '검색 결과가 없습니다.'
                    : '업로드된 파일이 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredFiles.map(file => (
                <tr
                  key={file.id}
                  className={selectedFiles.includes(file.id) ? 'selected' : ''}
                  onDoubleClick={() => handleDoubleClick(file)}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleSelectFile(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="filename-col">
                    <div className="filename-content">
                      <span className="file-icon">{getFileIcon(file.fileType)}</span>
                      <span className="filename">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="type-col">{file.category}</td>
                  <td className="size-col">{formatFileSize(file.fileSize)}</td>
                  <td className="date-col">{formatDate(file.uploadedAt)}</td>
                  <td className="uploader-col">{file.uploadedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 액션 영역 */}
      <div className="file-actions">
        <span className="selection-count">선택: {selectedFiles.length}개</span>
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleBulkDownload}
            disabled={selectedFiles.length === 0}
          >
            <Download size={16} />
            일괄 다운로드
          </button>
          <button
            className="btn btn-danger"
            onClick={handleBulkDeleteClick}
            disabled={selectedFiles.length === 0 || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinner-icon" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                선택 삭제
              </>
            )}
          </button>
        </div>
      </div>

      {/* 삭제 비밀번호 모달 */}
      <FileDeletePasswordModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        fileCount={selectedFiles.length}
      />
    </div>
  )
}

export default FileManagementPage
