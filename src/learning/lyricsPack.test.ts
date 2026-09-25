import { describe, expect, it } from 'vitest'
import { buildUnitFromStash } from './templateBridge'
import { acceptsImportedWord } from './readingAid'
import {
  buildLyricsBrief,
  linesFromPaste,
  lyricLinePhrase,
  lyricWordPhrase,
  markLyricLine,
  mergeLyricSource,
  parseLyricsPack,
  presentLyricWords,
  sampleLyricPack,
} from './lyricsPack'

describe('from these lyrics', () => {
  it('asks for a short word list in the active language and drops a word with no reading aid', () => {
    const brief = buildLyricsBrief({
      languageName: 'Korean',
      known: ['오늘'],
      lines: ['오늘 날씨가 좋아요'],
      title: '날씨',
    })
    expect(brief).toContain('Korean')
    expect(brief).toContain('오늘')
    expect(brief).toContain('Cap at eight')
    expect(brief).not.toMatch(/Indonesian|Hari ini|kerja/)

    const parsed = parseLyricsPack(
      `Here you go\n\`\`\`json\n${JSON.stringify({
        title: '朝',
        lines: ['今朝は仕事です', '水を飲みます'],
        words: [
          { surface: '今朝', reading: 'けさ', gloss: 'this morning', line: '今朝は仕事です', relatedTo: '仕事' },
          { surface: '水', gloss: 'water', line: '水を飲みます' },
        ],
      })}\n\`\`\``,
      'ja',
    )
    expect(parsed.error).toBeUndefined()
    expect(parsed.pack?.lines).toEqual(['今朝は仕事です', '水を飲みます'])
    expect(parsed.pack?.words.map((word) => word.surface)).toEqual(['今朝'])
    expect(parsed.pack?.words[0]?.relatedTo).toBe('仕事')
    expect(parsed.pack?.words[0]?.line).toBe('今朝は仕事です')

    const unaided = parseLyricsPack(
      JSON.stringify({
        lines: ['人'],
        words: [{ surface: '人', gloss: 'person', line: '人' }],
      }),
      'zh',
    )
    expect(unaided.pack).toBeUndefined()
    expect(unaided.error).toMatch(/Nothing was imported/)
  })

  it('imports nothing when the paste is not the lyric shape', () => {
    expect(parseLyricsPack('not json', 'ja').pack).toBeUndefined()
    expect(parseLyricsPack('not json', 'ja').error).toMatch(/Nothing was imported/)
    const bare = parseLyricsPack(JSON.stringify({ lines: ['あさ'] }), 'ja')
    expect(bare.pack).toBeUndefined()
    expect(bare.error).toMatch(/Nothing was imported/)
  })

  it('stores pasted lines without a success rating', () => {
    const lines = linesFromPaste('오늘은 날씨가 좋아요.\n\n창밖을 봐요.\n')
    const pack = mergeLyricSource(null, { title: '아침', lines })
    expect(pack.lines).toEqual(['오늘은 날씨가 좋아요.', '창밖을 봐요.'])
    expect(pack.words).toEqual([])
    expect(JSON.stringify(pack)).not.toMatch(/success|Good/)
  })

  it('marks a known word and keeps a new word beside the one they have', () => {
    const presented = presentLyricWords(
      [
        { surface: '오늘', gloss: 'today', line: '오늘은 날씨가 좋아요.' },
        { surface: '날씨', gloss: 'weather', line: '오늘은 날씨가 좋아요.', relatedTo: '오늘' },
      ],
      [{ surface: '오늘', gloss: 'today' }],
    )
    expect(presented[0]?.known).toBe(true)
    expect(presented[1]?.known).toBe(false)
    expect(presented[1]?.related?.surface).toBe('오늘')
    expect(presented[1]?.related?.gloss).toBe('today')
  })

  it('stashes a lyric line as the example so it can be built and said', () => {
    const phrase = lyricLinePhrase('오늘은 날씨가 좋아요.', '아침')
    expect(phrase.exampleSentence).toBe('오늘은 날씨가 좋아요.')
    expect(phrase).not.toHaveProperty('outcome')
    const unit = buildUnitFromStash([{ id: 'line-1', ...phrase }], 'ko')
    expect(unit?.productionReady).toBe(true)
    expect(unit?.targetSentence).toBe('오늘은 날씨가 좋아요.')

    const word = lyricWordPhrase({ surface: '날씨', gloss: 'weather', line: '오늘은 날씨가 좋아요.' })
    expect(word).not.toHaveProperty('exampleSentence')
    expect(word).not.toHaveProperty('outcome')
  })

  it('highlights the new word inside the line', () => {
    expect(markLyricLine('오늘은 날씨가 좋아요.', ['날씨'])).toEqual([
      { text: '오늘은 ', hit: false },
      { text: '날씨', hit: true },
      { text: '가 좋아요.', hit: false },
    ])
  })

  it('keeps the Korean sample and word list free of Indonesian', () => {
    const sample = sampleLyricPack('ko')
    const packed = JSON.stringify(sample)
    expect(packed).not.toMatch(/Indonesian|Hari ini|kerja|Saya lapar/)
    expect(sample.lines.join('')).toMatch(/[가-힣]/)
    expect(sample.words.length).toBeLessThanOrEqual(8)
    for (const word of sample.words) {
      expect(word.line.length).toBeGreaterThan(0)
      expect(acceptsImportedWord('ko', word.surface, word.reading)).toBe(true)
    }
    for (const id of ['ja', 'zh', 'ar', 'es', 'id'] as const) {
      for (const word of sampleLyricPack(id).words) {
        expect(acceptsImportedWord(id, word.surface, word.reading)).toBe(true)
      }
    }
  })
})
