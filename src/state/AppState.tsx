import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ACTIVITY_LABELS,
  SCRIPT_SESSION_STEPS,
  SESSION_STEPS,
  buildAbilities,
  getPhraseUnit,
  type Ability,
  type ActivityId,
  type PathStep,
  type PhraseUnit,
  type ScriptActivityId,
  type ScriptPathStep,
  type StashedPhrase,
} from '../data/fixtures'
import type {
  GoalId,
  LanguageId,
  ScriptFamiliarity,
} from '../data/languages'
import { languageById } from '../data/languages'
import { db } from '../db/mandarinaDb'
import { ensureSeeded, loadAbilitiesForProfile, setAbilityStatus, syncAbilitiesForProfile } from '../db/seed'
import type { AttemptOutcome, Facet } from '../db/types'
import {
  endDbSession,
  recordAttempt,
  startDbSession,
} from '../learning/attempts'
import {
  countDueFacets,
  ensureFsrsCard,
  listDueFacets,
} from '../learning/fsrsAdapter'
import {
  attachComebacks,
  composeJourneyOrder,
  decideDailyPlan,
  COMEBACK_CAP,
} from '../learning/orchestrator'
import {
  buildUnitFromStash,
  stashPracticeCap,
} from '../learning/templateBridge'

const LEGACY_KEY = 'mandarina-profile-v2'
const SESSION_SNAP_KEY = 'session-snap-v1'

const JOURNEY_ORDER: ActivityId[] = composeJourneyOrder('journey', false)

const STASH_LIGHT_ORDER: ActivityId[] = [
  'meet',
  'spot',
  'break',
  'turn',
  'boss',
  'clear',
]

const STASH_FACETS: Facet[] = [
  'recognition',
  'listening',
  'production',
  'writing',
  'contextualUse',
]

function pathFromOrder(order: ActivityId[], activeId: ActivityId): PathStep[] {
  const steps: PathStep[] = order
    .filter((id) => id !== 'clear')
    .map((id, i) => ({
      id,
      number: i + 1,
      label: ACTIVITY_LABELS[id] ?? id,
      state: 'locked' as const,
    }))
  return withProgress(steps, activeId)
}

type SessionKind = 'journey' | 'stash' | 'script' | 'comeback' | 'mixed'

interface SessionSnap {
  sessionId: string
  kind: SessionKind
  currentActivity: ActivityId
  activityOrder: ActivityId[]
  unit: PhraseUnit
  momentum: boolean
}

async function persistStashLearningItem(input: {
  languageId: string
  stashId: string
  surface: string
  gloss: string
  reading?: string
  exampleSentence?: string
  source: 'user' | 'import'
}): Promise<void> {
  const itemId = `${input.languageId}:user:${input.stashId}`
  await db.items.put({
    id: itemId,
    languageId: input.languageId,
    surface: input.surface,
    reading: input.reading,
    gloss: input.gloss,
    type: 'phrase',
    source: input.source,
    exampleSentence: input.exampleSentence,
  })
  for (const facet of STASH_FACETS) {
    await ensureFsrsCard(itemId, facet)
  }
}

export interface LearnerProfile {
  displayName: string
  languageId: LanguageId
  scriptFamiliarity: ScriptFamiliarity
  goalId: GoalId
  journeyDay: number
}

const defaultProfile: LearnerProfile = {
  displayName: 'Traveler',
  languageId: 'ja',
  scriptFamiliarity: 'new',
  goalId: 'daily',
  journeyDay: 1,
}

function withProgress<T extends { id: string; state: PathStep['state'] }>(
  steps: T[],
  activeId: string,
): T[] {
  const idx = steps.findIndex((s) => s.id === activeId)
  return steps.map((step, i) => {
    if (i < idx) return { ...step, state: 'completed' }
    if (i === idx) return { ...step, state: 'active' }
    if (i === idx + 1) return { ...step, state: 'available' }
    return { ...step, state: 'locked' }
  })
}

