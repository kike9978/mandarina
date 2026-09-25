import type { LanguageId } from '../data/languages'
import { annotateReading, type RubySpan } from './ruby'

const HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/
const ARABIC_LETTER = /[\u0621-\u064A]/
const TASHKEEL = /[\u064B-\u0652\u0670]/

/** A line may carry its reading after a pipe: 今天很热。|jīn tiān hěn rè */
export function splitAnnotatedLine(line: string): { text: string; reading?: string } {
  const pipe = line.indexOf('|')
  if (pipe < 0) return { text: line.trim() }
  const text = line.slice(0, pipe).trim()
  const reading = line.slice(pipe + 1).trim()
  return { text, reading: reading || undefined }
}

export function scriptNeedsAid(languageId: string, text: string): boolean {
  if (languageId === 'ja' || languageId === 'zh') return HAN.test(text)
  if (languageId === 'ar') return ARABIC_LETTER.test(text)
  return false
}

function arabicVocalized(text: string): boolean {
  return text.split(/\s+/).every((word) => {
    const bare = word.replace(/[^\u0621-\u064A\u064B-\u0652\u0670]/g, '')
    if (!ARABIC_LETTER.test(bare)) return true
    return TASHKEEL.test(bare)
  })
}

function pinyinParts(surface: string, reading: string): RubySpan[] | null {
  const syllables = reading.trim().split(/\s+/).filter(Boolean)
  const hans = [...surface].filter((ch) => HAN.test(ch))
  if (hans.length === 0) return [{ text: surface }]
  if (syllables.length !== hans.length) return null
  let index = 0
  return [...surface].map((ch) => {
    if (!HAN.test(ch)) return { text: ch }
    return { text: ch, reading: syllables[index++] }
  })
}

/** Null when a kanji, hanzi, or beginner Arabic word has no aid. Korean, Spanish, and Indonesian never need one. */
export function readingSpans(
  languageId: string,
  surface: string,
  reading?: string,
): RubySpan[] | null {
  const text = surface.trim()
  if (!text) return null
  if (!scriptNeedsAid(languageId, text)) return [{ text }]
  if (languageId === 'ar') return arabicVocalized(text) ? [{ text }] : null
  if (!reading?.trim()) return null
  if (languageId === 'zh') return pinyinParts(text, reading)
  const spans = annotateReading(text, reading)
  const bareKanji = spans.some((span) => HAN.test(span.text) && !span.reading)
  return bareKanji ? null : spans
}

export function acceptsImportedWord(
  languageId: LanguageId | string,
  surface: string,
  reading?: string,
): boolean {
  return readingSpans(languageId, surface, reading) != null
}
