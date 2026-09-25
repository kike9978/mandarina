import { describe, expect, it } from 'vitest'
import {
  composeJourneyOrder,
  decideDailyPlan,
  dueRowsToComebacks,
} from './orchestrator'
import { outcomeToRating } from './fsrsAdapter'
import { Rating } from 'ts-fsrs'
import { buildUnitFromStash, chunkSentence } from './templateBridge'
import type { StashedPhrase } from '../data/fixtures'

describe('decideDailyPlan', () => {
  it('prioritizes script warm-up when needed', () => {
    const plan = decideDailyPlan({
      needsScriptFirst: true,
      phraseReady: true,
      dueCount: 5,
      stashCount: 0,
    })
    expect(plan.kind).toBe('script')
    expect(plan.route).toBe('/script')
  })

  it('uses welcome_back after long absence with dues', () => {
    const now = new Date('2026-09-07T12:00:00Z')
    const plan = decideDailyPlan({
      needsScriptFirst: false,
      phraseReady: true,
      dueCount: 4,
      stashCount: 0,
      lastActiveAt: '2026-08-01T12:00:00Z',
      now,
    })
    expect(plan.kind).toBe('welcome_back')
    expect(plan.softComeback).toMatch(/bring a few things back/)
  })

  it('weaves comeback when dues exist and learner is active', () => {
    const plan = decideDailyPlan({
      needsScriptFirst: false,
      phraseReady: true,
      dueCount: 2,
      stashCount: 1,
      lastActiveAt: new Date().toISOString(),
    })
    expect(plan.kind).toBe('comeback')
    expect(plan.route).toBe('/session')
  })

  it('falls back to stash when phrases are not ready', () => {
    const plan = decideDailyPlan({
      needsScriptFirst: false,
      phraseReady: false,
      dueCount: 0,
      stashCount: 3,
    })
    expect(plan.kind).toBe('stash')
    expect(plan.route).toBe('/stash')
  })
})

describe('composeJourneyOrder', () => {
  it('keeps core path when no comebacks', () => {
    expect(composeJourneyOrder('journey', false)[0]).toBe('meet')
    expect(composeJourneyOrder('journey', false)).not.toContain('comeback')
  })

  it('starts with comeback on welcome_back', () => {
    expect(composeJourneyOrder('welcome_back', true)[0]).toBe('comeback')
  })

  it('weaves comeback after meet for normal comeback days', () => {
    const order = composeJourneyOrder('comeback', true)
    expect(order.indexOf('comeback')).toBe(order.indexOf('meet') + 1)
  })
})

describe('outcomeToRating', () => {
  it('maps learner outcomes to FSRS grades', () => {
    expect(outcomeToRating('success')).toBe(Rating.Good)
    expect(outcomeToRating('hint')).toBe(Rating.Hard)
    expect(outcomeToRating('fail')).toBe(Rating.Again)
    expect(outcomeToRating('reveal')).toBe(Rating.Again)
  })
})

describe('chunkSentence / template bridge', () => {
  it('splits spaced sentences', () => {
    expect(chunkSentence('Hari ini saya ada kerja.')).toEqual([
      'Hari',
      'ini',
      'saya',
      'ada',
      'kerja.',
    ])
  })

  it('keeps CJK blobs whole when no spaces', () => {
    expect(chunkSentence('今日は仕事があります。')).toEqual([
      '今日は仕事があります',
      '。',
    ])
  })

  it('builds a full production unit when example exists', () => {
    const phrases: StashedPhrase[] = [
      {
        id: 'stash-1',
        surface: '元気ですか？',
        gloss: 'How are you?',
        exampleSentence: 'おはよう！元気ですか？',
        source: 'user',
      },
    ]
    const unit = buildUnitFromStash(phrases, 'ja')
    expect(unit?.productionReady).toBe(true)
    expect(unit?.origin).toBe('stash')
    expect(unit?.targetSentence).toBe('おはよう！元気ですか？')
  })

  it('locks production without an example sentence', () => {
    const phrases: StashedPhrase[] = [
      {
        id: 'stash-2',
        surface: '仕事',
        gloss: 'work',
        source: 'user',
      },
    ]
    const unit = buildUnitFromStash(phrases, 'ja')
    expect(unit?.productionReady).toBe(false)
  })
})

describe('dueRowsToComebacks', () => {
  it('strips language prefix from item ids', () => {
    const items = dueRowsToComebacks(
      [
        {
          itemId: 'ja:phrase:kyo',
          facet: 'recognition',
          surface: '今日',
          gloss: 'today',
          source: 'seed',
        },
      ],
      'ja',
    )
    expect(items[0]?.itemKey).toBe('phrase:kyo')
  })
})
