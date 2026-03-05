import JSZip from 'jszip'

// 스타일 정의 (header.xml에 추가될 항목):
// charPr 7 = 16pt, 검정, 볼드, 함초롬바탕 → 제목
// charPr 0 = 10pt, 검정, 함초롬바탕 → 본문/저자
// paraPr 20 = 가운데정렬 → 제목용
// paraPr 21 = 우측정렬 → 저자명용
// paraPr 0 = 양쪽정렬 → 본문용

const NAMESPACES = `xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"`

const SEC_PR = `<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/><hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY"><hp:margin header="4252" footer="4252" gutter="0" left="8504" right="8504" top="5668" bottom="4252"/></hp:pagePr><hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr><hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr><hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill></hp:secPr>`

const COL_PR = `<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>`

// 볼드 제목용 charPr (id=7): 16pt, 검정, 볼드, 함초롬바탕(fontRef=1)
const BOLD_TITLE_CHAR_PR = `<hh:charPr id="7" height="1600" textColor="#000000" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="2" bold="1"><hh:fontRef hangul="1" latin="1" hanja="1" japanese="1" other="1" symbol="1" user="1"/><hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/><hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/><hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/><hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/><hh:underline type="NONE" shape="SOLID" color="#000000"/><hh:strikeout shape="NONE" color="#000000"/><hh:outline type="NONE"/><hh:shadow type="NONE" color="#C0C0C0" offsetX="10" offsetY="10"/></hh:charPr>`

// 가운데정렬 paraPr (id=20)
const CENTER_PARA_PR = `<hh:paraPr id="20" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0"><hh:align horizontal="CENTER" vertical="BASELINE"/><hh:heading type="NONE" idRef="0" level="0"/><hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="KEEP_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/><hh:autoSpacing eAsianEng="0" eAsianNum="0"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"><hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin><hh:lineSpacing type="PERCENT" value="160" unit="HWPUNIT"/></hp:case><hp:default><hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin><hh:lineSpacing type="PERCENT" value="160" unit="HWPUNIT"/></hp:default></hp:switch><hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>`

// 우측정렬 paraPr (id=21)
const RIGHT_PARA_PR = `<hh:paraPr id="21" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0"><hh:align horizontal="RIGHT" vertical="BASELINE"/><hh:heading type="NONE" idRef="0" level="0"/><hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="KEEP_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/><hh:autoSpacing eAsianEng="0" eAsianNum="0"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"><hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin><hh:lineSpacing type="PERCENT" value="160" unit="HWPUNIT"/></hp:case><hp:default><hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin><hh:lineSpacing type="PERCENT" value="160" unit="HWPUNIT"/></hp:default></hp:switch><hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>`

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

let paraIdCounter = 1000000000

function nextParaId() {
  return String(paraIdCounter++)
}

function makeParagraph(text, charPrId, paraPrId) {
  const id = nextParaId()
  return `<hp:p id="${id}" paraPrIDRef="${paraPrId}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${charPrId}"><hp:t>${escapeXml(text)}</hp:t></hp:run></hp:p>`
}

function emptyParagraph(paraPrId = 0) {
  const id = nextParaId()
  return `<hp:p id="${id}" paraPrIDRef="${paraPrId}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`
}

function patchHeaderXml(headerXml) {
  // charProperties: itemCnt 7 → 8, 볼드 제목 charPr 추가
  headerXml = headerXml.replace(
    '<hh:charProperties itemCnt="7">',
    '<hh:charProperties itemCnt="8">'
  )
  headerXml = headerXml.replace(
    '</hh:charProperties>',
    BOLD_TITLE_CHAR_PR + '</hh:charProperties>'
  )

  // paraProperties: itemCnt 20 → 22, 가운데/우측정렬 paraPr 추가
  headerXml = headerXml.replace(
    '<hh:paraProperties itemCnt="20">',
    '<hh:paraProperties itemCnt="22">'
  )
  headerXml = headerXml.replace(
    '</hh:paraProperties>',
    CENTER_PARA_PR + RIGHT_PARA_PR + '</hh:paraProperties>'
  )

  return headerXml
}

function buildSection0Xml(article) {
  paraIdCounter = 1000000000
  const paragraphs = []

  // 첫 문단: secPr + colPr (페이지 설정, 필수) + 제목 텍스트
  const firstParaId = nextParaId()
  paragraphs.push(
    `<hp:p id="${firstParaId}" paraPrIDRef="20" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">` +
    `<hp:run charPrIDRef="0">${SEC_PR}${COL_PR}</hp:run>` +
    `<hp:run charPrIDRef="7"><hp:t>${escapeXml(article.title || '')}</hp:t></hp:run>` +
    `</hp:p>`
  )

  // 빈 줄
  paragraphs.push(emptyParagraph(20))

  // 저자명: 우측정렬
  paragraphs.push(makeParagraph(article.authorName || '', 0, 21))

  // 빈 줄
  paragraphs.push(emptyParagraph())

  // 구분선: 가운데정렬
  paragraphs.push(makeParagraph('━━━━━━━━━━━━━━━━━━━━', 0, 20))

  // 빈 줄
  paragraphs.push(emptyParagraph())

  // 본문: 섹션 content만 이어붙임 (소제목, 질문, 가이드, 카드 모두 제외)
  if (article.sections && article.sections.length > 0) {
    article.sections.forEach((section, idx) => {
      if (section.content) {
        const lines = section.content.split('\n')
        lines.forEach(line => {
          paragraphs.push(makeParagraph(line, 0, 0))
        })
      }
      // 섹션 사이 빈 줄 (마지막 제외)
      if (idx < article.sections.length - 1) {
        paragraphs.push(emptyParagraph())
      }
    })
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hs:sec ${NAMESPACES}>${paragraphs.join('')}</hs:sec>`
}

export async function downloadAsHwpx(article) {
  const response = await fetch('/template.hwpx')
  const templateBuffer = await response.arrayBuffer()

  const zip = await JSZip.loadAsync(templateBuffer)

  // header.xml에 볼드/가운데/우측 스타일 추가
  const headerXml = await zip.file('Contents/header.xml').async('string')
  zip.file('Contents/header.xml', patchHeaderXml(headerXml))

  // section0.xml 교체
  zip.file('Contents/section0.xml', buildSection0Xml(article))

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/hwp+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${article.title || '글'}.hwpx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
