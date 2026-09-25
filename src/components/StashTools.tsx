import { BookmarkPlus, PackageOpen } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SAMPLE_PACK_JSON } from '../data/fixtures'
import { PrimaryCta } from './ui'

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
          placeholder="今日は仕事があります"
          required
        />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Meaning</span>
        <input
          className={fieldClass}
          value={gloss}
          onChange={(e) => setGloss(e.target.value)}
          placeholder="I have work today"
          required
        />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-extrabold">
        <span>Reading (optional)</span>
        <input
          className={fieldClass}
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="きょうはしごとがあります"
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

export function PackImport({
  onImport,
}: {
  onImport: (
    phrases: {
      surface: string
      gloss: string
      exampleSentence?: string
      source: 'import'
    }[],
  ) => void
}) {
  const [message, setMessage] = useState<string | null>(null)

  function parseText(text: string) {
    const trimmed = text.trim()
    if (trimmed.startsWith('[')) {
      const rows = JSON.parse(trimmed) as {
        surface: string
        gloss: string
        exampleSentence?: string
      }[]
      return rows
        .filter((r) => r.surface && r.gloss)
        .map((r) => ({ ...r, source: 'import' as const }))
    }
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [surface, gloss, exampleSentence] = line.split('\t')
        return {
          surface: surface?.trim() ?? '',
          gloss: gloss?.trim() ?? '',
          exampleSentence: exampleSentence?.trim(),
          source: 'import' as const,
        }
      })
      .filter((r) => r.surface && r.gloss)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const phrases = parseText(String(reader.result ?? ''))
        if (!phrases.length) {
          setMessage('Hmm — no phrases found in that pack.')
          return
        }
        onImport(phrases)
        setMessage(`Pack aboard — ${phrases.length} phrases ready when you are.`)
      } catch {
        setMessage('Couldn’t read that pack. Try JSON or TSV.')
      }
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
        onClick={() => {
          const phrases = parseText(SAMPLE_PACK_JSON)
          onImport(phrases)
          setMessage(`Pack aboard — ${phrases.length} phrases ready when you are.`)
        }}
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
