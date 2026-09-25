/** Turn pasted or dropped captions into plain words we can send to a tutor. */

export const MAX_TRANSCRIPT_STORE = 80_000
export const MAX_TRANSCRIPT_BRIEF = 6_000

const CUE_TIME =
  /^(?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/m

export type TranscriptKind = 'vtt' | 'srt' | 'text'

export interface ParsedTranscript {
  text: string
  kind: TranscriptKind
  clipped: boolean
  error?: string
}

export function clipTranscript(
  raw: string,
  max = MAX_TRANSCRIPT_STORE,
): { text: string; clipped: boolean } {
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (text.length <= max) return { text, clipped: false }
  return { text: `${text.slice(0, max).trimEnd()}\n…`, clipped: true }
}

function stripCueTags(line: string): string {
  return line
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\{[^}]+\}/g, '')
    .trim()
}

function looksTimed(raw: string): boolean {
  const head = raw.trimStart()
  return /^WEBVTT/i.test(head) || CUE_TIME.test(raw)
}

function parseTimed(raw: string): string {
  const lines: string[] = []
  let last = ''
  for (const rawLine of raw.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (/^WEBVTT/i.test(line)) continue
    if (/^(NOTE|STYLE|REGION)\b/i.test(line)) continue
    if (CUE_TIME.test(line)) continue
    if (/^\d+$/.test(line)) continue
    const text = stripCueTags(line)
    if (!text) continue
    if (text === last) continue
    last = text
    lines.push(text)
  }
  return lines.join('\n')
}

export function parseTranscript(raw: string): ParsedTranscript {
  const source = raw.replace(/\r\n/g, '\n').trim()
  if (!source) {
    return { text: '', kind: 'text', clipped: false, error: 'No words in that paste.' }
  }
  const kind: TranscriptKind = /^WEBVTT/i.test(source)
    ? 'vtt'
    : looksTimed(source)
      ? 'srt'
      : 'text'
  const extracted = kind === 'text' ? stripCueTags(source) : parseTimed(source)
  if (!extracted.trim()) {
    return {
      text: '',
      kind,
      clipped: false,
      error: 'Hmm — those captions had no words I could keep.',
    }
  }
  const { text, clipped } = clipTranscript(extracted, MAX_TRANSCRIPT_STORE)
  return { text, kind, clipped }
}

export function formatTranscriptForBrief(raw: string): string {
  const { text, clipped } = clipTranscript(raw, MAX_TRANSCRIPT_BRIEF)
  if (!text) return '- (no words aboard yet)'
  const note = clipped
    ? '\n(clipped — use the start of the listen; more words can wait for a later note)'
    : ''
  return `${text}${note}`
}
