import Fuse from 'fuse.js'
import { DICTIONARY_SUBSET, type DictEntry } from '../data/fixtures'

const fuse = new Fuse(DICTIONARY_SUBSET, {
  keys: ['surface', 'reading', 'gloss'],
  threshold: 0.35,
  ignoreLocation: true,
})

export function searchDictionary(query: string): DictEntry[] {
  const q = query.trim()
  if (!q) return []
  return fuse.search(q).map((r) => r.item)
}
