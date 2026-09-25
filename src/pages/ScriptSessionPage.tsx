import { Check, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SCRIPT_GLYPHS, languageById } from '../data/languages'
import { speakText, ttsLangFor } from '../learning/tts'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta } from '../components/ui'
import {
  SessionChrome,
  SoftFeedback,
} from '../components/SessionBits'
import { WriteCanvas } from '../components/WriteCanvas'

export function ScriptSessionPage() {
  const navigate = useNavigate()
  const {
    scriptSteps,
    currentScriptActivity,
    advanceScriptFrom,
    scriptCleared,
    profile,
  } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const glyphs = SCRIPT_GLYPHS[profile.languageId]
  const focus = glyphs[0]

  const stepMeta = scriptSteps.find((s) => s.id === currentScriptActivity)
  const stepNumber = stepMeta?.number ?? 1

  useEffect(() => {
    if (scriptCleared) navigate('/script-clear', { replace: true })
  }, [scriptCleared, navigate])

  if (scriptCleared) return null

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <SessionChrome
        stepLabel={stepMeta?.label ?? 'See It'}
        stepNumber={stepNumber}
        stepTotal={6}
        onBack={() => navigate('/')}
      />
      <div className="page-pad pt-2">
        <p className="text-sm font-extrabold text-ink-soft">
          {lang.scriptTrackTitle}
        </p>
        {currentScriptActivity === 'see' && (
          <SeeIt
            glyph={focus.glyph}
            reading={focus.reading}
            hint={focus.hint}
            guideName={guideName}
            onNext={() => advanceScriptFrom('see')}
          />
        )}
        {currentScriptActivity === 'hear' && (
          <HearIt
            glyph={focus.glyph}
            reading={focus.reading}
            glyphId={focus.id}
            languageId={profile.languageId}
            guideName={guideName}
            onNext={() => advanceScriptFrom('hear')}
          />
        )}
        {currentScriptActivity === 'spot' && (
          <SpotGlyph
            glyphs={glyphs}
            targetId={focus.id}
            guideName={guideName}
            onNext={() => advanceScriptFrom('spot')}
          />
        )}
        {currentScriptActivity === 'match' && (
          <MatchGlyph
            glyph={focus.glyph}
            reading={focus.reading}
            glyphId={focus.id}
            decoys={glyphs.slice(1, 4).map((g) => g.reading)}
            guideName={guideName}
            onNext={() => advanceScriptFrom('match')}
          />
        )}
        {currentScriptActivity === 'trace' && (
          <TraceIt
            glyph={focus.glyph}
            glyphId={focus.id}
            guideName={guideName}
            onNext={() => advanceScriptFrom('trace')}
          />
        )}
        {currentScriptActivity === 'use' && (
          <UseIt
            glyph={focus.glyph}
            reading={focus.reading}
            glyphId={focus.id}
            guideName={guideName}
            onNext={() => advanceScriptFrom('use')}
          />
        )}
      </div>
    </div>
  )
}

function Shell({
  eyebrow,
  children,
}: {
  eyebrow: string
  children: ReactNode
}) {
  return (
    <div className="animate-pop-in grid gap-3.5">
      <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
        {eyebrow}
      </p>
      {children}
    </div>
  )
}

function GlyphHero({ glyph }: { glyph: string }) {
  return (
    <div className="grid place-items-center rounded-[22px] border-4 border-orange bg-paper py-10 shadow-chunky">
      <span className="font-display text-7xl font-bold leading-none">{glyph}</span>
    </div>
  )
}

function SeeIt({
  glyph,
  reading,
  hint,
  guideName,
  onNext,
}: {
  glyph: string
  reading: string
  hint: string
  guideName: string
  onNext: () => void
}) {
  return (
    <Shell eyebrow="See It">
      <GuideBubble name={guideName}>
        Meet this mark. No quiz yet — just look and notice the shape.
      </GuideBubble>
      <GlyphHero glyph={glyph} />
      <p className="text-center text-lg font-extrabold">
        Reading: <span className="text-cyan-deep">{reading}</span>
      </p>
      <p className="text-center font-bold text-ink-soft">{hint}</p>
      <PrimaryCta onClick={onNext}>Got it — Hear It</PrimaryCta>
    </Shell>
  )
}

