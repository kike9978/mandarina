import { describe, expect, it } from 'vitest'
import {
  clipTranscript,
  formatTranscriptForBrief,
  MAX_TRANSCRIPT_BRIEF,
  parseTranscript,
} from './transcript'

describe('parseTranscript', () => {
  it('keeps plain words', () => {
    const parsed = parseTranscript('Jakarta itu panas.\nMau makan apa?')
    expect(parsed.kind).toBe('text')
    expect(parsed.text).toContain('Mau makan apa?')
    expect(parsed.error).toBeUndefined()
  })

  it('strips VTT timestamps and tags', () => {
    const parsed = parseTranscript(`WEBVTT

00:00:01.000 --> 00:00:04.000
<c>Jakarta</c> itu panas.

00:00:04.000 --> 00:00:07.000
Mau makan apa?`)
    expect(parsed.kind).toBe('vtt')
    expect(parsed.text).toBe('Jakarta itu panas.\nMau makan apa?')
  })

  it('strips SRT indexes and drops repeated cues', () => {
    const parsed = parseTranscript(`1
00:00:01,000 --> 00:00:03,000
Saya suka jalan.

2
00:00:03,000 --> 00:00:05,000
Saya suka jalan.

3
00:00:05,000 --> 00:00:07,000
Ada warung di sini.`)
    expect(parsed.kind).toBe('srt')
    expect(parsed.text).toBe('Saya suka jalan.\nAda warung di sini.')
  })

  it('rejects empty captions', () => {
    expect(parseTranscript('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n').error).toMatch(
      /no words/i,
    )
    expect(parseTranscript('   ').error).toMatch(/No words/)
  })
})

describe('clipTranscript', () => {
  it('marks overflow for the brief', () => {
    const long = 'halo '.repeat(MAX_TRANSCRIPT_BRIEF)
    const brief = formatTranscriptForBrief(long)
    expect(brief).toContain('clipped')
    expect(clipTranscript('short').clipped).toBe(false)
  })
})
