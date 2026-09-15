import { useState } from 'react'
import { IntensityWindowManager } from '@/components/IntensityWindowManager'
import { ParticipantInput } from '@/components/ParticipantInput'
import { PoolSetup } from '@/components/PoolSetup'
import { SplitSummary } from '@/components/SplitSummary'
import { StepProgress } from '@/components/StepProgress'
import { StorageNotice } from '@/components/StorageNotice'
import { ThemeToggle } from '@/components/ThemeToggle'

const STEPS = ['setup', 'windows', 'participants', 'results'] as const
type Step = (typeof STEPS)[number]

function App() {
  const [step, setStep] = useState<Step>('setup')
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-5">
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

      <StorageNotice />

      <main key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
        {step === 'setup' && <PoolSetup onNext={() => setStep('windows')} />}
        {step === 'windows' && (
          <IntensityWindowManager onNext={() => setStep('participants')} onBack={() => setStep('setup')} />
        )}
        {step === 'participants' && (
          <ParticipantInput onNext={() => setStep('results')} onBack={() => setStep('windows')} />
        )}
        {step === 'results' && (
          <SplitSummary onBack={() => setStep('participants')} onReset={() => setStep('setup')} />
        )}
      </main>
    </div>
  )
}

export default App
