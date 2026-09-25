import { NavLink } from 'react-router-dom'
import { Compass, Dumbbell, Home, Map } from 'lucide-react'
import type { ReactNode } from 'react'

const tabs: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/journey', label: 'Journey', icon: Map },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: Compass },
]

export function AppShell({
  children,
  hideNav = false,
}: {
  children: ReactNode
  hideNav?: boolean
}) {
  return (
    <div
      className={`relative flex min-h-dvh w-full min-w-0 max-w-full flex-1 flex-col lg:min-h-0 lg:h-full ${
        hideNav
          ? ''
          : 'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <main className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-y-auto overscroll-contain">
        {children}
      </main>
      {!hideNav && (
        <nav
          className="absolute inset-x-2 bottom-2 z-40 grid grid-cols-4 gap-1 rounded-2xl border-[3px] border-ink bg-paper px-1.5 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-chunky-sm"
          aria-label="Main"
        >
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.72rem] font-extrabold no-underline sm:text-xs ${
                  isActive
                    ? 'bg-cyan text-ink ring-2 ring-ink ring-inset'
                    : 'text-ink-soft'
                }`
              }
            >
              <Icon className="size-[22px]" strokeWidth={2.25} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
