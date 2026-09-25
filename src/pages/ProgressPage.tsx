import { useEffect, useState } from 'react'
import { PLAYABLE_ABILITY_IDS } from '../data/fixtures'
import { loadSaidSentences } from '../learning/saidSentences'
import { languageById } from '../data/languages'
import { db } from '../db/mandarinaDb'
import { useAppState, useGuideName } from '../state/AppState'
import { AbilityList } from '../components/AbilityList'
import { GuideBubble } from '../components/ui'

interface JourneyStats {
  sessionsDone: number
  attempts: number
  stashCount: number
  written: number
}

export function ProgressPage() {
  const { abilities, profile, stash, listeningSources, bossClears } = useAppState()
  const heardIds = [
    ...new Set(
      listeningSources.filter((s) => s.status === 'practiced').map((s) => s.abilityId),
    ),
  ]
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const playable = abilities.filter((a) =>
    (PLAYABLE_ABILITY_IDS as readonly string[]).includes(a.id),
  )
  const cleared = playable.filter((a) => a.status === 'done').length
  const scriptAbilities = playable.filter((a) => a.kind === 'script')
  const speakAbilities = playable.filter((a) => a.kind !== 'script')
  const [stats, setStats] = useState<JourneyStats>({
    sessionsDone: 0,
    attempts: 0,
    stashCount: stash.length,
    written: 0,
  })
  const [said, setSaid] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const sessions = await db.sessions
        .where('languageId')
        .equals(profile.languageId)
        .toArray()
      const done = sessions.filter((s) => s.endedAt).length
      const attempts = await db.attempts.count()
      const writingWins = await db.attempts
        .filter((a) => a.facet === 'writing' && a.outcome === 'success')
        .toArray()
      const written = new Set(
        writingWins.map((a) => a.itemId).filter(Boolean),
      ).size
      const lines = await loadSaidSentences(profile.languageId)
      if (!cancelled) {
        setStats({
          sessionsDone: done,
          attempts,
          stashCount: stash.length,
          written,
        })
        setSaid(lines)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile.languageId, stash.length, abilities])

  return (
    <div className="atmosphere-sunburst flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Progress
        </p>
        <h1>
          {lang.name} · {cleared} lesson{cleared === 1 ? '' : 's'} cleared
        </h1>
        <p className="leading-snug font-bold text-ink-soft">You can now…</p>
        <GuideBubble name={guideName}>
          {lang.orthographyMode === 'latin-sounds'
            ? 'Phrases lead. Sounds & spelling are optional polish — not a second alphabet.'
            : 'Script skills and speaking skills both count. Light up the sky by reading marks and using language.'}
        </GuideBubble>
        <div
          className="animate-pop-in relative h-[140px] overflow-hidden rounded-[22px] border-[3px] border-ink bg-[rgba(20,24,60,0.88)] shadow-chunky"
          aria-hidden
        >
          {playable.map((a, i) => (
            <span
              key={a.id}
              className={`absolute size-2.5 rounded-full ${
                a.status === 'done'
                  ? 'bg-[#9bff6a] shadow-[0_0_10px_rgba(155,255,106,0.8)]'
                  : a.status === 'partial'
                    ? 'bg-cyan shadow-[0_0_8px_rgba(46,196,214,0.7)]'
                    : 'bg-white/25'
              }`}
              style={{
                left: `${12 + ((i * 37) % 70)}%`,
                top: `${18 + ((i * 29) % 55)}%`,
              }}
            />
          ))}
        </div>

        <ul className="m-0 grid list-none gap-2 p-0">
          <li className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold">
            Paths finished · {stats.sessionsDone}
          </li>
          <li className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold">
            Practice moments · {stats.attempts}
          </li>
          <li className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold">
            Phrases in your stash · {stats.stashCount}
          </li>
          <li className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold">
            Used in a scene · {bossClears}
          </li>
          <li className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold">
            {lang.orthographyMode === 'latin-sounds'
              ? `Spellings you can write · ${stats.written}`
              : `Marks you can write · ${stats.written}`}
          </li>
        </ul>

        <h2 className="text-lg">
          {lang.orthographyMode === 'latin-sounds'
            ? 'Sounds & spelling'
            : 'Writing system'}
        </h2>
        <AbilityList abilities={scriptAbilities} />
        <h2 className="text-lg">Speaking</h2>
        {said.length > 0 && (
          <ul className="m-0 grid list-none gap-2 p-0">
            {said.map((line) => (
              <li
                key={line}
                className="rounded-2xl border-[2.5px] border-ink bg-paper/90 px-3.5 py-3 font-bold"
              >
                I can say {line}
              </li>
            ))}
          </ul>
        )}
        <AbilityList abilities={speakAbilities} heardIds={heardIds} />
      </div>
    </div>
  )
}
