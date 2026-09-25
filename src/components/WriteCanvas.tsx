import { Eraser, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { inkLooksWritten, type Stroke } from '../learning/writing'

function pointerToLocal(
  el: HTMLCanvasElement,
  ev: PointerEvent,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  const sx = el.width / rect.width
  const sy = el.height / rect.height
  return {
    x: (ev.clientX - rect.left) * sx,
    y: (ev.clientY - rect.top) * sy,
  }
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: Stroke[], live?: Stroke) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1f1a14'
  ctx.lineWidth = 7
  const all = live ? [...strokes, live] : strokes
  for (const stroke of all) {
    if (stroke.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y)
    }
    ctx.stroke()
  }
}

export function WriteCanvas({
  ghost,
  ghostOpacity = 0.22,
  onInkChange,
}: {
  ghost: string
  ghostOpacity?: number
  onInkChange?: (ok: boolean) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const live = useRef<Stroke>([])
  const drawing = useRef(false)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawInk(ctx, strokes, drawing.current ? live.current : undefined)
  }, [strokes])

  useEffect(() => {
    paint()
    onInkChange?.(inkLooksWritten(strokes))
  }, [paint, strokes, onInkChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onDown = (ev: PointerEvent) => {
      ev.preventDefault()
      canvas.setPointerCapture(ev.pointerId)
      drawing.current = true
      live.current = [pointerToLocal(canvas, ev)]
      paint()
    }
    const onMove = (ev: PointerEvent) => {
      if (!drawing.current) return
      live.current = [...live.current, pointerToLocal(canvas, ev)]
      paint()
    }
    const onUp = () => {
      if (!drawing.current) return
      drawing.current = false
      const done = live.current
      live.current = []
      if (done.length > 1) {
        setStrokes((prev) => [...prev, done])
      } else {
        paint()
      }
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [paint])

  return (
    <div className="grid gap-2">
      <div className="relative overflow-hidden rounded-[22px] border-4 border-ink bg-paper shadow-chunky">
        <span
          className="pointer-events-none absolute inset-0 grid place-items-center font-display font-bold leading-none select-none"
          style={{
            fontSize: ghost.length <= 2 ? '7rem' : '4.2rem',
            opacity: ghostOpacity,
          }}
          aria-hidden
        >
          {ghost}
        </span>
        <canvas
          ref={canvasRef}
          width={560}
          height={340}
          className="relative z-10 block h-[220px] w-full touch-none sm:h-[260px]"
          aria-label={`Write ${ghost}`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-paper px-3 py-2 font-extrabold"
          onClick={() => setStrokes((prev) => prev.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          <Undo2 size={16} strokeWidth={2.25} aria-hidden />
          Undo
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-grid px-3 py-2 font-extrabold"
          onClick={() => setStrokes([])}
          disabled={strokes.length === 0}
        >
          <Eraser size={16} strokeWidth={2.25} aria-hidden />
          Clear
        </button>
      </div>
    </div>
  )
}
