import { useNavigate } from 'react-router-dom'
import { hasPhraseUnit } from '../data/fixtures'
import { languageById, orthographyLabel } from '../data/languages'
import { useAppState, useGuideName } from '../state/AppState'
import { CheckpointBadge, GuideBubble, PrimaryCta } from '../components/ui'

export function ScriptClearPage() {
  const navigate = useNavigate()
  const { resetScriptSession, profile, startSession } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const today = new Date().toLocaleDateString()
  const canPhrase = hasPhraseUnit(profile.languageId)
  const ortho = orthographyLabel(lang)

  return (
    <div className="atmosphere-mint flex min-h-full flex-1 flex-col">
      <div className="page-pad grid flex-1 content-center gap-4 text-center">
        <CheckpointBadge
          title="All Clear!"
          subtitle={`${ortho} · ${lang.scriptTrackTitle}`}
        />
        <p className="animate-pop-in font-bold">
          {today} · Traveler: {profile.displayName}
        </p>
        <GuideBubble name={guideName}>
          {lang.orthographyMode === 'latin-sounds'
            ? `${lang.name} sounds locked in. Phrases are waiting.`
            : 'Writing warm-up locked in. Phrases will feel less scary now.'}
        </GuideBubble>
        {canPhrase ? (
          <PrimaryCta
            onClick={() => {
              resetScriptSession()
              startSession()
              navigate('/session')
            }}
          >
            Continue into today&apos;s phrases
          </PrimaryCta>
        ) : (
          <PrimaryCta
            onClick={() => {
              resetScriptSession()
              navigate('/')
            }}
          >
            Back to Home
          </PrimaryCta>
        )}
        {canPhrase && (
          <button
            type="button"
            className="min-h-11 rounded-2xl border-[3px] border-ink bg-grid font-extrabold shadow-chunky"
            onClick={() => {
              resetScriptSession()
              navigate('/')
            }}
          >
            Home for now
          </button>
        )}
      </div>
    </div>
  )
}
