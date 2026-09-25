import { getPhraseUnit, SCRIPT_SESSION_STEPS } from '../data/fixtures'
import { languageById, orthographyLabel } from '../data/languages'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble } from '../components/ui'
import { PathMap } from '../components/PathMap'

export function JourneyPage() {
  const { steps, scriptSteps, profile, needsScriptFirst } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const unit = getPhraseUnit(profile.languageId)
  const scriptPath = needsScriptFirst ? scriptSteps : SCRIPT_SESSION_STEPS
  const isLatin = lang.orthographyMode === 'latin-sounds'
  const ortho = orthographyLabel(lang)

  return (
    <div className="atmosphere-split flex min-h-full w-full min-w-0 max-w-full flex-1 flex-col">
      <div className="page-pad">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Your learning journey
        </p>
        <h1>Getting around daily life</h1>
        <p className="leading-snug font-bold text-ink-soft">
          Language: <strong className="text-ink">{lang.name}</strong>
        </p>
        <GuideBubble name={guideName}>
          {isLatin ? (
            <>
              <strong>Phrases</strong> are the main rail. {ortho} stays a side
              path for digraphs and spelling — same Latin letters you already
              know.
            </>
          ) : (
            <>
              Two rails: <strong>{ortho.toLowerCase()}</strong> and{' '}
              <strong>phrase journey</strong>. Marks first when the script is
              new.
            </>
          )}
        </GuideBubble>

        {unit && (
          <div className="atmosphere-grid min-w-0 max-w-full rounded-[22px] border-[3px] border-ink p-3 shadow-chunky">
            <p className="mb-2 px-1 text-sm font-extrabold tracking-wide uppercase">
              Current focus: {unit.title}
            </p>
            <PathMap steps={steps} />
          </div>
        )}

        <div className="atmosphere-grid min-w-0 max-w-full rounded-[22px] border-[3px] border-ink p-3 shadow-chunky">
          <p className="mb-2 px-1 text-sm font-extrabold tracking-wide uppercase">
            {lang.scriptTrackTitle}
            {isLatin ? ' (optional)' : ''}
          </p>
          <PathMap steps={scriptPath} />
        </div>
      </div>
    </div>
  )
}
