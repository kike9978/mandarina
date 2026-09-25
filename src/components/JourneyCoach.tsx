import { useState } from 'react'
import { getPhraseUnit } from '../data/fixtures'
import { GOALS, languageById } from '../data/languages'
import {
  appendJourney,
  buildJourneyBrief,
  buildNextLessonBrief,
  parseJourneyPack,
  parseNextLesson,
} from '../learning/journeyPack'
import { buildRetryBrief, parseRetryPack, saveRetryTasks } from '../learning/retryTasks'
import { buildNextMarksBrief, parseNextMarks, saveNextMarks } from '../learning/nextMarks'
import { useAppState } from '../state/AppState'
import { PrimaryCta } from './ui'

export function JourneyCoach() {
  const { profile } = useAppState()
  const lang = languageById(profile.languageId)
  const [languageName, setLanguageName] = useState(lang.name)
  const [paste, setPaste] = useState('')
  const [nextPaste, setNextPaste] = useState('')
  const [retryPaste, setRetryPaste] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [nextMessage, setNextMessage] = useState<string | null>(null)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [marksPaste, setMarksPaste] = useState('')
  const [marksMessage, setMarksMessage] = useState<string | null>(null)
  const retryBrief = buildRetryBrief(languageName.trim() || lang.name, [])
  const seed = getPhraseUnit(profile.languageId)
  const marksBrief = buildNextMarksBrief(
    languageName.trim() || lang.name,
    seed ? [seed.items[0]?.surface ?? ''].filter(Boolean) : [],
  )
  const goalTitle = GOALS.find((goal) => goal.id === profile.goalId)?.title ?? 'Talk about daily life'
  const known = seed ? [seed.targetSentence] : []
  const nextBrief = buildNextLessonBrief(languageName.trim() || lang.name, goalTitle, known)
  const brief = buildJourneyBrief(languageName.trim() || lang.name)
  const sameLanguage = languageName.trim().toLowerCase() === lang.name.toLowerCase()

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief)
      setMessage('Brief copied.')
    } catch {
      setMessage('Select the brief and copy it.')
    }
  }

  async function bringBack() {
    const aid = sameLanguage ? profile.languageId : undefined
    const parsed = parseJourneyPack(paste, languageName.trim() || lang.name, aid)
    if (parsed.error || !parsed.units.length) {
      setMessage(parsed.error ?? 'Nothing was imported.')
      return
    }
    const stored = await appendJourney(
      profile.languageId,
      languageName.trim() || lang.name,
      parsed.units,
    )
    setMessage(
      `Saved ${stored.units.length} units for ${stored.languageName}. Home starts the first one that is not retrieved yet.`,
    )
  }

  function loadSample() {
    if (!seed || !sameLanguage) return
    setPaste(
      JSON.stringify(
        {
          language: lang.name,
          units: [
            {
              title: seed.title,
              sentence: seed.targetSentence,
              gloss: seed.targetGloss,
              chunks: seed.buildChunks,
              ask: seed.turnPromptSurface,
              askGloss: seed.spotGlossB,
              lure: seed.buildChunks.find((chunk) => !chunk.includes(seed.turnPromptSurface)) ?? '…',
              boss: seed.focusWhy,
              reading: seed.items.find((item) => item.surface === seed.turnPromptSurface)?.reading,
            },
          ],
        },
        null,
        2,
      ),
    )
  }

  async function saveNext() {
    const aid = sameLanguage ? profile.languageId : undefined
    const parsed = parseNextLesson(nextPaste, languageName.trim() || lang.name, aid)
    if (parsed.error || !parsed.unit) {
      setNextMessage(parsed.error ?? 'Nothing was imported.')
      return
    }
    await appendJourney(profile.languageId, languageName.trim() || lang.name, [parsed.unit])
    setNextMessage(`Saved one lesson for ${goalTitle}. It does not count as known yet.`)
  }

  return (
    <>
    <section className="grid gap-2.5 rounded-[22px] border-[3px] border-ink bg-paper/90 p-4">
      <h2 className="text-[1.15rem]">Language journey</h2>
      <p className="font-bold text-ink-soft">
        Copy a brief, run it in your own chat, and paste the JSON back. A paste does not count as knowing the lines.
      </p>
      <label className="grid gap-1 font-bold">
        Language
        <input
          className="min-h-11 rounded-xl border-[2.5px] border-ink bg-paper px-3"
          value={languageName}
          onChange={(event) => setLanguageName(event.target.value)}
        />
      </label>
      <textarea className="min-h-28 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold" readOnly value={brief} />
      <button type="button" className="min-h-11 font-extrabold" onClick={() => void copyBrief()}>
        Copy the journey brief
      </button>
      <textarea
        className="min-h-28 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
        value={paste}
        onChange={(event) => setPaste(event.target.value)}
        placeholder="Paste the JSON reply"
      />
      {sameLanguage && (
        <button type="button" className="min-h-11 font-extrabold" onClick={loadSample}>
          Try a sample in {lang.name}
        </button>
      )}
      <PrimaryCta onClick={() => void bringBack()}>Save the journey</PrimaryCta>
      {message && <p className="font-bold">{message}</p>}
    </section>
    <section className="grid gap-2.5 rounded-[22px] border-[3px] border-ink bg-paper/90 p-4">
      <h2 className="text-[1.15rem]">Next lesson</h2>
      <p className="font-bold text-ink-soft">
        One new move for {goalTitle}. The paste adds a single unit and does not mark it known.
      </p>
      <textarea className="min-h-28 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold" readOnly value={nextBrief} />
      <button
        type="button"
        className="min-h-11 font-extrabold"
        onClick={() => void navigator.clipboard.writeText(nextBrief).then(() => setNextMessage('Brief copied.'))}
      >
        Copy the next-lesson brief
      </button>
      <textarea
        className="min-h-28 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
        value={nextPaste}
        onChange={(event) => setNextPaste(event.target.value)}
        placeholder="Paste one unit"
      />
      <PrimaryCta onClick={() => void saveNext()}>Save this lesson</PrimaryCta>
      {nextMessage && <p className="font-bold">{nextMessage}</p>}
    </section>
    <section className="grid gap-2.5 rounded-[22px] border-[3px] border-ink bg-paper/90 p-4">
      <h2 className="text-[1.15rem]">Retry these misses</h2>
      <p className="font-bold text-ink-soft">
        Up to three tasks. A write task comes back as writing the word, not an English tap. Saving them is not a success.
      </p>
      <textarea className="min-h-24 rounded-xl border-[2.5px] border-ink bg-paper p-3 text-sm font-bold" readOnly value={retryBrief} />
      <button
        type="button"
        className="min-h-11 font-extrabold"
        onClick={() => void navigator.clipboard.writeText(retryBrief).then(() => setRetryMessage('Brief copied.'))}
      >
        Copy the retry brief
      </button>
      <textarea
        className="min-h-20 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
        value={retryPaste}
        onChange={(event) => setRetryPaste(event.target.value)}
        placeholder="Paste the tasks JSON"
      />
      <PrimaryCta
        onClick={() => {
          const parsed = parseRetryPack(retryPaste)
          if (parsed.error || !parsed.tasks.length) {
            setRetryMessage(parsed.error ?? 'Nothing was imported.')
            return
          }
          void saveRetryTasks(profile.languageId, parsed.tasks).then(() => {
            const writing = parsed.tasks.filter((task) => task.facet === 'writing').length
            setRetryMessage(
              writing
                ? `Saved ${parsed.tasks.length} tasks. ${writing} come back as writing.`
                : `Saved ${parsed.tasks.length} tasks.`,
            )
          })
        }}
      >
        Save these retries
      </PrimaryCta>
      {retryMessage && <p className="font-bold">{retryMessage}</p>}
    </section>
    <section className="grid gap-2.5 rounded-[22px] border-[3px] border-ink bg-paper/90 p-4">
      <h2 className="text-[1.15rem]">Next marks</h2>
      <p className="font-bold text-ink-soft">
        Five marks for after the first one. The writing warm-up still starts on the first mark. Saving them is not a success.
      </p>
      <textarea className="min-h-24 rounded-xl border-[2.5px] border-ink bg-paper p-3 text-sm font-bold" readOnly value={marksBrief} />
      <button
        type="button"
        className="min-h-11 font-extrabold"
        onClick={() => void navigator.clipboard.writeText(marksBrief).then(() => setMarksMessage('Brief copied.'))}
      >
        Copy the marks brief
      </button>
      <textarea
        className="min-h-20 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
        value={marksPaste}
        onChange={(event) => setMarksPaste(event.target.value)}
        placeholder="Paste the marks JSON"
      />
      <PrimaryCta
        onClick={() => {
          const parsed = parseNextMarks(marksPaste, sameLanguage ? profile.languageId : undefined)
          if (parsed.error || !parsed.marks.length) {
            setMarksMessage(parsed.error ?? 'Nothing was imported.')
            return
          }
          void saveNextMarks(profile.languageId, parsed.marks).then(() => {
            setMarksMessage(`Saved ${parsed.marks.length} marks. The warm-up drills them after the first one.`)
          })
        }}
      >
        Save these marks
      </PrimaryCta>
      {marksMessage && <p className="font-bold">{marksMessage}</p>}
    </section>
    </>
  )
}
