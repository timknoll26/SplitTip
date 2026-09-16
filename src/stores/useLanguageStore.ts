import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/lib/i18n/translations'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'de',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'de' ? 'en' : 'de' }),
    }),
    { name: 'splittip-language' }
  )
)
