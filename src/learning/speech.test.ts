import { describe, expect, it } from 'vitest'
import {
  canUseLiveSpeech,
  detectMicCapability,
  mockPartials,
  runMockListen,
} from './speech'

describe('mock listen helpers', () => {
  it('grows spaced sentences word by word', () => {
    expect(mockPartials('Hari ini saya ada kerja.')).toEqual([
      'Hari',
      'Hari ini',
      'Hari ini saya',
      'Hari ini saya ada',
      'Hari ini saya ada kerja.',
    ])
  })

  it('grows compact glyphs in chunks', () => {
    const parts = mockPartials('今日は仕事')
    expect(parts.at(-1)).toBe('今日は仕事')
    expect(parts.length).toBeGreaterThan(1)
    expect(parts[0]?.length).toBeLessThan(parts.at(-1)!.length)
  })

  it('plays partials then returns the target', async () => {
    const seen: string[] = []
    const heard = await runMockListen('元気ですか？', (t) => seen.push(t), {
      delayMs: 0,
    })
    expect(heard).toBe('元気ですか？')
    expect(seen.at(-1)).toBe('元気ですか？')
    expect(seen.length).toBeGreaterThan(0)
  })

  it('reports mock capability without a SpeechRecognition ctor', () => {
    expect(detectMicCapability()).toBe('mock')
  })

  it('does not start live STT without an allowed mic', async () => {
    await expect(canUseLiveSpeech()).resolves.toBe(false)
  })
})
