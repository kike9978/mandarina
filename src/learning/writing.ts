export interface InkPoint {
  x: number
  y: number
}

export type Stroke = InkPoint[]

export function strokeLength(stroke: Stroke): number {
  let n = 0
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]
    const b = stroke[i]
    n += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return n
}

export function inkPathLength(strokes: Stroke[]): number {
  return strokes.reduce((sum, s) => sum + strokeLength(s), 0)
}

/** Naive “did they actually write?” — not stroke-order validation. */
export function inkLooksWritten(
  strokes: Stroke[],
  opts?: { minLength?: number; minStrokes?: number },
): boolean {
  const minLength = opts?.minLength ?? 70
  const minStrokes = opts?.minStrokes ?? 1
  if (strokes.length < minStrokes) return false
  return inkPathLength(strokes) >= minLength
}
