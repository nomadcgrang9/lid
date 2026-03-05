import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Save, Upload, FileText, X, Loader2, Info, AlertCircle } from 'lucide-react'
import './WriteSteps.css'

function StepInput({ formData, updateFormData, onNext, onPrev, onSaveDraft, isSaving }) {
  const fileInputRef = useRef(null)
  const topicInputRef = useRef(null)
  const casesInputRef = useRef(null)
  const pdfUploadRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState({})
  const [shakeField, setShakeField] = useState(null)

  // ===== 필수: PDF 파일 핸들러 =====
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    const currentFiles = formData.pdfFiles || []
    const newFiles = []

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        alert(`"${file.name}"은(는) PDF 파일이 아닙니다.`)
        continue
      }
      if (file.size > 50 * 1024 * 1024) {
        alert(`"${file.name}"의 크기가 50MB를 초과합니다.`)
        continue
      }
      // 중복 파일 체크
      const isDuplicate = currentFiles.some(f => f.name === file.name && f.size === file.size)
      if (isDuplicate) {
        continue
      }
      newFiles.push(file)
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...currentFiles, ...newFiles]
      updateFormData({
        pdfFiles: updatedFiles,
        pdfFileNames: updatedFiles.map(f => f.name),
        // 하위 호환성
        pdfFile: updatedFiles[0],
        pdfFileName: updatedFiles[0]?.name || ''
      })
      // 에러 클리어
      if (errors.pdfFiles) {
        setErrors(prev => ({ ...prev, pdfFiles: '' }))
      }
    }
  }

  const handleRemoveFile = (index) => {
    const currentFiles = formData.pdfFiles || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    updateFormData({
      pdfFiles: updatedFiles,
      pdfFileNames: updatedFiles.map(f => f.name),
      // 하위 호환성
      pdfFile: updatedFiles[0] || null,
      pdfFileName: updatedFiles[0]?.name || ''
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 드래그앤드롭 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  // ===== 선택: 근거자료 파일 핸들러 =====
  const handleReferenceFileChange = (e) => {
    const files = Array.from(e.target.files)
    const currentFiles = formData.referenceFiles || []
    const currentNames = formData.referenceFileNames || []

    // 개수 제한
    if (files.length + currentFiles.length > 3) {
      alert('근거자료는 최대 3개까지 업로드 가능합니다.')
      e.target.value = ''
      return
    }

    // 크기 제한 및 형식 검증
    const validExtensions = ['.pdf', '.txt', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png']
    for (let file of files) {
      // 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}은(는) 10MB를 초과합니다.`)
        e.target.value = ''
        return
      }

      // 형식 제한
      const fileExt = '.' + file.name.split('.').pop().toLowerCase()
      if (!validExtensions.includes(fileExt)) {
        alert(`${file.name}은(는) 지원하지 않는 형식입니다.\n지원 형식: PDF, TXT, Excel, CSV, 이미지`)
        e.target.value = ''
        return
      }
    }

    updateFormData({
      referenceFiles: [...currentFiles, ...files],
      referenceFileNames: [...currentNames, ...files.map(f => f.name)]
    })

    e.target.value = ''
  }

  // 근거자료 파일 제거
  const handleRemoveReferenceFile = (index) => {
    const currentFiles = formData.referenceFiles || []
    const currentNames = formData.referenceFileNames || []

    updateFormData({
      referenceFiles: currentFiles.filter((_, i) => i !== index),
      referenceFileNames: currentNames.filter((_, i) => i !== index)
    })
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // ===== 유효성 검사 =====
  const validateForm = () => {
    const newErrors = {}

    if (!formData.customTopic || formData.customTopic.trim() === '') {
      newErrors.customTopic = '주제를 입력해주세요.'
    }

    if (!formData.cases || formData.cases.trim() === '') {
      newErrors.cases = '사례를 입력해주세요.'
    }

    const hasFiles = (formData.pdfFiles && formData.pdfFiles.length > 0) || formData.pdfFile
    if (!hasFiles) {
      newErrors.pdfFiles = 'PDF 파일을 업로드해주세요.'
    }

    setErrors(newErrors)

    // 첫 번째 에러 필드로 스크롤 및 포커스
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      scrollToErrorField(firstErrorField)
      return false
    }

    return true
  }

  // 에러 필드로 스크롤 및 포커스
  const scrollToErrorField = (field) => {
    let targetRef = null
    let targetElement = null

    switch (field) {
      case 'customTopic':
        targetRef = topicInputRef
        targetElement = topicInputRef.current
        break
      case 'cases':
        targetRef = casesInputRef
        targetElement = casesInputRef.current
        break
      case 'pdfFiles':
        targetRef = pdfUploadRef
        targetElement = pdfUploadRef.current
        break
      default:
        break
    }

    if (targetElement) {
      // 스크롤 이동
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 흔들림 애니메이션 적용
      setShakeField(field)
      setTimeout(() => setShakeField(null), 600)

      // 포커스 적용 (input/textarea만)
      if (targetRef.current && typeof targetRef.current.focus === 'function' && field !== 'pdfFiles') {
        setTimeout(() => {
          targetRef.current.focus()
        }, 300)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onNext()
    }
  }

  // 입력 변경 시 해당 에러 클리어
  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const pdfFiles = formData.pdfFiles || (formData.pdfFile ? [formData.pdfFile] : [])

  return (
    <form onSubmit={handleSubmit} className="step-form">
      {/* ===== 필수 입력 영역 ===== */}
      <div className="form-section">
        <h3 className="form-section-title">① 주제 <span className="required">*</span></h3>

        <div className="form-group">
          <label className="form-label">글의 주제를 입력해주세요</label>
          <input
            ref={topicInputRef}
            type="text"
            className={`form-input ${errors.customTopic ? 'input-error' : ''} ${shakeField === 'customTopic' ? 'shake' : ''}`}
            value={formData.customTopic}
            onChange={(e) => handleInputChange('customTopic', e.target.value)}
            placeholder="예: 학교폭력 대응 절차의 문제점과 개선 방안"
          />
          {errors.customTopic && (
            <p className="error-message">
              <AlertCircle size={14} />
              {errors.customTopic}
            </p>
          )}
          {formData.category && (
            <p className="form-hint">선택된 카테고리: {formData.category}</p>
          )}
        </div>
      </div>

      <div className="form-divider"></div>

      <div className="form-section">
        <h3 className="form-section-title">② 사례 입력 (1~2가지) <span className="required">*</span></h3>
        <p className="form-section-desc">본인 경험, 가상 사례, 뉴스 보도 등</p>

        <div className="form-group">
          <textarea
            ref={casesInputRef}
            className={`form-textarea ${errors.cases ? 'input-error' : ''} ${shakeField === 'cases' ? 'shake' : ''}`}
            value={formData.cases}
            onChange={(e) => handleInputChange('cases', e.target.value)}
            placeholder="현직교사 입장에서 겪어본 사례나 관련 뉴스 보도 등을 작성해주세요.&#10;&#10;예시:&#10;지난 3월, 본교에서 발생한 학교폭력 사안은..."
            rows={6}
          />
          {errors.cases && (
            <p className="error-message">
              <AlertCircle size={14} />
              {errors.cases}
            </p>
          )}
        </div>
      </div>

      <div className="form-divider"></div>

      <div className="form-section">
        <h3 className="form-section-title">③ 관련 법령/지침 PDF 업로드 <span className="required">*</span></h3>

        <div className="form-group">
          <div
            ref={pdfUploadRef}
            className={`file-upload-area ${isDragging ? 'dragging' : ''} ${errors.pdfFiles ? 'upload-error' : ''} ${shakeField === 'pdfFiles' ? 'shake' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload size={32} />
            <p>{isDragging ? '여기에 파일을 놓으세요' : 'PDF 파일을 드래그하거나 클릭하여 업로드'}</p>
            <span className="file-hint">(최대 50MB, 여러 파일 선택 가능)</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {pdfFiles.length > 0 && (
            <div className="uploaded-files-list">
              {pdfFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="uploaded-file-item">
                  <FileText size={20} />
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.pdfFiles && (
            <p className="error-message">
              <AlertCircle size={14} />
              {errors.pdfFiles}
            </p>
          )}

          <p className="form-hint">
            AI가 업로드된 파일의 내용을 읽어 조문번호까지 정확히 인용합니다.
          </p>
        </div>
      </div>

      {/* ===== 굵은 구분선 ===== */}
      <div className="form-divider-thick"></div>

      {/* ===== 선택 입력 영역 ===== */}
      <div className="info-banner">
        <Info size={20} />
        <p>아래 항목은 선택사항입니다. 입력하지 않으면 AI가 자동으로 작성합니다.</p>
      </div>

      {/* 근거자료 업로드 */}
      <div className="form-section">
        <h3 className="form-section-title">④ 통계 및 근거자료 (선택)</h3>
        <p className="form-section-desc">
          통계, 연구 데이터, 뉴스 기사 등을 업로드하면 AI가 분석하여 글에 반영합니다.
        </p>

        <div className="reference-upload-guide">
          수많은 숫자, 그림, 그래프 또는 논문 그대로의 쪽수 많은 원본 자료 등은 안됩니다.<br />
          실제 글에 인용하실 목적으로 직접 정리하신 1~3쪽 내외 분량의 자료만 올려주십시오.
        </div>

        <div className="reference-file-constraints">
          <span>파일 크기: 최대 10MB</span>
          <span>•</span>
          <span>개수: 최대 3개</span>
          <span>•</span>
          <span>형식: PDF, TXT, Excel, CSV, 이미지</span>
        </div>

        <div className="form-group">
          <div
            className={`reference-upload-area ${formData.referenceFileNames && formData.referenceFileNames.length > 0 ? 'has-files' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              const event = {
                target: { files },
                preventDefault: () => {},
                currentTarget: { value: '' }
              }
              handleReferenceFileChange({ ...event, target: { ...event.target, value: '' } })
            }}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
              onChange={handleReferenceFileChange}
              style={{ display: 'none' }}
              id="reference-file-input"
            />
            <label htmlFor="reference-file-input" className="upload-area-label">
              <FileText size={32} />
              <p className="upload-text">파일을 여기에 드래그하거나 클릭하여 선택</p>
              <p className="upload-hint">최대 3개, 10MB 이하</p>
            </label>
          </div>

          {formData.referenceFileNames && formData.referenceFileNames.length > 0 && (
            <div className="uploaded-files-list">
              {formData.referenceFileNames.map((name, index) => (
                <div key={index} className="file-tag">
                  <FileText size={16} />
                  <span className="file-name">{name}</span>
                  {formData.referenceFiles && formData.referenceFiles[index] && (
                    <span className="file-size">({formatFileSize(formData.referenceFiles[index].size)})</span>
                  )}
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => handleRemoveReferenceFile(index)}
                    title="제거"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <p className="file-count-hint">
                {formData.referenceFileNames.length}/3개 업로드됨
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="form-divider"></div>

      <div className="form-section">
        <h3 className="form-section-title">⑤ 구조적 문제점 - 학교 현실 (선택)</h3>
        <p className="form-section-desc">
          학교 현장에서 어떤 부분이 주로 문제가 된다고 생각하시나요?
        </p>

        <div className="form-group">
          <textarea
            className="form-textarea"
            value={formData.structuralProblems}
            onChange={(e) => updateFormData({ structuralProblems: e.target.value })}
            placeholder="생각나시는 부분이 있으면 간단히 작성해주세요.&#10;&#10;예시:&#10;- 담임교사에게 집중되는 업무 부담&#10;- 행정적 절차와 실제 교육 현장의 괴리&#10;- 인력 부족 문제"
            rows={5}
          />
        </div>
      </div>

      <div className="form-divider"></div>

      <div className="form-section">
        <h3 className="form-section-title">⑥ 대안 제시 (선택)</h3>
        <p className="form-section-desc">
          선생님께서 생각하시는 대안을 간단히 1~2가지 정도 추가해주세요.
        </p>

        <div className="form-group">
          <textarea
            className="form-textarea"
            value={formData.alternatives}
            onChange={(e) => updateFormData({ alternatives: e.target.value })}
            placeholder="생각나시는 대안이 있으면 간단히 작성해주세요.&#10;&#10;예시:&#10;- 전담 인력 배치 확대&#10;- 매뉴얼 간소화 및 현실화&#10;- 교육청 차원의 지원 강화"
            rows={5}
          />
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
        <button type="submit" className="btn btn-primary">
          글 생성하기
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  )
}

export default StepInput
