import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from '../firebase/config'

const EXPENSES_COLLECTION = 'expenses'
const BUDGET_CATEGORIES_COLLECTION = 'budgetCategories'

// ==================== 예산 항목 관련 ====================

// 모든 예산 항목 가져오기 (연도별)
export async function getAllBudgetCategories(year) {
  try {
    let q
    if (year) {
      q = query(
        collection(db, BUDGET_CATEGORIES_COLLECTION),
        where('year', '==', year),
        orderBy('createdAt', 'asc')
      )
    } else {
      q = query(
        collection(db, BUDGET_CATEGORIES_COLLECTION),
        orderBy('createdAt', 'asc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('예산 항목 조회 오류:', error)
    throw error
  }
}

// 예산 항목 추가
export async function addBudgetCategory(categoryData) {
  try {
    const docRef = await addDoc(collection(db, BUDGET_CATEGORIES_COLLECTION), {
      name: categoryData.name,
      totalAmount: Number(categoryData.totalAmount),
      year: categoryData.year || new Date().getFullYear(),
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('예산 항목 추가 오류:', error)
    throw error
  }
}

// 예산 항목 수정
export async function updateBudgetCategory(categoryId, categoryData) {
  try {
    const docRef = doc(db, BUDGET_CATEGORIES_COLLECTION, categoryId)
    await updateDoc(docRef, {
      name: categoryData.name,
      totalAmount: Number(categoryData.totalAmount),
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('예산 항목 수정 오류:', error)
    throw error
  }
}

// 예산 항목 삭제
export async function deleteBudgetCategory(categoryId) {
  try {
    await deleteDoc(doc(db, BUDGET_CATEGORIES_COLLECTION, categoryId))
    return true
  } catch (error) {
    console.error('예산 항목 삭제 오류:', error)
    throw error
  }
}

// ==================== 지출 내역 관련 ====================

// 모든 지출 내역 가져오기 (연도별)
export async function getAllExpenses(year) {
  try {
    let q
    if (year) {
      q = query(
        collection(db, EXPENSES_COLLECTION),
        where('year', '==', year),
        orderBy('date', 'desc')
      )
    } else {
      q = query(
        collection(db, EXPENSES_COLLECTION),
        orderBy('date', 'desc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('지출 내역 조회 오류:', error)
    throw error
  }
}

// 지출 내역 추가
export async function addExpense(expenseData) {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      date: expenseData.date,
      place: expenseData.place,
      attendees: expenseData.attendees,
      amount: Number(expenseData.amount),
      budgetCategoryId: expenseData.budgetCategoryId,
      personalShare: Number(expenseData.personalShare) || 0,
      perPerson: Number(expenseData.perPerson) || 0,
      receiptImages: expenseData.receiptImages || [],
      meetingPhotos: expenseData.meetingPhotos || [],
      year: expenseData.year || new Date().getFullYear(),
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('지출 내역 추가 오류:', error)
    throw error
  }
}

// 지출 내역 수정
export async function updateExpense(expenseId, expenseData) {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    await updateDoc(docRef, {
      date: expenseData.date,
      place: expenseData.place,
      attendees: expenseData.attendees,
      amount: Number(expenseData.amount),
      budgetCategoryId: expenseData.budgetCategoryId,
      personalShare: Number(expenseData.personalShare) || 0,
      perPerson: Number(expenseData.perPerson) || 0,
      receiptImages: expenseData.receiptImages || [],
      meetingPhotos: expenseData.meetingPhotos || [],
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('지출 내역 수정 오류:', error)
    throw error
  }
}

// 지출 내역 삭제
export async function deleteExpense(expenseId) {
  try {
    // 먼저 지출 내역 조회하여 첨부 이미지 확인
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()

      // 영수증 이미지 삭제
      if (data.receiptImages && data.receiptImages.length > 0) {
        for (const imageUrl of data.receiptImages) {
          try {
            await deleteImageByUrl(imageUrl)
          } catch (e) {
            console.warn('영수증 이미지 삭제 실패:', e)
          }
        }
      }

      // 모임 사진 삭제
      if (data.meetingPhotos && data.meetingPhotos.length > 0) {
        for (const imageUrl of data.meetingPhotos) {
          try {
            await deleteImageByUrl(imageUrl)
          } catch (e) {
            console.warn('모임 사진 삭제 실패:', e)
          }
        }
      }
    }

    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('지출 내역 삭제 오류:', error)
    throw error
  }
}

// ==================== 이미지 업로드 관련 ====================

// 영수증 이미지 업로드
export async function uploadReceiptImage(expenseId, file) {
  try {
    const fileName = `${Date.now()}_${file.name}`
    const storageRef = ref(storage, `expenses/${expenseId}/receipts/${fileName}`)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error('영수증 이미지 업로드 오류:', error)
    throw error
  }
}

// 모임 사진 업로드
export async function uploadMeetingPhoto(expenseId, file) {
  try {
    const fileName = `${Date.now()}_${file.name}`
    const storageRef = ref(storage, `expenses/${expenseId}/photos/${fileName}`)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error('모임 사진 업로드 오류:', error)
    throw error
  }
}

// URL로 이미지 삭제
async function deleteImageByUrl(imageUrl) {
  try {
    // Firebase Storage URL에서 경로 추출
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/'
    if (imageUrl.startsWith(baseUrl)) {
      const pathStart = imageUrl.indexOf('/o/') + 3
      const pathEnd = imageUrl.indexOf('?')
      const encodedPath = imageUrl.substring(pathStart, pathEnd)
      const path = decodeURIComponent(encodedPath)

      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
    }
  } catch (error) {
    console.error('이미지 삭제 오류:', error)
    throw error
  }
}

// 지출 내역에 영수증 이미지 추가
export async function addReceiptToExpense(expenseId, file) {
  try {
    const imageUrl = await uploadReceiptImage(expenseId, file)

    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const currentImages = docSnap.data().receiptImages || []
      await updateDoc(docRef, {
        receiptImages: [...currentImages, imageUrl],
        updatedAt: serverTimestamp()
      })
    }

    return imageUrl
  } catch (error) {
    console.error('영수증 추가 오류:', error)
    throw error
  }
}

// 지출 내역에 모임 사진 추가
export async function addPhotoToExpense(expenseId, file) {
  try {
    const imageUrl = await uploadMeetingPhoto(expenseId, file)

    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const currentPhotos = docSnap.data().meetingPhotos || []
      await updateDoc(docRef, {
        meetingPhotos: [...currentPhotos, imageUrl],
        updatedAt: serverTimestamp()
      })
    }

    return imageUrl
  } catch (error) {
    console.error('모임 사진 추가 오류:', error)
    throw error
  }
}

// 지출 내역에서 영수증 이미지 삭제
export async function removeReceiptFromExpense(expenseId, imageUrl) {
  try {
    await deleteImageByUrl(imageUrl)

    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const currentImages = docSnap.data().receiptImages || []
      await updateDoc(docRef, {
        receiptImages: currentImages.filter(url => url !== imageUrl),
        updatedAt: serverTimestamp()
      })
    }

    return true
  } catch (error) {
    console.error('영수증 삭제 오류:', error)
    throw error
  }
}

// 지출 내역에서 모임 사진 삭제
export async function removePhotoFromExpense(expenseId, imageUrl) {
  try {
    await deleteImageByUrl(imageUrl)

    const docRef = doc(db, EXPENSES_COLLECTION, expenseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const currentPhotos = docSnap.data().meetingPhotos || []
      await updateDoc(docRef, {
        meetingPhotos: currentPhotos.filter(url => url !== imageUrl),
        updatedAt: serverTimestamp()
      })
    }

    return true
  } catch (error) {
    console.error('모임 사진 삭제 오류:', error)
    throw error
  }
}

// ==================== 기본 예산 항목 초기화 ====================

// 중복 예산 항목 정리 (연도+이름 기준으로 중복 제거)
async function cleanupDuplicateBudgetCategories(year) {
  try {
    const categories = await getAllBudgetCategories(year)
    const seen = new Map()
    const toDelete = []

    for (const cat of categories) {
      const key = `${cat.year || ''}_${cat.name}`
      if (seen.has(key)) {
        // 중복이면 삭제 대상에 추가
        toDelete.push(cat.id)
      } else {
        seen.set(key, cat.id)
      }
    }

    // 중복 항목 삭제
    for (const id of toDelete) {
      await deleteBudgetCategory(id)
    }

    return toDelete.length
  } catch (error) {
    console.error('중복 예산 항목 정리 오류:', error)
    return 0
  }
}

// 기본 예산 항목이 없으면 생성 (연도별)
export async function initializeDefaultBudgetCategories(year) {
  try {
    const targetYear = year || new Date().getFullYear()

    // 먼저 중복 정리
    await cleanupDuplicateBudgetCategories(targetYear)

    const categories = await getAllBudgetCategories(targetYear)

    if (categories.length === 0) {
      // 기본 예산 항목 생성
      const defaults = [
        { name: '지역연구회 지원비', totalAmount: 500000, year: targetYear },
        { name: '자체회비', totalAmount: 200000, year: targetYear },
        { name: '연구소 지원금', totalAmount: 300000, year: targetYear }
      ]

      for (const cat of defaults) {
        await addBudgetCategory(cat)
      }

      return await getAllBudgetCategories(targetYear)
    }

    return categories
  } catch (error) {
    console.error('기본 예산 항목 초기화 오류:', error)
    throw error
  }
}
