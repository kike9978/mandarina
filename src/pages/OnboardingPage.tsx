import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GOALS,
  LANGUAGES,
  orthographyLabel,
  scriptLevelsFor,
  type GoalId,
  type LanguageId,
  type ScriptFamiliarity,
} from '../data/languages'
import { useAppState } from '../state/AppState'
import { GuideBubble, PrimaryCta, SoftChoice } from '../components/ui'

type Step = 'language' | 'script' | 'goal' | 'ready'

export function OnboardingPage() {
  const { completeOnboarding } = useAppState()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('language')
  const [languageId, setLanguageId] = useState<LanguageId | null>(null)
  const [scriptFamiliarity, setScriptFamiliarity] =
    useState<ScriptFamiliarity>('new')
  const [goalId, setGoalId] = useState<GoalId>('daily')
  const [displayName, setDisplayName] = useState('Traveler')

  const lang = LANGUAGES.find((l) => l.id === languageId)
  const goal = GOALS.find((g) => g.id === goalId)!
  const levels = lang ? scriptLevelsFor(lang) : []
  const script = levels.find((s) => s.id === scriptFamiliarity)
  const ortho = lang ? orthographyLabel(lang) : ''
  const isLatin = lang?.orthographyMode === 'latin-sounds'

  function finish() {
    if (!languageId) return
    completeOnboarding({
      displayName: displayName.trim() || 'Traveler',
      languageId,
      scriptFamiliarity,
      goalId,
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="atmosphere-split flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <p className="font-display text-[1.55rem] font-bold tracking-wide sm:text-[1.7rem]">
          Mandarina
        </p>

        {step === 'language' && (
          <>
            <h1 className="text-[clamp(1.45rem,6vw,1.9rem)] leading-tight">
              What language are we learning?
            </h1>
            <GuideBubble name="Mikan">
              Pick any language you care about. Latin-letter languages stay
              phrase-first. A writing system you don&apos;t know yet gets a
              short warm-up first.
              {languageId === 'id' && (
                <>
                  {' '}
                  Indonesian uses the Latin letters you already know.
                </>
              )}
            </GuideBubble>
            <div className="grid gap-2">
              {LANGUAGES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setLanguageId(option.id)
                    setScriptFamiliarity('new')
                  }}
                  className={`grid gap-0.5 rounded-2xl border-[3px] border-ink bg-paper/95 px-3.5 py-3 text-left shadow-chunky-sm ${
                    languageId === option.id
                      ? 'outline outline-4 outline-cyan outline-offset-2'
                      : ''
                  }`}
                >
                  <strong className="text-lg">
                    {option.name}{' '}
                    <span className="text-ink-soft">· {option.nativeLabel}</span>
                  </strong>
                  <span className="text-sm font-bold text-ink-soft">
                    {option.orthographyMode === 'latin-sounds'
                      ? `Latin letters · ${option.scriptTrackTitle}`
                      : `Writing: ${option.writingSystem}`}
                  </span>
                </button>
              ))}
            </div>
            <PrimaryCta
              disabled={!languageId}
              onClick={() => setStep('script')}
            >
              Next
            </PrimaryCta>
          </>
        )}

        {step === 'script' && lang && script && (
          <>
            <h1 className="text-[clamp(1.45rem,6vw,1.9rem)] leading-tight">
              {isLatin
                ? `How new is ${lang.name} for you?`
                : 'How’s the writing system for you?'}
            </h1>
            <GuideBubble name={lang.guideName}>
              {isLatin ? (
                <>
                  You already know the alphabet. We only warm up{' '}
                  <strong>{lang.scriptTrackTitle.toLowerCase()}</strong> if you
                  want — then we jump into phrases.
                </>
              ) : (
                <>
                  For {lang.name}, we&apos;ll practice{' '}
                  <strong>{lang.scriptTrackTitle}</strong>
                  {scriptFamiliarity === 'comfortable'
                    ? ' as light reinforcement.'
                    : ' before we push hard on phrases.'}
                </>
              )}
            </GuideBubble>
            <div className="grid gap-2">
              {levels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setScriptFamiliarity(level.id)}
                  className={`grid gap-1 rounded-2xl border-[3px] border-ink bg-paper/95 px-3.5 py-3 text-left shadow-chunky-sm ${
                    scriptFamiliarity === level.id
                      ? 'outline outline-4 outline-cyan outline-offset-2'
                      : ''
                  }`}
                >
                  <strong>{level.title}</strong>
                  <span className="text-sm font-bold text-ink-soft">
                    {level.blurb}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="min-h-12 rounded-2xl border-[3px] border-ink bg-grid font-extrabold shadow-chunky"
                onClick={() => setStep('language')}
              >
                Back
              </button>
              <PrimaryCta onClick={() => setStep('goal')}>Next</PrimaryCta>
            </div>
          </>
        )}

        {step === 'goal' && lang && script && (
          <>
            <h1 className="text-[clamp(1.45rem,6vw,1.9rem)] leading-tight">
              What are you aiming for?
            </h1>
            <GuideBubble name={lang.guideName}>
              We&apos;ll remember this. Today&apos;s lesson is the same first sentence either way.
            </GuideBubble>
            <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
              <span>What should I call you?</span>
              <input
                className="min-h-11 rounded-xl border-[2.5px] border-ink bg-white px-3 py-3"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <div className="grid gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalId(g.id)}
                  className={`rounded-2xl border-[3px] border-ink bg-paper/95 px-3.5 py-3 text-left font-extrabold shadow-chunky-sm ${
                    goalId === g.id
                      ? 'outline outline-4 outline-cyan outline-offset-2'
                      : ''
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="min-h-12 rounded-2xl border-[3px] border-ink bg-grid font-extrabold shadow-chunky"
                onClick={() => setStep('script')}
              >
                Back
              </button>
              <PrimaryCta onClick={() => setStep('ready')}>Next</PrimaryCta>
            </div>
          </>
        )}

        {step === 'ready' && lang && script && (
          <>
            <h1 className="text-[clamp(1.45rem,6vw,1.9rem)] leading-tight">
              Ready for some thrilling interactive lessons?
            </h1>
            <GuideBubble name={lang.guideName}>
              {isLatin
                ? scriptFamiliarity === 'comfortable'
                  ? `Great — we'll lean into real ${lang!.name} phrases right away. Sounds practice stays optional.`
                  : `We'll keep ${lang!.name} phrase-first, with a light ${lang!.scriptTrackTitle.toLowerCase()} warm-up if you want it.`
                : scriptFamiliarity === 'new'
                  ? `We'll begin with ${lang!.scriptTrackTitle} so the marks feel friendly — then phrases.`
                  : scriptFamiliarity === 'some'
                    ? `We'll keep reinforcing ${lang!.writingSystem.toLowerCase()} while we build useful phrases.`
                    : `We'll still offer ${ortho.toLowerCase()} practice, but lean into real ${lang!.name}.`}
            </GuideBubble>
            <div className="grid gap-2">
              {[
                ['Language', `${lang!.name} · ${lang!.nativeLabel}`],
                [
                  isLatin ? 'Reading' : 'Writing',
                  `${lang!.writingSystem} · ${script!.title}`,
                ],
                ['Goal', goal.title],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-0.5 rounded-2xl border-[2.5px] border-ink bg-paper/90 p-3"
                >
                  <span className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-70">
                    {label}
                  </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <SoftChoice
              primaryLabel="Why not!"
              secondaryLabel="Nah… tweak it"
              onPrimary={finish}
              onSecondary={() => setStep('language')}
            />
          </>
        )}
      </div>
    </div>
  )
}
