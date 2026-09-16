import { describe, expect, it } from 'vitest'
import { calculateSplit, detectOverlappingWindows, getCoveringWindows } from '@/lib/calculator'
import type { IntensityWindow, Participant } from '@/types'

function window(overrides: Partial<IntensityWindow>): IntensityWindow {
  return { id: 'w1', label: 'Fenster', startTime: '00:00', endTime: '00:00', multiplier: 1, ...overrides }
}

function participant(overrides: Partial<Participant>): Participant {
  return { id: 'p1', name: 'Person', startTime: '00:00', endTime: '00:00', ...overrides }
}

describe('calculateSplit', () => {
  it('weights a shift fully inside one intensity window at that window’s multiplier', () => {
    const windows = [window({ id: 'rush', label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 })]
    const p = participant({ id: 'p1', name: 'Anna', startTime: '18:30', endTime: '20:30' })

    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    expect(payout.shiftMinutes).toBe(120)
    expect(payout.normalMinutes).toBe(0)
    expect(payout.windowBreakdown).toEqual([
      { windowId: 'rush', label: 'Stoßzeit', multiplier: 1.3, minutes: 120, weightedMinutes: 156 },
    ])
    expect(payout.weightedMinutes).toBeCloseTo(156)
    expect(payout.amount).toBeCloseTo(100)
  })

  it('splits a shift across multiple partially-overlapping windows plus normal time', () => {
    const windows = [
      window({ id: 'calm', label: 'Ruhig', startTime: '14:00', endTime: '17:00', multiplier: 0.8 }),
      window({ id: 'rush', label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 }),
    ]
    const p = participant({ id: 'p1', name: 'Ben', startTime: '16:00', endTime: '19:00' })

    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    expect(payout.shiftMinutes).toBe(180)
    // 16:00-17:00 in "Ruhig" (60 x 0.8 = 48), 17:00-18:00 normal (60 x 1.0 = 60), 18:00-19:00 in "Stoßzeit" (60 x 1.3 = 78)
    expect(payout.normalMinutes).toBe(60)
    expect(payout.windowBreakdown).toHaveLength(2)
    expect(payout.weightedMinutes).toBeCloseTo(48 + 60 + 78)
  })

  it('passes the participant’s area through to the payout untouched', () => {
    const p = participant({ id: 'p1', name: 'Anna', area: 'Küche', startTime: '18:00', endTime: '20:00' })
    const result = calculateSplit(100, [p], [])
    expect(result.payouts[0].area).toBe('Küche')

    const unset = participant({ id: 'p2', name: 'Ben', area: 'Bar' })
    const unsetResult = calculateSplit(100, [unset], [])
    expect(unsetResult.payouts[0].area).toBe('Bar')
  })

  it('weights a shift entirely outside all windows at 1.0x', () => {
    const windows = [window({ id: 'rush', label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 })]
    const p = participant({ id: 'p1', name: 'Cara', startTime: '10:00', endTime: '14:00' })

    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    expect(payout.windowBreakdown).toEqual([])
    expect(payout.normalMinutes).toBe(240)
    expect(payout.weightedMinutes).toBeCloseTo(240)
  })

  it('flags overlapping windows and still computes a defined (if double-weighted) result', () => {
    const windows = [
      window({ id: 'a', label: 'A', startTime: '17:00', endTime: '19:00', multiplier: 1.2 }),
      window({ id: 'b', label: 'B', startTime: '18:00', endTime: '20:00', multiplier: 1.3 }),
    ]

    const overlaps = detectOverlappingWindows(windows)
    expect(overlaps).toHaveLength(1)
    expect(overlaps[0].overlapStart).toBe(18 * 60)
    expect(overlaps[0].overlapEnd).toBe(19 * 60)

    const p = participant({ id: 'p1', name: 'Dana', startTime: '17:00', endTime: '20:00' })
    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    // 17-19 in A (120 x 1.2 = 144) + 18-20 in B (120 x 1.3 = 156); the 18-19 overlap is
    // intentionally double-weighted here, which is exactly why the UI surfaces a warning.
    expect(payout.weightedMinutes).toBeCloseTo(144 + 156)
    expect(payout.normalMinutes).toBe(0)
  })

  it('weights a shift crossing midnight by splitting it into a before- and after-midnight segment', () => {
    const windows = [
      window({ id: 'evening', label: 'Abend', startTime: '21:00', endTime: '24:00', multiplier: 1.4 }),
      window({ id: 'morning', label: 'Morgen', startTime: '00:00', endTime: '01:30', multiplier: 1.6 }),
    ]
    const p = participant({ id: 'p1', name: 'Eve', startTime: '22:00', endTime: '01:00' })

    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    // 22:00-24:00 in "Abend" (120 x 1.4 = 168), 00:00-01:00 in "Morgen" (60 x 1.6 = 96)
    expect(payout.isUnset).toBe(false)
    expect(payout.shiftMinutes).toBe(180)
    expect(payout.normalMinutes).toBe(0)
    expect(payout.windowBreakdown).toHaveLength(2)
    expect(payout.weightedMinutes).toBeCloseTo(168 + 96)
  })

  it('merges a single window’s contribution when it overlaps both segments of a wrapping shift', () => {
    // Spans almost the whole day (00:30-22:30), so it catches both the
    // pre-midnight and post-midnight piece of the shift below.
    const windows = [window({ id: 'huge', label: 'Ganztags', startTime: '00:30', endTime: '22:30', multiplier: 1.1 })]
    const p = participant({ id: 'p1', name: 'Finn', startTime: '22:00', endTime: '01:00' })

    const result = calculateSplit(100, [p], windows)
    const payout = result.payouts[0]

    // 22:00-22:30 (30 min) + 00:30-01:00 (30 min) = 60 min covered by the same window
    expect(payout.windowBreakdown).toEqual([
      { windowId: 'huge', label: 'Ganztags', multiplier: 1.1, minutes: 60, weightedMinutes: 66 },
    ])
    expect(payout.normalMinutes).toBe(120)
    expect(payout.weightedMinutes).toBeCloseTo(66 + 120)
  })

  it('still treats a same-value start/end shift as unset, not a 24h wrap', () => {
    const windows = [window({ id: 'rush', label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 })]
    const unset = participant({ id: 'p1', name: 'Eve', startTime: '10:00', endTime: '10:00' })
    const normal = participant({ id: 'p2', name: 'Finn', startTime: '18:00', endTime: '20:00' })

    expect(() => calculateSplit(100, [unset, normal], windows)).not.toThrow()

    const result = calculateSplit(100, [unset, normal], windows)
    const evePayout = result.payouts.find((p) => p.participantId === 'p1')!
    const finnPayout = result.payouts.find((p) => p.participantId === 'p2')!

    expect(evePayout.isUnset).toBe(true)
    expect(evePayout.weightedMinutes).toBe(0)
    expect(evePayout.amount).toBe(0)
    expect(finnPayout.amount).toBeCloseTo(100)
  })

  it('rounds payouts to the cent using largest-remainder so the sum matches totalTip exactly', () => {
    const windows: IntensityWindow[] = []
    const participants = [
      participant({ id: 'p1', name: 'A', startTime: '10:00', endTime: '11:00' }),
      participant({ id: 'p2', name: 'B', startTime: '10:00', endTime: '11:00' }),
      participant({ id: 'p3', name: 'C', startTime: '10:00', endTime: '11:00' }),
    ]

    const result = calculateSplit(10, participants, windows)
    const sum = result.payouts.reduce((s, p) => s + p.amount, 0)

    expect(Math.round(sum * 100)).toBe(1000)
    for (const payout of result.payouts) {
      expect(payout.amount).toBeGreaterThanOrEqual(3.33)
      expect(payout.amount).toBeLessThanOrEqual(3.34)
    }
  })

  it('returns an all-zero result without dividing by zero when there are no valid shifts', () => {
    const windows = [window({ id: 'rush', startTime: '18:00', endTime: '21:00', multiplier: 1.3 })]
    const participants = [participant({ id: 'p1', name: 'Only invalid', startTime: '10:00', endTime: '10:00' })]

    const result = calculateSplit(50, participants, windows)

    expect(result.totalWeightedMinutes).toBe(0)
    expect(result.payouts[0].amount).toBe(0)
    expect(result.roundingAdjustmentCents).toBe(0)
  })
})

