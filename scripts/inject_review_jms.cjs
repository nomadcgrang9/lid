const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: "AIzaSyD1FhXnu124OGrqKH8HqHQgIvmGsbEMa9U",
  authDomain: "lid-publishing-helper.firebaseapp.com",
  projectId: "lid-publishing-helper",
  storageBucket: "lid-publishing-helper.firebasestorage.app",
  messagingSenderId: "273413128584",
  appId: "1:273413128584:web:774490a0cb720e8674fa3d"
}
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const COMMENTS_COLLECTION = 'comments'
const ARTICLE_ID = 'cz0UvfMnmrC1K5ZlWB7G' // 점수도 등수도 없는데… (장미선)
const AUTHOR = '이창건'

const comments = [
  // ── 2. 관련 법령 (s2_p0) ──
  { paragraphKey: 's2_p0',
    content: '⚠️ [재검토] 법령 인용 형식·출처. 수행평가 원칙·수업 중 실시·과제형 금지라는 \'내용\'은 정확합니다(교육부 훈령 「학교생활기록 작성 및 관리지침」, 시행 2025.3.1.에서 확인). 다만 ①\'경기도교육청 학업성적관리 시행지침 해설서 제2조 제2항\'처럼 해설서를 조문으로 인용한 형식은 성립하기 어렵습니다(해설서는 조문 체계가 아니라 해설 텍스트). ②서울 제7조 제3항 등 조·항 번호와 따옴표 문구가 실제 원문과 일치하는지 원본 대조가 필요합니다. 출처를 교육부 훈령으로 바꾸거나 병기하는 편이 안전합니다.' },
  { paragraphKey: 's2_p0',
    content: '⚠️ [재검토] \'전국 모든 초등학교가 따라야 하는 공통된 원칙\' 표현. 서울·경기 두 시도교육청 지침만 근거로 전국을 단정한 점이 약합니다. 학업성적관리 시행지침은 시·도교육청별로 따로 제정·운영되며, 전국 공통 근거는 교육부 훈령입니다. \'각 시도교육청이 유사한 방향으로 운영하며, 그 공통 근거는 교육부 「학교생활기록 작성 및 관리지침」\'으로 다듬는 것을 제안합니다.' },
  // ── 2. 관련 법령 (s2_p1) ──
  { paragraphKey: 's2_p1',
    content: '⚠️ [표현 정리] \'지양\'과 \'금지\'의 강도 불일치. 앞 문단 인용은 \'과제형 평가는 지양한다\'(권고)인데, 여기서는 \'금지되어 있습니다\'(강제)로 강도가 달라집니다. 훈령 실제 표현은 \'과제형 수행평가는 실시하지 않는다\'에 가까워 \'금지\'로 통일해도 무방하지만, 따옴표 인용과 해설의 강도를 일치시켜 주세요.' },
  // ── 2. 관련 법령 (s2_p2) ──
  { paragraphKey: 's2_p2',
    content: '✅ [정확·유지] \'숙제(과제물)는 그 자체로 성적에 직접 반영되지 않는다\'며 숙제와 평가를 구분해 학부모 오해를 짚은 부분은 교육부 훈령과 일치하는 정확한 서술입니다. 그대로 유지 권장합니다.' },
  { paragraphKey: 's2_p2',
    content: '✅ [정확] \'학기 초 가정통신문·학교 홈페이지로 평가 영역·시기·방법·기준을 안내\'하는 의무는 학업성적관리규정상 실제로 존재합니다. 정확한 서술입니다.' },
  // ── 4. 대안 제시 (s4_p1) ──
  { paragraphKey: 's4_p1',
    content: '⚠️ [재검토·시의성] AI 디지털 교과서 서술이 2026년 6월 현재와 어긋납니다. \'최근 도입되고 있는… 적극 활용\'으로 썼지만, AI 디지털교과서(AIDT)는 초·중등교육법 개정으로 \'교과서\'에서 \'교육자료\'로 격하되어 학교장 재량 채택으로 바뀌었고, 2025년 채택·실사용률이 매우 낮아(미접속 학생 다수) 올해는 선도학교 중심 축소 운영 상태입니다. \'학습분석을 지원하는 AI 코스웨어·평가 플랫폼 등 디지털 도구\'로 일반화하거나, 현재 지위(교육자료 전환)를 정확히 반영해 수정하는 것을 권합니다.' },
  { paragraphKey: 's4_p1',
    content: '💡 [보강 제안] 가정 수준 대안(질문 바꾸기·독서 대화)은 구체적이고 좋습니다. 다만 학교·제도 수준 일부가 \'~해야 한다\'로 끝나 실행 주체·방법이 약합니다. 예: \'루브릭을 쉬운 언어로 사전 안내\' → 누가/언제/어떤 양식으로 안내할지 한 문장씩 구체화하면 대안의 실효성이 올라갑니다.' },
  // ── 1. 사례 (s1_p0) — 전체 총평 ──
  { paragraphKey: 's1_p0',
    content: '✅ [전체 총평] 4단계 흐름(사례→법령→구조→대안), 학부모·교사 시선의 균형, 경어체 일관성, 토의 질문과 섹션 논점의 연결이 모두 기획서 방향에 잘 부합하는 좋은 원고입니다. 출판 전 보완은 ②법령 섹션 인용 형식·출처와 ④대안 섹션의 AI 디지털교과서 시의성 두 가지에 집중하면 됩니다.' },
]

async function run() {
  console.log(`articleId=${ARTICLE_ID}, author=${AUTHOR}, 총 ${comments.length}개 주입 시작...`)
  let success = 0, fail = 0
  for (const c of comments) {
    try {
      await addDoc(collection(db, COMMENTS_COLLECTION), {
        articleId: ARTICLE_ID,
        author: AUTHOR,
        content: c.content,
        paragraphKey: c.paragraphKey,
        depth: 0,
        createdAt: serverTimestamp()
      })
      console.log(`✓ [${c.paragraphKey}] ${c.content.slice(0, 38).replace(/\n/g, ' ')}...`)
      success++
    } catch (e) {
      console.error(`✗ [${c.paragraphKey}] ${e.message}`)
      fail++
    }
  }
  console.log(`\n완료: 성공 ${success} / 실패 ${fail}`)
  process.exit(fail ? 1 : 0)
}
run()
