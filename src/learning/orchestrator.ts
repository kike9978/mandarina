/** Local session planner — drives Home CTA language, not FSRS jargon. */

import type {
  ActivityId,
  ComebackItem,
  PhraseUnit,
} from '../data/fixtures'
import type { DueFacetRow } from './fsrsAdapter'

export type PlanKind = 'script' | 'journey' | 'comeback' | 'welcome_back' | 'stash'

export interface DailyPlan {
  kind: PlanKind
  route: '/script' | '/session' | '/stash'
  headline: string
  body: string
  ctaLabel: string
  /** Soft row copy for Home — never says “due cards”. */
  softComeback?: string
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
}): DailyPlan {
  const now = input.now ?? new Date()
  const absent =
    !!input.lastActiveAt &&
    now.getTime() - new Date(input.lastActiveAt).getTime() > ABSENCE_MS

  if (input.needsScriptFirst) {
    return {
      kind: 'script',
      route: '/script',
      headline: 'Warm up the writing first',
      body: 'A short path through see → hear → spot → match → practice → use.',
      ctaLabel: 'Start warm-up',
    }
  }

  if (absent && input.dueCount > 0) {
    const n = Math.min(input.dueCount, COMEBACK_CAP)
    return {
      kind: 'welcome_back',
      route: '/session',
      headline: 'Welcome back',
      body: 'We’ll ease in — a few familiar bits, then keep the journey moving.',
      ctaLabel: 'Ease back in',
      softComeback: `Let’s bring a few things back · ${n}`,
    }
  }

  if (input.dueCount > 0 && input.phraseReady) {
    const n = Math.min(input.dueCount, COMEBACK_CAP)
    return {
      kind: 'comeback',
      route: '/session',
      headline: 'Continue your lesson',
      body: 'We’ll weave a couple of comebacks into today’s path.',
      ctaLabel: 'Start',
      softComeback: `Let’s bring a few things back · ${n}`,
    }
  }

  if (!input.phraseReady && input.stashCount > 0) {
    return {
      kind: 'stash',
      route: '/stash',
      headline: 'Your phrases are waiting',
      body: `You stashed ${input.stashCount} — lock a few in when you’re ready.`,
      ctaLabel: 'Open stash',
    }
  }

  if (input.phraseReady) {
    return {
      kind: 'journey',
      route: '/session',
      headline: 'Continue your lesson',
      body: 'Pick up where the path left off.',
      ctaLabel: 'Start',
    }
  }

  return {
    kind: 'script',
    route: '/script',
    headline: 'Keep skills warm',
    body: 'Phrase units for this language are expanding — sounds practice is ready now.',
    ctaLabel: 'Practice sounds',
  }
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
