import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShiftBar } from '@/components/ShiftBar'
import { ShiftMatrixLivePreview } from '@/components/ShiftMatrixLivePreview'
import {
  clamp,
  computeTimelineRange,
  HEADER_HEIGHT_PX,
  hourTicks,
  minutesToX,
  NAME_COLUMN_PX,
  rangeWidthPx,
  ROW_HEIGHT_PX,
  type TimelineRange,
} from '@/lib/shift-grid'
import { minutesToTime, timeToMinutes } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow } from '@/types'

interface DragPreview {
  participantId: string
  startTime: string
  endTime: string
}

const BAND_COLOR_CLASSES = ['bg-primary/15 border-primary/40', 'bg-warning/15 border-warning/40', 'bg-negative/15 border-negative/40']

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
      {windows.map((w, i) => {
        const start = timeToMinutes(w.startTime)
        const end = timeToMinutes(w.endTime)
        if (end <= start) return null
        const left = minutesToX(clamp(start, range.startMinutes, range.endMinutes), range)
        const width = minutesToX(clamp(end, range.startMinutes, range.endMinutes), range) - left
        if (width <= 0) return null

        return (
          <div
            key={w.id}
            className={cn('absolute top-0 h-full border-x', BAND_COLOR_CLASSES[i % BAND_COLOR_CLASSES.length])}
            style={{ left, width }}
          >
            <span className="absolute top-1 left-1 rounded-sm bg-background/70 px-1 text-[10px] font-medium whitespace-nowrap text-foreground">
              {w.label || 'Unbenannt'} · {w.multiplier.toFixed(2)}x
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Visual, drag-based replacement for the shift entry form: a Gantt-style
 * matrix with a fixed name column and a horizontal time axis. Bars read from
 * and write to the same Participant model the calculator already uses.
 */
export function ShiftMatrix() {
  const participants = useTipPoolStore((s) => s.participants)
  const intensityWindows = useTipPoolStore((s) => s.intensityWindows)
  const totalTip = useTipPoolStore((s) => s.totalTip)
  const addParticipant = useTipPoolStore((s) => s.addParticipant)
  const updateParticipant = useTipPoolStore((s) => s.updateParticipant)

  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [draftName, setDraftName] = useState('')

  const range = useMemo(
    () => computeTimelineRange(participants, intensityWindows),
    [participants, intensityWindows]
  )

  const effectiveParticipants = useMemo(() => {
    if (!dragPreview) return participants
    return participants.map((p) =>
      p.id === dragPreview.participantId
        ? { ...p, startTime: dragPreview.startTime, endTime: dragPreview.endTime }
        : p
    )
  }, [participants, dragPreview])

  function handleAddParticipant() {
    if (!draftName.trim()) return
    const anchor = minutesToTime(range.startMinutes)
    addParticipant({ name: draftName.trim(), startTime: anchor, endTime: anchor })
    setDraftName('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <div style={{ width: NAME_COLUMN_PX + rangeWidthPx(range) }}>
          <div className="flex border-b border-border">
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-border bg-card"
              style={{ width: NAME_COLUMN_PX, height: HEADER_HEIGHT_PX }}
            />
            <TimeAxisHeader range={range} />
          </div>

          <div className="relative">
            <IntensityBandsOverlay range={range} windows={intensityWindows} rowCount={participants.length} />

            <div className="relative z-10">
              {participants.map((p) => (
                <div key={p.id} className="flex border-b border-border">
                  <div
                    className="sticky left-0 z-20 flex shrink-0 items-center border-r border-border bg-card px-2"
                    style={{ width: NAME_COLUMN_PX, height: ROW_HEIGHT_PX }}
                  >
                    <span className="truncate text-sm">{p.name || 'Unbenannt'}</span>
                  </div>
                  <ShiftBar
                    participant={p}
                    range={range}
                    previewOverride={
                      dragPreview?.participantId === p.id
                        ? { startTime: dragPreview.startTime, endTime: dragPreview.endTime }
                        : null
                    }
                    onPreview={(startTime, endTime) =>
                      setDragPreview({ participantId: p.id, startTime, endTime })
                    }
                    onCommit={(startTime, endTime) => {
                      updateParticipant(p.id, { startTime, endTime })
                      setDragPreview(null)
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
              className="sticky left-0 z-20 flex shrink-0 items-center gap-1 border-r border-border bg-card p-1.5"
              style={{ width: NAME_COLUMN_PX }}
            >
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                placeholder="Name"
                className="h-8 min-w-0 px-2 text-sm"
              />
              <Button
                size="icon-sm"
                onClick={handleAddParticipant}
                disabled={!draftName.trim()}
                aria-label="Person hinzufügen"
              >
                <Plus />
              </Button>
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
        intensityWindows={intensityWindows}
      />
    </div>
  )
}
