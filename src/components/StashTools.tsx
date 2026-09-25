import {
  BookmarkPlus,
  ClipboardCopy,
  ClipboardPaste,
  PackageOpen,
  Sparkles,
  Sprout,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  getPhraseUnit,
  SAMPLE_PACK_JSON,
  SAMPLE_TUTOR_PACK_JSON,
} from '../data/fixtures'
import {
  clearNoteTweaks,
  foldNoteTweaks,
  loadNoteTweaks,
} from '../learning/tutorNotes'
import {
  MAX_POSTS_PER_STOP,
  parseSourceItems,
  type SourcePackRow,
} from '../learning/listeningPack'
import { parsePackOrTsv, type TutorPackRow } from '../learning/tutorPack'
import { knownSurfacesFor, snapshotTutorBrief } from '../learning/tutorSnapshot'
import { useAppState, useGuideName } from '../state/AppState'
import { GuideBubble, PrimaryCta, SoftChoice } from './ui'

const fieldClass =
  'min-h-11 rounded-xl border-[2.5px] border-ink bg-white px-3 py-3'
const chipClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold'

export function StashSheet({
  onSave,
  initialSurface = '',
  initialExample = '',
}: {
  onSave: (data: {
    surface: string
    gloss: string
    reading?: string
    exampleSentence?: string
    abilityTag?: string
  }) => void
  initialSurface?: string
  initialExample?: string
}) {
  const { profile } = useAppState()
  const sample = getPhraseUnit(profile.languageId)
  const [surface, setSurface] = useState(initialSurface)
  const [gloss, setGloss] = useState('')
  const [reading, setReading] = useState('')
  const [example, setExample] = useState(initialExample)
  const [abilityTag, setAbilityTag] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!surface.trim() || !gloss.trim()) return
    onSave({
      surface: surface.trim(),
      gloss: gloss.trim(),
      reading: reading.trim() || undefined,
      exampleSentence: example.trim() || undefined,
      abilityTag: abilityTag.trim() || undefined,
    })
    setSurface('')
    setGloss('')
    setReading('')
    setExample('')
    setAbilityTag('')
  }

  const bareWord = surface.trim() && !example.trim()

  return (
    <form
      className="grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <BookmarkPlus strokeWidth={2.25} aria-hidden />
        <h2 className="text-xl">Stash it</h2>
      </div>
      <p className="leading-snug font-bold text-ink-soft">
        Save a phrase for your journey — we&apos;ll practice it the playful way.
      </p>

      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Phrase or word</span>
        <input
          className={fieldClass}
          value={surface}
          onChange={(e) => setSurface(e.target.value)}
          placeholder={sample?.targetSentence ?? 'Your phrase'}
          required
        />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Meaning</span>
        <input
          className={fieldClass}
          value={gloss}
          onChange={(e) => setGloss(e.target.value)}
          placeholder={sample?.targetGloss ?? 'Meaning'}
          required
        />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Reading (optional)</span>
        <input
          className={fieldClass}
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder={sample?.items[0]?.reading ?? 'Reading if you use one'}
        />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Example sentence</span>
        <textarea
          className={fieldClass}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="A sentence where this showed up"
          rows={2}
        />
      </label>
      {bareWord && (
        <p className="rounded-xl border-2 border-dashed border-ink bg-[#fff3c4] p-2.5 text-[0.9rem] font-bold">
          Got a sentence this showed up in? It unlocks Build It later.
        </p>
      )}
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Helps me… (optional)</span>
        <input
          className={fieldClass}
          value={abilityTag}
          onChange={(e) => setAbilityTag(e.target.value)}
          placeholder="Talk about today"
        />
      </label>
      <PrimaryCta type="submit">Add to my journey</PrimaryCta>
    </form>
  )
}

function rowsToImport(rows: TutorPackRow[]) {
  return rows.map((r) => ({
    surface: r.surface,
    gloss: r.gloss,
    reading: r.reading,
    exampleSentence: r.exampleSentence,
    abilityTag: r.abilityTag,
    source: 'import' as const,
  }))
}

