import {
  ClipboardCopy,
  ClipboardPaste,
  FileText,
  Headphones,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SAMPLE_LISTEN_LINES_JSON,
  SAMPLE_LISTEN_TRANSCRIPT,
  SAMPLE_SOURCES_PACK_JSON,
  type ListeningSource,
} from '../data/fixtures'
import {
  MAX_POSTS_PER_STOP,
  parseSourcesPack,
} from '../learning/listeningPack'
import { parseTranscript } from '../learning/transcript'
import { parseTutorPack } from '../learning/tutorPack'
import {
  knownSurfacesFor,
  snapshotFindListenBrief,
  snapshotProcessWordsBrief,
  snapshotPullLinesBrief,
} from '../learning/tutorSnapshot'
import { useAppState, useGuideName } from '../state/AppState'
import { SourcePlayer } from './SourcePlayer'
import { GuideBubble, PrimaryCta, SoftChoice } from './ui'

const fieldClass =
  'min-h-11 rounded-xl border-[2.5px] border-ink bg-white px-3 py-3'
const chipClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold'

function markerClass(status: ListeningSource['status']) {
  if (status === 'practiced') return 'border-ink bg-success text-white'
  if (status === 'listening') {
    return 'border-ink bg-paper outline outline-4 outline-cyan outline-offset-2'
  }
  return 'border-ink bg-grid'
}

function StepPips({
  current,
}: {
  current: 1 | 2 | 3 | 4
}) {
  const labels = ['Play', 'Words', 'Coach', 'Practice']
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1.5 p-0" aria-label="Listen steps">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4
        const on = n === current
        const done = n < current
        return (
          <li
            key={label}
            className={`rounded-xl border-2 px-1.5 py-1.5 text-center text-[0.72rem] font-extrabold ${
              on
                ? 'border-ink bg-cyan'
                : done
                  ? 'border-ink bg-[#e8fff4]'
                  : 'border-ink/40 bg-paper text-ink-soft'
            }`}
          >
            {n}. {label}
          </li>
        )
      })}
    </ol>
  )
}

export function ListeningPost() {
  const navigate = useNavigate()
  const guideName = useGuideName()
  const {
    profile,
    abilities,
    stash,
    listeningSources,
    addListeningSources,
    saveSourceTranscript,
    markListened,
    importPhrases,
    startStashSession,
  } = useAppState()

  const posts = listeningSources
    .filter((s) => s.abilityId === 'talk-today')
    .slice(0, MAX_POSTS_PER_STOP)
  const slotsLeft = MAX_POSTS_PER_STOP - posts.length

  const [open, setOpen] = useState<'find' | string | null>(null)
  const selected = posts.find((p) => p.id === open) ?? null

  useEffect(() => {
    if (window.location.hash !== '#listen') return
    document.getElementById('listening-post')?.scrollIntoView({ behavior: 'smooth' })
    setOpen((cur) => cur ?? 'find')
  }, [])

  return (
    <div id="listening-post" className="mt-3 ml-1 grid scroll-mt-4 gap-2">
      <div className="flex flex-wrap gap-2">
        {posts.length === 0 && (
          <button
            type="button"
            className={`${chipClass} ${markerClass('suggested')}`}
            onClick={() => setOpen('find')}
          >
            <Headphones strokeWidth={2.25} aria-hidden />
            Hear this in the wild
          </button>
        )}
        {posts.map((post) => (
          <button
            type="button"
            key={post.id}
            className={`${chipClass} max-w-full ${markerClass(post.status)}`}
            onClick={() => setOpen(post.id)}
            aria-pressed={open === post.id}
          >
            <Headphones strokeWidth={2.25} aria-hidden />
            <span className="truncate">{post.title}</span>
          </button>
        ))}
        {posts.length > 0 && slotsLeft > 0 && (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center rounded-full border-2 border-dashed border-ink px-3 py-2 text-sm font-extrabold"
            onClick={() => setOpen('find')}
          >
            Find a listen
          </button>
        )}
      </div>

      {open === 'find' && (
        <FindListenSheet
          guideName={guideName}
          posts={posts}
          slotsLeft={slotsLeft}
          onClose={() => setOpen(null)}
          onImport={(rows) => {
            addListeningSources(
              rows.map((r) => ({
                abilityId: 'talk-today',
                title: r.title,
                creator: r.creator,
                medium: r.medium,
                search: r.search,
                url: r.url,
                why: r.why,
                listenFor: r.listenFor,
                transcript: r.transcript,
              })),
            )
            setOpen(null)
          }}
        />
      )}

      {selected && (
        <SourceSheet
          guideName={guideName}
          source={selected}
          lines={stash.filter((s) => s.sourceId === selected.id)}
          onClose={() => setOpen(null)}
          onListened={() => markListened(selected.id)}
          onSaveWords={(text) => saveSourceTranscript(selected.id, text)}
          onImportLines={(rows) => {
            importPhrases(
              rows.map((r) => ({
                surface: r.surface,
                gloss: r.gloss,
                reading: r.reading,
                exampleSentence: r.exampleSentence,
                abilityTag: r.abilityTag ?? selected.title,
                source: 'import',
                sourceId: selected.id,
              })),
              { format: 'paste', name: `Lines · ${selected.title}` },
            )
          }}
          onPractice={() => {
            const ids = stash
              .filter((s) => s.sourceId === selected.id)
              .map((s) => s.id)
            startStashSession(ids, { listenSourceId: selected.id })
            navigate('/session')
          }}
          profile={profile}
          abilities={abilities}
          stash={stash}
        />
      )}
    </div>
  )
}

