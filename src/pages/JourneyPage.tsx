import { useNavigate } from 'react-router-dom'
import { getPhraseUnit } from '../data/fixtures'
import { hasWritingChart } from '../data/writingCharts'
import { languageById, orthographyLabel } from '../data/languages'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta } from '../components/ui'
import { ListeningPost } from '../components/ListeningPost'
import { PathMap } from '../components/PathMap'

export function JourneyPage() {
  const navigate = useNavigate()
  const {
    steps,
    scriptSteps,
    profile,
    needsScriptFirst,
    activeUnit,
    sessionStarted,
    sessionCleared,
    scriptSessionStarted,
    startSession,
    startScriptSession,
    abilities,
  } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const seedUnit = getPhraseUnit(profile.languageId)
  const unit = activeUnit ?? seedUnit
  const isLatin = lang.orthographyMode === 'latin-sounds'
  const ortho = orthographyLabel(lang)
  const canResume = sessionStarted && !!activeUnit && !sessionCleared
  const talkDone = abilities.find((a) => a.id === 'talk-today')?.status === 'done'
  const scriptDone =
    abilities.find((a) => a.id === 'script-basics')?.status === 'done'

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

        {!unit && (
          <div className="atmosphere-grid min-w-0 max-w-full rounded-[22px] border-[3px] border-ink p-3 shadow-chunky">
            <p className="mb-2 px-1 text-sm font-extrabold tracking-wide uppercase">
              Hear this in the wild
            </p>
            <ListeningPost />
          </div>
        )}

        {unit && (
          <div className="atmosphere-grid min-w-0 max-w-full rounded-[22px] border-[3px] border-ink p-3 shadow-chunky">
            <p className="mb-2 px-1 text-sm font-extrabold tracking-wide uppercase">
              Current focus: {unit.title}
              {talkDone ? ' · checkpoint cleared' : ''}
            </p>
            <PathMap
              steps={steps}
              onSelect={
                canResume
                  ? () => navigate('/session')
                  : undefined
              }
              activeSlot={<ListeningPost />}
            />
            {seedUnit && (
              <PrimaryCta
                onClick={() => {
                  if (canResume) {
                    navigate('/session')
                    return
                  }
                  startSession()
                  navigate('/session')
                }}
              >
                {canResume ? 'Resume this path' : 'Walk this path'}
              </PrimaryCta>
            )}
          </div>
        )}

        <div className="atmosphere-grid min-w-0 max-w-full rounded-[22px] border-[3px] border-ink p-3 shadow-chunky">
          <p className="mb-2 px-1 text-sm font-extrabold tracking-wide uppercase">
            {lang.scriptTrackTitle}
            {isLatin ? ' (optional)' : ''}
            {scriptDone ? ' · warm-up done' : ''}
          </p>
          <PathMap
            steps={scriptSteps}
            onSelect={
              scriptSessionStarted
                ? () => navigate('/script')
                : undefined
            }
          />
          {hasWritingChart(profile.languageId) && (
            <button
              type="button"
              className="mt-2 min-h-12 w-full rounded-2xl border-[3px] border-ink bg-paper px-4 font-extrabold shadow-chunky"
              onClick={() => navigate('/chart')}
            >
              Open the writing chart
            </button>
          )}
          {(needsScriptFirst || isLatin) && !scriptDone && (
            <button
              type="button"
              className="mt-2 min-h-12 w-full rounded-2xl border-[3px] border-ink bg-grid px-4 font-extrabold shadow-chunky"
              onClick={() => {
                startScriptSession()
                navigate('/script')
              }}
            >
              {isLatin ? 'Warm up sounds' : 'Practice the writing system'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