interface AppStateValue {
  ready: boolean
  onboarded: boolean
  profile: LearnerProfile
  dueCount: number
  lastActiveAt: string | null
  completeOnboarding: (profile: Omit<LearnerProfile, 'journeyDay'>) => void
  steps: PathStep[]
  scriptSteps: ScriptPathStep[]
  currentActivity: ActivityId
  currentScriptActivity: ScriptActivityId
  sessionStarted: boolean
  scriptSessionStarted: boolean
  sessionCleared: boolean
  scriptCleared: boolean
  momentum: boolean
  abilities: Ability[]
  stash: StashedPhrase[]
  needsScriptFirst: boolean
  activeUnit: PhraseUnit | null
  sessionKind: SessionKind | null
  startSession: () => void
  startStashSession: (stashIds?: string[]) => void
  startScriptSession: () => void
  advanceFrom: (id: ActivityId) => void
  advanceScriptFrom: (id: ScriptActivityId) => void
  resetSession: () => void
  resetScriptSession: () => void
  addStash: (phrase: Omit<StashedPhrase, 'id'>) => void
  importPhrases: (
    phrases: Omit<StashedPhrase, 'id'>[],
    meta?: { format?: 'json' | 'tsv' | 'paste'; name?: string },
  ) => void
  logAttempt: (input: {
    activityType: string
    itemKey?: string
    facet?: Facet
    outcome: AttemptOutcome
    hintsUsed?: number
  }) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [profile, setProfile] = useState<LearnerProfile>(defaultProfile)
  const [dueCount, setDueCount] = useState(0)
  const [lastActiveAt, setLastActiveAt] = useState<string | null>(null)
  const [steps, setSteps] = useState<PathStep[]>(SESSION_STEPS)
  const [scriptSteps, setScriptSteps] = useState<ScriptPathStep[]>(
    SCRIPT_SESSION_STEPS,
  )
  const [currentActivity, setCurrentActivity] = useState<ActivityId>('meet')
  const [currentScriptActivity, setCurrentScriptActivity] =
    useState<ScriptActivityId>('see')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [scriptSessionStarted, setScriptSessionStarted] = useState(false)
  const [sessionCleared, setSessionCleared] = useState(false)
  const [scriptCleared, setScriptCleared] = useState(false)
  const [momentum, setMomentum] = useState(false)
  const [abilities, setAbilities] = useState<Ability[]>(() =>
    buildAbilities(defaultProfile.languageId, defaultProfile.scriptFamiliarity),
  )
  const [stash, setStash] = useState<StashedPhrase[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeUnit, setActiveUnit] = useState<PhraseUnit | null>(null)
  const [sessionKind, setSessionKind] = useState<SessionKind | null>(null)
  const [activityOrder, setActivityOrder] =
    useState<ActivityId[]>(JOURNEY_ORDER)

