export type LanguageId = 'ja' | 'zh' | 'ko' | 'ar' | 'es' | 'id'

export type ScriptFamiliarity = 'new' | 'some' | 'comfortable'

export type GoalId = 'daily' | 'travel' | 'work' | 'fun'

/** How heavily we foreground orthography vs phrases. */
export type OrthographyMode = 'new-script' | 'latin-sounds'

export interface LanguageOption {
  id: LanguageId
  name: string
  nativeLabel: string
  guideName: string
  writingSystem: string
  scriptTrackTitle: string
  /** True for scripts the learner may not know at all (kana, hangul, hanzi, Arabic). */
  hasLogographicOrSyllabary: boolean
  orthographyMode: OrthographyMode
  demoReady: boolean
}

export interface ScriptGlyph {
  id: string
  glyph: string
  reading: string
  hint: string
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'ja',
    name: 'Japanese',
    nativeLabel: '日本語',
    guideName: 'Mikan',
    writingSystem: 'Hiragana, Katakana & Kanji',
    scriptTrackTitle: 'Hiragana foundations',
    hasLogographicOrSyllabary: true,
    orthographyMode: 'new-script',
    demoReady: true,
  },
  {
    id: 'zh',
    name: 'Mandarin Chinese',
    nativeLabel: '中文',
    guideName: 'Juicy',
    writingSystem: 'Hanzi (characters)',
    scriptTrackTitle: 'First characters',
    hasLogographicOrSyllabary: true,
    orthographyMode: 'new-script',
    demoReady: true,
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeLabel: '한국어',
    guideName: 'Hallabong',
    writingSystem: 'Hangul',
    scriptTrackTitle: 'Hangul building blocks',
    hasLogographicOrSyllabary: true,
    orthographyMode: 'new-script',
    demoReady: true,
  },
  {
    id: 'ar',
    name: 'Arabic',
    nativeLabel: 'العربية',
    guideName: 'Naranja',
    writingSystem: 'Arabic script (RTL)',
    scriptTrackTitle: 'Letter shapes & sounds',
    hasLogographicOrSyllabary: true,
    orthographyMode: 'new-script',
    demoReady: true,
  },
  {
    id: 'id',
    name: 'Indonesian',
    nativeLabel: 'Bahasa Indonesia',
    guideName: 'Keprok',
    writingSystem: 'Latin alphabet (same letters, Indonesian sounds)',
    scriptTrackTitle: 'Sounds & digraphs',
    hasLogographicOrSyllabary: false,
    orthographyMode: 'latin-sounds',
    demoReady: true,
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeLabel: 'Español',
    guideName: 'Clementina',
    writingSystem: 'Latin alphabet + accents',
    scriptTrackTitle: 'Sounds & accent marks',
    hasLogographicOrSyllabary: false,
    orthographyMode: 'latin-sounds',
    demoReady: true,
  },
]

export function scriptLevelsFor(lang: LanguageOption): {
  id: ScriptFamiliarity
  title: string
  blurb: string
}[] {
  if (lang.orthographyMode === 'latin-sounds') {
    return [
      {
        id: 'new',
        title: 'Brand new to this language',
        blurb: `I know the Latin alphabet, but I’m new to ${lang.name} sounds/spelling — warm me up lightly.`,
      },
      {
        id: 'some',
        title: 'I know some',
        blurb: 'I can read it, but digraphs or accents still trip me up.',
      },
      {
        id: 'comfortable',
        title: 'Pretty comfortable reading',
        blurb: 'Skip the spelling warm-up — lean into phrases.',
      },
    ]
  }

  return [
    {
      id: 'new',
      title: 'Brand new',
      blurb: 'I barely know the writing system yet — start me from the marks.',
    },
    {
      id: 'some',
      title: 'I know some',
      blurb: 'I recognize pieces, but I need practice and reinforcement.',
    },
    {
      id: 'comfortable',
      title: 'Pretty comfortable',
      blurb: 'I can read most of it — still reinforce, but lean into phrases.',
    },
  ]
}

