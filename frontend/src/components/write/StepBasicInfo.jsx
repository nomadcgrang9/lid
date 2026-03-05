import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Save, Loader2 } from 'lucide-react'
import { getCategories } from '../../services/articleService'
import './WriteSteps.css'

const LENGTH_OPTIONS = [
  { value: 'pages_10_12', label: '10~12쪽', min: 10, max: 12 },
  { value: 'pages_13_15', label: '13~15쪽', min: 13, max: 15 },
  { value: 'pages_16_18', label: '16~18쪽', min: 16, max: 18 },
  { value: 'custom', label: '직접 설정', min: null, max: null }
]

function StepBasicInfo({ formData, updateFormData, onNext, onSaveDraft, onLoadDraft, isSaving }) {
  const [categories, setCategories] = useState([])
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false)
  const authorInputRef = useRef(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('카테고리 로딩 오류:', error)
    }
  }

  // 작성자 이름 입력 후 포커스 잃을 때 임시저장 확인
  const handleAuthorBlur = async () => {
    if (formData.authorName && !hasCheckedDraft && onLoadDraft) {
      setHasCheckedDraft(true)
      await onLoadDraft(formData.authorName)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // 직접 설정인 경우 쪽수 검증
    if (formData.articleLength === 'custom') {
      const min = formData.customLengthMin
      const max = formData.customLengthMax

      // 빈 값 체크
      if (!min || !max) {
        alert('쪽수를 입력해주세요.')
        return
      }

      // 최소값 범위 체크
      if (min < 1) {
        alert('1쪽 이상 입력하세요.')
        return
      }
      if (min > 25) {
        alert('25쪽까지만 생성 가능합니다.')
        return
      }

      // 최대값 범위 체크
      if (max < 1) {
        alert('1쪽 이상 입력하세요.')
        return
      }
      if (max > 25) {
        alert('25쪽까지만 생성 가능합니다.')
        return
      }

      // 최소 > 최대 체크
      if (min > max) {
        alert('최소 쪽수가 최대 쪽수보다 클 수 없습니다.')
        return
      }
    }

    if (formData.authorName && formData.password) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="step-form">
      <div className="basic-info-card">
        <div className="form-group">
          <label className="form-label">
            성명 (실명) <span className="required">*</span>
          </label>
          <input
            ref={authorInputRef}
            type="text"
            className="form-input"
            value={formData.authorName}
            onChange={(e) => updateFormData({ authorName: e.target.value })}
            onBlur={handleAuthorBlur}
            placeholder="실명을 입력해주세요"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            비밀번호 (글 수정 시 필요) <span className="required">*</span>
          </label>
          <input
            type="password"
            className="form-input"
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            placeholder="비밀번호를 입력해주세요"
            required
          />
          <p className="form-hint">작성 완료 후 글을 수정할 때 사용됩니다.</p>
        </div>

        <div className="form-group">
          <label className="form-label">카테고리</label>
          <select
            className="form-select"
            value={formData.category || ''}
            onChange={(e) => updateFormData({ category: e.target.value })}
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="form-hint">관리자가 등록한 카테고리 중 선택하세요.</p>
        </div>

        <div className="form-group">
          <label className="form-label">글 분량 설정</label>
          <div className="length-options">
            {LENGTH_OPTIONS.map((option) => (
              <label key={option.value} className="length-option">
                <input
                  type="radio"
                  name="articleLength"
                  value={option.value}
                  checked={formData.articleLength === option.value}
                  onChange={(e) => {
                    const newValue = e.target.value
                    if (newValue === 'custom') {
                      updateFormData({
                        articleLength: newValue,
                        customLengthMin: formData.customLengthMin || 10,
                        customLengthMax: formData.customLengthMax || 12
                      })
                    } else {
                      const selected = LENGTH_OPTIONS.find(o => o.value === newValue)
                      updateFormData({
                        articleLength: newValue,
                        customLengthMin: selected?.min || 10,
                        customLengthMax: selected?.max || 12
                      })
                    }
                  }}
                />
                <span className="length-label">
                  {option.label}
                  {option.value === 'pages_10_12' && <span className="default-badge">기본</span>}
                </span>
              </label>
            ))}
          </div>
          {formData.articleLength === 'custom' && (
            <div className="custom-length-inputs">
              <input
                type="number"
                className="length-input"
                value={formData.customLengthMin === '' ? '' : formData.customLengthMin}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    updateFormData({ customLengthMin: '' })
                  } else {
                    const numValue = parseInt(inputValue, 10)
                    if (!isNaN(numValue)) {
                      updateFormData({ customLengthMin: numValue })
                    }
                  }
                }}
                placeholder="최소"
              />
              <span className="length-separator">~</span>
              <input
                type="number"
                className="length-input"
                value={formData.customLengthMax === '' ? '' : formData.customLengthMax}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    updateFormData({ customLengthMax: '' })
                  } else {
                    const numValue = parseInt(inputValue, 10)
                    if (!isNaN(numValue)) {
                      updateFormData({ customLengthMax: numValue })
                    }
                  }
                }}
                placeholder="최대"
              />
              <span className="length-unit">쪽</span>
            </div>
          )}
        </div>
      </div>

      <div className="button-group">
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
          다음 단계
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  )
}

export default StepBasicInfo
