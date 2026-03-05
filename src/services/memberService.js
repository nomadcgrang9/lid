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
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const MEMBERS_COLLECTION = 'members'
const SETTINGS_COLLECTION = 'app_settings'
const MEMBERS_PASSWORD_DOC = 'members_password'
const ZOOM_PASSWORD_DOC = 'zoom_password'
const LANDING_SETTINGS_DOC = 'landing_settings'
const WRITE_GUIDE_DOC = 'write_guide'
const EXAMPLE_ARTICLE_DOC = 'example_article'
const ENTRANCE_PASSWORD_DOC = 'entrance_password'
const AI_PROMPTS_DOC = 'ai_prompts'

// ==================== 회원 관련 ====================

// 회원 목록 가져오기
export async function getMembers() {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('회원 목록 조회 오류:', error)
    throw error
  }
}

// 회원 추가
export async function addMember(memberData) {
  try {
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
      ...memberData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('회원 추가 오류:', error)
    throw error
  }
}

// 회원 수정
export async function updateMember(memberId, memberData) {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId)
    await updateDoc(docRef, {
      ...memberData,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('회원 수정 오류:', error)
    throw error
  }
}

// 회원 삭제
export async function deleteMember(memberId) {
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId))
    return true
  } catch (error) {
    console.error('회원 삭제 오류:', error)
    throw error
  }
}

// 여러 회원 일괄 추가 (엑셀 업로드용)
export async function addMembersBatch(membersArray) {
  try {
    const promises = membersArray.map(member =>
      addDoc(collection(db, MEMBERS_COLLECTION), {
        ...member,
        createdAt: serverTimestamp()
      })
    )
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('회원 일괄 추가 오류:', error)
    throw error
  }
}

// ==================== 비밀번호 관련 ====================

// 인원현황 비밀번호 확인
export async function verifyMembersPassword(password) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, MEMBERS_PASSWORD_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data().password === password
    }

    // 문서가 없으면 기본 비밀번호로 생성
    await setDoc(docRef, { password: 'wpehqnsrhk1217!' })
    return password === 'wpehqnsrhk1217!'
  } catch (error) {
    console.error('비밀번호 확인 오류:', error)
    return false
  }
}

// 비밀번호 변경 (관리자용)
export async function updateMembersPassword(newPassword) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, MEMBERS_PASSWORD_DOC)
    await setDoc(docRef, { password: newPassword })
    return true
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)
    throw error
  }
}

// ==================== 줌 미팅 비밀번호 관련 ====================

// 줌 미팅 비밀번호 확인
export async function verifyZoomPassword(password) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ZOOM_PASSWORD_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data().password === password
    }

    // 문서가 없으면 기본 비밀번호로 생성
    await setDoc(docRef, { password: 'wpehqnsrhk1217!' })
    return password === 'wpehqnsrhk1217!'
  } catch (error) {
    console.error('줌 비밀번호 확인 오류:', error)
    return false
  }
}

// 줌 미팅 비밀번호 변경 (관리자용)
export async function updateZoomPassword(newPassword) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ZOOM_PASSWORD_DOC)
    await setDoc(docRef, { password: newPassword })
    return true
  } catch (error) {
    console.error('줌 비밀번호 변경 오류:', error)
    throw error
  }
}

// 현재 비밀번호 가져오기 (관리자 페이지용)
export async function getPagePasswords() {
  try {
    const membersDocRef = doc(db, SETTINGS_COLLECTION, MEMBERS_PASSWORD_DOC)
    const zoomDocRef = doc(db, SETTINGS_COLLECTION, ZOOM_PASSWORD_DOC)

    const [membersSnap, zoomSnap] = await Promise.all([
      getDoc(membersDocRef),
      getDoc(zoomDocRef)
    ])

    return {
      members: membersSnap.exists() ? membersSnap.data().password : 'wpehqnsrhk1217!',
      zoom: zoomSnap.exists() ? zoomSnap.data().password : 'wpehqnsrhk1217!'
    }
  } catch (error) {
    console.error('비밀번호 조회 오류:', error)
    return {
      members: 'wpehqnsrhk1217!',
      zoom: 'wpehqnsrhk1217!'
    }
  }
}

// ==================== 랜딩페이지 설정 관련 ====================

// 기본 랜딩페이지 설정값
const DEFAULT_LANDING_SETTINGS = {
  introLine1: '짜임새 있는 기획과 새로운 네트워크로',
  introLine2: '현장을 바꾸는 사람들,',
  introLine3: '제도혁신 SINCE 2022',
  accountBank: '카카오뱅크',
  accountNumber: '79421308150',
  donationLink: '',
  zoomUrl: '',
  zoomPassword: ''
}

