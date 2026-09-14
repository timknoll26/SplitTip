/** Parses "HH:MM" into minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/** Formats minutes since midnight back into "HH:MM". */
export function minutesToTime(totalMinutes: number): string {
  const clamped = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(clamped / 60)
  const minutes = Math.round(clamped % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Formats a minute count as a human-readable duration, e.g. "4 h 15 min". */
export function formatDuration(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes)
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

/** Overlap length in minutes between two [start, end) ranges, 0 if disjoint. */
export function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

/** Total minutes covered by the union of possibly-overlapping [start, end) ranges. */
export function unionMinutes(intervals: Array<[number, number]>): number {
  if (intervals.length === 0) return 0
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  let total = 0
  let [curStart, curEnd] = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i]
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e)
    } else {
      total += curEnd - curStart
      curStart = s
      curEnd = e
    }
  }
  total += curEnd - curStart
  return total
}
