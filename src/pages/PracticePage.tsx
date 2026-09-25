import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { hasPhraseUnit } from '../data/fixtures'
import { languageById, orthographyLabel } from '../data/languages'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta } from '../components/ui'

export function PracticePage() {
  const navigate = useNavigate()
  const { startSession, startScriptSession, profile } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const isLatin = lang.orthographyMode === 'latin-sounds'
  const phraseReady =
    hasPhraseUnit(profile.languageId) &&
    (isLatin || profile.scriptFamiliarity !== 'new')
  const ortho = orthographyLabel(lang)

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Practice
        </p>
        <h1>I&apos;ll pick the next move</h1>
        <GuideBubble name={guideName}>
          {isLatin ? (
            <>
              Phrase practice leads. {ortho} is optional reinforcement for{' '}
              {lang.name} — not a second foreign alphabet to conquer.
            </>
          ) : (
            <>
              No Vocab / Grammar / Speaking menu maze — but we do carve out{' '}
              {ortho.toLowerCase()} practice when the script is new.
            </>
          )}
        </GuideBubble>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper px-4 py-4 text-left shadow-chunky"
          onClick={() => {
            startScriptSession()
            navigate('/script')
          }}
        >
          <Pencil className="size-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="grid gap-0.5">
            <strong className="text-lg">{ortho}</strong>
            <span className="text-sm font-bold text-ink-soft">
              {lang.scriptTrackTitle} · see → practice → use
            </span>
          </span>
        </button>

        <PrimaryCta
          disabled={!phraseReady}
          onClick={() => {
            startSession()
            navigate('/session')
          }}
        >
          {phraseReady
            ? 'Start a phrase session'
            : 'Phrase session after script comfort'}
        </PrimaryCta>
      </div>
    </div>
  )
}
