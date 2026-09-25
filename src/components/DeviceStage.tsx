import type { ReactNode } from 'react'

/**
 * Mobile-first stage: edge-to-edge on phones; centered framed “device”
 * on tablet/desktop so wide viewports stay intentional, not a thin strip.
 */
export function DeviceStage({ children }: { children: ReactNode }) {
  return (
    <div className="atmosphere-grid relative flex min-h-dvh w-full justify-center overflow-x-hidden md:items-stretch md:px-4 md:py-0 lg:items-center lg:px-6 lg:py-6">
      <div
        className={[
          'app-stage relative flex w-full min-h-dvh min-w-0 max-w-full flex-col overflow-hidden',
          'sm:max-w-md',
          'md:max-w-[430px] md:min-h-dvh',
          'lg:max-w-[430px] lg:h-[min(844px,calc(100dvh-3rem))] lg:min-h-[min(844px,calc(100dvh-3rem))] lg:max-h-[min(900px,calc(100dvh-3rem))]',
          'lg:rounded-[28px] lg:border-[3px] lg:border-ink lg:shadow-chunky',
          'xl:max-w-[460px]',
        ].join(' ')}
      >
        <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
          {children}
        </div>
      </div>
    </div>
  )
}
