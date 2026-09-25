import type { ListeningMedium } from '../data/fixtures'
import { isHttpsUrl } from './mediaUrl'
import { formatTranscriptForBrief, parseTranscript } from './transcript'
import type { TutorBriefInput } from './tutorPack'
import { extractJsonValue } from './tutorPack'

export const MAX_POSTS_PER_STOP = 3

export interface SourcePackRow {
  title: string
  creator: string
  medium: ListeningMedium
  search: string
  why: string
  url?: string
  listenFor?: string[]
  transcript?: string
}

export interface ParseSourcesResult {
  rows: SourcePackRow[]
  skippedDuplicate: number
  dropped: number
  error?: string
}

function isSourceShaped(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  return Boolean(
    String(o.title ?? '').trim() &&
      (String(o.url ?? '').trim() || String(o.search ?? o.creator ?? '').trim()),
  )
}

export function asSource(raw: unknown): SourcePackRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const title = String(o.title ?? '').trim()
  const creator = String(o.creator ?? '').trim()
  const why = String(o.why ?? '').trim()
  const url = String(o.url ?? '').trim()
  const mediumRaw = String(o.medium ?? '').trim().toLowerCase()
  const medium: ListeningMedium | null =
    mediumRaw === 'podcast'
      ? 'podcast'
      : mediumRaw === 'video' || mediumRaw === ''
        ? 'video'
        : null
  if (!title || !creator || !why || !medium) return null
  if (!isHttpsUrl(url)) return null
  const search = String(o.search ?? '').trim() || title
  const listenFor = Array.isArray(o.listenFor)
    ? o.listenFor.map((w) => String(w).trim()).filter(Boolean).slice(0, 6)
    : undefined
  const transcriptRaw = String(o.transcript ?? '').trim()
  const transcript = transcriptRaw ? parseTranscript(transcriptRaw).text : ''
  return {
    title,
    creator,
    medium,
    search,
    why,
    url,
    listenFor: listenFor?.length ? listenFor : undefined,
    transcript: transcript || undefined,
  }
}

export function parseSourceItems(
  items: unknown[],
  existingTitles: string[] = [],
  slotsLeft = MAX_POSTS_PER_STOP,
): ParseSourcesResult {
  const seen = new Set(existingTitles.map((t) => t.replace(/\s/g, '').toLowerCase()))
  const rows: SourcePackRow[] = []
  let skippedDuplicate = 0
  let dropped = 0

  for (const item of items) {
    const row = asSource(item)
    if (!row) {
      dropped += 1
      continue
    }
    const key = row.title.replace(/\s/g, '').toLowerCase()
    if (seen.has(key)) {
      skippedDuplicate += 1
      continue
    }
    if (rows.length >= slotsLeft) break
    seen.add(key)
    rows.push(row)
  }

  if (rows.length === 0) {
    return {
      rows,
      skippedDuplicate,
      dropped,
      error:
        slotsLeft <= 0
          ? 'This stop already has two listens.'
          : skippedDuplicate > 0
            ? `Those ${skippedDuplicate} were already aboard.`
            : 'Hmm — no playable listens in that pack (each needs an https link)',
    }
  }

  return { rows, skippedDuplicate, dropped }
}

export function looksLikeSourcesPack(raw: string): boolean {
  const value = extractJsonValue(raw)
  if (value == null) return false
  if (Array.isArray(value)) return isSourceShaped(value[0])
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    if (o.kind === 'sources') return true
    const items = o.items ?? o.sources
    return Array.isArray(items) && isSourceShaped(items[0])
  }
  return false
}

export function parseSourcesPack(
  raw: string,
  existingTitles: string[] = [],
  slotsLeft = MAX_POSTS_PER_STOP,
): ParseSourcesResult {
  const value = extractJsonValue(raw)
  if (value == null) {
    return {
      rows: [],
      skippedDuplicate: 0,
      dropped: 0,
      error: 'Hmm — no listens in that pack',
    }
  }
  const o = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
  const items = Array.isArray(value)
    ? value
    : Array.isArray(o?.items)
      ? o.items
      : Array.isArray(o?.sources)
        ? o.sources
        : []

  return parseSourceItems(items, existingTitles, slotsLeft)
}

