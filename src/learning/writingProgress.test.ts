import { describe, expect, it } from 'vitest'
import { writingSetsFor } from '../data/writingCharts'
import {
  checkOptions,
  checkStage,
  familiarityStart,
  hideArabicVowels,
  hideRetrievedAid,
  lockedWritingSets,
  nextWritingSet,
  skippedSets,
} from './writingProgress'

describe('writing sets', () => {
  it('names Japanese rows in order and keeps the next row locked', () => {
    const sets = writingSetsFor('ja')
    expect(sets[0]?.title).toBe('あ row')
    expect(sets[1]?.title).toBe('か row')
    const next = nextWritingSet(sets, [], 'new')
    expect(next?.set.title).toBe('あ row')
    expect(lockedWritingSets(sets, [], 'new')[0]?.title).toBe('か row')
    const after = nextWritingSet(sets, [sets[0].id], 'new')
    expect(after?.set.title).toBe('か row')
  })

  it('starts some and comfortable later without marking earlier rows known', () => {
    const sets = writingSetsFor('ja')
    expect(familiarityStart('new', sets.length)).toBe(0)
    expect(familiarityStart('some', sets.length)).toBe(2)
    expect(nextWritingSet(sets, [], 'some')?.set.id).toBe(sets[2].id)
    expect(skippedSets(sets, 'some').every((set) => set.id !== sets[2].id)).toBe(true)
    expect(skippedSets(sets, 'some').map((set) => set.id)).not.toContain(sets[2].id)
  })

  it('gives Indonesian and Spanish a sound list and no character chart path', () => {
    expect(writingSetsFor('id')[0]?.marks.map((mark) => mark.glyph)).toContain('ng')
    expect(writingSetsFor('es')[0]?.marks.map((mark) => mark.glyph)).toContain('ñ')
  })

  it('builds a lure and does not put the answer in a printed reading prompt', () => {
    const sets = writingSetsFor('ja')
    const mark = sets[0].marks[0]
    const built = checkOptions(mark, sets[0].marks)
    expect(built.prompt).toBe('reading')
    expect(built.choices).toContain(mark.reading)
    expect(built.choices.filter((choice) => choice !== mark.reading).length).toBeGreaterThan(0)
    expect(built.choices.join(' ')).not.toContain(mark.glyph)
  })

  it('hides the reading on a later mark and asks for the glyph', () => {
    const sets = writingSetsFor('ja')
    const mark = sets[2].marks[0]
    expect(checkStage('new', 0)).toBe('early')
    expect(checkStage('some', 0)).toBe('later')
    expect(checkStage('comfortable', 0)).toBe('comfortable')
    const built = checkOptions(mark, sets[2].marks, 'later')
    expect(built.prompt).toBe('mark')
    expect(built.cue).toBe(mark.reading)
    expect(built.choices).toContain(mark.glyph)
    expect(built.choices).not.toContain(mark.reading)
  })

  it('asks which Arabic shape is in the word and keeps the isolated letter as a lure', () => {
    const shape = writingSetsFor('ar').find((set) => set.title === 'bāʼ shapes')
    const mark = shape?.marks[0]
    expect(mark?.word).toBeTruthy()
    expect(mark?.glyph).not.toBe('ب')
    const built = checkOptions(mark!, shape!.marks, 'later')
    expect(built.prompt).toBe('shape')
    expect(built.cue).toBe(mark!.word)
    expect(built.choices).toContain(mark!.glyph)
    expect(built.choices).toContain('ب')
  })

  it('hides the aid only on marks that were retrieved', () => {
    const kept = hideRetrievedAid(
      [{ text: '今日', reading: 'きょう' }],
      new Set(['今']),
    )
    expect(kept[0]?.reading).toBe('きょう')
    const hidden = hideRetrievedAid(
      [{ text: '今', reading: 'こん' }],
      new Set(['今']),
    )
    expect(hidden[0]?.reading).toBeUndefined()
    expect(hideArabicVowels('بَتَ', new Set(['ب']))).toBe('بتَ')
    expect(hideArabicVowels('بَتَ', new Set())).toBe('بَتَ')
  })
})