export function PackImport({
  onImport,
}: {
  onImport: (
    phrases: {
      surface: string
      gloss: string
      reading?: string
      exampleSentence?: string
      abilityTag?: string
      source: 'import'
    }[],
  ) => void
}) {
  const { profile, stash } = useAppState()
  const [message, setMessage] = useState<string | null>(null)

  function ingest(text: string) {
    const parsed = parsePackOrTsv(text, knownSurfacesFor(profile.languageId, stash))
    if (parsed.error || parsed.rows.length === 0) {
      setMessage(parsed.error ?? 'Hmm — no phrases in that pack')
      return
    }
    onImport(rowsToImport(parsed.rows))
    const extra =
      parsed.skippedDuplicate > 0
        ? ` · ${parsed.skippedDuplicate} already aboard`
        : ''
    setMessage(
      `Pack aboard — ${parsed.rows.length} phrases ready when you are.${extra}`,
    )
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      ingest(String(reader.result ?? ''))
    }
    reader.readAsText(file)
  }

  return (
    <div className="grid gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky">
      <div className="flex items-center gap-2">
        <PackageOpen strokeWidth={2.25} aria-hidden />
        <h2 className="text-xl">Bring a pack aboard</h2>
      </div>
      <p className="leading-snug font-bold text-ink-soft">
        Drop a simple JSON or TSV file. No cloud — stays on this device.
      </p>
      <label className="grid min-h-12 cursor-pointer place-items-center rounded-2xl border-[3px] border-ink bg-cyan font-extrabold shadow-chunky">
        <input
          className="hidden"
          type="file"
          accept=".json,.tsv,.txt,application/json,text/tab-separated-values,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        Choose pack file
      </label>
      <button
        type="button"
        className={`${chipClass} w-fit`}
        onClick={() => ingest(SAMPLE_PACK_JSON)}
      >
        Load sample pack
      </button>
      {message && (
        <p className="animate-pop-in rounded-xl border-2 border-ink bg-[#e8fff4] p-2.5 font-extrabold">
          {message}
        </p>
      )}
    </div>
  )
}

