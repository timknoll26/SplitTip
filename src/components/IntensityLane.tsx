import { useRef, useState } from 'react'
import { Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import {
  clamp,
  DEFAULT_TOUCH_CREATE_MINUTES,
  DRAG_CLICK_THRESHOLD_PX,
  LANE_HEIGHT_PX,
  minutesToX,
  MIN_SHIFT_MINUTES,
  NAME_COLUMN_PX,
  PX_PER_MINUTE,
  rangeWidthPx,
  snapMinutes,
  TOUCH_TAP_THRESHOLD_PX,
  xToMinutes,
  type TimelineRange,
} from '@/lib/shift-grid'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow } from '@/types'

type DragMode = 'move' | 'resize-start' | 'resize-end' | 'create'

interface ActiveDrag {
  mode: DragMode
  windowId: string | null // null while creating a brand new window
  pointerId: number
  startClientX: number
  originStart: number
  originEnd: number
}

interface WindowPreview {
  windowId: string | null
  startTime: string
  endTime: string
}

interface IntensityLaneProps {
  range: TimelineRange
  /** Bubbles the live preview of an in-progress move/resize up, so the passive bands behind the participant rows and the live payout total can follow along. Create-drags (windowId null) aren't reported — nothing to preview until they're committed. */
  onPreview: (preview: { windowId: string; startTime: string; endTime: string } | null) => void
}

const NEW_WINDOW_DEFAULTS = { label: '', multiplier: 1.2 }

/**
 * The stress-window equivalent of a participant row, except a single lane can
 * hold several non-overlapping windows side by side: drag empty space to draw
 * a new one, drag an existing bar's body/edges to move or resize it, click
 * (no real movement) to open the label/multiplier/time popover.
 */
