import { createEmptyCard, type Card } from 'ts-fsrs'
import { PHRASE_UNITS, SCRIPT_SESSION_STEPS, buildAbilities, type Ability } from '../data/fixtures'
import { LANGUAGES, SCRIPT_GLYPHS, type LanguageId } from '../data/languages'
import { db } from './mandarinaDb'
import type { DbFsrsCard, DbItem, Facet } from './types'

const FACETS: Facet[] = [
  'recognition',
  'listening',
  'production',
  'writing',
  'contextualUse',
]

function cardRow(itemId: string, facet: Facet): DbFsrsCard {
  const empty = createEmptyCard(new Date())
  return {
    id: `${itemId}:${facet}`,
    itemId,
    facet,
    due: empty.due.toISOString(),
    fsrsState: JSON.stringify(empty),
    masteryHint: 0,
  }
}

export async function ensureSeeded(): Promise<void> {
  const flag = await db.settings.get('seeded-v1')
  if (flag?.value === '1') return

  const items: DbItem[] = []
  const cards: DbFsrsCard[] = []

  for (const lang of LANGUAGES) {
    const unit = PHRASE_UNITS[lang.id as LanguageId]
    if (unit) {
      for (const it of unit.items) {
        const id = `${lang.id}:phrase:${it.id}`
        items.push({
          id,
          languageId: lang.id,
          unitId: unit.id,
          surface: it.surface,
          reading: it.reading,
          gloss: it.gloss,
          type: 'word',
          source: 'seed',
          exampleSentence: unit.targetSentence,
          abilityId: unit.abilityId,
        })
        for (const facet of FACETS) cards.push(cardRow(id, facet))
      }
    }

    for (const g of SCRIPT_GLYPHS[lang.id as LanguageId] ?? []) {
      const id = `${lang.id}:script:${g.id}`
      items.push({
        id,
        languageId: lang.id,
        surface: g.glyph,
        reading: g.reading,
        gloss: g.hint,
        type: 'sound',
        source: 'seed',
        abilityId: 'script-basics',
      })
      for (const facet of ['recognition', 'listening', 'writing'] as Facet[]) {
        cards.push(cardRow(id, facet))
      }
    }
  }

  // Touch SCRIPT_SESSION_STEPS so tree-shaking keeps labels available for UI
  void SCRIPT_SESSION_STEPS.length

  await db.transaction('rw', db.items, db.fsrsCards, db.settings, async () => {
    await db.items.bulkPut(items)
    await db.fsrsCards.bulkPut(cards)
    await db.settings.put({ key: 'seeded-v1', value: '1' })
  })
}

export async function syncAbilitiesForProfile(
  languageId: LanguageId,
  scriptFamiliarity: string,
): Promise<void> {
  const built = buildAbilities(
    languageId,
    scriptFamiliarity as 'new' | 'some' | 'comfortable',
  )
  const existing = await db.abilities
    .where('languageId')
    .equals(languageId)
    .toArray()
  const byId = new Map(existing.map((r) => [r.id, r]))

  await db.abilities.bulkPut(
    built.map((a, i) => {
      const id = `${languageId}:${a.id}`
      const prev = byId.get(id)
      return {
        id,
        languageId,
        title: a.title,
        sortOrder: i,
        // Keep learner unlocks across reloads / re-seeds
        status: prev?.status ?? a.status,
        kind: a.kind ?? 'speak',
        source: 'seed' as const,
      }
    }),
  )
}

/** Merge seed shape with persisted status from Dexie. */
export async function loadAbilitiesForProfile(
  languageId: LanguageId,
  scriptFamiliarity: string,
): Promise<Ability[]> {
  await syncAbilitiesForProfile(languageId, scriptFamiliarity)
  const built = buildAbilities(
    languageId,
    scriptFamiliarity as 'new' | 'some' | 'comfortable',
  )
  const rows = await db.abilities
    .where('languageId')
    .equals(languageId)
    .toArray()
  const byShort = new Map(
    rows.map((r) => [r.id.slice(languageId.length + 1), r]),
  )
  return built.map((a) => ({
    ...a,
    status: byShort.get(a.id)?.status ?? a.status,
  }))
}

export async function setAbilityStatus(
  languageId: LanguageId,
  abilityId: string,
  status: Ability['status'],
): Promise<void> {
  const id = `${languageId}:${abilityId}`
  const existing = await db.abilities.get(id)
  if (existing) {
    await db.abilities.update(id, { status })
    return
  }
  await db.abilities.put({
    id,
    languageId,
    title: abilityId,
    sortOrder: 99,
    status,
    kind: 'speak',
    source: 'seed',
  })
}

export function parseCard(json: string): Card {
  const raw = JSON.parse(json) as Card
  return {
    ...raw,
    due: new Date(raw.due),
    last_review: raw.last_review ? new Date(raw.last_review) : undefined,
  }
}