function snapshotLines(input: TutorBriefInput): string {
  const abilityLines = input.abilities
    .map((a) => `- ${a.status === 'done' ? 'I can' : a.status === 'partial' ? 'Working on' : 'Not yet'}: ${a.title}`)
    .join('\n')
  const knownLines =
    input.known.length === 0
      ? '- (nothing locked in yet)'
      : input.known
          .slice(0, 16)
          .map((k) => `- ${k.surface} = ${k.gloss}`)
          .join('\n')
  const weakLines =
    input.weakSpots.length === 0
      ? '- none lately'
      : input.weakSpots
          .slice(0, 6)
          .map((w) => `- ${w.surface}`)
          .join('\n')
  return `Learner
- Language: ${input.languageName} (${input.writingSystem})
- Writing familiarity: ${input.scriptFamiliarity}
- Goal: ${input.goalTitle}

Abilities
${abilityLines}

They already have
${knownLines}

Soft weak spots
${weakLines}`
}

export function buildFindListenBrief(
  input: TutorBriefInput & { stopTitle: string; sourcesAboard: string[] },
): string {
  const aboard =
    input.sourcesAboard.length === 0
      ? '- none yet'
      : input.sourcesAboard.map((s) => `- ${s}`).join('\n')
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.

${snapshotLines(input)}

Listens already aboard — do not repeat these titles
${aboard}

What to write
Suggest at most 3 listens that fit this stop: ${input.stopTitle}.
Each listen MUST include a real https url Mandarina can play (YouTube, Vimeo, or a direct audio file).
Do not invent that they already watched it. Do not set schedules. Do not invent a broken link.

{"kind":"sources","items":[{"title","creator","medium":"video|podcast","url","search?","why","listenFor?"}]}
url is required. search is a fallback label only.`
}

export function buildPullLinesBrief(
  input: TutorBriefInput & {
    sourceTitle: string
    sourceCreator: string
    sourceSearch: string
    sourceUrl?: string
    transcript?: string
  },
): string {
  const link = input.sourceUrl
    ? `- Playable link: ${input.sourceUrl}`
    : `- Search they used: ${input.sourceSearch}`
  const words = input.transcript?.trim()
    ? `

Words from the listen — treat these as the source of truth
${formatTranscriptForBrief(input.transcript)}`
    : ''
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.

${snapshotLines(input)}

Source they chose
- ${input.sourceTitle} · ${input.sourceCreator}
${link}${words}

What to write
Pull 3–8 short phrases they would actually hear at that link. Each needs an exampleSentence (the line it showed up in) and sourceTitle.
Reuse pieces they already know and add one neighbor move. Do not repeat known surfaces. Do not set schedules.

{"phrases":[{"surface","gloss","reading?","exampleSentence","sourceTitle":"${input.sourceTitle}"}]}`
}

export function buildProcessWordsBrief(
  input: TutorBriefInput & {
    sourceTitle: string
    sourceCreator: string
    sourceUrl?: string
    transcript: string
  },
): string {
  const link = input.sourceUrl ? `- Playable link: ${input.sourceUrl}` : ''
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.

${snapshotLines(input)}

Source they chose
- ${input.sourceTitle} · ${input.sourceCreator}
${link}

Words from the listen — treat these as the source of truth
${formatTranscriptForBrief(input.transcript)}

What to write
From THESE words only, pick 3–8 useful vocabulary items or short phrases.
Each needs a gloss and an exampleSentence that actually appears in the words (or a tight slice of a line that appears).
Do not invent lines that are not in the words. Reuse pieces they already know and add one neighbor move. Do not repeat known surfaces. Do not set schedules.

{"phrases":[{"surface","gloss","reading?","exampleSentence","sourceTitle":"${input.sourceTitle}"}]}`
}
