import { describe, expect, it } from 'vitest'
import { getPhraseUnit } from '../data/fixtures'
import { buildJourneyBrief, buildNextLessonBrief, lockedJourneyTitle, openJourneyUnit, parseJourneyPack, parseNextLesson } from './journeyPack'
import { buildTutorBrief } from './tutorPack'

const pack = JSON.stringify({
  language: 'French',
  units: [
    {
      title: 'Ask for water',
      sentence: "Je voudrais de l'eau.",
      gloss: 'I would like some water.',
      chunks: ['Je voudrais', "de l'eau"],
      ask: 'eau',
      askGloss: 'water',
      lure: 'merci',
      boss: 'Someone asks what you want to drink.',
    },
    {
      title: 'Say thanks',
      sentence: 'Merci beaucoup.',
      gloss: 'Thank you very much.',
      chunks: ['Merci', 'beaucoup'],
      ask: 'Merci',
      askGloss: 'thanks',
      lure: 'bonjour',
      boss: 'Someone hands you the water.',
    },
  ],
})

describe('journey paste', () => {
  it('names the language and rejects other languages in the brief', () => {
    const brief = buildJourneyBrief('French')
    expect(brief).toContain('French')
    expect(brief).toContain('Do not use examples from any other language')
    expect(brief).not.toContain('Indonesian')
  })

  it('stores unit 1 as the open unit and keeps unit 2 locked', () => {
    const parsed = parseJourneyPack(pack, 'French')
    expect(parsed.error).toBeUndefined()
    const stored = { languageName: 'French', units: parsed.units, cleared: [] }
    expect(openJourneyUnit(stored)?.title).toBe('Ask for water')
    expect(lockedJourneyTitle(stored)).toBe('Say thanks')
    const after = { ...stored, cleared: [parsed.units[0].id] }
    expect(openJourneyUnit(after)?.title).toBe('Say thanks')
  })

  it('imports nothing when the JSON is invalid or the language does not match', () => {
    expect(parseJourneyPack('not json', 'French').units).toEqual([])
    expect(parseJourneyPack('not json', 'French').error).toMatch(/Nothing was imported/)
    const other = parseJourneyPack(pack, 'Japanese')
    expect(other.units).toEqual([])
    expect(other.error).toMatch(/Nothing was imported/)
  })

  it('appends without treating a cleared sentence as new', () => {
    const first = parseJourneyPack(pack, 'French').units
    const again = parseJourneyPack(pack, 'French').units
    const ids = new Set([...first, ...again].map((unit) => unit.id))
    expect(ids.size).toBe(first.length)
  })
})

describe('next lesson', () => {
  it('adds one unit for the goal and keeps a Korean paste free of Indonesian', () => {
    const korean = getPhraseUnit('ko')
    const brief = buildNextLessonBrief('Korean', 'Travel & get around', [
      korean?.targetSentence ?? '',
    ])
    expect(brief).toContain('Travel & get around')
    expect(brief).toContain('Korean')
    expect(brief).toContain('one new move')
    expect(brief).not.toMatch(/Indonesian|Hari ini|kerja/)
    const sample = JSON.stringify({
      language: 'Korean',
      unit: {
        title: korean?.title,
        sentence: korean?.targetSentence,
        gloss: korean?.targetGloss,
        chunks: korean?.buildChunks,
        ask: korean?.turnPromptSurface,
        askGloss: korean?.spotGlossB,
        lure: '해요',
        boss: 'Someone asks what you are doing today.',
      },
    })
    expect(sample).not.toMatch(/Indonesian|Hari ini|kerja/)
    const parsed = parseNextLesson(sample, 'Korean', 'ko')
    expect(parsed.unit?.sentence).toBe('오늘은 일해요.')
    const two = parseNextLesson(pack.replace('French', 'Korean'), 'Korean')
    expect(two.unit?.title).toBe('Ask for water')
    expect(two.unit?.sentence).not.toBe('Merci beaucoup.')
  })
})

describe('tutor brief language lock', () => {
  it('forbids examples from other languages', () => {
    const brief = buildTutorBrief({
      languageName: 'Korean',
      writingSystem: 'Hangul',
      scriptFamiliarity: 'new',
      goalTitle: 'Talk about today',
      phraseReady: true,
      scriptWarmupNeeded: false,
      latinSounds: false,
      abilities: [],
      known: [],
      weakSpots: [],
    })
    expect(brief).toContain('Korean')
    expect(brief).toContain('Do not use examples from any other language')
  })
})
