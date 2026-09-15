import { useMemo } from 'react'
import { ArrowLeft, Calculator, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftMatrix } from '@/components/ShiftMatrix'
import { detectOverlappingWindows } from '@/lib/calculator'
import { minutesToTime } from '@/lib/time'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface ScheduleStepProps {
  onNext: () => void
  onBack: () => void
}

/**
 * One calendar-style canvas for the whole schedule: drag out stress windows
 * in the top lane, drag out each person's shift below it. Replaces what used
 * to be two separate steps (a form for windows, a form for participants).
 */
export function ScheduleStep({ onNext, onBack }: ScheduleStepProps) {
  const participants = useTipPoolStore((s) => s.participants)
  const intensityWindows = useTipPoolStore((s) => s.intensityWindows)

  const overlaps = useMemo(() => detectOverlappingWindows(intensityWindows), [intensityWindows])

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle>Zeitplan</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ziehe oben die Stoßzeiten und darunter je Person die Schicht auf die Zeitachse. Klick auf
          einen Balken öffnet die genaue Zeiteingabe.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {overlaps.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Überschneidende Zeitfenster</AlertTitle>
            <AlertDescription>
              {overlaps.map(({ a, b, overlapStart, overlapEnd }) => (
                <p key={`${a.id}-${b.id}`}>
                  „{a.label || 'Unbenannt'}“ und „{b.label || 'Unbenannt'}“ überschneiden sich von{' '}
                  {minutesToTime(overlapStart)}–{minutesToTime(overlapEnd)} Uhr. Diese Zeit wird
                  doppelt gewichtet.
                </p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <ShiftMatrix />

        <div className="mt-2 flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> Zurück
          </Button>
          <Button onClick={onNext} disabled={participants.length === 0}>
            <Calculator /> Berechnen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
