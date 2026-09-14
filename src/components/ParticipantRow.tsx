import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCoveringWindows } from '@/lib/calculator'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow, Participant } from '@/types'

interface ParticipantRowProps {
  participant: Participant
  windows: IntensityWindow[]
}

export function ParticipantRow({ participant: p, windows }: ParticipantRowProps) {
  const updateParticipant = useTipPoolStore((s) => s.updateParticipant)
  const removeParticipant = useTipPoolStore((s) => s.removeParticipant)

  const isInvalidShift = p.startTime && p.endTime && p.endTime <= p.startTime
  const covering = getCoveringWindows(p, windows)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={p.name}
          onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
          placeholder="Name"
          className="flex-1"
        />
        <Input
          type="time"
          value={p.startTime}
          onChange={(e) => updateParticipant(p.id, { startTime: e.target.value })}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="time"
          value={p.endTime}
          onChange={(e) => updateParticipant(p.id, { endTime: e.target.value })}
          className="w-28"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => removeParticipant(p.id)}
          aria-label={`${p.name || 'Person'} entfernen`}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </div>

      {isInvalidShift && (
        <Badge variant="destructive" className="self-start">
          Über Mitternacht wird nicht unterstützt
        </Badge>
      )}

      {!isInvalidShift && covering.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {covering.map((w) => (
            <Badge key={w.id} variant="secondary" className="gap-1">
              {w.label || 'Unbenannt'} · {w.multiplier.toFixed(2)}x
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
