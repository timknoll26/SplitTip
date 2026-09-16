import { calculateSplit } from '@/lib/calculator'
import { formatEUR } from '@/lib/format'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { IntensityWindow, Participant } from '@/types'

interface ShiftMatrixLivePreviewProps {
  totalTip: number
  participants: Participant[]
  intensityWindows: IntensityWindow[]
}

/** Compact, always-on totals strip below the matrix — recomputed on every drag frame. */
export function ShiftMatrixLivePreview({
  totalTip,
  participants,
  intensityWindows,
}: ShiftMatrixLivePreviewProps) {
  const { t, language } = useTranslation()
  const result = calculateSplit(totalTip, participants, intensityWindows)

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3.5">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{t('whatsapp.total')}</span>
        <span className="font-mono">{formatEUR(result.totalTip, language)}</span>
      </div>
      {result.payouts.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {result.payouts.map((p) => (
            <div key={p.participantId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{p.name || t('common.unnamed')}</span>
              <span className="font-mono">
                {p.isUnset ? '—' : formatEUR(p.amount, language)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
