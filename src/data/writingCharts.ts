import { SCRIPT_GLYPHS, type LanguageId } from './languages'

export interface ChartCell {
  glyph: string
  reading: string
}

export type ChartGrid = (ChartCell | null)[][]

function kanaRow(glyphs: string, readings: readonly string[]): (ChartCell | null)[] {
  return [...glyphs].map((glyph, index) => ({
    glyph,
    reading: readings[index] ?? '',
  }))
}

function gojuon(script: 'hira' | 'kata'): ChartGrid {
  const rows =
    script === 'hira'
      ? [
          ['あいうえお', ['a', 'i', 'u', 'e', 'o']],
          ['かきくけこ', ['ka', 'ki', 'ku', 'ke', 'ko']],
          ['さしすせそ', ['sa', 'shi', 'su', 'se', 'so']],
          ['たちつてと', ['ta', 'chi', 'tsu', 'te', 'to']],
          ['なにぬねの', ['na', 'ni', 'nu', 'ne', 'no']],
          ['はひふへほ', ['ha', 'hi', 'fu', 'he', 'ho']],
          ['まみむめも', ['ma', 'mi', 'mu', 'me', 'mo']],
          ['らりるれろ', ['ra', 'ri', 'ru', 're', 'ro']],
        ]
      : [
          ['アイウエオ', ['a', 'i', 'u', 'e', 'o']],
          ['カキクケコ', ['ka', 'ki', 'ku', 'ke', 'ko']],
          ['サシスセソ', ['sa', 'shi', 'su', 'se', 'so']],
          ['タチツテト', ['ta', 'chi', 'tsu', 'te', 'to']],
          ['ナニヌネノ', ['na', 'ni', 'nu', 'ne', 'no']],
          ['ハヒフヘホ', ['ha', 'hi', 'fu', 'he', 'ho']],
          ['マミムメモ', ['ma', 'mi', 'mu', 'me', 'mo']],
          ['ラリルレロ', ['ra', 'ri', 'ru', 're', 'ro']],
        ]
  const grid: ChartGrid = rows.map(([glyphs, readings]) =>
    kanaRow(glyphs as string, readings as readonly string[]),
  )
  if (script === 'hira') {
    grid.push([
      { glyph: 'や', reading: 'ya' },
      null,
      { glyph: 'ゆ', reading: 'yu' },
      null,
      { glyph: 'よ', reading: 'yo' },
    ])
    grid.push([
      { glyph: 'わ', reading: 'wa' },
      null,
      null,
      null,
      { glyph: 'を', reading: 'o' },
    ])
    grid.push([{ glyph: 'ん', reading: 'n' }])
  } else {
    grid.push([
      { glyph: 'ヤ', reading: 'ya' },
      null,
      { glyph: 'ユ', reading: 'yu' },
      null,
      { glyph: 'ヨ', reading: 'yo' },
    ])
    grid.push([
      { glyph: 'ワ', reading: 'wa' },
      null,
      null,
      null,
      { glyph: 'ヲ', reading: 'o' },
    ])
    grid.push([{ glyph: 'ン', reading: 'n' }])
  }
  return grid
}

function voiced(script: 'hira' | 'kata'): ChartGrid {
  const rows =
    script === 'hira'
      ? [
          ['がぎぐげご', ['ga', 'gi', 'gu', 'ge', 'go']],
          ['ざじずぜぞ', ['za', 'ji', 'zu', 'ze', 'zo']],
          ['だぢづでど', ['da', 'ji', 'zu', 'de', 'do']],
          ['ばびぶべぼ', ['ba', 'bi', 'bu', 'be', 'bo']],
          ['ぱぴぷぺぽ', ['pa', 'pi', 'pu', 'pe', 'po']],
        ]
      : [
          ['ガギグゲゴ', ['ga', 'gi', 'gu', 'ge', 'go']],
          ['ザジズゼゾ', ['za', 'ji', 'zu', 'ze', 'zo']],
          ['ダヂヅデド', ['da', 'ji', 'zu', 'de', 'do']],
          ['バビブベボ', ['ba', 'bi', 'bu', 'be', 'bo']],
          ['パピプペポ', ['pa', 'pi', 'pu', 'pe', 'po']],
        ]
  return rows.map(([glyphs, readings]) =>
    kanaRow(glyphs as string, readings as readonly string[]),
  )
}

