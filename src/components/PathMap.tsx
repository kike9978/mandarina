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
}: {
  steps: PathMapStep[]
  onSelect?: (id: string) => void
}) {
  return (
    <ol className="m-0 grid list-none gap-[18px] px-2 py-2 pb-6" aria-label="Lesson path">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="relative w-fit max-w-[calc(100%-8px)]"
          style={{ marginLeft: `${(index % 2) * 28}px` }}
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
            className={`flex min-h-[52px] items-center gap-3 rounded-2xl border-[3px] border-ink bg-paper py-2 pr-3.5 pl-2 text-left shadow-chunky disabled:cursor-default disabled:opacity-55 disabled:shadow-none ${
              step.state === 'active'
                ? 'animate-path-glow outline outline-4 outline-cyan outline-offset-2'
                : ''
            }`}
          >
            <span
              className={`grid size-9 place-items-center rounded-full border-[2.5px] border-ink font-display font-bold ${
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
            <span className="text-[0.95rem] font-extrabold">{step.label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
