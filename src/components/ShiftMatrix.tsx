import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IntensityLane } from '@/components/IntensityLane'
import { ShiftBar } from '@/components/ShiftBar'
import { ShiftMatrixLivePreview } from '@/components/ShiftMatrixLivePreview'
import {
  clamp,
  FULL_DAY_RANGE,
  HEADER_HEIGHT_PX,
  hourTicks,
  minutesToX,
  NAME_COLUMN_PX,
  rangeWidthPx,
  ROW_HEIGHT_PX,
  type TimelineRange,
} from '@/lib/shift-grid'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow } from '@/types'

interface ShiftDragPreview {
  participantId: string
  startTime: string
  endTime: string
}

interface WindowDragPreview {
  windowId: string
  startTime: string
  endTime: string
}

function TimeAxisHeader({ range }: { range: TimelineRange }) {
  const ticks = hourTicks(range)
  return (
    <div className="relative shrink-0" style={{ width: rangeWidthPx(range), height: HEADER_HEIGHT_PX }}>
      {ticks.map((m) => (
        <div
          key={m}
          className="absolute top-0 h-full border-l border-border pl-1 text-[11px] whitespace-nowrap text-muted-foreground"
          style={{ left: minutesToX(m, range) }}
        >
          {minutesToTime(m)}
        </div>
      ))}
    </div>
  )
}

/**
 * Rendered into a portal at a fixed position computed from the anchor's
 * bounding box, so it escapes the matrix's horizontally-scrollable
 * container instead of being clipped by it.
 */
