import { Check, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { type PhraseUnit } from '../data/fixtures'
import { samePhrase, sentencePlaceholder } from '../learning/templateBridge'
import { speakText, ttsLangFor } from '../learning/tts'
import { useAppState, useGuideName } from '../state/AppState'
import {
  GuideBubble,
  MomentumBanner,
  PrimaryCta,
} from '../components/ui'
import { BossChallenge } from '../components/BossChallenge'
import { MicListen } from '../components/MicListen'
import {
  HearText,
  RubyText,
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
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-2xl border-[3px] border-ink bg-paper px-3.5 py-2 font-extrabold shadow-chunky-sm leading-[1.8]'

function chunkParts(unit: PhraseUnit, chunk: string) {
  const spot = unit.spotChunks?.find(
    (entry) => entry.parts.map((part) => part.text).join('') === chunk,
  )
  if (spot) return spot.parts
  const item = unit.items.find((entry) => entry.surface === chunk)
  if (item?.reading) return [{ text: item.surface, reading: item.reading }]
  return [{ text: chunk }]
}
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
    activeUnit,
    sessionKind,
    sessionStarted,
    logAttempt,
    recordBossClear,
  } = useAppState()
  const unit = activeUnit

  useEffect(() => {
    if (!unit && !sessionStarted) navigate('/', { replace: true })
  }, [unit, sessionStarted, navigate])

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
          <SpotIt onNext={() => advanceFrom('spot')} />
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
          <BossChallenge
            unit={unit}
            isStash={sessionKind === 'stash' || sessionKind === 'listen'}
            onClear={() => {
              recordBossClear()
              advanceFrom('boss')
            }}
            onSkip={() => {
              sessionStorage.setItem('mandarina-boss-skipped', '1')
              void advanceFrom('boss')
            }}
            onAttempt={(outcome, used) => {
              const focus = unit.items[0]
              if (!focus) return
              const prefix = sessionKind === 'stash' ? 'user' : 'phrase'
              if (outcome === 'success' && !used) return
              logAttempt({
                activityType: 'boss',
                itemKey: `${prefix}:${focus.id}`,
                facet: 'contextualUse',
                outcome,
              })
            }}
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
  const { logAttempt, profile } = useAppState()
  const items = unit.comebackItems ?? []
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)

  const current = items[Math.min(idx, Math.max(items.length - 1, 0))]
  const produce =
    current?.facet === 'production' ||
    current?.facet === 'writing' ||
    current?.facet === 'contextualUse'
  const listening = current?.facet === 'listening'
  const options = useMemo(() => {
    if (!current || produce) return []
    const decoys = ['tomorrow', 'friend', 'water', 'school', 'food'].filter(
      (g) => g.toLowerCase() !== current.gloss.toLowerCase(),
    )
    return [
      { id: 'ok', label: current.gloss, ok: true },
      { id: 'd1', label: decoys[0] ?? 'not this', ok: false },
      { id: 'd2', label: decoys[1] ?? 'something else', ok: false },
    ].sort(() => Math.random() - 0.5)
  }, [current, produce])

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
    setTyped('')
    setFailed(false)
    setHintsUsed(0)
  }

  const typedOk = samePhrase(typed, current.surface)
  const prompt =
    current.facet === 'listening'
      ? 'Listen, then pick the meaning. The word stays hidden.'
      : current.facet === 'writing'
        ? 'Write the word for this meaning. An English tap does not count.'
        : current.facet === 'production' || current.facet === 'contextualUse'
          ? 'Type the word for this meaning.'
          : 'What does this mean?'

  return (
    <ActivityShell eyebrow="Bring back">
      <GuideBubble name={useGuideName()}>
        {prompt} ({idx + 1} of {items.length})
      </GuideBubble>
      {produce ? (
        <p className="text-center font-display text-2xl font-bold">{current.gloss}</p>
      ) : listening ? (
        <HearText
          text={current.surface}
          langHint={ttsLangFor(profile.languageId)}
          label="Hear the word"
        />
      ) : (
        <SentenceFrame
          sentence={current.surface}
          gloss={current.reading ? `Reading: ${current.reading}` : undefined}
          dir={profile.languageId === 'ar' ? 'rtl' : undefined}
        />
      )}
      {produce ? (
        <label>
          <span className="sr-only">Your word</span>
          <textarea
            className="w-full resize-y rounded-2xl border-[3px] border-ink bg-paper p-3.5 text-[1.15rem] font-bold"
            rows={2}
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value)
              setFailed(false)
            }}
            placeholder="…"
          />
        </label>
      ) : (
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
      )}
      {failed && (
        <SoftFeedback
          hint={
            produce
              ? 'Recall the form, not the English word.'
              : 'Think about when you last used this bit of language.'
          }
          answer={`${current.surface} = ${current.gloss}`}
          onHint={() => setHintsUsed((n) => n + 1)}
          onRetry={() => {
            setPicked(null)
            setTyped('')
            setFailed(false)
          }}
          onReveal={() => {
            log('reveal')
            goNextItem()
          }}
        />
      )}
      <PrimaryCta
        disabled={produce ? !typed.trim() || (failed && !typedOk) : !picked || !options.find((o) => o.id === picked)?.ok}
        onClick={() => {
          if (produce) {
            if (typedOk) {
              log('success')
              goNextItem()
            } else {
              setFailed(true)
              log('fail')
            }
            return
          }
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
  const { profile } = useAppState()

  return (
    <ActivityShell eyebrow="Meet It">
      <GuideBubble name={useGuideName()}>
        Just listen and look — no quiz yet. Soak in the whole sentence.
      </GuideBubble>
      <SentenceFrame
        sentence={unit.targetSentence}
        parts={unit.sentenceParts}
        gloss={unit.targetGloss}
        dir={profile.languageId === 'ar' ? 'rtl' : undefined}
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
      <PrimaryCta onClick={onNext}>Got it — Spot It next</PrimaryCta>
    </ActivityShell>
  )
}

function SpotIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt, profile } = useAppState()
  const itemKey = useItemKey()
  const chunks =
    unit.spotChunks ??
    unit.items.map((item, index) => ({
      id: item.id,
      itemId: item.id,
      target: index < 2,
      parts: [{ text: item.surface, reading: item.reading }],
    }))
  const targets = chunks.filter((chunk) => chunk.target)
  const rtl = profile.languageId === 'ar'
  const [found, setFound] = useState<string[]>([])
  const [missed, setMissed] = useState(false)

  const ready =
    targets.length > 0 &&
    targets.every((chunk) => found.includes(chunk.id)) &&
    !missed

  return (
    <ActivityShell eyebrow="Spot It">
      <GuideBubble name={useGuideName()}>
        Tap the pieces that mean <strong>{unit.spotGlossA}</strong> and{' '}
        <strong>{unit.spotGlossB}</strong>. One piece is not either of those.
      </GuideBubble>
      <div
        className="flex flex-wrap items-end justify-center gap-2 rounded-[22px] border-4 border-orange bg-paper px-[18px] py-5 shadow-chunky"
        dir={rtl ? 'rtl' : undefined}
        lang={rtl ? 'ar' : undefined}
      >
        {chunks.map((chunk) => {
          const active = found.includes(chunk.id)
          const wrong = missed && !chunk.target
          return (
            <button
              key={chunk.id}
              type="button"
              className={`${spotChip} leading-[1.8]${active ? ' bg-cyan' : ''}${
                wrong ? ' bg-soft-error' : ''
              }`}
              onClick={() => {
                if (!chunk.target) {
                  setMissed(true)
                  const key = itemKey(chunk.itemId)
                  if (key) {
                    logAttempt({
                      activityType: 'spot',
                      itemKey: key,
                      facet: 'recognition',
                      outcome: 'fail',
                    })
                  }
                  return
                }
                setFound((prev) =>
                  prev.includes(chunk.id) ? prev : [...prev, chunk.id],
                )
              }}
            >
              <RubyText parts={chunk.parts} dir={rtl ? 'rtl' : undefined} />
              {active && <Check size={16} strokeWidth={2.5} aria-hidden />}
            </button>
          )
        })}
      </div>
      {missed && (
        <SoftFeedback
          hint="Stay inside the sentence. The extra piece is there on purpose."
          answer={`${unit.spotGlossA} and ${unit.spotGlossB}`}
          onRetry={() => {
            setMissed(false)
            setFound([])
          }}
          onReveal={() => {
            setMissed(false)
            setFound([])
          }}
        />
      )}
      <PrimaryCta
        disabled={!ready}
        onClick={() => {
          for (const chunk of targets) {
            const key = itemKey(chunk.itemId)
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
        Your Turn
      </PrimaryCta>
    </ActivityShell>
  )
}

function BreakItDown({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { profile } = useAppState()
  const langHint = ttsLangFor(profile.languageId)

  return (
    <ActivityShell eyebrow="Break It Down">
      <GuideBubble name={useGuideName()}>
        Meaning, sound, and a tiny pattern note — then we&apos;ll retrieve it.
      </GuideBubble>
      <ul className="m-0 grid list-none gap-2 p-0">
        {unit.items.map((item) => (
          <li
            key={item.id}
            className="grid gap-1.5 rounded-2xl border-[2.5px] border-ink bg-paper p-3"
          >
            <strong>
              <RubyText
                parts={[
                  {
                    text: item.surface,
                    reading:
                      (profile.languageId === 'ja' ||
                        profile.languageId === 'zh') &&
                      item.reading &&
                      item.reading !== item.surface
                        ? item.reading
                        : undefined,
                  },
                ]}
                dir={profile.languageId === 'ar' ? 'rtl' : undefined}
              />
            </strong>
            {item.reading &&
              profile.languageId !== 'ar' &&
              profile.languageId !== 'ja' &&
              profile.languageId !== 'zh' && (
                <em className="font-bold not-italic text-ink-soft">
                  {item.reading}
                </em>
              )}
            <span className="font-bold">{item.gloss}</span>
            <HearText
              text={item.surface}
              langHint={langHint}
              label={`Hear “${item.surface}”`}
            />
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
  const focusId = unit.items.find(
    (item) => item.surface === unit.turnPromptSurface,
  )?.id

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
        What does{' '}
        <strong>
          <RubyText parts={chunkParts(unit, unit.turnPromptSurface)} />
        </strong>{' '}
        mean?
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
  const [passed, setPassed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const assembled = built.join(' ')
  const done =
    samePhrase(assembled, unit.targetSentence) ||
    samePhrase(built.join(''), unit.buildChunks.join(''))
  const allPlaced = built.length === unit.buildChunks.length

  const log = (outcome: 'success' | 'fail' | 'hint' | 'reveal') => {
    const ids = unit.items.map((item) => item.id)
    const keys = ids.map((id) => itemKey(id)).filter((key): key is string => Boolean(key))
    const graded = keys.length > 0 ? keys : [itemKey(focusId)].filter((key): key is string => Boolean(key))
    for (const key of graded) {
      logAttempt({
        activityType: 'build',
        itemKey: key,
        facet: 'production',
        outcome,
        hintsUsed,
      })
    }
  }

  const moveToBuilt = (chunk: string) => {
    setPool((prev) => prev.filter((x) => x !== chunk))
    setBuilt((prev) => [...prev, chunk])
    setFailed(false)
  }

  return (
    <ActivityShell eyebrow="Build It">
      <GuideBubble name={useGuideName()}>
        Tap the pieces below — rebuild:{' '}
        <strong>{unit.targetGloss}</strong>
      </GuideBubble>
      <div className="flex min-h-18 flex-wrap items-center gap-2 rounded-2xl border-[3px] border-dashed border-ink bg-paper/70 p-3">
        {built.length === 0 ? (
          <span className="font-bold text-ink-soft">
            Tap a piece to drop it here
          </span>
        ) : (
          built.map((c, i) => (
            <button
              key={`b-${c}-${i}`}
              type="button"
              className={`${spotChip} bg-cyan`}
              onClick={() => {
                setBuilt((prev) => prev.filter((_, idx) => idx !== i))
                setPool((prev) => [...prev, c])
                setFailed(false)
              }}
            >
              <RubyText parts={chunkParts(unit, c)} />
            </button>
          ))
        )}
      </div>
      {pool.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pool.map((c, i) => (
            <button
              key={`p-${c}-${i}`}
              type="button"
              className={spotChip}
              onClick={() => moveToBuilt(c)}
            >
              <RubyText parts={chunkParts(unit, c)} />
            </button>
          ))}
        </div>
      )}
      {allPlaced && !passed && !failed && (
        <button
          type="button"
          className="inline-flex w-fit cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
          onClick={() => {
            if (done) setPassed(true)
            else {
              setFailed(true)
              log('fail')
            }
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
      {passed ? (
        <PrimaryCta
          onClick={() => {
            log('success')
            onNext()
          }}
        >
          You&apos;ve got the pieces. Your turn to say it.
        </PrimaryCta>
      ) : (
        <p className="text-center text-sm font-bold text-ink-soft">
          {allPlaced
            ? 'Tap Check when the line is in order.'
            : 'Tap each piece to add it. Tap again in the box to undo.'}
        </p>
      )}
    </ActivityShell>
  )
}

function SayIt({ onNext }: { onNext: () => void }) {
  const unit = useActiveUnit()
  const { logAttempt, profile } = useAppState()
  const itemKey = useItemKey()
  const focusId = unit.items[0]?.id

  const [value, setValue] = useState('')
  const [failed, setFailed] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const ok = samePhrase(value, unit.targetSentence)

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
        What are you doing today? Speak it — or type if you&apos;d rather.
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
          placeholder={sentencePlaceholder(unit.targetSentence)}
        />
      </label>
      <MicListen
        target={unit.targetSentence}
        langHint={ttsLangFor(profile.languageId)}
        onHeard={(text) => {
          setValue(text)
          setFailed(false)
        }}
      />
      {failed && !ok && (
        <SoftFeedback
          hint="Rebuild from the chunks you just practiced."
          answer={unit.targetSentence}
          onHint={() => {
            setHintsUsed((n) => n + 1)
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
