import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy, RotateCcw, TriangleAlert } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { calculateSplit } from '@/lib/calculator'
import { buildWhatsAppText, formatEUR, formatPercent } from '@/lib/format'
import { formatDuration } from '@/lib/time'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface SplitSummaryProps {
  onBack: () => void
  onReset: () => void
}

export function SplitSummary({ onBack, onReset }: SplitSummaryProps) {
  const poolName = useTipPoolStore((s) => s.poolName)
  const date = useTipPoolStore((s) => s.date)
  const totalTip = useTipPoolStore((s) => s.totalTip)
  const participants = useTipPoolStore((s) => s.participants)
  const intensityWindows = useTipPoolStore((s) => s.intensityWindows)
  const resetStore = useTipPoolStore((s) => s.reset)

  const [copied, setCopied] = useState(false)

  const result = useMemo(
    () => calculateSplit(totalTip, participants, intensityWindows),
    [totalTip, participants, intensityWindows]
  )

  async function handleCopy() {
    const text = buildWhatsAppText({ poolName, date }, result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    resetStore()
    onReset()
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle>{poolName || 'Trinkgeld-Pool'}</CardTitle>
        <p className="text-sm text-muted-foreground">Gesamt: {formatEUR(result.totalTip)}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {result.totalWeightedMinutes <= 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Keine gültigen Schichten</AlertTitle>
            <AlertDescription>
              Es konnte keine Verteilung berechnet werden. Prüfe die Kommt-/Geht-Zeiten deines Teams.
            </AlertDescription>
          </Alert>
        )}

        <Accordion type="multiple" className="rounded-md border border-border px-3">
          {result.payouts.map((p) => (
            <AccordionItem key={p.participantId} value={p.participantId}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-foreground">{p.name || 'Unbenannt'}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.startTime}–{p.endTime} · {formatDuration(p.weightedMinutes)} gewichtet ·{' '}
                      {formatPercent(p.hoursShare)}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-primary">{formatEUR(p.amount)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {p.isInvalidShift ? (
                  <p className="text-sm text-destructive">
                    Schicht über Mitternacht wird aktuell nicht unterstützt – bitte Zeiten anpassen.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    {p.windowBreakdown.map((wb) => (
                      <div key={wb.windowId} className="flex justify-between gap-2">
                        <span>
                          {wb.label || 'Unbenannt'} ({wb.multiplier.toFixed(2)}x)
                        </span>
                        <span className="font-mono">
                          {formatDuration(wb.minutes)} → {formatDuration(wb.weightedMinutes)}
                        </span>
                      </div>
                    ))}
                    {p.normalMinutes > 0 && (
                      <div className="flex justify-between gap-2">
                        <span>Normalzeit (1.00x)</span>
                        <span className="font-mono">{formatDuration(p.normalMinutes)}</span>
                      </div>
                    )}
                    {p.windowBreakdown.length === 0 && p.normalMinutes <= 0 && (
                      <span>Keine Schichtzeit erfasst.</span>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2.5 text-sm font-medium">
          <span>Summe</span>
          <span className="font-mono">{formatEUR(result.payouts.reduce((s, p) => s + p.amount, 0))}</span>
        </div>

        <Button onClick={handleCopy} variant="outline" className="gap-2">
          {copied ? <Check /> : <Copy />}
          {copied ? 'In Zwischenablage kopiert' : 'Als WhatsApp-Text kopieren'}
        </Button>

        <Separator />

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> Zurück
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw /> Neuer Pool
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