const YOON_HIRA: [string, string][] = [
  ['きゃ', 'kya'],
  ['きゅ', 'kyu'],
  ['きょ', 'kyo'],
  ['しゃ', 'sha'],
  ['しゅ', 'shu'],
  ['しょ', 'sho'],
  ['ちゃ', 'cha'],
  ['ちゅ', 'chu'],
  ['ちょ', 'cho'],
  ['にゃ', 'nya'],
  ['にゅ', 'nyu'],
  ['にょ', 'nyo'],
  ['ひゃ', 'hya'],
  ['ひゅ', 'hyu'],
  ['ひょ', 'hyo'],
  ['みゃ', 'mya'],
  ['みゅ', 'myu'],
  ['みょ', 'myo'],
  ['りゃ', 'rya'],
  ['りゅ', 'ryu'],
  ['りょ', 'ryo'],
  ['ぎゃ', 'gya'],
  ['ぎゅ', 'gyu'],
  ['ぎょ', 'gyo'],
  ['じゃ', 'ja'],
  ['じゅ', 'ju'],
  ['じょ', 'jo'],
  ['びゃ', 'bya'],
  ['びゅ', 'byu'],
  ['びょ', 'byo'],
  ['ぴゃ', 'pya'],
  ['ぴゅ', 'pyu'],
  ['ぴょ', 'pyo'],
]

const YOON_KATA: [string, string][] = YOON_HIRA.map(([glyph, reading]) => [
  glyph.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  ),
  reading,
])

export const HIRAGANA_GRID = gojuon('hira')
export const KATAKANA_GRID = gojuon('kata')
export const HIRAGANA_VOICED = voiced('hira')
export const KATAKANA_VOICED = voiced('kata')
export const HIRAGANA_YOON = YOON_HIRA.map(([glyph, reading]) => ({
  glyph,
  reading,
}))
export const KATAKANA_YOON = YOON_KATA.map(([glyph, reading]) => ({
  glyph,
  reading,
}))

export const PINYIN_FINALS = [
  'a',
  'o',
  'e',
  'i',
  'u',
  'ü',
  'ai',
  'ei',
  'ao',
  'ou',
  'an',
  'en',
  'ang',
  'eng',
] as const

