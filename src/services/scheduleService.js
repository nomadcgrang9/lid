import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const SCHEDULES_COLLECTION = 'schedules'

// ==================== 일정 관련 ====================

// 연도별 일정 목록 가져오기
export async function getSchedules(year = null) {
  try {
    let q
    if (year) {
      q = query(
        collection(db, SCHEDULES_COLLECTION),
        where('year', '==', year),
        orderBy('round', 'asc')
      )
    } else {
      q = query(
        collection(db, SCHEDULES_COLLECTION),
        orderBy('year', 'desc'),
        orderBy('round', 'asc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('일정 목록 조회 오류:', error)
    throw error
  }
}

// 모든 일정 가져오기 (연도 필터링은 클라이언트에서)
export async function getAllSchedules() {
  try {
    const q = query(
      collection(db, SCHEDULES_COLLECTION),
      orderBy('year', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('전체 일정 조회 오류:', error)
    throw error
  }
}

// 일정 추가
export async function addSchedule(scheduleData) {
  try {
    const docRef = await addDoc(collection(db, SCHEDULES_COLLECTION), {
      ...scheduleData,
      round: Number(scheduleData.round),
      year: Number(scheduleData.year),
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('일정 추가 오류:', error)
    throw error
  }
}

// 일정 수정
export async function updateSchedule(scheduleId, scheduleData) {
  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, scheduleId)
    await updateDoc(docRef, {
      ...scheduleData,
      round: Number(scheduleData.round),
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('일정 수정 오류:', error)
    throw error
  }
}

// 일정 삭제
export async function deleteSchedule(scheduleId) {
  try {
    await deleteDoc(doc(db, SCHEDULES_COLLECTION, scheduleId))
    return true
  } catch (error) {
    console.error('일정 삭제 오류:', error)
    throw error
  }
}

// 사용 가능한 연도 목록 가져오기 (2022년부터 현재까지)
export async function getAvailableYears() {
  try {
    const currentYear = new Date().getFullYear()
    const startYear = 2021 // 모임 시작 연도

    // 2022년부터 현재 연도까지 모든 연도 생성
    const years = []
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year)
    }

    return years
  } catch (error) {
    console.error('연도 목록 조회 오류:', error)
    return [new Date().getFullYear()]
  }
}
