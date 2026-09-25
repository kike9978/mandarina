import { BookmarkPlus, MessageCircle, Pencil, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasPhraseUnit } from '../data/fixtures'
import { languageById, orthographyLabel } from '../data/languages'
import { decideDailyPlan } from '../learning/orchestrator'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta } from '../components/ui'

export function PracticePage() {
  const navigate = useNavigate()
  const {
    startSession,
    startScriptSession,
    startStashSession,
    startBossSession,
    bossReady,
    profile,
    needsScriptFirst,
    dueCount,
    writingDueCount,
    lastActiveAt,
    stash,
    sessionStarted,
    sessionCleared,
    scriptCleared,
    abilities,
    activeUnit,
  } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const isLatin = lang.orthographyMode === 'latin-sounds'
  const phraseReady =
    hasPhraseUnit(profile.languageId) &&
    (isLatin || profile.scriptFamiliarity !== 'new')
  const scriptDone =
    scriptCleared || abilities.find((a) => a.id === 'script-basics')?.status === 'done'
  const ortho = orthographyLabel(lang)
  const canResume = sessionStarted && !!activeUnit && !sessionCleared

  const plan = useMemo(
    () =>
      decideDailyPlan({
        needsScriptFirst: needsScriptFirst && !scriptDone,
        scriptOptional: isLatin,
        phraseReady,
        dueCount,
        stashCount: stash.length,
        lastActiveAt,
        writingDue: writingDueCount,
        bossReady,
        writingNoun: isLatin ? 'spellings' : 'characters',
      }),
    [
      needsScriptFirst,
      scriptDone,
      isLatin,
      phraseReady,
      dueCount,
      writingDueCount,
      stash.length,
      lastActiveAt,
      bossReady,
    ],
  )

  const launchPhrase = () => {
    if (canResume) {
      navigate('/session')
      return
    }
    startSession()
    navigate('/session')
  }

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Practice
        </p>
        <h1>I&apos;ll pick the next move</h1>
        <GuideBubble name={guideName}>
          {canResume
            ? 'You left mid-path — resume first. No menu maze.'
            : plan.kind === 'comeback' || plan.kind === 'welcome_back'
              ? plan.body
              : isLatin
                ? `Phrase practice leads. ${ortho} is optional reinforcement for ${lang.name} — not a second foreign alphabet to conquer.`
                : `No Vocab / Grammar / Speaking menu maze — but we do carve out ${ortho.toLowerCase()} practice when the script is new.`}
        </GuideBubble>

        <PrimaryCta disabled={!phraseReady && !canResume} onClick={launchPhrase}>
          {canResume
            ? 'Resume your path'
            : plan.kind === 'welcome_back'
              ? 'Ease back in'
              : plan.kind === 'comeback'
                ? 'Start — with a couple of comebacks'
                : phraseReady
                  ? 'Start a phrase session'
                  : 'Phrase session after script comfort'}
        </PrimaryCta>

        {dueCount > 0 && (
          <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
            {plan.softComeback ?? `Let’s bring a few things back · ${Math.min(dueCount, 3)}`}
          </p>
        )}
        {plan.softWriting && (
          <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Pencil size={16} strokeWidth={2.25} aria-hidden />
            {plan.softWriting}
          </p>
        )}

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper px-4 py-4 text-left shadow-chunky"
          onClick={() => {
            startScriptSession()
            navigate('/script')
          }}
        >
          <Pencil className="size-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="grid gap-0.5">
            <strong className="text-lg">{ortho}</strong>
            <span className="text-sm font-bold text-ink-soft">
              {lang.scriptTrackTitle} · see → practice → use
            </span>
          </span>
        </button>

        {bossReady && (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper px-4 py-4 text-left shadow-chunky"
            onClick={() => {
              startBossSession()
              navigate('/session')
            }}
          >
            <MessageCircle className="size-6 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="grid gap-0.5">
              <strong className="text-lg">1 conversation milestone</strong>
              <span className="text-sm font-bold text-ink-soft">
                Use what you already have in a tiny scene
              </span>
            </span>
          </button>
        )}

        {stash.length > 0 && (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper px-4 py-4 text-left shadow-chunky"
            onClick={() => {
              startStashSession()
              navigate('/session')
            }}
          >
            <BookmarkPlus className="size-6 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="grid gap-0.5">
              <strong className="text-lg">Practice your stash</strong>
              <span className="text-sm font-bold text-ink-soft">
                {stash.length} phrase{stash.length === 1 ? '' : 's'} · same playful path
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
