import { describe, expect, it } from 'vitest'
import { buildLineCheckBrief, missFacet, parseLineCheck } from './lineCheck'

describe('check this line', () => {
  it('names the miss without a score and hides the corrected line', () => {
    const brief = buildLineCheckBrief({
      languageName: 'Japanese',
      typed: '仕事は今日をします。',
      target: '今日は仕事をします。',
      facet: 'word order',
    })
    expect(brief).toContain('Japanese')
    expect(brief).toContain('word order')
    expect(brief).toContain('not a score')
    expect(brief).not.toMatch(/\d+%/)
    expect(brief).not.toMatch(/Indonesian|Hari ini/)
    const parsed = parseLineCheck(
      JSON.stringify({
        differs: 'The time word moved.',
        hint: 'Start with the time word.',
        corrected: '今日は仕事をします。',
      }),
      '今日は仕事をします。',
    )
    expect(parsed.hint).toBe('Start with the time word.')
    expect(parsed.hint).not.toContain('今日は仕事をします。')
  })

  it('shows nothing when the hint is the sentence', () => {
    const parsed = parseLineCheck(
      '{"hint":"今日は仕事をします。","corrected":"今日は仕事をします。"}',
      '今日は仕事をします。',
    )
    expect(parsed.hint).toBeUndefined()
    expect(parsed.error).toMatch(/Nothing was shown/)
  })

  it('calls a reordered line a word-order miss', () => {
    expect(missFacet('仕事は 今日を します。', '今日は 仕事を します。')).toBe('word order')
  })
})
