import { describe, expect, it } from 'vitest'
import { FULL_DAY_RANGE, PX_PER_MINUTE, resolveDragInterval, type DragOrigin } from '@/lib/shift-grid'

function origin(overrides: Partial<DragOrigin>): DragOrigin {
  return { mode: 'move', startClientX: 0, originStart: 600, originEnd: 660, ...overrides }
}

describe('resolveDragInterval', () => {
  it('moves a block by the dragged distance, preserving its duration', () => {
    const drag = origin({ mode: 'move', originStart: 600, originEnd: 660 })
    const { start, end } = resolveDragInterval(drag, 30 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(start).toBe(630)
    expect(end).toBe(690)
  })

  it('clamps a move at the day edges instead of letting it run off the timeline', () => {
    const drag = origin({ mode: 'move', originStart: 600, originEnd: 660 })
    const { start, end } = resolveDragInterval(drag, -1000 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(start).toBe(0)
    expect(end).toBe(60)
  })

  it('lets a move with aux (midnight-crossing shift) wrap freely around the 24h cycle', () => {
    const drag = origin({ mode: 'move', originStart: 1380, originEnd: 60, aux: 120 })
    // Drag 1 hour later: 23:00 -> 00:00, still a 2h block, wrapping past midnight.
    const { start, end } = resolveDragInterval(drag, 60 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(start).toBe(0)
    expect(end).toBe(120)
  })

  it('resizes the start edge without moving the end, clamped to a minimum length', () => {
    const drag = origin({ mode: 'resize-start', originStart: 600, originEnd: 660 })
    const grownPastEnd = resolveDragInterval(drag, 200 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(grownPastEnd.start).toBe(645) // 660 - MIN_SHIFT_MINUTES (15)
    expect(grownPastEnd.end).toBe(660)
  })

  it('resize-start pins the end to aux when set (midnight-crossing evening segment)', () => {
    const drag = origin({ mode: 'resize-start', originStart: 1320, originEnd: 1440, aux: 90 })
    const { end } = resolveDragInterval(drag, 0, FULL_DAY_RANGE, 0)
    expect(end).toBe(90)
  })

  it('resizes the end edge without moving the start, clamped to a minimum length', () => {
    const drag = origin({ mode: 'resize-end', originStart: 600, originEnd: 660 })
    const shrunkPastStart = resolveDragInterval(drag, -200 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(shrunkPastStart.start).toBe(600)
    expect(shrunkPastStart.end).toBe(615) // 600 + MIN_SHIFT_MINUTES (15)
  })

  it('creates an interval spanning from the anchor to the current pointer position, either direction', () => {
    const drag = origin({ mode: 'create', originStart: 600, originEnd: 600 })
    const draggedRight = resolveDragInterval(drag, 690 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(draggedRight).toEqual({ start: 600, end: 690 })

    const draggedLeft = resolveDragInterval(drag, 510 * PX_PER_MINUTE, FULL_DAY_RANGE, 0)
    expect(draggedLeft).toEqual({ start: 510, end: 600 })
  })
})
