import { describe, expect, it } from 'vitest'
import { computePersonStats } from '@/lib/stats'
import type { HistoryEntry, Participant } from '@/types'

function participant(overrides: Partial<Participant>): Participant {
  return { id: 'p1', name: 'Person', startTime: '00:00', endTime: '00:00', ...overrides }
}

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: 'e1',
    poolName: 'Pool',
    date: '2026-01-01',
    savedAt: '2026-01-01T20:00:00.000Z',
    totalTip: 100,
    intensityWindows: [],
    participants: [],
    ...overrides,
  }
}

describe('computePersonStats', () => {
  it('sums payouts across pools for the same (case-insensitive) name', () => {
    const history = [
      entry({
        id: 'e1',
        date: '2026-01-01',
        totalTip: 100,
        participants: [participant({ id: 'p1', name: 'Anna', startTime: '18:00', endTime: '22:00' })],
      }),
      entry({
        id: 'e2',
        date: '2026-01-08',
        totalTip: 50,
        participants: [participant({ id: 'p1', name: 'anna ', startTime: '18:00', endTime: '20:00' })],
      }),
    ]

    const stats = computePersonStats(history)

    expect(stats).toHaveLength(1)
    expect(stats[0].name).toBe('Anna')
    expect(stats[0].totalAmount).toBeCloseTo(150)
    expect(stats[0].shifts.map((s) => s.poolId)).toEqual(['e2', 'e1'])
  })

  it('excludes participants with no shift time set', () => {
    const history = [
      entry({
        participants: [
          participant({ id: 'p1', name: 'Anna', startTime: '18:00', endTime: '22:00' }),
          participant({ id: 'p2', name: 'Ben', startTime: '09:00', endTime: '09:00' }),
        ],
      }),
    ]

    const stats = computePersonStats(history)

    expect(stats.map((s) => s.name)).toEqual(['Anna'])
  })

  it('ranks people by total amount, highest first', () => {
    const history = [
      entry({
        totalTip: 100,
        participants: [
          participant({ id: 'p1', name: 'Anna', startTime: '18:00', endTime: '19:00' }),
          participant({ id: 'p2', name: 'Ben', startTime: '18:00', endTime: '22:00' }),
        ],
      }),
    ]

    const stats = computePersonStats(history)

    expect(stats.map((s) => s.name)).toEqual(['Ben', 'Anna'])
  })
})
