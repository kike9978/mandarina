import type { ComebackItem } from '../data/fixtures'
import type { Facet } from '../db/types'
import { db } from '../db/mandarinaDb'
import { languageLockLine } from './tutorPack'

export interface RetryTask {
  surface: string
  gloss: string
  reading?: string
  facet: Facet
}

const FACETS: Record<string, Facet> = {
  hear: 'listening',
  listening: 'listening',
  say: 'production',
  production: 'production',
  write: 'writing',
  writing: 'writing',
  meaning: 'recognition',
  recognition: 'recognition',
}

function settingsKey(languageId: string): string {
  return `retry-tasks:${languageId}`
}

export function buildRetryBrief(
  languageName: string,
  spots: { surface: string; skill: string }[],
): string {
  const lines = spots.length
    ? spots.map((spot) => `- ${spot.surface} (${spot.skill})`).join('\n')
    : '- none listed — keep the set small'
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(languageName)}

Turn these misses into at most three tasks. Tag each facet as hear, say, write, or meaning.
A write task asks them to produce the word, not to tap an English gloss.
${lines}

{"tasks":[{"surface","gloss","reading?","facet":"hear|say|write|meaning"}]}`
}

export function parseRetryPack(raw: string): { tasks: RetryTask[]; error?: string } {
  const text = raw.trim()
  if (!text) return { tasks: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { tasks: [], error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const tasksRaw = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as { tasks?: unknown }).tasks
    : undefined
  if (!Array.isArray(tasksRaw)) {
    return { tasks: [], error: 'That paste has no tasks. Nothing was imported.' }
  }
  const tasks: RetryTask[] = []
  for (const item of tasksRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const surface = typeof row.surface === 'string' ? row.surface.trim() : ''
    const gloss = typeof row.gloss === 'string' ? row.gloss.trim() : ''
    const facet = typeof row.facet === 'string' ? FACETS[row.facet.trim().toLowerCase()] : undefined
    if (!surface || !gloss || !facet) continue
    tasks.push({
      surface,
      gloss,
      reading: typeof row.reading === 'string' ? row.reading.trim() : undefined,
      facet,
    })
    if (tasks.length >= 3) break
  }
  if (!tasks.length) return { tasks: [], error: 'No playable tasks in that paste. Nothing was imported.' }
  return { tasks }
}

export function retryToComebacks(tasks: RetryTask[]): ComebackItem[] {
  return tasks.map((task, index) => ({
    itemKey: `retry:${index}:${task.surface}`,
    surface: task.surface,
    gloss: task.gloss,
    reading: task.reading,
    facet: task.facet,
  }))
}

export async function loadRetryTasks(languageId: string): Promise<RetryTask[]> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value) as unknown
    return Array.isArray(parsed) ? parseRetryPack(JSON.stringify({ tasks: parsed })).tasks : []
  } catch {
    return []
  }
}

export async function saveRetryTasks(languageId: string, tasks: RetryTask[]): Promise<void> {
  await db.settings.put({
    key: settingsKey(languageId),
    value: JSON.stringify(tasks.slice(0, 3)),
  })
}
