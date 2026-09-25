import type { LanguageId, ScriptFamiliarity } from './languages'
import { languageById } from './languages'

export type PathNodeState = 'locked' | 'available' | 'active' | 'completed' | 'needs_retry'

export type ActivityId =
  | 'meet'
  | 'comeback'
  | 'spot'
  | 'break'
  | 'turn'
  | 'build'
  | 'say'
  | 'boss'
  | 'clear'

export type ScriptActivityId =
  | 'see'
  | 'hear'
  | 'spot'
  | 'match'
  | 'trace'
  | 'use'
  | 'clear'

export interface PathStep {
  id: ActivityId
  number: number
  label: string
  state: PathNodeState
}

export interface ScriptPathStep {
  id: ScriptActivityId
  number: number
  label: string
  state: PathNodeState
}

export interface Ability {
  id: string
  title: string
  status: 'done' | 'partial' | 'locked'
  kind?: 'script' | 'speak'
}

export interface UnitItem {
  id: string
  surface: string
  reading?: string
  gloss: string
}

/** One run of text. `reading` is furigana, pinyin, or omitted when the letters already show vowels. */
export interface RubySpan {
  text: string
  reading?: string
}

export interface SpotChunk {
  id: string
  parts: RubySpan[]
  /** True when this chunk is one of the meanings the guide names. */
  target: boolean
  itemId?: string
}

export interface ComebackItem {
  /** Key after languageId for attempts, e.g. `phrase:kyo` or `user:stash-1`. */
  itemKey: string
  surface: string
  gloss: string
  reading?: string
  facet: 'recognition' | 'listening' | 'production' | 'writing' | 'contextualUse'
}

export interface PhraseUnit {
  id: string
  abilityId: string
  title: string
  targetSentence: string
  targetGloss: string
  estimatedMinutes: number
  activityCount: number
  focusWhy: string
  languageId: LanguageId
  items: UnitItem[]
  buildChunks: string[]
  /** Sentence broken so kanji, hanzi, and vowel marks can render. Falls back to `targetSentence`. */
  sentenceParts?: RubySpan[]
  /** Tappable pieces of the sentence. At least one is not a target. */
  spotChunks?: SpotChunk[]
  spotGlossA: string
  spotGlossB: string
  turnPromptSurface: string
  turnAnswerId: string
  turnOptions: { id: string; label: string; ok: boolean }[]
  /** False for bare stash words — Build It / Say It stay locked. */
  productionReady?: boolean
  origin?: 'seed' | 'stash'
  /** Soft reviews woven into today's path (invisible SRS). */
  comebackItems?: ComebackItem[]
}

export interface StashedPhrase {
  id: string
  surface: string
  gloss: string
  reading?: string
  exampleSentence?: string
  abilityTag?: string
  source: 'user' | 'import' | 'lookup'
  sourceId?: string
}

export type ListeningMedium = 'video' | 'podcast'
export type ListeningStatus = 'suggested' | 'listening' | 'practiced'

export interface ListeningSource {
  id: string
  languageId: LanguageId
  abilityId: string
  title: string
  creator: string
  medium: ListeningMedium
  search: string
  url?: string
  why: string
  listenFor?: string[]
  transcript?: string
  status: ListeningStatus
  createdAt: string
}

export interface DictEntry {
  surface: string
  reading?: string
  gloss: string
}

function workTodayUnit(
  languageId: LanguageId,
  targetSentence: string,
  items: UnitItem[],
  buildChunks: string[],
  turnPromptSurface: string,
  minutes: number,
  display?: { sentenceParts?: RubySpan[]; spotChunks?: SpotChunk[] },
): PhraseUnit {
  return {
    id: `unit-work-today-${languageId}`,
    abilityId: 'talk-today',
    title: 'Talking about today',
    targetSentence,
    targetGloss: "I'm working today.",
    estimatedMinutes: minutes,
    activityCount: 7,
    focusWhy: "Say what you're doing today — a real daily-life move.",
    languageId,
    items,
    buildChunks,
    spotGlossA: 'today',
    spotGlossB: 'work',
    turnPromptSurface,
    turnAnswerId: 'work',
    turnOptions: [
      { id: 'work', label: 'work', ok: true },
      { id: 'friend', label: 'friend', ok: false },
      { id: 'tomorrow', label: 'tomorrow', ok: false },
    ],
    sentenceParts: display?.sentenceParts,
    spotChunks: display?.spotChunks,
  }
}

/** Same move in every shipped language: answer “what are you doing today?” */
export const PHRASE_UNITS: Record<LanguageId, PhraseUnit> = {
  ja: workTodayUnit(
    'ja',
    '今日は仕事をします。',
    [
      { id: 'kyo', surface: '今日', reading: 'きょう', gloss: 'today' },
      { id: 'shigoto', surface: '仕事', reading: 'しごと', gloss: 'work' },
      { id: 'shimasu', surface: 'します', gloss: 'do (polite)' },
    ],
    ['今日は', '仕事を', 'します'],
    '仕事',
    18,
    {
      sentenceParts: [
        { text: '今日', reading: 'きょう' },
        { text: 'は' },
        { text: '仕事', reading: 'しごと' },
        { text: 'を' },
        { text: 'します' },
        { text: '。' },
      ],
      spotChunks: [
        {
          id: 'kyo',
          itemId: 'kyo',
          target: true,
          parts: [{ text: '今日', reading: 'きょう' }, { text: 'は' }],
        },
        {
          id: 'shigoto',
          itemId: 'shigoto',
          target: true,
          parts: [{ text: '仕事', reading: 'しごと' }, { text: 'を' }],
        },
        {
          id: 'shimasu',
          itemId: 'shimasu',
          target: false,
          parts: [{ text: 'します' }],
        },
      ],
    },
  ),
  zh: workTodayUnit(
    'zh',
    '我今天上班。',
    [
      { id: 'jintian', surface: '今天', reading: 'jīntiān', gloss: 'today' },
      { id: 'shangban', surface: '上班', reading: 'shàngbān', gloss: 'go to work' },
      { id: 'wo', surface: '我', reading: 'wǒ', gloss: 'I' },
    ],
    ['我', '今天', '上班'],
    '上班',
    18,
    {
      sentenceParts: [
        { text: '我', reading: 'wǒ' },
        { text: '今', reading: 'jīn' },
        { text: '天', reading: 'tiān' },
        { text: '上', reading: 'shàng' },
        { text: '班', reading: 'bān' },
        { text: '。' },
      ],
      spotChunks: [
        {
          id: 'wo',
          itemId: 'wo',
          target: false,
          parts: [{ text: '我', reading: 'wǒ' }],
        },
        {
          id: 'jintian',
          itemId: 'jintian',
          target: true,
          parts: [
            { text: '今', reading: 'jīn' },
            { text: '天', reading: 'tiān' },
          ],
        },
        {
          id: 'shangban',
          itemId: 'shangban',
          target: true,
          parts: [
            { text: '上', reading: 'shàng' },
            { text: '班', reading: 'bān' },
          ],
        },
      ],
    },
  ),
  ko: workTodayUnit(
    'ko',
    '오늘은 일해요.',
    [
      { id: 'oneul', surface: '오늘', reading: 'oneul', gloss: 'today' },
      { id: 'il', surface: '일', reading: 'il', gloss: 'work' },
      { id: 'haeyo', surface: '해요', reading: 'haeyo', gloss: 'do (polite)' },
    ],
    ['오늘은', '일해요'],
    '일',
    16,
    {
      spotChunks: [
        {
          id: 'oneul',
          itemId: 'oneul',
          target: true,
          parts: [{ text: '오늘은' }],
        },
        { id: 'il', itemId: 'il', target: true, parts: [{ text: '일' }] },
        {
          id: 'haeyo',
          itemId: 'haeyo',
          target: false,
          parts: [{ text: '해요' }],
        },
      ],
    },
  ),
  ar: workTodayUnit(
    'ar',
    'أَنَا أَعْمَلُ الْيَوْمَ.',
    [
      { id: 'alyawm', surface: 'الْيَوْمَ', reading: 'al-yawm', gloss: 'today' },
      { id: 'aamal', surface: 'أَعْمَلُ', reading: 'aʿmal', gloss: 'I work' },
      { id: 'ana', surface: 'أَنَا', reading: 'anā', gloss: 'I' },
    ],
    ['أَنَا', 'أَعْمَلُ', 'الْيَوْمَ'],
    'أَعْمَلُ',
    18,
    {
      spotChunks: [
        { id: 'ana', itemId: 'ana', target: false, parts: [{ text: 'أَنَا' }] },
        {
          id: 'aamal',
          itemId: 'aamal',
          target: true,
          parts: [{ text: 'أَعْمَلُ' }],
        },
        {
          id: 'alyawm',
          itemId: 'alyawm',
          target: true,
          parts: [{ text: 'الْيَوْمَ' }],
        },
      ],
    },
  ),
  es: workTodayUnit(
    'es',
    'Hoy yo trabajo.',
    [
      { id: 'hoy', surface: 'Hoy', gloss: 'today' },
      { id: 'trabajo', surface: 'trabajo', gloss: 'I work' },
      { id: 'yo', surface: 'yo', gloss: 'I' },
    ],
    ['Hoy', 'yo', 'trabajo'],
    'trabajo',
    16,
    {
      spotChunks: [
        { id: 'hoy', itemId: 'hoy', target: true, parts: [{ text: 'Hoy' }] },
        { id: 'yo', itemId: 'yo', target: false, parts: [{ text: 'yo' }] },
        {
          id: 'trabajo',
          itemId: 'trabajo',
          target: true,
          parts: [{ text: 'trabajo' }],
        },
      ],
    },
  ),
  id: workTodayUnit(
    'id',
    'Hari ini saya kerja.',
    [
      { id: 'hari-ini', surface: 'Hari ini', gloss: 'today' },
      { id: 'kerja', surface: 'kerja', gloss: 'work' },
      { id: 'saya', surface: 'saya', gloss: 'I' },
    ],
    ['Hari', 'ini', 'saya', 'kerja'],
    'kerja',
    16,
    {
      spotChunks: [
        {
          id: 'hari-ini',
          itemId: 'hari-ini',
          target: true,
          parts: [{ text: 'Hari ini' }],
        },
        { id: 'saya', itemId: 'saya', target: false, parts: [{ text: 'saya' }] },
        {
          id: 'kerja',
          itemId: 'kerja',
          target: true,
          parts: [{ text: 'kerja' }],
        },
      ],
    },
  ),
}

/** @deprecated prefer getPhraseUnit(languageId) */
export const CURRENT_UNIT = PHRASE_UNITS.ja!

export const UNIT_ITEMS = CURRENT_UNIT.items
export const BUILD_CHUNKS = CURRENT_UNIT.buildChunks

export function getPhraseUnit(languageId: LanguageId): PhraseUnit | null {
  return PHRASE_UNITS[languageId] ?? null
}

export function hasPhraseUnit(languageId: LanguageId): boolean {
  return Boolean(PHRASE_UNITS[languageId])
}

/** Abilities that have a session in this build. */
export const PLAYABLE_ABILITY_IDS = ['script-basics', 'talk-today'] as const

/** Phrase lesson is open for Latin always, and for a new script after the warm-up. */
export function phrasePathOpen(
  languageId: LanguageId,
  script: ScriptFamiliarity,
  scriptWarmupDone: boolean,
): boolean {
  if (!hasPhraseUnit(languageId)) return false
  if (languageById(languageId).orthographyMode === 'latin-sounds') return true
  return script !== 'new' || scriptWarmupDone
}

export const SESSION_STEPS: PathStep[] = [
  { id: 'meet', number: 1, label: 'Meet It', state: 'active' },
  { id: 'spot', number: 2, label: 'Spot It', state: 'locked' },
  { id: 'break', number: 3, label: 'Break It Down', state: 'locked' },
  { id: 'turn', number: 4, label: 'Your Turn', state: 'locked' },
  { id: 'build', number: 5, label: 'Build It', state: 'locked' },
  { id: 'say', number: 6, label: 'Say It', state: 'locked' },
  { id: 'boss', number: 7, label: 'Boss Challenge', state: 'locked' },
]

export const ACTIVITY_LABELS: Record<ActivityId, string> = {
  meet: 'Meet It',
  comeback: 'Bring back',
  spot: 'Spot It',
  break: 'Break It Down',
  turn: 'Your Turn',
  build: 'Build It',
  say: 'Say It',
  boss: 'Boss Challenge',
  clear: 'All Clear',
}

export const SCRIPT_SESSION_STEPS: ScriptPathStep[] = [
  { id: 'see', number: 1, label: 'See It', state: 'active' },
  { id: 'hear', number: 2, label: 'Hear It', state: 'locked' },
  { id: 'spot', number: 3, label: 'Spot It', state: 'locked' },
  { id: 'match', number: 4, label: 'Match It', state: 'locked' },
  { id: 'trace', number: 5, label: 'Trace It', state: 'locked' },
  { id: 'use', number: 6, label: 'Use It', state: 'locked' },
]

export function buildAbilities(
  languageId: LanguageId,
  script: ScriptFamiliarity,
): Ability[] {
  const lang = languageById(languageId)
  const phraseReady =
    hasPhraseUnit(languageId) &&
    (lang.orthographyMode === 'latin-sounds'
      ? true
      : script !== 'new')

  const abilities: Ability[] = [
    {
      id: 'script-basics',
      title:
        lang.orthographyMode === 'latin-sounds'
          ? lang.scriptTrackTitle
          : `Read ${lang.scriptTrackTitle.toLowerCase()}`,
      status: script === 'comfortable' ? 'partial' : 'partial',
      kind: 'script',
    },
    {
      id: 'script-reinforce',
      title:
        lang.orthographyMode === 'latin-sounds'
          ? 'Nail tricky spellings'
          : 'Recognize look‑alike marks',
      status: script === 'new' ? 'locked' : 'partial',
      kind: 'script',
    },
    {
      id: 'intro',
      title: 'Introduce yourself',
      status:
        lang.orthographyMode === 'latin-sounds' || script !== 'new'
          ? 'partial'
          : 'locked',
      kind: 'speak',
    },
    {
      id: 'talk-today',
      title: 'Talk about today',
      status: phraseReady ? 'partial' : 'locked',
      kind: 'speak',
    },
    {
      id: 'order-food',
      title: 'Order food',
      status: 'locked',
      kind: 'speak',
    },
    {
      id: 'make-appointment',
      title: 'Make appointments',
      status: 'locked',
      kind: 'speak',
    },
  ]
  return abilities
}

export const HOME_SOFT = {
  comeback: 'A few things to bring back',
  script: 'Sounds & spelling practice',
  scriptNew: 'Writing system practice',
  writing: 'A few marks to practice',
  milestone: '1 conversation milestone',
  milestoneSoon: 'Conversation after a phrase path',
}

export const DICTIONARY_BY_LANGUAGE: Record<LanguageId, DictEntry[]> = {
  ja: [
    { surface: '明日', reading: 'あした', gloss: 'tomorrow' },
    { surface: '昨日', reading: 'きのう', gloss: 'yesterday' },
    { surface: '食べる', reading: 'たべる', gloss: 'to eat' },
    { surface: '飲む', reading: 'のむ', gloss: 'to drink' },
    { surface: '友達', reading: 'ともだち', gloss: 'friend' },
    { surface: '水', reading: 'みず', gloss: 'water' },
  ],
  zh: [
    { surface: '明天', reading: 'míng tiān', gloss: 'tomorrow' },
    { surface: '昨天', reading: 'zuó tiān', gloss: 'yesterday' },
    { surface: '吃', reading: 'chī', gloss: 'to eat' },
    { surface: '喝', reading: 'hē', gloss: 'to drink' },
    { surface: '朋友', reading: 'péng you', gloss: 'friend' },
    { surface: '水', reading: 'shuǐ', gloss: 'water' },
  ],
  ko: [
    { surface: '내일', reading: 'naeil', gloss: 'tomorrow' },
    { surface: '어제', reading: 'eoje', gloss: 'yesterday' },
    { surface: '먹다', reading: 'meokda', gloss: 'to eat' },
    { surface: '마시다', reading: 'masida', gloss: 'to drink' },
    { surface: '친구', reading: 'chingu', gloss: 'friend' },
    { surface: '물', reading: 'mul', gloss: 'water' },
  ],
  ar: [
    { surface: 'غَدًا', reading: 'ghadan', gloss: 'tomorrow' },
    { surface: 'أَمْسِ', reading: 'ams', gloss: 'yesterday' },
    { surface: 'يَأْكُلُ', reading: 'yaʾkul', gloss: 'he eats' },
    { surface: 'يَشْرَبُ', reading: 'yashrab', gloss: 'he drinks' },
    { surface: 'صَدِيقٌ', reading: 'ṣadīq', gloss: 'friend' },
    { surface: 'مَاءٌ', reading: 'māʾ', gloss: 'water' },
  ],
  es: [
    { surface: 'mañana', gloss: 'tomorrow' },
    { surface: 'ayer', gloss: 'yesterday' },
    { surface: 'comer', gloss: 'to eat' },
    { surface: 'beber', gloss: 'to drink' },
    { surface: 'amigo', gloss: 'friend' },
    { surface: 'agua', gloss: 'water' },
  ],
  id: [
    { surface: 'besok', gloss: 'tomorrow' },
    { surface: 'kemarin', gloss: 'yesterday' },
    { surface: 'makan', gloss: 'to eat' },
    { surface: 'minum', gloss: 'to drink' },
    { surface: 'teman', gloss: 'friend' },
    { surface: 'air', gloss: 'water' },
  ],
}

/** @deprecated use DICTIONARY_BY_LANGUAGE */
export const DICTIONARY_SUBSET = DICTIONARY_BY_LANGUAGE.ja

interface SampleLines {
  pack: {
    surface: string
    gloss: string
    exampleSentence: string
    reading?: string
  }[]
  title: string
  search: string
  why: string
  listenFor: string[]
  transcript: string
}

const SAMPLE_LINES: Record<LanguageId, SampleLines> = {
  ja: {
    pack: [
      { surface: 'お腹がすいた。', gloss: 'I am hungry.', reading: 'おなかがすいた', exampleSentence: '今日はお腹がすいた。|きょうはおなかがすいた' },
      { surface: '水をください。', gloss: 'Water, please.', reading: 'みずをください', exampleSentence: '水をください。|みずをください' },
    ],
    title: 'Daily Japanese: today',
    search: 'everyday Japanese today',
    why: "You'll hear everyday Japanese, not a textbook line.",
    listenFor: ['今日|きょう', '水|みず'],
    transcript: '今日は暑いです。|きょうはあついです\n水をください。|みずをください\nお腹がすいた。|おなかがすいた',
  },
  zh: {
    pack: [
      { surface: '我饿了。', gloss: 'I am hungry.', reading: 'wǒ è le', exampleSentence: '我今天饿了。|wǒ jīn tiān è le' },
      { surface: '请给我水。', gloss: 'Water, please.', reading: 'qǐng gěi wǒ shuǐ', exampleSentence: '请给我水。|qǐng gěi wǒ shuǐ' },
    ],
    title: 'Daily Mandarin: today',
    search: 'everyday Mandarin today',
    why: "You'll hear everyday Mandarin, not a textbook line.",
    listenFor: ['今天|jīn tiān', '水|shuǐ'],
    transcript: '今天很热。|jīn tiān hěn rè\n请给我水。|qǐng gěi wǒ shuǐ\n我饿了。|wǒ è le',
  },
  ko: {
    pack: [
      { surface: '배고파요.', gloss: 'I am hungry.', exampleSentence: '오늘은 배고파요.' },
      { surface: '물 주세요.', gloss: 'Water, please.', exampleSentence: '물 주세요.' },
    ],
    title: 'Daily Korean: today',
    search: 'everyday Korean today',
    why: "You'll hear everyday Korean, not a textbook line.",
    listenFor: ['오늘', '물'],
    transcript: '오늘은 더워요.\n물 주세요.\n배고파요.',
  },
  ar: {
    pack: [
      { surface: 'أَنَا جَائِعٌ.', gloss: 'I am hungry.', exampleSentence: 'أَنَا جَائِعٌ الْيَوْمَ.' },
      { surface: 'مَاءٌ مِنْ فَضْلِكَ.', gloss: 'Water, please.', exampleSentence: 'مَاءٌ مِنْ فَضْلِكَ.' },
    ],
    title: 'Daily Arabic: today',
    search: 'everyday Arabic today',
    why: "You'll hear everyday Arabic, not a textbook line.",
    listenFor: ['الْيَوْمَ', 'مَاءٌ'],
    transcript: 'الْيَوْمَ حَارٌّ.\nمَاءٌ مِنْ فَضْلِكَ.\nأَنَا جَائِعٌ.',
  },
  es: {
    pack: [
      { surface: 'Tengo hambre.', gloss: 'I am hungry.', exampleSentence: 'Hoy tengo hambre.' },
      { surface: 'Agua, por favor.', gloss: 'Water, please.', exampleSentence: 'Agua, por favor.' },
    ],
    title: 'Daily Spanish: today',
    search: 'everyday Spanish today',
    why: "You'll hear everyday Spanish, not a textbook line.",
    listenFor: ['hoy', 'agua'],
    transcript: 'Hoy hace calor.\nAgua, por favor.\nTengo hambre.',
  },
  id: {
    pack: [
      { surface: 'Saya lapar.', gloss: 'I am hungry.', exampleSentence: 'Hari ini saya lapar.' },
      { surface: 'Air, tolong.', gloss: 'Water, please.', exampleSentence: 'Air, tolong.' },
    ],
    title: 'Daily Indonesian: today',
    search: 'everyday Indonesian today',
    why: "You'll hear everyday Indonesian, not a textbook line.",
    listenFor: ['hari ini', 'air'],
    transcript: 'Hari ini panas.\nAir, tolong.\nSaya lapar.',
  },
}

function sampleFor(languageId: LanguageId): SampleLines {
  return SAMPLE_LINES[languageId]
}

export function samplePackJson(languageId: LanguageId): string {
  return JSON.stringify(sampleFor(languageId).pack, null, 2)
}

export function sampleTutorPackJson(languageId: LanguageId): string {
  const s = sampleFor(languageId)
  return JSON.stringify(
    {
      phrases: s.pack.map((p) => ({ ...p, sourceTitle: s.title })),
      sources: [
        {
          title: s.title,
          creator: 'Sample',
          medium: 'video',
          search: s.search,
          why: s.why,
          listenFor: s.listenFor,
          transcript: s.transcript,
        },
      ],
      noteTweaks: [
        'Stay next to hunger, water, and work — one new move each pack.',
        'Keep every example under ten words and reuse a word they already have.',
      ],
    },
    null,
    2,
  )
}

export function sampleSourcesPackJson(languageId: LanguageId): string {
  const s = sampleFor(languageId)
  return JSON.stringify(
    {
      kind: 'sources',
      items: [
        {
          title: s.title,
          creator: 'Sample',
          medium: 'video',
          search: s.search,
          why: s.why,
          listenFor: s.listenFor,
          transcript: s.transcript,
        },
      ],
    },
    null,
    2,
  )
}

export function sampleListenTranscript(languageId: LanguageId): string {
  return sampleFor(languageId).transcript
}

export function sampleListenLinesJson(languageId: LanguageId): string {
  const s = sampleFor(languageId)
  return JSON.stringify(
    {
      phrases: s.pack.map((p) => ({ ...p, sourceTitle: s.title })),
    },
    null,
    2,
  )
}
