import { overlapMinutes, timeToMinutes, unionMinutes } from '@/lib/time'
import type {
  IntensityWindow,
  Participant,
  ParticipantBreakdown,
  SplitResult,
  WindowBreakdown,
  WindowOverlap,
} from '@/types'

/** Multiplier applied to shift time that falls outside every intensity window. */
const BASE_MULTIPLIER = 1

function toCents(amount: number): number {
  return Math.round(amount * 100)
}

function fromCents(cents: number): number {
  return cents / 100
}

function isValidWindow(w: IntensityWindow): boolean {
  return timeToMinutes(w.endTime) > timeToMinutes(w.startTime)
}

/**
 * Finds pairs of intensity windows whose time ranges overlap. Overlapping
 * windows aren't rejected by the calculator (each still contributes its own
 * overlap x multiplier to any shift that covers it), but the UI should warn
 * about them since the covered minutes get weighted more than once.
 */
export function detectOverlappingWindows(windows: IntensityWindow[]): WindowOverlap[] {
  const valid = windows.filter(isValidWindow)
  const overlaps: WindowOverlap[] = []

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i]
      const b = valid[j]
      const aStart = timeToMinutes(a.startTime)
      const aEnd = timeToMinutes(a.endTime)
      const bStart = timeToMinutes(b.startTime)
      const bEnd = timeToMinutes(b.endTime)
      const overlapStart = Math.max(aStart, bStart)
      const overlapEnd = Math.min(aEnd, bEnd)
      if (overlapEnd > overlapStart) {
        overlaps.push({ a, b, overlapStart, overlapEnd })
      }
    }
  }

  return overlaps
}

/**
 * A shift's clock-time range as one or two same-day segments: a shift that
 * doesn't cross midnight is one [start, end) segment; one that does (e.g.
 * 22:00-02:00) becomes [start, 1440) + [0, end), since intensity windows are
 * always single-day ranges and can't be overlapped directly across the wrap.
 */
function shiftSegments(start: number, end: number): Array<[number, number]> {
  return end < start
    ? [
        [start, 24 * 60],
        [0, end],
      ]
    : [[start, end]]
}

/** Intensity windows that overlap a given shift, each annotated with its overlap length. */
export function getCoveringWindows(
  shift: Pick<Participant, 'startTime' | 'endTime'>,
  windows: IntensityWindow[]
): Array<IntensityWindow & { overlapMinutes: number }> {
  const start = timeToMinutes(shift.startTime)
  const end = timeToMinutes(shift.endTime)
  if (end === start) return []

  const segments = shiftSegments(start, end)
  return windows
    .filter(isValidWindow)
    .map((w) => {
      const wStart = timeToMinutes(w.startTime)
      const wEnd = timeToMinutes(w.endTime)
      const totalOverlap = segments.reduce(
        (sum, [s, e]) => sum + overlapMinutes(s, e, wStart, wEnd),
        0
      )
      return { ...w, overlapMinutes: totalOverlap }
    })
    .filter((w) => w.overlapMinutes > 0)
}

type WeightedShift = Omit<ParticipantBreakdown, 'hoursShare' | 'rawAmount' | 'amount'>

/**
 * Overlaps a single shift against every intensity window: overlapping minutes
 * are weighted by that window's multiplier, and whatever's left of the shift
 * (the union of all windows subtracted out) is weighted 1.0x as normal time.
 * A shift crossing midnight (endTime < startTime, e.g. 22:00-02:00) is split
 * into its two same-day segments first — see shiftSegments. A shift that was
 * simply never set (start === end) comes back zero-weight and flagged,
 * instead of being treated as a one-day-long shift.
 */
