import type { LanguageId } from '../data/languages'
import { db } from '../db/mandarinaDb'
import { acceptsImportedWord } from './readingAid'
import { extractJsonValue, languageLockLine } from './tutorPack'

export const LYRIC_WORD_CAP = 8

export interface LyricWord {
  surface: string
  gloss: string
  line: string
  reading?: string
  relatedTo?: string
}

export interface LyricPack {
  title: string
  lines: string[]
  words: LyricWord[]
}

function settingsKey(languageId: string): string {
  return `lyrics-pack:${languageId}`
}

export function buildLyricsBrief(input: {
  languageName: string
  known: string[]
  lines: string[]
  title?: string
}): string {
  const known = input.known.length ? input.known.join(', ') : 'none yet'
  const lines = input.lines.map((line) => line.trim()).filter(Boolean)
  const lyricBlock = lines.length ? lines.map((line) => `- ${line}`).join('\n') : 'I will paste the lyrics next'
  const title = input.title?.trim() || 'none'
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(input.languageName)}

They already know: ${known}
Title: ${title}
Lyric lines:
${lyricBlock}

Pick a few words worth keeping, not every word in the song. Cap at eight.
Each word needs a surface, an English gloss, and the lyric line it came from.
When a new word sits next to one they already know, set relatedTo to that known surface.
Japanese kanji need furigana, each Chinese character needs its own pinyin syllable, and beginner Arabic needs vowel marks. A word without that aid is dropped.
Do not fetch the song.