/** Tone-less spellings. Empty means that initial+final is not a syllable. */
const PINYIN_ROWS: { initial: string; cells: (string | null)[] }[] = [
  {
    initial: '—',
    cells: ['a', 'o', 'e', 'yi', 'wu', 'yu', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng'],
  },
  {
    initial: 'b',
    cells: ['ba', 'bo', null, 'bi', 'bu', null, 'bai', 'bei', 'bao', null, 'ban', 'ben', 'bang', 'beng'],
  },
  {
    initial: 'p',
    cells: ['pa', 'po', null, 'pi', 'pu', null, 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng'],
  },
  {
    initial: 'm',
    cells: ['ma', 'mo', 'me', 'mi', 'mu', null, 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng'],
  },
  {
    initial: 'f',
    cells: ['fa', 'fo', null, null, 'fu', null, null, 'fei', null, 'fou', 'fan', 'fen', 'fang', 'feng'],
  },
  {
    initial: 'd',
    cells: ['da', null, 'de', 'di', 'du', null, 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng'],
  },
  {
    initial: 't',
    cells: ['ta', null, 'te', 'ti', 'tu', null, 'tai', null, 'tao', 'tou', 'tan', null, 'tang', 'teng'],
  },
  {
    initial: 'n',
    cells: ['na', null, 'ne', 'ni', 'nu', 'nü', 'nai', 'nei', 'nao', 'nou', 'nan', 'nen', 'nang', 'neng'],
  },
  {
    initial: 'l',
    cells: ['la', 'lo', 'le', 'li', 'lu', 'lü', 'lai', 'lei', 'lao', 'lou', 'lan', null, 'lang', 'leng'],
  },
  {
    initial: 'g',
    cells: ['ga', null, 'ge', null, 'gu', null, 'gai', 'gei', 'gao', 'gou', 'gan', 'gen', 'gang', 'geng'],
  },
  {
    initial: 'k',
    cells: ['ka', null, 'ke', null, 'ku', null, 'kai', 'kei', 'kao', 'kou', 'kan', 'ken', 'kang', 'keng'],
  },
  {
    initial: 'h',
    cells: ['ha', null, 'he', null, 'hu', null, 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng'],
  },
  {
    initial: 'j',
    cells: [null, null, null, 'ji', 'ju', null, null, null, null, null, null, null, null, null],
  },
  {
    initial: 'q',
    cells: [null, null, null, 'qi', 'qu', null, null, null, null, null, null, null, null, null],
  },
  {
    initial: 'x',
    cells: [null, null, null, 'xi', 'xu', null, null, null, null, null, null, null, null, null],
  },
  {
    initial: 'zh',
    cells: ['zha', null, 'zhe', 'zhi', 'zhu', null, 'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhang', 'zheng'],
  },
  {
    initial: 'ch',
    cells: ['cha', null, 'che', 'chi', 'chu', null, 'chai', null, 'chao', 'chou', 'chan', 'chen', 'chang', 'cheng'],
  },
  {
    initial: 'sh',
    cells: ['sha', null, 'she', 'shi', 'shu', null, 'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shang', 'sheng'],
  },
  {
    initial: 'r',
    cells: [null, null, 're', 'ri', 'ru', null, null, 'rei', 'rao', 'rou', 'ran', 'ren', 'rang', 'reng'],
  },
  {
    initial: 'z',
    cells: ['za', null, 'ze', 'zi', 'zu', null, 'zai', 'zei', 'zao', 'zou', 'zan', 'zen', 'zang', 'zeng'],
  },
  {
    initial: 'c',
    cells: ['ca', null, 'ce', 'ci', 'cu', null, 'cai', null, 'cao', 'cou', 'can', 'cen', 'cang', 'ceng'],
  },
  {
    initial: 's',
    cells: ['sa', null, 'se', 'si', 'su', null, 'sai', null, 'sao', 'sou', 'san', 'sen', 'sang', 'seng'],
  },
]

export const PINYIN_TABLE = PINYIN_ROWS.map((row) => ({
  initial: row.initial,
  cells: row.cells.map((spelling) =>
    spelling ? { glyph: spelling, reading: spelling } : null,
  ),
}))

export const FIRST_CHARACTERS: ChartCell[] = [
  { glyph: '人', reading: 'rén' },
  { glyph: '口', reading: 'kǒu' },
  { glyph: '日', reading: 'rì' },
  { glyph: '月', reading: 'yuè' },
  { glyph: '木', reading: 'mù' },
]

const KO_CONSONANTS: ChartCell[] = [
  { glyph: 'ㄱ', reading: 'g/k' },
  { glyph: 'ㄴ', reading: 'n' },
  { glyph: 'ㄷ', reading: 'd/t' },
  { glyph: 'ㄹ', reading: 'r/l' },
  { glyph: 'ㅁ', reading: 'm' },
  { glyph: 'ㅂ', reading: 'b/p' },
  { glyph: 'ㅅ', reading: 's' },
  { glyph: 'ㅇ', reading: 'ng' },
  { glyph: 'ㅈ', reading: 'j' },
  { glyph: 'ㅊ', reading: 'ch' },
  { glyph: 'ㅋ', reading: 'k' },
  { glyph: 'ㅌ', reading: 't' },
  { glyph: 'ㅍ', reading: 'p' },
  { glyph: 'ㅎ', reading: 'h' },
]

const KO_VOWELS: ChartCell[] = [
  { glyph: 'ㅏ', reading: 'a' },
  { glyph: 'ㅑ', reading: 'ya' },
  { glyph: 'ㅓ', reading: 'eo' },
  { glyph: 'ㅕ', reading: 'yeo' },
  { glyph: 'ㅗ', reading: 'o' },
  { glyph: 'ㅛ', reading: 'yo' },
  { glyph: 'ㅜ', reading: 'u' },
  { glyph: 'ㅠ', reading: 'yu' },
  { glyph: 'ㅡ', reading: 'eu' },
  { glyph: 'ㅣ', reading: 'i' },
]

const KO_ONSET = ['g', 'n', 'd', 'r', 'm', 'b', 's', '', 'j', 'ch', 'k', 't', 'p', 'h']
const KO_BLOCK_VOWEL = ['a', 'ya', 'eo', 'yeo', 'o', 'yo', 'u', 'yu', 'eu', 'i']
const KO_BLOCK_GLYPH = [
  '가나다라마바사아자차카타파하',
  '갸냐댜랴먀뱌샤야쟈챠캬탸퍄햐',
  '거너더러머버서어저처커터퍼허',
  '겨녀뎌려며벼셔여져쳐켜텨펴혀',
  '고노도로모보소오조초코토포호',
  '교뇨됴료묘뵤쇼요죠쵸쿄툐표효',
  '구누두루무부수우주추쿠투푸후',
  '규뉴듀류뮤뷰슈유쥬츄큐튜퓨휴',
  '그느드르므브스으즈츠크트프흐',
  '기니디리미비시이지치키티피히',
]

export const KO_CONSONANT_ROW = KO_CONSONANTS
export const KO_VOWEL_ROW = KO_VOWELS
export const KO_BLOCKS: ChartCell[][] = KO_BLOCK_GLYPH.map((row, vowelIndex) =>
  [...row].map((glyph, onsetIndex) => ({
    glyph,
    reading: `${KO_ONSET[onsetIndex]}${KO_BLOCK_VOWEL[vowelIndex]}`,
  })),
)

export interface ArabicLetter {
  name: string
  sound: string
  isolated: string
  initial: string
  medial: string
  final: string
}

export const ARABIC_LETTERS: ArabicLetter[] = [
  { name: 'alif', sound: 'ā', isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
  { name: 'bāʼ', sound: 'b', isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
  { name: 'tāʼ', sound: 't', isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
  { name: 'thāʼ', sound: 'th', isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
  { name: 'jīm', sound: 'j', isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
  { name: 'ḥāʼ', sound: 'ḥ', isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
  { name: 'khāʼ', sound: 'kh', isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
  { name: 'dāl', sound: 'd', isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
  { name: 'dhāl', sound: 'dh', isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
  { name: 'rāʼ', sound: 'r', isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
  { name: 'zāy', sound: 'z', isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
  { name: 'sīn', sound: 's', isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
  { name: 'shīn', sound: 'sh', isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
  { name: 'ṣād', sound: 'ṣ', isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
  { name: 'ḍād', sound: 'ḍ', isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
  { name: 'ṭāʼ', sound: 'ṭ', isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
  { name: 'ẓāʼ', sound: 'ẓ', isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
  { name: 'ʿayn', sound: 'ʿ', isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
  { name: 'ghayn', sound: 'gh', isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
  { name: 'fāʼ', sound: 'f', isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
  { name: 'qāf', sound: 'q', isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
  { name: 'kāf', sound: 'k', isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
  { name: 'lām', sound: 'l', isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
  { name: 'mīm', sound: 'm', isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
  { name: 'nūn', sound: 'n', isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
  { name: 'hāʼ', sound: 'h', isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
  { name: 'wāw', sound: 'w', isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
  { name: 'yāʼ', sound: 'y', isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
]

export interface WritingMark {
  glyph: string
  reading: string
  /** A word that contains this shape. The check asks which shape is in it. */
  word?: string
  /** Other shapes shown as lures, including the isolated letter. */
  lures?: string[]
}

export interface WritingSet {
  id: string
  title: string
  marks: WritingMark[]
}

function rowSet(id: string, title: string, row: (ChartCell | null)[]): WritingSet | null {
  const marks = row.filter((cell): cell is ChartCell => Boolean(cell?.glyph && cell.reading))
  if (!marks.length) return null
  return { id, title, marks }
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size))
  return groups
}

function japaneseSets(): WritingSet[] {
  const plain = gojuon('hira')
    .map((row, index) => rowSet(`ja-hira-${index}`, `${row.find(Boolean)?.glyph ?? ''} row`, row))
    .filter((set): set is WritingSet => Boolean(set))
  const dakuten = voiced('hira')
    .map((row, index) => rowSet(`ja-voice-${index}`, `${row[0]?.glyph ?? ''} row`, row))
    .filter((set): set is WritingSet => Boolean(set))
  const kata = gojuon('kata')
    .map((row, index) => rowSet(`ja-kata-${index}`, `${row.find(Boolean)?.glyph ?? ''} row`, row))
    .filter((set): set is WritingSet => Boolean(set))
  return [...plain, ...dakuten, ...kata]
}

function pinyinSets(): WritingSet[] {
  return PINYIN_ROWS.flatMap((row) => {
    const marks = row.cells.filter((cell): cell is string => Boolean(cell)).map((reading) => ({
      glyph: reading,
      reading,
    }))
    const title = row.initial === '—' ? 'vowels' : `${row.initial} row`
    return chunk(marks, 4).map((group, index) => ({
      id: `zh-${row.initial}-${index}`,
      title: index === 0 ? title : `${title} · ${index + 1}`,
      marks: group,
    }))
  })
}

function koreanSets(): WritingSet[] {
  const consonants = chunk(KO_CONSONANTS, 5).map((marks, index) => ({
    id: `ko-consonant-${index}`,
    title: index === 0 ? 'first consonants' : 'more consonants',
    marks,
  }))
  const vowels = [{ id: 'ko-vowels', title: 'vowels', marks: KO_VOWELS }]
  const blocks = KO_BLOCKS.slice(0, 2).map((row, index) => ({
    id: `ko-block-${index}`,
    title: index === 0 ? 'first syllable blocks' : 'more syllable blocks',
    marks: row,
  }))
  return [...consonants, ...vowels, ...blocks]
}

function vocalized(body: string): string {
  return [...body].map((char) => (ARABIC_LETTER.test(char) ? `${char}\u064E` : char)).join('')
}

const ARABIC_LETTER = /[\u0621-\u064A]/

function arabicShapeSets(): WritingSet[] {
  return ARABIC_LETTERS.map((letter, index) => {
    const forms = [
      { glyph: letter.initial, word: vocalized(`${letter.isolated}ا`), place: 'initial' },
      { glyph: letter.medial, word: vocalized(`ك${letter.isolated}ا`), place: 'medial' },
      { glyph: letter.final, word: vocalized(`ك${letter.isolated}`), place: 'final' },
    ]
    return {
      id: `ar-shape-${index}`,
      title: `${letter.name} shapes`,
      marks: forms.map((form) => ({
        glyph: form.glyph,
        reading: letter.sound,
        word: form.word,
        lures: [letter.isolated, ...forms.map((item) => item.glyph)]
          .filter((glyph) => glyph !== form.glyph)
          .slice(0, 2),
      })),
    }
  })
}

function arabicSets(): WritingSet[] {
  const isolated = chunk(ARABIC_LETTERS, 4).map((group, index) => ({
    id: `ar-${index}`,
    title: `${group[0]?.name ?? 'letters'} group`,
    marks: group.map((letter) => ({ glyph: letter.isolated, reading: letter.sound })),
  }))
  return [...isolated, ...arabicShapeSets()]
}

function soundSets(languageId: 'id' | 'es' | 'zh'): WritingSet[] {
  const marks = SCRIPT_GLYPHS[languageId].map((glyph) => ({
    glyph: glyph.glyph,
    reading: glyph.reading,
  }))
  if (!marks.length) return []
  const title = languageId === 'zh' ? 'first characters' : 'sounds'
  return [{ id: `${languageId}-sounds`, title, marks }]
}

export function writingSetsFor(languageId: LanguageId): WritingSet[] {
  if (languageId === 'ja') return japaneseSets()
  if (languageId === 'zh') return [...pinyinSets(), ...soundSets('zh')]
  if (languageId === 'ko') return koreanSets()
  if (languageId === 'ar') return arabicSets()
  return soundSets(languageId === 'es' ? 'es' : 'id')
}

export function hasWritingChart(languageId: LanguageId): boolean {
  return (
    languageId === 'ja' ||
    languageId === 'zh' ||
    languageId === 'ko' ||
    languageId === 'ar'
  )
}
