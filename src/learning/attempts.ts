import { db } from '../db/mandarinaDb'
import type { AttemptOutcome, Facet } from '../db/types'
import { rateFacet } from './fsrsAdapter'

export async function startDbSession(input: {
  languageId: string
  kind: 'journey' | 'script' | 'stash' | 'comeback' | 'mixed'
  unitId?: string
}): Promise<string> {
  const id = `sess-${Date.now()}`
  await db.sessions.add({
    id,
    startedAt: new Date().toISOString(),
    languageId: input.languageId,
    kind: input.kind,
    unitId: input.unitId,
  })
  return id
}

export async function endDbSession(sessionId: string): Promise<void> {
  await db.sessions.update(sessionId, { endedAt: new Date().toISOString() })
}

export async function recordAttempt(input: {
  sessionId: string
  activityType: string
  itemId?: string
  facet?: Facet
  outcome: AttemptOutcome
  hintsUsed?: number
  payload?: Record<string, unknown>
}): Promise<void> {
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await db.attempts.add({
    id,
    sessionId: input.sessionId,
    activityType: input.activityType,
    itemId: input.itemId,
    facet: input.facet,
    outcome: input.outcome,
    hintsUsed: input.hintsUsed ?? 0,
    createdAt: new Date().toISOString(),
    payload: input.payload ? JSON.stringify(input.payload) : undefined,
  })

  if (input.itemId && input.facet) {
    await rateFacet(input.itemId, input.facet, input.outcome)
    if (input.outcome === 'fail' || input.outcome === 'reveal') {
      await db.signals.add({
        id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: 'attempt',
        itemId: input.itemId,
        facet: input.facet,
        strength: input.outcome === 'reveal' ? 2 : 1,
        createdAt: new Date().toISOString(),
      })
    }
  }
}
