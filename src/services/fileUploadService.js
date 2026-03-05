import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    setDoc,
    getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const HWP_UPLOADS_COLLECTION = 'hwp_uploads'

// 파일 목록 가져오기
export async function getUploadedFiles() {
    try {
        const q = query(
            collection(db, HWP_UPLOADS_COLLECTION),
            orderBy('boxIndex', 'asc') // 박스 위치 순서대로 정렬
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        }))
    } catch (error) {
        console.error('파일 목록 조회 오류:', error)
        throw error
    }
}

// 파일 업로드 (새 등록)
export async function uploadFile(file, name, boxIndex) {
    try {
        // 1. Storage에 파일 업로드
        // 파일명 중복 방지를 위해 timestamp 추가
        const storagePath = `uploads/${Date.now()}_${file.name}`
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, file)
        const fileUrl = await getDownloadURL(storageRef)

        // 2. Firestore에 메타데이터 저장
        // boxIndex가 이미 존재할 수도 있으니 확인 필요하나, 
        // UI에서 빈 박스만 클릭되게 하거나 덮어쓰기 로직이면 됨.
        // 여기서는 새 문서 생성. (boxIndex 중복 시 기존 것 덮어쓰기? 
        // Firestore 쿼리해서 boxIndex 같은거 있으면 업데이트? 
        // 단순하게 addDoc 하고 UI에서 필터링? -> setDoc with custom ID?
        // boxIndex를 ID로 쓰면 관리 쉽지만, 동시성 이슈? 여기선 16명 소규모라 괜찮을듯.
        // 하지만 안전하게 doc ID는 자동생성, boxIndex는 필드로. 
        // 기존에 boxIndex에 해당하는 문서가 있다면 삭제 or 업데이트해야 함.

        // 안전하게 기존 boxIndex 문서 확인 및 삭제 (덮어쓰기)
        const existingFiles = await getUploadedFiles()
        const collision = existingFiles.find(f => f.boxIndex === boxIndex)

        let docRef
        const docData = {
            name,
            fileName: file.name,
            fileUrl,
            storagePath,
            boxIndex,
            updatedAt: serverTimestamp()
        }

        if (collision) {
            // 기존 문서 업데이트 (파일도 바꿔치기 했으므로 이전 파일 삭제는 선택사항이지만 스토리지 절약 위해 삭제 권장)
            // 이전 파일 삭제
            if (collision.storagePath) {
                try {
                    const oldRef = ref(storage, collision.storagePath)
                    await deleteObject(oldRef)
                } catch (e) {
                    console.warn('이전 파일 삭제 실패:', e)
                }
            }
            // 문서 업데이트
            const existingDocRef = doc(db, HWP_UPLOADS_COLLECTION, collision.id)
            await updateDoc(existingDocRef, docData)
            docRef = existingDocRef
        } else {
            // 새 문서 생성
            docRef = await addDoc(collection(db, HWP_UPLOADS_COLLECTION), docData)
        }

        return docRef.id
    } catch (error) {
        console.error('파일 업로드 오류:', error)
        throw error
    }
}

// 재업로드 (기존 ID 유지, 파일 및 정보 교체)
export async function reuploadFile(docId, file, storagePathToDelete) {
    try {
        // 1. 기존 파일 Storage에서 삭제
        if (storagePathToDelete) {
            try {
                const oldRef = ref(storage, storagePathToDelete)
                await deleteObject(oldRef)
            } catch (e) {
                console.warn('이전 파일 삭제 실패:', e)
            }
        }

        // 2. 새 파일 업로드
        const newStoragePath = `uploads/${Date.now()}_${file.name}`
        const storageRef = ref(storage, newStoragePath)

        await uploadBytes(storageRef, file)
        const fileUrl = await getDownloadURL(storageRef)

        // 3. Firestore 업데이트
        const docRef = doc(db, HWP_UPLOADS_COLLECTION, docId)
        await updateDoc(docRef, {
            fileName: file.name,
            fileUrl,
            storagePath: newStoragePath,
            updatedAt: serverTimestamp()
        })

        return true
    } catch (error) {
        console.error('재업로드 오류:', error)
        throw error
    }
}

// 박스만 차지하고 이름만 등록 (파일 없음)
export async function registerNameOnly(name, boxIndex) {
    try {
        // 기존 boxIndex 확인
        const existingFiles = await getUploadedFiles()
        const collision = existingFiles.find(f => f.boxIndex === boxIndex)

        const docData = {
            name,
            fileName: null,
            fileUrl: null,
            storagePath: null,
            boxIndex,
            updatedAt: serverTimestamp()
        }

        if (collision) {
            // 덮어쓰기
            const existingDocRef = doc(db, HWP_UPLOADS_COLLECTION, collision.id)
            await updateDoc(existingDocRef, docData)
        } else {
            await addDoc(collection(db, HWP_UPLOADS_COLLECTION), docData)
        }
    } catch (error) {
        console.error('이름 등록 오류:', error)
        throw error
    }
}

// 이름만 등록된 상태에서 파일 추가 업로드 (또는 이름 수정)
export async function updateBoxWithFile(docId, file, name) {
    try {
        // 1. 파일 업로드
        const storagePath = `uploads/${Date.now()}_${file.name}`
        const storageRef = ref(storage, storagePath)

        await uploadBytes(storageRef, file)
        const fileUrl = await getDownloadURL(storageRef)

        // 2. Firestore 업데이트
        const docRef = doc(db, HWP_UPLOADS_COLLECTION, docId)
        await updateDoc(docRef, {
            name, // 이름도 수정 가능
            fileName: file.name,
            fileUrl,
            storagePath,
            updatedAt: serverTimestamp()
        })
    } catch (error) {
        console.error('파일 추가 오류:', error)
        throw error
    }
}

// 박스 삭제 (파일 및 DB 문서 삭제)
export async function deleteBox(docId, storagePath) {
    try {
        // 1. Storage 파일 삭제 (있다면)
        if (storagePath) {
            try {
                const fileRef = ref(storage, storagePath)
                await deleteObject(fileRef)
            } catch (e) {
                console.warn('파일 삭제 실패 (이미 없을 수 있음):', e)
            }
        }

        // 2. Firestore 문서 삭제
        await deleteDoc(doc(db, HWP_UPLOADS_COLLECTION, docId))
    } catch (error) {
        console.error('삭제 오류:', error)
        throw error
    }
}

const INITIAL_MEMBERS = [
    '이영은', '신미경', '이창건', '김어진', '안형구',
    '공정욱', '장미선', '김수진', '김유래', '조윤록',
    '차승한', '신주현', '정민영', '김안나', '김미진',
    '장상은'
]

export async function seedInitialMembers() {
    try {
        const promises = INITIAL_MEMBERS.map((name, index) =>
            registerNameOnly(name, index)
        )
        await Promise.all(promises)
        return true
    } catch (error) {
        console.error('초기 멤버 세팅 오류:', error)
        throw error
    }
}
