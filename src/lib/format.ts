import type { SplitResult, TipPool } from '@/types'

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1)} %`
}

export function formatDateDE(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

export function buildWhatsAppText(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult
): string {
  const title = pool.poolName || 'Trinkgeld-Pool'
  const dateSuffix = pool.date ? ` (${formatDateDE(pool.date)})` : ''

  const lines = [
    `💰 SplitTip – ${title}${dateSuffix}`,
    `Gesamt: ${formatEUR(result.totalTip)}`,
    '',
    ...result.payouts.map(
      (p) =>
        `👤 ${p.name || 'Unbenannt'}: ${p.startTime}–${p.endTime} → ${formatEUR(p.amount)}`
    ),
    '',
    'Fair verteilt nach Schichtzeit & Stoßzeiten ⏱️',
  ]

  return lines.join('\n')
}
