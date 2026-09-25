import { describe, expect, it } from 'vitest'
import {
  HIRAGANA_GRID,
  HIRAGANA_VOICED,
  KATAKANA_GRID,
  hasWritingChart,
} from '../data/writingCharts'

describe('writing charts', () => {
  it('keeps the gojūon readings and the empty corners', () => {
    expect(HIRAGANA_GRID[0]?.[0]).toEqual({ glyph: 'あ', reading: 'a' })
    expect(HIRAGANA_GRID[8]?.[1]).toBeNull()
    expect(HIRAGANA_GRID.at(-1)?.[0]).toEqual({ glyph: 'ん', reading: 'n' })
    expect(KATAKANA_GRID[0]?.[0]).toEqual({ glyph: 'ア', reading: 'a' })
    expect(HIRAGANA_VOICED[0]?.[0]).toEqual({ glyph: 'が', reading: 'ga' })
  })

  it('is only for the non-Latin languages', () => {
    expect(hasWritingChart('ja')).toBe(true)
    expect(hasWritingChart('zh')).toBe(true)
    expect(hasWritingChart('ko')).toBe(true)
    expect(hasWritingChart('ar')).toBe(true)
    expect(hasWritingChart('es')).toBe(false)
    expect(hasWritingChart('id')).toBe(false)
  })
})
