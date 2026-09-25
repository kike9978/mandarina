/** Turn a tutor-supplied https link into something we can play in-app. */

export type PlayKind = 'youtube' | 'vimeo' | 'audio' | 'page'

export interface PlayableSource {
  kind: PlayKind
  href: string
  embedSrc?: string
}

const HTTP = /^https:\/\/\S+$/i

export function isHttpsUrl(raw: string): boolean {
  return HTTP.test(raw.trim())
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const parts = u.pathname.split('/').filter(Boolean)
      if (
        (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') &&
        parts[1] &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1]
      }
    }
  } catch {
    return null
  }
  return null
}

function vimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    const id = parts[0] === 'video' ? parts[1] : parts[0]
    return id && /^\d+$/.test(id) ? id : null
  } catch {
    return null
  }
}

function isAudioFile(url: string): boolean {
  try {
    const path = new URL(url).pathname
    return /\.(mp3|m4a|aac|ogg|wav|opus)$/i.test(path)
  } catch {
    return false
  }
}

export function parsePlayableUrl(raw: string): PlayableSource | null {
  const href = raw.trim()
  if (!isHttpsUrl(href)) return null
  const yt = youtubeId(href)
  if (yt) {
    return {
      kind: 'youtube',
      href,
      embedSrc: `https://www.youtube-nocookie.com/embed/${yt}`,
    }
  }
  const vim = vimeoId(href)
  if (vim) {
    return {
      kind: 'vimeo',
      href,
      embedSrc: `https://player.vimeo.com/video/${vim}`,
    }
  }
  if (isAudioFile(href)) {
    return { kind: 'audio', href }
  }
  return { kind: 'page', href }
}