// 랜딩페이지 설정 가져오기
export async function getLandingSettings() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_SETTINGS_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { ...DEFAULT_LANDING_SETTINGS, ...docSnap.data() }
    }

    // 문서가 없으면 기본값으로 생성
    await setDoc(docRef, DEFAULT_LANDING_SETTINGS)
    return DEFAULT_LANDING_SETTINGS
  } catch (error) {
    console.error('랜딩페이지 설정 조회 오류:', error)
    return DEFAULT_LANDING_SETTINGS
  }
}

// 랜딩페이지 설정 업데이트
export async function updateLandingSettings(settings) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_SETTINGS_DOC)
    await setDoc(docRef, settings, { merge: true })
    return true
  } catch (error) {
    console.error('랜딩페이지 설정 저장 오류:', error)
    throw error
  }
}

// 랜딩페이지 개별 설정 업데이트
export async function updateLandingSetting(key, value) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_SETTINGS_DOC)
    await setDoc(docRef, { [key]: value }, { merge: true })
    return true
  } catch (error) {
    console.error('랜딩페이지 설정 저장 오류:', error)
    throw error
  }
}

// ==================== 글쓰기 탭 사용 방법 설정 관련 ====================

// 기본 글쓰기 가이드 설정값
const DEFAULT_WRITE_GUIDE = '인공지능 기반으로 출판 글쓰기 및 진행자료 만들기를 도와드립니다.\n안 쓰셔도 됩니다.\n직접 본인이 쓰셔도 무관하나 다만 올해는 출판시 통일성을 위해 4단 흐름을 되도록이면 지켜 주십시오.'

// 글쓰기 가이드 가져오기
export async function getWriteGuide() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, WRITE_GUIDE_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data().content || DEFAULT_WRITE_GUIDE
    }

    // 문서가 없으면 기본값으로 생성
    await setDoc(docRef, { content: DEFAULT_WRITE_GUIDE })
    return DEFAULT_WRITE_GUIDE
  } catch (error) {
    console.error('글쓰기 가이드 조회 오류:', error)
    return DEFAULT_WRITE_GUIDE
  }
}

// 글쓰기 가이드 업데이트
export async function updateWriteGuide(content) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, WRITE_GUIDE_DOC)
    await setDoc(docRef, { content })
    return true
  } catch (error) {
    console.error('글쓰기 가이드 저장 오류:', error)
    throw error
  }
}

// ==================== 랜딩페이지 이미지 업로드 관련 ====================

// 랜딩페이지 대표 이미지 업로드
export async function uploadLandingImage(file) {
  try {
    // 파일 확장자 추출
    const ext = file.name.split('.').pop()
    const fileName = `landing_image_${Date.now()}.${ext}`

    // Firebase Storage에 업로드
    const storageRef = ref(storage, `landing/${fileName}`)
    await uploadBytes(storageRef, file)

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef)

    // Firestore에 이미지 URL 저장
    await updateLandingSetting('landingImageUrl', downloadURL)

    return downloadURL
  } catch (error) {
    console.error('랜딩 이미지 업로드 오류:', error)
    throw error
  }
}

// ==================== 예시글 관련 ====================

// 예시글 정보 가져오기
export async function getExampleArticle() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, EXAMPLE_ARTICLE_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }

    return null
  } catch (error) {
    console.error('예시글 조회 오류:', error)
    return null
  }
}

// 예시글 파일 업로드
export async function uploadExampleArticle(file) {
  try {
    // 파일 확장자 추출
    const ext = file.name.split('.').pop()
    const fileName = `example_article_${Date.now()}.${ext}`

    // Firebase Storage에 업로드
    const storageRef = ref(storage, `example_articles/${fileName}`)
    await uploadBytes(storageRef, file)

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef)

    // Firestore에 메타데이터 저장
    const docRef = doc(db, SETTINGS_COLLECTION, EXAMPLE_ARTICLE_DOC)
    const data = {
      fileName: file.name,
      fileUrl: downloadURL,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: serverTimestamp()
    }
    await setDoc(docRef, data)

    return downloadURL
  } catch (error) {
    console.error('예시글 업로드 오류:', error)
    throw error
  }
}

// 예시글 삭제
export async function deleteExampleArticle() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, EXAMPLE_ARTICLE_DOC)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('예시글 삭제 오류:', error)
    throw error
  }
}

// ==================== 입장 비밀번호 관련 ====================

// 입장 비밀번호 설정 가져오기
export async function getEntrancePassword() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ENTRANCE_PASSWORD_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        enabled: docSnap.data().enabled || false,
        password: docSnap.data().password || ''
      }
    }

    // 문서가 없으면 기본값으로 생성 (비활성화 상태)
    const defaultSettings = { enabled: false, password: '' }
    await setDoc(docRef, defaultSettings)
    return defaultSettings
  } catch (error) {
    console.error('입장 비밀번호 설정 조회 오류:', error)
    // 오류 시 안전하게 비활성화 상태 반환 (fail-open)
    return { enabled: false, password: '' }
  }
}