export function IntensityLane({ range, onPreview }: IntensityLaneProps) {
  const windows = useTipPoolStore((s) => s.intensityWindows)
  const addIntensityWindow = useTipPoolStore((s) => s.addIntensityWindow)
  const updateIntensityWindow = useTipPoolStore((s) => s.updateIntensityWindow)
  const removeIntensityWindow = useTipPoolStore((s) => s.removeIntensityWindow)

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [preview, setPreview] = useState<WindowPreview | null>(null)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  /** Pending-tap origin on touch — set on empty-area pointerdown, cleared on release/cancel. Not drag state: we deliberately don't capture the pointer here so a real swipe still scrolls. */
  const touchTapOrigin = useRef<{ x: number; y: number } | null>(null)

  function reportPreview(next: WindowPreview | null) {
    setPreview(next)
    onPreview(next && next.windowId ? { windowId: next.windowId, startTime: next.startTime, endTime: next.endTime } : null)
  }

  function beginDrag(e: React.PointerEvent, mode: DragMode, windowId: string | null, originStart: number, originEnd: number) {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setActiveDrag({ mode, windowId, pointerId: e.pointerId, startClientX: e.clientX, originStart, originEnd })
  }

  function resolveDrag(e: React.PointerEvent, drag: ActiveDrag, laneLeft: number): { start: number; end: number } {
    const deltaMin = (e.clientX - drag.startClientX) / PX_PER_MINUTE

    if (drag.mode === 'move') {
      const duration = drag.originEnd - drag.originStart
      const start = clamp(snapMinutes(drag.originStart + deltaMin), range.startMinutes, range.endMinutes - duration)
      return { start, end: start + duration }
    }
    if (drag.mode === 'resize-start') {
      const start = clamp(snapMinutes(drag.originStart + deltaMin), range.startMinutes, drag.originEnd - MIN_SHIFT_MINUTES)
      return { start, end: drag.originEnd }
    }
    if (drag.mode === 'resize-end') {
      const end = clamp(snapMinutes(drag.originEnd + deltaMin), drag.originStart + MIN_SHIFT_MINUTES, range.endMinutes)
      return { start: drag.originStart, end }
    }
    const current = clamp(snapMinutes(xToMinutes(e.clientX - laneLeft, range)), range.startMinutes, range.endMinutes)
    return { start: Math.min(drag.originStart, current), end: Math.max(drag.originStart, current) }
  }

  function handleLanePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const laneLeft = e.currentTarget.getBoundingClientRect().left
    const { start, end } = resolveDrag(e, activeDrag, laneLeft)
    reportPreview({ windowId: activeDrag.windowId, startTime: minutesToTime(start), endTime: minutesToTime(end) })
  }

  function handleLanePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' && touchTapOrigin.current) {
      const origin = touchTapOrigin.current
      touchTapOrigin.current = null
      const moved = Math.hypot(e.clientX - origin.x, e.clientY - origin.y)
      if (moved <= TOUCH_TAP_THRESHOLD_PX) {
        const laneLeft = e.currentTarget.getBoundingClientRect().left
        const start = clamp(
          snapMinutes(xToMinutes(e.clientX - laneLeft, range)),
          range.startMinutes,
          range.endMinutes - DEFAULT_TOUCH_CREATE_MINUTES
        )
        const newId = addIntensityWindow({
          ...NEW_WINDOW_DEFAULTS,
          startTime: minutesToTime(start),
          endTime: minutesToTime(start + DEFAULT_TOUCH_CREATE_MINUTES),
        })
        setOpenPopoverId(newId)
      }
      return
    }

    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return
    const laneLeft = e.currentTarget.getBoundingClientRect().left
    const hadRealMovement = Math.abs(e.clientX - activeDrag.startClientX) > DRAG_CLICK_THRESHOLD_PX

    if (hadRealMovement) {
      const { start, end } = resolveDrag(e, activeDrag, laneLeft)
      const finalEnd = activeDrag.mode === 'create' && end - start < MIN_SHIFT_MINUTES ? start + MIN_SHIFT_MINUTES : end

      if (activeDrag.mode === 'create') {
        const newId = addIntensityWindow({
          ...NEW_WINDOW_DEFAULTS,
          startTime: minutesToTime(start),
          endTime: minutesToTime(finalEnd),
        })
        setOpenPopoverId(newId)
      } else if (activeDrag.windowId) {
        updateIntensityWindow(activeDrag.windowId, { startTime: minutesToTime(start), endTime: minutesToTime(finalEnd) })
      }
    } else if (activeDrag.mode !== 'create' && activeDrag.windowId) {
      setOpenPopoverId(activeDrag.windowId)
    }

    reportPreview(null)
    setActiveDrag(null)
  }

  function handleEmptyAreaPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') {
      // Don't capture or start a drag here — let a real swipe scroll the
      // lane normally. handleLanePointerUp checks whether this stayed a tap.
      touchTapOrigin.current = { x: e.clientX, y: e.clientY }
      return
    }
    const laneLeft = e.currentTarget.getBoundingClientRect().left
    const anchor = clamp(snapMinutes(xToMinutes(e.clientX - laneLeft, range)), range.startMinutes, range.endMinutes)
    beginDrag(e, 'create', null, anchor, anchor)
  }

  function handlePointerCancel() {
    touchTapOrigin.current = null
    setActiveDrag(null)
    reportPreview(null)
  }

  return (
    <div className="flex border-b-2 border-border bg-muted/30">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 border-r border-border bg-muted/30 px-2.5"
        style={{ width: NAME_COLUMN_PX, height: LANE_HEIGHT_PX }}
      >
        <Zap className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium text-muted-foreground">Stoßzeiten</span>
      </div>

      <div
        className="relative shrink-0"
        style={{ width: rangeWidthPx(range), height: LANE_HEIGHT_PX }}
        onPointerDown={handleEmptyAreaPointerDown}
        onPointerMove={handleLanePointerMove}
        onPointerUp={handleLanePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {windows.length === 0 && !activeDrag && (
          <div className="pointer-events-none absolute inset-1 flex items-center rounded-sm border border-dashed border-border text-xs text-muted-foreground">
            <span className="sticky px-2 whitespace-nowrap" style={{ left: NAME_COLUMN_PX + 8 }}>
              Ziehen oder tippen für ein Stoßzeit-Fenster
            </span>
          </div>
        )}

        {windows.map((w) => {
          const isPreviewing = preview?.windowId === w.id
          const effStart = isPreviewing ? preview.startTime : w.startTime
          const effEnd = isPreviewing ? preview.endTime : w.endTime
          return (
            <IntensityWindowBar
              key={w.id}
              window={w}
              effectiveStart={effStart}
              effectiveEnd={effEnd}
              range={range}
              isDragging={activeDrag?.windowId === w.id}
              popoverOpen={openPopoverId === w.id}
              onPopoverOpenChange={(open) => setOpenPopoverId(open ? w.id : null)}
              onBeginMove={(e) => beginDrag(e, 'move', w.id, timeToMinutes(w.startTime), timeToMinutes(w.endTime))}
              onBeginResizeStart={(e) => beginDrag(e, 'resize-start', w.id, timeToMinutes(w.startTime), timeToMinutes(w.endTime))}
              onBeginResizeEnd={(e) => beginDrag(e, 'resize-end', w.id, timeToMinutes(w.startTime), timeToMinutes(w.endTime))}
              onUpdate={(patch) => updateIntensityWindow(w.id, patch)}
              onRemove={() => {
                setOpenPopoverId(null)
                removeIntensityWindow(w.id)
              }}
            />
          )
        })}

        {activeDrag?.mode === 'create' && preview?.windowId === null && (
          <div
            className="pointer-events-none absolute top-1 bottom-1 rounded-sm border-2 border-dashed border-primary bg-primary/10"
            style={{
              left: minutesToX(clamp(timeToMinutes(preview.startTime), range.startMinutes, range.endMinutes), range),
              width: Math.max(
                minutesToX(clamp(timeToMinutes(preview.endTime), range.startMinutes, range.endMinutes), range) -
                  minutesToX(clamp(timeToMinutes(preview.startTime), range.startMinutes, range.endMinutes), range),
                8
              ),
            }}
          />
        )}
      </div>
    </div>
  )
}

