import { translate, type Language } from '@/lib/i18n/translations'
import type { SplitResult, TipPool } from '@/types'

export function formatEUR(amount: number, language: Language = 'de'): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatPercent(share: number, language: Language = 'de'): string {
  const value = (share * 100).toFixed(1)
  return language === 'en' ? `${value}%` : `${value} %`
}

/** "YYYY-MM-DD" -> "DD.MM.YYYY" (de) or "Sep 16, 2026" (en). */
export function formatDate(iso: string, language: Language = 'de'): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  if (language === 'en') {
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return `${d}.${m}.${y}`
}

export function buildWhatsAppText(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult,
  language: Language = 'de'
): string {
  const title = pool.poolName || translate(language, 'common.poolFallback')
  const dateSuffix = pool.date ? ` (${formatDate(pool.date, language)})` : ''

  const lines = [
    `💰 SplitTip – ${title}${dateSuffix}`,
    `${translate(language, 'whatsapp.total')}: ${formatEUR(result.totalTip, language)}`,
    '',
    ...result.payouts.map(
      (p) =>
        `👤 ${p.name || translate(language, 'common.unnamed')}: ${p.startTime}–${p.endTime} → ${formatEUR(p.amount, language)}`
    ),
    '',
    translate(language, 'whatsapp.footer'),
  ]

  return lines.join('\n')
}
