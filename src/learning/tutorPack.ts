export interface TutorPackRow {
  surface: string
  gloss: string
  reading?: string
  exampleSentence?: string
  abilityTag?: string
}

export interface ParseTutorPackResult {
  rows: TutorPackRow[]
  noteTweaks: string[]
  skippedDuplicate: number
  dropped: number
  error?: string
}

const SKILL_WORDS = ['recognize', 'hear', 'say', 'write', 'use'] as const

function asRow(raw: unknown): TutorPackRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const surface = String(o.surface ?? '').trim()
  const gloss = String(o.gloss ?? '').trim()
  if (!surface || !gloss) return null
  return {
    surface,
    gloss,
    reading: String(o.reading ?? '').trim() || undefined,
    exampleSentence: String(o.exampleSentence ?? '').trim() || undefined,
    abilityTag: String(o.abilityTag ?? '').trim() || undefined,
  }
}

/** First JSON value in raw text or a ```json fence — object or array. */
export function extractJsonValue(raw: string): unknown | null {
  const text = raw.trim()
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = (fenced?.[1] ?? text).trim()
  const attempts = [body]
  const brace = body.indexOf('{')
  const bracket = body.indexOf('[')
  if (brace >= 0) {
    const end = body.lastIndexOf('}')
    if (end > brace) attempts.push(body.slice(brace, end + 1))
  }
  if (bracket >= 0) {
    const end = body.lastIndexOf(']')
    if (end > bracket) attempts.push(body.slice(bracket, end + 1))
  }
  for (const chunk of attempts) {
    try {
      return JSON.parse(chunk)
    } catch {
      /* try next shape */
    }
  }
  return null
}

/** First JSON array in raw text or a ```json fence. */
export function extractJsonArray(raw: string): unknown[] | null {
  const value = extractJsonValue(raw)
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    const nested = o.phrases ?? o.items ?? o.pack
    return Array.isArray(nested) ? nested : null
  }
  return null
}

export const MAX_TWEAKS_PER_PACK = 4
export const MAX_STORED_TWEAKS = 6
export const MAX_TWEAK_CHARS = 140

export function sanitizeNoteTweaks(
  raw: unknown,
  cap = MAX_TWEAKS_PER_PACK,
): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(/\n+/).map((s) => s.replace(/^[-*]\s*/, ''))
      : []
  const seen = new Set<string>()
  const tips: string[] = []
  for (const item of list) {
    const tip = String(item ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!tip || tip.length < 8) continue
    if (briefLeaksJargon(tip)) continue
    if (/ignore (all )?(previous|above)|you are now/i.test(tip)) continue
    const clipped = tip.slice(0, MAX_TWEAK_CHARS)
    const key = clipped.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tips.push(clipped)
    if (tips.length >= cap) break
  }
  return tips
}

export function mergeNoteTweaks(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const tip of [...incoming, ...existing]) {
    const key = tip.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(tip)
    if (merged.length >= MAX_STORED_TWEAKS) break
  }
  return merged
}

function phrasesAndTweaks(value: unknown): { items: unknown[]; tweaks: string[] } {
  if (Array.isArray(value)) return { items: value, tweaks: [] }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    const nested = o.phrases ?? o.items ?? o.pack
    return {
      items: Array.isArray(nested) ? nested : [],
      tweaks: sanitizeNoteTweaks(o.noteTweaks ?? o.coachNotes ?? o.briefTips),
    }
  }
  return { items: [], tweaks: [] }
}

export function parseTutorPack(
  raw: string,
  existingSurfaces: string[] = [],
): ParseTutorPackResult {
  const known = new Set(existingSurfaces.map((s) => s.replace(/\s/g, '').toLowerCase()))
  const extracted = extractJsonValue(raw)
  if (extracted == null) {
    return {
      rows: [],
      noteTweaks: [],
      skippedDuplicate: 0,
      dropped: 0,
      error: 'Hmm — no phrases in that pack',
    }
  }
  const { items: arr, tweaks: noteTweaks } = phrasesAndTweaks(extracted)

  const rows: TutorPackRow[] = []
  let skippedDuplicate = 0
  let dropped = 0
  const seen = new Set(known)

  for (const item of arr) {
    const row = asRow(item)
    if (!row) {
      dropped += 1
      continue
    }
    const key = row.surface.replace(/\s/g, '').toLowerCase()
    if (seen.has(key)) {
      skippedDuplicate += 1
      continue
    }
    seen.add(key)
    rows.push(row)
  }

  if (rows.length === 0 && noteTweaks.length === 0) {
    return {
      rows,
      noteTweaks,
      skippedDuplicate,
      dropped,
      error:
        skippedDuplicate > 0
          ? `Those ${skippedDuplicate} were already aboard.`
          : 'Hmm — no phrases in that pack',
    }
  }

  return { rows, noteTweaks, skippedDuplicate, dropped }
}