{"title","lines":["..."],"words":[{"surface","reading?","gloss","line","relatedTo?"}]}`
}

export function parseLyricsPack(
  raw: string,
  languageId?: LanguageId,
): { pack?: LyricPack; error?: string } {
  const value = extractJsonValue(raw)
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'That paste is not valid JSON. Nothing was imported.' }
  }
  const row = value as Record<string, unknown>
  if (!Array.isArray(row.lines) || !Array.isArray(row.words)) {
    return { error: 'That paste has no lines and word list. Nothing was imported.' }
  }
  const lines = row.lines
    .filter((line): line is string => typeof line === 'string')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return { error: 'That paste has no lines. Nothing was imported.' }
  const words: LyricWord[] = []
  const seen = new Set<string>()
  for (const item of row.words) {
    if (!item || typeof item !== 'object') continue
    const word = item as Record<string, unknown>
    const surface = typeof word.surface === 'string' ? word.surface.trim() : ''
    const gloss = typeof word.gloss === 'string' ? word.gloss.trim() : ''
    const line = typeof word.line === 'string' ? word.line.trim() : ''
    const reading = typeof word.reading === 'string' ? word.reading.trim() : ''
    const relatedTo = typeof word.relatedTo === 'string' ? word.relatedTo.trim() : ''
    if (!surface || !gloss || !line || seen.has(surface)) continue
    if (languageId && !acceptsImportedWord(languageId, surface, reading)) continue
    seen.add(surface)
    words.push({
      surface,
      gloss,
      line,
      ...(reading ? { reading } : {}),
      ...(relatedTo ? { relatedTo } : {}),
    })
    if (words.length >= LYRIC_WORD_CAP) break
  }
  if (!words.length) return { error: 'No playable words in that paste. Nothing was imported.' }
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  return { pack: { title, lines, words } }
}

export async function loadLyricsPack(languageId: string): Promise<LyricPack | null> {
  const row = await db.settings.get(settingsKey(languageId))
  if (!row?.value) return null
  try {
    const parsed = JSON.parse(row.value) as LyricPack
    if (!parsed || !Array.isArray(parsed.lines) || !Array.isArray(parsed.words)) return null
    return parsed
  } catch {
    return null
  }
}

export async function saveLyricsPack(languageId: string, pack: LyricPack): Promise<void> {
  await db.settings.put({
    key: settingsKey(languageId),
    value: JSON.stringify({
      title: pack.title,
      lines: pack.lines,
      words: pack.words.slice(0, LYRIC_WORD_CAP),
    }),
  })
}

export function linesFromPaste(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Replace the stored lines. Words whose line is no longer in the source are dropped. This is not a grade. */
export function mergeLyricSource(
  existing: LyricPack | null,
  source: { title: string; lines: string[] },
): LyricPack {
  const lines = source.lines.map((line) => line.trim()).filter(Boolean)
  const kept = new Set(lines)
  const words = (existing?.words ?? [])
    .filter((word) => kept.has(word.line))
    .slice(0, LYRIC_WORD_CAP)
  return { title: source.title.trim(), lines, words }
}

export async function saveLyricLines(
  languageId: string,
  source: { title: string; lines: string[] },
): Promise<LyricPack> {
  const existing = await loadLyricsPack(languageId)
  const pack = mergeLyricSource(existing, source)
  await saveLyricsPack(languageId, pack)
  return pack
}

export interface LyricKnown {
  surface: string
  gloss: string
  reading?: string
}

export interface PresentedLyricWord extends LyricWord {
  known: boolean
  related?: LyricKnown
}

function surfaceKey(surface: string): string {
  return surface.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** A surface already in a lesson or the stash is known. relatedTo only attaches when that surface is known too. */
export function presentLyricWords(words: LyricWord[], known: LyricKnown[]): PresentedLyricWord[] {
  const byKey = new Map<string, LyricKnown>()
  for (const row of known) {
    const key = surfaceKey(row.surface)
    if (key && !byKey.has(key)) byKey.set(key, row)
  }
  return words.map((word) => {
    const relatedKey = word.relatedTo ? surfaceKey(word.relatedTo) : ''
    const related =
      relatedKey && relatedKey !== surfaceKey(word.surface) ? byKey.get(relatedKey) : undefined
    return {
      ...word,
      known: byKey.has(surfaceKey(word.surface)),
      ...(related ? { related } : {}),
    }
  })
}

export function lyricWordPhrase(word: LyricWord): {
  surface: string
  gloss: string
  reading?: string
  source: 'user'
} {
  return {
    surface: word.surface,
    gloss: word.gloss,
    ...(word.reading ? { reading: word.reading } : {}),
    source: 'user',
  }
}

/** The lyric line is the example, so a later stash session can build and say it. */
export function lyricLinePhrase(
  line: string,
  title: string,
): {
  surface: string
  gloss: string
  exampleSentence: string
  source: 'user'
} {
  return {
    surface: line,
    gloss: title.trim() ? `from ${title.trim()}` : 'a lyric line',
    exampleSentence: line,
    source: 'user',
  }
}

export function markLyricLine(
  line: string,
  surfaces: string[],
): { text: string; hit: boolean }[] {
  const needles = [...new Set(surfaces.map((surface) => surface.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  )
  if (!needles.length || !line) return [{ text: line, hit: false }]
  const ranges: { start: number; end: number }[] = []
  for (const needle of needles) {
    let from = 0
    while (from < line.length) {
      const at = line.indexOf(needle, from)
      if (at < 0) break
      const end = at + needle.length
      if (!ranges.some((range) => at < range.end && end > range.start)) {
        ranges.push({ start: at, end })
      }
      from = end
    }
  }
  ranges.sort((a, b) => a.start - b.start)
  if (!ranges.length) return [{ text: line, hit: false }]
  const parts: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start > cursor) parts.push({ text: line.slice(cursor, range.start), hit: false })
    parts.push({ text: line.slice(range.start, range.end), hit: true })
    cursor = range.end
  }
  if (cursor < line.length) parts.push({ text: line.slice(cursor), hit: false })
  return parts
}

const LYRIC_SAMPLES: Record<LanguageId, LyricPack> = {
  ja: {
    title: '朝',
    lines: ['今朝は静かです。', '水を飲みます。'],
    words: [
      { surface: '静か', reading: 'しずか', gloss: 'quiet', line: '今朝は静かです。', relatedTo: '今日' },
      { surface: '水', reading: 'みず', gloss: 'water', line: '水を飲みます。' },
    ],
  },
  zh: {
    title: '早晨',
    lines: ['今天早上很安静。', '我想喝水。'],
    words: [
      { surface: '安静', reading: 'ān jìng', gloss: 'quiet', line: '今天早上很安静。' },
      { surface: '喝', reading: 'hē', gloss: 'to drink', line: '我想喝水。', relatedTo: '水' },
    ],
  },
  ko: {
    title: '아침',
    lines: ['오늘은 날씨가 좋아요.', '창밖을 봐요.'],
    words: [
      { surface: '날씨', gloss: 'weather', line: '오늘은 날씨가 좋아요.', relatedTo: '오늘' },
      { surface: '창밖', gloss: 'outside the window', line: '창밖을 봐요.' },
    ],
  },
  ar: {
    title: 'الصَّبَاح',
    lines: ['الْيَوْمَ الْجَوُّ جَمِيلٌ.', 'أَشْرَبُ مَاءً.'],
    words: [
      { surface: 'الْجَوُّ', gloss: 'the weather', line: 'الْيَوْمَ الْجَوُّ جَمِيلٌ.', relatedTo: 'الْيَوْمَ' },
      { surface: 'أَشْرَبُ', gloss: 'I drink', line: 'أَشْرَبُ مَاءً.' },
    ],
  },
  es: {
    title: 'La mañana',
    lines: ['Hoy el cielo está claro.', 'Quiero agua.'],
    words: [
      { surface: 'cielo', gloss: 'sky', line: 'Hoy el cielo está claro.', relatedTo: 'Hoy' },
      { surface: 'quiero', gloss: 'I want', line: 'Quiero agua.' },
    ],
  },
  id: {
    title: 'Pagi',
    lines: ['Hari ini langit cerah.', 'Saya mau air.'],
    words: [
      { surface: 'langit', gloss: 'sky', line: 'Hari ini langit cerah.', relatedTo: 'Hari ini' },
      { surface: 'cerah', gloss: 'clear', line: 'Hari ini langit cerah.' },
    ],
  },
}

export function sampleLyricPack(languageId: LanguageId): LyricPack {
  const sample = LYRIC_SAMPLES[languageId]
  return {
    title: sample.title,
    lines: [...sample.lines],
    words: sample.words.map((word) => ({ ...word })),
  }
}
