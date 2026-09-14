import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IntensityWindow, Participant } from '@/types'

interface TipPoolState {
  poolName: string
  date: string
  totalTip: number
  intensityWindows: IntensityWindow[]
  participants: Participant[]

  setPoolName: (name: string) => void
  setDate: (date: string) => void
  setTotalTip: (amount: number) => void

  addIntensityWindow: (window: Omit<IntensityWindow, 'id'>) => void
  updateIntensityWindow: (id: string, patch: Partial<Omit<IntensityWindow, 'id'>>) => void
  removeIntensityWindow: (id: string) => void

  addParticipant: (participant: Omit<Participant, 'id'>) => void
  updateParticipant: (id: string, patch: Partial<Omit<Participant, 'id'>>) => void
  removeParticipant: (id: string) => void

  reset: () => void
}

function createId(): string {
  return crypto.randomUUID()
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
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

      setPoolName: (name) => set({ poolName: name }),
      setDate: (date) => set({ date }),
      setTotalTip: (amount) => set({ totalTip: Math.max(0, amount) }),

      addIntensityWindow: (window) =>
        set((state) => ({
          intensityWindows: [...state.intensityWindows, { ...window, id: createId() }],
        })),

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
        })),

      updateParticipant: (id, patch) =>
        set((state) => ({
          participants: state.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        })),

      reset: () => set({ ...emptyState, date: todayISO() }),
    }),
    { name: 'splittip-storage' }
  )
)
