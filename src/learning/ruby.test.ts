import { describe, expect, it } from 'vitest'
import { annotateReading } from './ruby'

describe('annotateReading', () => {
  it('puts furigana on kanji and leaves hiragana bare', () => {
    expect(annotateReading('今日', 'きょう')).toEqual([
      { text: '今日', reading: 'きょう' },
    ])
    expect(annotateReading('は')).toEqual([{ text: 'は' }])
    expect(annotateReading('します', 'します')).toEqual([{ text: 'します' }])
    expect(annotateReading('カタカナ', 'katakana')).toEqual([
      { text: 'カタカナ' },
    ])
  })

  it('keeps okurigana out from under the furigana', () => {
    expect(annotateReading('食べる', 'たべる')).toEqual([
      { text: '食', reading: 'た' },
      { text: 'べる' },
    ])
  })
})
