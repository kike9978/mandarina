import type { PhraseUnit, SpotChunk } from '../data/fixtures'
import type { LanguageId } from '../data/languages'
import { db } from '../db/mandarinaDb'
import { acceptsImportedWord } from './readingAid'
import { languageLockLine } from './tutorPack'

export interface JourneyUnit {
  id: string
  title: string
  sentence: string
  gloss: string
  chunks: string[]
  ask: string
  askGloss: string
  lure: string
  boss: string
  reading?: string
}

export interface JourneyStored {
  languageName: string
  units: JourneyUnit[]
  cleared: string[]
}

function settingsKey(profileLanguageId: string): string {
  return `journey-v1:${profileLanguageId}`
}

function unitId(sentence: string): string {
  return `journey:${sentence.replace(/\s/g, '').toLowerCase()}`
}

export function buildNextLessonBrief(
  languageName: string,
  goalTitle: string,
  known: string[],
): string {
  const knownLines = known.length
    ? known.map((line) => `- ${line}`).join('\n')
    : '- none yet'
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(languageName)}

Write one new move, not a whole path.
Language: ${languageName}
Goal: ${goalTitle}
Reuse words they already have.
${knownLines}

One unit: a sentence, an English gloss, chunks, the word the meaning question asks about, a lure, and a boss situation for that sentence's speech act.
Japanese kanji need furigana, each Chinese character needs its own pinyin syllable, and beginner Arabic needs vowel marks. A word without that aid is dropped.

{"language":"${languageName}","unit":{"title","sentence","gloss","chunks":["..."],"ask","askGloss","lure","boss","reading?"}}`
}

export function parseNextLesson(
  raw: string,
  languageName: string,
  aidLanguageId?: LanguageId,
): { unit?: JourneyUnit; error?: string } {
  const text = raw.trim()
  let wrapped = text
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text) as Record<string, unknown>
    if (value && typeof value === 'object' && !Array.isArray(value) && value.unit && !value.units) {
      wrapped = JSON.stringify({ language: value.language, units: [value.unit] })
    } else if (Array.isArray(value.units) && value.units.length > 1) {
      wrapped = JSON.stringify({ language: value.language, units: [value.units[0]] })
    }
  } catch {
    return { error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const parsed = parseJourneyPack(wrapped, languageName, aidLanguageId)
  if (parsed.error || !parsed.units[0]) return { error: parsed.error ?? 'Nothing was imported.' }
  return { unit: parsed.units[0] }
}

export function buildJourneyBrief(languageName: string): string {
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(languageName)}

Write a short path of lessons I can practice in this app.
Language: ${languageName}

Each unit needs a sentence, an English gloss, chunks of that sentence, the word the meaning question asks about, a lure chunk that is not the answer, and a boss situation for that sentence's speech act.
Japanese kanji need furigana, each Chinese character needs its own pinyin syllable, and beginner Arabic needs vowel marks. A word without that aid is dropped.

{"language":"${languageName}","units":[{"title","sentence","gloss","chunks":["..."],"ask","askGloss","lure","boss","reading?"}]}`
}

