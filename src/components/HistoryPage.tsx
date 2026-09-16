import { useMemo } from 'react'
import { ArrowLeft, Download, FileText, History as HistoryIcon, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateSplit } from '@/lib/calculator'
import { downloadCsv, downloadPdf } from '@/lib/export'
import { formatDate, formatEUR } from '@/lib/format'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { Language } from '@/lib/i18n/translations'
import { useTipPoolStore } from '@/stores/useTipPoolStore'
import type { HistoryEntry } from '@/types'

interface HistoryPageProps {
  onBack: () => void
  onRestore: (entry: HistoryEntry) => void
}

function formatSavedAt(iso: string, language: Language): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(language === 'en' ? 'en-US' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' })
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
  const { t, language } = useTranslation()
  const result = useMemo(
    () => calculateSplit(entry.totalTip, entry.participants, entry.intensityWindows),
    [entry]
  )

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{entry.poolName || t('common.poolFallback')}</span>
          <span className="text-xs text-muted-foreground">{formatDate(entry.date, language)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.participants.length}{' '}
          {entry.participants.length === 1 ? t('templates.personSingular') : t('templates.personPlural')} ·{' '}
          {t('historyPage.savedAt', { date: formatSavedAt(entry.savedAt, language) })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary">
          {formatEUR(result.totalTip, language)}
        </span>
        <Button variant="outline" size="sm" onClick={onRestore}>
          <RotateCcw /> {t('historyPage.viewButton')}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('historyPage.exportCsvAria')}
          onClick={() => downloadCsv(entry, result, language)}
        >
          <Download />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('historyPage.exportPdfAria')}
          onClick={() => downloadPdf(entry, result, language)}
        >
          <FileText />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('historyPage.removeAria')}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

export function HistoryPage({ onBack, onRestore }: HistoryPageProps) {
  const { t } = useTranslation()
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
          {t('historyPage.eyebrow')}
        </div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HistoryIcon className="size-5 text-primary" />
          {t('historyPage.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('historyPage.description')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:px-8">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('historyPage.emptyState')}</p>
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
            <ArrowLeft /> {t('common.back')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
