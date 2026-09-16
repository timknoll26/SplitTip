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

/** Wraps a minute value into the [0, 1440) range of a single day. */
export function mod1440(minutes: number): number {
  return ((minutes % 1440) + 1440) % 1440
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

export type DragMode = 'move' | 'resize-start' | 'resize-end' | 'create'

export interface DragOrigin {
  mode: DragMode
  /** clientX at the moment the drag started, in the same coordinate space as the clientX later passed to resolveDragInterval. */
  startClientX: number
  originStart: number
  originEnd: number
  /**
   * Only meaningful for a drag that can cross midnight (ShiftBar's
   * participant shifts; intensity windows never set this):
   * - mode 'move': the block's duration, so it can slide freely around
   *   the 24h cycle instead of clamping to the day edges.
   * - mode 'resize-start'/'resize-end': the OTHER boundary's real minute
   *   value, since originStart/originEnd get temporarily pinned to a day
   *   edge (0 or 1440) so that segment can be resized on its own.
   */
  aux?: number
}

/**
 * Turns a horizontal pointer position into a new [start, end) interval for
 * a drag in progress. Shared by ShiftBar (participant shifts, which can
 * cross midnight via `aux`) and IntensityLane (stress windows, which
 * can't and never set `aux`) — for every mode but 'move', an unset `aux`
 * makes this reduce to exactly the plain non-wrapping formula.
 *
 * @param clientX current pointer clientX
 * @param left the dragged track's left edge in client coordinates — only
 *   used by 'create', to convert the current pointer position into minutes
 */
export function resolveDragInterval(
  drag: DragOrigin,
  clientX: number,
  range: TimelineRange,
  left: number
): { start: number; end: number } {
  const deltaMin = (clientX - drag.startClientX) / PX_PER_MINUTE

  if (drag.mode === 'move') {
    if (drag.aux !== undefined) {
      const duration = drag.aux
      const start = mod1440(snapMinutes(drag.originStart + deltaMin))
      return { start, end: mod1440(start + duration) }
    }
    const duration = drag.originEnd - drag.originStart
    const start = clamp(snapMinutes(drag.originStart + deltaMin), range.startMinutes, range.endMinutes - duration)
    return { start, end: start + duration }
  }
  if (drag.mode === 'resize-start') {
    const start = clamp(snapMinutes(drag.originStart + deltaMin), range.startMinutes, drag.originEnd - MIN_SHIFT_MINUTES)
    return { start, end: drag.aux ?? drag.originEnd }
  }
  if (drag.mode === 'resize-end') {
    const end = clamp(snapMinutes(drag.originEnd + deltaMin), drag.originStart + MIN_SHIFT_MINUTES, range.endMinutes)
    return { start: drag.aux ?? drag.originStart, end }
  }

  const current = clamp(snapMinutes(xToMinutes(clientX - left, range)), range.startMinutes, range.endMinutes)
  return { start: Math.min(drag.originStart, current), end: Math.max(drag.originStart, current) }
}
