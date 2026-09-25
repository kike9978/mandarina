import {
  FSRS,
  Rating,
  createEmptyCard,
  generatorParameters,
  type Card,
  type Grade,
} from 'ts-fsrs'
import { db } from '../db/mandarinaDb'
import { parseCard } from '../db/seed'
import type { AttemptOutcome, Facet } from '../db/types'

const fsrs = new FSRS(generatorParameters({ enable_fuzz: false }))

export type OutcomeRating = AttemptOutcome

export function outcomeToRating(outcome: OutcomeRating): Grade {
  switch (outcome) {
    case 'success':
      return Rating.Good
    case 'hint':
      return Rating.Hard
    case 'fail':
      return Rating.Again
    case 'reveal':
      return Rating.Again
    default:
      return Rating.Good
  }
}

export function masteryFromCard(card: Card): number {
  // Heuristic 0–100 from stability + state for optional UI
  const s = Math.min(card.stability ?? 0, 30)
  const base = (s / 30) * 80
  const reps = Math.min(card.reps ?? 0, 10) * 2
  return Math.round(Math.min(100, base + reps))
}

export async function ensureFsrsCard(
  itemId: string,
  facet: Facet,
): Promise<{ id: string; card: Card }> {
  const id = `${itemId}:${facet}`
  const existing = await db.fsrsCards.get(id)
  if (existing) {
    return { id, card: parseCard(existing.fsrsState) }
  }
  const empty = createEmptyCard(new Date())
  await db.fsrsCards.put({
    id,
    itemId,
    facet,
    due: empty.due.toISOString(),
    fsrsState: JSON.stringify(empty),
    masteryHint: 0,
  })
  return { id, card: empty }
}

export async function rateFacet(
  itemId: string,
  facet: Facet,
  outcome: OutcomeRating,
  now = new Date(),
): Promise<{ due: Date; masteryHint: number }> {
  const { id, card } = await ensureFsrsCard(itemId, facet)
  const rating = outcomeToRating(outcome)
  const record = fsrs.next(card, now, rating)
  const next = record.card
  const masteryHint = masteryFromCard(next)
  await db.fsrsCards.put({
    id,
    itemId,
    facet,
    due: next.due.toISOString(),
    fsrsState: JSON.stringify(next),
    masteryHint,
  })
  return { due: next.due, masteryHint }
}

export async function countDueFacets(
  languageId: string,
  now = new Date(),
): Promise<number> {
  const dues = await listDueFacets(languageId, Infinity, now)
  return dues.length
}

export interface DueFacetRow {
  itemId: string
  facet: Facet
  surface: string
  gloss: string
  reading?: string
  exampleSentence?: string
  source: string
}

const FACET_PRIORITY: Record<Facet, number> = {
  recognition: 0,
  listening: 1,
  production: 2,
  writing: 3,
  contextualUse: 4,
}

/** Reviewed facets that are due — unique by item, capped for soft comebacks. */
export async function listDueFacets(
  languageId: string,
  limit = 3,
  now = new Date(),
): Promise<DueFacetRow[]> {
  const cards = await db.fsrsCards
    .where('due')
    .belowOrEqual(now.toISOString())
    .toArray()
  if (!cards.length) return []

  const items = await db.items.where('languageId').equals(languageId).toArray()
  const byId = new Map(items.map((i) => [i.id, i]))

  const reviewed = cards
    .map((c) => {
      try {
        const card = parseCard(c.fsrsState)
        if ((card.reps ?? 0) <= 0) return null
        if (!byId.has(c.itemId)) return null
        return { row: c, card }
      } catch {
        return null
      }
    })
    .filter(Boolean) as { row: (typeof cards)[0]; card: Card }[]

  reviewed.sort((a, b) => {
    const fa = FACET_PRIORITY[a.row.facet as Facet] ?? 9
    const fb = FACET_PRIORITY[b.row.facet as Facet] ?? 9
    if (fa !== fb) return fa - fb
    return a.row.due.localeCompare(b.row.due)
  })

  const seen = new Set<string>()
  const out: DueFacetRow[] = []
  for (const { row } of reviewed) {
    if (seen.has(row.itemId)) continue
    seen.add(row.itemId)
    const item = byId.get(row.itemId)!
    out.push({
      itemId: row.itemId,
      facet: row.facet as Facet,
      surface: item.surface,
      gloss: item.gloss,
      reading: item.reading,
      exampleSentence: item.exampleSentence,
      source: item.source,
    })
    if (out.length >= limit) break
  }
  return out
}

/** Dev helper: mark recognition facets reviewed + due now. */
export async function debugForceDue(
  languageId: string,
  limit = 3,
  now = new Date(),
): Promise<number> {
  const items = await db.items.where('languageId').equals(languageId).toArray()
  const itemIds = new Set(items.map((i) => i.id))
  const cards = await db.fsrsCards.toArray()
  const past = new Date(now.getTime() - 60 * 60 * 1000)
  let touched = 0
  for (const c of cards) {
    if (!itemIds.has(c.itemId)) continue
    if (c.facet !== 'recognition') continue
    const card = parseCard(c.fsrsState)
    card.reps = Math.max(card.reps ?? 0, 1)
    card.due = past
    await db.fsrsCards.put({
      ...c,
      due: past.toISOString(),
      fsrsState: JSON.stringify(card),
    })
    touched += 1
    if (touched >= limit) break
  }
  return touched
}
