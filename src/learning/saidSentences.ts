import { db } from '../db/mandarinaDb'

function settingsKey(languageId: string): string {
  return `said-sentences:${languageId}`
}

export async function loadSaidSentences(languageId: string): Promise<string[]> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export async function rememberSaidSentence(
  languageId: string,
  sentence: string,
): Promise<void> {
  const line = sentence.trim()
  if (!line) return
  const existing = await loadSaidSentences(languageId)
  if (existing.includes(line)) return
  await db.settings.put({
    key: settingsKey(languageId),
    value: JSON.stringify([...existing, line]),
  })
}
