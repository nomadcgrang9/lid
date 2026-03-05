import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { ref, listAll, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const SETTINGS_COLLECTION = 'app_settings'
const FILE_DELETE_PASSWORD_DOC = 'file_delete_password'
const UPLOADED_FILES_COLLECTION = 'uploaded_files'

// ==================== 파일 목록 조회 ====================

// Firebase Storage에서 모든 업로드된 파일 조회
export async function getAllUploadedFiles() {
  try {
    const files = []

    // 1. uploads 폴더 스캔
    const uploadsRef = ref(storage, 'uploads')
    try {
      const uploadsList = await listAll(uploadsRef)
      for (const itemRef of uploadsList.items) {
        try {
          const metadata = await getMetadata(itemRef)
          const downloadUrl = await getDownloadURL(itemRef)

          files.push({
            id: itemRef.fullPath,
            fileName: extractFileName(itemRef.name),
            fileType: getFileExtension(itemRef.name),
            category: categorizeFile(itemRef.name, metadata.contentType, metadata.customMetadata),
            fileSize: metadata.size,
            uploadedAt: new Date(metadata.timeCreated),
            uploadedBy: metadata.customMetadata?.uploadedBy || '알 수 없음',
            downloadUrl: downloadUrl,
            storagePath: itemRef.fullPath
          })
        } catch (e) {
          console.warn('파일 메타데이터 조회 실패:', itemRef.name, e)
        }
      }
    } catch (e) {
      console.warn('uploads 폴더 조회 실패:', e)
    }

    // 2. files 폴더 스캔 (있다면)
    const filesRef = ref(storage, 'files')
    try {
      const filesList = await listAll(filesRef)
      for (const itemRef of filesList.items) {
        try {
          const metadata = await getMetadata(itemRef)
          const downloadUrl = await getDownloadURL(itemRef)

          files.push({
            id: itemRef.fullPath,
            fileName: extractFileName(itemRef.name),
            fileType: getFileExtension(itemRef.name),
            category: categorizeFile(itemRef.name, metadata.contentType, metadata.customMetadata),
            fileSize: metadata.size,
            uploadedAt: new Date(metadata.timeCreated),
            uploadedBy: metadata.customMetadata?.uploadedBy || '알 수 없음',
            downloadUrl: downloadUrl,
            storagePath: itemRef.fullPath
          })
        } catch (e) {
          console.warn('파일 메타데이터 조회 실패:', itemRef.name, e)
        }
      }
    } catch (e) {
      // files 폴더가 없을 수 있음
    }

    // 3. article_files 폴더 스캔 (글 작성 시 업로드된 파일)
    const articleFilesRef = ref(storage, 'article_files')
    try {
      const articleFilesList = await listAll(articleFilesRef)
      for (const itemRef of articleFilesList.items) {
        try {
          const metadata = await getMetadata(itemRef)
          const downloadUrl = await getDownloadURL(itemRef)

          // 원본 파일명이 있으면 사용
          const originalName = metadata.customMetadata?.originalName || extractFileName(itemRef.name)

          files.push({
            id: itemRef.fullPath,
            fileName: originalName,
            fileType: getFileExtension(itemRef.name),
            category: categorizeFile(itemRef.name, metadata.contentType, metadata.customMetadata),
            fileSize: metadata.size,
            uploadedAt: new Date(metadata.timeCreated),
            uploadedBy: metadata.customMetadata?.uploadedBy || '알 수 없음',
            downloadUrl: downloadUrl,
            storagePath: itemRef.fullPath
          })
        } catch (e) {
          console.warn('파일 메타데이터 조회 실패:', itemRef.name, e)
        }
      }
    } catch (e) {
      // article_files 폴더가 없을 수 있음
    }

    // 날짜순 정렬 (최신순)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt)

    return files
  } catch (error) {
    console.error('파일 목록 조회 오류:', error)
    throw error
  }
}

// 파일명에서 타임스탬프 제거하고 원본 파일명 추출
function extractFileName(name) {
  // 패턴: {timestamp}_{originalName} 또는 그냥 원본 이름
  const match = name.match(/^\d+_(.+)$/)
  return match ? match[1] : name
}

// 파일 확장자 추출
function getFileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

// 파일 유형 분류
function categorizeFile(fileName, contentType, customMetadata = null) {
  // 커스텀 메타데이터에 카테고리가 있으면 우선 사용
  if (customMetadata?.category) {
    return customMetadata.category
  }

  const ext = getFileExtension(fileName).toLowerCase()
  const name = fileName.toLowerCase()

  // 법령/지침 관련 키워드
  const lawKeywords = ['법', '령', '규정', '규칙', '지침', '조례', '시행령', 'law', 'regulation']
  if (lawKeywords.some(keyword => name.includes(keyword)) || ext === 'pdf') {
    // PDF는 기본적으로 법령/지침으로 분류 (사용자가 주로 법령 PDF를 업로드하므로)
    if (ext === 'pdf') return '법령/지침'
  }

  // 통계자료
  const statsExtensions = ['xlsx', 'xls', 'csv']
  if (statsExtensions.includes(ext)) {
    return '통계자료'
  }

  // 이미지
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  if (imageExtensions.includes(ext)) {
    return '기타'
  }

  return '기타'
}

// ==================== 파일 삭제 ====================

// 단일 파일 삭제
export async function deleteFile(storagePath) {
  try {
    const fileRef = ref(storage, storagePath)
    await deleteObject(fileRef)
    return true
  } catch (error) {
    console.error('파일 삭제 오류:', error)
    throw error
  }
}

// 여러 파일 일괄 삭제
export async function deleteFiles(storagePaths) {
  try {
    const results = await Promise.allSettled(
      storagePaths.map(path => deleteFile(path))
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { succeeded, failed, total: storagePaths.length }
  } catch (error) {
    console.error('파일 일괄 삭제 오류:', error)
    throw error
  }
}

// ==================== 파일 삭제 비밀번호 관리 ====================

// 파일 삭제 비밀번호 설정 가져오기
export async function getFileDeletePassword() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FILE_DELETE_PASSWORD_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        enabled: docSnap.data().enabled ?? true,
        password: docSnap.data().password || 'wpehqnsrhk1217!'
      }
    }

    // 문서가 없으면 기본값으로 생성 (활성화 상태, 기본 비밀번호)
    const defaultSettings = { enabled: true, password: 'wpehqnsrhk1217!' }
    await setDoc(docRef, defaultSettings)
    return defaultSettings
  } catch (error) {
    console.error('파일 삭제 비밀번호 설정 조회 오류:', error)
    // 오류 시 안전하게 활성화 상태 반환 (fail-secure)
    return { enabled: true, password: 'wpehqnsrhk1217!' }
  }
}

// 파일 삭제 비밀번호 설정 업데이트 (관리자용)
export async function updateFileDeletePassword(enabled, password) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FILE_DELETE_PASSWORD_DOC)
    await setDoc(docRef, {
      enabled: enabled,
      password: password,
      updatedAt: serverTimestamp()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('파일 삭제 비밀번호 설정 저장 오류:', error)
    throw error
  }
}

// 파일 삭제 비밀번호 확인
export async function verifyFileDeletePassword(inputPassword) {
  try {
    const settings = await getFileDeletePassword()
    if (!settings.enabled) {
      return true // 기능이 비활성화면 항상 통과
    }
    return settings.password === inputPassword
  } catch (error) {
    console.error('파일 삭제 비밀번호 확인 오류:', error)
    return false
  }
}

// 파일 삭제 비밀번호 활성화 여부 확인
export async function checkFileDeletePasswordEnabled() {
  try {
    const settings = await getFileDeletePassword()
    return settings.enabled
  } catch (error) {
    console.error('파일 삭제 비밀번호 활성화 확인 오류:', error)
    return true // 오류 시 활성화로 간주 (보안상 안전)
  }
}
