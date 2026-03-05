import { useState, useCallback, useEffect } from 'react'
import { Check, Circle, Download } from 'lucide-react'
import { saveDraft, loadDraft, deleteDraft } from '../services/articleService'
import { getWriteGuide, getExampleArticle } from '../services/memberService'
import StepBasicInfo from '../components/write/StepBasicInfo'
import StepInput from '../components/write/StepInput'
import StepGenerate from '../components/write/StepGenerate'
import StepComplete from '../components/write/StepComplete'
import './WritePage.css'

const STEPS = [
  { id: 1, label: '기본정보' },
  { id: 2, label: '입력' },
  { id: 3, label: '글생성' },
  { id: 4, label: '완료' }
]

function WritePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [writeGuide, setWriteGuide] = useState('')
  const [exampleArticle, setExampleArticle] = useState(null)
  const [formData, setFormData] = useState({
    // Step 1: 기본 정보
    authorName: '',
    password: '',
    articleLength: 'pages_10_12', // pages_10_12, pages_13_15, pages_16_18, custom
    customLengthMin: 10,
    customLengthMax: 12,

    // Step 2: 필수 입력
    category: '',
    customTopic: '',
    cases: '',
    pdfFile: null,
    pdfFileName: '',
    pdfFiles: [],
    pdfFileNames: [],

    // Step 3: 선택 입력
    structuralProblems: '',
    alternatives: '',

    // Step 4: 생성된 글
    generatedArticle: null,
    sections: [],

    // Step 5: 토의 질문 & 진행자 가이드
    questionCount: 10,
    questions: [],
    facilitatorGuide: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    loadWriteGuide()
    loadExampleArticle()
  }, [])

  const loadWriteGuide = async () => {
    try {
      const guide = await getWriteGuide()
      setWriteGuide(guide)
    } catch (error) {
      console.error('글쓰기 가이드 로딩 오류:', error)
    }
  }

  const loadExampleArticle = async () => {
    try {
      const article = await getExampleArticle()
      setExampleArticle(article)
    } catch (error) {
      console.error('예시글 로딩 오류:', error)
    }
  }

  const handleDownloadExample = () => {
    if (exampleArticle && exampleArticle.fileUrl) {
      window.open(exampleArticle.fileUrl, '_blank')
    } else {
      alert('아직 예시글이 등록되지 않았습니다.')
    }
  }

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // 임시저장 (PDF 파일 제외 - Firebase에 직접 저장 불가)
  const handleSaveDraft = useCallback(async () => {
    if (!formData.authorName) {
      alert('임시저장을 위해 성명을 먼저 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const draftData = {
        ...formData,
        pdfFile: null, // PDF는 저장 불가
        pdfFiles: [], // PDF 배열도 저장 불가
        pdfFileName: formData.pdfFileName, // 파일명만 저장
        pdfFileNames: formData.pdfFileNames || [], // 파일명 배열은 유지
        currentStep: currentStep
      }
      await saveDraft(draftData)
      setLastSaved(new Date())
      alert('임시저장되었습니다.')
    } catch (error) {
      console.error('임시저장 오류:', error)
      alert('임시저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [formData, currentStep])

  // 임시저장 불러오기
  const handleLoadDraft = useCallback(async (authorName) => {
    if (!authorName) return null

    try {
      const draft = await loadDraft(authorName)
      if (draft) {
        const shouldLoad = window.confirm(
          `"${authorName}" 님의 임시저장된 글이 있습니다.\n` +
          `(저장일: ${draft.updatedAt?.toLocaleString('ko-KR') || '알 수 없음'})\n\n` +
          `불러오시겠습니까?`
        )
        if (shouldLoad) {
          setFormData(prev => ({
            ...prev,
            ...draft,
            pdfFile: null // PDF는 다시 업로드 필요
          }))
          if (draft.currentStep) {
            setCurrentStep(draft.currentStep)
          }
          setLastSaved(draft.updatedAt)
          return draft
        }
      }
      return null
    } catch (error) {
      console.error('임시저장 불러오기 오류:', error)
      return null
    }
  }, [])

  // 임시저장 삭제 (업로드 완료 시 호출)
  const handleDeleteDraft = useCallback(async () => {
    if (formData.authorName) {
      try {
        await deleteDraft(formData.authorName)
      } catch (error) {
        console.error('임시저장 삭제 오류:', error)
      }
    }
  }, [formData.authorName])

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicInfo
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onSaveDraft={handleSaveDraft}
            onLoadDraft={handleLoadDraft}
            isSaving={isSaving}
          />
        )
      case 2:
        return (
          <StepInput
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )
      case 3:
        return (
          <StepGenerate
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        )
      case 4:
        return (
          <StepComplete
            formData={formData}
            updateFormData={updateFormData}
            onPrev={prevStep}
            onDeleteDraft={handleDeleteDraft}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="write-page">
      <div className="page-header">
        <h2 className="page-title">새 글 작성</h2>
        {exampleArticle && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownloadExample}
          >
            <Download size={16} />
            예시글 다운로드
          </button>
        )}
      </div>

      {/* 글쓰기 탭 사용 방법 */}
      {writeGuide && (
        <div className="write-guide-box">
          <p className="write-guide-text">{writeGuide}</p>
        </div>
      )}

      {/* 진행 단계 표시 */}
      <div className="step-indicator">
        <span className="step-label">진행 단계</span>
        <div className="step-list">
          {STEPS.map((step, index) => (
            <div key={step.id} className="step-item-wrapper">
              <button
                className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep}
              >
                {currentStep > step.id ? (
                  <Check size={14} />
                ) : (
                  <Circle size={14} fill={currentStep === step.id ? 'currentColor' : 'none'} />
                )}
                <span>{step.label}</span>
              </button>
              {index < STEPS.length - 1 && <span className="step-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="step-content">
        {renderStepContent()}
      </div>
    </div>
  )
}

export default WritePage
