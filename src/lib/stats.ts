import { calculateSplit } from '@/lib/calculator'
import type { HistoryEntry } from '@/types'

export interface PersonHistoryShift {
  poolId: string
  poolName: string
  /** ISO date "YYYY-MM-DD" */
  date: string
  weightedMinutes: number
  amount: number
}

export interface PersonStats {
  /** Display name, taken from the first occurrence found. */
  name: string
  totalAmount: number
  totalWeightedMinutes: number
  shifts: PersonHistoryShift[]
}

/**
 * Aggregates payouts per person across all history entries. Names are
 * matched case-insensitively (trimmed) so "Anna" and "anna " land in the
 * same bucket, since names are free text rather than a stable id.
 */
export function computePersonStats(history: HistoryEntry[]): PersonStats[] {
  const byKey = new Map<string, PersonStats>()

  for (const entry of history) {
    const result = calculateSplit(entry.totalTip, entry.participants, entry.intensityWindows)
    for (const payout of result.payouts) {
      if (payout.isUnset) continue
      const name = payout.name.trim() || 'Unbenannt'
      const key = name.toLowerCase()
      const existing = byKey.get(key)
      const shift: PersonHistoryShift = {
        poolId: entry.id,
        poolName: entry.poolName || 'Trinkgeld-Pool',
        date: entry.date,
        weightedMinutes: payout.weightedMinutes,
        amount: payout.amount,
      }
      if (existing) {
        existing.totalAmount += payout.amount
        existing.totalWeightedMinutes += payout.weightedMinutes
        existing.shifts.push(shift)
      } else {
        byKey.set(key, {
          name,
          totalAmount: payout.amount,
          totalWeightedMinutes: payout.weightedMinutes,
          shifts: [shift],
        })
      }
    }
  }

  return [...byKey.values()]
    .map((p) => ({ ...p, shifts: p.shifts.sort((a, b) => b.date.localeCompare(a.date)) }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}
