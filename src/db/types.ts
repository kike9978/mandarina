export type Facet =
  | 'recognition'
  | 'listening'
  | 'production'
  | 'writing'
  | 'contextualUse'

export type ContentSource = 'seed' | 'user' | 'import'

export type AbilityStatus = 'done' | 'partial' | 'locked'

export type AttemptOutcome = 'success' | 'hint' | 'fail' | 'reveal'

export interface DbProfile {
  id: string
  displayName: string
  languageId: string
  scriptFamiliarity: string
  goalId: string
  journeyDay: number
  createdAt: string
  lastActiveAt: string
  onboarded: boolean
}

export interface DbAbility {
  id: string
  languageId: string
  title: string
  sortOrder: number
  status: AbilityStatus
  kind: 'script' | 'speak'
  source: ContentSource
}

export interface DbItem {
  id: string
  languageId: string
  unitId?: string
  surface: string
  reading?: string
  gloss: string
  type: 'word' | 'pattern' | 'character' | 'phrase' | 'sound'
  source: ContentSource
  exampleSentence?: string
  abilityId?: string
  sourceId?: string
}

export interface DbFsrsCard {
  id: string
  itemId: string
  facet: Facet
  due: string
  fsrsState: string // JSON Card from ts-fsrs
  masteryHint: number
}

export interface DbSession {
  id: string
  startedAt: string
  endedAt?: string
  unitId?: string
  kind: 'journey' | 'comeback' | 'mixed' | 'stash' | 'script' | 'listen'
  languageId: string
}

export interface DbAttempt {
  id: string
  sessionId: string
  activityType: string
  itemId?: string
  facet?: Facet
  outcome: AttemptOutcome
  hintsUsed: number
  latencyMs?: number
  createdAt: string
  payload?: string
}

export interface DbLearningSignal {
  id: string
  source: 'attempt' | 'manual' | 'import'
  itemId: string
  facet: Facet
  strength: number
  createdAt: string
  consumedByScheduler?: boolean
}

export interface DbStash {
  id: string
  surface: string
  gloss: string
  reading?: string
  exampleSentence?: string
  abilityTag?: string
  source: 'user' | 'import' | 'lookup'
  languageId: string
  createdAt: string
  sourceId?: string
}

export type ListeningMedium = 'video' | 'podcast'
export type ListeningStatus = 'suggested' | 'listening' | 'practiced'

export interface DbListeningSource {
  id: string
  languageId: string
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

export interface DbContentPack {
  id: string
  name: string
  importedAt: string
  itemCount: number
  format: 'json' | 'tsv' | 'paste'
}

export interface DbSetting {
  key: string
  value: string
}