function FindListenSheet({
  guideName,
  posts,
  slotsLeft,
  onClose,
  onImport,
}: {
  guideName: string
  posts: ListeningSource[]
  slotsLeft: number
  onClose: () => void
  onImport: (rows: ReturnType<typeof parseSourcesPack>['rows']) => void
}) {
  const { profile, abilities, stash } = useAppState()
  const briefRef = useRef<HTMLTextAreaElement>(null)
  const [brief, setBrief] = useState('')
  const [paste, setPaste] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof parseSourcesPack>['rows'] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    snapshotFindListenBrief({
      languageId: profile.languageId,
      scriptFamiliarity: profile.scriptFamiliarity,
      goalId: profile.goalId,
      abilities,
      stash,
      sources: posts,
    }).then((text) => {
      if (!cancelled) setBrief(text)
    })
    return () => {
      cancelled = true
    }
  }, [abilities, posts, profile, stash])

  async function copyBrief() {
    if (!brief) return
    try {
      await navigator.clipboard.writeText(brief)
    } catch {
      briefRef.current?.focus()
      briefRef.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky">
      <h3 className="text-lg">Find a listen</h3>
      <GuideBubble name={guideName}>
        Prefer Grow the journey — a listen with a real link rides in with the
        phrases. Or copy this note for one extra listen. I need an https link
        so we can play it here.
      </GuideBubble>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Your note</span>
        <textarea
          ref={briefRef}
          className={`${fieldClass} min-h-32 font-mono text-[0.78rem] leading-snug`}
          value={brief}
          readOnly
          aria-label="Find a listen brief"
        />
      </label>
      <PrimaryCta onClick={copyBrief} disabled={!brief}>
        <span className="inline-flex items-center justify-center gap-2">
          <ClipboardCopy strokeWidth={2.25} aria-hidden />
          {copied ? 'Copied!' : 'Copy the brief'}
        </span>
      </PrimaryCta>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Their listens</span>
        <textarea
          className={`${fieldClass} min-h-24 font-mono text-[0.85rem]`}
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value)
            setPreview(null)
            setMessage(null)
          }}
          placeholder="Paste the sources pack"
          aria-label="Paste sources pack"
        />
      </label>
      <button
        type="button"
        className={`${chipClass} w-fit`}
        onClick={() => {
          setPaste(SAMPLE_SOURCES_PACK_JSON)
          setPreview(null)
          setMessage(null)
        }}
      >
        Try a sample listen
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-grid px-4 py-3 font-extrabold shadow-chunky"
        onClick={() => {
          const parsed = parseSourcesPack(
            paste,
            posts.map((p) => p.title),
            slotsLeft,
          )
          if (parsed.error) {
            setPreview(null)
            setMessage(parsed.error)
            return
          }
          setPreview(parsed.rows)
          setMessage(null)
        }}
      >
        <ClipboardPaste strokeWidth={2.25} aria-hidden />
        Bring the pack back
      </button>
      {preview && (
        <div className="grid gap-3 rounded-xl border-2 border-ink bg-[#e8fff4] p-3">
          <p className="font-extrabold">
            Pack aboard — {preview.length} listen{preview.length === 1 ? '' : 's'}
          </p>
          <ul className="m-0 grid list-none gap-2 p-0">
            {preview.map((row) => (
              <li key={row.title} className="font-bold">
                <strong>{row.title}</strong>
                <span> · {row.creator}</span>
                <p className="text-sm text-ink-soft">{row.why}</p>
              </li>
            ))}
          </ul>
          <SoftChoice
            primaryLabel="Why not!"
            secondaryLabel="Nah…"
            onPrimary={() => onImport(preview)}
            onSecondary={() => {
              setPreview(null)
              setPaste('')
            }}
          />
        </div>
      )}
      {message && !preview && (
        <p className="rounded-xl border-2 border-ink bg-[#fff3c4] p-2.5 font-extrabold">
          {message}
        </p>
      )}
      <button
        type="button"
        className="text-sm font-extrabold underline decoration-2 underline-offset-4"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}

