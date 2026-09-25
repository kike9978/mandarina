import { describe, expect, it } from 'vitest'
import { buildSceneBrief, parseScene } from './scenePaste'

describe('scene paste', () => {
  it('asks for a question the sentence answers and rejects the sentence as the opener', () => {
    const sentence = '今日は仕事をします。'
    const brief = buildSceneBrief({
      languageName: 'Japanese',
      sentence,
      gloss: "I'm working today.",
    })
    expect(brief).toContain('Japanese')
    expect(brief).toContain(sentence)
    expect(brief).not.toMatch(/Indonesian|Hari ini/)
    const parsed = parseScene(
      JSON.stringify({
        opener: 'What are you doing today?',
        followUps: ['Say it once more.', 'One more time.'],
      }),
      sentence,
    )
    expect(parsed.opener).toBe('What are you doing today?')
    expect(parseScene(JSON.stringify({ opener: sentence }), sentence).opener).toBeUndefined()
  })
})
