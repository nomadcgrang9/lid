import { useState, useEffect, useRef } from 'react'
import { Plus, X, Calendar, MapPin, Upload, Image, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import {
  getAlbums,
  addAlbum,
  updateAlbum,
  deleteAlbum,
  uploadPhotos
} from '../services/photoService'
import './PhotosPage.css'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_PHOTOS = 20

function PhotosPage() {
  const [albums, setAlbums] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentAlbum, setCurrentAlbum] = useState(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    place: '',
    title: '',
    memo: '',
    photos: [] // { url, path, name, size } 또는 File 객체
  })
  const [newFiles, setNewFiles] = useState([]) // 새로 추가된 파일들
  const fileInputRef = useRef(null)

  // 앨범 목록 불러오기
  const loadAlbums = async () => {
    setIsLoading(true)
    try {
      const data = await getAlbums()
      setAlbums(data)
    } catch (error) {
      console.error('앨범 목록 불러오기 실패:', error)
      alert('앨범 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlbums()
  }, [])

  const handleUploadClick = () => {
    setIsUploading(true)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      place: '',
      title: '',
      memo: '',
      photos: []
    })
    setNewFiles([])
  }

  const handleEdit = (album) => {
    setEditingId(album.id)
    setFormData({
      date: album.date,
      place: album.place,
      title: album.title,
      memo: album.memo || '',
      photos: album.photos || []
    })
    setNewFiles([])
  }

  const handleSave = async () => {
    if (!formData.date || !formData.place || !formData.title) {
      alert('날짜, 장소, 활동명은 필수 입력입니다.')
      return
    }

    setIsSaving(true)
    try {
      if (isUploading) {
        // 새 앨범 생성
        const albumId = await addAlbum({
          date: formData.date,
          place: formData.place,
          title: formData.title,
          memo: formData.memo,
          photos: []
        })

        // 사진 업로드
        if (newFiles.length > 0) {
          const uploadedPhotos = await uploadPhotos(newFiles, albumId)
          await updateAlbum(albumId, { photos: uploadedPhotos })
        }

        alert('앨범이 생성되었습니다.')
        setIsUploading(false)
      } else if (editingId) {
        // 기존 사진 유지 + 새 사진 업로드
        let allPhotos = [...formData.photos]

        if (newFiles.length > 0) {
          const uploadedPhotos = await uploadPhotos(newFiles, editingId)
          allPhotos = [...allPhotos, ...uploadedPhotos]
        }

        await updateAlbum(editingId, {
          date: formData.date,
          place: formData.place,
          title: formData.title,
          memo: formData.memo,
          photos: allPhotos
        })

        alert('앨범이 수정되었습니다.')
        setEditingId(null)
      }

      setFormData({ date: '', place: '', title: '', memo: '', photos: [] })
      setNewFiles([])
      await loadAlbums()
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsUploading(false)
    setEditingId(null)
    setFormData({ date: '', place: '', title: '', memo: '', photos: [] })
    setNewFiles([])
  }

  const handleDelete = async (album) => {
    if (window.confirm('이 앨범을 삭제하시겠습니까? 모든 사진도 함께 삭제됩니다.')) {
      setIsLoading(true)
      try {
        const photoUrls = (album.photos || []).map(p => p.path).filter(Boolean)
        await deleteAlbum(album.id, photoUrls)
        await loadAlbums()
      } catch (error) {
        console.error('삭제 오류:', error)
        alert('삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)

    // 파일 크기 검증
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}은 20MB를 초과합니다.`)
        return false
      }
      return true
    })

    // 최대 개수 검증
    const totalCount = formData.photos.length + newFiles.length + validFiles.length
    if (totalCount > MAX_PHOTOS) {
      alert(`최대 ${MAX_PHOTOS}장까지 업로드 가능합니다.`)
      return
    }

    setNewFiles([...newFiles, ...validFiles])

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveExistingPhoto = (index) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  const handleRemoveNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const openLightbox = (album, photoIndex) => {
    setCurrentAlbum(album)
    setCurrentPhotoIndex(photoIndex)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setCurrentAlbum(null)
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    if (currentAlbum && currentPhotoIndex < currentAlbum.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  return (
    <div className="photos-page">
      <div className="page-header">
        <h1 className="page-title">활동 사진</h1>
        <button className="btn btn-primary" onClick={handleUploadClick}>
          <Plus size={18} />
          사진 업로드
        </button>
      </div>

      {/* 업로드/수정 폼 */}
      {(isUploading || editingId) && (
        <div className="upload-form">
          <h3>{isUploading ? '새 앨범 업로드' : '앨범 수정'}</h3>
          <div className="form-grid">
            <div className="field-group">
              <label>활동일 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>장소 *</label>
              <input
                type="text"
                placeholder="예: 옛날농장"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              />
            </div>
            <div className="field-group full-width">
              <label>활동명 *</label>
              <input
                type="text"
                placeholder="예: 1학기 오프라인 모임"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="field-group full-width">
              <label>메모 (선택)</label>
              <input
                type="text"
                placeholder="간단한 메모를 입력하세요"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              />
            </div>
          </div>

          <div className="photo-upload-section">
            <label>사진 (최대 {MAX_PHOTOS}장, 각 20MB 이하)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
            <div className="photo-preview-grid">
              {/* 기존 사진 (수정 모드) */}
              {formData.photos.map((photo, index) => (
                <div key={`existing-${index}`} className="photo-preview-item">
                  {photo.url ? (
                    <img src={photo.url} alt={`사진 ${index + 1}`} />
                  ) : (
                    <div className="photo-placeholder">
                      <Image size={24} />
                      <span>{index + 1}</span>
                    </div>
                  )}
                  <button
                    className="remove-photo-btn"
                    onClick={() => handleRemoveExistingPhoto(index)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* 새로 추가된 파일 */}
              {newFiles.map((file, index) => (
                <div key={`new-${index}`} className="photo-preview-item new-file">
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                  <button
                    className="remove-photo-btn"
                    onClick={() => handleRemoveNewFile(index)}
                  >
                    <X size={14} />
                  </button>
                  <span className="new-badge">NEW</span>
                </div>
              ))}

              {/* 추가 버튼 */}
              {formData.photos.length + newFiles.length < MAX_PHOTOS && (
                <button
                  className="add-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={24} />
                  <span>사진 추가</span>
                </button>
              )}
            </div>
            <p className="photo-count">
              선택된 사진: {formData.photos.length + newFiles.length}장
              {newFiles.length > 0 && ` (새로 추가: ${newFiles.length}장)`}
            </p>
          </div>

          <div className="form-actions">
            <button className="btn btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader size={16} className="spinning" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {isUploading ? '업로드' : '저장'}
                </>
              )}
            </button>
            <button className="btn btn-cancel" onClick={handleCancel} disabled={isSaving}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="loading-overlay">
          <Loader size={24} className="spinning" />
          <span>불러오는 중...</span>
        </div>
      )}

      {/* 앨범 목록 */}
      {!isLoading && (
        <div className="albums-list">
          {albums.map((album) => (
            <div key={album.id} className="album-card">
              <div className="album-photos" onClick={() => album.photos?.length > 0 && openLightbox(album, 0)}>
                {album.photos && album.photos.length > 0 ? (
                  <div className="album-photo">
                    <img src={album.photos[0].url} alt={album.title} />
                    {album.photos.length > 1 && (
                      <div className="more-overlay">
                        +{album.photos.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="album-photo">
                    <div className="photo-placeholder">
                      <Image size={64} />
                      <span>사진 없음</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="album-footer">
                <div className="album-meta">
                  <div>
                    <Calendar size={14} />
                    <span>{formatDate(album.date)}</span>
                  </div>
                  <div>
                    <MapPin size={14} />
                    <span>{album.place}</span>
                  </div>
                </div>
                <h3 className="album-title">{album.title}</h3>
                {album.memo && <p className="album-memo">{album.memo}</p>}
                <div className="photo-count">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={14} />
                    <span>{(album.photos || []).length}장</span>
                  </div>
                  <div className="album-menu-wrapper" style={{ position: 'relative' }}>
                    <button
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === album.id ? null : album.id)
                      }}
                    >
                      ⋮
                    </button>
                    {openMenuId === album.id && (
                      <>
                        <div
                          className="menu-backdrop"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="album-dropdown-menu">
                          <button
                            className="menu-item edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              handleEdit(album)
                            }}
                          >
                            수정
                          </button>
                          <button
                            className="menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              handleDelete(album)
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {albums.length === 0 && !isUploading && (
            <div className="empty-state">
              <Image size={48} />
              <p>아직 업로드된 사진이 없습니다.</p>
              <button className="btn btn-primary" onClick={handleUploadClick}>
                <Plus size={18} />
                첫 앨범 업로드하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 라이트박스 */}
      {lightboxOpen && currentAlbum && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <X size={24} />
            </button>
            <div className="lightbox-header">
              <span>{formatDate(currentAlbum.date)}</span>
              <span>{currentAlbum.place}</span>
              <span>{currentAlbum.title}</span>
            </div>
            <div className="lightbox-main">
              <button
                className="lightbox-nav prev"
                onClick={prevPhoto}
                disabled={currentPhotoIndex === 0}
              >
                <ChevronLeft size={32} />
              </button>
              <div className="lightbox-image">
                {currentAlbum.photos[currentPhotoIndex]?.url ? (
                  <img
                    src={currentAlbum.photos[currentPhotoIndex].url}
                    alt={`사진 ${currentPhotoIndex + 1}`}
                  />
                ) : (
                  <div className="photo-placeholder large">
                    <Image size={64} />
                    <span>사진 {currentPhotoIndex + 1}</span>
                  </div>
                )}
              </div>
              <button
                className="lightbox-nav next"
                onClick={nextPhoto}
                disabled={currentPhotoIndex === currentAlbum.photos.length - 1}
              >
                <ChevronRight size={32} />
              </button>
            </div>
            <div className="lightbox-indicator">
              {currentAlbum.photos.map((_, index) => (
                <span
                  key={index}
                  className={`indicator-dot ${index === currentPhotoIndex ? 'active' : ''}`}
                  onClick={() => setCurrentPhotoIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotosPage
