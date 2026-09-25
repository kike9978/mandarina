import { Sparkles, Volume2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PhraseUnit } from '../data/fixtures'
import {
  MockConversationProvider,
  type CorrectionEvent,
} from '../learning/conversation'
import { speakText, ttsLangFor } from '../learning/tts'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta, SoftChoice } from './ui'
import { MicListen } from './MicListen'
import { HearText, SentenceFrame } from './SessionBits'

type Stage = 'brief' | 'chat' | 'clear'

interface ChatLine {
  id: string
  role: 'npc' | 'you'
  text: string
}

export function BossChallenge({
  unit,
  isStash,
  onClear,
  onSkip,
  onAttempt,
}: {
  unit: PhraseUnit
  isStash: boolean
  onClear: (usedTarget: boolean) => void
  onSkip: () => void
  onAttempt: (outcome: 'success' | 'hint' | 'fail', usedTarget: boolean) => void
}) {
  const guideName = useGuideName()
  const { profile } = useAppState()
  const langHint = ttsLangFor(profile.languageId)
  const provider = useMemo(() => new MockConversationProvider(), [])
  const brief = useMemo(() => provider.brief(unit), [provider, unit])
  const [stage, setStage] = useState<Stage>('brief')
  const [lines, setLines] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [correction, setCorrection] = useState<CorrectionEvent | null>(null)
  const [usedAny, setUsedAny] = useState(false)
  const [offlineHint, setOfflineHint] = useState(!navigator.onLine)

  const startChat = async () => {
    setBusy(true)
    setOfflineHint(!navigator.onLine)
    const opening = await provider.start(unit)
    setLines([{ id: 'npc-0', role: 'npc', text: opening.npcMessage }])
    setStage('chat')
    setBusy(false)
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    setCorrection(null)
    setLines((prev) => [
      ...prev,
      { id: `you-${prev.length}`, role: 'you', text },
    ])
    setBusy(true)
    const reply = await provider.reply(unit, text)
    if (reply.usedTarget) setUsedAny(true)
    if (reply.correction) {
      setCorrection(reply.correction)
      onAttempt('hint', Boolean(reply.usedTarget))
    } else if (reply.done) {
      onAttempt('success', Boolean(reply.usedTarget) || usedAny)
    } else {
      onAttempt(reply.usedTarget ? 'success' : 'fail', Boolean(reply.usedTarget))
    }
    setLines((prev) => [
      ...prev,
      { id: `npc-${prev.length}`, role: 'npc', text: reply.npcMessage },
    ])
    setBusy(false)
    if (reply.done) setStage('clear')
  }

  if (stage === 'brief') {
    return (
      <div className="animate-pop-in grid gap-3.5">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Boss Challenge
        </p>
        <p className="inline-flex w-fit items-center rounded-full border-2 border-dashed border-ink/50 bg-paper/80 px-2.5 py-1 text-[0.75rem] font-extrabold tracking-wide uppercase opacity-80">
          {offlineHint ? 'Offline · scripted roleplay' : 'Scripted practice · no cloud'}
        </p>
        <GuideBubble name={guideName}>
          You just learned how to {isStash ? 'use your own phrases' : 'talk about today'}.
          Want to try it in a tiny scene?
        </GuideBubble>
        <div className="rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky">
          <p className="font-display text-lg font-bold">{brief.title}</p>
          <p className="mt-1 font-bold text-ink-soft">{brief.scene}</p>
          <ul className="mt-3 m-0 grid list-none gap-1.5 p-0">
            {brief.targets.map((t) => (
              <li
                key={t}
                className="rounded-xl border-2 border-ink/35 bg-grid/50 px-3 py-2 text-sm font-extrabold"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
        <SoftChoice
          primaryLabel="Why not!"
          secondaryLabel="Nah… skip for now"
          onPrimary={() => void startChat()}
          onSecondary={onSkip}
        />
      </div>
    )
  }

  if (stage === 'clear') {
    return (
      <div className="animate-pop-in grid gap-3.5">
        <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          Challenge clear
        </p>
        <GuideBubble name={guideName}>
          You used the language in a scene — that&apos;s the point of the path.
        </GuideBubble>
        <div className="rounded-[22px] border-[3px] border-ink bg-[#e8fff4] p-4 shadow-chunky">
          <p className="flex items-center gap-2 font-display text-xl font-bold">
            <Sparkles size={20} strokeWidth={2.25} aria-hidden />
            Expressions in play
          </p>
          <SentenceFrame sentence={unit.targetSentence} gloss={unit.targetGloss} />
        </div>
        <PrimaryCta onClick={() => onClear(usedAny)}>All Clear!</PrimaryCta>
      </div>
    )
  }

  return (
    <div className="animate-pop-in grid gap-3.5">
      <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
        Boss Challenge
      </p>
      <GuideBubble name={guideName}>{brief.prompt}</GuideBubble>
      <div
        className="grid max-h-[42vh] gap-2 overflow-y-auto rounded-[22px] border-[3px] border-ink bg-paper/80 p-3"
        role="log"
        aria-live="polite"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`max-w-[92%] rounded-2xl border-[2.5px] border-ink px-3 py-2 font-bold ${
              line.role === 'you'
                ? 'ml-auto bg-cyan'
                : 'bg-paper'
            }`}
          >
            <p>
              <span className="block text-[0.7rem] font-extrabold uppercase opacity-60">
                {line.role === 'you' ? 'You' : 'Scene'}
              </span>
              {line.text}
            </p>
            {line.role === 'npc' && (
              <button
                type="button"
                className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-grid px-2.5 py-1.5 text-sm font-extrabold"
                aria-label="Hear this line"
                onClick={() => speakText(line.text, langHint)}
              >
                <Volume2 size={16} strokeWidth={2.25} aria-hidden />
                Hear
              </button>
            )}
          </div>
        ))}
      </div>
      {correction && (
        <div
          className="animate-pop-in rounded-2xl border-[3px] border-ink bg-[#fff3c4] p-3.5 shadow-chunky"
          role="status"
        >
          <p className="font-extrabold">Almost!</p>
          <p className="text-sm font-bold text-ink-soft">{correction.why}</p>
          <p className="mt-1 font-extrabold">{correction.expected}</p>
          <HearText
            text={correction.expected}
            langHint={langHint}
            label="Hear the expected line"
          />
        </div>
      )}
      <label>
        <span className="sr-only">Your reply</span>
        <textarea
          className="w-full resize-y rounded-2xl border-[3px] border-ink bg-paper p-3.5 text-[1.05rem] font-bold"
          rows={2}
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={unit.targetSentence}
        />
      </label>
      <MicListen
        target={unit.targetSentence}
        langHint={langHint}
        disabled={busy}
        onHeard={setDraft}
      />
      <PrimaryCta disabled={!draft.trim() || busy} onClick={() => void send()}>
        {busy ? 'Waiting…' : 'Send'}
      </PrimaryCta>
      <button
        type="button"
        className="min-h-11 rounded-2xl border-[2.5px] border-ink bg-grid font-extrabold"
        onClick={onSkip}
      >
        Skip for now
      </button>
    </div>
  )
}
