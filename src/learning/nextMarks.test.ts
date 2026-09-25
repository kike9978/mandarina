import { describe, expect, it } from 'vitest'
import { buildNextMarksBrief, parseNextMarks } from './nextMarks'

describe('next marks', () => {
  it('adds marks after the first glyph and drops a kanji word with no reading', () => {
    const brief = buildNextMarksBrief('Japanese', ['あ'])
    expect(brief).toContain('Japanese')
    expect(brief).toContain('あ')
    expect(brief).not.toMatch(/Indonesian|Hari ini|kerja/)
    const parsed = parseNextMarks(
      JSON.stringify({
        marks: [
          { glyph: 'か', reading: 'ka', hint: 'ka', useWord: 'かさ', useGloss: 'umbrella' },
          { glyph: '水', hint: 'water', useWord: '水', useGloss: 'water' },
        ],
      }),
      'ja',
    )
    expect(parsed.marks.map((mark) => mark.glyph)).toEqual(['か'])
    expect(parsed.marks[0]?.usePhrase).toBe('かさ')
  })
})
