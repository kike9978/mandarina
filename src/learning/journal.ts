import { db } from '../db/mandarinaDb'
import { parseLineCheck } from './lineCheck'
import { languageLockLine } from './tutorPack'

export interface JournalNote {
  sentence: string
  hint: string
}

export interface JournalEntry {
  id: string
  body: string
  prompt: string
  createdAt: string
  notes: JournalNote[]
}

function entriesKey(languageId: string): string {
  return `journal-entries:${languageId}`
}

function promptKey(languageId: string): string {
  return `journal-prompt:${languageId}`
}

/** One English ask those words can answer. It names the move and does not print a target sentence. */
export function suggestJournalPrompt(input: {
  goalTitle: string
  sentences: string[]
  glosses: string[]
}): string {
  const glosses = input.glosses.join(' ').toLowerCase()
  const hasWork = /\bwork\b/.test(glosses)
  const hasToday = /\btoday\b/.test(glosses)
  const hasFood = /\b(food|hungry|eat|menu)\b/.test(glosses)
  let prompt: string
  if (hasWork && hasToday) {
    prompt = 'Write one line about your work today. Use only words you already have.'
  } else if (hasWork) {
    prompt = 'Write one line about work. Use only words you already have.'
  } else if (hasToday) {
    prompt = 'Write one line about today. Use only words you already have.'
  } else if (hasFood) {
    prompt = 'Write one line about food. Use only words you already have.'
  } else {
    prompt = `Write one line about ${input.goalTitle.toLowerCase()}. Use only words you already have.`
  }
  for (const sentence of input.sentences) {
    const line = sentence.trim()
    if (line && prompt.includes(line)) {
      return 'Write one line with words you already have.'
    }
  }
  return prompt
}

export function buildJournalPromptBrief(input: {
  languageName: string
  goalTitle: string
  known: string[]
}): string {
  const words = input.known.length ? input.known.join(', ') : 'none yet'
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(input.languageName)}

Goal: ${input.goalTitle}
Words they can use: ${words}

Write one prompt they can answer with only these words. The prompt is English. It names the move. It does not print a target sentence. Do not write the journal entry.

{"prompt":"...","use":["..."]}`
}

export function parseJournalPrompt(
  raw: string,
  knownSentences: string[] = [],
): { prompt?: string; use?: string[]; error?: string } {
  const text = raw.trim()
  if (!text) return { error: 'That paste is not valid JSON. Nothing was imported.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const row = value as { prompt?: unknown; use?: unknown }
  const prompt = typeof row.prompt === 'string' ? row.prompt.trim() : ''
  if (!prompt) return { error: 'That paste has no prompt. Nothing was imported.' }
  if (knownSentences.some((sentence) => sentence.trim() === prompt)) {
    return { error: 'That prompt is the sentence itself. Nothing was imported.' }
  }
  const use = Array.isArray(row.use)
    ? row.use.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  return { prompt, ...(use.length ? { use } : {}) }
}

/** A pasted prompt replaces the suggestion and leaves the page empty. */
export function applyJournalPrompt(prompt: string): { body: string; prompt: string } {
  return { body: '', prompt }
}

export function entrySentences(body: string): string[] {
  return body
    .split(/\n+|(?<=[。．.!?？])\s*/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function reusedWordCount(body: string, surfaces: string[]): number {
  const seen = new Set<string>()
  let count = 0
  for (const surface of surfaces) {
    const token = surface.trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    if (body.includes(token)) count += 1
  }
  return count
}

export function withJournalNote(entry: JournalEntry, sentence: string, hint: string): JournalEntry {
  return {
    ...entry,
    notes: [...entry.notes, { sentence, hint }],
  }
}

export function buildJournalLineBrief(input: { languageName: string; sentence: string }): string {
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(input.languageName)}

They wrote this sentence in a journal. This is not a score. Do not rewrite their sentence.
Sentence: ${input.sentence}

Reply with one short note. The note must not be the sentence itself.

{"hint":"..."}`
}

export function parseJournalNote(
  raw: string,
  sentence: string,
): { hint?: string; error?: string } {
  const parsed = parseLineCheck(raw, sentence)
  if (parsed.error) {
    return { error: parsed.error.replace('Nothing was shown', 'Nothing was added') }
  }
  return parsed
}

function asEntry(value: unknown): JournalEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const id = typeof row.id === 'string' ? row.id : ''
  const body = typeof row.body === 'string' ? row.body : ''
  const prompt = typeof row.prompt === 'string' ? row.prompt : ''
  const createdAt = typeof row.createdAt === 'string' ? row.createdAt : ''
  if (!id || !body || !createdAt) return null
  const notes = Array.isArray(row.notes)
    ? row.notes.flatMap((note) => {
        if (!note || typeof note !== 'object') return []
        const item = note as { sentence?: unknown; hint?: unknown }
        if (typeof item.sentence !== 'string' || typeof item.hint !== 'string') return []
        return [{ sentence: item.sentence, hint: item.hint }]
      })
    : []
  return { id, body, prompt, createdAt, notes }
}

export async function loadJournalEntries(languageId: string): Promise<JournalEntry[]> {
  const row = await db.settings.get(entriesKey(languageId))
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const entry = asEntry(item)
      return entry ? [entry] : []
    })
  } catch {
    return []
  }
}

export async function saveJournalEntries(
  languageId: string,
  entries: JournalEntry[],
): Promise<void> {
  await db.settings.put({
    key: entriesKey(languageId),
    value: JSON.stringify(entries),
  })
}

export async function loadJournalPrompt(languageId: string): Promise<string | null> {
  const row = await db.settings.get(promptKey(languageId))
  const prompt = row?.value?.trim()
  return prompt || null
}

export async function saveJournalPrompt(languageId: string, prompt: string): Promise<void> {
  await db.settings.put({
    key: promptKey(languageId),
    value: prompt.trim(),
  })
}
