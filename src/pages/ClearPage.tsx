import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearJourneyUnit } from '../learning/journeyPack'
import { rememberSaidSentence } from '../learning/saidSentences'
import { useAppState } from '../state/AppState'
import { CheckpointBadge, PrimaryCta } from '../components/ui'

export function ClearPage() {
  const navigate = useNavigate()
  const { resetSession, profile, activeUnit, sessionKind } = useAppState()
  const today = new Date().toLocaleDateString()
  const isStash = sessionKind === 'stash' || sessionKind === 'listen'
  const [bossSkipped] = useState(() => {
    const skipped = sessionStorage.getItem('mandarina-boss-skipped') === '1'
    if (skipped) sessionStorage.removeItem('mandarina-boss-skipped')
    return skipped
  })
  const [said] = useState(() => {
    const line = sessionStorage.getItem('mandarina-said-sentence')
    if (line) sessionStorage.removeItem('mandarina-said-sentence')
    return line
  })

  useEffect(() => {
    if (!said) return
    void rememberSaidSentence(profile.languageId, said)
    if (activeUnit?.id.startsWith('journey:') && said === activeUnit.targetSentence) {
      void clearJourneyUnit(profile.languageId, activeUnit.id)
    }
  }, [activeUnit, profile.languageId, said])

  const produced = said && !bossSkipped ? said : null

  return (
    <div className="atmosphere-mint flex min-h-full flex-1 flex-col">
      <div className="page-pad grid flex-1 content-center gap-3 text-center">
        <CheckpointBadge
          title={produced ?? 'Lesson done'}
          subtitle={produced ? 'I can say this' : activeUnit?.title ?? 'Lesson'}
        />
        <p className="animate-pop-in leading-snug font-bold">
          {today} · Traveler: {profile.displayName}
        </p>
        <p className="animate-pop-in leading-snug font-bold">
          {bossSkipped
            ? 'You left the scene. Skipping is not using the line.'
            : produced
              ? `I can say ${produced}`
              : sessionKind === 'listen'
                ? 'Those lines got a practice pass. Saying one yourself is what earns “I can.”'
                : isStash
                  ? 'Those stashed lines got a practice pass. Saying one yourself is what earns “I can.”'
                  : 'You met the sentence. Saying it yourself is what earns “I can.”'}
        </p>
        <PrimaryCta
          onClick={() => {
            resetSession()
            navigate(isStash ? '/stash' : '/')
          }}
        >
          {isStash ? 'Back to stash' : 'Back to Home'}
        </PrimaryCta>
        <button
          type="button"
          className="min-h-11 text-sm font-extrabold text-ink-soft underline decoration-2 underline-offset-4"
          onClick={() => {
            resetSession()
            navigate('/stash#tutor')
          }}
        >
          Want more phrases?
        </button>
      </div>
    </div>
  )
}
