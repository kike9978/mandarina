import { describe, expect, it } from 'vitest'
import {
  buildFindListenBrief,
  buildProcessWordsBrief,
  buildPullLinesBrief,
  looksLikeSourcesPack,
  parseSourcesPack,
} from './listeningPack'
import { briefLeaksJargon, type TutorBriefInput } from './tutorPack'

const base: TutorBriefInput = {
  languageName: 'Indonesian',
  writingSystem: 'Latin alphabet',
  scriptFamiliarity: 'Pretty comfortable reading',
  goalTitle: 'Talk about daily life',
  phraseReady: true,
  scriptWarmupNeeded: false,
  latinSounds: true,
  abilities: [{ title: 'Talk about today', status: 'partial' }],
  known: [{ surface: 'Hari ini', gloss: 'today' }],
  weakSpots: [],
}

describe('parseSourcesPack', () => {
  it('drops a row without a real https url', () => {
    const result = parseSourcesPack(`{
      "kind": "sources",
      "items": [{
        "title": "Daily Indonesian: Hari ini",
        "creator": "Bahasa street chats",
        "medium": "video",
        "search": "hari ini saya Indonesian beginner",
        "why": "You'll hear hari ini in the wild.",
        "url": "not-a-link",
        "listenFor": ["hari ini"]
      }]
    }`)
    expect(result.rows).toHaveLength(0)
    expect(result.error).toMatch(/playable/)
  })

  it('skips titles already aboard and caps at two', () => {
    const result = parseSourcesPack(
      `{
        "items": [
          {"title":"A","creator":"C","medium":"video","url":"https://www.youtube.com/watch?v=8lDeyfxKrRk","why":"fits today"},
          {"title":"B","creator":"C","medium":"podcast","url":"https://cdn.example.com/b.mp3","why":"fits today"},
          {"title":"D","creator":"C","medium":"video","url":"https://www.youtube.com/watch?v=jNQXAC9IVRw","why":"fits today"}
        ]
      }`,
      ['A'],
      2,
    )
    expect(result.rows.map((r) => r.title)).toEqual(['B', 'D'])
    expect(result.skippedDuplicate).toBe(1)
  })

  it('keeps an https url and ignores junk fields', () => {
    const result = parseSourcesPack(`[{
      "title":"Coffee chat",
      "creator":"Street JP",
      "medium":"video",
      "search":"ordering coffee Tokyo beginner",
      "why":"Uses kudasai.",
      "url":"https://example.com/watch",
      "due":12
    }]`)
    expect(result.rows[0].url).toBe('https://example.com/watch')
  })

  it('keeps spoken words on a source row', () => {
    const result = parseSourcesPack(`[{
      "title":"Coffee chat",
      "creator":"Street JP",
      "medium":"video",
      "why":"Uses kudasai.",
      "url":"https://example.com/watch",
      "transcript":"WEBVTT\\n\\n00:00:01.000 --> 00:00:03.000\\nKopi panas."
    }]`)
    expect(result.rows[0].transcript).toBe('Kopi panas.')
  })

  it('does not invent rows from chatter', () => {
    expect(parseSourcesPack('just chatting').error).toMatch(/no listens/)
  })
})

describe('looksLikeSourcesPack', () => {
  it('distinguishes sources from phrase packs', () => {
    expect(looksLikeSourcesPack('{"kind":"sources","items":[]}')).toBe(true)
    expect(
      looksLikeSourcesPack('[{"surface":"Ada","gloss":"there is"}]'),
    ).toBe(false)
  })
})

describe('listening briefs', () => {
  it('asks for at most two listens without scheduler jargon', () => {
    const brief = buildFindListenBrief({
      ...base,
      stopTitle: 'Talking about today',
      sourcesAboard: ['Daily Indonesian: Hari ini'],
    })
    expect(brief).toContain('Talking about today')
    expect(brief).toContain('Daily Indonesian: Hari ini')
    expect(brief).toMatch(/at most 3/)
    expect(brief).toContain('kind')
    expect(brief).toMatch(/url MUST|url is required/i)
    expect(briefLeaksJargon(brief)).toBe(false)
  })

  it('aims pull-the-lines at one source', () => {
    const brief = buildPullLinesBrief({
      ...base,
      sourceTitle: 'Daily Indonesian: Hari ini',
      sourceCreator: 'Bahasa street chats',
      sourceSearch: 'hari ini saya',
      transcript: 'Hari ini saya pulang.',
    })
    expect(brief).toContain('Daily Indonesian: Hari ini')
    expect(brief).toContain('Hari ini saya pulang.')
    expect(brief).toContain('exampleSentence')
    expect(briefLeaksJargon(brief)).toBe(false)
  })

  it('packs the transcript into the from-the-words note', () => {
    const brief = buildProcessWordsBrief({
      ...base,
      sourceTitle: 'Easy Indonesian 1 — Old Jakarta',
      sourceCreator: 'Easy Languages',
      sourceUrl: 'https://www.youtube.com/watch?v=8lDeyfxKrRk',
      transcript: 'Jakarta itu panas.\nMau makan apa?',
    })
    expect(brief).toContain('Jakarta itu panas.')
    expect(brief).toContain('THESE words only')
    expect(brief).toContain('exampleSentence')
    expect(briefLeaksJargon(brief)).toBe(false)
  })
})
