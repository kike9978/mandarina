import type { LanguageId } from '../data/languages'
import type { PhraseUnit, StashedPhrase, UnitItem } from '../data/fixtures'

const GLOSS_DECOYS = [
  'tomorrow',
  'friend',
  'water',
  'thank you',
  'goodbye',
  'please',
  'school',
  'food',
]

const MAX_STASH_PRACTICE = 3

/** Empty prompt. The box must not contain the sentence’s opening tokens. */
export function sentencePlaceholder(_sentence: string): string {
  return '…'
}

/** Compare learner text to a target, ignoring space and end punctuation. */
export function samePhrase(a: string, b: string): boolean {
  const n = (s: string) =>
    s.toLowerCase().replace(/[\s、。．.!?？,，]+/g, '')
  const left = n(a)
  return left.length > 0 && left === n(b)
}

/** Split a sentence into rebuildable chunks (spaces preferred; else whole string). */
export function chunkSentence(sentence: string): string[] {
  const trimmed = sentence.trim()
  if (!trimmed) return []
  const spaced = trimmed.split(/\s+/).filter(Boolean)
  if (spaced.length >= 2) return spaced

  // Light punctuation split for CJK-ish single blobs
  const punct = trimmed
    .split(/([、。！？,.!?])/u)
    .map((p) => p.trim())
    .filter(Boolean)
  if (punct.length >= 2) return punct

  return [trimmed]
}

function decoyGlosses(correct: string, extras: string[]): string[] {
  const pool = [
    ...extras.filter((g) => g.toLowerCase() !== correct.toLowerCase()),
    ...GLOSS_DECOYS.filter((g) => g.toLowerCase() !== correct.toLowerCase()),
  ]
  const unique: string[] = []
  for (const g of pool) {
    if (!unique.some((u) => u.toLowerCase() === g.toLowerCase())) unique.push(g)
    if (unique.length >= 2) break
  }
  while (unique.length < 2) unique.push(`not “${correct}”`)
  return unique.slice(0, 2)
}

/**
 * Build a playable PhraseUnit from learner stash rows.
 * Prefer phrases with example sentences so Build It / Say It unlock.
 */
export function buildUnitFromStash(
  phrases: StashedPhrase[],
  languageId: LanguageId,
): PhraseUnit | null {
  const picked = phrases.slice(0, MAX_STASH_PRACTICE)
  if (picked.length === 0) return null

  const primary =
    picked.find((p) => p.exampleSentence?.trim()) ?? picked[0]
  const sentence =
    primary.exampleSentence?.trim() || primary.surface.trim()
  const productionReady = Boolean(primary.exampleSentence?.trim())

  const items: UnitItem[] = picked.map((p) => ({
    id: p.id,
    surface: p.surface,
    reading: p.reading,
    gloss: p.gloss,
  }))

  // Spot needs two targets — pad with primary surface pieces if only one stash
  if (items.length === 1) {
    const chunks = chunkSentence(sentence)
    if (chunks.length >= 2) {
      items.push({
        id: `${primary.id}-ctx`,
        surface: chunks[0],
        gloss: 'part of the sentence',
      })
    } else {
      items.push({
        id: `${primary.id}-echo`,
        surface: primary.surface,
        gloss: primary.gloss,
      })
    }
  }

  const spotA = items[0]
  const spotB = items[1]
  const buildChunks = chunkSentence(sentence)
  const extras = picked.map((p) => p.gloss)
  const wrong = decoyGlosses(primary.gloss, extras)

  return {
    id: `unit-stash-${primary.id}`,
    abilityId: primary.abilityTag || 'stash-practice',
    title: 'Your stashed phrases',
    targetSentence: sentence,
    targetGloss: primary.gloss,
    estimatedMinutes: productionReady ? 12 : 8,
    activityCount: productionReady ? 7 : 5,
    focusWhy: productionReady
      ? 'Lock in phrases you brought aboard — same playful path as a lesson.'
      : 'Meet and recognize your stash. Add an example sentence later to unlock Build It.',
    languageId,
    items,
    buildChunks: buildChunks.length >= 2 ? buildChunks : [sentence],
    spotGlossA: spotA.gloss,
    spotGlossB: spotB.gloss,
    turnPromptSurface: primary.surface,
    turnAnswerId: 'ok',
    turnOptions: [
      { id: 'ok', label: primary.gloss, ok: true },
      { id: 'd1', label: wrong[0], ok: false },
      { id: 'd2', label: wrong[1], ok: false },
    ],
    productionReady,
    origin: 'stash',
  }
}

export function stashPracticeCap(): number {
  return MAX_STASH_PRACTICE
}
