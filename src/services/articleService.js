import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const ARTICLES_COLLECTION = 'articles'
const CATEGORIES_COLLECTION = 'categories'
const COMMENTS_COLLECTION = 'comments'

// ==================== 글 관련 ====================

// 글 목록 가져오기 (최신순)
export async function getArticles() {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('글 목록 조회 오류:', error)
    throw error
  }
}

// 글 상세 가져오기
export async function getArticle(articleId) {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
      }
    }
    return null
  } catch (error) {
    console.error('글 조회 오류:', error)
    throw error
  }
}

// 글 저장 (업로드)
export async function saveArticle(articleData) {
  try {
    const docData = {
      ...articleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), docData)
    return docRef.id
  } catch (error) {
    console.error('글 저장 오류:', error)
    throw error
  }
}

// 글 수정
export async function updateArticle(articleId, articleData) {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId)
    await updateDoc(docRef, {
      ...articleData,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('글 수정 오류:', error)
    throw error
  }
}

// 글 삭제
export async function deleteArticle(articleId) {
  try {
    // 글의 PDF 파일도 삭제
    const article = await getArticle(articleId)
    if (article?.pdfUrl) {
      try {
        const pdfRef = ref(storage, article.pdfUrl)
        await deleteObject(pdfRef)
      } catch (e) {
        console.warn('PDF 삭제 실패:', e)
      }
    }

    // 관련 댓글 삭제
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('articleId', '==', articleId)
    )
    const commentsSnapshot = await getDocs(commentsQuery)
    const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // 글 삭제
    await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId))
    return true
  } catch (error) {
    console.error('글 삭제 오류:', error)
    throw error
  }
}

// 비밀번호 확인
export async function verifyPassword(articleId, password) {
  try {
    const article = await getArticle(articleId)
    if (!article) return false
    return article.password === password
  } catch (error) {
    console.error('비밀번호 확인 오류:', error)
    return false
  }
}

// 임시저장
export async function saveDraft(draftData) {
  try {
    // 작성자 이름 기반 고유 ID 생성 (없으면 anonymous)
    const authorKey = (draftData.authorName || 'anonymous').replace(/\s+/g, '_')
    const draftId = `draft_${authorKey}`
    const docRef = doc(db, 'drafts', draftId)

    await setDoc(docRef, {
      ...draftData,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return draftId
  } catch (error) {
    console.error('임시저장 오류:', error)
    throw error
  }
}

// 임시저장 불러오기
export async function loadDraft(authorName) {
  try {
    const authorKey = (authorName || 'anonymous').replace(/\s+/g, '_')
    const draftId = `draft_${authorKey}`
    const docRef = doc(db, 'drafts', draftId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate?.() || null
      }
    }
    return null
  } catch (error) {
    console.error('임시저장 불러오기 오류:', error)
    return null
  }
}

// 임시저장 삭제
export async function deleteDraft(authorName) {
  try {
    const authorKey = (authorName || 'anonymous').replace(/\s+/g, '_')
    const draftId = `draft_${authorKey}`
    await deleteDoc(doc(db, 'drafts', draftId))
    return true
  } catch (error) {
    console.error('임시저장 삭제 오류:', error)
    throw error
  }
}

// ==================== PDF 관련 ====================

// PDF 업로드
export async function uploadPDF(file, articleId) {
  try {
    const fileName = `pdfs/${articleId || Date.now()}_${file.name}`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return {
      url: downloadURL,
      path: fileName,
      name: file.name
    }
  } catch (error) {
    console.error('PDF 업로드 오류:', error)
    throw error
  }
}

// 글 작성 시 파일 업로드 (PDF + 근거자료)
export async function uploadArticleFiles(files, authorName, category = '기타') {
  try {
    const uploadedFiles = []

    for (const file of files) {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
      const storagePath = `article_files/${timestamp}_${safeFileName}`
      const storageRef = ref(storage, storagePath)

      // 메타데이터 설정
      const metadata = {
        customMetadata: {
          uploadedBy: authorName || '알 수 없음',
          category: category,
          originalName: file.name
        }
      }

      await uploadBytes(storageRef, file, metadata)
      const downloadURL = await getDownloadURL(storageRef)

      uploadedFiles.push({
        fileName: file.name,
        storagePath: storagePath,
        downloadUrl: downloadURL,
        fileSize: file.size,
        fileType: file.name.split('.').pop().toLowerCase(),
        category: category
      })
    }

    return uploadedFiles
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    throw error
  }
}

// 글 저장 (파일 포함)
export async function saveArticleWithFiles(articleData, pdfFiles = [], referenceFiles = []) {
  try {
    const authorName = articleData.authorName || '알 수 없음'
    let uploadedPdfFiles = []
    let uploadedReferenceFiles = []

    // 1. PDF 파일 업로드 (법령/지침)
    if (pdfFiles && pdfFiles.length > 0) {
      uploadedPdfFiles = await uploadArticleFiles(pdfFiles, authorName, '법령/지침')
    }

    // 2. 근거자료 파일 업로드 (통계자료 또는 기타)
    if (referenceFiles && referenceFiles.length > 0) {
      // 확장자에 따라 카테고리 분류
      const categorizedFiles = referenceFiles.map(file => {
        const ext = file.name.split('.').pop().toLowerCase()
        const isStats = ['xlsx', 'xls', 'csv'].includes(ext)
        return { file, category: isStats ? '통계자료' : '기타' }
      })

      for (const { file, category } of categorizedFiles) {
        const uploaded = await uploadArticleFiles([file], authorName, category)
        uploadedReferenceFiles.push(...uploaded)
      }
    }

    // 3. 글 데이터에 파일 정보 추가
    const docData = {
      ...articleData,
      uploadedPdfFiles: uploadedPdfFiles,
      uploadedReferenceFiles: uploadedReferenceFiles,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), docData)
    return docRef.id
  } catch (error) {
    console.error('글 저장 오류 (파일 포함):', error)
    throw error
  }
}

// ==================== 카테고리 관련 ====================

// 카테고리 목록 가져오기
export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('카테고리 조회 오류:', error)
    throw error
  }
}

// 카테고리 추가
export async function addCategory(name) {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      name,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('카테고리 추가 오류:', error)
    throw error
  }
}

// 카테고리 삭제
export async function deleteCategory(categoryId) {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId))
    return true
  } catch (error) {
    console.error('카테고리 삭제 오류:', error)
    throw error
  }
}

// ==================== 댓글 관련 ====================

// 댓글 목록 가져오기
export async function getComments(articleId) {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('articleId', '==', articleId),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('댓글 조회 오류:', error)
    throw error
  }
}

// 댓글 추가
export async function addComment(articleId, author, content, paragraphKey = null, parentId = null, depth = 0) {
  try {
    const commentData = {
      articleId,
      author,
      content,
      depth,
      createdAt: serverTimestamp()
    }
    if (paragraphKey !== null) commentData.paragraphKey = paragraphKey
    if (parentId !== null) commentData.parentId = parentId

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData)
    return docRef.id
  } catch (error) {
    console.error('댓글 추가 오류:', error)
    throw error
  }
}

// 댓글 삭제
export async function deleteComment(commentId) {
  try {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId))
    return true
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    throw error
  }
}

// ==================== 관리자 관련 ====================

const ADMIN_PASSWORD = 'wpehqnsrhk1217!'

// 관리자 비밀번호 확인
export function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD
}