describe('detectOverlappingWindows', () => {
  it('returns no overlaps for disjoint windows and ignores zero-length windows', () => {
    const windows = [
      window({ id: 'a', startTime: '11:00', endTime: '14:00' }),
      window({ id: 'b', startTime: '18:00', endTime: '21:00' }),
      window({ id: 'zero', startTime: '15:00', endTime: '15:00' }),
    ]

    expect(detectOverlappingWindows(windows)).toEqual([])
  })
})

describe('getCoveringWindows', () => {
  it('lists only the windows that overlap the given shift, with their overlap length', () => {
    const windows = [
      window({ id: 'calm', label: 'Ruhig', startTime: '14:00', endTime: '17:00', multiplier: 0.8 }),
      window({ id: 'rush', label: 'Stoßzeit', startTime: '18:00', endTime: '21:00', multiplier: 1.3 }),
    ]

    const covering = getCoveringWindows({ startTime: '16:00', endTime: '19:00' }, windows)

    expect(covering.map((w) => w.id)).toEqual(['calm', 'rush'])
    expect(covering.find((w) => w.id === 'calm')?.overlapMinutes).toBe(60)
    expect(covering.find((w) => w.id === 'rush')?.overlapMinutes).toBe(60)
  })

  it('sums overlap across both segments of a shift crossing midnight', () => {
    const windows = [window({ id: 'rush', startTime: '21:00', endTime: '24:00', multiplier: 1.3 })]
    const covering = getCoveringWindows({ startTime: '20:00', endTime: '00:30' }, windows)
    // 21:00-24:00 covers 180 min of the pre-midnight part; the 00:00-00:30
    // post-midnight part falls outside this particular window.
    expect(covering).toEqual([{ ...windows[0], overlapMinutes: 180 }])
  })

  it('returns an empty list for a genuinely unset (start === end) shift', () => {
    const windows = [window({ id: 'rush', startTime: '18:00', endTime: '21:00', multiplier: 1.3 })]
    expect(getCoveringWindows({ startTime: '10:00', endTime: '10:00' }, windows)).toEqual([])
  })
})
