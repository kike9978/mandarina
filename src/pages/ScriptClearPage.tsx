import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasPhraseUnit } from '../data/fixtures'
import { writingSetsFor } from '../data/writingCharts'
import { languageById, orthographyLabel } from '../data/languages'
import { loadClearedSets, retrievedGlyphs } from '../learning/writingProgress'
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
  const [readable, setReadable] = useState<string[]>([])

  useEffect(() => {
    let cancel = false
    void (async () => {
      const cleared = await loadClearedSets(profile.languageId)
      const glyphs = [...retrievedGlyphs(writingSetsFor(profile.languageId), cleared)]
      if (!cancel) setReadable(glyphs)
    })()
    return () => {
      cancel = true
    }
  }, [profile.languageId])

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
          {readable.length
            ? `I can read ${readable.join(' ')}.`
            : lang.orthographyMode === 'latin-sounds'
              ? 'The sound warm-up is done. A retrieved spelling is what earns “I can read.”'
              : 'The writing warm-up is done. A retrieved mark is what earns “I can read.”'}
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
