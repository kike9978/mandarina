import type { Ability } from '../data/fixtures'

const mark = {
  done: '✓',
  partial: '◐',
  locked: '○',
} as const

export function AbilityList({ abilities }: { abilities: Ability[] }) {
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {abilities.map((a) => (
        <li
          key={a.id}
          className={`flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold ${
            a.status === 'locked' ? 'opacity-65' : ''
          }`}
        >
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink text-[0.9rem] ${
              a.status === 'done'
                ? 'bg-success text-white'
                : a.status === 'partial'
                  ? 'bg-cyan'
                  : ''
            }`}
            aria-hidden
          >
            {mark[a.status]}
          </span>
          <span>{a.title}</span>
        </li>
      ))}
    </ul>
  )
}
