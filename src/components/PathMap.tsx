import type { ReactNode } from 'react'
import type { PathNodeState } from '../data/fixtures'

export interface PathMapStep {
  id: string
  number: number
  label: string
  state: PathNodeState
}

export function PathMap({
  steps,
  onSelect,
  activeSlot,
}: {
  steps: PathMapStep[]
  onSelect?: (id: string) => void
  activeSlot?: ReactNode
}) {
  return (
    <ol
      className="m-0 grid w-full min-w-0 grid-cols-1 list-none gap-[18px] px-2 py-2 pb-6"
      aria-label="Lesson path"
    >
      {steps.map((step, index) => {
        const nudge = (index % 2) * 28
        return (
          <li
            key={step.id}
            className="relative min-w-0 w-fit max-w-full"
            style={{ marginLeft: nudge, maxWidth: `calc(100% - ${nudge}px)` }}
          >
            {index > 0 && (
              <span
                className="absolute top-[-16px] left-[22px] h-4 w-1 rounded bg-magenta"
                aria-hidden
              />
            )}
            <button
              type="button"
              disabled={step.state === 'locked'}
              onClick={() => onSelect?.(step.id)}
              aria-current={step.state === 'active' ? 'step' : undefined}
              className={`flex min-h-[52px] w-fit max-w-full min-w-0 items-center gap-3 rounded-2xl border-[3px] border-ink bg-paper py-2 pr-3.5 pl-2 text-left shadow-chunky disabled:cursor-default disabled:opacity-55 disabled:shadow-none ${
                step.state === 'active'
                  ? 'animate-path-glow outline outline-4 outline-cyan outline-offset-2'
                  : ''
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-display font-bold ${
                  step.state === 'active'
                    ? 'bg-cyan'
                    : step.state === 'completed'
                      ? 'bg-success text-white'
                      : step.state === 'needs_retry'
                        ? 'bg-soft-error'
                        : 'bg-grid'
                }`}
              >
                {step.number}
              </span>
              <span className="min-w-0 text-[0.95rem] font-extrabold">{step.label}</span>
            </button>
            {step.state === 'active' && activeSlot}
          </li>
        )
      })}
    </ol>
  )
}
