import { useRef, useState } from 'react'
import { GripVertical, MoonStar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { cn } from '@/lib/utils'
import {
  clamp,
  DEFAULT_TOUCH_CREATE_MINUTES,
  DRAG_CLICK_THRESHOLD_PX,
  type DragMode,
  type DragOrigin,
  minutesToX,
  MIN_SHIFT_MINUTES,
  NAME_COLUMN_PX,
  PX_PER_MINUTE,
  resolveDragInterval,
  ROW_HEIGHT_PX,
  snapMinutes,
  TOUCH_TAP_THRESHOLD_PX,
  xToMinutes,
  type TimelineRange,
} from '@/lib/shift-grid'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { Participant } from '@/types'

interface ShiftBarProps {
  participant: Participant
  range: TimelineRange
  /** Times to render instead of the store values while this participant is mid-drag. */
  previewOverride: { startTime: string; endTime: string } | null
  onPreview: (startTime: string, endTime: string) => void
  onCommit: (startTime: string, endTime: string) => void
}

interface ActiveDrag extends DragOrigin {
  pointerId: number
}

/**
 * One participant's row in the shift matrix: an empty dashed track (no shift
 * assigned yet) that can be dragged into a new bar, a single bar that can be
 * moved/resized by its edges, or — for a shift crossing midnight (endTime <
 * startTime) — two linked bar segments (start-24:00 and 00:00-end) that move
 * together and resize independently at their outer edges. All three end in
 * the same click-vs-drag check and the same numeric popover fallback.
 */
export function ShiftBar({ participant, range, previewOverride, onPreview, onCommit }: ShiftBarProps) {
  const removeParticipant = useTipPoolStore((s) => s.removeParticipant)
  const updateParticipant = useTipPoolStore((s) => s.updateParticipant)
  const areas = useTipPoolStore((s) => s.areas)

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [customArea, setCustomArea] = useState('')
  /** Pending-tap origin on touch — set on empty-track pointerdown, cleared on release/cancel. Not drag state: we deliberately don't capture the pointer here so a real swipe still scrolls. */
  const touchTapOrigin = useRef<{ x: number; y: number } | null>(null)

  const effectiveStart = previewOverride?.startTime ?? participant.startTime
  const effectiveEnd = previewOverride?.endTime ?? participant.endTime
  const startMinutes = timeToMinutes(effectiveStart)
  const endMinutes = timeToMinutes(effectiveEnd)
  const isUnset = endMinutes === startMinutes
  const wraps = endMinutes < startMinutes

  function beginDrag(
    e: React.PointerEvent<HTMLDivElement>,
    mode: DragMode,
    originStart: number,
    originEnd: number,
    aux?: number
  ) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveDrag({
      mode,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      originStart,
      originEnd,
      aux,
    })
  }

  function handleBarPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (wraps) {
      const duration = range.endMinutes - startMinutes + (endMinutes - range.startMinutes)
      beginDrag(e, 'move', startMinutes, endMinutes, duration)
    } else {
      beginDrag(e, 'move', startMinutes, endMinutes)
    }
  }

  function handleEdgePointerDown(e: React.PointerEvent<HTMLDivElement>, edge: 'resize-start' | 'resize-end') {
    if (wraps) {
      if (edge === 'resize-start') {
        beginDrag(e, edge, startMinutes, range.endMinutes, endMinutes)
      } else {
        beginDrag(e, edge, range.startMinutes, endMinutes, startMinutes)
      }
      return
    }
    beginDrag(e, edge, startMinutes, endMinutes)
  }

  function handleEmptyTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') {
      // Don't capture or start a drag here — let a real swipe scroll the
      // row normally. handlePointerUp checks whether this stayed a tap.
      touchTapOrigin.current = { x: e.clientX, y: e.clientY }
      return
    }
    const trackLeft = e.currentTarget.getBoundingClientRect().left
    const anchor = clamp(snapMinutes(xToMinutes(e.clientX - trackLeft, range)), range.startMinutes, range.endMinutes)
    beginDrag(e, 'create', anchor, anchor)
  }

  function handlePointerCancel() {
    touchTapOrigin.current = null
    setActiveDrag(null)
  }

  /**
   * Same math for both the live preview and the final commit, so a commit
   * never depends on a pointermove having fired first — a fast or
   * programmatic drag can jump straight from pointerdown to pointerup with
   * no move events in between. The interval math itself is shared with
   * IntensityLane's drag handling — see resolveDragInterval.
   */
  function resolveDrag(e: React.PointerEvent<HTMLDivElement>, drag: ActiveDrag): { start: number; end: number } {
    const trackLeft = e.currentTarget.getBoundingClientRect().left
    return resolveDragInterval(drag, e.clientX, range, trackLeft)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const { start, end } = resolveDrag(e, activeDrag)
    onPreview(minutesToTime(start), minutesToTime(end))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' && touchTapOrigin.current) {
      const origin = touchTapOrigin.current
      touchTapOrigin.current = null
      const moved = Math.hypot(e.clientX - origin.x, e.clientY - origin.y)
      if (moved <= TOUCH_TAP_THRESHOLD_PX) {
        const trackLeft = e.currentTarget.getBoundingClientRect().left
        const start = clamp(
          snapMinutes(xToMinutes(e.clientX - trackLeft, range)),
          range.startMinutes,
          range.endMinutes - DEFAULT_TOUCH_CREATE_MINUTES
        )
        onCommit(minutesToTime(start), minutesToTime(start + DEFAULT_TOUCH_CREATE_MINUTES))
        setPopoverOpen(true)
      }
      return
    }

    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const hadRealMovement = Math.abs(e.clientX - activeDrag.startClientX) > DRAG_CLICK_THRESHOLD_PX

    if (hadRealMovement) {
      const { start, end } = resolveDrag(e, activeDrag)
      const finalEnd = activeDrag.mode === 'create' && end - start < MIN_SHIFT_MINUTES ? start + MIN_SHIFT_MINUTES : end
      onCommit(minutesToTime(start), minutesToTime(finalEnd))
    } else {
      setPopoverOpen(true)
    }
    setActiveDrag(null)
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <div
          className="relative shrink-0"
          style={{
            width: minutesToX(range.endMinutes, range),
            height: ROW_HEIGHT_PX,
            backgroundImage:
              'repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent ' +
              PX_PER_MINUTE * 60 +
              'px)',
          }}
        >
          {isUnset ? (
            <div
              onPointerDown={handleEmptyTrackPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className="absolute inset-1 flex cursor-crosshair items-center rounded-sm border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              {/* The hint text is sticky to the visible scroll area — a full day is much
                  wider than the viewport, so centering it in the row would put it
                  off-screen at almost any scroll position. */}
              <span className="sticky pointer-events-none px-2 whitespace-nowrap" style={{ left: NAME_COLUMN_PX + 8 }}>
                Ziehen oder tippen für Schicht
              </span>
            </div>
          ) : wraps ? (
            <>
              {/* Evening piece: start -> midnight. Its right edge is the day
                  boundary, not a real edge of the shift, so no resize handle
                  there — only resize-start on the left. */}
              <div
                onPointerDown={handleBarPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={cn(
                  'absolute top-1 bottom-1 flex cursor-grab items-center gap-1 overflow-hidden touch-none rounded-sm rounded-r-none bg-primary pl-2 text-xs font-mono font-medium text-primary-foreground select-none active:cursor-grabbing',
                  activeDrag && 'opacity-90 ring-2 ring-ring'
                )}
                style={{
                  left: minutesToX(clamp(startMinutes, range.startMinutes, range.endMinutes), range),
                  width: Math.max(
                    minutesToX(range.endMinutes, range) - minutesToX(clamp(startMinutes, range.startMinutes, range.endMinutes), range),
                    8
                  ),
                }}
              >
                <div
                  onPointerDown={(e) => handleEdgePointerDown(e, 'resize-start')}
                  className="absolute inset-y-0 left-0 flex w-3 cursor-ew-resize touch-none items-center justify-center pointer-coarse:w-5"
                  aria-label={`Start von ${participant.name || 'Unbenannt'} anpassen`}
                >
                  <GripVertical className="pointer-events-none size-3 text-primary-foreground/40" />
                </div>
                <span className="pointer-events-none truncate">{effectiveStart}–</span>
                <MoonStar className="pointer-events-none ml-auto size-3 shrink-0 text-primary-foreground/50" />
              </div>

              {/* Morning piece: midnight -> end. Only resize-end on the right. */}
              <div
                onPointerDown={handleBarPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={cn(
                  'absolute top-1 bottom-1 flex cursor-grab items-center gap-1 overflow-hidden touch-none rounded-sm rounded-l-none bg-primary pr-2 text-xs font-mono font-medium text-primary-foreground select-none active:cursor-grabbing',
                  activeDrag && 'opacity-90 ring-2 ring-ring'
                )}
                style={{
                  left: minutesToX(range.startMinutes, range),
                  width: Math.max(minutesToX(clamp(endMinutes, range.startMinutes, range.endMinutes), range), 8),
                }}
              >
                <MoonStar className="pointer-events-none mr-auto size-3 shrink-0 text-primary-foreground/50" />
                <span className="pointer-events-none truncate">–{effectiveEnd}</span>
                <div
                  onPointerDown={(e) => handleEdgePointerDown(e, 'resize-end')}
                  className="absolute inset-y-0 right-0 flex w-3 cursor-ew-resize touch-none items-center justify-center pointer-coarse:w-5"
                  aria-label={`Ende von ${participant.name || 'Unbenannt'} anpassen`}
                >
                  <GripVertical className="pointer-events-none size-3 text-primary-foreground/40" />
                </div>
              </div>
            </>
          ) : (
            <div
              onPointerDown={handleBarPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className={cn(
                'absolute top-1 bottom-1 flex cursor-grab items-center justify-center gap-1 overflow-hidden touch-none rounded-sm bg-primary px-2 text-xs font-mono font-medium text-primary-foreground select-none active:cursor-grabbing',
                activeDrag && 'opacity-90 ring-2 ring-ring'
              )}
              style={{
                left: minutesToX(clamp(startMinutes, range.startMinutes, range.endMinutes), range),
                width: Math.max(
                  minutesToX(clamp(endMinutes, range.startMinutes, range.endMinutes), range) -
                    minutesToX(clamp(startMinutes, range.startMinutes, range.endMinutes), range),
                  8
                ),
              }}
            >
              <div
                onPointerDown={(e) => handleEdgePointerDown(e, 'resize-start')}
                className="absolute inset-y-0 left-0 flex w-3 cursor-ew-resize touch-none items-center justify-center pointer-coarse:w-5"
                aria-label={`Start von ${participant.name || 'Unbenannt'} anpassen`}
              >
                <GripVertical className="pointer-events-none size-3 text-primary-foreground/40" />
              </div>
              <span className="pointer-events-none truncate">
                {effectiveStart}–{effectiveEnd}
              </span>
              <div
                onPointerDown={(e) => handleEdgePointerDown(e, 'resize-end')}
                className="absolute inset-y-0 right-0 flex w-3 cursor-ew-resize touch-none items-center justify-center pointer-coarse:w-5"
                aria-label={`Ende von ${participant.name || 'Unbenannt'} anpassen`}
              >
                <GripVertical className="pointer-events-none size-3 text-primary-foreground/40" />
              </div>
            </div>
          )}
        </div>
      </PopoverAnchor>

      {/*
        Popover content renders through a portal, but React still bubbles its
        events up the *component* tree — through this Popover, into the row
        — even though it's not a DOM descendant of the row. Stop pointer
        events here so interacting with the popover never re-triggers the
        row's own drag/create handlers underneath.
      */}
      <PopoverContent
        align="start"
        className="w-64"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`shift-name-${participant.id}`}>Name</Label>
            <Input
              id={`shift-name-${participant.id}`}
              value={participant.name}
              onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
              placeholder="Name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Bereich</Label>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    updateParticipant(participant.id, {
                      area: participant.area === area ? undefined : area,
                    })
                  }
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    participant.area === area
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
            <Input
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customArea.trim()) {
                  updateParticipant(participant.id, { area: customArea.trim() })
                  setCustomArea('')
                }
              }}
              placeholder="Eigener Bereich…"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`shift-start-${participant.id}`}>Kommt</Label>
              <Input
                id={`shift-start-${participant.id}`}
                type="time"
                value={participant.startTime}
                onChange={(e) => updateParticipant(participant.id, { startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`shift-end-${participant.id}`}>Geht</Label>
              <Input
                id={`shift-end-${participant.id}`}
                type="time"
                value={participant.endTime}
                onChange={(e) => updateParticipant(participant.id, { endTime: e.target.value })}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start text-destructive hover:text-destructive"
            onClick={() => {
              setPopoverOpen(false)
              removeParticipant(participant.id)
            }}
          >
            <Trash2 /> Entfernen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
