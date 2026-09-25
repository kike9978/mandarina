import { readingSpans } from './readingAid'

export interface JournalWord {
  surface: string
  reading?: string
  gloss: string
}

/** Words the journal may show. A kanji, hanzi, or beginner Arabic word without its aid is left out. */
export function journalWords(
  languageId: string,
  words: JournalWord[],
): JournalWord[] {
  const seen = new Set<string>()
  const kept: JournalWord[] = []
  for (const word of words) {
    const surface = word.surface.trim()
    if (!surface || seen.has(surface)) continue
    if (!readingSpans(languageId, surface, word.reading)) continue
    seen.add(surface)
    kept.push({ ...word, surface })
  }
  return kept
}
