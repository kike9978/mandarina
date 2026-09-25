import { BookmarkPlus, Check, Mic, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { type PhraseUnit } from '../data/fixtures'
import { speakText, ttsLangFor } from '../learning/tts'
import { useAppState, useGuideName } from '../state/AppState'
import {
  GuideBubble,
  MomentumBanner,
  PrimaryCta,
  SoftChoice,
} from '../components/ui'
import {
  SentenceFrame,
  SessionChrome,
  SoftFeedback,
} from '../components/SessionBits'


function useActiveUnit(): PhraseUnit {
  const { activeUnit } = useAppState()
  if (!activeUnit) {
    throw new Error('No active learning unit')
  }
  return activeUnit
}

function useItemKey() {
  const { sessionKind } = useAppState()
  const prefix = sessionKind === 'stash' ? 'user' : 'phrase'
  return (itemId: string | undefined) => {
    if (!itemId) return undefined
    if (itemId.endsWith('-ctx') || itemId.endsWith('-echo')) return undefined
    return `${prefix}:${itemId}`
  }
}

const spotChip =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-2xl border-[3px] border-ink bg-paper px-3.5 py-2 font-extrabold shadow-chunky-sm'
const iconRow =
  'inline-flex w-fit min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-paper px-3.5 py-2 font-extrabold disabled:cursor-not-allowed disabled:opacity-60'

export function SessionPage() {
  const navigate = useNavigate()
  const {
    steps,
    currentActivity,
    advanceFrom,
    momentum,
    sessionCleared,
    addStash,
    activeUnit,
    sessionKind,
  } = useAppState()
  const unit = activeUnit

  useEffect(() => {
    if (!unit) navigate('/', { replace: true })
  }, [unit, navigate])

  const stepMeta = steps.find((s) => s.id === currentActivity)
  const stepNumber = stepMeta?.number ?? 1
  const stepTotal = steps.length

  useEffect(() => {
    if (sessionCleared) navigate('/clear', { replace: true })
  }, [sessionCleared, navigate])

  if (sessionCleared || !unit) return null

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <SessionChrome
        stepLabel={stepMeta?.label ?? 'Meet It'}
        stepNumber={stepNumber}
        stepTotal={stepTotal}
        onBack={() => navigate(sessionKind === 'stash' ? '/stash' : '/')}
      />
      <div className="page-pad pt-2">
        {momentum && currentActivity !== 'meet' && (
          <MomentumBanner text="You're warmed up. Keep going." />
        )}
        {currentActivity === 'meet' && (
          <MeetIt onNext={() => advanceFrom('meet')} />
        )}
        {currentActivity === 'comeback' && (
          <ComebackIt onNext={() => advanceFrom('comeback')} />
        )}
        {currentActivity === 'spot' && (
          <SpotIt
            onNext={() => advanceFrom('spot')}
            onStash={
              sessionKind === 'stash'
                ? undefined
                : (item) =>
                    addStash({
                      surface: item.surface,
                      gloss: item.gloss,
                      reading: item.reading,
                      exampleSentence: unit.targetSentence,
                      source: 'user',
                    })
            }
          />
        )}
        {currentActivity === 'break' && (
          <BreakItDown onNext={() => advanceFrom('break')} />
        )}
        {currentActivity === 'turn' && (
          <YourTurn onNext={() => advanceFrom('turn')} />
        )}
        {currentActivity === 'build' && (
          <BuildIt onNext={() => advanceFrom('build')} />
        )}
        {currentActivity === 'say' && (
          <SayIt onNext={() => advanceFrom('say')} />
        )}
        {currentActivity === 'boss' && (
          <BossShell
            onNext={() => advanceFrom('boss')}
            onSkip={() => advanceFrom('boss')}
          />
        )}
      </div>
    </div>
  )
}