function WordsCatcher({
  transcript,
  onSave,
}: {
  transcript?: string
  onSave: (text: string) => void | Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function accept(raw: string) {
    const parsed = parseTranscript(raw)
    if (parsed.error || !parsed.text) {
      setError(parsed.error ?? 'No words in that paste.')
      return
    }
    setError(null)
    setDraft('')
    void onSave(parsed.text)
  }

  async function fromFile(file: File | undefined) {
    if (!file) return
    accept(await file.text())
  }

  if (transcript) {
    const preview = transcript.split('\n').slice(0, 4).join(' ')
    return (
      <div className="grid gap-2 rounded-xl border-2 border-ink bg-[#e8fff4] p-3">
        <p className="inline-flex items-center gap-1.5 font-extrabold">
          <FileText size={18} strokeWidth={2.25} aria-hidden />
          Words aboard
        </p>
        <p className="text-sm font-bold text-ink-soft">{preview}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div
        className={`grid gap-2 rounded-[22px] border-4 border-dashed p-4 ${
          dragging ? 'border-orange bg-[#fff3c4]' : 'border-ink bg-white'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void fromFile(e.dataTransfer.files[0])
        }}
      >
        <p className="inline-flex items-center gap-1.5 font-extrabold">
          <Upload size={18} strokeWidth={2.25} aria-hidden />
          The words
        </p>
        <p className="text-sm font-bold text-ink-soft">
          Paste the transcript, or drop a .vtt / .srt / .txt. YouTube: ⋯ → Show
          transcript → copy. We cannot fetch it from here.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".vtt,.srt,.txt,text/vtt,text/plain"
          className="sr-only"
          aria-label="Drop transcript file"
          onChange={(e) => {
            void fromFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className={`${chipClass} w-fit`}
          onClick={() => fileRef.current?.click()}
        >
          Choose a file
        </button>
      </div>
      <textarea
        className={`${fieldClass} min-h-24 font-mono text-[0.85rem]`}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(null)
        }}
        placeholder="Paste the words they said"
        aria-label="Paste listen transcript"
      />
      <button
        type="button"
        className={`${chipClass} w-fit`}
        onClick={() => {
          setDraft(SAMPLE_LISTEN_TRANSCRIPT)
          setError(null)
        }}
      >
        Try sample words
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-grid px-4 py-3 font-extrabold shadow-chunky"
        onClick={() => accept(draft)}
      >
        <FileText strokeWidth={2.25} aria-hidden />
        Keep these words
      </button>
      {error && (
        <p className="rounded-xl border-2 border-ink bg-[#fff3c4] p-2.5 font-extrabold">
          {error}
        </p>
      )}
    </div>
  )
}

function SourceSheet({
  guideName,
  source,
  lines,
  onClose,
  onListened,
  onSaveWords,
  onImportLines,
  onPractice,
  profile,
  abilities,
  stash,
}: {
  guideName: string
  source: ListeningSource
  lines: { id: string; surface: string; gloss: string }[]
  onClose: () => void
  onListened: () => void
  onSaveWords: (text: string) => void | Promise<void>
  onImportLines: (
    rows: {
      surface: string
      gloss: string
      reading?: string
      exampleSentence?: string
      abilityTag?: string
    }[],
  ) => void
  onPractice: () => void
  profile: ReturnType<typeof useAppState>['profile']
  abilities: ReturnType<typeof useAppState>['abilities']
  stash: ReturnType<typeof useAppState>['stash']
}) {
  const briefRef = useRef<HTMLTextAreaElement>(null)
  const [brief, setBrief] = useState('')
  const [paste, setPaste] = useState('')
  const [preview, setPreview] = useState<
    { surface: string; gloss: string; reading?: string; exampleSentence?: string; abilityTag?: string }[] | null
  >(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedSearch, setCopiedSearch] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const [wordsOpen, setWordsOpen] = useState(false)

  const hasWords = Boolean(source.transcript?.trim())
  const step: 1 | 2 | 3 | 4 =
    source.status === 'practiced' || lines.length > 0
      ? 4
      : hasWords
        ? 3
        : source.status === 'listening'
          ? 2
          : 1

  useEffect(() => {
    let cancelled = false
    const snap = hasWords ? snapshotProcessWordsBrief : snapshotPullLinesBrief
    snap({
      languageId: profile.languageId,
      scriptFamiliarity: profile.scriptFamiliarity,
      goalId: profile.goalId,
      abilities,
      stash,
      source,
    }).then((text) => {
      if (!cancelled) setBrief(text)
    })
    return () => {
      cancelled = true
    }
  }, [abilities, hasWords, profile, source, stash])

  async function copyBrief() {
    if (!brief) return
    try {
      await navigator.clipboard.writeText(brief)
    } catch {
      briefRef.current?.focus()
      briefRef.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function copySearch() {
    try {
      await navigator.clipboard.writeText(source.search)
    } catch {
      /* ignore */
    }
    setCopiedSearch(true)
    window.setTimeout(() => setCopiedSearch(false), 1600)
  }

  const showCoach =
    (hasWords && (step === 3 || coachOpen)) || (!hasWords && coachOpen)

  return (
    <div className="grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky">
      <p className="text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
        Hear this in the wild
      </p>
      <h3 className="text-lg">{source.title}</h3>
      <p className="font-bold text-ink-soft">
        {source.creator} · {source.medium}
      </p>
      <StepPips current={step} />
      <GuideBubble name={guideName}>
        {step === 1 &&
          (source.url
            ? 'Hit Play here. Then drop the words — a transcript or a paste — and I will pack them into a note for your coach.'
            : 'No playable link on this post — copy the search and listen outside, then come back.')}
        {step === 2 &&
          'Paste the words they said, or drop a caption file. Your coach will pick vocab from those words, not from the title.'}
        {step === 3 &&
          'This note already carries the words. Copy it, let a tutor pull vocab and examples, then paste the pack back.'}
        {step === 4 &&
          (source.status === 'practiced'
            ? 'You already practiced these lines. Replay any time.'
            : 'Lines are in your stash. Practice them — finishing that path lights this post.')}
      </GuideBubble>
      <p className="leading-snug font-bold">{source.why}</p>
      {source.listenFor && source.listenFor.length > 0 && (
        <p className="text-sm font-bold text-ink-soft">
          Listen for: {source.listenFor.join(' · ')}
        </p>
      )}

      <SourcePlayer url={source.url} title={source.title} onPlay={onListened} />

      {step === 1 && !source.url && (
        <>
          <div className="grid gap-2 rounded-xl border-2 border-ink bg-[#fff3c4] p-3">
            <p className="text-sm font-extrabold">Search out there</p>
            <p className="font-bold">{source.search}</p>
            <button type="button" className={`${chipClass} w-fit`} onClick={copySearch}>
              {copiedSearch ? 'Copied!' : 'Copy search'}
            </button>
          </div>
          <PrimaryCta onClick={onListened}>I listened</PrimaryCta>
        </>
      )}

      {(step >= 2 || source.url) && (
        <WordsCatcher
          transcript={wordsOpen ? undefined : source.transcript}
          onSave={async (text) => {
            await onSaveWords(text)
            setWordsOpen(false)
            setCoachOpen(true)
          }}
        />
      )}

      {hasWords && !wordsOpen && (
        <button
          type="button"
          className="text-sm font-extrabold underline decoration-2 underline-offset-4"
          onClick={() => setWordsOpen(true)}
        >
          Replace the words
        </button>
      )}
      {!hasWords && !coachOpen && (step === 2 || step === 4) && (
        <button
          type="button"
          className="text-sm font-extrabold underline decoration-2 underline-offset-4"
          onClick={() => setCoachOpen(true)}
        >
          No words? Ask from the link
        </button>
      )}

      {step === 4 && (
        <>
          {source.status === 'practiced' && (
            <p className="rounded-xl border-2 border-ink bg-[#e8fff4] p-2.5 font-extrabold">
              Practiced — heard in the wild.
            </p>
          )}
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {lines.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border-2 border-ink bg-paper px-3 py-2 font-bold"
              >
                <strong>{row.surface}</strong>
                <span> — {row.gloss}</span>
              </li>
            ))}
          </ul>
          <PrimaryCta onClick={onPractice}>
            Practice these lines · {Math.min(lines.length, 3)}
          </PrimaryCta>
          {!coachOpen && (
            <button
              type="button"
              className="text-sm font-extrabold underline decoration-2 underline-offset-4"
              onClick={() => setCoachOpen(true)}
            >
              {hasWords ? 'Pull more from the words' : 'Pull more lines'}
            </button>
          )}
        </>
      )}

      {showCoach && (
        <div className="grid gap-3 border-t-[3px] border-dashed border-ink pt-3">
          <h4 className="text-base">
            {hasWords ? '3 · From the words' : '3 · Pull the lines'}
          </h4>
          <p className="text-sm font-bold text-ink-soft">
            {hasWords
              ? 'This note includes the transcript. Your coach picks vocab and examples from those words.'
              : 'No words yet — this note asks from the link. Better: paste the transcript first.'}
          </p>
          <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
            <span>Your note</span>
            <textarea
              ref={briefRef}
              className={`${fieldClass} min-h-28 font-mono text-[0.78rem] leading-snug`}
              value={brief}
              readOnly
              aria-label={hasWords ? 'From the words brief' : 'Pull the lines brief'}
            />
          </label>
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-cyan px-4 py-3 font-extrabold shadow-chunky disabled:opacity-55"
            onClick={copyBrief}
            disabled={!brief}
          >
            <ClipboardCopy strokeWidth={2.25} aria-hidden />
            {copied ? 'Copied!' : 'Copy the brief'}
          </button>
          <textarea
            className={`${fieldClass} min-h-24 font-mono text-[0.85rem]`}
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value)
              setPreview(null)
              setMessage(null)
            }}
            placeholder="Paste the vocab they pulled"
            aria-label="Paste listen lines"
          />
          <button
            type="button"
            className={`${chipClass} w-fit`}
            onClick={() => {
              setPaste(SAMPLE_LISTEN_LINES_JSON)
              setPreview(null)
              setMessage(null)
            }}
          >
            Try sample lines
          </button>
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-grid px-4 py-3 font-extrabold shadow-chunky"
            onClick={() => {
              const parsed = parseTutorPack(
                paste,
                knownSurfacesFor(profile.languageId, stash),
              )
              if (parsed.error) {
                setPreview(null)
                setMessage(parsed.error)
                return
              }
              setPreview(parsed.rows)
              setMessage(null)
            }}
          >
            <ClipboardPaste strokeWidth={2.25} aria-hidden />
            {hasWords ? 'Bring the vocab back' : 'Pull the lines'}
          </button>
          {preview && (
            <div className="grid gap-3 rounded-xl border-2 border-ink bg-[#e8fff4] p-3">
              <p className="font-extrabold">
                Pack aboard — {preview.length} phrases
              </p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {preview.map((row) => (
                  <li key={row.surface} className="font-bold">
                    <strong>{row.surface}</strong>
                    <span> — {row.gloss}</span>
                    {row.exampleSentence && (
                      <p className="text-sm text-ink-soft">{row.exampleSentence}</p>
                    )}
                  </li>
                ))}
              </ul>
              <SoftChoice
                primaryLabel="Why not!"
                secondaryLabel="Nah…"
                onPrimary={() => {
                  onImportLines(preview)
                  setPreview(null)
                  setPaste('')
                  setCoachOpen(false)
                  setMessage('Pack aboard — lines ready when you are.')
                }}
                onSecondary={() => {
                  setPreview(null)
                  setPaste('')
                }}
              />
            </div>
          )}
          {message && !preview && (
            <p className="rounded-xl border-2 border-ink bg-[#e8fff4] p-2.5 font-extrabold">
              {message}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="text-sm font-extrabold underline decoration-2 underline-offset-4"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}
