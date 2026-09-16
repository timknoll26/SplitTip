import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLanguageStore } from '@/stores/useLanguageStore'

export function LanguageToggle() {
  const { t, language } = useTranslation()
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage)

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      aria-label={t('languageToggle.switchTo')}
      className="font-mono text-xs font-semibold"
    >
      {language.toUpperCase()}
    </Button>
  )
}
