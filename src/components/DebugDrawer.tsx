import { useEffect, useState } from 'react'
import { Bug, Clock, RotateCcw, TimerReset, X } from 'lucide-react'
import { db } from '../db/mandarinaDb'
import { debugForceDue, listDueFacets } from '../learning/fsrsAdapter'
import { useAppState } from '../state/AppState'

/** Dev-only observability — never shown in production builds. */
export function DebugDrawer() {
  const {
    profile,
    dueCount,
    sessionKind,
    currentActivity,
    activeUnit,
    lastActiveAt,
    stash,
  } = useAppState()
  const [open, setOpen] = useState(false)
  const [dues, setDues] = useState<
    { surface: string; facet: string; itemId: string }[]
  >([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const refreshDues = () =>
    listDueFacets(profile.languageId, 12).then((rows) =>
      setDues(
        rows.map((r) => ({
          surface: r.surface,
          facet: r.facet,
          itemId: r.itemId,
        })),
      ),
    )

  useEffect(() => {
    if (!open) return
    void refreshDues()
  }, [open, profile.languageId, dueCount])

  if (!import.meta.env.DEV) return null

  return (
    <>
      <button
        type="button"
        className="fixed bottom-20 right-3 z-[80] grid size-11 place-items-center rounded-full border-[2.5px] border-ink bg-[#fff3c4] shadow-chunky-sm lg:bottom-6"
        aria-label="Open debug drawer"
        onClick={() => setOpen(true)}
      >
        <Bug size={18} strokeWidth={2.25} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-3 lg:items-center">
          <div
            className="atmosphere-grid max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky"
            role="dialog"
            aria-label="Debug drawer"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg">Debug (dev only)</h2>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-[12px] border-2 border-ink bg-paper"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            <dl className="m-0 grid list-none gap-2 p-0 text-sm font-bold">
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">Language</dt>
                <dd>{profile.languageId}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">Session</dt>
                <dd>
                  {sessionKind ?? '—'} · {currentActivity}
                </dd>
              </div>
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">Unit</dt>
                <dd>{activeUnit?.id ?? '—'}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">Due facets (reviewed)</dt>
                <dd>{dueCount}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">lastActiveAt</dt>
                <dd className="break-all">{lastActiveAt ?? '—'}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink/40 bg-white/70 px-3 py-2">
                <dt className="opacity-60">Stash rows</dt>
                <dd>{stash.length}</dd>
              </div>
            </dl>

            <h3 className="mt-4 text-base">Due queue</h3>
            {dues.length === 0 ? (
              <p className="text-sm font-bold text-ink-soft">
                None — use Force due below, or practice then fail/reveal.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-1.5 p-0 text-sm font-bold">
                {dues.map((d) => (
                  <li
                    key={`${d.itemId}:${d.facet}`}
                    className="rounded-lg border border-ink/30 bg-white/80 px-2 py-1.5"
                  >
                    {d.surface} · {d.facet}
                  </li>
                ))}
              </ul>
            )}

            {note && (
              <p className="mt-3 rounded-xl border-2 border-ink bg-[#e8fff4] px-3 py-2 text-sm font-extrabold">
                {note}
              </p>
            )}

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-cyan px-3 font-extrabold disabled:opacity-60"
                onClick={() => {
                  setBusy(true)
                  void debugForceDue(profile.languageId, 3)
                    .then(async (n) => {
                      setNote(`Forced ${n} recognition facets due. Reloading…`)
                      await refreshDues()
                      window.setTimeout(() => window.location.reload(), 600)
                    })
                    .finally(() => setBusy(false))
                }}
              >
                <TimerReset size={16} strokeWidth={2.25} aria-hidden />
                Force due (3) & reload
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-grid px-3 font-extrabold disabled:opacity-60"
                onClick={() => {
                  setBusy(true)
                  void (async () => {
                    const stamp = new Date(
                      Date.now() - 6 * 24 * 60 * 60 * 1000,
                    ).toISOString()
                    await db.profiles.update('local', { lastActiveAt: stamp })
                    setNote('Absence set to 6 days ago. Reloading…')
                    window.setTimeout(() => window.location.reload(), 600)
                  })().finally(() => setBusy(false))
                }}
              >
                <Clock size={16} strokeWidth={2.25} aria-hidden />
                Simulate 6-day absence & reload
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-[#ffb4a8] px-3 font-extrabold disabled:opacity-60"
                onClick={() => {
                  setBusy(true)
                  void (async () => {
                    await db.delete()
                    window.location.reload()
                  })()
                }}
              >
                <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
                Reset local DB & reload
              </button>
            </div>
            <p className="mt-2 text-xs font-bold text-ink-soft">
              Learner UI never shows FSRS jargon — this drawer is for tuning
              only.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
