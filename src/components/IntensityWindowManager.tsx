import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, Plus, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IntensityWindowRow } from '@/components/IntensityWindowRow'
import { detectOverlappingWindows } from '@/lib/calculator'
import { minutesToTime } from '@/lib/time'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { IntensityWindow } from '@/types'

const PRESETS: Array<Omit<IntensityWindow, 'id'>> = [
  { label: 'Ruhig', startTime: '14:00', endTime: '17:00', multiplier: 0.8 },
  { label: 'Normal', startTime: '11:00', endTime: '14:00', multiplier: 1.0 },
  { label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 },
]

interface IntensityWindowManagerProps {
  onNext: () => void
  onBack: () => void
}

export function IntensityWindowManager({ onNext, onBack }: IntensityWindowManagerProps) {
  const windows = useTipPoolStore((s) => s.intensityWindows)
  const addIntensityWindow = useTipPoolStore((s) => s.addIntensityWindow)

  const overlaps = useMemo(() => detectOverlappingWindows(windows), [windows])

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle>Stress-Zeitfenster</CardTitle>
        <p className="text-sm text-muted-foreground">
          Definiere Zeiträume, in denen Trinkgeld stärker oder schwächer gewichtet wird.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => addIntensityWindow(preset)}
            >
              <Plus /> {preset.label} ({preset.multiplier.toFixed(1)}x)
            </Button>
          ))}
        </div>

        {overlaps.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Überschneidende Zeitfenster</AlertTitle>
            <AlertDescription>
              {overlaps.map(({ a, b, overlapStart, overlapEnd }) => (
                <p key={`${a.id}-${b.id}`}>
                  „{a.label || 'Unbenannt'}“ und „{b.label || 'Unbenannt'}“ überschneiden sich von{' '}
                  {minutesToTime(overlapStart)}–{minutesToTime(overlapEnd)} Uhr. Diese Zeit wird doppelt
                  gewichtet.
                </p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          {windows.map((w) => (
            <IntensityWindowRow key={w.id} window={w} />
          ))}
          {windows.length === 0 && (
            <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Noch keine Zeitfenster. Nutze die Vorschläge oben oder füge ein eigenes hinzu.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            addIntensityWindow({ label: '', startTime: '12:00', endTime: '14:00', multiplier: 1 })
          }
          className="self-start"
        >
          <Plus /> Eigenes Zeitfenster
        </Button>

        <div className="mt-2 flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> Zurück
          </Button>
          <Button onClick={onNext}>
            Weiter <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
