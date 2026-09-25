import { describe, expect, it } from 'vitest'
import { journalWords } from './journalWords'

describe('journalWords', () => {
  it('keeps furigana, pinyin, and vowel marks, and drops a bare word', () => {
    const words = journalWords('ja', [
      { surface: '仕事', reading: 'しごと', gloss: 'work' },
      { surface: '今日', gloss: 'today' },
    ])
    expect(words.map((word) => word.surface)).toEqual(['仕事'])
  })

  it('requires a syllable per Chinese character', () => {
    const words = journalWords('zh', [
      { surface: '今天', reading: 'jīn tiān', gloss: 'today' },
      { surface: '今天', reading: 'jīntiān', gloss: 'today' },
    ])
    expect(words).toHaveLength(1)
    expect(words[0]?.reading).toBe('jīn tiān')
  })

  it('keeps vocalized Arabic and drops an unvocalized word', () => {
    const words = journalWords('ar', [
      { surface: 'أَعْمَلُ', gloss: 'I work' },
      { surface: 'أعمل', gloss: 'I work' },
    ])
    expect(words.map((word) => word.surface)).toEqual(['أَعْمَلُ'])
  })

  it('does not require a reading for Korean, Spanish, or Indonesian', () => {
    expect(
      journalWords('ko', [{ surface: '일', gloss: 'work' }]).map((w) => w.surface),
    ).toEqual(['일'])
    expect(
      journalWords('es', [{ surface: 'trabajo', gloss: 'I work' }]),
    ).toHaveLength(1)
    expect(
      journalWords('id', [{ surface: 'kerja', gloss: 'work' }]),
    ).toHaveLength(1)
  })
})
