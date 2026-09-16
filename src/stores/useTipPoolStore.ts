import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IntensityWindow, Participant } from '@/types'

interface TipPoolState {
  poolName: string
  date: string
  totalTip: number
  intensityWindows: IntensityWindow[]
  participants: Participant[]
  /** Mitarbeiter-Stammdaten: Namen, die über Pools hinweg zur Auswahl stehen. Übersteht reset(). */
  employees: string[]

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
      employees: [] as string[],

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
        })),

      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        })),

      removeEmployee: (name) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.toLowerCase() !== name.toLowerCase()),
        })),

      reset: () => set({ ...emptyState, date: todayISO() }),
    }),
    { name: 'splittip-storage' }
  )
)
