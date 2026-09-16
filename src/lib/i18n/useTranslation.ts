import { translate, type TranslationKey } from '@/lib/i18n/translations'
import { useLanguageStore } from '@/stores/useLanguageStore'

/** `t()` re-renders on language change since it reads from the (subscribed) store. */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language)

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    return translate(language, key, vars)
  }

  return { t, language }
}