function HearIt({
  glyph,
  reading,
  glyphId,
  languageId,
  guideName,
  onNext,
}: {
  glyph: string
  reading: string
  glyphId: string
  languageId: string
  guideName: string
  onNext: () => void
}) {
  const { logAttempt } = useAppState()

  return (
    <Shell eyebrow="Hear It">
      <GuideBubble name={guideName}>
        Sound and shape together. Tap play whenever you want a reminder.
      </GuideBubble>
      <GlyphHero glyph={glyph} />
      <button
        type="button"
        className="inline-flex w-fit min-h-11 items-center gap-2 rounded-full border-[2.5px] border-ink bg-paper px-3.5 py-2 font-extrabold"
        aria-label={`Play sound for ${reading}`}
        onClick={() => speakText(reading, ttsLangFor(languageId))}
      >
        <Volume2 strokeWidth={2.25} />
        Play “{reading}”
      </button>
      <PrimaryCta
        onClick={() => {
          logAttempt({
            activityType: 'hear',
            itemKey: `script:${glyphId}`,
            facet: 'listening',
            outcome: 'success',
          })
          onNext()
        }}
      >
        Spot It among friends
      </PrimaryCta>
    </Shell>
  )
}

function SpotGlyph({
  glyphs,
  targetId,
  guideName,
  onNext,
}: {
  glyphs: { id: string; glyph: string }[]
  targetId: string
  guideName: string
  onNext: () => void
}) {
  const { logAttempt } = useAppState()
  const [picked, setPicked] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const target = glyphs.find((g) => g.id === targetId)!
  const options = useMemo(() => {
    const mix = [...glyphs].sort(() => Math.random() - 0.5).slice(0, 4)
    if (!mix.find((g) => g.id === targetId)) mix[0] = target
    return mix.sort(() => Math.random() - 0.5)
  }, [glyphs, target, targetId])

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    logAttempt({
      activityType: 'spot',
      itemKey: `script:${targetId}`,
      facet: 'recognition',
      outcome,
      hintsUsed,
    })
  }

  return (
    <Shell eyebrow="Spot It">
      <GuideBubble name={guideName}>
        Find <strong>{target.glyph}</strong> in the lineup.
      </GuideBubble>
      <div className="grid grid-cols-2 gap-2">
        {options.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`grid min-h-20 place-items-center rounded-2xl border-[3px] border-ink bg-paper text-4xl font-bold shadow-chunky ${
              picked === g.id ? 'outline outline-4 outline-cyan' : ''
            }`}
            onClick={() => {
              setPicked(g.id)
              const wrong = g.id !== targetId
              setFailed(wrong)
              if (wrong) log('fail')
            }}
          >
            {g.glyph}
            {picked === g.id && g.id === targetId && (
              <Check className="mt-1 size-4" strokeWidth={2.5} aria-hidden />
            )}
          </button>
        ))}
      </div>
      {failed && (
        <SoftFeedback
          hint="Look for the distinctive strokes — compare curves and angles."
          answer={`The one we want is ${target.glyph}`}
          onHint={() => {
            setHintsUsed((n) => n + 1)
            log('hint')
          }}
          onRetry={() => {
            setPicked(null)
            setFailed(false)
          }}
          onReveal={() => {
            log('reveal')
            onNext()
          }}
        />
      )}
      <PrimaryCta
        disabled={!picked || picked !== targetId}
        onClick={() => {
          log('success')
          onNext()
        }}
      >
        Match sound next
      </PrimaryCta>
    </Shell>
  )
}

function MatchGlyph({
  glyph,
  reading,
  glyphId,
  decoys,
  guideName,
  onNext,
}: {
  glyph: string
  reading: string
  glyphId: string
  decoys: string[]
  guideName: string
  onNext: () => void
}) {
  const { logAttempt } = useAppState()
  const [picked, setPicked] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const options = useMemo(() => {
    const set = Array.from(new Set([reading, ...decoys])).slice(0, 4)
    return set.sort(() => Math.random() - 0.5)
  }, [reading, decoys])

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    logAttempt({
      activityType: 'match',
      itemKey: `script:${glyphId}`,
      facet: 'recognition',
      outcome,
      hintsUsed,
    })
  }

  return (
    <Shell eyebrow="Match It">
      <GuideBubble name={guideName}>
        What reading goes with this mark?
      </GuideBubble>
      <GlyphHero glyph={glyph} />
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`min-h-12 rounded-2xl border-[3px] border-ink bg-paper px-3.5 py-3 text-left font-extrabold shadow-chunky ${
              picked === opt ? 'outline outline-3 outline-cyan' : ''
            }`}
            onClick={() => {
              setPicked(opt)
              const wrong = opt !== reading
              setFailed(wrong)
              if (wrong) log('fail')
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      {failed && (
        <SoftFeedback
          hint="Say the sound out loud once — then pick again."
          answer={`${glyph} → ${reading}`}
          onHint={() => {
            setHintsUsed((n) => n + 1)
            log('hint')
          }}
          onRetry={() => {
            setPicked(null)
            setFailed(false)
          }}
          onReveal={() => {
            log('reveal')
            onNext()
          }}
        />
      )}
      <PrimaryCta
        disabled={!picked || picked !== reading}
        onClick={() => {
          log('success')
          onNext()
        }}
      >
        Trace the shape
      </PrimaryCta>
    </Shell>
  )
}

