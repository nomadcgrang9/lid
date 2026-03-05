import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Cloud Functions URL - 항상 실제 서버 사용
const FUNCTIONS_BASE_URL = 'https://asia-northeast3-lid-publishing-helper.cloudfunctions.net'

const PRESENTATIONS_COLLECTION = 'presentations'

/**
 * AI로 프레젠테이션 슬라이드 생성
 * @param {string} articleId - 글 ID
 * @param {number} slideCount - 생성할 슬라이드 장수
 * @returns {Promise<{slides: Array}>}
 */
export async function generatePresentation(articleId, slideCount = 10) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generatePresentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, slideCount })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '프레젠테이션 생성 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('프레젠테이션 생성 오류:', error)
    throw error
  }
}

/**
 * 프레젠테이션을 Firestore에 저장
 * @param {Object} presentationData - 프레젠테이션 데이터
 * @returns {Promise<string>} - 생성된 프레젠테이션 ID
 */
export async function savePresentation(presentationData) {
  try {
    const docData = {
      ...presentationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, PRESENTATIONS_COLLECTION), docData)
    return docRef.id
  } catch (error) {
    console.error('프레젠테이션 저장 오류:', error)
    throw error
  }
}

/**
 * 프레젠테이션 가져오기
 * @param {string} presentationId - 프레젠테이션 ID
 * @returns {Promise<Object>}
 */
export async function getPresentation(presentationId) {
  try {
    const docRef = doc(db, PRESENTATIONS_COLLECTION, presentationId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
    return null
  } catch (error) {
    console.error('프레젠테이션 조회 오류:', error)
    throw error
  }
}

/**
 * 프레젠테이션 업데이트
 * @param {string} presentationId - 프레젠테이션 ID
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Promise<boolean>}
 */
export async function updatePresentation(presentationId, updates) {
  try {
    const docRef = doc(db, PRESENTATIONS_COLLECTION, presentationId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('프레젠테이션 업데이트 오류:', error)
    throw error
  }
}

/**
 * 특정 글의 발표자료 목록 가져오기
 * @param {string} articleId - 글 ID
 * @returns {Promise<Array>}
 */
export async function getPresentationsByArticleId(articleId) {
  try {
    const q = query(
      collection(db, PRESENTATIONS_COLLECTION),
      where('articleId', '==', articleId)
    )

    const querySnapshot = await getDocs(q)
    const presentations = []

    querySnapshot.forEach((doc) => {
      presentations.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // 클라이언트에서 정렬
    presentations.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0
      const dateB = b.createdAt?.seconds || 0
      return dateB - dateA
    })

    return presentations
  } catch (error) {
    console.error('발표자료 목록 조회 오류:', error)
    return []
  }
}