function ActivityShell({
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

function ComebackIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt } = useAppState()
  const items = unit.comebackItems ?? []
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)

  const current = items[Math.min(idx, Math.max(items.length - 1, 0))]
  const options = useMemo(() => {
    if (!current) return []
    const decoys = ['tomorrow', 'friend', 'water', 'school', 'food'].filter(
      (g) => g.toLowerCase() !== current.gloss.toLowerCase(),
    )
    return [
      { id: 'ok', label: current.gloss, ok: true },
      { id: 'd1', label: decoys[0] ?? 'not this', ok: false },
      { id: 'd2', label: decoys[1] ?? 'something else', ok: false },
    ].sort(() => Math.random() - 0.5)
  }, [current])

  useEffect(() => {
    if (items.length === 0) onNext()
  }, [items.length, onNext])

  if (!current || items.length === 0) return null

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    logAttempt({
      activityType: 'comeback',
      itemKey: current.itemKey,
      facet: current.facet,
      outcome,
      hintsUsed,
    })
  }

  const goNextItem = () => {
    if (idx + 1 >= items.length) {
      onNext()
      return
    }
    setIdx((n) => n + 1)
    setPicked(null)
    setFailed(false)
    setHintsUsed(0)
  }

  return (
    <ActivityShell eyebrow="Bring back">
      <GuideBubble name={useGuideName()}>
        Quick warm-up — what does this mean? ({idx + 1} of {items.length})
      </GuideBubble>
      <SentenceFrame
        sentence={current.surface}
        gloss={current.reading ? `Reading: ${current.reading}` : undefined}
      />
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={`${current.itemKey}-${o.id}-${o.label}`}
            type="button"
            className={`min-h-12 cursor-pointer rounded-2xl border-[3px] border-ink bg-paper px-3.5 py-3 text-left font-extrabold shadow-chunky ${
              picked === o.id ? 'outline outline-3 outline-cyan' : ''
            }`}
            onClick={() => {
              setPicked(o.id)
              setFailed(!o.ok)
              if (!o.ok) log('fail')
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {failed && picked && !options.find((o) => o.id === picked)?.ok && (
        <SoftFeedback
          hint="Think about when you last used this bit of language."
          answer={`${current.surface} = ${current.gloss}`}
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
            goNextItem()
          }}
        />
      )}
      <PrimaryCta
        disabled={!picked || !options.find((o) => o.id === picked)?.ok}
        onClick={() => {
          log('success')
          goNextItem()
        }}
      >
        {idx + 1 >= items.length ? 'Back to the lesson' : 'Next bit'}
      </PrimaryCta>
    </ActivityShell>
  )
}

function MeetIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { profile, logAttempt } = useAppState()
  const itemKey = useItemKey()
  const focus = unit.items[0]

  return (
    <ActivityShell eyebrow="Meet It">
      <GuideBubble name={useGuideName()}>
        Just listen and look — no quiz yet. Soak in the whole sentence.
      </GuideBubble>
      <SentenceFrame
        sentence={unit.targetSentence}
        gloss={unit.targetGloss}
      />
      <button
        type="button"
        className={iconRow}
        aria-label="Play audio"
        onClick={() =>
          speakText(unit.targetSentence, ttsLangFor(profile.languageId))
        }
      >
        <Volume2 strokeWidth={2.25} />
        Hear it
      </button>
      <PrimaryCta
        onClick={() => {
          const key = itemKey(focus?.id)
          if (key) {
            logAttempt({
              activityType: 'meet',
              itemKey: key,
              facet: 'listening',
              outcome: 'success',
            })
          }
          onNext()
        }}
      >
        Got it — Spot It next
      </PrimaryCta>
    </ActivityShell>
  )
}

function SpotIt({
  onNext,
  onStash,
}: {
  onNext: () => void
  onStash?: (item: {
    surface: string
    gloss: string
    reading?: string
  }) => void | Promise<void>
}) {
  const unit = useActiveUnit()
  const { logAttempt } = useAppState()
  const itemKey = useItemKey()

  const targets = unit.items.slice(0, 2)
  const [found, setFound] = useState<string[]>([])
  const [focusId, setFocusId] = useState<string | null>(null)
  const [stashFlash, setStashFlash] = useState<string | null>(null)
  const [stashing, setStashing] = useState(false)

  const focus =
    targets.find((t) => t.id === focusId) ??
    targets.find((t) => t.id === found[found.length - 1]) ??
    targets[0]

  return (
    <ActivityShell eyebrow="Spot It">
      <GuideBubble name={useGuideName()}>
        Tap the pieces that mean <strong>{unit.spotGlossA}</strong> and{' '}
        <strong>{unit.spotGlossB}</strong>.
      </GuideBubble>
      <SentenceFrame sentence={unit.targetSentence} />
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => {
          const active = found.includes(t.id)
          const selected = focus?.id === t.id
          return (
            <button
              key={t.id}
              type="button"
              className={`${spotChip}${active ? ' bg-cyan' : ''}${
                selected ? ' outline outline-3 outline-ink' : ''
              }`}
              onClick={() => {
                setFocusId(t.id)
                setFound((prev) =>
                  prev.includes(t.id) ? prev : [...prev, t.id],
                )
              }}
            >
              {t.surface}
              {active && <Check size={16} strokeWidth={2.5} aria-hidden />}
            </button>
          )
        })}
      </div>
      {found.length > 0 && onStash && focus && (
        <button
          type="button"
          disabled={stashing}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-grid px-3 py-2 font-extrabold disabled:opacity-60"
          onClick={() => {
            setStashing(true)
            void Promise.resolve(
              onStash({
                surface: focus.surface,
                gloss: focus.gloss,
                reading: focus.reading,
              }),
            )
              .then(() => {
                setStashFlash(focus.surface)
                window.setTimeout(() => setStashFlash(null), 2200)
              })
              .catch(() => {
                setStashFlash('Couldn’t save — try again')
                window.setTimeout(() => setStashFlash(null), 2200)
              })
              .finally(() => setStashing(false))
          }}
        >
          <BookmarkPlus size={16} strokeWidth={2.25} aria-hidden />
          Stash “{focus.surface}”
        </button>
      )}
      {stashFlash && (
        <p
          className="animate-pop-in rounded-xl border-2 border-ink bg-[#e8fff4] px-3 py-2 font-extrabold"
          role="status"
        >
          {stashFlash.startsWith('Couldn’t')
            ? stashFlash
            : `Stashed “${stashFlash}” — open Stash anytime to practice it.`}
        </p>
      )}
      <PrimaryCta
        disabled={found.length < 2}
        onClick={() => {
          for (const t of targets) {
            const key = itemKey(t.id)
            if (!key) continue
            logAttempt({
              activityType: 'spot',
              itemKey: key,
              facet: 'recognition',
              outcome: 'success',
            })
          }
          onNext()
        }}
      >
        Nice — now let&apos;s make sure you can find them again
      </PrimaryCta>
    </ActivityShell>
  )
}

