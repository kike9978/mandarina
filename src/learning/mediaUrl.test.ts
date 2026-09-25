import { describe, expect, it } from 'vitest'
import { isHttpsUrl, parsePlayableUrl } from './mediaUrl'

describe('parsePlayableUrl', () => {
  it('embeds a YouTube watch link', () => {
    const play = parsePlayableUrl('https://www.youtube.com/watch?v=8lDeyfxKrRk')
    expect(play?.kind).toBe('youtube')
    expect(play?.embedSrc).toBe(
      'https://www.youtube-nocookie.com/embed/8lDeyfxKrRk',
    )
  })

  it('embeds youtu.be and shorts', () => {
    expect(parsePlayableUrl('https://youtu.be/8lDeyfxKrRk')?.embedSrc).toContain(
      '8lDeyfxKrRk',
    )
    expect(
      parsePlayableUrl('https://www.youtube.com/shorts/8lDeyfxKrRk')?.kind,
    ).toBe('youtube')
  })

  it('embeds Vimeo and treats audio files as audio', () => {
    expect(parsePlayableUrl('https://vimeo.com/123456789')?.kind).toBe('vimeo')
    expect(
      parsePlayableUrl('https://cdn.example.com/clip.mp3')?.kind,
    ).toBe('audio')
  })

  it('keeps other https pages playable as a framed page', () => {
    expect(parsePlayableUrl('https://example.com/lesson')?.kind).toBe('page')
  })

  it('rejects non-https and junk', () => {
    expect(isHttpsUrl('http://example.com/x')).toBe(false)
    expect(parsePlayableUrl('javascript:alert(1)')).toBeNull()
    expect(parsePlayableUrl('not-a-link')).toBeNull()
  })
})