/** @deprecated use scriptLevelsFor(lang) — kept for any stray imports */
export const SCRIPT_LEVELS = scriptLevelsFor(LANGUAGES[0])

export const GOALS: { id: GoalId; title: string }[] = [
  { id: 'daily', title: 'Talk about daily life' },
  { id: 'travel', title: 'Travel & get around' },
  { id: 'work', title: 'Work & school chats' },
  { id: 'fun', title: 'Just for fun / media' },
]

/** Seed glyphs / sound bits for Phase 1 orthography practice. */
export const SCRIPT_GLYPHS: Record<LanguageId, ScriptGlyph[]> = {
  ja: [
    { id: 'a', glyph: 'あ', reading: 'a', hint: 'Open mouth “ah”' },
    { id: 'i', glyph: 'い', reading: 'i', hint: 'Like “ee”' },
    { id: 'u', glyph: 'う', reading: 'u', hint: 'Like “oo”' },
    { id: 'e', glyph: 'え', reading: 'e', hint: 'Like “eh”' },
    { id: 'o', glyph: 'お', reading: 'o', hint: 'Like “oh”' },
  ],
  zh: [
    { id: 'ren', glyph: '人', reading: 'rén', hint: 'person' },
    { id: 'kou', glyph: '口', reading: 'kǒu', hint: 'mouth' },
    { id: 'ri', glyph: '日', reading: 'rì', hint: 'sun / day' },
    { id: 'yue', glyph: '月', reading: 'yuè', hint: 'moon / month' },
    { id: 'mu', glyph: '木', reading: 'mù', hint: 'tree / wood' },
  ],
  ko: [
    { id: 'g', glyph: 'ㄱ', reading: 'g/k', hint: 'consonant' },
    { id: 'n', glyph: 'ㄴ', reading: 'n', hint: 'consonant' },
    { id: 'a', glyph: 'ㅏ', reading: 'a', hint: 'vowel' },
    { id: 'i', glyph: 'ㅣ', reading: 'i', hint: 'vowel' },
    { id: 'ga', glyph: '가', reading: 'ga', hint: 'ㄱ + ㅏ block' },
  ],
  ar: [
    { id: 'alif', glyph: 'ا', reading: 'alif', hint: 'long aa' },
    { id: 'ba', glyph: 'ب', reading: 'bāʼ', hint: 'b sound' },
    { id: 'ta', glyph: 'ت', reading: 'tāʼ', hint: 't sound' },
    { id: 'jim', glyph: 'ج', reading: 'jīm', hint: 'j sound' },
    { id: 'dal', glyph: 'د', reading: 'dāl', hint: 'd sound' },
  ],
  id: [
    { id: 'ng', glyph: 'ng', reading: 'ng', hint: 'as in “dengan” — one sound' },
    { id: 'ny', glyph: 'ny', reading: 'ny', hint: 'as in “nyanyi”' },
    { id: 'sy', glyph: 'sy', reading: 'sy', hint: 'like “sh” in “syukur”' },
    { id: 'kh', glyph: 'kh', reading: 'kh', hint: 'soft kh, as in “khas”' },
    { id: 'c', glyph: 'c', reading: 'ch', hint: 'always “ch” — “cari”' },
  ],
  es: [
    { id: 'n', glyph: 'ñ', reading: 'nye', hint: 'como “baño”' },
    { id: 'a-ac', glyph: 'á', reading: 'á', hint: 'stressed a' },
    { id: 'e-ac', glyph: 'é', reading: 'é', hint: 'stressed e' },
    { id: 'i-ac', glyph: 'í', reading: 'í', hint: 'stressed i' },
    { id: 'u-ac', glyph: 'ú', reading: 'ú', hint: 'stressed u' },
  ],
}

export function languageById(id: LanguageId): LanguageOption {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]
}

export function orthographyLabel(lang: LanguageOption): string {
  return lang.orthographyMode === 'latin-sounds'
    ? 'Sounds & spelling'
    : 'Writing system'
}
