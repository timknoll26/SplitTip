import { useMemo } from 'react'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatEUR } from '@/lib/format'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { computePersonStats } from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface StatsPageProps {
  onBack: () => void
}

export function StatsPage({ onBack }: StatsPageProps) {
  const { t, language } = useTranslation()
  const history = useTipPoolStore((s) => s.history)
  const stats = useMemo(() => computePersonStats(history), [history])

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="sm:px-8">
        <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {t('statsPage.eyebrow')}
        </div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="size-5 text-primary" />
          {t('statsPage.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('statsPage.description')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('statsPage.emptyState')}</p>
        ) : (
          <Accordion type="multiple" className="rounded-md border border-border px-3">
            {stats.map((person) => (
              <AccordionItem key={person.name} value={person.name}>
                <AccordionTrigger>
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium text-foreground">{person.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {person.shifts.length}{' '}
                        {person.shifts.length === 1 ? t('statsPage.poolSingular') : t('statsPage.poolPlural')} ·{' '}
                        {formatDuration(person.totalWeightedMinutes)} {t('common.weighted')}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      {formatEUR(person.totalAmount, language)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    {person.shifts.map((shift) => (
                      <div key={shift.poolId} className="flex justify-between gap-2">
                        <span>
                          {formatDate(shift.date, language)} · {shift.poolName}
                        </span>
                        <span className="font-mono">{formatEUR(shift.amount, language)}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="mt-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> {t('common.back')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