function computeShiftWeight(participant: Participant, windows: IntensityWindow[]): WeightedShift {
  const start = timeToMinutes(participant.startTime)
  const end = timeToMinutes(participant.endTime)
  const isUnset = end === start

  if (isUnset) {
    return {
      participantId: participant.id,
      name: participant.name,
      area: participant.area,
      startTime: participant.startTime,
      endTime: participant.endTime,
      shiftMinutes: 0,
      normalMinutes: 0,
      weightedMinutes: 0,
      windowBreakdown: [],
      isUnset: true,
    }
  }

  const segments = shiftSegments(start, end)
  const shiftMinutes = segments.reduce((sum, [s, e]) => sum + (e - s), 0)
  const coveredIntervals: Array<[number, number]> = []
  const byWindow = new Map<string, WindowBreakdown>()

  for (const w of windows) {
    if (!isValidWindow(w)) continue
    const wStart = timeToMinutes(w.startTime)
    const wEnd = timeToMinutes(w.endTime)

    for (const [s, e] of segments) {
      const ov = overlapMinutes(s, e, wStart, wEnd)
      if (ov <= 0) continue

      const existing = byWindow.get(w.id)
      if (existing) {
        existing.minutes += ov
        existing.weightedMinutes += ov * w.multiplier
      } else {
        byWindow.set(w.id, {
          windowId: w.id,
          label: w.label,
          multiplier: w.multiplier,
          minutes: ov,
          weightedMinutes: ov * w.multiplier,
        })
      }
      coveredIntervals.push([Math.max(s, wStart), Math.min(e, wEnd)])
    }
  }

  const windowBreakdown = [...byWindow.values()]
  const weightedFromWindows = windowBreakdown.reduce((sum, wb) => sum + wb.weightedMinutes, 0)
  const normalMinutes = shiftMinutes - unionMinutes(coveredIntervals)
  const weightedMinutes = weightedFromWindows + normalMinutes * BASE_MULTIPLIER

  return {
    participantId: participant.id,
    name: participant.name,
    area: participant.area,
    startTime: participant.startTime,
    endTime: participant.endTime,
    shiftMinutes,
    normalMinutes,
    weightedMinutes,
    windowBreakdown,
    isUnset: false,
  }
}

/**
 * Splits a tip pool across participants proportionally to their intensity-
 * weighted shift minutes. Uses the largest-remainder method so payouts
 * always sum to exactly totalTip (to the cent), regardless of how unevenly
 * the proportional shares round.
 */
export function calculateSplit(
  totalTip: number,
  participants: Participant[],
  intensityWindows: IntensityWindow[]
): SplitResult {
  const totalCents = toCents(totalTip)
  const shifts = participants.map((p) => computeShiftWeight(p, intensityWindows))
  const totalWeightedMinutes = shifts.reduce((sum, s) => sum + s.weightedMinutes, 0)

  if (totalWeightedMinutes <= 0) {
    return {
      totalTip,
      totalWeightedMinutes,
      payouts: shifts.map((s) => ({ ...s, hoursShare: 0, rawAmount: 0, amount: 0 })),
      roundingAdjustmentCents: 0,
    }
  }

  const raw = shifts.map((s) => {
    const hoursShare = s.weightedMinutes / totalWeightedMinutes
    const rawCents = (totalCents * s.weightedMinutes) / totalWeightedMinutes
    return { shift: s, hoursShare, rawCents, flooredCents: Math.floor(rawCents) }
  })

  const flooredSum = raw.reduce((sum, r) => sum + r.flooredCents, 0)
  let remainderCents = totalCents - flooredSum

  const byRemainderDesc = [...raw].sort(
    (a, b) => b.rawCents - b.flooredCents - (a.rawCents - a.flooredCents)
  )

  const centsById = new Map(raw.map((r) => [r.shift.participantId, r.flooredCents]))
  for (const r of byRemainderDesc) {
    if (remainderCents <= 0) break
    centsById.set(r.shift.participantId, (centsById.get(r.shift.participantId) ?? 0) + 1)
    remainderCents -= 1
  }

  const payouts: ParticipantBreakdown[] = raw.map((r) => ({
    ...r.shift,
    hoursShare: r.hoursShare,
    rawAmount: fromCents(r.rawCents),
    amount: fromCents(centsById.get(r.shift.participantId) ?? 0),
  }))

  return {
    totalTip,
    totalWeightedMinutes,
    payouts,
    roundingAdjustmentCents: totalCents - flooredSum,
  }
}
