import type { LanguageId, ScriptGlyph } from '../data/languages'
import { db } from '../db/mandarinaDb'
import { acceptsImportedWord } from './readingAid'
import { languageLockLine } from './tutorPack'

function settingsKey(languageId: string): string {
  return `next-marks:${languageId}`
}

export function buildNextMarksBrief(languageName: string, already: string[]): string {
  const drilled = already.length ? already.join(' ') : 'none yet'
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(languageName)}

They already drilled: ${drilled}
Give five next marks. Each mark needs a glyph, a reading, a hint, a real word that uses the glyph, and an English gloss for that word.
Japanese kanji need furigana, each Chinese character needs its own pinyin syllable, and beginner Arabic needs vowel marks. A word without that aid is dropped.

{"marks":[{"glyph","reading","hint","useWord","useGloss"}]}`
}

export function parseNextMarks(
  raw: string,
  languageId?: LanguageId,
): { marks: ScriptGlyph[]; error?: string } {
  const text = raw.trim()
  if (!text) return { marks: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { marks: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const rows = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as { marks?: unknown }).marks
    : undefined
  if (!Array.isArray(rows)) {
    return { marks: [], error: 'That paste has no marks. Nothing was imported.' }
  }
  const marks: ScriptGlyph[] = []
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const glyph = typeof row.glyph === 'string' ? row.glyph.trim() : ''
    const reading = typeof row.reading === 'string' ? row.reading.trim() : ''
    const hint = typeof row.hint === 'string' ? row.hint.trim() : ''
    const useWord = typeof row.useWord === 'string' ? row.useWord.trim() : ''
    const useGloss = typeof row.useGloss === 'string' ? row.useGloss.trim() : ''
    if (!glyph || !reading || !hint || !useWord || !useGloss) continue
    if (languageId && !acceptsImportedWord(languageId, useWord, reading)) continue
    marks.push({
      id: `next:${glyph}`,
      glyph,
      reading,
      hint,
      usePhrase: useWord,
      useGloss,
    })
    if (marks.length >= 5) break
  }
  if (!marks.length) return { marks: [], error: 'No playable marks in that paste. Nothing was imported.' }
  return { marks }
}

export async function loadNextMarks(languageId: string): Promise<ScriptGlyph[]> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value) as ScriptGlyph[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveNextMarks(languageId: string, marks: ScriptGlyph[]): Promise<void> {
  await db.settings.put({
    key: settingsKey(languageId),
    value: JSON.stringify(marks.slice(0, 5)),
  })
}
