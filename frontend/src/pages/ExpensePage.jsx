import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit3, Trash2, X, Receipt, ChevronDown, ChevronUp, Settings, Loader, Save } from 'lucide-react'
import {
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  addBudgetCategory,
  updateBudgetCategory,
  initializeDefaultBudgetCategories,
  addReceiptToExpense,
  removeReceiptFromExpense
} from '../services/expenseService'
import './ExpensePage.css'

function ExpensePage() {
  const [budgetCategories, setBudgetCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()))
  const [expandedId, setExpandedId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const modalReceiptInputRef = useRef(null)
  const [pendingReceipts, setPendingReceipts] = useState([]) // 저장 전 임시 영수증 파일
  const [existingReceipts, setExistingReceipts] = useState([]) // 기존 영수증 URL
  const [receiptsToDelete, setReceiptsToDelete] = useState([]) // 삭제할 영수증 URL
  const [imageViewerUrl, setImageViewerUrl] = useState(null) // 이미지 뷰어용

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

  const [budgetFormData, setBudgetFormData] = useState({ name: '', totalAmount: '' })
  const [formData, setFormData] = useState({
    date: '',
    place: '',
    attendees: '',
    amount: '',
    budgetCategoryId: '',
    personalShare: 0,
    perPerson: 0
  })

  // 데이터 로드 (연도별)
  const loadData = async (year) => {
    setIsLoading(true)
    try {
      const targetYear = year || selectedYear
      // 예산 항목 로드 (없으면 기본값 생성)
      const categories = await initializeDefaultBudgetCategories(targetYear)
      setBudgetCategories(categories)

      // 지출 내역 로드
      const expenseData = await getAllExpenses(targetYear)
      setExpenses(expenseData)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear])

  // 예산 항목별 사용 금액 계산
  const getUsedAmount = (categoryId) => {
    return expenses
      .filter(e => e.budgetCategoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // 사용률 계산
  const getUsageRate = (categoryId) => {
    const category = budgetCategories.find(c => c.id === categoryId)
    if (!category || category.totalAmount === 0) return 0
    return Math.round((getUsedAmount(categoryId) / category.totalAmount) * 100)
  }

  // 모달 열기 (추가)
  const handleAdd = () => {
    setEditingExpense(null)
    setFormData({
      date: '',
      place: '',
      attendees: '',
      amount: '',
      budgetCategoryId: budgetCategories[0]?.id || '',
      personalShare: 0,
      perPerson: 0
    })
    setPendingReceipts([])
    setExistingReceipts([])
    setReceiptsToDelete([])
    setIsModalOpen(true)
  }

  // 모달 열기 (수정)
  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      date: expense.date,
      place: expense.place,
      attendees: expense.attendees,
      amount: expense.amount,
      budgetCategoryId: expense.budgetCategoryId,
      personalShare: expense.personalShare,
      perPerson: expense.perPerson
    })
    setPendingReceipts([])
    setExistingReceipts(expense.receiptImages || [])
    setReceiptsToDelete([])
    setIsModalOpen(true)
  }

  // 모달에서 영수증 파일 추가 (임시)
  const handleModalReceiptAdd = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newReceipts = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))
    setPendingReceipts(prev => [...prev, ...newReceipts])

    if (modalReceiptInputRef.current) {
      modalReceiptInputRef.current.value = ''
    }
  }

  // 임시 영수증 삭제
  const handlePendingReceiptRemove = (index) => {
    setPendingReceipts(prev => {
      const removed = prev[index]
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // 기존 영수증 삭제 표시
  const handleExistingReceiptRemove = (url) => {
    setExistingReceipts(prev => prev.filter(u => u !== url))
    setReceiptsToDelete(prev => [...prev, url])
  }

  // 모달 저장
  const handleSave = async () => {
    const cleanAmount = String(formData.amount).replace(/,/g, '');

    if (!formData.date || !cleanAmount || isNaN(Number(cleanAmount))) {
      alert('사용일과 사용액은 필수 입력입니다.')
      return
    }

    setIsSaving(true)
    try {
      let expenseId = editingExpense?.id

      if (editingExpense) {
        // 수정 모드
        await updateExpense(expenseId, {
          ...formData,
          amount: Number(cleanAmount),
          receiptImages: existingReceipts
        })

        // 삭제할 영수증 처리
        for (const url of receiptsToDelete) {
          try {
            await removeReceiptFromExpense(expenseId, url)
          } catch (e) {
            console.warn('영수증 삭제 실패:', e)
          }
        }
      } else {
        // 추가 모드
        expenseId = await addExpense({
          ...formData,
          amount: Number(cleanAmount),
          receiptImages: [],
          meetingPhotos: [],
          year: selectedYear
        })
      }

      // 새 영수증 업로드
      for (const receipt of pendingReceipts) {
        try {
          await addReceiptToExpense(expenseId, receipt.file)
        } catch (e) {
          console.warn('영수증 업로드 실패:', e)
        }
      }

      // cleanup
      pendingReceipts.forEach(r => {
        if (r.preview) URL.revokeObjectURL(r.preview)
      })

      await loadData(selectedYear)
      handleModalClose()
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 모달 닫기
  const handleModalClose = () => {
    pendingReceipts.forEach(r => {
      if (r.preview) URL.revokeObjectURL(r.preview)
    })
    setPendingReceipts([])
    setExistingReceipts([])
    setReceiptsToDelete([])
    setEditingExpense(null)
    setFormData({
      date: '',
      place: '',
      attendees: '',
      amount: '',
      budgetCategoryId: budgetCategories[0]?.id || '',
      personalShare: 0,
      perPerson: 0
    })
    setIsModalOpen(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('이 내역을 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await deleteExpense(id)
        await loadData(selectedYear)
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

  // 예산 항목 수정
  const handleEditBudget = (category) => {
    setEditingBudgetId(category.id)
    setBudgetFormData({ name: category.name, totalAmount: category.totalAmount })
  }

  const handleSaveBudget = async () => {
    if (!budgetFormData.name || !budgetFormData.totalAmount) {
      alert('항목명과 총액을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      await updateBudgetCategory(editingBudgetId, {
        name: budgetFormData.name,
        totalAmount: Number(budgetFormData.totalAmount)
      })
      await loadData(selectedYear)
      setEditingBudgetId(null)
      setBudgetFormData({ name: '', totalAmount: '' })
    } catch (error) {
      alert('예산 항목 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelBudget = () => {
    setEditingBudgetId(null)
    setBudgetFormData({ name: '', totalAmount: '' })
  }

  // 예산 추가 모달 열기
  const handleOpenBudgetModal = () => {
    setBudgetFormData({ name: '', totalAmount: '' })
    setIsBudgetModalOpen(true)
  }

  // 예산 추가 모달 닫기
  const handleCloseBudgetModal = () => {
    setBudgetFormData({ name: '', totalAmount: '' })
    setIsBudgetModalOpen(false)
  }

  // 새 예산 항목 저장
  const handleAddBudget = async () => {
    if (!budgetFormData.name || !budgetFormData.totalAmount) {
      alert('항목명과 총액을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      await addBudgetCategory({
        name: budgetFormData.name,
        totalAmount: Number(budgetFormData.totalAmount),
        year: selectedYear
      })
      await loadData(selectedYear)
      handleCloseBudgetModal()
    } catch (error) {
      alert('예산 항목 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatMoney = (amount) => {
    return amount.toLocaleString() + '원'
  }

  const getCategoryName = (categoryId) => {
    const category = budgetCategories.find(c => c.id === categoryId)
    return category ? category.name : '-'
  }

  // URL에서 파일명 추출
  const getFileNameFromUrl = (url, index, type) => {
    return `${type}${index + 1}.jpg`
  }

  return (
    <div className="expense-page">
      <div className="page-header">
        <h2 className="page-title">회비사용</h2>
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
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            내역 추가
          </button>
        </div>
      </div>

      {/* 예산 항목별 현황 카드 - 2행 3열 그리드 (최소 6슬롯) */}
      <div className="budget-categories">
        {budgetCategories.map((category) => {
          const used = getUsedAmount(category.id)
          const remaining = category.totalAmount - used
          const usageRate = getUsageRate(category.id)

          return (
            <div key={category.id} className="budget-category-card">
              {editingBudgetId === category.id ? (
                <div className="budget-edit-form">
                  <input
                    type="text"
                    value={budgetFormData.name}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                    className="budget-input"
                    placeholder="항목명"
                  />
                  <input
                    type="number"
                    value={budgetFormData.totalAmount}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, totalAmount: e.target.value })}
                    className="budget-input"
                    placeholder="총액"
                  />
                  <div className="budget-edit-actions">
                    <button className="icon-btn save" onClick={handleSaveBudget} disabled={isSaving}>
                      {isSaving ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                    </button>
                    <button className="icon-btn cancel" onClick={handleCancelBudget} disabled={isSaving}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="budget-category-header">
                    <span className="budget-category-name">{category.name}</span>
                    <button className="budget-edit-btn" onClick={() => handleEditBudget(category)}>
                      <Settings size={14} />
                    </button>
                  </div>
                  <div className="budget-amounts">
                    <div className="budget-amount-row">
                      <span className="budget-label">총액</span>
                      <span className="budget-value">{formatMoney(category.totalAmount)}</span>
                    </div>
                    <div className="budget-amount-row">
                      <span className="budget-label">사용</span>
                      <span className="budget-value used">{formatMoney(used)}</span>
                    </div>
                    <div className="budget-amount-row">
                      <span className="budget-label">잔액</span>
                      <span className={`budget-value ${remaining < 0 ? 'negative' : 'remaining'}`}>
                        {formatMoney(remaining)}
                      </span>
                    </div>
                  </div>
                  <div className="budget-progress">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${usageRate > 100 ? 'over' : usageRate > 80 ? 'warning' : ''}`}
                        style={{ width: `${Math.min(usageRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{usageRate}% 사용</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
        {/* 빈 슬롯 렌더링 - 최소 6개 슬롯 유지 */}
        {Array.from({ length: Math.max(0, 6 - budgetCategories.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="budget-slot-empty" onClick={handleOpenBudgetModal}>
            <div className="slot-icon">
              <Plus size={24} />
            </div>
            <span className="slot-text">예산 추가</span>
          </div>
        ))}
      </div>

      <div className="expense-table-wrapper">
        {isLoading ? (
          <div className="loading-overlay">
            <Loader size={24} className="spinning" />
            <span>불러오는 중...</span>
          </div>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>사용일</th>
                <th>장소 또는 내역</th>
                <th>영수증</th>
                <th>사용액</th>
                <th>예산 항목</th>
                <th>개인 부담</th>
                <th>인당 금액</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <React.Fragment key={expense.id}>
                  <tr className="expense-row" onClick={() => toggleExpand(expense.id)}>
                    <td>{expense.date}</td>
                    <td>{expense.place}</td>
                    <td className="attendees-cell" style={{ justifyContent: 'center' }}>
                      {(expense.receiptImages && expense.receiptImages.length > 0) ? (
                        <span className="receipt-badge" style={{ marginLeft: 0 }}>
                          <Receipt size={14} />
                          {expense.receiptImages.length}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: '0.8rem' }}>-</span>
                      )}
                      <span className="expand-icon" style={{ marginLeft: '8px' }}>
                        {expandedId === expense.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </td>
                    <td className="amount">{formatMoney(expense.amount)}</td>
                    <td>{getCategoryName(expense.budgetCategoryId)}</td>
                    <td className="amount">{expense.personalShare > 0 ? formatMoney(expense.personalShare) : '-'}</td>
                    <td className="amount">{expense.perPerson > 0 ? formatMoney(expense.perPerson) : '-'}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn edit" onClick={() => handleEdit(expense)}><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(expense.id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                  {expandedId === expense.id && (
                    <tr className="expanded-row">
                      <td colSpan={8}>
                        <div className="expanded-content">
                          <div className="expanded-receipts">
                            <div className="expanded-section-header">
                              <Receipt size={16} />
                              <span>영수증 ({expense.receiptImages?.length || 0})</span>
                            </div>
                            <div className="receipt-thumbnails">
                              {expense.receiptImages && expense.receiptImages.length > 0 ? (
                                expense.receiptImages.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="receipt-thumbnail"
                                    onClick={() => setImageViewerUrl(img)}
                                  >
                                    <img src={img} alt={`영수증 ${idx + 1}`} />
                                  </div>
                                ))
                              ) : (
                                <span className="no-attachment">등록된 영수증 없음</span>
                              )}
                            </div>
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

      {expenses.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>등록된 내역이 없습니다.</p>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            첫 내역 추가하기
          </button>
        </div>
      )}

      {/* 내역 추가/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? '지출 내역 수정' : '지출 내역 추가'}</h3>
              <button className="modal-close-btn" onClick={handleModalClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>사용일 *</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="예: 2024.6.14"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>장소 또는 내역</label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    placeholder="장소 또는 내역"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>사용액 *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      const formatted = raw ? Number(raw).toLocaleString() : ''
                      setFormData({ ...formData, amount: formatted })
                    }}
                    placeholder="금액"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>예산 항목</label>
                  <select
                    value={formData.budgetCategoryId}
                    onChange={(e) => setFormData({ ...formData, budgetCategoryId: e.target.value })}
                    className="form-input"
                  >
                    {budgetCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>개인 부담</label>
                  <input
                    type="number"
                    value={formData.personalShare}
                    onChange={(e) => setFormData({ ...formData, personalShare: Number(e.target.value) })}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>인당 금액</label>
                  <input
                    type="number"
                    value={formData.perPerson}
                    onChange={(e) => setFormData({ ...formData, perPerson: Number(e.target.value) })}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>

              {/* 영수증 섹션 */}
              <div className="receipt-section">
                <div className="receipt-section-header">
                  <Receipt size={18} />
                  <span>영수증</span>
                </div>
                <div className="receipt-grid">
                  {/* 기존 영수증 (수정 모드) */}
                  {existingReceipts.map((url, idx) => (
                    <div key={`existing-${idx}`} className="receipt-item">
                      <img
                        src={url}
                        alt={`영수증 ${idx + 1}`}
                        onClick={() => setImageViewerUrl(url)}
                      />
                      <button
                        className="receipt-remove-btn"
                        onClick={() => handleExistingReceiptRemove(url)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {/* 새로 추가할 영수증 */}
                  {pendingReceipts.map((receipt, idx) => (
                    <div key={`pending-${idx}`} className="receipt-item pending">
                      <img
                        src={receipt.preview}
                        alt={receipt.name}
                        onClick={() => setImageViewerUrl(receipt.preview)}
                      />
                      <button
                        className="receipt-remove-btn"
                        onClick={() => handlePendingReceiptRemove(idx)}
                      >
                        <X size={14} />
                      </button>
                      <span className="receipt-pending-badge">새 파일</span>
                    </div>
                  ))}
                  {/* 추가 버튼 */}
                  <div
                    className="receipt-add-btn"
                    onClick={() => modalReceiptInputRef.current?.click()}
                  >
                    <Plus size={24} />
                    <span>사진 추가</span>
                  </div>
                  <input
                    type="file"
                    ref={modalReceiptInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleModalReceiptAdd}
                    style={{ display: 'none' }}
                  />
                </div>
                <p className="receipt-hint">* 이미지 클릭시 원본 보기</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleModalClose} disabled={isSaving}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader size={16} className="spinning" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 뷰어 */}
      {imageViewerUrl && (
        <div className="image-viewer-overlay" onClick={() => setImageViewerUrl(null)}>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={() => setImageViewerUrl(null)}>
              <X size={24} />
            </button>
            <img src={imageViewerUrl} alt="영수증 원본" />
          </div>
        </div>
      )}

      {/* 예산 추가 모달 */}
      {isBudgetModalOpen && (
        <div className="modal-overlay" onClick={handleCloseBudgetModal}>
          <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>예산 항목 추가</h3>
              <button className="modal-close-btn" onClick={handleCloseBudgetModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>항목명 *</label>
                <input
                  type="text"
                  value={budgetFormData.name}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                  placeholder="예: 특별지원금"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>총액 *</label>
                <input
                  type="number"
                  value={budgetFormData.totalAmount}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, totalAmount: e.target.value })}
                  placeholder="0"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseBudgetModal} disabled={isSaving}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleAddBudget} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader size={16} className="spinning" />
                    저장 중...
                  </>
                ) : (
                  '추가'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpensePage
