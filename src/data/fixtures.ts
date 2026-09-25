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
}

export interface DictEntry {
  surface: string
  reading?: string
  gloss: string
}

export const PHRASE_UNITS: Partial<Record<LanguageId, PhraseUnit>> = {
  ja: {
    id: 'unit-work-today-ja',
    abilityId: 'talk-today',
    title: 'Talking about today',
    targetSentence: '今日は仕事があります。',
    targetGloss: 'I have work today.',
    estimatedMinutes: 18,
    activityCount: 7,
    focusWhy: 'Say what you’re doing today — a real daily-life move.',
    languageId: 'ja',
    items: [
      { id: 'kyo', surface: '今日', reading: 'きょう', gloss: 'today' },
      { id: 'shigoto', surface: '仕事', reading: 'しごと', gloss: 'work / job' },
      { id: 'arimasu', surface: 'あります', gloss: 'there is / I have (polite)' },
      { id: 'pattern', surface: '〜があります', gloss: 'I have ~ / there is ~' },
    ],
    buildChunks: ['今日は', '仕事が', 'あります'],
    spotGlossA: 'today',
    spotGlossB: 'work',
    turnPromptSurface: '仕事',
    turnAnswerId: 'work',
    turnOptions: [
      { id: 'work', label: 'work / job', ok: true },
      { id: 'friend', label: 'friend', ok: false },
      { id: 'tomorrow', label: 'tomorrow', ok: false },
    ],
  },
  id: {
    id: 'unit-work-today-id',
    abilityId: 'talk-today',
    title: 'Talking about today',
    targetSentence: 'Hari ini saya ada kerja.',
    targetGloss: 'I have work today.',
    estimatedMinutes: 16,
    activityCount: 7,
    focusWhy: 'Say what you’re doing today — everyday Indonesian.',
    languageId: 'id',
    items: [
      { id: 'hari-ini', surface: 'Hari ini', gloss: 'today' },
      { id: 'saya', surface: 'saya', gloss: 'I / me' },
      { id: 'ada', surface: 'ada', gloss: 'there is / have' },
      { id: 'kerja', surface: 'kerja', gloss: 'work' },
    ],
    buildChunks: ['Hari', 'ini', 'saya', 'ada', 'kerja'],
    spotGlossA: 'today',
    spotGlossB: 'work',
    turnPromptSurface: 'kerja',
    turnAnswerId: 'work',
    turnOptions: [
      { id: 'work', label: 'work', ok: true },
      { id: 'friend', label: 'friend', ok: false },
      { id: 'tomorrow', label: 'tomorrow', ok: false },
    ],
  },
  es: {
    id: 'unit-work-today-es',
    abilityId: 'talk-today',
    title: 'Talking about today',
    targetSentence: 'Hoy tengo trabajo.',
    targetGloss: 'I have work today.',
    estimatedMinutes: 16,
    activityCount: 7,
    focusWhy: 'Say what you’re doing today — everyday Spanish.',
    languageId: 'es',
    items: [
      { id: 'hoy', surface: 'Hoy', gloss: 'today' },
      { id: 'tengo', surface: 'tengo', gloss: 'I have' },
      { id: 'trabajo', surface: 'trabajo', gloss: 'work / job' },
    ],
    buildChunks: ['Hoy', 'tengo', 'trabajo'],
    spotGlossA: 'today',
    spotGlossB: 'work',
    turnPromptSurface: 'trabajo',
    turnAnswerId: 'work',
    turnOptions: [
      { id: 'work', label: 'work / job', ok: true },
      { id: 'friend', label: 'friend', ok: false },
      { id: 'tomorrow', label: 'tomorrow', ok: false },
    ],
  },
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
  milestone: '1 conversation milestone',
}

export const DICTIONARY_SUBSET: DictEntry[] = [
  { surface: '明日', reading: 'あした', gloss: 'tomorrow' },
  { surface: '昨日', reading: 'きのう', gloss: 'yesterday' },
  { surface: '食べる', reading: 'たべる', gloss: 'to eat' },
  { surface: '飲む', reading: 'のむ', gloss: 'to drink' },
  { surface: '予約', reading: 'よやく', gloss: 'reservation' },
  { surface: '友達', reading: 'ともだち', gloss: 'friend' },
]

export const SAMPLE_PACK_JSON = `[
  {"surface":"元気ですか？","gloss":"How are you?","exampleSentence":"おはよう！元気ですか？"},
  {"surface":"お願いします","gloss":"Please (request)","exampleSentence":"水をお願いします。"}
]`

export const SAMPLE_TUTOR_PACK_JSON = `{
  "phrases": [
    {"surface":"Saya lapar.","gloss":"I am hungry.","exampleSentence":"Hari ini saya lapar.","abilityTag":"Talk about today"},
    {"surface":"Mau makan apa?","gloss":"What do you want to eat?","exampleSentence":"Mau makan apa hari ini?"},
    {"surface":"Saya ada waktu.","gloss":"I have time.","exampleSentence":"Hari ini saya ada waktu."}
  ],
  "noteTweaks": [
    "Stay in daily-life neighbors of hunger, time, and work — one new move each pack.",
    "Keep every example under ten words and reuse a word they already have."
  ]
}`
