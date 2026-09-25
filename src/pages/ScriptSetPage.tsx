import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { writingSetsFor, type WritingMark } from '../data/writingCharts'
import { getPhraseUnit } from '../data/fixtures'
import { languageById } from '../data/languages'
import { speakText, ttsLangFor } from '../learning/tts'
import type { RubySpan } from '../learning/ruby'
import {
  checkOptions,
  checkStage,
  comfortableMarks,
  dueWritingMarks,
  hideArabicVowels,
  hideRetrievedAid,
  loadClearedSets,
  lockedWritingSets,
  nextWritingSet,
  rateWritingMark,
  retrievedGlyphs,
  saveClearedSet,
  type CheckStage,
} from '../learning/writingProgress'
import { useAppState } from '../state/AppState'
import { PrimaryCta } from '../components/ui'
import { RubyText, SessionChrome } from '../components/SessionBits'

export function ScriptSetPage() {
  const navigate = useNavigate()
  const { profile, refreshDue } = useAppState()
  const [sets, setSets] = useState(() => writingSetsFor(profile.languageId))
  const [ready, setReady] = useState(false)
  const [marks, setMarks] = useState<WritingMark[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [failed, setFailed] = useState(false)
  const [review, setReview] = useState(false)
  const [setId, setSetId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [lockedTitle, setLockedTitle] = useState<string | null>(null)
  const [stage, setStage] = useState<CheckStage>('early')
  const [knownLine, setKnownLine] = useState<RubySpan[] | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancel = false
    void (async () => {
      const rows = writingSetsFor(profile.languageId)
      const cleared = await loadClearedSets(profile.languageId)
      const due = await dueWritingMarks(profile.languageId)
      const next = nextWritingSet(rows, cleared, profile.scriptFamiliarity)
      const locked = lockedWritingSets(rows, cleared, profile.scriptFamiliarity)
      setSets(rows)
      if (cancel) return
      const stageNow = checkStage(profile.scriptFamiliarity, next?.index ?? 0)
      setStage(stageNow)
      const known = retrievedGlyphs(rows, cleared)
      const unit = getPhraseUnit(profile.languageId)
      if (stageNow === 'comfortable' && unit?.sentenceParts?.length) {
        setKnownLine(
          hideRetrievedAid(unit.sentenceParts, known).map((part) =>
            profile.languageId === 'ar'
              ? { ...part, text: hideArabicVowels(part.text, known) }
              : part,
          ),
        )
      } else if (stageNow === 'comfortable' && unit?.targetSentence) {
        const text =
          profile.languageId === 'ar'
            ? hideArabicVowels(unit.targetSentence, known)
            : unit.targetSentence
        setKnownLine([{ text }])
      } else {
        setKnownLine(null)
      }
      if (stageNow === 'comfortable' && next) {
        setReview(false)
        setMarks(comfortableMarks(due, next.set.marks))
        setTitle(next.set.title)
        setSetId(next.set.id)
        setLockedTitle(locked[0]?.title ?? null)
      } else if (due.length) {
        setReview(true)
        setMarks(due)
        setTitle('A few marks are ready')
        setSetId(null)
      } else if (next) {
        setMarks(next.set.marks)
        setTitle(next.set.title)
        setSetId(next.set.id)
        setLockedTitle(locked[0]?.title ?? null)
      }
      setReady(true)
    })()
    return () => {
      cancel = true
    }
  }, [profile.languageId, profile.scriptFamiliarity])

  const mark = marks[index]
  const built = mark
    ? checkOptions(
        mark,
        marks.length > 1 ? marks : sets.flatMap((set) => set.marks),
        stage,
      )
    : null

  const finish = async (missed: boolean) => {
    if (!review && setId && !missed) await saveClearedSet(profile.languageId, setId)
    await refreshDue()
    setDone(true)
  }

  const advance = async (missed: boolean) => {
    const nextFailed = failed || missed
    if (nextFailed) setFailed(true)
    setPicked(null)
    setRevealed(false)
    if (index + 1 >= marks.length) {
      await finish(nextFailed)
      return
    }
    setIndex(index + 1)
  }

  if (!ready) return null

  if (!marks.length) {
    return (
      <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
        <SessionChrome stepLabel="Writing" stepNumber={1} stepTotal={1} onBack={() => navigate('/')} />
        <div className="page-pad grid gap-3">
          <h1 className="text-[1.45rem]">This sheet is retrieved</h1>
          <PrimaryCta onClick={() => navigate('/')}>Back home</PrimaryCta>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
        <SessionChrome stepLabel="Writing" stepNumber={1} stepTotal={1} onBack={() => navigate('/')} />
        <div className="page-pad grid gap-3">
          <h1 className="text-[1.45rem]">
            {failed ? 'This row stays' : review ? 'Those marks can rest' : title}
          </h1>
          <p className="font-bold">
            {failed
              ? 'A miss keeps this set. The next row does not open.'
              : review
                ? 'Home will call them again when they are due.'
                : 'That set is retrieved. The next row can start.'}
          </p>
          <PrimaryCta onClick={() => navigate('/')}>Back home</PrimaryCta>
        </div>
      </div>
    )
  }

  if (!mark || !built) return null
  const answer = built.prompt === 'reading' ? mark.reading : mark.glyph

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <SessionChrome
        stepLabel={title}
        stepNumber={index + 1}
        stepTotal={marks.length}
        onBack={() => navigate('/')}
      />
      <div className="page-pad grid gap-4">
        <p className="text-sm font-extrabold text-ink-soft">
          {languageById(profile.languageId).scriptTrackTitle}
          {lockedTitle ? ` · ${lockedTitle} stays locked` : ''}
        </p>
        {knownLine && (
          <p className="text-center text-3xl font-extrabold leading-loose">
            <RubyText
              parts={knownLine}
              dir={profile.languageId === 'ar' ? 'rtl' : undefined}
            />
          </p>
        )}
        {built.prompt === 'reading' && (
          <p className="text-center text-6xl font-extrabold">{mark.glyph}</p>
        )}
        {built.prompt === 'heard' && (
          <button
            type="button"
            className="min-h-14 rounded-2xl border-[3px] border-ink bg-paper font-extrabold shadow-chunky"
            onClick={() => speakText(mark.glyph, ttsLangFor(profile.languageId))}
          >
            Play the sound
          </button>
        )}
        {built.prompt === 'shape' && (
          <p className="text-center text-5xl font-extrabold" dir="rtl" lang="ar">
            {mark.word}
          </p>
        )}
        {built.prompt === 'mark' && (
          <p className="text-center text-4xl font-extrabold">{built.cue}</p>
        )}
        <p className="font-bold">
          {built.prompt === 'reading'
            ? 'Which reading matches this mark?'
            : built.prompt === 'heard'
              ? 'Which mark did you hear?'
              : built.prompt === 'shape'
                ? 'Which shape is in this word?'
                : 'Which mark is this?'}
        </p>
        <div className="grid gap-2">
          {built.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className="min-h-12 rounded-2xl border-[3px] border-ink bg-paper px-4 text-left text-xl font-extrabold shadow-chunky"
              onClick={() => {
                if (picked || revealed) return
                setPicked(choice)
                const hit = choice === answer
                void rateWritingMark(profile.languageId, mark, hit ? 'success' : 'fail')
                if (!hit) setFailed(true)
              }}
            >
              {choice}
            </button>
          ))}
        </div>
        {picked && (
          <p className="font-bold">{picked === answer ? 'That one.' : 'Not that one. This row stays.'}</p>
        )}
        {revealed && <p className="font-bold">The answer was {answer}. This row stays.</p>}
        <button
          type="button"
          className="min-h-11 font-extrabold text-ink-soft"
          onClick={() => {
            if (revealed || picked) return
            setRevealed(true)
            setFailed(true)
            void rateWritingMark(profile.languageId, mark, 'fail')
          }}
        >
          Reveal
        </button>
        {(picked || revealed) && (
          <PrimaryCta onClick={() => void advance(failed || revealed || picked !== answer)}>
            Continue
          </PrimaryCta>
        )}
      </div>
    </div>
  )
}