  const clearSessionSnap = useCallback(async () => {
    await db.settings.delete(SESSION_SNAP_KEY)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureSeeded()
      const existing = await db.profiles.get('local')
      if (existing?.onboarded) {
        const p: LearnerProfile = {
          displayName: existing.displayName,
          languageId: existing.languageId as LanguageId,
          scriptFamiliarity: existing.scriptFamiliarity as ScriptFamiliarity,
          goalId: existing.goalId as GoalId,
          journeyDay: existing.journeyDay,
        }
        if (!cancelled) {
          setProfile(p)
          setOnboarded(true)
          setLastActiveAt(existing.lastActiveAt ?? null)
          setAbilities(
            await loadAbilitiesForProfile(p.languageId, p.scriptFamiliarity),
          )
          await syncAbilitiesForProfile(p.languageId, p.scriptFamiliarity)
          const rows = await db.stash
            .where('languageId')
            .equals(p.languageId)
            .toArray()
          setStash(
            rows.map((r) => ({
              id: r.id,
              surface: r.surface,
              gloss: r.gloss,
              reading: r.reading,
              exampleSentence: r.exampleSentence,
              abilityTag: r.abilityTag,
              source: r.source,
            })),
          )
          setDueCount(await countDueFacets(p.languageId))
        }
      } else {
        // One-time migrate from legacy localStorage profile
        try {
          const raw = localStorage.getItem(LEGACY_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as LearnerProfile
            const now = new Date().toISOString()
            await db.profiles.put({
              id: 'local',
              displayName: parsed.displayName,
              languageId: parsed.languageId,
              scriptFamiliarity: parsed.scriptFamiliarity,
              goalId: parsed.goalId,
              journeyDay: parsed.journeyDay ?? 1,
              createdAt: now,
              lastActiveAt: now,
              onboarded: true,
            })
            if (!cancelled) {
              setProfile({ ...defaultProfile, ...parsed })
              setOnboarded(true)
              setAbilities(
                await loadAbilitiesForProfile(
                  parsed.languageId,
                  parsed.scriptFamiliarity,
                ),
              )
              await syncAbilitiesForProfile(
                parsed.languageId,
                parsed.scriptFamiliarity,
              )
            }
            localStorage.removeItem(LEGACY_KEY)
          }
        } catch {
          /* ignore */
        }
      }

      // Resume mid-session after reload
      try {
        const snapRow = await db.settings.get(SESSION_SNAP_KEY)
        if (snapRow?.value && !cancelled) {
          const snap = JSON.parse(snapRow.value) as SessionSnap
          if (snap.unit && snap.activityOrder?.length && snap.sessionId) {
            setActiveUnit(snap.unit)
            setSessionKind(snap.kind)
            setActivityOrder(snap.activityOrder)
            setCurrentActivity(snap.currentActivity)
            setSteps(pathFromOrder(snap.activityOrder, snap.currentActivity))
            setActiveSessionId(snap.sessionId)
            setSessionStarted(true)
            setSessionCleared(false)
            setMomentum(Boolean(snap.momentum))
          }
        }
      } catch {
        /* ignore corrupt snap */
      }

      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const needsScriptFirst = (() => {
    const lang = languageById(profile.languageId)
    if (lang.orthographyMode === 'latin-sounds') {
      return profile.scriptFamiliarity === 'new'
    }
    return (
      profile.scriptFamiliarity === 'new' ||
      profile.scriptFamiliarity === 'some'
    )
  })()

  const completeOnboarding = useCallback(
    async (next: Omit<LearnerProfile, 'journeyDay'>) => {
      const full: LearnerProfile = { ...next, journeyDay: 1 }
      const now = new Date().toISOString()
      setProfile(full)
      setAbilities(
        await loadAbilitiesForProfile(full.languageId, full.scriptFamiliarity),
      )
      setOnboarded(true)
      await db.profiles.put({
        id: 'local',
        displayName: full.displayName,
        languageId: full.languageId,
        scriptFamiliarity: full.scriptFamiliarity,
        goalId: full.goalId,
        journeyDay: full.journeyDay,
        createdAt: now,
        lastActiveAt: now,
        onboarded: true,
      })
      await syncAbilitiesForProfile(full.languageId, full.scriptFamiliarity)
      setDueCount(await countDueFacets(full.languageId))
    },
    [],
  )

  const startSession = useCallback(async () => {
    const seed = getPhraseUnit(profile.languageId)
    if (!seed) return

    const dueRows = await listDueFacets(profile.languageId, COMEBACK_CAP)
    const plan = decideDailyPlan({
      needsScriptFirst: false,
      phraseReady: true,
      dueCount: dueRows.length,
      stashCount: stash.length,
      lastActiveAt,
    })
    const unit = attachComebacks(seed, dueRows)
    const hasComebacks = (unit.comebackItems?.length ?? 0) > 0
    const order = composeJourneyOrder(
      hasComebacks ? plan.kind : 'journey',
      hasComebacks,
    )
    const startActivity = order[0] === 'comeback' ? 'comeback' : 'meet'
    const kind: SessionKind = hasComebacks
      ? plan.kind === 'welcome_back'
        ? 'comeback'
        : 'mixed'
      : 'journey'

    setSessionStarted(true)
    setSessionCleared(false)
    setMomentum(false)
    setSessionKind(kind)
    setActiveUnit(unit)
    setActivityOrder(order)
    setCurrentActivity(startActivity)
    setSteps(pathFromOrder(order, startActivity))
    const sid = await startDbSession({
      languageId: profile.languageId,
      kind: hasComebacks ? 'mixed' : 'journey',
      unitId: unit.id,
    })
    setActiveSessionId(sid)
    await db.settings.put({
      key: SESSION_SNAP_KEY,
      value: JSON.stringify({
        sessionId: sid,
        kind,
        currentActivity: startActivity,
        activityOrder: order,
        unit,
        momentum: false,
      } satisfies SessionSnap),
    })
  }, [profile.languageId, stash.length, lastActiveAt])

  const startStashSession = useCallback(
    async (stashIds?: string[]) => {
      const pool = stashIds?.length
        ? stash.filter((s) => stashIds.includes(s.id))
        : [...stash].slice(-stashPracticeCap()).reverse()
      const unit = buildUnitFromStash(pool, profile.languageId)
      if (!unit) return

      const order =
        unit.productionReady === false ? STASH_LIGHT_ORDER : JOURNEY_ORDER
      setSessionStarted(true)
      setSessionCleared(false)
      setMomentum(false)
      setSessionKind('stash')
      setActiveUnit(unit)
      setActivityOrder(order)
      setCurrentActivity('meet')
      setSteps(pathFromOrder(order, 'meet'))
      const sid = await startDbSession({
        languageId: profile.languageId,
        kind: 'stash',
        unitId: unit.id,
      })
      setActiveSessionId(sid)
      await db.settings.put({
        key: SESSION_SNAP_KEY,
        value: JSON.stringify({
          sessionId: sid,
          kind: 'stash',
          currentActivity: 'meet',
          activityOrder: order,
          unit,
          momentum: false,
        } satisfies SessionSnap),
      })
    },
    [profile.languageId, stash],
  )

  const startScriptSession = useCallback(async () => {
    setScriptSessionStarted(true)
    setScriptCleared(false)
    setSessionKind('script')
    setCurrentScriptActivity('see')
    setScriptSteps(withProgress(SCRIPT_SESSION_STEPS, 'see'))
    const sid = await startDbSession({
      languageId: profile.languageId,
      kind: 'script',
    })
    setActiveSessionId(sid)
  }, [profile.languageId])

  const logAttempt = useCallback(
    (input: {
      activityType: string
      itemKey?: string
      facet?: Facet
      outcome: AttemptOutcome
      hintsUsed?: number
    }) => {
      if (!activeSessionId) return
      const itemId = input.itemKey
        ? `${profile.languageId}:${input.itemKey}`
        : undefined
      void recordAttempt({
        sessionId: activeSessionId,
        activityType: input.activityType,
        itemId,
        facet: input.facet,
        outcome: input.outcome,
        hintsUsed: input.hintsUsed,
      }).then(async () => {
        setDueCount(await countDueFacets(profile.languageId))
      })
    },
    [activeSessionId, profile.languageId],
  )

  const advanceFrom = useCallback(
    async (id: ActivityId) => {
      const next = activityOrder[activityOrder.indexOf(id) + 1]
      if (!next) return
      if (next === 'clear') {
        setSessionCleared(true)
        if (
          sessionKind === 'journey' ||
          sessionKind === 'mixed' ||
          sessionKind === 'comeback'
        ) {
          setAbilities((prev) =>
            prev.map((a) =>
              a.id === 'talk-today' ? { ...a, status: 'done' as const } : a,
            ),
          )
          await setAbilityStatus(profile.languageId, 'talk-today', 'done')
        }
        if (activeSessionId) await endDbSession(activeSessionId)
        const stamp = new Date().toISOString()
        const nextDay = profile.journeyDay + 1
        await db.profiles.update('local', {
          lastActiveAt: stamp,
          journeyDay: nextDay,
        })
        setLastActiveAt(stamp)
        setProfile((p) => ({ ...p, journeyDay: nextDay }))
        await clearSessionSnap()
        setDueCount(await countDueFacets(profile.languageId))
        return
      }
      setCurrentActivity(next)
      setSteps((prev) => withProgress(prev, next))
      if (next === 'build' || next === 'say') setMomentum(true)
      const mom = next === 'build' || next === 'say' ? true : momentum
      if (activeSessionId && activeUnit && sessionKind) {
        await db.settings.put({
          key: SESSION_SNAP_KEY,
          value: JSON.stringify({
            sessionId: activeSessionId,
            kind: sessionKind,
            currentActivity: next,
            activityOrder,
            unit: activeUnit,
            momentum: mom,
          } satisfies SessionSnap),
        })
      }
    },
    [
      activeSessionId,
      activityOrder,
      sessionKind,
      clearSessionSnap,
      profile.languageId,
      profile.journeyDay,
      activeUnit,
      momentum,
    ],
  )

  const advanceScriptFrom = useCallback(
    async (id: ScriptActivityId) => {
      const order: ScriptActivityId[] = [
        'see',
        'hear',
        'spot',
        'match',
        'trace',
        'use',
        'clear',
      ]
      const next = order[order.indexOf(id) + 1]
      if (!next) return
      if (next === 'clear') {
        setScriptCleared(true)
        setAbilities((prev) =>
          prev.map((a) =>
            a.id === 'script-basics' || a.id === 'script-reinforce'
              ? { ...a, status: a.id === 'script-basics' ? 'done' : 'partial' }
              : a.id === 'intro'
                ? { ...a, status: 'partial' }
                : a,
          ),
        )
        await setAbilityStatus(profile.languageId, 'script-basics', 'done')
        await setAbilityStatus(profile.languageId, 'script-reinforce', 'partial')
        await setAbilityStatus(profile.languageId, 'intro', 'partial')
        if (activeSessionId) await endDbSession(activeSessionId)
        const stamp = new Date().toISOString()
        const nextDay = profile.journeyDay + 1
        await db.profiles.update('local', {
          lastActiveAt: stamp,
          journeyDay: nextDay,
        })
        setLastActiveAt(stamp)
        setProfile((p) => ({ ...p, journeyDay: nextDay }))
        return
      }
      setCurrentScriptActivity(next)
      setScriptSteps((prev) => withProgress(prev, next))
    },
    [activeSessionId, profile.languageId, profile.journeyDay],
  )

  const resetSession = useCallback(() => {
    setSessionStarted(false)
    setSessionCleared(false)
    setMomentum(false)
    setCurrentActivity('meet')
    setSteps(SESSION_STEPS)
    setActiveSessionId(null)
    setActiveUnit(null)
    setSessionKind(null)
    setActivityOrder(JOURNEY_ORDER)
    void clearSessionSnap()
  }, [clearSessionSnap])

  const resetScriptSession = useCallback(() => {
    setScriptSessionStarted(false)
    setScriptCleared(false)
    setCurrentScriptActivity('see')
    setScriptSteps(SCRIPT_SESSION_STEPS)
    setActiveSessionId(null)
  }, [])

  const addStash = useCallback(
    async (phrase: Omit<StashedPhrase, 'id'>) => {
      const id = `stash-${Date.now()}`
      const row: StashedPhrase = {
        ...phrase,
        id,
        source: phrase.source ?? 'user',
      }
      setStash((prev) => [...prev, row])
      try {
        await db.stash.put({
          ...row,
          languageId: profile.languageId,
          createdAt: new Date().toISOString(),
        })
        await persistStashLearningItem({
          languageId: profile.languageId,
          stashId: id,
          surface: phrase.surface,
          gloss: phrase.gloss,
          reading: phrase.reading,
          exampleSentence: phrase.exampleSentence,
          source: phrase.source === 'import' ? 'import' : 'user',
        })
      } catch (err) {
        setStash((prev) => prev.filter((s) => s.id !== id))
        throw err
      }
    },
    [profile.languageId],
  )

  const importPhrases = useCallback(
    async (
      phrases: Omit<StashedPhrase, 'id'>[],
      meta?: { format?: 'json' | 'tsv' | 'paste'; name?: string },
    ) => {
      const stamped = phrases.map((p, i) => ({
        ...p,
        id: `import-${Date.now()}-${i}`,
        source: p.source ?? ('import' as const),
      }))
      setStash((prev) => [...prev, ...stamped])
      await db.stash.bulkPut(
        stamped.map((row) => ({
          ...row,
          languageId: profile.languageId,
          createdAt: new Date().toISOString(),
        })),
      )
      for (const row of stamped) {
        await persistStashLearningItem({
          languageId: profile.languageId,
          stashId: row.id,
          surface: row.surface,
          gloss: row.gloss,
          reading: row.reading,
          exampleSentence: row.exampleSentence,
          source: 'import',
        })
      }
      await db.packs.add({
        id: `pack-${Date.now()}`,
        name: meta?.name ?? 'Imported pack',
        importedAt: new Date().toISOString(),
        itemCount: stamped.length,
        format: meta?.format ?? 'json',
      })
    },
    [profile.languageId],
  )

  const value = useMemo(
    () => ({
      ready,
      onboarded,
      profile,
      dueCount,
      lastActiveAt,
      completeOnboarding,
      steps,
      scriptSteps,
      currentActivity,
      currentScriptActivity,
      sessionStarted,
      scriptSessionStarted,
      sessionCleared,
      scriptCleared,
      momentum,
      abilities,
      stash,
      needsScriptFirst,
      activeUnit,
      sessionKind,
      startSession,
      startStashSession,
      startScriptSession,
      advanceFrom,
      advanceScriptFrom,
      resetSession,
      resetScriptSession,
      addStash,
      importPhrases,
      logAttempt,
    }),
    [
      ready,
      onboarded,
      profile,
      dueCount,
      lastActiveAt,
      completeOnboarding,
      steps,
      scriptSteps,
      currentActivity,
      currentScriptActivity,
      sessionStarted,
      scriptSessionStarted,
      sessionCleared,
      scriptCleared,
      momentum,
      abilities,
      stash,
      needsScriptFirst,
      activeUnit,
      sessionKind,
      startSession,
      startStashSession,
      startScriptSession,
      advanceFrom,
      advanceScriptFrom,
      resetSession,
      resetScriptSession,
      addStash,
      importPhrases,
      logAttempt,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}

export function useGuideName() {
  const { profile } = useAppState()
  return languageById(profile.languageId).guideName
}
