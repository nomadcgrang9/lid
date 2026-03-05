import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from '../firebase/config'

const ALBUMS_COLLECTION = 'albums'

// ==================== 앨범 관련 ====================

// 앨범 목록 가져오기
export async function getAlbums() {
  try {
    const q = query(
      collection(db, ALBUMS_COLLECTION),
      orderBy('date', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('앨범 목록 조회 오류:', error)
    throw error
  }
}

// 앨범 추가
export async function addAlbum(albumData) {
  try {
    const docRef = await addDoc(collection(db, ALBUMS_COLLECTION), {
      ...albumData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('앨범 추가 오류:', error)
    throw error
  }
}

// 앨범 수정
export async function updateAlbum(albumId, albumData) {
  try {
    const docRef = doc(db, ALBUMS_COLLECTION, albumId)
    await updateDoc(docRef, {
      ...albumData,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('앨범 수정 오류:', error)
    throw error
  }
}

// 앨범 삭제 (사진도 함께 삭제)
export async function deleteAlbum(albumId, photoUrls = []) {
  try {
    // Storage에서 사진 삭제
    for (const url of photoUrls) {
      try {
        const photoRef = ref(storage, url)
        await deleteObject(photoRef)
      } catch (e) {
        console.warn('사진 삭제 실패:', e)
      }
    }

    // Firestore에서 앨범 문서 삭제
    await deleteDoc(doc(db, ALBUMS_COLLECTION, albumId))
    return true
  } catch (error) {
    console.error('앨범 삭제 오류:', error)
    throw error
  }
}

// ==================== 사진 업로드 관련 ====================

// 사진 업로드 (단일)
export async function uploadPhoto(file, albumId) {
  try {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storagePath = `albums/${albumId}/${fileName}`
    const storageRef = ref(storage, storagePath)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return {
      url: downloadURL,
      path: storagePath,
      name: file.name,
      size: file.size
    }
  } catch (error) {
    console.error('사진 업로드 오류:', error)
    throw error
  }
}

// 여러 사진 업로드
export async function uploadPhotos(files, albumId) {
  try {
    const uploadPromises = files.map(file => uploadPhoto(file, albumId))
    const results = await Promise.all(uploadPromises)
    return results
  } catch (error) {
    console.error('사진 일괄 업로드 오류:', error)
    throw error
  }
}

// 사진 삭제
export async function deletePhoto(photoPath) {
  try {
    const photoRef = ref(storage, photoPath)
    await deleteObject(photoRef)
    return true
  } catch (error) {
    console.error('사진 삭제 오류:', error)
    throw error
  }
}

// 앨범에서 사진 제거 (Storage 삭제 + Firestore 업데이트)
export async function removePhotoFromAlbum(albumId, photoToRemove, currentPhotos) {
  try {
    // Storage에서 삭제
    if (photoToRemove.path) {
      await deletePhoto(photoToRemove.path)
    }

    // Firestore 업데이트
    const updatedPhotos = currentPhotos.filter(p => p.url !== photoToRemove.url)
    await updateAlbum(albumId, { photos: updatedPhotos })

    return updatedPhotos
  } catch (error) {
    console.error('앨범에서 사진 제거 오류:', error)
    throw error
  }
}
