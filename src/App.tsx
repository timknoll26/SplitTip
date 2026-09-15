import { useState } from 'react'
import { PoolSetup } from '@/components/PoolSetup'
import { ScheduleStep } from '@/components/ScheduleStep'
import { SplitSummary } from '@/components/SplitSummary'
import { StepProgress } from '@/components/StepProgress'
import { StorageNotice } from '@/components/StorageNotice'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const STEPS = ['setup', 'schedule', 'results'] as const
type Step = (typeof STEPS)[number]

// The schedule step hosts the drag-to-build timeline and needs real room to
// breathe; setup/results are simple forms that read better narrow.
const STEP_MAX_WIDTH: Record<Step, string> = {
  setup: 'max-w-2xl',
  schedule: 'max-w-5xl',
  results: 'max-w-2xl',
}

function App() {
  const [step, setStep] = useState<Step>('setup')
  const stepIndex = STEPS.indexOf(step)
  const maxWidth = STEP_MAX_WIDTH[step]

  return (
    <div className="mx-auto flex min-h-svh flex-col gap-8 px-4 py-8 sm:py-10">
      <header className={cn('mx-auto flex w-full flex-col gap-5 transition-[max-width] duration-300', maxWidth)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-medium tracking-tight">
              <a href="/" className="text-foreground no-underline hover:opacity-80">
                SplitTip
              </a>
            </h1>
            <p className="text-sm text-muted-foreground">
              Faires Trinkgeld-Pooling nach Schichtzeit und Stoßzeiten.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <StepProgress currentIndex={stepIndex} />
      </header>

      <div className={cn('mx-auto w-full', maxWidth)}>
        <StorageNotice />
      </div>

      <main key={step} className={cn('mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300', maxWidth)}>
        {step === 'setup' && <PoolSetup onNext={() => setStep('schedule')} />}
        {step === 'schedule' && (
          <ScheduleStep onNext={() => setStep('results')} onBack={() => setStep('setup')} />
        )}
        {step === 'results' && (
          <SplitSummary onBack={() => setStep('schedule')} onReset={() => setStep('setup')} />
        )}
      </main>
    </div>
  )
}

export default App
