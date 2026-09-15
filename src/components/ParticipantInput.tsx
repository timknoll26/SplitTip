import { ArrowLeft, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShiftMatrix } from '@/components/ShiftMatrix'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface ParticipantInputProps {
  onNext: () => void
  onBack: () => void
}

export function ParticipantInput({ onNext, onBack }: ParticipantInputProps) {
  const participants = useTipPoolStore((s) => s.participants)

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle>Team-Schichten</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ziehe für jede Person einen Balken über die Zeitachse. Klick auf den Balken öffnet die
          genaue Zeiteingabe.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
