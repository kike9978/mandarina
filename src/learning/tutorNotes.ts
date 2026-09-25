import type { LanguageId } from '../data/languages'
import { db } from '../db/mandarinaDb'
import {
  MAX_STORED_TWEAKS,
  mergeNoteTweaks,
  sanitizeNoteTweaks,
} from './tutorPack'

function settingsKey(languageId: LanguageId): string {
  return `tutor-note-tweaks:${languageId}`
}

export async function loadNoteTweaks(languageId: LanguageId): Promise<string[]> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return []
  try {
    return sanitizeNoteTweaks(JSON.parse(row.value), MAX_STORED_TWEAKS)
  } catch {
    return []
  }
}

export async function saveNoteTweaks(
  languageId: LanguageId,
  tips: string[],
): Promise<string[]> {
  const clean = sanitizeNoteTweaks(tips, MAX_STORED_TWEAKS)
  await db.settings.put({
    key: settingsKey(languageId),
    value: JSON.stringify(clean),
  })
  return clean
}

export async function foldNoteTweaks(
  languageId: LanguageId,
  incoming: string[],
): Promise<string[]> {
  const next = mergeNoteTweaks(await loadNoteTweaks(languageId), incoming)
  return saveNoteTweaks(languageId, next)
}

export async function clearNoteTweaks(languageId: LanguageId): Promise<void> {
  await db.settings.delete(settingsKey(languageId))
}
