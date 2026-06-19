# -*- coding: utf-8 -*-
"""
학교폭력 피해자 관점 글쓰기용 PDF 2개 생성
1. 법령지침_학교폭력피해자.pdf
2. 통계근거_학교폭력피해자.pdf
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Korean fonts
pdfmetrics.registerFont(TTFont('Malgun', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('MalgunBd', 'C:/Windows/Fonts/malgunbd.ttf'))

# ===== Styles =====
styles = getSampleStyleSheet()

title_style = ParagraphStyle('KTitle', fontName='MalgunBd', fontSize=16, leading=22, alignment=TA_CENTER, spaceAfter=6*mm)
subtitle_style = ParagraphStyle('KSubtitle', fontName='Malgun', fontSize=9, leading=13, alignment=TA_CENTER, textColor=HexColor('#666666'), spaceAfter=8*mm)
h1_style = ParagraphStyle('KH1', fontName='MalgunBd', fontSize=13, leading=18, spaceBefore=8*mm, spaceAfter=4*mm, textColor=HexColor('#1E40AF'))
h2_style = ParagraphStyle('KH2', fontName='MalgunBd', fontSize=11, leading=15, spaceBefore=5*mm, spaceAfter=3*mm, textColor=HexColor('#333333'))
body_style = ParagraphStyle('KBody', fontName='Malgun', fontSize=9.5, leading=15, spaceAfter=2*mm, alignment=TA_JUSTIFY)
bullet_style = ParagraphStyle('KBullet', fontName='Malgun', fontSize=9.5, leading=15, leftIndent=12, spaceAfter=1.5*mm)
small_style = ParagraphStyle('KSmall', fontName='Malgun', fontSize=8, leading=11, textColor=HexColor('#888888'), spaceAfter=1*mm)
note_style = ParagraphStyle('KNote', fontName='Malgun', fontSize=8.5, leading=12, textColor=HexColor('#CC0000'), spaceBefore=3*mm, spaceAfter=2*mm)
source_style = ParagraphStyle('KSource', fontName='Malgun', fontSize=7.5, leading=10, textColor=HexColor('#666666'), leftIndent=8, spaceAfter=1*mm)

BLUE = HexColor('#3B82F6')
LIGHT_BLUE = HexColor('#EFF6FF')
BORDER = HexColor('#CBD5E1')
HEADER_BG = HexColor('#1E40AF')

def make_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ('FONTNAME', (0,0), (-1,0), 'MalgunBd'),
        ('FONTNAME', (0,1), (-1,-1), 'Malgun'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('LEADING', (0,0), (-1,-1), 13),
        ('BACKGROUND', (0,0), (-1,0), HEADER_BG),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, LIGHT_BLUE]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]
    t.setStyle(TableStyle(style))
    return t

OUT = 'c:/PRODUCT/LID/docs/'

quote_style = ParagraphStyle('KQuote', fontName='Malgun', fontSize=9, leading=14,
    leftIndent=16, rightIndent=12, spaceBefore=2*mm, spaceAfter=2*mm,
    textColor=HexColor('#374151'), borderColor=HexColor('#3B82F6'),
    borderWidth=0, borderPadding=4, backColor=HexColor('#F0F4FF'))

# ======================================================================
# PDF 1: 법령지침 (재구성 — 현장 고충 뒷받침 중심)
# ======================================================================
def build_law_pdf():
    doc = SimpleDocTemplate(
        OUT + '법령지침_학교폭력피해자.pdf',
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm
    )
    story = []

    story.append(Paragraph('학교폭력 피해 신고, 그 이후의 현실', title_style))
    story.append(Paragraph('글쓰기 시스템 3단계(법령/지침) 업로드용 | 피해학생 학부모의 기대와 현장의 구조적 괴리를 뒷받침하는 법령/지침/연구', subtitle_style))

    # === 1. 포괄적 정의가 만드는 구조적 문제 ===
    story.append(Paragraph('1. "학교폭력" 개념의 포괄성이 만드는 현장의 혼란', h1_style))
    story.append(Paragraph('<b>근거: 학교폭력예방법 제2조 + 한국법제연구원 연구보고 24-07 (김현희, 2024)</b>', body_style))
    story.append(Paragraph('현행법은 상해/폭행/감금 같은 형법상 범죄와, 따돌림/사이버폭력처럼 형법 구성요건에 포함되지 않는 행위를 <b>아무런 기준 없이 혼재</b>시켜 나열하고 있다. 이로 인해 학생 간 다양한 갈등이 원인이나 맥락의 특수성이 고려되지 않은 채 "폭력"으로 단순화되고 획일적으로 처리된다.', body_style))
    story.append(Paragraph('- 미국 YRBSS는 "비슷한 힘을 가진 두 학생이 친근한 방식으로 놀리고 싸우는 것은 괴롭힘에 해당하지 않는다"고 명시 -- 한국에는 이 구분이 없음', bullet_style))
    story.append(Paragraph('- 일본: "いじめ"(괴롭힘), 영미권: "bullying" -- 장소가 아닌 행위 중심 용어. 한국만 "학교폭력"이라는 장소 기반 명칭 사용', bullet_style))
    story.append(Paragraph('- 학교 밖에서 발생한 사안도 26.7%에 달하지만 모두 "학교폭력"으로 분류됨 (2024 실태조사)', bullet_style))
    story.append(Paragraph('출처: 학교폭력예방법 제2조 / 김현희, 학교폭력 예방과 대응을 위한 법제 개선방안 연구 (한국법제연구원, 2024) p.261', source_style))
    story.append(Paragraph('출처: 추지윤 외, 학교폭력 실태조사 해외사례 비교 연구 (이화여대, 2022)', source_style))

    # === 2. 자체해결의 구조적 한계 ===
    story.append(Paragraph('2. 학교장 자체해결제 -- "해결"이라는 이름의 공백', h1_style))
    story.append(Paragraph('<b>근거: 법 제13조의2, 매뉴얼 07절, 서교연 2023-96, 차영경(2024)</b>', body_style))
    story.append(Paragraph('자체해결 4요건(2주 미만 진단서, 재산피해 없음, 비지속적, 비보복) + 피해측 서면 동의 필수. 그러나 자체해결로 결정된 이후 학교가 할 수 있는 일이 법적으로 명확하지 않다:', body_style))
    story.append(Paragraph('- 심의위원회 조치(1~9호)만 법적 효력을 가지므로, 자체해결 시 교육적 조치는 "권고"만 가능하고 가해측이 거부하면 <b>강제할 법적 근거가 부족</b>', bullet_style))
    story.append(Paragraph('- 자체해결 이후 <b>구체적 사후 조치(반성, 용서, 관계회복)가 부재</b>하여 재발 방지에 한계 (차영경, 2024)', bullet_style))
    story.append(Paragraph('- 피해측이 동의를 거부하면 경미한 사안도 심의위원회로 감 -- 자체해결 비율이 <b>73.4%(2016) -> 59.4%(2018)</b>로 감소 추세', bullet_style))
    story.append(Paragraph('- 경기도 초등학교 자체해결 비율: <b>75.4%(2020) -> 69.5%(2022)</b> 역시 감소', bullet_style))
    story.append(Paragraph('[현장의 목소리]', h2_style))
    story.append(Paragraph('"학교에서 교육적으로 하려면 지도도 하고 상담이든 면담이든 오가야 되는데, 그런 게 다 묶인 상태에서 학교에 접수해서 무언가의 조치와 처벌을 원하는 식으로 해결을 바라다 보니 점점 교육적인 해결과 멀어지는 게 아닌가" -- 전담교사 C (서교연 2023-96)', quote_style))
    story.append(Paragraph('출처: 합의적 질적 연구(2020) / 경기도교육연구원(2023) / 서교연 2023-96(장선희)', source_style))

    # === 3. 행정심판 -- 학급교체가 뒤집히는 현실 ===
    story.append(PageBreak())
    story.append(Paragraph('3. 학급교체/전학 조치의 행정심판 취소 위험', h1_style))
    story.append(Paragraph('<b>근거: 법 제17조의2, 매뉴얼 14절, 뉴시스(2025.10.15, 원문 검증)</b>', body_style))
    story.append(Paragraph('학급교체나 전학을 받더라도, 가해측이 집행정지를 신청하면 상당한 확률로 조치가 정지되어 가해학생이 원래 학급/학교로 복귀한다.', body_style))
    story.append(Spacer(1, 2*mm))

    appeal_data = [
        ['구분', '신청 건수', '인용 건수', '인용률'],
        ['행정심판 - 가해학생', '1,700건', '700건', '41.18%'],
        ['행정심판 - 피해학생', '160건', '55건', '34.38%'],
        ['행정소송 - 가해학생', '663건', '263건', '39.67%'],
        ['행정소송 - 피해학생', '53건', '15건', '28.30%'],
    ]
    story.append(make_table(appeal_data, [40*mm, 30*mm, 30*mm, 30*mm]))
    story.append(Paragraph('2022~2024 최근 3년 / 출처: 뉴시스 (강경숙 의원실, 교육부 자료)', source_style))
    story.append(Paragraph('https://www.newsis.com/view/NISX20251013_0003361018', source_style))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('- 가해학생 집행정지 신청이 피해학생의 <b>10.6~12.5배</b> 많음', bullet_style))
    story.append(Paragraph('- 가해학생 인용률이 피해학생보다 약 <b>10%p 높음</b>', bullet_style))
    story.append(Paragraph('- 전학+퇴학 처분 비율 자체도 2020년 8.6% -> 2022년 <b>4.7%</b>로 감소 추세 (트리플라잇, 2023)', bullet_style))
    story.append(Paragraph('- 긴급조치 -> 심의위 추인 -> 대책위 결정까지 <b>최소 3단계</b>를 거쳐야 확정, 어느 단계에서든 번복 시 가해학생 복귀', bullet_style))
    story.append(Paragraph('<font color="#CC0000">시사점: 학급교체를 요구해서 받더라도 41% 확률로 집행정지가 인용되어 가해학생이 돌아올 수 있다. 이것이 현장에서 학급교체를 신중하게 접근해야 하는 현실적 이유.</font>', note_style))

    # === 4. 담당교사의 구조적 모순 ===
    story.append(Paragraph('4. 학교폭력 담당교사 -- 교육자인가, 수사관인가', h1_style))
    story.append(Paragraph('<b>근거: 서교연 2023-96, 서울경제(2023.3.27, 원문 검증), KCI 전담조사관 실효성 논문(2024)</b>', body_style))
    story.append(Paragraph('현행 구조에서 학교폭력 책임교사는 수업과 생활지도를 하면서 동시에 법적 분쟁 수준의 사안처리를 담당해야 하는 이중 역할에 놓여 있다.', body_style))
    story.append(Spacer(1, 2*mm))

    teacher_data = [
        ['항목', '수치', '출처'],
        ['전국 중고교 학폭 책임교사', '6,064명', '서울경제 2023.3.27'],
        ['이 중 기간제 교사', '약 25% (1,418명)', '위 동일'],
        ['이 중 10년차 미만 저연차', '약 33% (2,026명)', '위 동일'],
        ['처리해야 할 서류', '최소 15종', '에듀인뉴스'],
        ['전담조사관 배치 후 업무경감', '체감 못 함, 오히려 증가', 'KCI 논문 2024'],
    ]
    story.append(make_table(teacher_data, [45*mm, 45*mm, 45*mm]))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('[현장의 목소리]', h2_style))
    story.append(Paragraph('"책임교사라는 말이 진짜 웃긴 거거든요. 규정 자체가 은폐가 돼도 책임져야 하고, 사안이 잘못 처리돼도 책임져야 하고." -- 교사A (차영경, 2024)', quote_style))
    story.append(Paragraph('"학교폭력 담당교사에게 권한이 없잖아요. 특히 요즘은 학교폭력이 일어나면 학생을 상대하는 게 아니라 학부모를 상대하는 일이 더 많아지고 있어요." -- 교사F (차영경, 2024)', quote_style))
    story.append(Paragraph('교사의 3가지 딜레마 (서교연 2023-96, 장선희):', body_style))
    story.append(Paragraph('- <b>판단의 딜레마</b>: "누가 피해자이고 누가 가해자인가" -- 초등학교는 가해와 피해가 뒤섞인 사례가 대부분', bullet_style))
    story.append(Paragraph('- <b>역할의 딜레마</b>: "나는 교사인가 경찰인가" -- 교육자 vs 사안조사자 정체성 갈등', bullet_style))
    story.append(Paragraph('- <b>태도의 딜레마</b>: "교육적으로 접근할 것인가, 소극적으로 방어할 것인가" -- 은폐 의혹/아동학대 고발 우려', bullet_style))

    # === 5. 학부모 인식 괴리 ===
    story.append(PageBreak())
    story.append(Paragraph('5. 학부모의 기대와 현장의 현실 사이', h1_style))
    story.append(Paragraph('<b>근거: 교육부 제5차 기본계획(2025~2029), 서교연 2023-96, 임재연(2023)</b>', body_style))
    story.append(Paragraph('교육부가 공식 인정: <b>"경미한 사안에 대한 접수 및 심의 증가 추세"</b>, 최근 3년간 심의위 심의 결과 "학교폭력 아닌" 사안 비중 증가.', body_style))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('- 교육적 해결을 경험하지 못한 교원: <b>32.9%</b> / 인지하지 못한 학부모: <b>40.8%</b> (서교연 2023-96)', bullet_style))
    story.append(Paragraph('- 교육적 해결 저해 요인 1위: <b>법/제도 및 사회적 요인 (4.30/5점)</b> > 학부모 요인(4.01) > 교사 요인(3.86)', bullet_style))
    story.append(Paragraph('- 심의위원회 개최해도 <b>약 40%의 피해학생에게 보호조치 미실시</b> (임재연, 2023)', bullet_style))
    story.append(Paragraph('- 피해학생 보호조치의 <b>80%가 심리상담에 편중</b>, 학습/교육적 회복 조치 부재', bullet_style))
    story.append(Paragraph('[현장의 목소리]', h2_style))
    story.append(Paragraph('"놀렸어요, 놀다가 때렸어요, 쟤가 지난번에도 시비를 걸었어요 -- 이런 정도를 가지고 계속 접수를 하고 있는 상황" -- 전담교사 C (서교연 2023-96)', quote_style))
    story.append(Paragraph('"학교폭력을 무기로 사용하시는 분들이 생기는 것 같아요. 처벌을 목적으로, 욱하는 마음에, 보복을 위해 무분별하게 학교폭력 신고가 이루어지지 않도록 뭔가 장치가 하나 더 있었으면 좋겠다" -- 교사K (차영경, 2024)', quote_style))

    # === 6. 초등 저학년 ===
    story.append(Paragraph('6. 초등 저학년 -- 학교폭력 프레임이 맞지 않는 아이들', h1_style))
    story.append(Paragraph('<b>근거: 경기도교육연구원(2023), SBS(2025.6.16), 교육부 제5차 기본계획, 소년법</b>', body_style))
    story.append(Paragraph('- 교원 <b>45.3%</b>: 저학년 사안 중 사소한 오해/감정싸움 비중이 <b>80% 이상</b> (경기도교육연구원 설문, 교원 4,570명)', bullet_style))
    story.append(Paragraph('- 초1~3학년 심의 중 약 <b>30%가 "조치 없음"</b>으로 종결, 1학년은 <b>약 50%</b> (SBS 2025.6.16)', bullet_style))
    story.append(Paragraph('- 2023학년도 초1~2 심의 중 <b>25%가 "학교폭력 아님"</b> 결정 (교육부 제5차 기본계획)', bullet_style))
    story.append(Paragraph('- 만 10세 미만은 소년법상 촉법소년에도 해당하지 않으나, 학교폭력예방법은 <b>연령 제한 없이 동일 적용</b>', bullet_style))
    story.append(Paragraph('- 의정부지법 2020.8.13. 선고: 만 10세 미만 학생의 행위가 학교폭력에 해당하는지 <b>"엄격하게 판단함이 타당"</b>', bullet_style))
    story.append(Paragraph('[현장의 목소리]', h2_style))
    story.append(Paragraph('"저학년 같은 경우는 애들은 아무것도 몰라요. 자기네끼리 또 놀아요. 학부모들만 소송 걸고 싸우고" -- 학교폭력 담당교사 B (경기도교육연구원, 2023)', quote_style))
    story.append(Paragraph('<b>관계회복 숙려제 (대안적 선례):</b> 서울시교육청 2025.9월~ 초1~3 시범, 교육부 2026.3월~ 전국 초1~2 시범 도입. 서울시 2024 관계조정 실적: 273건 중 183건 해결, <b>성공률 93%</b>, 심의 간 비율 <b>7% 미만</b>.', body_style))
    story.append(Paragraph('출처: 피앤피뉴스 (2025.6.17) / SBS D리포트 (2025.6.16) / 경향신문 / 오마이뉴스', source_style))

    # === 7. 해외 비교 ===
    story.append(Paragraph('7. 해외는 어떻게 하고 있는가', h1_style))
    story.append(Paragraph('<b>근거: 임재연(2018), 비교교육연구(2020), 김상곤 외(2013), 김하영 외(2023)</b>', body_style))
    intl_data = [
        ['국가', '접근 방식', '핵심 특징'],
        ['노르웨이', 'OBPP/ZERO/RESPECT', '학교/학급/개인 다차원 접근\n교육부 주도 4개 프로그램 체계 운영'],
        ['핀란드', 'KiVa/VERSO', 'KiVa: 방관자 역할 변화 초점, 학교 90% 실시\nVERSO: 또래조정으로 교사 부담 경감'],
        ['독일', 'PiT/KIBBS', '교사+경찰+사회복지사 팀 기반\n학교사회복지사가 사안 담당'],
        ['한국', '학교폭력예방법', '교사 1인에 예방~사후관리 집중\n전문인력 분담 체계 미비'],
    ]
    story.append(make_table(intl_data, [25*mm, 40*mm, 85*mm]))
    story.append(Paragraph('- 4개국 공통: <b>전문인력과 역할 분담</b>, 장기적 예방 중심, 처벌보다 교육적 접근 우선', bullet_style))
    story.append(Paragraph('- 한국: "CCTV/보안관 등 물리적 환경 중심 대응에 치우쳐 있으며, 외국처럼 장기적이고 교육적인 예방 프로그램 투자가 필요" (김상곤 외, 2013)', bullet_style))

    # === 참고문헌 ===
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('참고 자료', h2_style))
    refs = [
        '1. 2026 경기형 학교폭력 사안처리 매뉴얼 (경기도교육청)',
        '2. 학교폭력예방법 (법률 제20670호, 2025.1.21. 시행)',
        '3. 장선희, 학교폭력의 교육적 해결을 위한 제도 개선 방안 (서교연 2023-96)',
        '4. 차영경/이재용, 초등학교 학교폭력 학교장 자체해결제 개선방안 (한국초등교육, 2024)',
        '5. 김현희, 학교폭력 예방과 대응을 위한 법제 개선방안 연구 (한국법제연구원, 2024)',
        '6. 임재연, 피해학생 보호와 가해학생 선도 조치의 현황/문제점/개선방안 (한국교육논총, 2023)',
        '7. 박주형 외, 초등저학년 학교폭력 사안처리 절차개선연구 (경기도교육연구원, 2023)',
        '8. 임재연, 한국과 외국의 학교폭력 관련 교사 역할 비교 (목원대, 2018)',
        '9. 추지윤/신태섭 외, 학교폭력 실태조사 해외사례 비교 (이화여대, 2022)',
        '10. 뉴시스, 학폭 처분 집행정지 통계 (2025.10.15) - newsis.com',
        '11. 서울경제, 학폭 궂은일 떠맡는 기간제/저연차 교사 (2023.3.27) - sedaily.com',
        '12. 교육부 제5차 학교폭력 예방 및 대책 기본계획 (2025~2029)',
    ]
    for r in refs:
        story.append(Paragraph(r, source_style))

    doc.build(story)
    print('법령지침 PDF 생성 완료')


# ======================================================================
# PDF 2: 통계근거자료 (재구성 — 글의 주장 뒷받침 중심)
# ======================================================================
def build_stats_pdf():
    doc = SimpleDocTemplate(
        OUT + '통계근거_학교폭력피해자.pdf',
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm
    )
    story = []

    story.append(Paragraph('학교폭력 현장의 구조적 괴리를 보여주는 통계', title_style))
    story.append(Paragraph('글쓰기 시스템 4단계 업로드용 | "학부모의 기대"와 "학교의 현실" 사이 간극의 근거', subtitle_style))
    story.append(Paragraph('<font color="#CC0000"><b>환각 방지 원칙:</b> 아래 수치는 교육부 보도자료, 언론 보도(원문 검증), 학술 연구에서 수집하였습니다. 각 항목의 출처를 반드시 대조 확인하십시오.</font>', note_style))

    # --- 1. 자체해결 vs 심의위 비율 ---
    story.append(Paragraph('1. 학교장 자체해결 비율 -- 줄어드는 교육적 해결의 기회', h1_style))
    resolve_data = [
        ['기간/지역', '자체해결', '심의위 회부', '출처'],
        ['2016 전국', '73.4%', '10.7% (전건부의)', '합의적 질적 연구(2020)'],
        ['2018 전국', '59.4%', '18.9% (전건부의)', '위 동일 (80% 급증)'],
        ['2019.2학기 (도입 첫 학기)', '46.7%', '53.3%', '에듀인뉴스'],
        ['2020 경기도 초등', '75.4%', '-', '경기도교육연구원(2023)'],
        ['2022 경기도 초등', '69.5%', '-', '위 동일 (감소 추세)'],
    ]
    story.append(make_table(resolve_data, [38*mm, 25*mm, 33*mm, 42*mm]))
    story.append(Paragraph('<font color="#CC0000">핵심: 자체해결 비율이 지속적으로 감소 중. 피해측이 동의를 거부하면 경미 사안도 심의위로 간다.</font>', note_style))

    # --- 2. 행정심판 ---
    story.append(Paragraph('2. 행정심판/집행정지 -- 조치가 뒤집히는 현실', h1_style))
    story.append(Paragraph('<b>2022~2024 최근 3년 (뉴시스, 강경숙 의원실/교육부 자료, 원문 검증 완료)</b>', body_style))
    appeal_data2 = [
        ['구분', '신청', '인용', '인용률'],
        ['행정심판 가해학생', '1,700건', '700건', '41.18%'],
        ['행정심판 피해학생', '160건', '55건', '34.38%'],
        ['행정소송 가해학생', '663건', '263건', '39.67%'],
        ['행정소송 피해학생', '53건', '15건', '28.30%'],
    ]
    story.append(make_table(appeal_data2, [38*mm, 27*mm, 27*mm, 27*mm]))
    story.append(Paragraph('출처: https://www.newsis.com/view/NISX20251013_0003361018', source_style))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('연도별 행정심판 청구 건수 (한국일보, 이은주 의원실):', body_style))
    yearly_data = [
        ['연도', '가해학생', '피해학생', '비율'],
        ['2020', '478건', '175건', '2.7:1'],
        ['2021', '731건', '392건', '1.9:1'],
        ['2022', '868건', '447건', '1.9:1'],
    ]
    story.append(make_table(yearly_data, [25*mm, 35*mm, 35*mm, 25*mm]))
    story.append(Paragraph('<font color="#CC0000">핵심: 학급교체/전학 요구해서 받아도 가해측 집행정지 인용률 41%. 10건 중 4건이 뒤집힌다.</font>', note_style))

    # --- 3. 전학 처분 실제 비율 ---
    story.append(Paragraph('3. 전학/퇴학 처분 비율 -- 학부모 기대 vs 현실', h1_style))
    sanction_data = [
        ['항목', '수치', '출처'],
        ['전학+퇴학 비율 (2020)', '8.6%', '트리플라잇(2023)'],
        ['전학+퇴학 비율 (2022)', '4.7% (감소)', '위 동일'],
        ['심의 건수 (2020)', '8,357건', '위 동일'],
        ['심의 건수 (2022)', '약 62,053건', '위 동일'],
        ['가해학생 서면사과 미실시 비율', '48%', '임재연(2023)'],
    ]
    story.append(make_table(sanction_data, [50*mm, 35*mm, 50*mm]))
    story.append(Paragraph('<font color="#CC0000">핵심: 전학 처분 비율은 4.7%에 불과. 학부모가 기대하는 것과 실제 나올 수 있는 처분 사이에 큰 괴리.</font>', note_style))

    story.append(PageBreak())

    # --- 4. 초등 저학년 ---
    story.append(Paragraph('4. 초등 저학년 -- 절반이 "조치 없음"으로 끝나는 심의', h1_style))
    elem_data = [
        ['항목', '수치', '출처'],
        ['교원 인식: 저학년 사안 중\n오해/감정싸움 80% 이상', '교원 45.3% 응답', '경기교육연구원(2023)\n교원 4,570명 설문'],
        ['초1~3 심의 중 "조치 없음" 종결', '약 30%', 'SBS(2025.6.16)'],
        ['초1학년 "조치 없음" 비율', '약 50%', 'SBS(2025.6.16)'],
        ['초1~2 심의 중 "학교폭력 아님" 결정', '25%', '교육부 제5차 기본계획'],
        ['사안처리가 관계회복에\n도움된다는 인식 (교원)', '2.64/5점 (부정적)', '경기교육연구원(2023)'],
        ['사안처리가 관계회복에\n도움된다는 인식 (학부모)', '2.93/5점 (부정적)', '위 동일'],
    ]
    story.append(make_table(elem_data, [50*mm, 35*mm, 55*mm]))
    story.append(Paragraph('관계회복 숙려제 실적 (서울시교육청 2024):', body_style))
    story.append(Paragraph('- 273건 중 183건 해결, 심의 간 비율 <b>7% 미만</b>, 성공률 <b>93%</b>', bullet_style))
    story.append(Paragraph('<font color="#CC0000">핵심: 초등 1학년 심의의 절반이 "조치 없음"으로 끝남. 이 연령대는 학교폭력 신고가 아니라 관계회복 프로세스가 먼저여야 함.</font>', note_style))

    # --- 5. 담당교사 현황 ---
    story.append(Paragraph('5. 학교폭력 담당교사 -- 기피 업무를 떠안는 구조', h1_style))
    teacher_data2 = [
        ['항목', '수치', '출처'],
        ['전국 중고교 학폭 책임교사', '6,064명', '서울경제(2023.3.27)'],
        ['이 중 기간제 교사', '약 25% (1,418명)', '위 동일'],
        ['이 중 10년차 미만 저연차', '약 33% (2,026명)', '위 동일'],
        ['처리 서류', '최소 15종', '에듀인뉴스'],
        ['교육적 해결 경험 못 한 교원', '32.9%', '서교연 2023-96'],
        ['교육적 해결 인지 못 하는 학부모', '40.8%', '위 동일'],
    ]
    story.append(make_table(teacher_data2, [48*mm, 35*mm, 52*mm]))
    story.append(Paragraph('교사 업무 부담 구조: 업무분장 1월 말 vs 기간제 배치 2월 말 -> 남은 기피 업무를 기간제가 떠안는 구조', source_style))
    story.append(Paragraph('<font color="#CC0000">핵심: 책임교사 4명 중 1명이 기간제. 매년 바뀌는 담당자가 법적 분쟁 수준의 업무를 감당해야 하는 구조.</font>', note_style))

    # --- 6. 피해응답률 ---
    story.append(Paragraph('6. [참고] 학교폭력 피해응답률 추이', h1_style))
    yr_data2 = [
        ['학교급', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
        ['전체', '1.6', '0.9', '1.1', '1.7', '1.9', '2.1', '2.5'],
        ['초등', '3.6', '1.8', '2.5', '3.8', '3.9', '4.2', '5.0'],
        ['중학교', '0.8', '0.5', '0.4', '0.9', '1.3', '1.6', '2.1'],
        ['고등', '0.4', '0.24', '0.18', '0.3', '0.4', '0.5', '0.7'],
    ]
    story.append(make_table(yr_data2, [20*mm, 18*mm, 18*mm, 18*mm, 18*mm, 18*mm, 18*mm, 18*mm]))
    story.append(Paragraph('단위: % / 출처: 교육부 공식 블로그 2025년 1차 실태조사 결과 (2025.9.16.)', source_style))

    # --- Footer ---
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('검증된 출처 목록', h2_style))
    urls = [
        ('뉴시스 - 집행정지 통계 (원문 검증)', 'https://www.newsis.com/view/NISX20251013_0003361018'),
        ('서울경제 - 책임교사 현황 (원문 검증)', 'https://www.sedaily.com/NewsView/29N6V8Q8VR'),
        ('SBS - 관계회복 숙려제 (원문 검증)', 'https://news.sbs.co.kr/news/endPage.do?news_id=N1008140096'),
        ('트리플라잇 - 데이터로 읽는 학교폭력 (원문 검증)', 'https://www.triplelight.co/insight/school-violence-issue-40ig02'),
        ('교육부 2024 실태조사', 'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=101077'),
        ('교육부 2025 실태조사', 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156723329'),
        ('한국일보 - 행정심판 통계', 'https://m.hankookilbo.com/News/Read/A2023032615070005082'),
        ('교육앤시민 - 2024 상세 데이터', 'http://edunctn.com/news/article.html?no=17575'),
    ]
    for name, url in urls:
        story.append(Paragraph(f'- {name}: {url}', source_style))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('<font color="#CC0000"><b>최종 확인:</b> "(원문 검증)" 표시는 웹페이지 본문을 직접 읽어 수치를 확인한 항목입니다. 그 외 항목은 검색 결과 제목/요약에서 확인한 수치이므로 원문 대조를 권장합니다.</font>', note_style))

    doc.build(story)
    print('통계근거 PDF 생성 완료')


if __name__ == '__main__':
    build_law_pdf()
    build_stats_pdf()
    print('Done! 2 PDFs created in docs/')
