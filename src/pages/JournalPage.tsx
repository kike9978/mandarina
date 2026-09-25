import { getPhraseUnit } from '../data/fixtures'
import { journalWords } from '../learning/journalWords'
import { useAppState, useGuideName } from '../state/AppState'
import { AidedText, RubyText } from '../components/SessionBits'
import { GuideBubble } from '../components/ui'

export function JournalPage() {
  const { profile, stash } = useAppState()
  const guideName = useGuideName()
  const unit = getPhraseUnit(profile.languageId)
  const words = journalWords(profile.languageId, [
    ...(unit?.items ?? []).map((item) => ({
      surface: item.surface,
      reading: item.reading,
      gloss: item.gloss,
    })),
    ...stash.map((phrase) => ({
      surface: phrase.surface,
      reading: phrase.reading,
      gloss: phrase.gloss,
    })),
  ])

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad grid gap-3">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Journal
        </p>
        <h1>Words you can use</h1>
        <GuideBubble name={guideName}>
          These are words you already met. The writing page is not here yet.
          Nothing on this list is a grade.
        </GuideBubble>
        {words.length === 0 ? (
          <p className="leading-snug font-bold">
            No words yet. Finish a lesson or stash a phrase, then they show up
            here.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {unit?.sentenceParts && unit.sentenceParts.length > 0 ? (
              <li className="rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold">
                <RubyText
                  parts={unit.sentenceParts}
                  dir={profile.languageId === 'ar' ? 'rtl' : undefined}
                />
                <p className="text-sm text-ink-soft">{unit.targetGloss}</p>
              </li>
            ) : unit?.targetSentence ? (
              <li className="rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold">
                <AidedText
                  languageId={profile.languageId}
                  text={unit.targetSentence}
                />
                <p className="text-sm text-ink-soft">{unit.targetGloss}</p>
              </li>
            ) : null}
            {words.map((word) => (
              <li
                key={word.surface}
                className="rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold"
              >
                <AidedText
                  languageId={profile.languageId}
                  text={word.surface}
                  reading={word.reading}
                />
                <p className="text-sm text-ink-soft">{word.gloss}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
