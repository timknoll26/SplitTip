import { timeToMinutes } from '@/lib/time'
import type { IntensityWindow, Participant } from '@/types'

/** Horizontal resolution of the shift matrix timeline. */
export const PX_PER_MINUTE = 3
/** Drag/resize values snap to this grid. */
export const SNAP_MINUTES = 15
/** Shortest shift a drag/resize can produce. */
export const MIN_SHIFT_MINUTES = 15
/** The timeline never renders narrower than this, even for a single short shift. */
export const MIN_RANGE_MINUTES = 6 * 60
/** Pointer movement below this (px) on release counts as a click, not a drag. */
export const DRAG_CLICK_THRESHOLD_PX = 5

export const ROW_HEIGHT_PX = 60
export const HEADER_HEIGHT_PX = 32
export const NAME_COLUMN_PX = 140
/** Height of the interactive stress-window lane at the top of the matrix. */
export const LANE_HEIGHT_PX = 60

export interface TimelineRange {
  startMinutes: number
  endMinutes: number
}

const DEFAULT_RANGE: TimelineRange = { startMinutes: 9 * 60, endMinutes: 15 * 60 }

/**
 * Timeline bounds derived from every participant shift and intensity window,
 * rounded outward to full hours. Only fed from committed store state (never
 * from an in-progress drag preview) so the axis doesn't shift under the
 * pointer while dragging.
 */
export function computeTimelineRange(
  participants: Participant[],
  windows: IntensityWindow[]
): TimelineRange {
  const values: number[] = []
  for (const p of participants) {
    values.push(timeToMinutes(p.startTime), timeToMinutes(p.endTime))
  }
  for (const w of windows) {
    values.push(timeToMinutes(w.startTime), timeToMinutes(w.endTime))
  }

  if (values.length === 0) return DEFAULT_RANGE

  const startMinutes = Math.floor(Math.min(...values) / 60) * 60
  let endMinutes = Math.ceil(Math.max(...values) / 60) * 60
  if (endMinutes - startMinutes < MIN_RANGE_MINUTES) {
    endMinutes = startMinutes + MIN_RANGE_MINUTES
  }

  return { startMinutes, endMinutes }
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function minutesToX(minutes: number, range: TimelineRange): number {
  return (minutes - range.startMinutes) * PX_PER_MINUTE
}

export function xToMinutes(x: number, range: TimelineRange): number {
  return range.startMinutes + x / PX_PER_MINUTE
}

export function rangeWidthPx(range: TimelineRange): number {
  return (range.endMinutes - range.startMinutes) * PX_PER_MINUTE
}

/** One tick per full hour, including both ends of the range. */
export function hourTicks(range: TimelineRange): number[] {
  const ticks: number[] = []
  for (let m = range.startMinutes; m <= range.endMinutes; m += 60) ticks.push(m)
  return ticks
}
