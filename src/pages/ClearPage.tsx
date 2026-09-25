import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  return (
    <div className="atmosphere-mint flex min-h-full flex-1 flex-col">
      <div className="page-pad grid flex-1 content-center gap-3 text-center">
        <CheckpointBadge
          title="All Clear!"
          subtitle={`Checkpoints · ${activeUnit?.title ?? 'Lesson'}`}
        />
        <p className="animate-pop-in leading-snug font-bold">
          {today} · Traveler: {profile.displayName}
        </p>
        <p className="animate-pop-in leading-snug font-bold">
          {bossSkipped
            ? `You left the scene. Skipping is not using the line.${activeUnit?.targetSentence ? ` You still said ${activeUnit.targetSentence}` : ''}`
            : sessionKind === 'listen'
              ? 'Those wild lines got a real practice pass — the post is lit now.'
              : isStash
                ? 'Your stashed phrases got a real practice pass — not a flashcard dump.'
                : 'You moved from meeting the sentence to saying it yourself. Nice work.'}
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
