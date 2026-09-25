export interface RubySpan {
  text: string
  reading?: string
}

const KANJI = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/

function isKana(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return (
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xff66 && code <= 0xff9d)
  )
}

/** Furigana sits on kanji only. Hiragana and katakana stay bare, including okurigana. */
export function annotateReading(text: string, reading?: string): RubySpan[] {
  if (!reading || !KANJI.test(text)) return [{ text }]
  if (![...text].some(isKana)) return [{ text, reading }]

  const tokens: { kanji: boolean; text: string }[] = []
  for (const char of text) {
    const kanji = KANJI.test(char)
    const last = tokens[tokens.length - 1]
    if (last && last.kanji === kanji) last.text += char
    else tokens.push({ kanji, text: char })
  }

  let rest = reading
  return tokens.map((token, index) => {
    if (!token.kanji) {
      if (rest.startsWith(token.text)) rest = rest.slice(token.text.length)
      return { text: token.text }
    }
    const next = tokens.slice(index + 1).find((entry) => !entry.kanji)
    if (next) {
      const at = rest.indexOf(next.text)
      if (at >= 0) {
        const piece = rest.slice(0, at)
        rest = rest.slice(at)
        return piece ? { text: token.text, reading: piece } : { text: token.text }
      }
    }
    const piece = rest
    rest = ''
    return piece ? { text: token.text, reading: piece } : { text: token.text }
  })
}
