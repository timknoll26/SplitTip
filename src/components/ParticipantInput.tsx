import { useState } from 'react'
import { ArrowLeft, Calculator, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ParticipantRow } from '@/components/ParticipantRow'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

interface ParticipantInputProps {
  onNext: () => void
  onBack: () => void
}

export function ParticipantInput({ onNext, onBack }: ParticipantInputProps) {
  const participants = useTipPoolStore((s) => s.participants)
  const windows = useTipPoolStore((s) => s.intensityWindows)
  const addParticipant = useTipPoolStore((s) => s.addParticipant)

  const [draftName, setDraftName] = useState('')
  const [draftStart, setDraftStart] = useState('17:00')
  const [draftEnd, setDraftEnd] = useState('22:00')

  function handleAdd() {
    if (!draftName.trim()) return
    addParticipant({ name: draftName.trim(), startTime: draftStart, endTime: draftEnd })
    setDraftName('')
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader>
        <CardTitle>Team-Schichten</CardTitle>
        <p className="text-sm text-muted-foreground">
          Trage ein, wer wann gearbeitet hat. Die Badges zeigen, welche Zeitfenster die Schicht
          abdeckt.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} windows={windows} />
          ))}
          {participants.length === 0 && (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Noch niemand erfasst. Füge unten die erste Person hinzu.
            </p>
          )}
        </div>

        <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="participant-name">
              Name
            </label>
            <Input
              id="participant-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="z. B. Mia"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="participant-start">
              Kommt
            </label>
            <Input
              id="participant-start"
              type="time"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="participant-end">
              Geht
            </label>
            <Input
              id="participant-end"
              type="time"
              value={draftEnd}
              onChange={(e) => setDraftEnd(e.target.value)}
              className="w-28"
            />
          </div>
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!draftName.trim()}
            aria-label="Person hinzufügen"
          >
            <UserPlus />
          </Button>
        </div>

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
