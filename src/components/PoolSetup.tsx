import { ArrowRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface PoolSetupProps {
  onNext: () => void
}

export function PoolSetup({ onNext }: PoolSetupProps) {
  const { t } = useTranslation()
  const poolName = useTipPoolStore((s) => s.poolName)
  const date = useTipPoolStore((s) => s.date)
  const totalTip = useTipPoolStore((s) => s.totalTip)
  const setPoolName = useTipPoolStore((s) => s.setPoolName)
  const setDate = useTipPoolStore((s) => s.setDate)
  const setTotalTip = useTipPoolStore((s) => s.setTotalTip)

  const canContinue = poolName.trim().length > 0 && totalTip > 0

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="sm:px-8">
        <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {t('poolSetup.eyebrow')}
        </div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wallet className="size-5 text-primary" />
          {t('poolSetup.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pool-name">{t('poolSetup.poolNameLabel')}</Label>
          <Input
            id="pool-name"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder={t('poolSetup.poolNamePlaceholder')}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pool-date">{t('poolSetup.dateLabel')}</Label>
            <Input
              id="pool-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="total-tip">{t('poolSetup.totalTipLabel')}</Label>
            <div className="relative">
              <Input
                id="total-tip"
                type="number"
                min={0}
                step={0.01}
                value={totalTip || ''}
                onChange={(e) => setTotalTip(Number(e.target.value))}
                placeholder={t('poolSetup.totalTipPlaceholder')}
                className="pr-7 font-mono"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>
        </div>

        <Button onClick={onNext} disabled={!canContinue} className="mt-2 self-end">
          {t('poolSetup.continueButton')}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}
