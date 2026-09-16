import { useMemo } from 'react'
import { ArrowLeft, Calculator, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftMatrix } from '@/components/ShiftMatrix'
import { ShiftTemplatesMenu } from '@/components/ShiftTemplatesMenu'
import { detectOverlappingWindows } from '@/lib/calculator'
import { useTranslation } from '@/lib/i18n/useTranslation'
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
  const { t } = useTranslation()
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
              {t('scheduleStep.eyebrow')}
            </div>
            <CardTitle className="text-xl">{t('scheduleStep.title')}</CardTitle>
          </div>
          <ShiftTemplatesMenu />
        </div>
        <p className="text-sm text-muted-foreground">{t('scheduleStep.description')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
        {overlaps.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>{t('scheduleStep.overlapAlertTitle')}</AlertTitle>
            <AlertDescription>
              {overlaps.map(({ a, b, overlapStart, overlapEnd }) => (
                <p key={`${a.id}-${b.id}`}>
                  {t('scheduleStep.overlapLine', {
                    a: a.label || t('common.unnamed'),
                    b: b.label || t('common.unnamed'),
                    start: minutesToTime(overlapStart),
                    end: minutesToTime(overlapEnd),
                  })}
                </p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <ShiftMatrix />

        <div className="mt-2 flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> {t('common.back')}
          </Button>
          <Button onClick={onNext} disabled={participants.length === 0}>
            <Calculator /> {t('scheduleStep.calculateButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