function BreakItDown({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()

  return (
    <ActivityShell eyebrow="Break It Down">
      <GuideBubble name={useGuideName()}>
        Meaning, sound, and a tiny pattern note — then we&apos;ll retrieve it.
      </GuideBubble>
      <ul className="m-0 grid list-none gap-2 p-0">
        {unit.items.map((item) => (
          <li
            key={item.id}
            className="grid gap-0.5 rounded-2xl border-[2.5px] border-ink bg-paper p-3"
          >
            <strong>{item.surface}</strong>
            {item.reading && (
              <em className="font-bold not-italic text-ink-soft">
                {item.reading}
              </em>
            )}
            <span className="font-bold">{item.gloss}</span>
          </li>
        ))}
      </ul>
      <PrimaryCta onClick={onNext}>Your Turn</PrimaryCta>
    </ActivityShell>
  )
}

function YourTurn({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt } = useAppState()
  const itemKey = useItemKey()
  const focusId = unit.items[0]?.id

  const [picked, setPicked] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const options = unit.turnOptions
  const answer = options.find((o) => o.ok)

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    const key = itemKey(focusId)
    if (!key) return
    logAttempt({
      activityType: 'turn',
      itemKey: key,
      facet: 'recognition',
      outcome,
      hintsUsed,
    })
  }

  return (
    <ActivityShell eyebrow="Your Turn">
      <GuideBubble name={useGuideName()}>
        What does <strong>{unit.turnPromptSurface}</strong> mean?
      </GuideBubble>
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`min-h-12 cursor-pointer rounded-2xl border-[3px] border-ink bg-paper px-3.5 py-3 text-left font-extrabold shadow-chunky ${
              picked === o.id ? 'outline outline-3 outline-cyan' : ''
            }`}
            onClick={() => {
              setPicked(o.id)
              setFailed(!o.ok)
              if (!o.ok) log('fail')
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {failed && picked && !options.find((o) => o.id === picked)?.ok && (
        <SoftFeedback
          hint="Think about everyday work / daily life."
          answer={`${unit.turnPromptSurface} = ${answer?.label ?? ''}`}
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
        disabled={!picked || !options.find((o) => o.id === picked)?.ok}
        onClick={() => {
          log('success')
          onNext()
        }}
      >
        You&apos;ve got the pieces — Build It
      </PrimaryCta>
    </ActivityShell>
  )
}

function BuildIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt } = useAppState()
  const itemKey = useItemKey()
  const focusId = unit.items[0]?.id

  const [pool, setPool] = useState(() =>
    [...unit.buildChunks].sort(() => Math.random() - 0.5),
  )
  const [built, setBuilt] = useState<string[]>([])
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const done = built.join('') === unit.buildChunks.join('') ||
    built.join(' ') === unit.buildChunks.join(' ')

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    const key = itemKey(focusId)
    if (!key) return
    logAttempt({
      activityType: 'build',
      itemKey: key,
      facet: 'production',
      outcome,
      hintsUsed,
    })
  }

  return (
    <ActivityShell eyebrow="Build It">
      <GuideBubble name={useGuideName()}>
        Rebuild the sentence from the chunks.
      </GuideBubble>
      <div className="flex min-h-[72px] flex-wrap items-center gap-2 rounded-2xl border-[3px] border-dashed border-ink bg-paper/70 p-3">
        {built.length === 0 ? (
          <span className="font-bold text-ink-soft">Drop chunks here</span>
        ) : (
          built.map((c) => (
            <button
              key={`b-${c}`}
              type="button"
              className={spotChip}
              onClick={() => {
                setBuilt((prev) => prev.filter((x) => x !== c))
                setPool((prev) => [...prev, c])
                setFailed(false)
              }}
            >
              {c}
            </button>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((c) => (
          <button
            key={`p-${c}`}
            type="button"
            className={spotChip}
            onClick={() => {
              setPool((prev) => prev.filter((x) => x !== c))
              setBuilt((prev) => [...prev, c])
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {built.length === unit.buildChunks.length && !done && (
        <button
          type="button"
          className="inline-flex w-fit cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
          onClick={() => {
            setFailed(true)
            log('fail')
          }}
        >
          Check
        </button>
      )}
      {failed && !done && (
        <SoftFeedback
          hint="Put the chunks in the same order as the full sentence."
          answer={unit.targetSentence}
          onHint={() => {
            setHintsUsed((n) => n + 1)
            log('hint')
          }}
          onRetry={() => {
            setBuilt([])
            setPool([...unit.buildChunks].sort(() => Math.random() - 0.5))
            setFailed(false)
          }}
          onReveal={() => {
            log('reveal')
            onNext()
          }}
        />
      )}
      <PrimaryCta
        disabled={!done}
        onClick={() => {
          log('success')
          onNext()
        }}
      >
        You&apos;ve got the pieces. Your turn to say it.
      </PrimaryCta>
    </ActivityShell>
  )
}

function SayIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt } = useAppState()
  const itemKey = useItemKey()
  const focusId = unit.items[0]?.id

  const [value, setValue] = useState('')
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const normalized = value.replace(/\s/g, '')
  const ok = normalized === unit.targetSentence.replace(/\s/g, '')

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    const key = itemKey(focusId)
    if (!key) return
    logAttempt({
      activityType: 'say',
      itemKey: key,
      facet: 'production',
      outcome,
      hintsUsed,
    })
  }

  return (
    <ActivityShell eyebrow="Say It">
      <GuideBubble name={useGuideName()}>
        What are you doing today? Type it (mic is a stub for now).
      </GuideBubble>
      <label>
        <span className="sr-only">Your sentence</span>
        <textarea
          className="w-full resize-y rounded-2xl border-[3px] border-ink bg-paper p-3.5 text-[1.15rem] font-bold"
          rows={3}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setFailed(false)
          }}
          placeholder="今日は…"
        />
      </label>
      <button type="button" className={iconRow} disabled>
        <Mic strokeWidth={2.25} />
        Mic coming soon — type for now
      </button>
      {failed && !ok && (
        <SoftFeedback
          hint="Rebuild from the chunks you just practiced."
          answer={unit.targetSentence}
          onHint={() => {
            setHintsUsed((n) => n + 1)
            log('hint')
          }}
          onRetry={() => setFailed(false)}
          onReveal={() => {
            log('reveal')
            onNext()
          }}
        />
      )}
      <PrimaryCta
        onClick={() => {
          if (ok) {
            log('success')
            onNext()
          } else {
            setFailed(true)
            log('fail')
          }
        }}
      >
        Check
      </PrimaryCta>
    </ActivityShell>
  )
}

function BossShell({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const unit = useActiveUnit()
  const { sessionKind } = useAppState()
  const isStash = sessionKind === 'stash'

  return (
    <ActivityShell eyebrow="Boss Challenge">
      <p className="inline-flex w-fit items-center rounded-full border-2 border-dashed border-ink/50 bg-paper/80 px-2.5 py-1 text-[0.75rem] font-extrabold tracking-wide uppercase opacity-80">
        Needs connection · Phase 2
      </p>
      <GuideBubble name={useGuideName()}>
        {isStash
          ? 'You practiced your own phrases. Live conversation lands in Phase 2 — claim the checkpoint?'
          : 'You just learned how to talk about today. Live conversation lands in Phase 2 — for now, claim the checkpoint?'}
      </GuideBubble>
      <SentenceFrame
        sentence={
          isStash
            ? unit.targetSentence
            : `${unit.targetSentence.replace(/[.。]$/, '')}?`
        }
        gloss={
          isStash
            ? unit.targetGloss
            : 'Do you have work today? (coming soon)'
        }
      />
      <SoftChoice
        primaryLabel="Why not! — All Clear"
        secondaryLabel="Nah… skip for now"
        onPrimary={onNext}
        onSecondary={onSkip}
      />
    </ActivityShell>
  )
}
