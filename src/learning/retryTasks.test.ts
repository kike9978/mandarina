import { describe, expect, it } from 'vitest'
import { buildRetryBrief, parseRetryPack } from './retryTasks'

describe('retry these misses', () => {
  it('keeps a writing miss as a writing task', () => {
    const brief = buildRetryBrief('Korean', [{ surface: '가', skill: 'writing' }])
    expect(brief).toContain('Korean')
    expect(brief).toContain('가')
    expect(brief).not.toMatch(/Indonesian|Hari ini|kerja/)
    const parsed = parseRetryPack(
      JSON.stringify({
        tasks: [
          { surface: '가', gloss: 'ga', facet: 'write' },
          { surface: '나', gloss: 'na', facet: 'meaning' },
          { surface: '다', gloss: 'da', facet: 'hear' },
          { surface: '라', gloss: 'ra', facet: 'say' },
        ],
      }),
    )
    expect(parsed.tasks).toHaveLength(3)
    expect(parsed.tasks[0]?.facet).toBe('writing')
    expect(parsed.tasks[1]?.facet).toBe('recognition')
  })

  it('imports nothing from invalid JSON', () => {
    expect(parseRetryPack('nope').tasks).toEqual([])
    expect(parseRetryPack('nope').error).toMatch(/Nothing was imported/)
  })
})
