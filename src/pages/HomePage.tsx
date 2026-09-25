import {
  BookmarkPlus,
  MessageCircle,
  Pencil,
  RotateCcw,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPhraseUnit, hasPhraseUnit, HOME_SOFT } from '../data/fixtures'
import { languageById, orthographyLabel } from '../data/languages'
import { decideDailyPlan } from '../learning/orchestrator'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta } from '../components/ui'

export function HomePage() {
  const navigate = useNavigate()
  const {
    startSession,
    startScriptSession,
    sessionCleared,
    scriptCleared,
    sessionStarted,
    abilities,
    profile,
    needsScriptFirst,
    dueCount,
    lastActiveAt,
    stash,
    activeUnit,
  } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const unit = getPhraseUnit(profile.languageId)
  const focusAbility = abilities.find((a) => a.id === 'talk-today')
  const scriptAbility = abilities.find((a) => a.id === 'script-basics')
  const isLatin = lang.orthographyMode === 'latin-sounds'
  const phraseReady =
    hasPhraseUnit(profile.languageId) &&
    (isLatin || profile.scriptFamiliarity !== 'new')
  const scriptDone =
    scriptCleared || scriptAbility?.status === 'done'
  const ortho = orthographyLabel(lang)
  const canResume =
    sessionStarted && !!activeUnit && !sessionCleared

  const plan = useMemo(
    () =>
      decideDailyPlan({
        needsScriptFirst: needsScriptFirst && !scriptDone,
        phraseReady,
        dueCount,
        stashCount: stash.length,
        lastActiveAt,
      }),
    [
      needsScriptFirst,
      scriptDone,
      phraseReady,
      dueCount,
      stash.length,
      lastActiveAt,
    ],
  )

  const launchPlan = () => {
    if (canResume) {
      navigate('/session')
      return
    }
    if (plan.route === '/script') {
      startScriptSession()
      navigate('/script')
      return
    }
    if (plan.route === '/stash') {
      navigate('/stash')
      return
    }
    startSession()
    navigate('/session')
  }

  return (
    <div className="atmosphere-split flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <header className="animate-pop-in grid gap-1">
          <p className="font-display text-[1.55rem] font-bold tracking-wide sm:text-[1.7rem]">
            Mandarina
          </p>
          <p className="font-display text-[1.55rem] font-semibold sm:text-[1.7rem]">
            Good day, {profile.displayName}
          </p>
          <p className="font-bold text-ink-soft">
            {lang.name} · {profile.journeyDay} day journey
          </p>
        </header>

        {phraseReady && unit && plan.kind !== 'script' && (
          <section className="animate-pop-in grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper/95 px-4 py-[18px] shadow-chunky">
            <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
              Today
            </p>
            <h1 className="text-[1.45rem] sm:text-[1.55rem]">
              {canResume ? 'Resume your lesson' : plan.headline}
            </h1>
            <p className="leading-snug font-bold">
              {canResume
                ? 'You left mid-path — pick up right where you paused.'
                : plan.kind === 'welcome_back' || plan.kind === 'comeback'
                  ? plan.body
                  : unit.focusWhy}
            </p>
            <p className="text-[0.92rem] font-bold text-ink-soft">
              {unit.estimatedMinutes} min ·{' '}
              {activeUnit?.activityCount ?? unit.activityCount} activities
              {sessionCleared || focusAbility?.status === 'done'
                ? ' · checkpoint cleared'
                : ''}
            </p>
            <GuideBubble name={guideName}>
              {canResume
                ? 'No restart needed — your path is waiting.'
                : plan.kind === 'welcome_back'
                  ? 'Missed you — we’ll keep it gentle today.'
                  : `You're learning to say what you're doing today in ${lang.name}. Ready when you are!`}
            </GuideBubble>
            <PrimaryCta onClick={launchPlan}>
              {canResume ? 'Resume' : plan.ctaLabel}
            </PrimaryCta>
          </section>
        )}

        {!phraseReady && (
          <section className="animate-pop-in grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper/95 px-4 py-[18px] shadow-chunky">
            <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
              Today
            </p>
            <h1 className="text-[1.45rem] sm:text-[1.55rem]">{plan.headline}</h1>
            <p className="leading-snug font-bold">
              {hasPhraseUnit(profile.languageId)
                ? plan.body
                : `${lang.name} phrase units are expanding — sounds practice is ready now.`}
            </p>
            <GuideBubble name={guideName}>
              {needsScriptFirst
                ? `Do the ${ortho.toLowerCase()} warm-up below — then we bridge into real phrases.`
                : 'Phrase content for this language is next; keep skills warm meanwhile.'}
            </GuideBubble>
            {(plan.kind === 'script' || plan.kind === 'stash') && (
              <PrimaryCta onClick={launchPlan}>{plan.ctaLabel}</PrimaryCta>
            )}
          </section>
        )}

        {needsScriptFirst && !scriptDone && (
          <section className="animate-pop-in grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper/95 px-4 py-[18px] shadow-chunky">
            <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
              {isLatin ? 'Optional warm-up' : 'Start here'}
            </p>
            <h1 className="text-[1.45rem] sm:text-[1.55rem]">
              {isLatin ? lang.scriptTrackTitle : 'Writing system warm-up'}
            </h1>
            <p className="leading-snug font-bold">
              {lang.scriptTrackTitle} — see, hear, spot, match, practice, use.
            </p>
            <p className="text-[0.92rem] font-bold text-ink-soft">
              ~8 min · 6 activities
            </p>
            <GuideBubble name={guideName}>
              {isLatin
                ? `Same letters you know — we'll just lock in ${lang.name} sounds like ng / ny so phrases feel natural.`
                : `We won't pretend you already know ${lang.writingSystem}. Let's make the marks feel friendly.`}
            </GuideBubble>
            <PrimaryCta
              onClick={() => {
                startScriptSession()
                navigate('/script')
              }}
            >
              {isLatin ? 'Warm up sounds' : 'Practice the writing system'}
            </PrimaryCta>
          </section>
        )}

        <ul className="m-0 grid list-none gap-2 p-0">
          <li>
            <button
              type="button"
              className="flex w-full min-h-11 items-center gap-2.5 rounded-2xl border-2 border-ink/35 bg-paper/75 px-3 py-2.5 text-left font-bold"
              onClick={() => {
                startScriptSession()
                navigate('/script')
              }}
            >
              <Pencil size={18} strokeWidth={2.25} aria-hidden />
              <span>
                {isLatin ? HOME_SOFT.script : HOME_SOFT.scriptNew}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full min-h-11 items-center gap-2.5 rounded-2xl border-2 border-ink/35 bg-paper/75 px-3 py-2.5 text-left font-bold"
              onClick={() => {
                if (phraseReady) {
                  if (canResume) navigate('/session')
                  else {
                    startSession()
                    navigate('/session')
                  }
                }
              }}
            >
              <RotateCcw size={18} strokeWidth={2.25} aria-hidden />
              <span>
                {plan.softComeback ??
                  (dueCount > 0
                    ? `Let's bring a few things back · ${Math.min(dueCount, 5)}`
                    : HOME_SOFT.comeback)}
              </span>
            </button>
          </li>
          <li className="flex min-h-11 items-center gap-2.5 rounded-2xl border-2 border-ink/35 bg-paper/75 px-3 py-2.5 font-bold">
            <MessageCircle size={18} strokeWidth={2.25} aria-hidden />
            <span>{HOME_SOFT.milestone}</span>
          </li>
          <li>
            <Link
              to="/stash"
              className="flex min-h-11 items-center gap-2.5 rounded-2xl border-2 border-ink/35 bg-paper/75 px-3 py-2.5 font-bold no-underline"
            >
              <BookmarkPlus size={18} strokeWidth={2.25} aria-hidden />
              <span>Stash something new</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
