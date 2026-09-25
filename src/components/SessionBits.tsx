import { ArrowLeft, CircleHelp, Lightbulb, Pause, Volume2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { readingSpans, splitAnnotatedLine } from '../learning/readingAid'
import { annotateReading } from '../learning/ruby'
import { speakText } from '../learning/tts'

export function SessionChrome({
  stepLabel,
  stepNumber,
  stepTotal,
  onBack,
}: {
  stepLabel: string
  stepNumber: number
  stepTotal: number
  onBack: () => void
  children?: ReactNode
}) {
  return (
    <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-3.5 pt-3 pb-2">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-[14px] border-[2.5px] border-ink bg-paper shadow-chunky-sm"
        onClick={onBack}
        aria-label="Back"
      >
        <ArrowLeft strokeWidth={2.25} />
      </button>
      <div className="grid gap-1.5">
        <p className="text-center text-[0.85rem] font-extrabold">
          Step {stepNumber} · {stepLabel}
        </p>
        <div
          className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white/55"
          role="progressbar"
          aria-valuenow={stepNumber}
          aria-valuemin={1}
          aria-valuemax={stepTotal}
        >
          <span
            className="block h-full bg-cyan transition-[width] duration-300 ease-out"
            style={{ width: `${(stepNumber / stepTotal) * 100}%` }}
          />
        </div>
      </div>
      <span className="grid size-11 place-items-center rounded-[14px] opacity-45" aria-hidden>
        <Pause strokeWidth={2.25} />
      </span>
    </header>
  )
}

export function SoftFeedback({
  onRetry,
  onReveal,
  onHint,
  answer,
  hint,
}: {
  onRetry: () => void
  onReveal: () => void
  onHint?: () => void
  answer: string
  hint: string
}) {
  const [level, setLevel] = useState<0 | 1 | 2>(0)

  return (
    <div
      className="animate-pop-in grid gap-2.5 rounded-2xl border-[3px] border-ink bg-paper p-3.5 shadow-chunky"
      role="status"
    >
      <p className="flex items-center gap-2 text-[1.05rem] font-extrabold">
        <CircleHelp size={18} strokeWidth={2.25} aria-hidden />
        Not quite.
      </p>
      {level === 0 && (
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-grid px-3 py-2 font-extrabold"
          onClick={() => {
            onHint?.()
            setLevel(1)
          }}
        >
          <Lightbulb size={16} strokeWidth={2.25} aria-hidden />
          Here&apos;s a hint
        </button>
      )}
      {level >= 1 && <p className="leading-snug font-bold">{hint}</p>}
      {level === 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
            onClick={onRetry}
          >
            Try again
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
            onClick={() => setLevel(2)}
          >
            Show answer
          </button>
        </div>
      )}
      {level === 2 && (
        <>
          <p className="rounded-[10px] border-2 border-dashed border-ink bg-[#e8fff4] p-2.5 font-bold">
            {answer}
          </p>
          <button
            type="button"
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
            onClick={() => {
              setLevel(0)
              onReveal()
            }}
          >
            Got it — continue
          </button>
        </>
      )}
    </div>
  )
}

export function HearText({
  text,
  langHint,
  label = 'Hear it',
}: {
  text: string
  langHint?: string
  label?: string
}) {
  return (
    <button
      type="button"
      className="inline-flex w-fit min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-paper px-3.5 py-2 font-extrabold"
      aria-label={label}
      onClick={() => speakText(text, langHint)}
    >
      <Volume2 strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  )
}

export function RubyText({
  parts,
  dir,
}: {
  parts: { text: string; reading?: string }[]
  dir?: 'ltr' | 'rtl'
}) {
  const spans = parts.flatMap((part) => annotateReading(part.text, part.reading))
  return (
    <span dir={dir} lang={dir === 'rtl' ? 'ar' : undefined}>
      {spans.map((part, index) =>
        part.reading ? (
          <ruby key={`${part.text}-${index}`}>
            {part.text}
            <rt>{part.reading}</rt>
          </ruby>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  )
}

export function AidedText({
  languageId,
  text,
  reading,
}: {
  languageId: string
  text: string
  reading?: string
}) {
  const line = splitAnnotatedLine(text)
  const spans = readingSpans(languageId, line.text, reading ?? line.reading)
  if (!spans) return null
  return (
    <RubyText parts={spans} dir={languageId === 'ar' ? 'rtl' : undefined} />
  )
}

export function SentenceFrame({
  sentence,
  parts,
  gloss,
  dir,
}: {
  sentence: string
  parts?: { text: string; reading?: string }[]
  gloss?: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <figure className="animate-pop-in m-0 rounded-[22px] border-4 border-orange bg-paper px-[18px] py-5 text-center shadow-chunky">
      <p
        className="text-[clamp(1.4rem,6vw,1.85rem)] leading-[1.8] font-extrabold"
        dir={dir}
        lang={dir === 'rtl' ? 'ar' : undefined}
      >
        {parts && parts.length > 0 ? (
          <RubyText parts={parts} dir={dir} />
        ) : (
          sentence
        )}
      </p>
      {gloss && (
        <figcaption className="mt-2.5 font-bold text-ink-soft">{gloss}</figcaption>
      )}
    </figure>
  )
}