// 입장 비밀번호 설정 업데이트 (관리자용)
export async function updateEntrancePassword(enabled, password) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ENTRANCE_PASSWORD_DOC)
    await setDoc(docRef, {
      enabled: enabled,
      password: password,
      updatedAt: serverTimestamp()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('입장 비밀번호 설정 저장 오류:', error)
    throw error
  }
}

// 입장 비밀번호 확인
export async function verifyEntrancePassword(inputPassword) {
  try {
    const settings = await getEntrancePassword()
    if (!settings.enabled) {
      return true // 기능이 비활성화면 항상 통과
    }
    return settings.password === inputPassword
  } catch (error) {
    console.error('입장 비밀번호 확인 오류:', error)
    return false
  }
}

// 입장 비밀번호 활성화 여부 확인
export async function checkEntrancePasswordEnabled() {
  try {
    const settings = await getEntrancePassword()
    return settings.enabled
  } catch (error) {
    console.error('입장 비밀번호 활성화 확인 오류:', error)
    return false // 오류 시 비활성화로 간주
  }
}

// ==================== AI 프롬프트 관리 ====================

// 기본 프롬프트 템플릿
const DEFAULT_ARTICLE_PROMPT = `당신은 교육 정책 전문 작가입니다. 현직 교사가 제공한 정보를 바탕으로 교육 정책 관련 글을 작성해주세요.

[글의 구조 - 4단 구조]
1. 사례 제시: 현직교사 입장에서 민원/문제를 직접 겪어본 사례들 제시
2. 관련 법령: 관련된 법령이나 규칙을 조문번호와 함께 정확히 제시
3. 구조적 문제 - 학교현실: 학교 현장에서의 구조적 문제점 분석
4. 대안 제시: 문제 해결을 위한 구체적인 대안 제시

[작성 지침]
- [분량지침] 작성해주세요
- 반드시 "~습니다", "~입니다" 형태의 경어체(존댓말)로 일관되게 작성하세요. 절대 반말을 사용하지 마세요.
- 전문적이면서도 읽기 쉬운 문체로 작성
- 각 단락은 충분한 분량으로 상세하게 작성
- 법령 인용 시 조문번호를 정확히 명시

[중요 - 서식 금지사항]
- 절대로 마크다운 문법을 사용하지 마세요
- 별표(*), 이중별표(**), 샵(#), 백틱(\`) 등의 기호를 텍스트 강조용으로 사용하지 마세요
- 순수한 일반 텍스트로만 작성하세요
- 글머리 기호가 필요하면 "- " 또는 숫자 "1. 2. 3."만 사용하세요

[제공된 정보]

주제: [사용자주제]

사례 (작성자 제공):
[사용자사례]

관련 법령/지침 (PDF에서 추출):
[PDF내용]

근거자료 (작성자 제공):
[근거자료내용]

구조적 문제점 (작성자 의견):
[구조적문제점]

대안 (작성자 의견):
[대안제시]

[출력 형식]
반드시 아래 JSON 형식으로만 출력하세요. JSON 외의 텍스트는 출력하지 마세요:
{
  "title": "글 제목",
  "sections": [
    { "id": 1, "title": "1. 사례", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 2, "title": "2. 관련 법령", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 3, "title": "3. 구조적 문제 - 학교 현실", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" },
    { "id": 4, "title": "4. 대안 제시", "content": "내용 (마크다운 기호 없이 순수 텍스트만)" }
  ]
}`

// AI 프롬프트 가져오기
export async function getAiPrompts() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AI_PROMPTS_DOC)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }

    // 기본값 설정
    const defaultPrompts = {
      articleGeneration: DEFAULT_ARTICLE_PROMPT
    }
    await setDoc(docRef, defaultPrompts)
    return defaultPrompts
  } catch (error) {
    console.error('AI 프롬프트 조회 오류:', error)
    return {
      articleGeneration: DEFAULT_ARTICLE_PROMPT
    }
  }
}

// AI 프롬프트 업데이트
export async function updateAiPrompt(promptType, content) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AI_PROMPTS_DOC)
    await setDoc(docRef, {
      [promptType]: content,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('AI 프롬프트 업데이트 오류:', error)
    throw error
  }
}

// AI 프롬프트 기본값으로 초기화
export async function resetAiPromptToDefault(promptType) {
  try {
    const defaults = {
      articleGeneration: DEFAULT_ARTICLE_PROMPT
    }

    if (!defaults[promptType]) {
      throw new Error('알 수 없는 프롬프트 타입')
    }

    await updateAiPrompt(promptType, defaults[promptType])
  } catch (error) {
    console.error('AI 프롬프트 초기화 오류:', error)
    throw error
  }
}
