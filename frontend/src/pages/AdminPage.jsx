import { useState, useEffect } from 'react'
import { Lock, Plus, Trash2, Edit3, Loader2, Key, Save, X, Home, Upload, Link, CreditCard, ChevronDown, FolderOpen, FileText, PenLine, Download, Bot, Video, FolderX } from 'lucide-react'
import { getCategories, addCategory, deleteCategory, getArticles, deleteArticle, updateArticle } from '../services/articleService'
import { getPagePasswords, updateMembersPassword, updateZoomPassword, getLandingSettings, updateLandingSetting, getWriteGuide, updateWriteGuide, uploadLandingImage, getExampleArticle, uploadExampleArticle, deleteExampleArticle, getEntrancePassword, updateEntrancePassword, getAiPrompts, updateAiPrompt, resetAiPromptToDefault } from '../services/memberService'
import { getFileDeletePassword, updateFileDeletePassword } from '../services/fileManagementService'
import './AdminPage.css'

const verifyAdminPassword = (password) => password === 'wpehqnsrhk1217!'

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // 비밀번호 관리
  const [pagePasswords, setPagePasswords] = useState({ members: '', zoom: '' })
  const [editingPassword, setEditingPassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // 글 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [editFormData, setEditFormData] = useState({ title: '', authorName: '', category: '' })
  const [isSavingArticle, setIsSavingArticle] = useState(false)

  // 랜딩페이지 설정
  const [landingSettings, setLandingSettings] = useState({
    introLine1: '짜임새 있는 기획과 새로운 네트워크로',
    introLine2: '현장을 바꾸는 사람들,',
    introLine3: '제도혁신 SINCE 2022',
    accountBank: '카카오뱅크',
    accountNumber: '79421308150',
    donationLink: '',
    landingImageUrl: '',
    zoomUrl: '',
    zoomPassword: ''
  })
  const [editingLanding, setEditingLanding] = useState(null)
  const [landingEditValue, setLandingEditValue] = useState('')
  const [isSavingLanding, setIsSavingLanding] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // 글쓰기 가이드 설정
  const [writeGuide, setWriteGuide] = useState('')
  const [isEditingWriteGuide, setIsEditingWriteGuide] = useState(false)
  const [writeGuideEditValue, setWriteGuideEditValue] = useState('')
  const [isSavingWriteGuide, setIsSavingWriteGuide] = useState(false)

  // 예시글 설정
  const [exampleArticle, setExampleArticle] = useState(null)
  const [isUploadingExample, setIsUploadingExample] = useState(false)

  // 입장 비밀번호 설정
  const [entrancePasswordSettings, setEntrancePasswordSettings] = useState({
    enabled: false,
    password: ''
  })
  const [isEditingEntrancePassword, setIsEditingEntrancePassword] = useState(false)
  const [entrancePasswordEditData, setEntrancePasswordEditData] = useState({
    enabled: false,
    password: ''
  })
  const [isSavingEntrancePassword, setIsSavingEntrancePassword] = useState(false)

  // AI 프롬프트 설정
  const [aiPrompts, setAiPrompts] = useState({
    articleGeneration: ''
  })
  const [isEditingAiPrompt, setIsEditingAiPrompt] = useState(false)
  const [aiPromptEditValue, setAiPromptEditValue] = useState('')
  const [isSavingAiPrompt, setIsSavingAiPrompt] = useState(false)

  // 파일 삭제 비밀번호 설정
  const [fileDeletePasswordSettings, setFileDeletePasswordSettings] = useState({
    enabled: true,
    password: 'wpehqnsrhk1217!'
  })
  const [isEditingFileDeletePassword, setIsEditingFileDeletePassword] = useState(false)
  const [fileDeletePasswordEditData, setFileDeletePasswordEditData] = useState({
    enabled: true,
    password: ''
  })
  const [isSavingFileDeletePassword, setIsSavingFileDeletePassword] = useState(false)

  // 아코디언 상태
  const [openSection, setOpenSection] = useState(null)

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section)
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    setLoading(true)
    try {
      const [categoriesData, articlesData, passwordsData, landingData, writeGuideData, exampleArticleData, entrancePasswordData, aiPromptsData, fileDeletePasswordData] = await Promise.all([
        getCategories(),
        getArticles(),
        getPagePasswords(),
        getLandingSettings(),
        getWriteGuide(),
        getExampleArticle(),
        getEntrancePassword(),
        getAiPrompts(),
        getFileDeletePassword()
      ])
      setCategories(categoriesData)
      setArticles(articlesData)
      setPagePasswords(passwordsData)
      setLandingSettings(landingData)
      setWriteGuide(writeGuideData)
      setExampleArticle(exampleArticleData)
      setEntrancePasswordSettings(entrancePasswordData)
      setAiPrompts(aiPromptsData)
      setFileDeletePasswordSettings(fileDeletePasswordData)
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (verifyAdminPassword(password)) {
      setIsAuthenticated(true)
      setPasswordError('')
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다.')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    if (categories.some(cat => cat.name === newCategory.trim())) {
      alert('이미 존재하는 카테고리입니다.')
      return
    }

    setIsAddingCategory(true)
    try {
      await addCategory(newCategory.trim())
      await loadData()
      setNewCategory('')
    } catch (error) {
      console.error('카테고리 추가 오류:', error)
      alert('카테고리 추가에 실패했습니다.')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return

    try {
      await deleteCategory(categoryId)
      await loadData()
    } catch (error) {
      console.error('카테고리 삭제 오류:', error)
      alert('카테고리 삭제에 실패했습니다.')
    }
  }

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('정말로 이 글을 삭제하시겠습니까?')) return

    try {
      await deleteArticle(articleId)
      await loadData()
    } catch (error) {
      console.error('글 삭제 오류:', error)
      alert('글 삭제에 실패했습니다.')
    }
  }

  const handleEditArticle = (article) => {
    setEditingArticle(article)
    setEditFormData({
      title: article.title || '',
      authorName: article.authorName || '',
      category: article.category || ''
    })
    setIsEditModalOpen(true)
  }

  const handleSaveArticle = async () => {
    if (!editFormData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setIsSavingArticle(true)
    try {
      await updateArticle(editingArticle.id, {
        title: editFormData.title.trim(),
        authorName: editFormData.authorName.trim(),
        category: editFormData.category
      })
      await loadData()
      setIsEditModalOpen(false)
      setEditingArticle(null)
      alert('글이 수정되었습니다.')
    } catch (error) {
      console.error('글 수정 오류:', error)
      alert('글 수정에 실패했습니다.')
    } finally {
      setIsSavingArticle(false)
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingArticle(null)
    setEditFormData({ title: '', authorName: '', category: '' })
  }

  // 비밀번호 관리 핸들러
  const handleEditPassword = (key) => {
    setEditingPassword(key)
    setNewPassword(pagePasswords[key])
  }

  const handleSavePassword = async (key) => {
    if (!newPassword.trim()) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    setIsSavingPassword(true)
    try {
      if (key === 'members') {
        await updateMembersPassword(newPassword.trim())
      } else if (key === 'zoom') {
        await updateZoomPassword(newPassword.trim())
      }
      setPagePasswords({ ...pagePasswords, [key]: newPassword.trim() })
      setEditingPassword(null)
      setNewPassword('')
      alert('비밀번호가 변경되었습니다.')
    } catch (error) {
      console.error('비밀번호 저장 오류:', error)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleCancelPassword = () => {
    setEditingPassword(null)
    setNewPassword('')
  }

  // 랜딩페이지 설정 핸들러
  const handleEditLanding = (key) => {
    setEditingLanding(key)
    setLandingEditValue(landingSettings[key])
  }

  const handleSaveLanding = async (key) => {
    setIsSavingLanding(true)
    try {
      await updateLandingSetting(key, landingEditValue)
      setLandingSettings({ ...landingSettings, [key]: landingEditValue })
      setEditingLanding(null)
      setLandingEditValue('')
      alert('설정이 저장되었습니다.')
    } catch (error) {
      console.error('랜딩페이지 설정 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingLanding(false)
    }
  }

  const handleCancelLanding = () => {
    setEditingLanding(null)
    setLandingEditValue('')
  }

  // 랜딩페이지 이미지 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setIsUploadingImage(true)
    try {
      const imageUrl = await uploadLandingImage(file)
      setLandingSettings({ ...landingSettings, landingImageUrl: imageUrl })
      alert('이미지가 성공적으로 업로드되었습니다.')
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingImage(false)
      // 파일 input 초기화
      e.target.value = ''
    }
  }

  // 글쓰기 가이드 핸들러
  const handleEditWriteGuide = () => {
    setIsEditingWriteGuide(true)
    setWriteGuideEditValue(writeGuide)
  }

  const handleSaveWriteGuide = async () => {
    setIsSavingWriteGuide(true)
    try {
      await updateWriteGuide(writeGuideEditValue)
      setWriteGuide(writeGuideEditValue)
      setIsEditingWriteGuide(false)
      setWriteGuideEditValue('')
      alert('글쓰기 가이드가 저장되었습니다.')
    } catch (error) {
      console.error('글쓰기 가이드 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingWriteGuide(false)
    }
  }

  const handleCancelWriteGuide = () => {
    setIsEditingWriteGuide(false)
    setWriteGuideEditValue('')
  }

  // 입장 비밀번호 핸들러
  const handleEditEntrancePassword = () => {
    setIsEditingEntrancePassword(true)
    setEntrancePasswordEditData({ ...entrancePasswordSettings })
  }

  const handleSaveEntrancePassword = async () => {
    if (entrancePasswordEditData.enabled && !entrancePasswordEditData.password.trim()) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    setIsSavingEntrancePassword(true)
    try {
      await updateEntrancePassword(
        entrancePasswordEditData.enabled,
        entrancePasswordEditData.password.trim()
      )
      setEntrancePasswordSettings(entrancePasswordEditData)
      setIsEditingEntrancePassword(false)
      alert('입장 비밀번호 설정이 저장되었습니다.')
    } catch (error) {
      console.error('입장 비밀번호 설정 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingEntrancePassword(false)
    }
  }

  const handleCancelEntrancePassword = () => {
    setIsEditingEntrancePassword(false)
    setEntrancePasswordEditData({ ...entrancePasswordSettings })
  }

  // AI 프롬프트 핸들러
  const handleEditAiPrompt = () => {
    setIsEditingAiPrompt(true)
    setAiPromptEditValue(aiPrompts.articleGeneration)
  }

  const handleSaveAiPrompt = async () => {
    setIsSavingAiPrompt(true)
    try {
      await updateAiPrompt('articleGeneration', aiPromptEditValue)
      setAiPrompts({ ...aiPrompts, articleGeneration: aiPromptEditValue })
      setIsEditingAiPrompt(false)
      alert('AI 지침이 저장되었습니다.')
    } catch (error) {
      console.error('AI 지침 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingAiPrompt(false)
    }
  }

  const handleCancelAiPrompt = () => {
    setIsEditingAiPrompt(false)
    setAiPromptEditValue('')
  }

  const handleResetAiPrompt = async () => {
    if (!window.confirm('AI 지침을 기본값으로 초기화하시겠습니까?')) return

    setIsSavingAiPrompt(true)
    try {
      await resetAiPromptToDefault('articleGeneration')
      const updatedPrompts = await getAiPrompts()
      setAiPrompts(updatedPrompts)
      setAiPromptEditValue(updatedPrompts.articleGeneration)
      alert('기본값으로 초기화되었습니다.')
    } catch (error) {
      console.error('AI 지침 초기화 오류:', error)
      alert('초기화에 실패했습니다.')
    } finally {
      setIsSavingAiPrompt(false)
    }
  }

  // 파일 삭제 비밀번호 핸들러
  const handleEditFileDeletePassword = () => {
    setIsEditingFileDeletePassword(true)
    setFileDeletePasswordEditData({ ...fileDeletePasswordSettings })
  }

  const handleSaveFileDeletePassword = async () => {
    if (fileDeletePasswordEditData.enabled && !fileDeletePasswordEditData.password.trim()) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    setIsSavingFileDeletePassword(true)
    try {
      await updateFileDeletePassword(
        fileDeletePasswordEditData.enabled,
        fileDeletePasswordEditData.password.trim()
      )
      setFileDeletePasswordSettings(fileDeletePasswordEditData)
      setIsEditingFileDeletePassword(false)
      alert('파일 삭제 비밀번호 설정이 저장되었습니다.')
    } catch (error) {
      console.error('파일 삭제 비밀번호 설정 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSavingFileDeletePassword(false)
    }
  }

  const handleCancelFileDeletePassword = () => {
    setIsEditingFileDeletePassword(false)
    setFileDeletePasswordEditData({ ...fileDeletePasswordSettings })
  }

  // 예시글 핸들러
  const handleExampleArticleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setIsUploadingExample(true)
    try {
      await uploadExampleArticle(file)
      const updatedArticle = await getExampleArticle()
      setExampleArticle(updatedArticle)
      alert('예시글이 성공적으로 업로드되었습니다.')
    } catch (error) {
      console.error('예시글 업로드 오류:', error)
      alert('예시글 업로드에 실패했습니다.')
    } finally {
      setIsUploadingExample(false)
      e.target.value = ''
    }
  }

  const handleDeleteExampleArticle = async () => {
    if (!window.confirm('정말로 예시글을 삭제하시겠습니까?')) return

    try {
      await deleteExampleArticle()
      setExampleArticle(null)
      alert('예시글이 삭제되었습니다.')
    } catch (error) {
      console.error('예시글 삭제 오류:', error)
      alert('예시글 삭제에 실패했습니다.')
    }
  }

  const handleDownloadExampleArticle = () => {
    if (exampleArticle && exampleArticle.fileUrl) {
      window.open(exampleArticle.fileUrl, '_blank')
    }
  }


  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace('.', '')
  }

  const passwordLabels = {
    members: '인원현황',
    zoom: '줌 미팅 다시보기'
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="login-icon">
            <Lock size={48} />
          </div>
          <h2>관리자 인증</h2>
          <p>관리자 비밀번호를 입력해주세요.</p>

          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="login-input"
              autoFocus
            />
            {passwordError && <p className="login-error">{passwordError}</p>}
            <button type="submit" className="btn btn-primary btn-full">
              확인
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-state">
          <Loader2 size={32} className="spinner-icon" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 className="page-title">관리자 설정</h2>
      </div>

      {/* 랜딩페이지 설정 */}
      <section className={`admin-section accordion ${openSection === 'landing' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('landing')}>
          <div className="accordion-title">
            <Home size={20} />
            <span>랜딩페이지 설정</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          {/* 대표 이미지 */}
          <div className="landing-subsection">
            <h4 className="subsection-title">
              <Upload size={16} />
              대표 이미지
            </h4>
            <div className="image-upload-area">
              <div className="current-image-preview">
                <img
                  src={landingSettings.landingImageUrl || "/picture/lidmember.png"}
                  alt="현재 대표 이미지"
                />
              </div>
              <div className="image-upload-controls">
                <p className="image-hint">
                  {landingSettings.landingImageUrl ? '업로드된 이미지 사용 중' : '현재: 기본 이미지 (lidmember.png)'}
                </p>
                <label className={`upload-btn ${isUploadingImage ? 'uploading' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      이미지 변경
                    </>
                  )}
                </label>
                <p className="image-note">* 5MB 이하의 이미지 파일만 업로드 가능</p>
              </div>
            </div>
          </div>

          {/* 소개 문구 */}
          <div className="landing-subsection">
            <h4 className="subsection-title">소개 문구</h4>
            <div className="landing-list">
              {[
                { key: 'introLine1', label: '첫 번째 줄' },
                { key: 'introLine2', label: '두 번째 줄' },
                { key: 'introLine3', label: '세 번째 줄' }
              ].map(({ key, label }) => (
                <div key={key} className="landing-item">
                  <div className="landing-info">
                    <span className="landing-label">{label}</span>
                    {editingLanding === key ? (
                      <input
                        type="text"
                        value={landingEditValue}
                        onChange={(e) => setLandingEditValue(e.target.value)}
                        className="landing-input"
                        autoFocus
                      />
                    ) : (
                      <span className="landing-value">{landingSettings[key]}</span>
                    )}
                  </div>
                  <div className="landing-actions">
                    {editingLanding === key ? (
                      <>
                        <button className="icon-btn save" onClick={() => handleSaveLanding(key)} disabled={isSavingLanding}>
                          {isSavingLanding ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                        </button>
                        <button className="icon-btn cancel" onClick={handleCancelLanding} disabled={isSavingLanding}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn edit" onClick={() => handleEditLanding(key)}>
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 회비 계좌 정보 */}
          <div className="landing-subsection">
            <h4 className="subsection-title">
              <CreditCard size={16} />
              회비 계좌 정보
            </h4>
            <div className="landing-list">
              {[
                { key: 'accountBank', label: '은행명' },
                { key: 'accountNumber', label: '계좌번호' }
              ].map(({ key, label }) => (
                <div key={key} className="landing-item">
                  <div className="landing-info">
                    <span className="landing-label">{label}</span>
                    {editingLanding === key ? (
                      <input
                        type="text"
                        value={landingEditValue}
                        onChange={(e) => setLandingEditValue(e.target.value)}
                        className="landing-input"
                        autoFocus
                      />
                    ) : (
                      <span className="landing-value">{landingSettings[key] || '(미설정)'}</span>
                    )}
                  </div>
                  <div className="landing-actions">
                    {editingLanding === key ? (
                      <>
                        <button className="icon-btn save" onClick={() => handleSaveLanding(key)} disabled={isSavingLanding}>
                          {isSavingLanding ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                        </button>
                        <button className="icon-btn cancel" onClick={handleCancelLanding} disabled={isSavingLanding}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn edit" onClick={() => handleEditLanding(key)}>
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 후원 링크 */}
          <div className="landing-subsection">
            <h4 className="subsection-title">
              <Link size={16} />
              후원 링크
            </h4>
            <div className="landing-list">
              <div className="landing-item">
                <div className="landing-info">
                  <span className="landing-label">후원 페이지 URL</span>
                  {editingLanding === 'donationLink' ? (
                    <input
                      type="text"
                      value={landingEditValue}
                      onChange={(e) => setLandingEditValue(e.target.value)}
                      className="landing-input wide"
                      placeholder="https://..."
                      autoFocus
                    />
                  ) : (
                    <span className="landing-value">{landingSettings.donationLink || '(미설정)'}</span>
                  )}
                </div>
                <div className="landing-actions">
                  {editingLanding === 'donationLink' ? (
                    <>
                      <button className="icon-btn save" onClick={() => handleSaveLanding('donationLink')} disabled={isSavingLanding}>
                        {isSavingLanding ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                      </button>
                      <button className="icon-btn cancel" onClick={handleCancelLanding} disabled={isSavingLanding}>
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button className="icon-btn edit" onClick={() => handleEditLanding('donationLink')}>
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 줌 미팅 정보 */}
          <div className="landing-subsection">
            <h4 className="subsection-title">
              <Video size={16} />
              줌 미팅 정보
            </h4>
            <div className="landing-list">
              {[
                { key: 'zoomUrl', label: '미팅 주소 (URL)' },
                { key: 'zoomPassword', label: '미팅 비밀번호' }
              ].map(({ key, label }) => (
                <div key={key} className="landing-item">
                  <div className="landing-info">
                    <span className="landing-label">{label}</span>
                    {editingLanding === key ? (
                      <input
                        type="text"
                        value={landingEditValue}
                        onChange={(e) => setLandingEditValue(e.target.value)}
                        className="landing-input wide"
                        placeholder={key === 'zoomUrl' ? 'https://...' : '비밀번호'}
                        autoFocus
                      />
                    ) : (
                      <span className="landing-value">{landingSettings[key] || '(미설정)'}</span>
                    )}
                  </div>
                  <div className="landing-actions">
                    {editingLanding === key ? (
                      <>
                        <button className="icon-btn save" onClick={() => handleSaveLanding(key)} disabled={isSavingLanding}>
                          {isSavingLanding ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                        </button>
                        <button className="icon-btn cancel" onClick={handleCancelLanding} disabled={isSavingLanding}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn edit" onClick={() => handleEditLanding(key)}>
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 입장 비밀번호 설정 */}
      <section className={`admin-section accordion ${openSection === 'entrance_password' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('entrance_password')}>
          <div className="accordion-title">
            <Key size={20} />
            <span>입장 비밀번호 설정</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="entrance-password-section">
            <p className="section-description">
              전체 애플리케이션 접근을 제한하는 입장 비밀번호를 설정합니다.
              활성화 시 모든 사용자가 첫 접속 시 비밀번호를 입력해야 합니다.
            </p>

            {isEditingEntrancePassword ? (
              <div className="entrance-password-edit">
                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={entrancePasswordEditData.enabled}
                      onChange={(e) => setEntrancePasswordEditData({
                        ...entrancePasswordEditData,
                        enabled: e.target.checked
                      })}
                      className="toggle-checkbox"
                    />
                    <span>입장 비밀번호 기능 활성화</span>
                  </label>
                </div>

                {entrancePasswordEditData.enabled && (
                  <div className="form-group">
                    <label>비밀번호</label>
                    <input
                      type="text"
                      value={entrancePasswordEditData.password}
                      onChange={(e) => setEntrancePasswordEditData({
                        ...entrancePasswordEditData,
                        password: e.target.value
                      })}
                      placeholder="입장 비밀번호를 입력하세요"
                      className="form-input"
                    />
                  </div>
                )}

                <div className="entrance-password-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveEntrancePassword}
                    disabled={isSavingEntrancePassword}
                  >
                    {isSavingEntrancePassword ? (
                      <Loader2 size={16} className="spinner-icon" />
                    ) : (
                      <Save size={16} />
                    )}
                    저장
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelEntrancePassword}
                    disabled={isSavingEntrancePassword}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="entrance-password-view">
                <div className="entrance-password-status">
                  <div className="status-item">
                    <span className="status-label">상태:</span>
                    <span className={`status-badge ${entrancePasswordSettings.enabled ? 'active' : 'inactive'}`}>
                      {entrancePasswordSettings.enabled ? '활성화' : '비활성화'}
                    </span>
                  </div>
                  {entrancePasswordSettings.enabled && (
                    <div className="status-item">
                      <span className="status-label">비밀번호:</span>
                      <span className="status-value">{entrancePasswordSettings.password}</span>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleEditEntrancePassword}
                >
                  <Edit3 size={16} />
                  수정
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI 글쓰기 지침 설정 */}
      <section className={`admin-section accordion ${openSection === 'ai_prompts' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('ai_prompts')}>
          <div className="accordion-title">
            <Bot size={20} />
            <span>AI 글쓰기 지침</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="ai-prompt-section">
            <p className="section-description">
              AI에게 어떻게 글을 쓰라고 지시할지 설정합니다.
              아래 내용을 자유롭게 수정할 수 있습니다.
            </p>

            {isEditingAiPrompt ? (
              <div className="ai-prompt-edit">
                <div className="prompt-hints">
                  <h4 className="hints-title">💡 자동으로 채워지는 태그 (대괄호 안)</h4>
                  <div className="hints-grid">
                    <div className="hint-item">
                      <strong>[분량지침]</strong>
                      <span>사용자가 선택한 분량 (예: A4 10~12쪽)</span>
                    </div>
                    <div className="hint-item">
                      <strong>[사용자주제]</strong>
                      <span>사용자가 입력한 주제</span>
                    </div>
                    <div className="hint-item">
                      <strong>[사용자사례]</strong>
                      <span>사용자가 입력한 경험/사례</span>
                    </div>
                    <div className="hint-item">
                      <strong>[PDF내용]</strong>
                      <span>업로드한 PDF에서 추출된 법령</span>
                    </div>
                    <div className="hint-item">
                      <strong>[근거자료내용]</strong>
                      <span>업로드한 근거자료 내용</span>
                    </div>
                    <div className="hint-item">
                      <strong>[구조적문제점]</strong>
                      <span>사용자가 입력한 문제점</span>
                    </div>
                    <div className="hint-item">
                      <strong>[대안제시]</strong>
                      <span>사용자가 입력한 대안</span>
                    </div>
                  </div>
                </div>

                <textarea
                  value={aiPromptEditValue}
                  onChange={(e) => setAiPromptEditValue(e.target.value)}
                  className="ai-prompt-textarea"
                  rows={20}
                  placeholder="AI 프롬프트를 입력하세요..."
                />

                <div className="ai-prompt-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveAiPrompt}
                    disabled={isSavingAiPrompt}
                  >
                    {isSavingAiPrompt ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                    저장
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelAiPrompt}
                    disabled={isSavingAiPrompt}
                  >
                    취소
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleResetAiPrompt}
                    disabled={isSavingAiPrompt}
                  >
                    기본값으로
                  </button>
                </div>
              </div>
            ) : (
              <div className="ai-prompt-view">
                <div className="prompt-display">
                  <pre className="prompt-text">{aiPrompts.articleGeneration}</pre>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleEditAiPrompt}>
                  <Edit3 size={16} />
                  수정
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 글쓰기 탭 가이드 설정 */}
      <section className={`admin-section accordion ${openSection === 'writeGuide' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('writeGuide')}>
          <div className="accordion-title">
            <PenLine size={20} />
            <span>글쓰기 탭 사용 방법</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="write-guide-section">
            <p className="section-description">글쓰기 탭 상단에 표시되는 안내 문구를 설정합니다.</p>
            {isEditingWriteGuide ? (
              <div className="write-guide-edit">
                <textarea
                  value={writeGuideEditValue}
                  onChange={(e) => setWriteGuideEditValue(e.target.value)}
                  className="write-guide-textarea"
                  rows={4}
                  autoFocus
                />
                <div className="write-guide-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSaveWriteGuide} disabled={isSavingWriteGuide}>
                    {isSavingWriteGuide ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                    저장
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleCancelWriteGuide} disabled={isSavingWriteGuide}>
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="write-guide-view">
                <div className="write-guide-preview">
                  <p>{writeGuide || '(설정된 내용 없음)'}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleEditWriteGuide}>
                  <Edit3 size={16} />
                  수정
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 예시글 관리 */}
      <section className={`admin-section accordion ${openSection === 'exampleArticle' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('exampleArticle')}>
          <div className="accordion-title">
            <FileText size={20} />
            <span>새글작성 예시글 업로드</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="example-article-section">
            <p className="section-description">글쓰기 페이지 상단에 표시될 예시글을 업로드합니다. (PDF, HWP 등)</p>

            {exampleArticle ? (
              <div className="example-article-view">
                <div className="example-article-info">
                  <FileText size={32} className="text-primary" />
                  <div className="example-article-details">
                    <p className="example-article-name">{exampleArticle.fileName}</p>
                    <p className="example-article-date">
                      {exampleArticle.uploadedAt?.toDate ?
                        exampleArticle.uploadedAt.toDate().toLocaleDateString('ko-KR') :
                        '날짜 정보 없음'}
                    </p>
                  </div>
                </div>
                <div className="example-article-actions">
                  <button className="btn btn-secondary btn-sm" onClick={handleDownloadExampleArticle}>
                    <Download size={16} />
                    다운로드
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteExampleArticle}>
                    <Trash2 size={16} />
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="example-article-upload">
                <p className="upload-description">아직 업로드된 예시글이 없습니다.</p>
                <label className="btn btn-primary btn-sm">
                  {isUploadingExample ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      파일 업로드
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleExampleArticleUpload}
                    style={{ display: 'none' }}
                    disabled={isUploadingExample}
                    accept=".pdf,.hwp,.hwpx,.doc,.docx"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 비밀번호 관리 */}
      <section className={`admin-section accordion ${openSection === 'password' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('password')}>
          <div className="accordion-title">
            <Key size={20} />
            <span>페이지 비밀번호 관리</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="password-list">
            {Object.entries(pagePasswords).map(([key, value]) => (
              <div key={key} className="password-item">
                <div className="password-info">
                  <span className="password-label">{passwordLabels[key]}</span>
                  {editingPassword === key ? (
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="password-input"
                      autoFocus
                    />
                  ) : (
                    <span className="password-value">{value}</span>
                  )}
                </div>
                <div className="password-actions">
                  {editingPassword === key ? (
                    <>
                      <button className="icon-btn save" onClick={() => handleSavePassword(key)} disabled={isSavingPassword}>
                        {isSavingPassword ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                      </button>
                      <button className="icon-btn cancel" onClick={handleCancelPassword} disabled={isSavingPassword}>
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button className="icon-btn edit" onClick={() => handleEditPassword(key)}>
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 파일 삭제 비밀번호 설정 */}
      <section className={`admin-section accordion ${openSection === 'file_delete_password' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('file_delete_password')}>
          <div className="accordion-title">
            <FolderX size={20} />
            <span>업로드 파일 삭제 비밀번호</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="entrance-password-section">
            <p className="section-description">
              업로드 파일 관리 페이지에서 파일 삭제 시 비밀번호 확인을 설정합니다.
              활성화 시 파일 삭제 전 비밀번호를 입력해야 합니다.
            </p>

            {isEditingFileDeletePassword ? (
              <div className="entrance-password-edit">
                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={fileDeletePasswordEditData.enabled}
                      onChange={(e) => setFileDeletePasswordEditData({
                        ...fileDeletePasswordEditData,
                        enabled: e.target.checked
                      })}
                      className="toggle-checkbox"
                    />
                    <span>파일 삭제 비밀번호 기능 활성화</span>
                  </label>
                </div>

                {fileDeletePasswordEditData.enabled && (
                  <div className="form-group">
                    <label>비밀번호</label>
                    <input
                      type="text"
                      value={fileDeletePasswordEditData.password}
                      onChange={(e) => setFileDeletePasswordEditData({
                        ...fileDeletePasswordEditData,
                        password: e.target.value
                      })}
                      placeholder="삭제 비밀번호를 입력하세요"
                      className="form-input"
                    />
                  </div>
                )}

                <div className="entrance-password-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveFileDeletePassword}
                    disabled={isSavingFileDeletePassword}
                  >
                    {isSavingFileDeletePassword ? (
                      <Loader2 size={16} className="spinner-icon" />
                    ) : (
                      <Save size={16} />
                    )}
                    저장
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelFileDeletePassword}
                    disabled={isSavingFileDeletePassword}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="entrance-password-view">
                <div className="entrance-password-status">
                  <div className="status-item">
                    <span className="status-label">상태:</span>
                    <span className={`status-badge ${fileDeletePasswordSettings.enabled ? 'active' : 'inactive'}`}>
                      {fileDeletePasswordSettings.enabled ? '활성화' : '비활성화'}
                    </span>
                  </div>
                  {fileDeletePasswordSettings.enabled && (
                    <div className="status-item">
                      <span className="status-label">비밀번호:</span>
                      <span className="status-value">{fileDeletePasswordSettings.password}</span>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleEditFileDeletePassword}
                >
                  <Edit3 size={16} />
                  수정
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 카테고리 관리 */}
      <section className={`admin-section accordion ${openSection === 'category' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('category')}>
          <div className="accordion-title">
            <FolderOpen size={20} />
            <span>주제 카테고리 관리</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="category-list">
            <p className="section-label">현재 카테고리 목록:</p>
            <div className="category-items">
              {categories.length === 0 ? (
                <p className="no-items">등록된 카테고리가 없습니다.</p>
              ) : (
                categories.map((category, index) => (
                  <div key={category.id} className="category-item">
                    <span>{index + 1}. {category.name}</span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="add-category">
            <p className="section-label">새 카테고리 추가:</p>
            <div className="add-category-form">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="카테고리 이름"
                className="category-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddCategory}
                disabled={isAddingCategory}
              >
                {isAddingCategory ? <Loader2 size={18} className="spinner-icon" /> : <Plus size={18} />}
                추가
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 글 관리 */}
      <section className={`admin-section accordion ${openSection === 'articles' ? 'open' : ''}`}>
        <div className="accordion-header" onClick={() => toggleSection('articles')}>
          <div className="accordion-title">
            <FileText size={20} />
            <span>전체 글 관리</span>
          </div>
          <ChevronDown size={20} className="accordion-icon" />
        </div>
        <div className="accordion-content">
          <div className="articles-table-wrapper">
            <table className="articles-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>날짜</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td className="title-cell">{article.title}</td>
                    <td>{article.authorName}</td>
                    <td>{formatDate(article.createdAt)}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditArticle(article)}
                        title="수정"
                      >
                        <Edit3 size={16} />
                        수정
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteArticle(article.id)}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {articles.length === 0 && (
            <div className="empty-state">
              <p>등록된 글이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 글 수정 모달 */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>글 수정</h3>
              <button className="modal-close" onClick={handleCloseEditModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="form-input"
                  placeholder="글 제목"
                />
              </div>
              <div className="form-group">
                <label>작성자</label>
                <input
                  type="text"
                  value={editFormData.authorName}
                  onChange={(e) => setEditFormData({ ...editFormData, authorName: e.target.value })}
                  className="form-input"
                  placeholder="작성자 이름"
                />
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="form-select"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseEditModal} disabled={isSavingArticle}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveArticle} disabled={isSavingArticle}>
                {isSavingArticle ? <Loader2 size={16} className="spinner-icon" /> : <Save size={16} />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