/** JSON array, fenced JSON, or TSV (surface\\tgloss\\texample). */
export function parsePackOrTsv(
  raw: string,
  existingSurfaces: string[] = [],
): ParseTutorPackResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return {
      rows: [],
      noteTweaks: [],
      skippedDuplicate: 0,
      dropped: 0,
      error: 'Hmm — no phrases in that pack',
    }
  }
  if (trimmed.includes('\t') && !trimmed.includes('[')) {
    const rows: TutorPackRow[] = []
    let skippedDuplicate = 0
    let dropped = 0
    const seen = new Set(
      existingSurfaces.map((s) => s.replace(/\s/g, '').toLowerCase()),
    )
    for (const line of trimmed.split('\n')) {
      const [surface, gloss, exampleSentence, reading] = line
        .split('\t')
        .map((c) => c.trim())
      if (!surface || !gloss) {
        if (line.trim()) dropped += 1
        continue
      }
      const key = surface.replace(/\s/g, '').toLowerCase()
      if (seen.has(key)) {
        skippedDuplicate += 1
        continue
      }
      seen.add(key)
      rows.push({
        surface,
        gloss,
        exampleSentence: exampleSentence || undefined,
        reading: reading || undefined,
      })
    }
    if (rows.length === 0) {
      return {
        rows,
        noteTweaks: [],
        skippedDuplicate,
        dropped,
        error:
          skippedDuplicate > 0
            ? `Those ${skippedDuplicate} were already aboard.`
            : 'Hmm — no phrases in that pack',
      }
    }
    return { rows, noteTweaks: [], skippedDuplicate, dropped }
  }
  return parseTutorPack(raw, existingSurfaces)
}

export interface TutorBriefInput {
  languageName: string
  writingSystem: string
  scriptFamiliarity: string
  goalTitle: string
  phraseReady: boolean
  scriptWarmupNeeded: boolean
  latinSounds: boolean
  abilities: { title: string; status: 'done' | 'partial' | 'locked' }[]
  known: {
    surface: string
    gloss: string
    reading?: string
    exampleSentence?: string
  }[]
  weakSpots: { surface: string; skill: string }[]
  /** Short rules from a previous tutor pack — never replace the snapshot. */
  coachTips?: string[]
}

const STATUS_LINE = {
  done: 'I can',
  partial: 'Working on',
  locked: 'Not yet',
} as const

function skillLabel(raw: string): string {
  const map: Record<string, string> = {
    recognition: 'recognize',
    listening: 'hear',
    production: 'say',
    writing: 'write',
    contextualUse: 'use',
  }
  return map[raw] ?? (SKILL_WORDS.includes(raw as (typeof SKILL_WORDS)[number]) ? raw : 'recognize')
}

/** Coach note for any chat model. Never mentions FSRS / SRS / due cards. */
export function buildTutorBrief(input: TutorBriefInput): string {
  const abilityLines = input.abilities
    .map((a) => `- ${STATUS_LINE[a.status]}: ${a.title}`)
    .join('\n')

  const knownLines =
    input.known.length === 0
      ? '- (nothing locked in yet)'
      : input.known
          .slice(0, 24)
          .map((k) => {
            const read = k.reading ? ` · ${k.reading}` : ''
            const ex = k.exampleSentence ? ` — e.g. ${k.exampleSentence}` : ''
            return `- ${k.surface}${read} = ${k.gloss}${ex}`
          })
          .join('\n')

  const weakLines =
    input.weakSpots.length === 0
      ? '- none lately — keep it gentle and one step ahead'
      : input.weakSpots
          .slice(0, 8)
          .map((w) => `- ${w.surface} (shaky: ${skillLabel(w.skill)})`)
          .join('\n')

  const ask = briefAsk(input)
  const tips = (input.coachTips ?? []).map((t) => t.trim()).filter(Boolean)
  const tipBlock =
    tips.length === 0
      ? ''
      : `

Keep these coaching rules
${tips.map((t) => `- ${t}`).join('\n')}`

  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.

Learner
- Language: ${input.languageName} (${input.writingSystem})
- Writing familiarity: ${input.scriptFamiliarity}
- Goal: ${input.goalTitle}

Abilities
${abilityLines}

They already have — do not repeat these surfaces
${knownLines}

Soft weak spots (no scores)
${weakLines}${tipBlock}

What to write
${ask}
Each phrase: {"surface","gloss","reading?","exampleSentence?","abilityTag?"}
Reply as a phrase array, or as {"phrases":[...],"noteTweaks":["up to 4 short rules for THIS note next time"]}.
noteTweaks are optional style/topic rules only. Do not rewrite the learner snapshot. Do not set schedules or mark skills done.
Cap 3–8 phrases.`
}

function briefAsk(input: TutorBriefInput): string {
  if (input.scriptWarmupNeeded && !input.latinSounds) {
    return 'They still need writing comfort. Propose 3–6 tiny bits (marks or short words) with reading, a hint, and a tiny example — not a dense paragraph.'
  }
  if (!input.phraseReady) {
    return 'They do not have a starter phrase cluster yet. Propose the first useful 3–8 phrases for their goal — this pack is the curriculum. Prefer a full example sentence for each.'
  }
  if (input.scriptWarmupNeeded && input.latinSounds) {
    return 'Propose 3–8 short phrases first. Light spelling notes only if a sound is new. Reuse pieces they already know and add one neighbor move. Prefer a full example sentence for each.'
  }
  return 'Propose 3–8 short phrases. Reuse pieces they already know and add one neighbor move. Prefer a full example sentence for each.'
}

export const FORBIDDEN_BRIEF_WORDS = ['fsrs', 'srs', 'due cards', 'stability', 'interval']

export function briefLeaksJargon(text: string): boolean {
  const lower = text.toLowerCase()
  return FORBIDDEN_BRIEF_WORDS.some((w) => lower.includes(w))
}
