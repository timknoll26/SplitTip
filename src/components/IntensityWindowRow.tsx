import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow } from '@/types'

interface IntensityWindowRowProps {
  window: IntensityWindow
}

export function IntensityWindowRow({ window: w }: IntensityWindowRowProps) {
  const updateIntensityWindow = useTipPoolStore((s) => s.updateIntensityWindow)
  const removeIntensityWindow = useTipPoolStore((s) => s.removeIntensityWindow)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={w.label}
          onChange={(e) => updateIntensityWindow(w.id, { label: e.target.value })}
          placeholder="Bezeichnung"
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => removeIntensityWindow(w.id)}
          aria-label={`${w.label || 'Fenster'} entfernen`}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="time"
          value={w.startTime}
          onChange={(e) => updateIntensityWindow(w.id, { startTime: e.target.value })}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="time"
          value={w.endTime}
          onChange={(e) => updateIntensityWindow(w.id, { endTime: e.target.value })}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-3">
        <Slider
          value={[w.multiplier]}
          min={0.5}
          max={2}
          step={0.05}
          onValueChange={([value]) => updateIntensityWindow(w.id, { multiplier: value })}
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
          {w.multiplier.toFixed(2)}x
        </span>
      </div>
    </div>
  )
}
