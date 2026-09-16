import { useMemo } from 'react'
import { ArrowLeft, Calculator, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftMatrix } from '@/components/ShiftMatrix'
import { ShiftTemplatesMenu } from '@/components/ShiftTemplatesMenu'
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
      <CardHeader className="sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              PLANUNG
            </div>
            <CardTitle className="text-xl">Zeitplan</CardTitle>
          </div>
          <ShiftTemplatesMenu />
        </div>
        <p className="text-sm text-muted-foreground">
          Ziehe oben die Stoßzeiten und darunter je Person die Schicht auf die Zeitachse. Klick auf
          einen Balken öffnet die genaue Zeiteingabe.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
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
