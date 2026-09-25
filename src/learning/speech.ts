/** Device STT when the browser has it; otherwise a local mock. No cloud. */

export type MicCapability = 'speech' | 'mock'

export interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

export interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === 'undefined') return null
  const w = window as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function detectMicCapability(): MicCapability {
  return getSpeechRecognitionCtor() ? 'speech' : 'mock'
}

/** Live STT only after the device already allowed the mic — never prompt in Part A. */
export async function canUseLiveSpeech(): Promise<boolean> {
  if (!getSpeechRecognitionCtor()) return false
  const permissions = navigator.permissions
  if (!permissions?.query) return false
  try {
    const status = await permissions.query({
      name: 'microphone' as PermissionName,
    })
    return status.state === 'granted'
  } catch {
    return false
  }
}

/** Growing prefixes so the listening UI can show a live transcript. */
export function mockPartials(target: string): string[] {
  const trimmed = target.trim()
  if (!trimmed) return ['…']
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return words.map((_, i) => words.slice(0, i + 1).join(' '))
  }
  const step = Math.max(1, Math.ceil(trimmed.length / 4))
  const out: string[] = []
  for (let i = step; i < trimmed.length; i += step) {
    out.push(trimmed.slice(0, i))
  }
  out.push(trimmed)
  return out
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Practice mic: a beat of listening, then nothing to paste. It does not type the answer. */
export async function runMockListen(
  _target: string,
  onPartial: (text: string) => void,
  opts?: { delayMs?: number; signal?: AbortSignal },
): Promise<string> {
  const delay = opts?.delayMs ?? 220
  if (opts?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  onPartial('…')
  if (delay > 0) await pause(delay)
  return ''
}

export function startLiveListen(opts: {
  lang?: string
  onPartial: (text: string) => void
  onFinal: (text: string) => void
  onError: (kind: 'denied' | 'unavailable') => void
}): () => void {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    opts.onError('unavailable')
    return () => {}
  }

  const rec = new Ctor()
  rec.lang = opts.lang ?? 'en-US'
  rec.interimResults = true
  rec.maxAlternatives = 1
  rec.continuous = false
  let finished = false

  rec.onresult = (ev) => {
    let interim = ''
    let finalText = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const row = ev.results[i]
      const piece = row[0]?.transcript?.trim() ?? ''
      if (!piece) continue
      if (row.isFinal) finalText = piece
      else interim = piece
    }
    if (interim) opts.onPartial(interim)
    if (finalText && !finished) {
      finished = true
      opts.onFinal(finalText)
    }
  }

  rec.onerror = (ev) => {
    if (finished) return
    finished = true
    opts.onError(ev.error === 'not-allowed' ? 'denied' : 'unavailable')
  }

  rec.onend = () => {
    if (!finished) opts.onError('unavailable')
  }

  try {
    rec.start()
  } catch {
    opts.onError('unavailable')
    return () => {}
  }

  return () => {
    finished = true
    try {
      rec.stop()
    } catch {
      /* ignore */
    }
  }
}
