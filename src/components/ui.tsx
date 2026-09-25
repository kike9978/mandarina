import { Crown } from 'lucide-react'
import type { ReactNode } from 'react'

export function GuideBubble({
  children,
  name = 'Mikan',
}: {
  children: ReactNode
  name?: string
}) {
  return (
    <div className="animate-pop-in grid gap-2">
      <div
        className="ml-3 inline-flex w-fit items-center gap-2 rounded-t-[14px] border-[2.5px] border-ink bg-grid-deep px-3 pt-1.5 pb-1 shadow-chunky"
        aria-hidden
      >
        <span className="relative h-3.5 w-7 rounded-t-[10px] rounded-b-sm bg-ink before:absolute before:top-1 before:left-[5px] before:size-1.5 before:rounded-full before:bg-white after:absolute after:top-1 after:right-[5px] after:size-1.5 after:rounded-full after:bg-white" />
        <span className="text-[0.78rem] font-extrabold">{name}&apos;s Guide</span>
      </div>
      <div
        className="rounded-[22px] border-[3px] border-ink bg-paper px-[18px] py-4 text-[1.02rem] leading-snug font-bold shadow-chunky"
        role="status"
      >
        {children}
      </div>
    </div>
  )
}

export function PrimaryCta({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      className="cta-stripes w-full min-h-[52px] cursor-pointer rounded-2xl border-[3px] border-ink px-5 py-3 font-display text-xl font-semibold text-ink shadow-chunky transition-transform duration-150 ease-[var(--ease-pop)] hover:enabled:-translate-x-px hover:enabled:-translate-y-px active:enabled:translate-x-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-chunky-sm disabled:cursor-not-allowed disabled:opacity-55"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function SoftChoice({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}) {
  return (
    <div className="grid gap-2.5">
      <button
        type="button"
        className="cta-stripes min-h-12 cursor-pointer rounded-2xl border-[3px] border-ink px-4 py-3 font-extrabold shadow-chunky"
        onClick={onPrimary}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        className="min-h-12 cursor-pointer rounded-2xl border-[3px] border-ink bg-grid px-4 py-3 font-extrabold shadow-chunky"
        onClick={onSecondary}
      >
        {secondaryLabel}
      </button>
    </div>
  )
}

export function MomentumBanner({ text }: { text: string }) {
  return (
    <div
      className="animate-pop-in rounded-full border-[2.5px] border-ink bg-paper px-4 py-2.5 text-center font-extrabold shadow-magenta"
      role="status"
    >
      {text}
    </div>
  )
}

export function CheckpointBadge({
  title = 'All Clear!',
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="animate-pop-in grid justify-items-center gap-2 text-center">
      <Crown
        className="size-12 text-[#b8ff5a] drop-shadow-[0_0_10px_rgba(184,255,90,0.55)]"
        strokeWidth={2.25}
        aria-hidden
      />
      {subtitle && (
        <p className="text-[0.95rem] font-bold opacity-90">{subtitle}</p>
      )}
      <h1 className="text-[clamp(2rem,8vw,2.8rem)] [text-shadow:0_0_18px_rgba(255,255,255,0.35)]">
        {title}
      </h1>
    </div>
  )
}
