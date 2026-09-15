/** Horizontal resolution of the shift matrix timeline. */
export const PX_PER_MINUTE = 2
/** Drag/resize values snap to this grid. */
export const SNAP_MINUTES = 15
/** Shortest shift a drag/resize can produce. */
export const MIN_SHIFT_MINUTES = 15
/** Pointer movement below this (px) on release counts as a click, not a drag. */
export const DRAG_CLICK_THRESHOLD_PX = 5
/**
 * On touch, dragging out a new bar from empty space competes with the
 * horizontal swipe-to-scroll gesture over the same area — Google Calendar,
 * FullCalendar's touch mode, and Deputy all avoid that by not treating a
 * plain drag on empty space as "create". Movement below this (px) on
 * release counts as a tap that creates a default-length block instead.
 * Slightly larger than DRAG_CLICK_THRESHOLD_PX since finger taps drift more
 * than a mouse click does.
 */
export const TOUCH_TAP_THRESHOLD_PX = 10
/** Length of the block a touch tap-to-create creates, before the user adjusts it. */
export const DEFAULT_TOUCH_CREATE_MINUTES = 60

export const ROW_HEIGHT_PX = 60
export const HEADER_HEIGHT_PX = 32
export const NAME_COLUMN_PX = 140
/** Height of the interactive stress-window lane at the top of the matrix. */
export const LANE_HEIGHT_PX = 60

export interface TimelineRange {
  startMinutes: number
  endMinutes: number
}

/**
 * The matrix always shows the full day (00:00-24:00), not just the span
 * already covered by entered shifts/windows — a narrower, data-derived range
 * made it impossible to drag out a shift starting later than whatever was
 * already on the timeline. Horizontal scroll (see ShiftMatrix's wrapper)
 * covers screens too narrow to show all 24 hours at once.
 */
export const FULL_DAY_RANGE: TimelineRange = { startMinutes: 0, endMinutes: 24 * 60 }

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
