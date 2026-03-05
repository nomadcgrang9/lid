import {
  collection, doc, addDoc, getDocs, getDoc,
  updateDoc, deleteDoc, query, orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const PARTS_COLLECTION = 'publication_parts'
const TOPICS_COLLECTION = 'publication_topics'

// ==================== Parts ====================

export async function getParts() {
  try {
    const q = query(collection(db, PARTS_COLLECTION), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('파트 목록 조회 오류:', error)
    throw error
  }
}

export async function updatePart(partId, data) {
  try {
    await updateDoc(doc(db, PARTS_COLLECTION, partId), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('파트 수정 오류:', error)
    throw error
  }
}

// ==================== Topics ====================

export async function getAllTopics() {
  try {
    const q = query(collection(db, TOPICS_COLLECTION), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      uploadedAt: d.data().uploadedAt?.toDate?.() || null
    }))
  } catch (error) {
    console.error('주제 목록 조회 오류:', error)
    throw error
  }
}

export async function addTopic(topicData) {
  try {
    const docRef = await addDoc(collection(db, TOPICS_COLLECTION), {
      ...topicData,
      fileUrl: null,
      fileName: null,
      storagePath: null,
      uploadedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('주제 추가 오류:', error)
    throw error
  }
}

export async function updateTopic(topicId, data) {
  try {
    await updateDoc(doc(db, TOPICS_COLLECTION, topicId), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('주제 수정 오류:', error)
    throw error
  }
}

export async function deleteTopic(topicId) {
  try {
    const topicSnap = await getDoc(doc(db, TOPICS_COLLECTION, topicId))
    if (topicSnap.exists() && topicSnap.data().storagePath) {
      try {
        await deleteObject(ref(storage, topicSnap.data().storagePath))
      } catch (e) {
        console.warn('Storage 파일 삭제 실패 (무시):', e)
      }
    }
    await deleteDoc(doc(db, TOPICS_COLLECTION, topicId))
  } catch (error) {
    console.error('주제 삭제 오류:', error)
    throw error
  }
}

// ==================== File Upload ====================

export async function uploadTopicFile(topicId, file, existingStoragePath = null) {
  try {
    if (existingStoragePath) {
      try {
        await deleteObject(ref(storage, existingStoragePath))
      } catch (e) {
        console.warn('기존 파일 삭제 실패 (무시):', e)
      }
    }

    const storagePath = `publication_files/${Date.now()}_${file.name}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file)
    const fileUrl = await getDownloadURL(storageRef)

    await updateDoc(doc(db, TOPICS_COLLECTION, topicId), {
      fileUrl,
      fileName: file.name,
      storagePath,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return { fileUrl, fileName: file.name, storagePath }
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    throw error
  }
}

export async function deleteTopicFile(topicId, storagePath) {
  try {
    if (storagePath) {
      try {
        await deleteObject(ref(storage, storagePath))
      } catch (e) {
        console.warn('Storage 파일 삭제 실패 (무시):', e)
      }
    }
    await updateDoc(doc(db, TOPICS_COLLECTION, topicId), {
      fileUrl: null,
      fileName: null,
      storagePath: null,
      uploadedAt: null,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('파일 삭제 오류:', error)
    throw error
  }
}

// ==================== Initial Data Seed ====================

const INITIAL_PARTS = [
  { name: 'Part 1', displayName: '학교라는 시스템의 기초', order: 1 },
  { name: 'Part 2', displayName: '무엇을 배우고 어떻게 평가하나', order: 2 },
  { name: 'Part 3', displayName: '갈등 해결과 소통의 현장', order: 3 }
]

const INITIAL_TOPICS = [
  // Part 3
  { partKey: 'Part 3', title: '너무 화가 나요. 학교폭력으로 신고하고 싶어요', assignedPerson: '이창건', presentationDate: '2026-03-23', order: 1 },
  { partKey: 'Part 3', title: '학교폭력 신고 당했어요, 이제 어떻게 해야하죠', assignedPerson: '이창건', presentationDate: '2026-04-20', order: 2 },
  { partKey: 'Part 3', title: '회복적 대화모임, 화해중재단? 정말 효과가 있나요', assignedPerson: '김진희', presentationDate: '2026-07-20', order: 3 },
  { partKey: 'Part 3', title: '어쩌죠, 갑자기 우리 아이한테 생활교육위원회 출석하래요', assignedPerson: '장상은', presentationDate: '2026-07-20', order: 4 },
  { partKey: 'Part 3', title: '선생님과의 상담, 언제, 어떻게 요청하는 것이 좋을까요', assignedPerson: '장상은', presentationDate: '2026-11-02', order: 5 },
  { partKey: 'Part 3', title: '이런 행동도 교권 침해에 해당하나요', assignedPerson: '김어진', presentationDate: '2026-11-02', order: 6 },
  { partKey: 'Part 3', title: '학교 민원, 왜 빨리 처리가 안 되죠? 마음이 급해요', assignedPerson: '오윤경', presentationDate: '2026-11-16', order: 7 },
  { partKey: 'Part 3', title: '학교는 말이 안 통해요. 이 문제, 교육청과 얘기할래요', assignedPerson: '공정욱', presentationDate: '2026-11-16', order: 8 },
  // Part 1
  { partKey: 'Part 1', title: '한글 책임교육이라던데, 정말 미리 안 가르쳐도 되나요', assignedPerson: '오윤경', presentationDate: '2026-04-27', order: 1 },
  { partKey: 'Part 1', title: '운동회, 체험학습, 수학여행은 왜 점점 사라지나요', assignedPerson: '안형구', presentationDate: '2026-04-27', order: 2 },
  { partKey: 'Part 1', title: '교장선생님은 학교에서 무슨 일을 하나요', assignedPerson: '김수진', presentationDate: '2026-05-18', order: 3 },
  { partKey: 'Part 1', title: '학교에는 선생님 말고 누가 있나요', assignedPerson: '공정욱', presentationDate: '2026-05-18', order: 4 },
  { partKey: 'Part 1', title: '학부모회 꼭 참여해야 하나요', assignedPerson: '장미선', presentationDate: '2026-06-01', order: 5 },
  { partKey: 'Part 1', title: '수업이 끝나면 선생님들은 무슨 일을 하세요', assignedPerson: '차승한', presentationDate: '2026-06-01', order: 6 },
  { partKey: 'Part 1', title: '유치원 교육, 초등이랑 연계가 되는 건가요', assignedPerson: '이영은', presentationDate: '2026-08-31', order: 7 },
  { partKey: 'Part 1', title: '중학 내신, 특목고 안 갈 거면 상관없나요', assignedPerson: '김미진', presentationDate: '2026-08-31', order: 8 },
  { partKey: 'Part 1', title: '공립 vs 사립 유치원, 차이가 있어요', assignedPerson: '이영은', presentationDate: '2026-09-14', order: 9 },
  { partKey: 'Part 1', title: '늘봄학교, 정말로 국가가 보육을 책임지나요', assignedPerson: '안형구', presentationDate: '2026-09-14', order: 10 },
  { partKey: 'Part 1', title: '국가에서 늘린다는 체육시간, 왜 체감이 안될까요', assignedPerson: '김유래', presentationDate: '2026-09-28', order: 11 },
  { partKey: 'Part 1', title: '내 아이가 우리반 회장으로 당선되었대요', assignedPerson: '김어진', presentationDate: '2026-09-28', order: 12 },
  // Part 2
  { partKey: 'Part 2', title: '기초학력, 정말 국가에서 보장할 수 있을까요', assignedPerson: '조윤록', presentationDate: '2026-06-15', order: 1 },
  { partKey: 'Part 2', title: '점수도, 등수도 없는 초등평가 막막해요', assignedPerson: '장미선', presentationDate: '2026-06-15', order: 2 },
  { partKey: 'Part 2', title: '수행평가는 왜 이렇게 많아졌을까요', assignedPerson: '김미진', presentationDate: '2026-06-29', order: 3 },
  { partKey: 'Part 2', title: '세특 잘 받는 아이, 어려운 아이', assignedPerson: '정민영', presentationDate: '2026-06-29', order: 4 },
  { partKey: 'Part 2', title: '디지털 교과서·에듀테크, 우리 선생님은 왜 안 하실까요', assignedPerson: '노기현/임민지', presentationDate: '2026-07-13', order: 5 },
  { partKey: 'Part 2', title: '수능공부만 하고 싶은데, 학교수업 꼭 들어야 되나요', assignedPerson: '김안나', presentationDate: '2026-07-13', order: 6 },
  { partKey: 'Part 2', title: '우리 아이 고등학교, 일반고인 게 괜찮을까요', assignedPerson: '김문정', presentationDate: '2026-10-12', order: 7 },
  { partKey: 'Part 2', title: '내 아이, 어떻게 하면 선생님과 좋은 관계를 맺을 수 있을까요', assignedPerson: '정민영/김유래', presentationDate: '2026-10-12', order: 8 },
  { partKey: 'Part 2', title: '자유학기제, 맨날 노는것 같은데 이거 꼭 필요해요', assignedPerson: '신주현', presentationDate: '2026-10-19', order: 9 },
  { partKey: 'Part 2', title: '내 아이가 원하는 과목, 우리 학교는 왜 개설을 못 하나요', assignedPerson: '김안나', presentationDate: '2026-10-19', order: 10 }
]

// 중복된 파트 제거 (같은 name을 가진 파트 중 첫 번째만 남기고 나머지 + 해당 토픽 삭제)
export async function deduplicatePublicationData() {
  try {
    const parts = await getParts()
    const seen = {}
    const toDelete = []
    for (const part of parts) {
      if (seen[part.name]) {
        toDelete.push(part.id)
      } else {
        seen[part.name] = part.id
      }
    }
    if (toDelete.length === 0) return false

    // 중복 파트에 속한 토픽도 삭제
    const allTopics = await getAllTopics()
    for (const topic of allTopics) {
      if (toDelete.includes(topic.partId)) {
        await deleteDoc(doc(db, TOPICS_COLLECTION, topic.id))
      }
    }
    for (const partId of toDelete) {
      await deleteDoc(doc(db, PARTS_COLLECTION, partId))
    }
    return true
  } catch (error) {
    console.error('중복 데이터 정리 오류:', error)
    throw error
  }
}

export async function seedPublicationData() {
  try {
    const existing = await getParts()
    if (existing.length > 0) return false

    const partIdMap = {}
    for (const part of INITIAL_PARTS) {
      const docRef = await addDoc(collection(db, PARTS_COLLECTION), {
        ...part,
        createdAt: serverTimestamp()
      })
      partIdMap[part.name] = docRef.id
    }

    for (const topic of INITIAL_TOPICS) {
      const { partKey, ...rest } = topic
      await addDoc(collection(db, TOPICS_COLLECTION), {
        ...rest,
        partId: partIdMap[partKey],
        fileUrl: null,
        fileName: null,
        storagePath: null,
        uploadedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    return true
  } catch (error) {
    console.error('초기 데이터 세팅 오류:', error)
    throw error
  }
}
