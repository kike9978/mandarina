import { describe, expect, it } from 'vitest'
import { inkLooksWritten, inkPathLength, strokeLength } from './writing'

describe('writing ink helpers', () => {
  it('measures a straight stroke', () => {
    expect(
      strokeLength([
        { x: 0, y: 0 },
        { x: 30, y: 40 },
      ]),
    ).toBe(50)
  })

  it('rejects empty or tiny scribbles', () => {
    expect(inkLooksWritten([])).toBe(false)
    expect(
      inkLooksWritten([
        [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
        ],
      ]),
    ).toBe(false)
  })

  it('accepts a long enough stroke', () => {
    const stroke = [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
    ]
    expect(inkPathLength([stroke])).toBe(80)
    expect(inkLooksWritten([stroke])).toBe(true)
  })
})
