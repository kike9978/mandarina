import { useNavigate } from 'react-router-dom'
import { searchDictionary } from '../learning/dictionary'
import { stashPracticeCap } from '../learning/templateBridge'
import { useAppState, useGuideName } from '../state/AppState'
import { PackImport, StashSheet } from '../components/StashTools'
import { GuideBubble, PrimaryCta } from '../components/ui'
import { useMemo, useState } from 'react'

export function StashPage() {
  const { stash, addStash, importPhrases, startStashSession } = useAppState()
  const guideName = useGuideName()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const hits = useMemo(() => searchDictionary(query), [query])
  const practiceCount = Math.min(stash.length, stashPracticeCap())
  const withExample = stash.filter((s) => s.exampleSentence?.trim()).length

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          My phrases
        </p>
        <h1>Stash & packs</h1>
        <GuideBubble name={guideName}>
          Home still leads with Continue. This is your side pocket — stash what
          you meet out in the wild, then practice it on the same path.
        </GuideBubble>

        <StashSheet
          onSave={(data) => {
            addStash({ ...data, source: 'user' })
            setSavedFlash(true)
            window.setTimeout(() => setSavedFlash(false), 1800)
          }}
        />
        {savedFlash && (
          <p className="animate-pop-in rounded-xl border-2 border-ink bg-[#e8fff4] p-2.5 font-extrabold">
            Stashed! Hit Practice these when you want to lock it in.
          </p>
        )}

        <PackImport onImport={importPhrases} />

        <section className="grid gap-2.5">
          <h2 className="text-[1.15rem]">Local look-up</h2>
          <input
            className="min-h-11 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the pocket dictionary"
            aria-label="Dictionary search"
          />
          <ul className="m-0 grid list-none gap-2 p-0">
            {hits.map((h) => (
              <li
                key={h.surface}
                className="flex items-center justify-between gap-3 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold"
              >
                <div>
                  <strong>{h.surface}</strong>
                  {h.reading && <span> · {h.reading}</span>}
                  <p>{h.gloss}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
                  onClick={() =>
                    addStash({
                      surface: h.surface,
                      gloss: h.gloss,
                      reading: h.reading,
                      source: 'lookup',
                    })
                  }
                >
                  Stash
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-2.5">
          <h2 className="text-[1.15rem]">Library</h2>
          {stash.length === 0 ? (
            <p className="leading-snug font-bold text-ink-soft">
              Nothing stashed yet — add a phrase above.
            </p>
          ) : (
            <>
              <ul className="m-0 grid list-none gap-2 p-0">
                {stash.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col items-start gap-0.5 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold"
                  >
                    <strong>{s.surface}</strong>
                    <span>{s.gloss}</span>
                    {s.exampleSentence ? (
                      <span className="text-sm text-ink-soft">
                        {s.exampleSentence}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-soft">
                        No example yet — Build It stays locked
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-bold text-ink-soft">
                Practice queues up to {stashPracticeCap()} recent phrases
                {withExample === 0
                  ? ' · recognition path (add an example to unlock Build It)'
                  : ''}
                .
              </p>
              <PrimaryCta
                onClick={() => {
                  startStashSession()
                  navigate('/session')
                }}
              >
                Practice these · {practiceCount}
              </PrimaryCta>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
