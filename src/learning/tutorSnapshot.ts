import { getPhraseUnit, hasPhraseUnit } from '../data/fixtures'
import {
  GOALS,
  languageById,
  scriptLevelsFor,
  type LanguageId,
} from '../data/languages'
import { db } from '../db/mandarinaDb'
import type { Ability, ListeningSource, StashedPhrase } from '../data/fixtures'
import { loadNoteTweaks } from './tutorNotes'
import {
  buildFindListenBrief,
  buildProcessWordsBrief,
  buildPullLinesBrief,
} from './listeningPack'
import { buildTutorBrief, type TutorBriefInput } from './tutorPack'

export function knownSurfacesFor(
  languageId: LanguageId,
  stash: StashedPhrase[],
): string[] {
  const unit = getPhraseUnit(languageId)
  return [
    ...(unit ? [unit.targetSentence, ...unit.items.map((i) => i.surface)] : []),
    ...stash.map((s) => s.surface),
  ]
}

export async function collectLearnerContext(input: {
  languageId: LanguageId
  scriptFamiliarity: 'new' | 'some' | 'comfortable'
  goalId: string
  abilities: Ability[]
  stash: StashedPhrase[]
}): Promise<TutorBriefInput & { stopTitle: string }> {
  const lang = languageById(input.languageId)
  const goal = GOALS.find((g) => g.id === input.goalId)?.title ?? 'Talk about daily life'
  const unit = getPhraseUnit(input.languageId)
  const familiarity =
    scriptLevelsFor(lang).find((l) => l.id === input.scriptFamiliarity)?.title ??
    input.scriptFamiliarity
  const latinSounds = lang.orthographyMode === 'latin-sounds'
  const scriptWarmupNeeded = latinSounds
    ? input.scriptFamiliarity === 'new'
    : input.scriptFamiliarity === 'new' || input.scriptFamiliarity === 'some'
  const phraseReady =
    hasPhraseUnit(input.languageId) &&
    (latinSounds || input.scriptFamiliarity !== 'new')

  const known = [
    ...(unit
      ? [
          {
            surface: unit.targetSentence,
            gloss: unit.targetGloss,
            exampleSentence: unit.targetSentence,
          },
          ...unit.items.map((i) => ({
            surface: i.surface,
            gloss: i.gloss,
            reading: i.reading,
            exampleSentence: unit.targetSentence,
          })),
        ]
      : []),
    ...input.stash.map((s) => ({
      surface: s.surface,
      gloss: s.gloss,
      reading: s.reading,
      exampleSentence: s.exampleSentence,
    })),
  ]

  const attempts = await db.attempts.orderBy('createdAt').reverse().limit(40).toArray()
  const weak: { surface: string; skill: string }[] = []
  const seen = new Set<string>()
  for (const a of attempts) {
    if (a.outcome !== 'fail' && a.outcome !== 'hint' && a.outcome !== 'reveal') {
      continue
    }
    if (!a.itemId) continue
    const item = await db.items.get(a.itemId)
    const surface = item?.surface
    if (!surface || seen.has(surface)) continue
    seen.add(surface)
    weak.push({ surface, skill: a.facet ?? 'recognition' })
    if (weak.length >= 6) break
  }

  return {
    languageName: lang.name,
    writingSystem: lang.writingSystem,
    scriptFamiliarity: familiarity,
    goalTitle: goal,
    phraseReady,
    scriptWarmupNeeded,
    latinSounds,
    abilities: input.abilities.map((a) => ({ title: a.title, status: a.status })),
    known,
    weakSpots: weak,
    coachTips: await loadNoteTweaks(input.languageId),
    stopTitle: unit?.title ?? 'Talk about today',
  }
}

export async function snapshotTutorBrief(input: {
  languageId: LanguageId
  scriptFamiliarity: 'new' | 'some' | 'comfortable'
  goalId: string
  abilities: Ability[]
  stash: StashedPhrase[]
}): Promise<string> {
  const ctx = await collectLearnerContext(input)
  return buildTutorBrief(ctx)
}

export async function snapshotFindListenBrief(input: {
  languageId: LanguageId
  scriptFamiliarity: 'new' | 'some' | 'comfortable'
  goalId: string
  abilities: Ability[]
  stash: StashedPhrase[]
  sources: ListeningSource[]
}): Promise<string> {
  const ctx = await collectLearnerContext(input)
  return buildFindListenBrief({
    ...ctx,
    sourcesAboard: input.sources.map((s) => s.title),
  })
}

export async function snapshotPullLinesBrief(input: {
  languageId: LanguageId
  scriptFamiliarity: 'new' | 'some' | 'comfortable'
  goalId: string
  abilities: Ability[]
  stash: StashedPhrase[]
  source: ListeningSource
}): Promise<string> {
  const ctx = await collectLearnerContext(input)
  return buildPullLinesBrief({
    ...ctx,
    sourceTitle: input.source.title,
    sourceCreator: input.source.creator,
    sourceSearch: input.source.search,
    sourceUrl: input.source.url,
    transcript: input.source.transcript,
  })
}

export async function snapshotProcessWordsBrief(input: {
  languageId: LanguageId
  scriptFamiliarity: 'new' | 'some' | 'comfortable'
  goalId: string
  abilities: Ability[]
  stash: StashedPhrase[]
  source: ListeningSource
}): Promise<string> {
  const ctx = await collectLearnerContext(input)
  const words = input.source.transcript?.trim()
  if (!words) {
    return buildPullLinesBrief({
      ...ctx,
      sourceTitle: input.source.title,
      sourceCreator: input.source.creator,
      sourceSearch: input.source.search,
      sourceUrl: input.source.url,
    })
  }
  return buildProcessWordsBrief({
    ...ctx,
    sourceTitle: input.source.title,
    sourceCreator: input.source.creator,
    sourceUrl: input.source.url,
    transcript: words,
  })
}
