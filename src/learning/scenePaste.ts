import { samePhrase } from './templateBridge'
import { languageLockLine } from './tutorPack'

export function buildSceneBrief(input: {
  languageName: string
  sentence: string
  gloss: string
}): string {
  return `You are a language coach. Reply with ONLY JSON (no intro). I will paste it back into Mandarina.
${languageLockLine(input.languageName)}

Write a scene for this line. The opener is a question the sentence answers. Do not put the sentence in the opener.
- Sentence: ${input.sentence}
- Gloss: ${input.gloss}

{"opener":"...","followUps":["...","..."]}`
}

export function parseScene(
  raw: string,
  sentence: string,
): { opener?: string; error?: string } {
  const text = raw.trim()
  if (!text) return { error: 'That paste is not valid JSON. Nothing was used.' }
  let value: unknown
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    value = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
  } catch {
    return { error: 'That paste is not valid JSON. Nothing was used.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'That paste is not valid JSON. Nothing was used.' }
  }
  const opener = (value as { opener?: unknown }).opener
  if (typeof opener !== 'string' || !opener.trim()) {
    return { error: 'That paste has no opener. Nothing was used.' }
  }
  const line = opener.trim()
  if (samePhrase(line, sentence)) {
    return { error: 'That opener is the sentence itself. Nothing was used.' }
  }
  return { opener: line }
}