interface IntensityWindowBarProps {
  window: IntensityWindow
  effectiveStart: string
  effectiveEnd: string
  range: TimelineRange
  isDragging: boolean
  popoverOpen: boolean
  onPopoverOpenChange: (open: boolean) => void
  onBeginMove: (e: React.PointerEvent) => void
  onBeginResizeStart: (e: React.PointerEvent) => void
  onBeginResizeEnd: (e: React.PointerEvent) => void
  onUpdate: (patch: Partial<Omit<IntensityWindow, 'id'>>) => void
  onRemove: () => void
}

function IntensityWindowBar({
  window: w,
  effectiveStart,
  effectiveEnd,
  range,
  isDragging,
  popoverOpen,
  onPopoverOpenChange,
  onBeginMove,
  onBeginResizeStart,
  onBeginResizeEnd,
  onUpdate,
  onRemove,
}: IntensityWindowBarProps) {
  const startMinutes = timeToMinutes(effectiveStart)
  const endMinutes = timeToMinutes(effectiveEnd)
  const left = minutesToX(clamp(startMinutes, range.startMinutes, range.endMinutes), range)
  const width = Math.max(
    minutesToX(clamp(endMinutes, range.startMinutes, range.endMinutes), range) - left,
    8
  )

  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverAnchor asChild>
        <div
          onPointerDown={onBeginMove}
          className={cn(
            'absolute top-1 bottom-1 flex cursor-grab items-center justify-center gap-1 overflow-hidden touch-none rounded-sm border border-warning/50 bg-warning/25 px-2 text-xs font-medium text-foreground select-none active:cursor-grabbing',
            isDragging && 'opacity-90 ring-2 ring-ring'
          )}
          style={{ left, width }}
        >
          <div
            onPointerDown={(e) => {
              e.stopPropagation()
              onBeginResizeStart(e)
            }}
            className="absolute inset-y-0 left-0 w-3 cursor-ew-resize touch-none pointer-coarse:w-5"
            aria-label={`Start von ${w.label || 'Stoßzeit'} anpassen`}
          />
          <span className="pointer-events-none truncate">
            {w.label || 'Unbenannt'} · {w.multiplier.toFixed(2)}x
          </span>
          <div
            onPointerDown={(e) => {
              e.stopPropagation()
              onBeginResizeEnd(e)
            }}
            className="absolute inset-y-0 right-0 w-3 cursor-ew-resize touch-none pointer-coarse:w-5"
            aria-label={`Ende von ${w.label || 'Stoßzeit'} anpassen`}
          />
        </div>
      </PopoverAnchor>

      {/*
        Popover content renders through a portal, but React still bubbles its
        events up the *component* tree — through this Popover, into the lane
        — even though it's not a DOM descendant of the lane. Without this,
        dragging the multiplier slider bubbles a pointerdown to the lane's
        empty-space handler and creates a brand new window underneath.
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
            <Label htmlFor={`window-label-${w.id}`}>Bezeichnung</Label>
            <Input
              id={`window-label-${w.id}`}
              value={w.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="z. B. Stoßzeit Abend"
              autoFocus
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`window-start-${w.id}`}>Von</Label>
              <Input
                id={`window-start-${w.id}`}
                type="time"
                value={w.startTime}
                onChange={(e) => onUpdate({ startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`window-end-${w.id}`}>Bis</Label>
              <Input
                id={`window-end-${w.id}`}
                type="time"
                value={w.endTime}
                onChange={(e) => onUpdate({ endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Multiplikator</Label>
              <span className="text-sm font-medium tabular-nums">{w.multiplier.toFixed(2)}x</span>
            </div>
            <Slider
              value={[w.multiplier]}
              min={0.5}
              max={2}
              step={0.05}
              onValueChange={([value]) => onUpdate({ multiplier: value })}
            />
          </div>
          <Button variant="outline" size="sm" className="self-start text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 /> Entfernen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
