/** Local session planner — drives Home CTA language, not FSRS jargon. */

import type {
  ActivityId,
  ComebackItem,
  PhraseUnit,
} from '../data/fixtures'
import type { DueFacetRow } from './fsrsAdapter'

export type PlanKind =
  | 'script'
  | 'journey'
  | 'comeback'
  | 'welcome_back'
  | 'stash'
  | 'parked'

export interface DailyPlan {
  kind: PlanKind
  route: '/script' | '/session' | '/stash'
  headline: string
  body: string
  ctaLabel: string
  /** Soft row copy for Home — never says “due cards”. */
  softComeback?: string
  /** Soft row when writing facets are due. */
  softWriting?: string
  /** Welcome-back / Today may offer a light Boss scene. */
  offerBoss?: boolean
}

const ABSENCE_MS = 5 * 24 * 60 * 60 * 1000
export const COMEBACK_CAP = 3

export function decideDailyPlan(input: {
  needsScriptFirst: boolean
  phraseReady: boolean
  dueCount: number
  stashCount: number
  lastActiveAt?: string | null
  now?: Date
  /** Latin sounds — optional; do not steal the phrase Continue hero. */
  scriptOptional?: boolean
  writingDue?: number
  bossReady?: boolean
  writingNoun?: string
  /** The only shipped phrase unit is already cleared. */
  lessonCleared?: boolean
}): DailyPlan {
  const now = input.now ?? new Date()
  const absent =
    !!input.lastActiveAt &&
    now.getTime() - new Date(input.lastActiveAt).getTime() > ABSENCE_MS
  const writingNoun = input.writingNoun ?? 'characters'
  const writingN = Math.min(input.writingDue ?? 0, 5)
  const softWriting =
    writingN > 0
      ? writingN === 1
        ? `1 ${writingNoun.replace(/s$/, '')} to practice`
        : `${writingN} ${writingNoun} to practice`
      : undefined

  const withExtras = (plan: DailyPlan): DailyPlan => ({
    ...plan,
    softWriting,
    offerBoss: Boolean(input.bossReady && input.phraseReady),
  })

  const scriptBlocksPhrases =
    input.needsScriptFirst && !(input.scriptOptional && input.phraseReady)

  if (scriptBlocksPhrases) {
    return withExtras({
      kind: 'script',
      route: '/script',
      headline: 'Warm up the writing first',
      body: 'A short path through see → hear → spot → match → practice → use.',
      ctaLabel: 'Start warm-up',
    })
  }

  if (absent && input.dueCount > 0) {
    const n = Math.min(input.dueCount, COMEBACK_CAP)
    return withExtras({
      kind: 'welcome_back',
      route: '/session',
      headline: 'Welcome back',
      body: input.bossReady
        ? 'We’ll ease in — a few familiar bits, or a tiny scene if you want to talk.'
        : 'We’ll ease in — a few familiar bits, then keep the journey moving.',
      ctaLabel: 'Ease back in',
      softComeback: `Let’s bring a few things back · ${n}`,
    })
  }

  if (input.dueCount > 0 && input.phraseReady) {
    const n = Math.min(input.dueCount, COMEBACK_CAP)
    return withExtras({
      kind: 'comeback',
      route: '/session',
      headline: input.lessonCleared
        ? 'Bring a few things back'
        : 'Continue your lesson',
      body: input.lessonCleared
        ? 'A few familiar bits are ready. We’ll start with those.'
        : 'We’ll weave a couple of comebacks into today’s path.',
      ctaLabel: 'Start',
      softComeback: `Let’s bring a few things back · ${n}`,
    })
  }

  if (!input.phraseReady && input.stashCount > 0) {
    return withExtras({
      kind: 'stash',
      route: '/stash',
      headline: 'Your phrases are waiting',
      body: `You stashed ${input.stashCount} — lock a few in when you’re ready.`,
      ctaLabel: 'Open stash',
    })
  }

  if (input.lessonCleared && input.phraseReady) {
    return withExtras({
      kind: 'parked',
      route: '/session',
      headline: 'This is the lesson we have',
      body: 'The first sentence is cleared. Nothing is due.',
      ctaLabel: 'Practice it again',
    })
  }

  if (input.phraseReady) {
    return withExtras({
      kind: 'journey',
      route: '/session',
      headline: 'Continue your lesson',
      body: 'Pick up where the path left off.',
      ctaLabel: 'Start',
    })
  }

  return withExtras({
    kind: 'script',
    route: '/script',
    headline: 'Keep skills warm',
    body: 'Phrase units for this language are expanding — sounds practice is ready now.',
    ctaLabel: 'Practice sounds',
  })
}

const CORE_ORDER: ActivityId[] = [
  'meet',
  'spot',
  'break',
  'turn',
  'build',
  'say',
  'boss',
  'clear',
]

/** Insert soft “Bring back” without dumping a review pile. */
export function composeJourneyOrder(
  planKind: PlanKind,
  hasComebacks: boolean,
): ActivityId[] {
  if (!hasComebacks) return [...CORE_ORDER]

  if (planKind === 'welcome_back') {
    return ['comeback', ...CORE_ORDER]
  }

  // Weave after Meet — still feels like one lesson path
  const order = [...CORE_ORDER]
  const meetIdx = order.indexOf('meet')
  order.splice(meetIdx + 1, 0, 'comeback')
  return order
}

export function dueRowsToComebacks(
  rows: DueFacetRow[],
  languageId: string,
): ComebackItem[] {
  const prefix = `${languageId}:`
  return rows.map((r) => ({
    itemKey: r.itemId.startsWith(prefix)
      ? r.itemId.slice(prefix.length)
      : r.itemId,
    surface: r.surface,
    gloss: r.gloss,
    reading: r.reading,
    facet: r.facet,
  }))
}

/** Use-stage (Boss Challenge) — not a chat tab. */
export function isBossReady(input: {
  needsScriptFirst: boolean
  phraseReady: boolean
  talkTodayDone: boolean
  stashWithExample: number
}): boolean {
  if (input.stashWithExample > 0) return true
  if (input.needsScriptFirst) return false
  return input.talkTodayDone && input.phraseReady
}

export function attachComebacks(
  unit: PhraseUnit,
  rows: DueFacetRow[],
): PhraseUnit {
  if (!rows.length) {
    return { ...unit, comebackItems: undefined }
  }
  const comebackItems = dueRowsToComebacks(rows, unit.languageId)
  return {
    ...unit,
    comebackItems,
    focusWhy:
      rows.length === 1
        ? `${unit.focusWhy} We’ll also bring one familiar bit back.`
        : `${unit.focusWhy} We’ll weave in a couple of familiar bits.`,
    activityCount: unit.activityCount + 1,
  }
}
