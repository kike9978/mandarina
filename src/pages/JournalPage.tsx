import { NotebookPen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPhraseUnit } from '../data/fixtures'
import { GOALS, languageById } from '../data/languages'
import { journalWords } from '../learning/journalWords'
import { readingSpans } from '../learning/readingAid'
import {
  applyJournalPrompt,
  buildJournalLineBrief,
  buildJournalPromptBrief,
  entrySentences,
  loadJournalEntries,
  loadJournalPrompt,
  parseJournalNote,
  parseJournalPrompt,
  reusedWordCount,
  saveJournalEntries,
  saveJournalPrompt,
  suggestJournalPrompt,
  withJournalNote,
  type JournalEntry,
  type JournalNote,
} from '../learning/journal'
import { loadSaidSentences } from '../learning/saidSentences'
import { useAppState, useGuideName } from '../state/AppState'
import { AidedText, RubyText } from '../components/SessionBits'
import { GuideBubble, PrimaryCta } from '../components/ui'

export function JournalPage() {
  const { profile, stash } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const unit = getPhraseUnit(profile.languageId)
  const goalTitle = GOALS.find((goal) => goal.id === profile.goalId)?.title ?? 'Talk about daily life'
  const [said, setSaid] = useState<string[] | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [promptOverride, setPromptOverride] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [draftNotes, setDraftNotes] = useState<JournalNote[]>([])
  const [promptPaste, setPromptPaste] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [notePaste, setNotePaste] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    void Promise.all([
      loadSaidSentences(profile.languageId),
      loadJournalEntries(profile.languageId),
      loadJournalPrompt(profile.languageId),
    ]).then(([sentences, stored, prompt]) => {
      if (cancel) return
      setSaid(sentences)
      setEntries(stored)
      setPromptOverride(prompt)
    })
    return () => {
      cancel = true
    }
  }, [profile.languageId])

  const words = journalWords(profile.languageId, [
    ...(unit?.items ?? []).map((item) => ({
      surface: item.surface,
      reading: item.reading,
      gloss: item.gloss,
    })),
    ...stash.map((phrase) => ({
      surface: phrase.surface,
      reading: phrase.reading,
      gloss: phrase.gloss,
    })),
  ])
  const knownSentences = said ?? []
  const ready = knownSentences.length > 0
  const suggestion = suggestJournalPrompt({
    goalTitle,
    sentences: knownSentences,
    glosses: words.map((word) => word.gloss),
  })
  const prompt = promptOverride ?? suggestion
  const promptBrief = buildJournalPromptBrief({
    languageName: lang.name,
    goalTitle,
    known: words.map((word) => word.surface),
  })
  const count = reusedWordCount(body, words.map((word) => word.surface))
  const draftSentences = entrySentences(body)
  const open = entries.find((entry) => entry.id === openId) ?? null
  const noteTarget = selected
  const lineBrief =
    noteTarget && ready
      ? buildJournalLineBrief({ languageName: lang.name, sentence: noteTarget })
      : ''
  const dir = profile.languageId === 'ar' ? 'rtl' : undefined

  async function saveEntry() {
    const text = body.trim()
    if (!text) {
      setMessage('Write a line first. Nothing was saved.')
      return
    }
    const entry: JournalEntry = {
      id: `journal-${Date.now()}`,
      body: text,
      prompt,
      createdAt: new Date().toISOString(),
      notes: draftNotes,
    }
    const next = [entry, ...entries]
    await saveJournalEntries(profile.languageId, next)
    setEntries(next)
    setBody('')
    setDraftNotes([])
    setSelected(null)
    setMessage('Saved on this device. This does not count as knowing it.')
  }

  async function replacePrompt() {
    const parsed = parseJournalPrompt(promptPaste, knownSentences)
    if (parsed.error || !parsed.prompt) {
      setMessage(parsed.error ?? 'Nothing was imported.')
      return
    }
    const applied = applyJournalPrompt(parsed.prompt)
    await saveJournalPrompt(profile.languageId, applied.prompt)
    setPromptOverride(applied.prompt)
    setBody(applied.body)
    setDraftNotes([])
    setPromptPaste('')
    setSelected(null)
    setMessage('Prompt replaced. The page is empty until you write.')
  }

  async function addNote() {
    if (!noteTarget) return
    const parsed = parseJournalNote(notePaste, noteTarget)
    if (parsed.error || !parsed.hint) {
      setMessage(parsed.error ?? 'Nothing was added.')
      return
    }
    if (open) {
      const next = entries.map((entry) =>
        entry.id === open.id ? withJournalNote(entry, noteTarget, parsed.hint!) : entry,
      )
      await saveJournalEntries(profile.languageId, next)
      setEntries(next)
    } else {
      setDraftNotes((notes) => [...notes, { sentence: noteTarget, hint: parsed.hint! }])
    }
    setNotePaste('')
    setMessage('Note added. Your words stay as you wrote them.')
  }

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad grid gap-3">
        <p className="flex items-center gap-2 text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          <NotebookPen size={16} strokeWidth={2.25} aria-hidden />
          Journal
        </p>
        <h1>Use words you know</h1>

        {said === null ? (
          <p className="font-bold">Opening your journal…</p>
        ) : !ready ? (
          <GuideBubble name={guideName}>
            Finish a lesson first. There is no writing task yet — this page
            stays empty until you can say a sentence.
          </GuideBubble>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="grid gap-3">
              <GuideBubble name={guideName}>
                Write in {lang.name}. The prompt is one ask your words can
                answer. Saving is not a grade.
              </GuideBubble>
              <p className="rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold">
                {prompt}
              </p>
              <textarea
                className="min-h-32 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`Write in ${lang.name}`}
                aria-label="Journal entry"
                dir={dir}
              />
              <p className="font-bold">
                {count} of your words
                <span className="block text-sm text-ink-soft">Not a score.</span>
              </p>
              {draftNotes.map((note) => (
                <p key={`${note.sentence}-${note.hint}`} className="font-bold text-ink-soft">
                  Note on “{note.sentence}”: {note.hint}
                </p>
              ))}
              <PrimaryCta onClick={() => void saveEntry()}>Save this entry</PrimaryCta>

              <h2 className="text-[1.15rem]">Prompt for my journal</h2>
              <textarea
                className="min-h-20 rounded-xl border-[2.5px] border-ink bg-paper p-3 text-sm font-bold"
                readOnly
                value={promptBrief}
                aria-label="Journal prompt brief"
              />
              <button
                type="button"
                className="min-h-11 font-extrabold"
                onClick={() =>
                  void navigator.clipboard.writeText(promptBrief).then(
                    () => setMessage('Brief copied.'),
                    () => setMessage('Select the brief and copy it.'),
                  )
                }
              >
                Copy the prompt brief
              </button>
              <textarea
                className="min-h-16 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
                value={promptPaste}
                onChange={(event) => setPromptPaste(event.target.value)}
                placeholder="Paste a prompt JSON"
                aria-label="Journal prompt paste"
              />
              <button type="button" className="min-h-11 font-extrabold" onClick={() => void replacePrompt()}>
                Use this prompt
              </button>

              <h2 className="text-[1.15rem]">Past entries</h2>
              {entries.length === 0 ? (
                <p className="font-bold text-ink-soft">Nothing saved yet.</p>
              ) : (
                <ul className="m-0 grid list-none gap-2 p-0">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="grid w-full gap-1 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 text-left font-bold"
                        onClick={() => {
                          setOpenId(entry.id === openId ? null : entry.id)
                          setSelected(null)
                          setNotePaste('')
                        }}
                      >
                        <span dir={dir}>{entry.body}</span>
                        <span className="text-sm text-ink-soft">{entry.prompt}</span>
                      </button>
                      {open?.id === entry.id && (
                        <div className="mt-2 grid gap-2 rounded-xl border-2 border-ink/40 bg-paper/80 p-3">
                          {entry.notes.map((note) => (
                            <p key={`${note.sentence}-${note.hint}`} className="m-0 font-bold">
                              Note on “{note.sentence}”: {note.hint}
                            </p>
                          ))}
                          <SentencePicker
                            sentences={entrySentences(entry.body)}
                            selected={selected}
                            onSelect={setSelected}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {(open ? entrySentences(open.body) : draftSentences).length > 0 && (
                <section className="grid gap-2">
                  <h2 className="text-[1.15rem]">Check this line</h2>
                  {!open && (
                    <SentencePicker
                      sentences={draftSentences}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  )}
                  {lineBrief && (
                    <>
                      <textarea
                        className="min-h-20 rounded-xl border-[2.5px] border-ink bg-paper p-3 text-sm font-bold"
                        readOnly
                        value={lineBrief}
                        aria-label="Check this line brief"
                      />
                      <button
                        type="button"
                        className="min-h-11 font-extrabold"
                        onClick={() =>
                          void navigator.clipboard.writeText(lineBrief).then(
                            () => setMessage('Brief copied.'),
                            () => setMessage('Select the brief and copy it.'),
                          )
                        }
                      >
                        Copy check this line
                      </button>
                      <textarea
                        className="min-h-16 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
                        value={notePaste}
                        onChange={(event) => setNotePaste(event.target.value)}
                        placeholder="Paste the note JSON"
                        aria-label="Journal note paste"
                      />
                      <button type="button" className="min-h-11 font-extrabold" onClick={() => void addNote()}>
                        Add this note
                      </button>
                    </>
                  )}
                </section>
              )}
              {message && <p className="font-bold">{message}</p>}
            </div>

            <aside className="grid h-fit gap-2 rounded-[22px] border-[3px] border-ink bg-paper/90 p-3">
              <h2 className="text-[1.05rem]">Words you can use</h2>
              <ul className="m-0 grid list-none gap-2 p-0">
                {knownSentences.map((sentence) => (
                  <li
                    key={sentence}
                    className="rounded-xl border-2 border-ink bg-paper px-3 py-2 font-bold"
                    dir={dir}
                  >
                    {unit?.sentenceParts && sentence === unit.targetSentence ? (
                      <RubyText parts={unit.sentenceParts} dir={dir} />
                    ) : readingSpans(profile.languageId, sentence) ? (
                      <AidedText languageId={profile.languageId} text={sentence} />
                    ) : (
                      sentence
                    )}
                  </li>
                ))}
                {words.map((word) => (
                  <li
                    key={word.surface}
                    className="rounded-xl border-2 border-ink bg-paper px-3 py-2 font-bold"
                  >
                    <AidedText
                      languageId={profile.languageId}
                      text={word.surface}
                      reading={word.reading}
                    />
                    <p className="m-0 text-sm text-ink-soft">{word.gloss}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function SentencePicker({
  sentences,
  selected,
  onSelect,
}: {
  sentences: string[]
  selected: string | null
  onSelect: (sentence: string) => void
}) {
  if (!sentences.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {sentences.map((sentence) => (
        <button
          key={sentence}
          type="button"
          className={`min-h-11 rounded-full border-[2.5px] border-ink px-3 py-2 font-extrabold ${
            selected === sentence ? 'bg-cyan' : 'bg-paper'
          }`}
          onClick={() => onSelect(sentence)}
        >
          {sentence}
        </button>
      ))}
    </div>
  )
}
