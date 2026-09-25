import { describe, expect, it } from 'vitest'
import { acceptsImportedWord, readingSpans } from './readingAid'

describe('readingSpans', () => {
  it('puts one pinyin syllable on each Mandarin character', () => {
    expect(readingSpans('zh', '明天', 'míng tiān')).toEqual([
      { text: '明', reading: 'míng' },
      { text: '天', reading: 'tiān' },
    ])
    expect(readingSpans('zh', '明天', 'míngtiān')).toBeNull()
  })

  it('keeps vowel marks on Arabic and hides a bare word', () => {
    expect(readingSpans('ar', 'أَنَا')).toEqual([{ text: 'أَنَا' }])
    expect(readingSpans('ar', 'أنا')).toBeNull()
  })

  it('hides a kanji with no reading and leaves kana bare', () => {
    expect(readingSpans('ja', '今日', 'きょう')).toEqual([
      { text: '今日', reading: 'きょう' },
    ])
    expect(readingSpans('ja', '今日')).toBeNull()
    expect(readingSpans('ja', 'します')).toEqual([{ text: 'します' }])
  })

  it('does not add ruby for Korean, Spanish, or Indonesian', () => {
    expect(readingSpans('ko', '오늘')).toEqual([{ text: '오늘' }])
    expect(readingSpans('es', 'Hoy yo trabajo.')).toEqual([
      { text: 'Hoy yo trabajo.' },
    ])
    expect(readingSpans('id', 'Hari ini saya kerja.')).toEqual([
      { text: 'Hari ini saya kerja.' },
    ])
  })
})

describe('acceptsImportedWord', () => {
  it('rejects a Mandarin or Arabic word that lacks its aid', () => {
    expect(acceptsImportedWord('zh', '水')).toBe(false)
    expect(acceptsImportedWord('zh', '水', 'shuǐ')).toBe(true)
    expect(acceptsImportedWord('ar', 'ماء')).toBe(false)
    expect(acceptsImportedWord('ar', 'مَاءٌ')).toBe(true)
    expect(acceptsImportedWord('es', 'agua')).toBe(true)
  })
})
