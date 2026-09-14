import { ArrowRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface PoolSetupProps {
  onNext: () => void
}

export function PoolSetup({ onNext }: PoolSetupProps) {
  const poolName = useTipPoolStore((s) => s.poolName)
  const date = useTipPoolStore((s) => s.date)
  const totalTip = useTipPoolStore((s) => s.totalTip)
  const setPoolName = useTipPoolStore((s) => s.setPoolName)
  const setDate = useTipPoolStore((s) => s.setDate)
  const setTotalTip = useTipPoolStore((s) => s.setTotalTip)

  const canContinue = poolName.trim().length > 0 && totalTip > 0

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          Neuer Trinkgeld-Pool
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pool-name">Name des Pools</Label>
          <Input
            id="pool-name"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="z. B. Samstagabend"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pool-date">Datum</Label>
            <Input
              id="pool-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="total-tip">Gesamttrinkgeld</Label>
            <div className="relative">
              <Input
                id="total-tip"
                type="number"
                min={0}
                step={0.01}
                value={totalTip || ''}
                onChange={(e) => setTotalTip(Number(e.target.value))}
                placeholder="0,00"
                className="pr-7 font-mono"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>
        </div>

        <Button onClick={onNext} disabled={!canContinue} className="mt-2 self-end">
          Weiter
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}
