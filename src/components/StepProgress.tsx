import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/translations'

const STEP_KEYS: TranslationKey[] = ['stepProgress.pool', 'stepProgress.schedule', 'stepProgress.results']

interface StepProgressProps {
  currentIndex: number
}

export function StepProgress({ currentIndex }: StepProgressProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {STEP_KEYS.map((key, i) => (
          <div
            key={key}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i <= currentIndex ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{t(STEP_KEYS[currentIndex])}</span>
        <span className="text-xs text-muted-foreground">
          {t('stepProgress.stepOf', { current: currentIndex + 1, total: STEP_KEYS.length })}
        </span>
      </div>
    </div>
  )
}
