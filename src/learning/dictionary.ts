import Fuse from 'fuse.js'
import { DICTIONARY_BY_LANGUAGE, type DictEntry } from '../data/fixtures'
import type { LanguageId } from '../data/languages'

const fuses = new Map<LanguageId, Fuse<DictEntry>>()

function fuseFor(languageId: LanguageId): Fuse<DictEntry> {
  const existing = fuses.get(languageId)
  if (existing) return existing
  const fuse = new Fuse(DICTIONARY_BY_LANGUAGE[languageId], {
    keys: ['surface', 'reading', 'gloss'],
    threshold: 0.35,
    ignoreLocation: true,
  })
  fuses.set(languageId, fuse)
  return fuse
}

export function searchDictionary(query: string, languageId: LanguageId): DictEntry[] {
  const q = query.trim()
  if (!q) return []
  return fuseFor(languageId).search(q).map((r) => r.item)
}
