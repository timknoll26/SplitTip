import { cn } from '@/lib/utils'

const STEP_LABELS = ['Pool', 'Zeitplan', 'Ergebnis'] as const

interface StepProgressProps {
  currentIndex: number
}

export function StepProgress({ currentIndex }: StepProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i <= currentIndex ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{STEP_LABELS[currentIndex]}</span>
        <span className="text-xs text-muted-foreground">
          Schritt {currentIndex + 1} / {STEP_LABELS.length}
        </span>
      </div>
    </div>
  )
}
