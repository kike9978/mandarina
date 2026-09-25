import Dexie, { type EntityTable } from 'dexie'
import type {
  DbAbility,
  DbAttempt,
  DbContentPack,
  DbFsrsCard,
  DbItem,
  DbLearningSignal,
  DbListeningSource,
  DbProfile,
  DbSession,
  DbSetting,
  DbStash,
} from './types'

export class MandarinaDB extends Dexie {
  profiles!: EntityTable<DbProfile, 'id'>
  abilities!: EntityTable<DbAbility, 'id'>
  items!: EntityTable<DbItem, 'id'>
  fsrsCards!: EntityTable<DbFsrsCard, 'id'>
  sessions!: EntityTable<DbSession, 'id'>
  attempts!: EntityTable<DbAttempt, 'id'>
  signals!: EntityTable<DbLearningSignal, 'id'>
  stash!: EntityTable<DbStash, 'id'>
  packs!: EntityTable<DbContentPack, 'id'>
  settings!: EntityTable<DbSetting, 'key'>
  listeningSources!: EntityTable<DbListeningSource, 'id'>

  constructor() {
    super('mandarina')
    this.version(1).stores({
      profiles: 'id, languageId, lastActiveAt',
      abilities: 'id, languageId, status',
      items: 'id, languageId, unitId, source, surface',
      fsrsCards: 'id, itemId, facet, due',
      sessions: 'id, languageId, kind, startedAt',
      attempts: 'id, sessionId, itemId, createdAt',
      signals: 'id, itemId, createdAt',
      stash: 'id, languageId, createdAt',
      packs: 'id, importedAt',
      settings: 'key',
    })
    this.version(2).stores({
      items: 'id, languageId, unitId, source, surface, sourceId',
      stash: 'id, languageId, createdAt, sourceId',
      listeningSources: 'id, languageId, abilityId, status, createdAt',
    })
  }
}

export const db = new MandarinaDB()
