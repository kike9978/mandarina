import { Music } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPhraseUnit } from '../data/fixtures'
import { languageById } from '../data/languages'
import {
  buildLyricsBrief,
  linesFromPaste,
  lyricLinePhrase,
  lyricWordPhrase,
  loadLyricsPack,
  markLyricLine,
  parseLyricsPack,
  presentLyricWords,
  sampleLyricPack,
  saveLyricLines,
  saveLyricsPack,
  type LyricPack,
  type PresentedLyricWord,
} from '../learning/lyricsPack'
import { useAppState, useGuideName } from '../state/AppState'
import { readingSpans } from '../learning/readingAid'
import { AidedText } from '../components/SessionBits'
import { GuideBubble, PrimaryCta } from '../components/ui'

function LyricHit({
  languageId,
  text,
  reading,
}: {
  languageId: string
  text: string
  reading?: string
}) {
  const aided = readingSpans(languageId, text, reading)
  return (
    <span className="rounded bg-cyan px-0.5">
      {aided ? (
        <AidedText languageId={languageId} text={text} reading={reading} />
      ) : (
        text
      )}
    </span>
  )
}

export function LyricsPage() {
  const { profile, stash, addStash } = useAppState()
  const guideName = useGuideName()
  const lang = languageById(profile.languageId)
  const seed = getPhraseUnit(profile.languageId)
  const [title, setTitle] = useState('')
  const [linesText, setLinesText] = useState('')
  const [paste, setPaste] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [stored, setStored] = useState<LyricPack | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancel = false
    setLoaded(false)
    void loadLyricsPack(profile.languageId).then((pack) => {
      if (cancel) return
      setStored(pack)
      setLoaded(true)
      if (pack?.title) setTitle((current) => current || pack.title)
    })
    return () => {
      cancel = true
    }
  }, [profile.languageId])

  const known = [
    ...(seed?.items ?? []).map((item) => ({
      surface: item.surface,
      gloss: item.gloss,
      reading: item.reading,
    })),
    ...stash.map((row) => ({
      surface: row.surface,
      gloss: row.gloss,
      reading: row.reading,
    })),
  ]
  const knownSurfaces = [
    ...new Set(known.map((row) => row.surface).filter(Boolean)),
  ].slice(0, 12)
  const brief = buildLyricsBrief({
    languageName: lang.name,
    known: knownSurfaces,
    lines: stored?.lines ?? [],
    title: stored?.title,
  })
  const presented: PresentedLyricWord[] = stored
    ? presentLyricWords(stored.words, known)
    : []
  const newSurfaces = presented.filter((word) => !word.known).map((word) => word.surface)
  const dir = profile.languageId === 'ar' ? 'rtl' : undefined

  function readingFor(surface: string): string | undefined {
    return presented.find((word) => word.surface === surface)?.reading
  }

  function lineAlreadyKept(line: string): boolean {
    const key = line.trim().toLowerCase()
    return stash.some(
      (row) =>
        row.surface.trim().toLowerCase() === key ||
        row.exampleSentence?.trim().toLowerCase() === key,
    )
  }

  async function saveLines() {
    const lines = linesFromPaste(linesText)
    if (!lines.length) {
      setMessage('Paste at least one line. Nothing was stored.')
      return
    }
    const pack = await saveLyricLines(profile.languageId, { title, lines })
    setStored(pack)
    setLinesText('')
    setMessage(
      `Saved ${pack.lines.length} ${pack.lines.length === 1 ? 'line' : 'lines'}. This does not count as knowing them.`,
    )
  }

  function useSample() {
    const sample = sampleLyricPack(profile.languageId)
    setTitle(sample.title)
    setLinesText(sample.lines.join('\n'))
    setMessage(null)
  }

  async function saveWords() {
    const parsed = parseLyricsPack(paste, profile.languageId)
    if (parsed.error || !parsed.pack) {
      setMessage(parsed.error ?? 'Nothing was imported.')
      return
    }
    const pack = {
      title: parsed.pack.title || stored?.title || '',
      lines: parsed.pack.lines.length ? parsed.pack.lines : stored?.lines ?? [],
      words: parsed.pack.words,
    }
    await saveLyricsPack(profile.languageId, pack)
    setStored(pack)
    setPaste('')
    setMessage(
      `Kept ${pack.words.length} ${pack.words.length === 1 ? 'word' : 'words'}. This does not count as knowing them.`,
    )
  }

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <div className="page-pad grid gap-3">
        <p className="flex items-center gap-2 text-[0.78rem] font-extrabold tracking-wider uppercase opacity-75">
          <Music size={16} strokeWidth={2.25} aria-hidden />
          Lyrics
        </p>
        <h1>Lines you already like</h1>
        <GuideBubble name={guideName}>
          Paste lyrics in {lang.name}. Mandarina does not play the song and does
          not go get it. Saving a line is not a grade.
        </GuideBubble>

        {loaded && !stored?.lines.length && (
          <p className="leading-snug font-bold">
            No lines yet. Paste lyrics in {lang.name}, one line per row.
          </p>
        )}

        <label className="grid gap-1 font-bold">
          Title
          <input
            className="min-h-11 rounded-xl border-[2.5px] border-ink bg-paper px-3"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="grid gap-1 font-bold">
          Lyric lines
          <textarea
            className="min-h-28 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
            value={linesText}
            onChange={(event) => setLinesText(event.target.value)}
            placeholder={`Paste lyrics in ${lang.name}. One line per row.`}
            aria-label="Lyric lines"
          />
        </label>
        {stored?.lines.length ? (
          <button type="button" className="min-h-11 font-extrabold" onClick={() => void saveLines()}>
            Replace these lines
          </button>
        ) : (
          <PrimaryCta onClick={() => void saveLines()}>Save these lines</PrimaryCta>
        )}
        <button
          type="button"
          className="min-h-11 font-extrabold"
          onClick={useSample}
        >
          Use a {lang.name} sample
        </button>

        {stored && stored.lines.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-[1.15rem]">{stored.title || 'Untitled'}</h2>
            <ul className="m-0 grid list-none gap-2 p-0">
              {stored.lines.map((line) => {
                const parts = markLyricLine(line, newSurfaces)
                const kept = lineAlreadyKept(line)
                return (
                  <li
                    key={line}
                    className="grid gap-2 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold"
                    dir={dir}
                  >
                    <p className="m-0 leading-snug">
                      {parts.map((part, index) =>
                        part.hit ? (
                          <LyricHit
                            key={`${part.text}-${index}`}
                            languageId={profile.languageId}
                            text={part.text}
                            reading={readingFor(part.text)}
                          />
                        ) : (
                          <span key={`${part.text}-${index}`}>{part.text}</span>
                        ),
                      )}
                    </p>
                    {kept ? (
                      <p className="m-0 text-sm text-ink-soft">Already in your stash</p>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-paper px-3 py-2 font-extrabold"
                        onClick={() => {
                          void addStash(lyricLinePhrase(line, stored.title)).then(
                            () => {
                              setMessage(
                                'Stashed that line. It is not a success yet — you still have to build and say it.',
                              )
                            },
                            () => setMessage('That line was not stashed.'),
                          )
                        }}
                      >
                        Stash this line
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            <h2 className="text-[1.15rem]">From these lyrics</h2>
            <p className="font-bold text-ink-soft">
              The brief asks for a few words, not every word in the song.
            </p>
            <textarea
              className="min-h-24 rounded-xl border-[2.5px] border-ink bg-paper p-3 text-sm font-bold"
              readOnly
              value={brief}
              aria-label="Lyrics brief"
            />
            <button
              type="button"
              className="min-h-11 font-extrabold"
              onClick={() =>
                void navigator.clipboard.writeText(brief).then(
                  () => setMessage('Brief copied.'),
                  () => setMessage('Select the brief and copy it.'),
                )
              }
            >
              Copy the lyrics brief
            </button>
            <textarea
              className="min-h-20 rounded-xl border-[2.5px] border-ink bg-paper p-3 font-bold"
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              placeholder="Paste the lyrics JSON"
              aria-label="Lyrics word paste"
            />
            <button
              type="button"
              className="min-h-11 font-extrabold"
              onClick={() => {
                const sample = sampleLyricPack(profile.languageId)
                setPaste(JSON.stringify(sample, null, 2))
              }}
            >
              Try a {lang.name} word list
            </button>
            <PrimaryCta onClick={() => void saveWords()}>Save these words</PrimaryCta>

            {presented.length > 0 && (
              <ul className="m-0 grid list-none gap-2 p-0">
                {presented.map((word) => (
                  <li
                    key={word.surface}
                    className="grid gap-1 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-2.5 font-bold"
                  >
                    <AidedText
                      languageId={profile.languageId}
                      text={word.surface}
                      reading={word.reading}
                    />
                    <p className="m-0 text-sm text-ink-soft">{word.gloss}</p>
                    <p className="m-0 text-sm text-ink-soft">from “{word.line}”</p>
                    {word.known ? (
                      <p className="m-0 text-sm">You already have this.</p>
                    ) : (
                      <p className="m-0 text-sm">New</p>
                    )}
                    {word.related && (
                      <p className="m-0 flex flex-wrap items-baseline gap-2 text-sm">
                        <span>This sits next to</span>
                        <AidedText
                          languageId={profile.languageId}
                          text={word.related.surface}
                          reading={word.related.reading}
                        />
                        <span className="text-ink-soft">{word.related.gloss}</span>
                      </p>
                    )}
                    {word.known ? null : (
                      <button
                        type="button"
                        className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-cyan px-3 py-2 font-extrabold"
                        onClick={() => {
                          void addStash(lyricWordPhrase(word)).then(
                            () => {
                              setMessage(
                                'Stashed that word. It is not a success yet — you still have to retrieve it.',
                              )
                            },
                            () => setMessage('That word was not stashed.'),
                          )
                        }}
                      >
                        Stash this word
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {message && <p className="font-bold">{message}</p>}
      </div>
    </div>
  )
}
