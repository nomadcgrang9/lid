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

const comments = [
  // ── 글 1: 한글, 입학 전에 꼭 떼고 가야 하나요? ──────────────────────
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p0', author: '오윤경', content: '비수처럼 꽂힌다는 좀더 순화해서 표현하는 것이 좋겠다' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p0', author: '이창건', content: '유치원에서는 한글교육을 해도 된다. 초중등의 선행학습의 개념은 아니다.' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p0', author: '이창건', content: '그러면 정책이 잘못 설계된건 아닌가요. 현실에 맞지 않게 설계된 정책과 현장의 어려움' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p0', author: '오윤경', content: '유치원에서 특성화로 비공식적으로 진행하고 있다. (근거가 없다. 유치원은 선행이라는 개념 자체가 없음. 한글 자체에 대한 초점은 아님. 한반에 3~4명 정도 한글을 떼고 오지 않는다. 다른 교과를 이해하려면 왜 안 떼고 오느냐는 정말 난해한 지점이다.' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p0', author: '이창건', content: '한글책임교육이라는게 뭔가. 사회적인 공통합의 없고 현실 실제 일어나는 현실에 대해 너무 촘촘하게 설계되어 있지를 않다. 정책이.' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p1', author: '이창건', content: '| 1학년 국어 시수 "102시간 이상" | ... 전체 국어 시수로 오독될 여지 가 있음' },
  { articleId: 'HWIjvKCQpWz2aNdED6so', paragraphKey: 's1_p2', author: '이창건', content: '실제 어느정도 인지 데이터가 필요하다 정말 한글 어느정도 하고 오는 애가 몇 프로고 - 아마 검색하면 있을것' },

  // ── 글 2: 운동회, 체험학습, 수학여행은 왜 점점 사라지나요? ──────────
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '김어진', content: '중고등학교의 사례를 추가하면 좋을 것 같아요.' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '안형구', content: '학부모의 평균적인 생각이 잘 반영된 것 같다.' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '이창건', content: '괜찮음' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '이창건', content: '중학교도 안가고 있나요?' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '안형구', content: '최근 있었던 체험학습비 60만원짜리 사례를 넣자.' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '장미선', content: '박물관도 가고 수련회도 간다는 학교는 아닌 학교와 어떤 차이가 있을까요?' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '안형구', content: '장미선-대답은 학교 선생님들의 생각 차이일 것 같다. 정도가 가능할 것 같은데 이정도는 사실대로 적어도 괜찮을까?' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '안형구', content: '김어진-학부모가 무리한 요구? 가족여행같은 수준을 요구하고있는데 그것은 무리다. 를 언급' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p0', author: '안형구', content: '장미선-현장체험학습을 안가는 학교와 가는 학교의 차이를 설명 할때의 솔직함의 정도? 솔직하게 한다.' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p1', author: '김훈경', content: '사전답사를 가고 수많은 서류를 준비하는 과정을 구체적으로 00단계라고 써주면 어떨까요? 학부모들은 이렇게 많은 행정절차가 있는지 모르니까요' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p1', author: '안형구', content: '김훈경-구체적 ㅇㅇ단계라고 쓰면 학부모가 관심을 가질까?' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p1', author: '김훈경', content: '교사들이 현장체험학습, 운동회를 준비하기 위해서 얼마나 많은 노력을 하는지 적극적인 홍보도 필요하다고 생각합니다.^^' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p1', author: '안형구', content: 'ㄴ좋은의견' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p2', author: '이창건', content: '무난함' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p2', author: '김안나', content: '학부모랑 교사가 대립되는 느낌.. 학부모라고 다 현장체험학습을 찬성하지 않을 것 같고, 교사라고 다 반대하지는 않을 것 같다는 생각. ?!' },
  { articleId: '39OY96K351aVRykg4zys', paragraphKey: 's1_p2', author: '안형구', content: 'ㄴ교사도 딜레마가 있다. 케바케가 있다. 대립하는 것 처럼 보일 필요는 없다.' },
]

async function migrate() {
  console.log(`총 ${comments.length}개 댓글 작성 시작...`)
  let success = 0
  let fail = 0

  for (const c of comments) {
    try {
      const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
        articleId: c.articleId,
        author: c.author,
        content: c.content,
        paragraphKey: c.paragraphKey,
        depth: 0,
        createdAt: serverTimestamp()
      })
      console.log(`✓ [${c.paragraphKey}] ${c.author}: ${c.content.slice(0, 30)}... → ${docRef.id}`)
      success++
    } catch (e) {
      console.error(`✗ [${c.paragraphKey}] ${c.author}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n완료: 성공 ${success} / 실패 ${fail}`)
  process.exit(0)
}

migrate()
