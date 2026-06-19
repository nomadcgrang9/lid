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
const ARTICLE_ID = '39OY96K351aVRykg4zys'

// 체험학습 글 섹션 2~4 누락 댓글
const comments = [
  // ── 2. 관련 법령 ─ s2_p0 ──────────────────────────────────────────────
  {
    paragraphKey: 's2_p0', author: '이창건',
    content: '| 시행일 "2025년 12월 2일" + "예정" 표현 | "이 조항은 2025년 12월 2일부터 시행될 예정입니다" | 날짜(2025.12.2.) 자체는 정확 — 법률 제21149호 시행일 맞음. 단, 이 글의 작성일이 2026.4.24.이므로 이미 시행 완료된 법률을 "시행될 예정"으로 표기한 것이 오류.'
  },
  {
    paragraphKey: 's2_p0', author: '이창건',
    content: '| 경기도교육청 조례 제7조 | "경기도교육청 현장체험학습 학생안전관리 조례 제7조 — 외부안전요원 우선 배치" | 조례 실재 여부 및 정확한 조항 내용 교열 시 원문 대조 필요 | ⚠️ 확인 필요 |'
  },
  {
    paragraphKey: 's2_p0', author: '이창건',
    content: '제7조(학생의 안전보장) 교육감은 자유학기제 및 현장체험학습 활동 참여기관의 장이 학생의 안전을 우선적으로 고려하도록 안전대책을 마련하여 시행한다. <개정 2021.07.14.> <개정 2024.01.10>\n\n제4조(교육감의 책무) ① 경기도교육감(이하 "교육감"이라 한다)는 자유학기제 및 현장체험학습에 참여하는 학생에게 원활한 학습이 이루어질 수 있도록 지원하기 위하여 노력하고, 필요한 경우 행정적·재정적 지원방안을 마련하여야 한다. <개정 2020.3.17.> <개정 2021.07.14.><개정 2024.01.10>\n\n② 교육감은 장애인, 저소득층 자녀, 국가유공자 자녀, 한부모가족 자녀, 다문화가족 자녀, 북한이탈주민 자녀, 다자녀 등의 취약계층 학생의 자유학기제 및 현장체험학습의 참여를 지원하기 위하여 노력하여야 한다. <개정 2021.07.14.> <개정 2024.01.10><개정 2025.8.11>'
  },

  // ── 2. 관련 법령 ─ s2_p2 ──────────────────────────────────────────────
  {
    paragraphKey: 's2_p2', author: '장미선',
    content: '외국의 사례와 법적 보호 수준이 궁금하네요.'
  },

  // ── 3. 구조적 문제 ─ s3_p0 ───────────────────────────────────────────
  {
    paragraphKey: 's3_p0', author: '안형구',
    content: '진짜 우리는 왜 안가는가 , 왜 안가고 싶은가'
  },
  {
    paragraphKey: 's3_p0', author: '김안나',
    content: '좋습니다'
  },
  {
    paragraphKey: 's3_p0', author: '김어진',
    content: '킵 고잉'
  },
  {
    paragraphKey: 's3_p0', author: '이창건',
    content: '무난한 도입부이다.'
  },

  // ── 3. 구조적 문제 ─ s3_p1 ───────────────────────────────────────────
  {
    paragraphKey: 's3_p1', author: '김훈경',
    content: '디테일하고 허무맹랑한 관련 민원들을 외면할 수 없는 현재 민원 시스템도 집고 넘어가야 할 듯 합니다. 대다수는 정상이지만 이 소수의 과도한 민원과 어우러져 학교 교육이 위축될 수 밖에 없는 실정도 사례를 넣어야 한다고 생각합니다. 예를 들면 체육대회 소음 민원 대응(아파트 관리실에 협조 공문 보내기도 함), 모래만지지 말라고 왜 혼내느냐 등, 체험학습 예산 관련 버스, 친구, 식사 전방위 민원 등입니다.'
  },
  {
    paragraphKey: 's3_p1', author: '장미선',
    content: '너무 변명같나...?'
  },
  {
    paragraphKey: 's3_p1', author: '김안나',
    content: '저는 괜찮다고 생각합니다'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '교사)민원때문에 못하겠다는 의견 반영 필요'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '악성민원에 대한 꼭지도 있나 확인?'
  },
  {
    paragraphKey: 's3_p1', author: '장미선',
    content: '민원에 대한 내용을 추가하는 것은 어떨까요? 정말 현실적으로 들어오는 운동회, 현장체험학습, 수학여행에서의 민원 등..'
  },
  {
    paragraphKey: 's3_p1', author: '김안나',
    content: '네 저도 민원 문제가 상당한 부분이라고 생각해요. 법적 모호성도 있지만 열정을 갖고 추진하는 업무에 수많은 민원, 요구가 들어와서 사기가 떨어지니까요'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '학부모-교사 체험학습에 대한 정의가 다르다. 학부모-놀아주기, 교사-학습목적. 이 부분을 먼저 짚고 넘어갈 필요가 있다.'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '민원, 법적문제 해결되면 체험학습 가겠다는 선생님들이 많다.'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '추억?에 대한 학부모-교사 공감대가 있다.'
  },
  {
    paragraphKey: 's3_p1', author: '김안나',
    content: '학생들이 주도적으로 계획하고 진행하는 체험학습은 학생들의 주도성을 키울 수 있어서 좋은 것 같다.'
  },
  {
    paragraphKey: 's3_p1', author: '안형구',
    content: '담임에 대한 과도한 책임 문제(중학교와 비교했을 때)'
  },
  {
    paragraphKey: 's3_p1', author: '이창건',
    content: '그냥 중과실이 아니라 고의로 중과실을 일으켰을때만'
  },

  // ── 3. 구조적 문제 ─ s3_p2 ───────────────────────────────────────────
  {
    paragraphKey: 's3_p2', author: '이창건',
    content: '### 3. 대안의 실질성 ★☆☆\n\n| 제안 | 내용 | 평가 |\n|---|---|---|\n| 체험학습 전담 안전요원 배치 | 교사=교육, 전문 인력=안전 역할 분리 | ✅ 방향 타당하나 예산 확보 주체·방안 전무. 경기도 조례가 이미 이 방향을 명시했음에도 현장 미적용 이유 미분석 |\n| 국가 면책 범위 명확화 | "민·형사상 책임을 완전히 피할 수 있다는 확신이 생겨야 한다" | ❌ 방향 제시에 그침. 구체적 입법 보완 방안(중과실 기준 명문화, 가이드라인 법제화 등) 없음 |\n| 학부모-학교 공동 연대 | "불가피한 위험에 대한 공동의 연대 약속" | ❌ 가장 추상적인 제안. 어떤 제도적 장치나 절차로 이를 구현할지 전혀 없음 |\n\n핵심 지적: 대안 섹션이 사실상 원칙의 선언에 머물러 있음. 글의 앞부분에서 치밀하게 구조적 문제를 분석한 것에 비해 대안이 매우 짧고 추상적이어서 독자 입장에서 "그래서 어떻게 하면 되는데?"라는 질문에 답하지 못함. 정책 연구 수준의 대안 제시가 필요한 섹션에서 가장 약한 부분.'
  },

  // ── 4. 대안 제시 ─ s4_p0 ────────────────────────────────────────────
  {
    paragraphKey: 's4_p0', author: '안형구',
    content: '학부모의 학교교육활동에 대한 존중 및 식사 숙박 등 어느정도 기준을 내려놓아야 한다는 말을 부드럽게...'
  },
  {
    paragraphKey: 's4_p0', author: '안형구',
    content: '학부모의 요구가 체험학습의 교육적 목적에 적합한지 판단후 제안하시도록'
  },
  {
    paragraphKey: 's4_p0', author: '이창건',
    content: '학부모 자기 검열 필요'
  },
  {
    paragraphKey: 's4_p0', author: '장미선',
    content: '학교와 교사의 지도에 따르지 않을 경우 발생하는 문제는 학생 및 보호자의 책임이라는 동의서를 쓰고 동의한 학생들만 간다면?(ㅋㅋㅋㅋ)'
  },
  {
    paragraphKey: 's4_p0', author: '안형구',
    content: '이창건-법을 더 교사 보호하는 방향으로 바꿔달라'
  },
  {
    paragraphKey: 's4_p0', author: '김안나',
    content: '대안은 아니지만 실제로 처벌받지 않은 법적 사례가 생기면 그 때서야 선생님들이 가게 되지 않을까...싶네요'
  },
  {
    paragraphKey: 's4_p0', author: '김훈경',
    content: '안전과 학교폭력 관련 사안 사전 예방교육 실시 시 교사 관련 민원과 처벌 면책, 외국의 경우 처럼 안전 관련 동의서를 쓴 학생만 참여 가능, 관련 개인적 민원이 교사를 괴롭히는 수준에 대한 변별 후 무시?'
  },
  {
    paragraphKey: 's4_p0', author: '김안나',
    content: '밖으로 나가는 것이 체험학습의 전부가 아닌 것으로 주제를 열어 체험학습 방식의 다양화로 마무리 하면 어떨까요?'
  },
  {
    paragraphKey: 's4_p0', author: '이창건',
    content: '법적 효력이 완벽한 동의서를 받는다.'
  },
  {
    paragraphKey: 's4_p0', author: '김훈경',
    content: '작년에 저희 학교는 교장선생님이 사고 시 책임을 지겠다는 약속을 공증 받고, 운영위 통과하였습니다. 관리자 분들도 함께 책임을 져야 한다. 살짝 넣을 수도...'
  },
]

async function run() {
  console.log(`총 ${comments.length}개 댓글 추가 시작...`)
  let success = 0, fail = 0

  for (const c of comments) {
    try {
      const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
        articleId: ARTICLE_ID,
        author: c.author,
        content: c.content,
        paragraphKey: c.paragraphKey,
        depth: 0,
        createdAt: serverTimestamp()
      })
      console.log(`✓ [${c.paragraphKey}] ${c.author}: ${c.content.slice(0, 40).replace(/\n/g, ' ')}...`)
      success++
    } catch (e) {
      console.error(`✗ [${c.paragraphKey}] ${c.author}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n완료: 성공 ${success} / 실패 ${fail}`)
  process.exit(0)
}

run()
