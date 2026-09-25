import { Mic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  canUseLiveSpeech,
  runMockListen,
  startLiveListen,
} from '../learning/speech'
import { SoftChoice } from './ui'

const GATE_KEY = 'mandarina-mic-gate-v1'

type Phase = 'idle' | 'gate' | 'listening' | 'heard' | 'denied'

function gateAccepted(): boolean {
  try {
    return sessionStorage.getItem(GATE_KEY) === 'ok'
  } catch {
    return false
  }
}

function rememberGate(): void {
  try {
    sessionStorage.setItem(GATE_KEY, 'ok')
  } catch {
    /* ignore */
  }
}

export function MicListen({
  target,
  langHint,
  onHeard,
  disabled,
}: {
  target: string
  langHint?: string
  onHeard: (text: string) => void
  disabled?: boolean
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [partial, setPartial] = useState('')
  const [heard, setHeard] = useState('')
  const [usedMock, setUsedMock] = useState(true)
  const stopLive = useRef<(() => void) | null>(null)
  const abortMock = useRef<AbortController | null>(null)

  const stopAll = () => {
    stopLive.current?.()
    stopLive.current = null
    abortMock.current?.abort()
    abortMock.current = null
  }

  useEffect(() => () => stopAll(), [])

  const startMock = async () => {
    stopAll()
    setUsedMock(true)
    setPhase('listening')
    setPartial('')
    const ac = new AbortController()
    abortMock.current = ac
    try {
      const text = await runMockListen(target, setPartial, { signal: ac.signal })
      setHeard(text)
      setPhase('heard')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setPhase('idle')
    }
  }

  const startListen = async () => {
    rememberGate()
    if (!(await canUseLiveSpeech())) {
      await startMock()
      return
    }
    stopAll()
    setUsedMock(false)
    setPhase('listening')
    setPartial('')
    let settled = false
    stopLive.current = startLiveListen({
      lang: langHint,
      onPartial: setPartial,
      onFinal: (text) => {
        settled = true
        setHeard(text)
        setPhase('heard')
      },
      onError: (kind) => {
        if (settled) return
        if (kind === 'denied') {
          setPhase('denied')
          return
        }
        void startMock()
      },
    })
  }

  const askOrListen = () => {
    if (disabled) return
    if (gateAccepted()) void startListen()
    else setPhase('gate')
  }

  if (phase === 'gate') {
    return (
      <div className="animate-pop-in grid gap-2 rounded-[22px] border-[3px] border-ink bg-paper p-3.5 shadow-chunky">
        <p className="font-extrabold">A listen, then you confirm</p>
        <p className="text-sm font-bold text-ink-soft">
          This device will hear you when it can. If it can&apos;t, I&apos;ll
          simulate a listen so you can still check the line. Nothing is uploaded.
        </p>
        <SoftChoice
          primaryLabel="Use the mic"
          secondaryLabel="I'll type instead"
          onPrimary={() => void startListen()}
          onSecondary={() => setPhase('idle')}
        />
      </div>
    )
  }

  if (phase === 'listening') {
    return (
      <div
        className="animate-pop-in grid gap-2 rounded-[22px] border-[3px] border-ink bg-paper p-3.5 shadow-chunky"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="animate-mic-pulse grid size-11 place-items-center rounded-full border-[2.5px] border-ink bg-cyan">
            <Mic size={20} strokeWidth={2.25} aria-hidden />
          </span>
          <div className="grid gap-0.5">
            <p className="font-extrabold">Listening…</p>
            <p className="text-sm font-bold text-ink-soft">
              {usedMock ? 'Practice listen · no cloud' : 'Device mic'}
            </p>
          </div>
        </div>
        <div className="flex h-8 items-end gap-1 px-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="wave-bar w-2 rounded-sm bg-ink"
              style={{
                height: '100%',
                animationDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </div>
        <p className="min-h-7 font-extrabold">{partial || '…'}</p>
        <button
          type="button"
          className="inline-flex w-fit min-h-11 items-center rounded-full border-[2.5px] border-ink bg-grid px-3.5 py-2 font-extrabold"
          onClick={() => {
            stopAll()
            setPhase('idle')
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (phase === 'heard') {
    return (
      <div
        className="animate-pop-in grid gap-2 rounded-[22px] border-[3px] border-ink bg-[#e8fff4] p-3.5 shadow-chunky"
        role="status"
      >
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Heard you say…
        </p>
        <p className="font-display text-xl font-bold">{heard}</p>
        <button
          type="button"
          className="cta-stripes min-h-12 cursor-pointer rounded-2xl border-[3px] border-ink px-4 py-3 font-extrabold shadow-chunky"
          onClick={() => {
            onHeard(heard)
            setPhase('idle')
          }}
        >
          Use this
        </button>
        <button
          type="button"
          className="min-h-11 rounded-2xl border-[2.5px] border-ink bg-grid font-extrabold"
          onClick={() => void startListen()}
        >
          Try again
        </button>
      </div>
    )
  }

  if (phase === 'denied') {
    return (
      <div
        className="animate-pop-in grid gap-2 rounded-[22px] border-[3px] border-ink bg-paper p-3.5 shadow-chunky"
        role="status"
      >
        <p className="font-extrabold">Mic stayed off</p>
        <p className="text-sm font-bold text-ink-soft">
          Type the line instead — same practice, no penalty.
        </p>
        <button
          type="button"
          className="inline-flex w-fit min-h-11 items-center rounded-full border-[2.5px] border-ink bg-grid px-3.5 py-2 font-extrabold"
          onClick={() => setPhase('idle')}
        >
          Got it
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="inline-flex w-fit min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-paper px-3.5 py-2 font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={askOrListen}
    >
      <Mic strokeWidth={2.25} aria-hidden />
      Try saying it
    </button>
  )
}
