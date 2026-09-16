import { useMemo } from 'react'
import { ArrowLeft, Download, History as HistoryIcon, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateSplit } from '@/lib/calculator'
import { downloadCsv } from '@/lib/export'
import { formatDateDE, formatEUR } from '@/lib/format'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { HistoryEntry } from '@/types'

interface HistoryPageProps {
  onBack: () => void
  onRestore: (entry: HistoryEntry) => void
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

function HistoryRow({
  entry,
  onRestore,
  onRemove,
}: {
  entry: HistoryEntry
  onRestore: () => void
  onRemove: () => void
}) {
  const result = useMemo(
    () => calculateSplit(entry.totalTip, entry.participants, entry.intensityWindows),
    [entry]
  )

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{entry.poolName || 'Trinkgeld-Pool'}</span>
          <span className="text-xs text-muted-foreground">{formatDateDE(entry.date)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.participants.length}{' '}
          {entry.participants.length === 1 ? 'Person' : 'Personen'} · Gespeichert am{' '}
          {formatSavedAt(entry.savedAt)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary">
          {formatEUR(result.totalTip)}
        </span>
        <Button variant="outline" size="sm" onClick={onRestore}>
          <RotateCcw /> Ansehen
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Als CSV exportieren"
          onClick={() => downloadCsv(entry, result)}
        >
          <Download />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Aus Historie entfernen"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

export function HistoryPage({ onBack, onRestore }: HistoryPageProps) {
  const history = useTipPoolStore((s) => s.history)
  const removeHistoryEntry = useTipPoolStore((s) => s.removeHistoryEntry)

  const sorted = useMemo(
    () => [...history].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [history]
  )

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="sm:px-8">
        <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          HISTORIE
        </div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HistoryIcon className="size-5 text-primary" />
          Vergangene Abrechnungen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Nur lokal in diesem Browser gespeichert — abgeschlossene Pools werden hier automatisch
          gesammelt, sobald du eine Auszahlung berechnest.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Noch keine abgeschlossenen Pools. Sobald du eine Auszahlung berechnest, taucht sie hier
            auf.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                onRestore={() => onRestore(entry)}
                onRemove={() => removeHistoryEntry(entry.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft /> Zurück
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