export function parseJourneyPack(
  raw: string,
  languageName: string,
  aidLanguageId?: LanguageId,
): { units: JourneyUnit[]; error?: string } {
  const text = raw.trim()
  if (!text) return { units: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { units: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { units: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const pack = value as Record<string, unknown>
  const named = typeof pack.language === 'string' ? pack.language.trim() : languageName
  if (named.toLowerCase() !== languageName.trim().toLowerCase()) {
    return {
      units: [],
      error: `That pack is for ${named}. Nothing was imported into ${languageName}.`,
    }
  }
  if (!Array.isArray(pack.units)) {
    return { units: [], error: 'That paste has no units. Nothing was imported.' }
  }
  const units: JourneyUnit[] = []
  for (const item of pack.units) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const sentence = typeof row.sentence === 'string' ? row.sentence.trim() : ''
    const gloss = typeof row.gloss === 'string' ? row.gloss.trim() : ''
    const ask = typeof row.ask === 'string' ? row.ask.trim() : ''
    const askGloss = typeof row.askGloss === 'string' ? row.askGloss.trim() : ''
    if (!sentence || !gloss || !ask || !askGloss) continue
    const reading = typeof row.reading === 'string' ? row.reading.trim() : undefined
    if (aidLanguageId && !acceptsImportedWord(aidLanguageId, ask, reading)) continue
    const chunks = Array.isArray(row.chunks)
      ? row.chunks.filter((chunk): chunk is string => typeof chunk === 'string' && chunk.trim().length > 0)
      : [sentence]
    units.push({
      id: unitId(sentence),
      title: typeof row.title === 'string' && row.title.trim() ? row.title.trim() : gloss,
      sentence,
      gloss,
      chunks: chunks.length ? chunks : [sentence],
      ask,
      askGloss,
      lure: typeof row.lure === 'string' && row.lure.trim() ? row.lure.trim() : '…',
      boss: typeof row.boss === 'string' ? row.boss.trim() : gloss,
      reading,
    })
  }
  if (!units.length) {
    return { units: [], error: 'No playable units in that paste. Nothing was imported.' }
  }
  return { units }
}

export function openJourneyUnit(stored: JourneyStored): JourneyUnit | null {
  return stored.units.find((unit) => !stored.cleared.includes(unit.id)) ?? null
}

export function lockedJourneyTitle(stored: JourneyStored): string | null {
  const open = openJourneyUnit(stored)
  if (!open) return null
  const index = stored.units.findIndex((unit) => unit.id === open.id)
  return stored.units[index + 1]?.title ?? null
}

export function toPhraseUnit(unit: JourneyUnit, languageId: LanguageId): PhraseUnit {
  const spot: SpotChunk[] = unit.chunks.map((text, index) => ({
    id: `c${index}`,
    itemId: text.includes(unit.ask) ? 'ask' : 'lure',
    target: text.includes(unit.ask),
    parts: [{ text, reading: text.includes(unit.ask) ? unit.reading : undefined }],
  }))
  if (!spot.some((chunk) => !chunk.target)) {
    spot.push({
      id: 'lure',
      itemId: 'lure',
      target: false,
      parts: [{ text: unit.lure }],
    })
  }
  return {
    id: unit.id,
    abilityId: 'talk-today',
    title: unit.title,
    targetSentence: unit.sentence,
    targetGloss: unit.gloss,
    estimatedMinutes: 8,
    activityCount: 7,
    focusWhy: unit.boss,
    languageId,
    items: [
      { id: 'ask', surface: unit.ask, gloss: unit.askGloss, reading: unit.reading },
      { id: 'lure', surface: unit.lure, gloss: 'not this one' },
    ],
    buildChunks: unit.chunks,
    spotChunks: spot,
    spotGlossA: unit.askGloss,
    spotGlossB: unit.gloss,
    turnPromptSurface: unit.ask,
    turnAnswerId: 'ask',
    turnOptions: [
      { id: 'ask', label: unit.askGloss, ok: true },
      { id: 'no', label: 'tomorrow', ok: false },
      { id: 'other', label: 'friend', ok: false },
    ],
    productionReady: true,
    origin: 'seed',
  }
}

export async function loadJourney(profileLanguageId: string): Promise<JourneyStored | null> {
  const row = await db.settings.get(settingsKey(profileLanguageId))
  if (!row?.value) return null
  try {
    const parsed = JSON.parse(row.value) as JourneyStored
    if (!parsed?.languageName || !Array.isArray(parsed.units)) return null
    return {
      languageName: parsed.languageName,
      units: parsed.units,
      cleared: Array.isArray(parsed.cleared) ? parsed.cleared : [],
    }
  } catch {
    return null
  }
}

export async function appendJourney(
  profileLanguageId: string,
  languageName: string,
  units: JourneyUnit[],
): Promise<JourneyStored> {
  const existing = await loadJourney(profileLanguageId)
  const same =
    existing && existing.languageName.trim().toLowerCase() === languageName.trim().toLowerCase()
  const base = same ? existing : { languageName, units: [], cleared: [] }
  const seen = new Set(base.units.map((unit) => unit.id))
  const next = [...base.units]
  for (const unit of units) {
    if (seen.has(unit.id)) continue
    seen.add(unit.id)
    next.push(unit)
  }
  const stored: JourneyStored = {
    languageName,
    units: next,
    cleared: base.cleared.filter((id) => next.some((unit) => unit.id === id)),
  }
  await db.settings.put({ key: settingsKey(profileLanguageId), value: JSON.stringify(stored) })
  return stored
}

export async function clearJourneyUnit(
  profileLanguageId: string,
  unitId: string,
): Promise<void> {
  const existing = await loadJourney(profileLanguageId)
  if (!existing || existing.cleared.includes(unitId)) return
  const stored: JourneyStored = {
    ...existing,
    cleared: [...existing.cleared, unitId],
  }
  await db.settings.put({ key: settingsKey(profileLanguageId), value: JSON.stringify(stored) })
}