type WriteStage = 'trace' | 'copy' | 'recall'

function TraceIt({
  glyph,
  glyphId,
  guideName,
  onNext,
}: {
  glyph: string
  glyphId: string
  guideName: string
  onNext: () => void
}) {
  const { profile, logAttempt } = useAppState()
  const isLatin =
    languageById(profile.languageId).orthographyMode === 'latin-sounds'
  const [stage, setStage] = useState<WriteStage>('trace')
  const [inkOk, setInkOk] = useState(false)
  const [failed, setFailed] = useState(false)

  const copy: Record<WriteStage, { eye: string; ghost: number; next: string }> =
    {
      trace: {
        eye: isLatin
          ? 'Trace the letters — follow the faint guide.'
          : 'Trace the mark. Follow the faint guide with your finger.',
        ghost: 0.28,
        next: isLatin ? 'Copy it without the heavy guide' : 'Copy it next',
      },
      copy: {
        eye: 'Now copy it — the guide is lighter. Write it yourself.',
        ghost: 0.12,
        next: 'Try from memory',
      },
      recall: {
        eye: 'From memory — write it with no guide.',
        ghost: 0,
        next: 'Use it in a tiny bit of language',
      },
    }

  const eyebrow =
    stage === 'trace'
      ? isLatin
        ? 'Practice It'
        : 'Trace It'
      : stage === 'copy'
        ? 'Copy It'
        : 'From Memory'

  const advance = () => {
    if (!inkOk) {
      setFailed(true)
      logAttempt({
        activityType: 'trace',
        itemKey: `script:${glyphId}`,
        facet: 'writing',
        outcome: 'fail',
      })
      return
    }
    logAttempt({
      activityType: 'trace',
      itemKey: `script:${glyphId}`,
      facet: 'writing',
      outcome: 'success',
    })
    if (stage === 'trace') setStage('copy')
    else if (stage === 'copy') setStage('recall')
    else onNext()
    setInkOk(false)
    setFailed(false)
  }

  return (
    <Shell eyebrow={eyebrow}>
      <GuideBubble name={guideName}>{copy[stage].eye}</GuideBubble>
      <WriteCanvas
        key={stage}
        ghost={glyph}
        ghostOpacity={copy[stage].ghost}
        onInkChange={(ok) => {
          setInkOk(ok)
          if (ok) setFailed(false)
        }}
      />
      {failed && !inkOk && (
        <SoftFeedback
          hint="Write a bit more — a quick tap doesn’t count as a stroke."
          answer={glyph}
          onRetry={() => setFailed(false)}
          onReveal={() => {
            logAttempt({
              activityType: 'trace',
              itemKey: `script:${glyphId}`,
              facet: 'writing',
              outcome: 'reveal',
            })
            if (stage === 'recall') onNext()
            else setStage(stage === 'trace' ? 'copy' : 'recall')
            setFailed(false)
          }}
        />
      )}
      <PrimaryCta onClick={advance}>{copy[stage].next}</PrimaryCta>
    </Shell>
  )
}

function UseIt({
  glyph,
  reading,
  glyphId,
  guideName,
  onNext,
}: {
  glyph: string
  reading: string
  glyphId: string
  guideName: string
  onNext: () => void
}) {
  const { logAttempt } = useAppState()

  return (
    <Shell eyebrow="Use It">
      <GuideBubble name={guideName}>
        Marks exist to unlock words. You&apos;ve seen, heard, spotted, matched,
        and traced — checkpoint time.
      </GuideBubble>
      <div className="rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky">
        <p className="text-center font-display text-5xl font-bold">{glyph}</p>
        <p className="mt-2 text-center font-extrabold text-ink-soft">
          shows up when you need “{reading}”
        </p>
      </div>
      <PrimaryCta
        onClick={() => {
          logAttempt({
            activityType: 'use',
            itemKey: `script:${glyphId}`,
            facet: 'contextualUse',
            outcome: 'success',
          })
          onNext()
        }}
      >
        All Clear — writing warm-up done
      </PrimaryCta>
    </Shell>
  )
}
