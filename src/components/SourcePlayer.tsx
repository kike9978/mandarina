import { ExternalLink, Play } from 'lucide-react'
import { useState } from 'react'
import { parsePlayableUrl } from '../learning/mediaUrl'

export function SourcePlayer({
  url,
  title,
  onPlay,
}: {
  url?: string
  title: string
  onPlay?: () => void
}) {
  const playable = url ? parsePlayableUrl(url) : null
  const [started, setStarted] = useState(false)

  if (!playable) {
    return (
      <p className="rounded-xl border-2 border-ink bg-[#fff3c4] p-3 font-bold">
        No playable link yet — Grow the journey should bring one back.
      </p>
    )
  }

  const start = () => {
    if (!started) {
      setStarted(true)
      onPlay?.()
    }
  }

  if (!started) {
    return (
      <button
        type="button"
        className="grid w-full min-h-[160px] place-items-center rounded-[22px] border-4 border-orange bg-paper shadow-chunky"
        onClick={start}
      >
        <span className="inline-flex items-center gap-2 font-display text-2xl font-bold">
          <Play size={28} strokeWidth={2.25} aria-hidden />
          Play here
        </span>
      </button>
    )
  }

  return (
    <div className="grid gap-2">
      {playable.kind === 'audio' ? (
        <audio
          className="w-full"
          controls
          autoPlay
          src={playable.href}
          onPlay={start}
        >
          <track kind="captions" />
        </audio>
      ) : playable.embedSrc ? (
        <div className="overflow-hidden rounded-[22px] border-4 border-orange bg-ink shadow-chunky">
          <iframe
            title={title}
            src={playable.embedSrc}
            className="aspect-video w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <p className="rounded-xl border-2 border-ink bg-[#fff3c4] p-3 font-bold">
          This link won&apos;t sit inside the frame — open it outside.
        </p>
      )}
      <a
        href={playable.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-1.5 font-extrabold text-ink no-underline"
      >
        <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
        Open outside
      </a>
    </div>
  )
}
