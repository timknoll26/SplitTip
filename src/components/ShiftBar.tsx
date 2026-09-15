import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { cn } from '@/lib/utils'
import {
  clamp,
  DRAG_CLICK_THRESHOLD_PX,
  minutesToX,
  MIN_SHIFT_MINUTES,
  PX_PER_MINUTE,
  ROW_HEIGHT_PX,
  snapMinutes,
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

type DragMode = 'move' | 'resize-start' | 'resize-end' | 'create'

interface ActiveDrag {
  mode: DragMode
  pointerId: number
  startClientX: number
  originStart: number
  originEnd: number
}

/**
 * One participant's row in the shift matrix: an empty dashed track (no shift
 * assigned yet) that can be dragged into a new bar, or a filled bar that can
 * be moved / resized by its edges. Both end in the same click-vs-drag check
 * and the same numeric popover fallback.
 */
export function ShiftBar({ participant, range, previewOverride, onPreview, onCommit }: ShiftBarProps) {
  const removeParticipant = useTipPoolStore((s) => s.removeParticipant)
  const updateParticipant = useTipPoolStore((s) => s.updateParticipant)

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const effectiveStart = previewOverride?.startTime ?? participant.startTime
  const effectiveEnd = previewOverride?.endTime ?? participant.endTime
  const startMinutes = timeToMinutes(effectiveStart)
  const endMinutes = timeToMinutes(effectiveEnd)
  const isEmpty = endMinutes <= startMinutes

  function beginDrag(e: React.PointerEvent<HTMLDivElement>, mode: DragMode, originStart: number, originEnd: number) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveDrag({
      mode,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      originStart,
      originEnd,
    })
  }

  function handleBarPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    beginDrag(e, 'move', startMinutes, endMinutes)
  }

  function handleEdgePointerDown(e: React.PointerEvent<HTMLDivElement>, edge: 'resize-start' | 'resize-end') {
    beginDrag(e, edge, startMinutes, endMinutes)
  }

  function handleEmptyTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const trackLeft = e.currentTarget.getBoundingClientRect().left
    const anchor = clamp(snapMinutes(xToMinutes(e.clientX - trackLeft, range)), range.startMinutes, range.endMinutes)
    beginDrag(e, 'create', anchor, anchor)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const deltaMin = (e.clientX - activeDrag.startClientX) / PX_PER_MINUTE

    let newStart = activeDrag.originStart
    let newEnd = activeDrag.originEnd

    if (activeDrag.mode === 'move') {
      const duration = activeDrag.originEnd - activeDrag.originStart
      newStart = clamp(snapMinutes(activeDrag.originStart + deltaMin), range.startMinutes, range.endMinutes - duration)
      newEnd = newStart + duration
    } else if (activeDrag.mode === 'resize-start') {
      newStart = clamp(
        snapMinutes(activeDrag.originStart + deltaMin),
        range.startMinutes,
        activeDrag.originEnd - MIN_SHIFT_MINUTES
      )
    } else if (activeDrag.mode === 'resize-end') {
      newEnd = clamp(
        snapMinutes(activeDrag.originEnd + deltaMin),
        activeDrag.originStart + MIN_SHIFT_MINUTES,
        range.endMinutes
      )
    } else {
      const trackLeft = e.currentTarget.getBoundingClientRect().left
      const current = clamp(snapMinutes(xToMinutes(e.clientX - trackLeft, range)), range.startMinutes, range.endMinutes)
      newStart = Math.min(activeDrag.originStart, current)
      newEnd = Math.max(activeDrag.originStart, current)
    }

    onPreview(minutesToTime(newStart), minutesToTime(newEnd))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const hadRealMovement = Math.abs(e.clientX - activeDrag.startClientX) > DRAG_CLICK_THRESHOLD_PX

    if (hadRealMovement) {
      const finalStart = previewOverride ? timeToMinutes(previewOverride.startTime) : activeDrag.originStart
      const finalEnd = previewOverride ? timeToMinutes(previewOverride.endTime) : activeDrag.originEnd
      const end = activeDrag.mode === 'create' && finalEnd - finalStart < MIN_SHIFT_MINUTES
        ? finalStart + MIN_SHIFT_MINUTES
        : finalEnd
      onCommit(minutesToTime(finalStart), minutesToTime(end))
    } else {
      setPopoverOpen(true)
    }
    setActiveDrag(null)
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <div
          className="relative shrink-0 touch-none"
          style={{
            width: minutesToX(range.endMinutes, range),
            height: ROW_HEIGHT_PX,
            backgroundImage:
              'repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent ' +
              PX_PER_MINUTE * 60 +
              'px)',
          }}
        >
          {isEmpty ? (
            <div
              onPointerDown={handleEmptyTrackPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute inset-1 flex cursor-crosshair items-center justify-center rounded-sm border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              Ziehen für Schicht
            </div>
          ) : (
            <div
              onPointerDown={handleBarPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={cn(
                'absolute top-1 bottom-1 flex cursor-grab items-center justify-center gap-1 overflow-hidden rounded-sm bg-primary px-2 text-xs font-mono font-medium text-primary-foreground select-none active:cursor-grabbing',
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
                className="absolute inset-y-0 left-0 w-3 cursor-ew-resize"
              />
              <span className="pointer-events-none truncate">
                {effectiveStart}–{effectiveEnd}
              </span>
              <div
                onPointerDown={(e) => handleEdgePointerDown(e, 'resize-end')}
                className="absolute inset-y-0 right-0 w-3 cursor-ew-resize"
              />
            </div>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-64">
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
