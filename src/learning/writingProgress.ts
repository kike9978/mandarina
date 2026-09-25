import type { ScriptFamiliarity } from '../data/languages'
import type { WritingMark, WritingSet } from '../data/writingCharts'
import type { RubySpan } from './ruby'
import { db } from '../db/mandarinaDb'
import { rateFacet } from './fsrsAdapter'

export function familiarityStart(
  familiarity: ScriptFamiliarity,
  total: number,
): number {
  if (total <= 1) return 0
  if (familiarity === 'comfortable') return Math.min(4, total - 1)
  if (familiarity === 'some') return Math.min(2, total - 1)
  return 0
}

export function nextWritingSet(
  sets: WritingSet[],
  cleared: readonly string[],
  familiarity: ScriptFamiliarity,
): { set: WritingSet; index: number } | null {
  const start = familiarityStart(familiarity, sets.length)
  const index = sets.findIndex(
    (set, i) => i >= start && !cleared.includes(set.id),
  )
  if (index < 0) return null
  return { set: sets[index], index }
}

export function lockedWritingSets(
  sets: WritingSet[],
  cleared: readonly string[],
  familiarity: ScriptFamiliarity,
): WritingSet[] {
  const next = nextWritingSet(sets, cleared, familiarity)
  if (!next) return []
  return sets.slice(next.index + 1)
}

export function skippedSets(
  sets: WritingSet[],
  familiarity: ScriptFamiliarity,
): WritingSet[] {
  return sets.slice(0, familiarityStart(familiarity, sets.length))
}

function settingsKey(languageId: string): string {
  return `writing-sets:${languageId}`
}

export async function loadClearedSets(languageId: string): Promise<string[]> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

export async function saveClearedSet(
  languageId: string,
  setId: string,
): Promise<string[]> {
  const cleared = await loadClearedSets(languageId)
  if (cleared.includes(setId)) return cleared
  const next = [...cleared, setId]
  await db.settings.put({ key: settingsKey(languageId), value: JSON.stringify(next) })
  return next
}

const REVIEW_CAP = 5

export async function dueWritingMarks(languageId: string): Promise<WritingMark[]> {
  const now = new Date().toISOString()
  const cards = await db.fsrsCards.where('due').belowOrEqual(now).toArray()
  const items = await db.items.where('languageId').equals(languageId).toArray()
  const byId = new Map(items.map((item) => [item.id, item]))
  const marks: WritingMark[] = []
  for (const card of cards) {
    if (card.facet !== 'writing') continue
    const item = byId.get(card.itemId)
    if (!item?.id.startsWith(`script:${languageId}:`)) continue
    marks.push({ glyph: item.surface, reading: item.reading ?? item.surface })
    if (marks.length >= REVIEW_CAP) break
  }
  return marks
}

export async function rateWritingMark(
  languageId: string,
  mark: WritingMark,
  outcome: 'success' | 'fail',
): Promise<void> {
  const id = `script:${languageId}:${mark.glyph}`
  await db.items.put({
    id,
    languageId,
    surface: mark.glyph,
    reading: mark.reading,
    gloss: mark.reading,
    type: mark.glyph === mark.reading ? 'sound' : 'character',
    source: 'seed',
  })
  await rateFacet(id, 'writing', outcome)
}

export type CheckStage = 'early' | 'later' | 'comfortable'

export function checkStage(
  familiarity: ScriptFamiliarity,
  setIndex: number,
): CheckStage {
  if (familiarity === 'comfortable') return 'comfortable'
  if (familiarity === 'some' || setIndex >= 2) return 'later'
  return 'early'
}

export function comfortableMarks(
  due: WritingMark[],
  nextRow: WritingMark[],
): WritingMark[] {
  const seen = new Set<string>()
  const marks: WritingMark[] = []
  for (const mark of [...due.slice(0, REVIEW_CAP), ...nextRow]) {
    const key = `${mark.glyph}:${mark.word ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    marks.push(mark)
  }
  return marks
}

const TASHKEEL = /[\u064B-\u0652\u0670]/
const ARABIC_LETTER = /[\u0621-\u064A]/

export function retrievedGlyphs(
  sets: WritingSet[],
  cleared: readonly string[],
): Set<string> {
  const known = new Set<string>()
  for (const set of sets) {
    if (!cleared.includes(set.id)) continue
    for (const mark of set.marks) known.add(mark.glyph)
  }
  return known
}

/** Drop the reading only when every character in the span has been retrieved. */
export function hideRetrievedAid(
  spans: RubySpan[],
  retrieved: ReadonlySet<string>,
): RubySpan[] {
  return spans.map((span) => {
    if (!span.reading) return span
    const chars = [...span.text].filter((char) => char.trim())
    if (chars.length && chars.every((char) => retrieved.has(char))) {
      return { text: span.text }
    }
    return span
  })
}

/** Strip vowel marks on retrieved Arabic letters. Other letters keep them. */
export function hideArabicVowels(text: string, retrieved: ReadonlySet<string>): string {
  let out = ''
  let skip = false
  for (const char of text) {
    if (ARABIC_LETTER.test(char)) {
      skip = retrieved.has(char)
      out += char
      continue
    }
    if (skip && TASHKEEL.test(char)) continue
    out += char
  }
  return out
}

function shuffle(answer: string, choices: string[]): string[] {
  const next = [...choices]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = (answer.length + i) % (i + 1)
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

export function checkOptions(
  mark: WritingMark,
  pool: WritingMark[],
  stage: CheckStage = 'early',
): { prompt: 'reading' | 'heard' | 'mark' | 'shape'; cue: string; choices: string[] } {
  if (mark.word) {
    const lures = (mark.lures ?? pool.map((item) => item.glyph)).filter(
      (glyph) => glyph && glyph !== mark.glyph,
    )
    return {
      prompt: 'shape',
      cue: mark.word,
      choices: shuffle(mark.glyph, [mark.glyph, ...new Set(lures)].slice(0, 3)),
    }
  }
  const sameScript = mark.glyph === mark.reading
  const later = stage !== 'early' && !sameScript
  const answer = later || sameScript ? mark.glyph : mark.reading
  const lures = pool
    .map((item) => (later || sameScript ? item.glyph : item.reading))
    .filter((value) => value && value !== answer)
  const choices = shuffle(answer, [answer, ...new Set(lures)].slice(0, 3))
  if (sameScript) return { prompt: 'heard', cue: mark.glyph, choices }
  if (later) return { prompt: 'mark', cue: mark.reading, choices }
  return { prompt: 'reading', cue: mark.glyph, choices }
}
