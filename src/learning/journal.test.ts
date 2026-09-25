import { describe, expect, it } from 'vitest'
import {
  applyJournalPrompt,
  buildJournalPromptBrief,
  entrySentences,
  parseJournalNote,
  parseJournalPrompt,
  reusedWordCount,
  suggestJournalPrompt,
  withJournalNote,
  type JournalEntry,
} from './journal'

const workGlosses = ['today', 'work', 'do (polite)']

describe('journal', () => {
  it('asks about today and work, and does not print the sentence or a food prompt', () => {
    const prompt = suggestJournalPrompt({
      goalTitle: 'Just for fun / media',
      sentences: ['오늘은 일해요.'],
      glosses: workGlosses,
    })
    expect(prompt.toLowerCase()).toMatch(/work/)
    expect(prompt.toLowerCase()).toMatch(/today/)
    expect(prompt).not.toContain('오늘은 일해요.')
    expect(prompt.toLowerCase()).not.toMatch(/food|order|hungry/)
  })

  it('a Korean prompt brief does not use an Indonesian example', () => {
    const brief = buildJournalPromptBrief({
      languageName: 'Korean',
      goalTitle: 'Talk about daily life',
      known: ['오늘', '일'],
    })
    expect(brief).toContain('Korean')
    expect(brief).toContain('오늘')
    expect(brief).not.toMatch(/Indonesian|Hari ini|kerja|Saya lapar/)
    const prompt = suggestJournalPrompt({
      goalTitle: 'Talk about daily life',
      sentences: ['오늘은 일해요.'],
      glosses: workGlosses,
    })
    expect(prompt).not.toMatch(/Indonesian|Hari ini|kerja|Saya/)
  })

  it('a pasted prompt replaces the suggestion and leaves the page empty', () => {
    const parsed = parseJournalPrompt(
      '{"prompt":"Write one line about your work today.","use":["오늘","일"]}',
      ['오늘은 일해요.'],
    )
    expect(parsed.prompt).toBe('Write one line about your work today.')
    expect(parsed.use).toEqual(['오늘', '일'])
    expect(applyJournalPrompt(parsed.prompt!).body).toBe('')

    const echoed = parseJournalPrompt(
      JSON.stringify({ prompt: '오늘은 일해요.' }),
      ['오늘은 일해요.'],
    )
    expect(echoed.prompt).toBeUndefined()
    expect(echoed.error).toMatch(/Nothing was imported/)
  })

  it('counts known words without turning the count into a rating', () => {
    expect(reusedWordCount('오늘은 일해요.', ['오늘', '일', '물'])).toBe(2)
    const counted = { count: reusedWordCount('오늘은 일해요.', ['오늘', '일']) }
    expect(counted).not.toHaveProperty('outcome')
  })

  it('adds a note and does not rewrite the entry', () => {
    const entry: JournalEntry = {
      id: 'journal-1',
      body: '오늘은 일해요.',
      prompt: 'Write one line about your work today. Use only words you already have.',
      createdAt: '2026-09-25T00:00:00.000Z',
      notes: [],
    }
    const noted = withJournalNote(entry, '오늘은 일해요.', 'Look at the polite ending.')
    expect(noted.body).toBe(entry.body)
    expect(noted.notes).toEqual([
      { sentence: '오늘은 일해요.', hint: 'Look at the polite ending.' },
    ])
    expect(JSON.stringify(noted)).not.toMatch(/"outcome"/)

    const rejected = parseJournalNote(
      JSON.stringify({ hint: '오늘은 일해요.' }),
      '오늘은 일해요.',
    )
    expect(rejected.hint).toBeUndefined()
    expect(rejected.error).toMatch(/Nothing was added/)
  })

  it('splits an entry into sentences the learner can check', () => {
    expect(entrySentences('오늘은 일해요.\n창밖을 봐요.')).toEqual([
      '오늘은 일해요.',
      '창밖을 봐요.',
    ])
  })
})