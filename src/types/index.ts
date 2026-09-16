export interface IntensityWindow {
  id: string
  label: string
  /** "HH:MM" */
  startTime: string
  /** "HH:MM" */
  endTime: string
  /** e.g. 1.3 for a 30% boosted weighting */
  multiplier: number
}

export interface Participant {
  id: string
  name: string
  /** "HH:MM" */
  startTime: string
  /** "HH:MM". Earlier than startTime means the shift crosses midnight (e.g. 22:00-02:00), not an error. */
  endTime: string
  /** Optional Bereich/Gruppe, e.g. "Küche", "Service", "Bar". Free text, purely organizational — doesn't affect the split. */
  area?: string
}

export interface TipPool {
  poolName: string
  /** ISO date "YYYY-MM-DD" */
  date: string
  totalTip: number
  intensityWindows: IntensityWindow[]
  participants: Participant[]
}

export interface WindowBreakdown {
  windowId: string
  label: string
  multiplier: number
  minutes: number
  weightedMinutes: number
}

export interface ParticipantBreakdown {
  participantId: string
  name: string
  area?: string
  startTime: string
  endTime: string
  /** Raw clock-time length of the shift */
  shiftMinutes: number
  /** Minutes of the shift not covered by any intensity window (weighted 1.0x) */
  normalMinutes: number
  /** Sum of (overlap minutes x multiplier) across all covering windows, plus normalMinutes */
  weightedMinutes: number
  windowBreakdown: WindowBreakdown[]
  /** true when startTime === endTime — a shift that was never actually set, not an overnight shift (those are supported and weighted normally) */
  isUnset: boolean
  /** Share of totalWeightedMinutes, 0-1 */
  hoursShare: number
  /** Exact (unrounded) payout */
  rawAmount: number
  /** Payout rounded to cents, adjusted so the sum matches totalTip exactly */
  amount: number
}

export interface SplitResult {
  totalTip: number
  totalWeightedMinutes: number
  payouts: ParticipantBreakdown[]
  /** Cents moved from raw rounding onto specific payouts to make the sum exact */
  roundingAdjustmentCents: number
}

export interface HistoryEntry {
  id: string
  poolName: string
  /** ISO date "YYYY-MM-DD" */
  date: string
  /** ISO datetime, when this entry was last saved */
  savedAt: string
  totalTip: number
  intensityWindows: IntensityWindow[]
  participants: Participant[]
}

export interface ShiftTemplateMember {
  name: string
  area?: string
  /** "HH:MM" */
  startTime: string
  /** "HH:MM" */
  endTime: string
}

export interface ShiftTemplate {
  id: string
  name: string
  /** ISO datetime, when this template was last saved */
  createdAt: string
  members: ShiftTemplateMember[]
}

export interface WindowOverlap {
  a: IntensityWindow
  b: IntensityWindow
  overlapStart: number
  overlapEnd: number
}
