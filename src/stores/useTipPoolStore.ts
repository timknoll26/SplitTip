import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryEntry, IntensityWindow, Participant, ShiftTemplate } from '@/types'

interface TipPoolState {
  /** Identifies the pool currently being edited across the setup/schedule/results steps, so it can be upserted into history instead of duplicated. Regenerated on reset(). */
  poolId: string
  poolName: string
  date: string
  totalTip: number
  intensityWindows: IntensityWindow[]
  participants: Participant[]
  /** Mitarbeiter-Stammdaten: Namen, die über Pools hinweg zur Auswahl stehen. Übersteht reset(). */
  employees: string[]
  /** Bereiche/Gruppen (z. B. Küche, Service, Bar), die als Schnellauswahl angeboten werden. Übersteht reset(). */
  areas: string[]
  /** Abgeschlossene Pools, jüngste zuerst. Übersteht reset(). */
  history: HistoryEntry[]
  /** Gespeicherte Standardbesetzungen. Übersteht reset(). */
  templates: ShiftTemplate[]

  setPoolName: (name: string) => void
  setDate: (date: string) => void
  setTotalTip: (amount: number) => void

  /** Returns the new window's id so callers can e.g. auto-open its editor. */
  addIntensityWindow: (window: Omit<IntensityWindow, 'id'>) => string
  updateIntensityWindow: (id: string, patch: Partial<Omit<IntensityWindow, 'id'>>) => void
  removeIntensityWindow: (id: string) => void

  /** Adds the participant to the current pool and, if new, remembers the name as Stammdaten. */
  addParticipant: (participant: Omit<Participant, 'id'>) => void
  updateParticipant: (id: string, patch: Partial<Omit<Participant, 'id'>>) => void
  removeParticipant: (id: string) => void

  /** Removes a name from the Stammdaten list. Does not touch existing participants. */
  removeEmployee: (name: string) => void

  /** Saves (or updates, if already saved) the current pool as a history entry. No-op without participants. */
  saveCurrentToHistory: () => void
  removeHistoryEntry: (id: string) => void
  /** Replaces the current pool with a saved history entry, so it can be viewed or continued. */
  loadFromHistory: (entry: HistoryEntry) => void

  /** Saves the current participants (name, area, times) as a named template. Overwrites a template with the same name. No-op without participants. */
  saveTemplate: (name: string) => void
  removeTemplate: (id: string) => void
  /** Adds the template's members as new participants, skipping any name already present in the current pool. */
  applyTemplate: (id: string) => void

  reset: () => void
}

function createId(): string {
  return crypto.randomUUID()
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function rememberName(employees: string[], name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return employees
  if (employees.some((e) => e.toLowerCase() === trimmed.toLowerCase())) return employees
  return [...employees, trimmed].sort((a, b) => a.localeCompare(b, 'de'))
}

const emptyState = {
  poolName: '',
  totalTip: 0,
  intensityWindows: [] as IntensityWindow[],
  participants: [] as Participant[],
}

export const useTipPoolStore = create<TipPoolState>()(
  persist(
    (set) => ({
      ...emptyState,
      date: todayISO(),
      poolId: createId(),
      employees: [] as string[],
      areas: ['Bar', 'Küche', 'Service'],
      history: [] as HistoryEntry[],
      templates: [] as ShiftTemplate[],

      setPoolName: (name) => set({ poolName: name }),
      setDate: (date) => set({ date }),
      setTotalTip: (amount) => set({ totalTip: Math.max(0, amount) }),

      addIntensityWindow: (window) => {
        const id = createId()
        set((state) => ({
          intensityWindows: [...state.intensityWindows, { ...window, id }],
        }))
        return id
      },

      updateIntensityWindow: (id, patch) =>
        set((state) => ({
          intensityWindows: state.intensityWindows.map((w) =>
            w.id === id ? { ...w, ...patch } : w
          ),
        })),

      removeIntensityWindow: (id) =>
        set((state) => ({
          intensityWindows: state.intensityWindows.filter((w) => w.id !== id),
        })),

      addParticipant: (participant) =>
        set((state) => ({
          participants: [...state.participants, { ...participant, id: createId() }],
          employees: rememberName(state.employees, participant.name),
        })),

      updateParticipant: (id, patch) =>
        set((state) => ({
          participants: state.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          areas: patch.area ? rememberName(state.areas, patch.area) : state.areas,
        })),

      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        })),

      removeEmployee: (name) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.toLowerCase() !== name.toLowerCase()),
        })),

      saveCurrentToHistory: () =>
        set((state) => {
          if (state.participants.length === 0) return state
          const entry: HistoryEntry = {
            id: state.poolId,
            poolName: state.poolName,
            date: state.date,
            savedAt: new Date().toISOString(),
            totalTip: state.totalTip,
            intensityWindows: state.intensityWindows,
            participants: state.participants,
          }
          const existingIndex = state.history.findIndex((h) => h.id === entry.id)
          const history =
            existingIndex >= 0
              ? state.history.map((h, i) => (i === existingIndex ? entry : h))
              : [entry, ...state.history]
          return { history }
        }),

      removeHistoryEntry: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),

      loadFromHistory: (entry) =>
        set({
          poolId: entry.id,
          poolName: entry.poolName,
          date: entry.date,
          totalTip: entry.totalTip,
          intensityWindows: entry.intensityWindows,
          participants: entry.participants,
        }),

      saveTemplate: (name) =>
        set((state) => {
          const trimmed = name.trim()
          if (!trimmed || state.participants.length === 0) return state
          const members = state.participants.map((p) => ({
            name: p.name,
            area: p.area,
            startTime: p.startTime,
            endTime: p.endTime,
          }))
          const existingIndex = state.templates.findIndex(
            (t) => t.name.toLowerCase() === trimmed.toLowerCase()
          )
          const template: ShiftTemplate = {
            id: existingIndex >= 0 ? state.templates[existingIndex].id : createId(),
            name: trimmed,
            createdAt: new Date().toISOString(),
            members,
          }
          const templates =
            existingIndex >= 0
              ? state.templates.map((t, i) => (i === existingIndex ? template : t))
              : [...state.templates, template]
          return { templates }
        }),

      removeTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),

      applyTemplate: (id) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === id)
          if (!template) return state
          const existingNames = new Set(state.participants.map((p) => p.name.trim().toLowerCase()))
          const newParticipants = template.members
            .filter((m) => !existingNames.has(m.name.trim().toLowerCase()))
            .map((m) => ({ ...m, id: createId() }))

          let employees = state.employees
          let areas = state.areas
          for (const m of template.members) {
            employees = rememberName(employees, m.name)
            if (m.area) areas = rememberName(areas, m.area)
          }

          return {
            participants: [...state.participants, ...newParticipants],
            employees,
            areas,
          }
        }),

      reset: () => set({ ...emptyState, date: todayISO(), poolId: createId() }),
    }),
    { name: 'splittip-storage' }
  )
)