export function TutorPackSheet({
  onImport,
}: {
  onImport: ReturnType<typeof useAppState>['importPhrases']
}) {
  const { profile, abilities, stash, listeningSources, addListeningSources } =
    useAppState()
  const guideName = useGuideName()
  const briefRef = useRef<HTMLTextAreaElement>(null)
  const [brief, setBrief] = useState('')
  const [paste, setPaste] = useState('')
  const [preview, setPreview] = useState<TutorPackRow[] | null>(null)
  const [previewSources, setPreviewSources] = useState<SourcePackRow[]>([])
  const [previewTips, setPreviewTips] = useState<string[]>([])
  const [savedTips, setSavedTips] = useState<string[]>([])
  const [tipsRev, setTipsRev] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadNoteTweaks(profile.languageId).then((tips) => {
      if (!cancelled) setSavedTips(tips)
    })
    return () => {
      cancelled = true
    }
  }, [profile.languageId, tipsRev])

  useEffect(() => {
    let cancelled = false
    snapshotTutorBrief({
      languageId: profile.languageId,
      scriptFamiliarity: profile.scriptFamiliarity,
      goalId: profile.goalId,
      abilities,
      stash,
    }).then((text) => {
      if (!cancelled) setBrief(text)
    })
    return () => {
      cancelled = true
    }
  }, [
    abilities,
    profile.goalId,
    profile.languageId,
    profile.scriptFamiliarity,
    stash,
    tipsRev,
  ])

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

  function bringBack() {
    const parsed = parsePackOrTsv(
      paste,
      knownSurfacesFor(profile.languageId, stash),
    )
    const sources = parseSourceItems(
      parsed.sourceItems,
      listeningSources.map((s) => s.title),
      Math.max(0, MAX_POSTS_PER_STOP - listeningSources.filter((s) => s.abilityId === 'talk-today').length),
    )
    if (parsed.error && sources.rows.length === 0) {
      setPreview(null)
      setPreviewSources([])
      setPreviewTips([])
      setMessage(parsed.error)
      return
    }
    setPreview(parsed.rows)
    setPreviewSources(sources.rows)
    setPreviewTips(parsed.noteTweaks)
    setSkipped(parsed.skippedDuplicate)
    setMessage(null)
  }

  async function acceptPreview() {
    if (!preview?.length && previewTips.length === 0 && previewSources.length === 0)
      return
    const created =
      previewSources.length > 0
        ? await addListeningSources(
            previewSources.map((r) => ({
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
        : []
    const byTitle = new Map(created.map((s) => [s.title.toLowerCase(), s.id]))
    if (preview?.length) {
      onImport(
        rowsToImport(preview).map((row, i) => ({
          ...row,
          sourceId:
            (preview[i]?.sourceTitle &&
              byTitle.get(preview[i].sourceTitle!.toLowerCase())) ||
            created[0]?.id,
        })),
        { format: 'paste', name: 'Tutor pack' },
      )
    }
    if (previewTips.length) {
      await foldNoteTweaks(profile.languageId, previewTips)
      setTipsRev((n) => n + 1)
    }
    const bits = [
      preview?.length
        ? `${preview.length} phrase${preview.length === 1 ? '' : 's'} ready when you are`
        : null,
      created.length
        ? `${created.length} listen${created.length === 1 ? '' : 's'} on your Journey`
        : null,
      previewTips.length
        ? `${previewTips.length} tip${previewTips.length === 1 ? '' : 's'} folded into the next note`
        : null,
    ].filter(Boolean)
    setMessage(`Pack aboard — ${bits.join(' · ')}.`)
    setPreview(null)
    setPreviewSources([])
    setPreviewTips([])
    setPaste('')
    setSkipped(0)
  }

  return (
    <section
      id="tutor-pack"
      className="grid scroll-mt-4 gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-chunky"
    >
      <div className="flex items-center gap-2">
        <Sprout strokeWidth={2.25} aria-hidden />
        <h2 className="text-xl">Grow the journey</h2>
      </div>
      <GuideBubble name={guideName}>
        I&apos;ll write a note about where you are. Paste it to a tutor — ask
        for phrases <em>and</em> one listen with a real link. If they already
        have the spoken words, those ride in too. Bring the pack back and
        I&apos;ll put the video on your Journey so you can play it here.
      </GuideBubble>

      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Your note</span>
        <textarea
          ref={briefRef}
          className={`${fieldClass} min-h-36 font-mono text-[0.78rem] leading-snug`}
          value={brief}
          readOnly
          aria-label="Progress brief"
        />
      </label>
      {savedTips.length > 0 && (
        <div className="grid gap-2 rounded-xl border-2 border-dashed border-ink bg-[#fff3c4] p-3">
          <p className="inline-flex items-center gap-1.5 text-[0.85rem] font-extrabold">
            <Sparkles strokeWidth={2.25} aria-hidden />
            This note already carries {savedTips.length} tutor
            {savedTips.length === 1 ? ' tip' : ' tips'}
          </p>
          <ul className="m-0 grid list-none gap-1 p-0 text-sm font-bold">
            {savedTips.map((tip) => (
              <li key={tip}>· {tip}</li>
            ))}
          </ul>
          <button
            type="button"
            className="w-fit text-sm font-extrabold underline decoration-2 underline-offset-4"
            onClick={async () => {
              await clearNoteTweaks(profile.languageId)
              setTipsRev((n) => n + 1)
            }}
          >
            Forget these tips
          </button>
        </div>
      )}
      <PrimaryCta onClick={copyBrief} disabled={!brief}>
        <span className="inline-flex items-center justify-center gap-2">
          <ClipboardCopy strokeWidth={2.25} aria-hidden />
          {copied ? 'Copied!' : 'Copy the brief'}
        </span>
      </PrimaryCta>

      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Their pack</span>
        <textarea
          className={`${fieldClass} min-h-28 font-mono text-[0.85rem]`}
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value)
            setPreview(null)
            setPreviewSources([])
            setPreviewTips([])
            setMessage(null)
          }}
          placeholder="Paste the pack they sent back"
          aria-label="Paste tutor pack"
        />
      </label>
      <button
        type="button"
        className={`${chipClass} w-fit`}
        onClick={() => {
          setPaste(SAMPLE_TUTOR_PACK_JSON)
          setPreview(null)
          setPreviewSources([])
          setPreviewTips([])
          setMessage(null)
        }}
      >
        Try a sample pack
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-grid px-4 py-3 font-extrabold shadow-chunky"
        onClick={bringBack}
      >
        <ClipboardPaste strokeWidth={2.25} aria-hidden />
        Bring the pack back
      </button>

      {(preview || previewTips.length > 0 || previewSources.length > 0) && (
        <div className="grid gap-3 rounded-xl border-2 border-ink bg-[#e8fff4] p-3">
          <p className="font-extrabold">
            {preview && preview.length > 0
              ? `Pack aboard — ${preview.length} phrases`
              : previewSources.length > 0
                ? 'Listen ready for your Journey'
                : 'Tips for the next note'}
            {skipped > 0 ? ` · ${skipped} already aboard` : ''}
          </p>
          {previewSources.length > 0 && (
            <ul className="m-0 grid list-none gap-2 p-0">
              {previewSources.map((row) => (
                <li key={row.title} className="font-bold">
                  <strong>{row.title}</strong>
                  <span> · {row.creator}</span>
                  <p className="text-sm text-ink-soft break-all">{row.url}</p>
                  {row.transcript && (
                    <p className="text-sm text-ink-soft">Words aboard</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {preview && preview.length > 0 && (
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
          )}
          {previewTips.length > 0 && (
            <div className="grid gap-1.5">
              <p className="inline-flex items-center gap-1.5 font-extrabold">
                <Sparkles strokeWidth={2.25} aria-hidden />
                They also left {previewTips.length}
                {previewTips.length === 1 ? ' tip' : ' tips'} for the next note
              </p>
              <ul className="m-0 grid list-none gap-1 p-0 text-sm font-bold">
                {previewTips.map((tip) => (
                  <li key={tip}>· {tip}</li>
                ))}
              </ul>
            </div>
          )}
          <SoftChoice
            primaryLabel="Why not!"
            secondaryLabel="Nah…"
            onPrimary={acceptPreview}
            onSecondary={() => {
              setPreview(null)
              setPreviewSources([])
              setPreviewTips([])
              setPaste('')
              setSkipped(0)
              setMessage(null)
            }}
          />
        </div>
      )}

      {message && !preview && (
        <p className="animate-pop-in rounded-xl border-2 border-ink bg-[#e8fff4] p-2.5 font-extrabold">
          {message}
        </p>
      )}
    </section>
  )
}
