import { languageLockLine } from './tutorPack'

export function missFacet(typed: string, target: string): string {
  const compact = (value: string) => value.replace(/\s/g, '')
  const letters = (value: string) => [...compact(value)].sort().join('')
  if (compact(typed) !== compact(target) && letters(typed) === letters(target)) return 'word order'
  if (Math.abs(compact(typed).length - compact(target).length) <= 2) return 'particle'
  return 'word'
}

export function buildLineCheckBrief(input: {
  languageName: string
  typed: string
  target: string
  facet: string
}): string {
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(input.languageName)}

The learner missed a line. This is not a score.
- They typed: ${input.typed}
- The target: ${input.target}
- What to look at: ${input.facet}

Reply with what differs, one corrected line, and one hint. The hint must not be the corrected line.

{"differs":"...","hint":"...","corrected":"..."}`
}

export function parseLineCheck(
  raw: string,
  target: string,
): { hint?: string; error?: string } {
  const text = raw.trim()
  if (!text) return { error: 'That paste is not valid JSON. Nothing was shown.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { error: 'That paste is not valid JSON. Nothing was shown.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'That paste is not valid JSON. Nothing was shown.' }
  }
  const hint = (value as { hint?: unknown }).hint
  if (typeof hint !== 'string' || !hint.trim()) {
    return { error: 'That paste has no hint. Nothing was shown.' }
  }
  const line = hint.trim()
  if (line === target.trim()) {
    return { error: 'That hint is the sentence itself. Nothing was shown.' }
  }
  return { hint: line }
}