function NameSuggestions({
  anchorEl,
  names,
  onSelect,
  onRemove,
}: {
  anchorEl: HTMLElement
  names: string[]
  onSelect: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [rect, setRect] = useState(() => anchorEl.getBoundingClientRect())

  useEffect(() => {
    function reposition() {
      setRect(anchorEl.getBoundingClientRect())
    }
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [anchorEl])

  return createPortal(
    <div
      role="listbox"
      className="fixed z-50 max-h-48 w-56 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md"
      style={{ top: rect.bottom + 4, left: rect.left }}
    >
      {names.map((name) => (
        <div
          key={name}
          role="option"
          aria-selected={false}
          className="group flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm hover:bg-accent"
        >
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={() => onSelect(name)}
          >
            {name}
          </button>
          <button
            type="button"
            aria-label={`${name} aus Stammdaten entfernen`}
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(name)
            }}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}

function IntensityBandsOverlay({
  range,
  windows,
  rowCount,
}: {
  range: TimelineRange
  windows: IntensityWindow[]
  rowCount: number
}) {
  if (rowCount === 0) return null

  return (
    <div
      className="pointer-events-none absolute z-0"
      style={{ left: NAME_COLUMN_PX, top: 0, height: ROW_HEIGHT_PX * rowCount, width: rangeWidthPx(range) }}
    >
      {windows.map((w) => {
        const start = timeToMinutes(w.startTime)
        const end = timeToMinutes(w.endTime)
        if (end <= start) return null
        const left = minutesToX(clamp(start, range.startMinutes, range.endMinutes), range)
        const width = minutesToX(clamp(end, range.startMinutes, range.endMinutes), range) - left
        if (width <= 0) return null

        return (
          <div key={w.id} className="absolute top-0 h-full border-x border-warning/30 bg-warning/10" style={{ left, width }} />
        )
      })}
    </div>
  )
}

/**
 * Visual, drag-based replacement for both the stress-window form and the
 * shift entry form: a Gantt-style matrix with a fixed name column, a
 * horizontal time axis, an interactive stress-window lane on top, and one
 * draggable bar per participant underneath. Everything reads from and
 * writes to the same store the calculator already consumes.
 */
export function ShiftMatrix() {
  const participants = useTipPoolStore((s) => s.participants)
  const intensityWindows = useTipPoolStore((s) => s.intensityWindows)
  const totalTip = useTipPoolStore((s) => s.totalTip)
  const employees = useTipPoolStore((s) => s.employees)
  const addParticipant = useTipPoolStore((s) => s.addParticipant)
  const updateParticipant = useTipPoolStore((s) => s.updateParticipant)
  const removeEmployee = useTipPoolStore((s) => s.removeEmployee)

  const [shiftDragPreview, setShiftDragPreview] = useState<ShiftDragPreview | null>(null)
  const [windowDragPreview, setWindowDragPreview] = useState<WindowDragPreview | null>(null)
  const [draftName, setDraftName] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const range: TimelineRange = FULL_DAY_RANGE
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const nameFieldRef = useRef<HTMLDivElement>(null)

  const employeeSuggestions = useMemo(() => {
    const query = draftName.trim().toLowerCase()
    const active = new Set(participants.map((p) => p.name.trim().toLowerCase()))
    return employees
      .filter((name) => !active.has(name.toLowerCase()))
      .filter((name) => !query || name.toLowerCase().includes(query))
  }, [employees, participants, draftName])

  // Close the suggestion dropdown on outside clicks. The dropdown itself is
  // portaled to <body>, so "outside" means neither the name field nor
  // anything rendered inside the portal (identified by its listbox role).
  useEffect(() => {
    if (!suggestionsOpen) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (nameFieldRef.current?.contains(target)) return
      if ((target as Element).closest?.('[role="listbox"]')) return
      setSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [suggestionsOpen])

  // On first mount, scroll to whatever's earliest already on the timeline
  // (or 07:00 as a sane default for an empty pool) instead of dumping the
  // user at 00:00 on a full 24h canvas.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const existingStarts = [
      ...participants.map((p) => timeToMinutes(p.startTime)),
      ...intensityWindows.map((w) => timeToMinutes(w.startTime)),
    ].filter((m) => m > 0)
    const target = existingStarts.length > 0 ? Math.min(...existingStarts) : 7 * 60
    container.scrollLeft = Math.max(0, minutesToX(target, range) - 24)
    // Intentionally mount-only: this sets the initial scroll, it shouldn't
    // keep yanking the view back every time data changes afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveParticipants = useMemo(() => {
    if (!shiftDragPreview) return participants
    return participants.map((p) =>
      p.id === shiftDragPreview.participantId
        ? { ...p, startTime: shiftDragPreview.startTime, endTime: shiftDragPreview.endTime }
        : p
    )
  }, [participants, shiftDragPreview])

  const effectiveIntensityWindows = useMemo(() => {
    if (!windowDragPreview) return intensityWindows
    return intensityWindows.map((w) =>
      w.id === windowDragPreview.windowId
        ? { ...w, startTime: windowDragPreview.startTime, endTime: windowDragPreview.endTime }
        : w
    )
  }, [intensityWindows, windowDragPreview])

  function handleAddParticipant(name: string = draftName) {
    if (!name.trim()) return
    const anchor = minutesToTime(range.startMinutes)
    addParticipant({ name: name.trim(), startTime: anchor, endTime: anchor })
    setDraftName('')
    setSuggestionsOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollContainerRef} className="overflow-x-auto rounded-md border border-border">
        <div style={{ width: NAME_COLUMN_PX + rangeWidthPx(range) }}>
          <div className="flex border-b border-border">
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-border bg-card"
              style={{ width: NAME_COLUMN_PX, height: HEADER_HEIGHT_PX }}
            />
            <TimeAxisHeader range={range} />
          </div>

          <IntensityLane range={range} onPreview={setWindowDragPreview} />

          <div className="relative">
            <IntensityBandsOverlay range={range} windows={effectiveIntensityWindows} rowCount={participants.length} />

            <div className="relative z-10">
              {participants.map((p) => (
                <div key={p.id} className="flex border-b border-border">
                  <div
                    className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 border-r border-border bg-card px-2.5"
                    style={{ width: NAME_COLUMN_PX, height: ROW_HEIGHT_PX }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name || 'Unbenannt'}</span>
                    {p.area && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {p.area}
                      </Badge>
                    )}
                  </div>
                  <ShiftBar
                    participant={p}
                    range={range}
                    previewOverride={
                      shiftDragPreview?.participantId === p.id
                        ? { startTime: shiftDragPreview.startTime, endTime: shiftDragPreview.endTime }
                        : null
                    }
                    onPreview={(startTime, endTime) =>
                      setShiftDragPreview({ participantId: p.id, startTime, endTime })
                    }
                    onCommit={(startTime, endTime) => {
                      updateParticipant(p.id, { startTime, endTime })
                      setShiftDragPreview(null)
                    }}
                  />
                </div>
              ))}

              {participants.length === 0 && (
                <div
                  className="flex items-center justify-center py-6 text-sm text-muted-foreground"
                  style={{ width: NAME_COLUMN_PX + rangeWidthPx(range) }}
                >
                  Noch niemand erfasst — unten hinzufügen.
                </div>
              )}
            </div>
          </div>

          <div className="flex border-t border-border">
            <div
              ref={nameFieldRef}
              className="sticky left-0 z-20 flex shrink-0 items-center gap-1 border-r border-border bg-card p-1.5"
              style={{ width: NAME_COLUMN_PX }}
            >
              <Input
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value)
                  setSuggestionsOpen(true)
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                placeholder="Name"
                className="h-8 min-w-0 px-2 text-sm"
                autoComplete="off"
              />
              <Button
                size="icon-sm"
                onClick={() => handleAddParticipant()}
                disabled={!draftName.trim()}
                aria-label="Person hinzufügen"
              >
                <Plus />
              </Button>

              {suggestionsOpen && employeeSuggestions.length > 0 && nameFieldRef.current && (
                <NameSuggestions
                  anchorEl={nameFieldRef.current}
                  names={employeeSuggestions}
                  onSelect={handleAddParticipant}
                  onRemove={removeEmployee}
                />
              )}
            </div>
            <div
              className="flex shrink-0 items-center px-3 text-xs text-muted-foreground"
              style={{ width: rangeWidthPx(range), height: ROW_HEIGHT_PX }}
            >
              Name eintragen und Enter drücken, dann Schicht auf der Zeile ziehen.
            </div>
          </div>
        </div>
      </div>

      <ShiftMatrixLivePreview
        totalTip={totalTip}
        participants={effectiveParticipants}
        intensityWindows={effectiveIntensityWindows}
      />
    </div>
  )
}
