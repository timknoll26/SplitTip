import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/useTranslation'

const DISMISSED_KEY = 'splittip-storage-notice-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function StorageNotice() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(readDismissed)

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // localStorage unavailable (e.g. private mode) — dismissal just won't persist
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="flex-1">
        {t('storageNotice.before')}{' '}
        <a href="/datenschutz.html" className="underline underline-offset-2 hover:text-foreground">
          {t('storageNotice.linkText')}
        </a>
        .
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDismiss}
        aria-label={t('storageNotice.dismissAria')}
        className="shrink-0"
      >
        <X />
      </Button>
    </div>
  )
}
