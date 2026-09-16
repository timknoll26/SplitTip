import { useState } from 'react'
import { Layers, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

/**
 * Save the current team roster (names, areas, times) as a named template and
 * load it back into a later pool with one click — for teams whose staffing
 * barely changes from shift to shift. Loading adds each template member that
 * isn't already in the current pool by name; it never overwrites or removes
 * existing participants.
 */
export function ShiftTemplatesMenu() {
  const { t } = useTranslation()
  const participants = useTipPoolStore((s) => s.participants)
  const templates = useTipPoolStore((s) => s.templates)
  const saveTemplate = useTipPoolStore((s) => s.saveTemplate)
  const removeTemplate = useTipPoolStore((s) => s.removeTemplate)
  const applyTemplate = useTipPoolStore((s) => s.applyTemplate)

  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState('')

  function handleSave() {
    if (!draftName.trim()) return
    saveTemplate(draftName)
    setDraftName('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers /> {t('templates.triggerButton')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-3">
          {templates.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('templates.loadSectionLabel')}</Label>
              <div className="flex flex-col gap-1">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-0 flex-1 justify-start"
                      onClick={() => {
                        applyTemplate(tpl.id)
                        setOpen(false)
                      }}
                    >
                      <span className="truncate">{tpl.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {tpl.members.length}{' '}
                        {tpl.members.length === 1 ? t('templates.personSingular') : t('templates.personPlural')}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('templates.deleteAria', { name: tpl.name })}
                      onClick={() => removeTemplate(tpl.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">{t('templates.saveSectionLabel')}</Label>
            <div className="flex gap-1.5">
              <Input
                id="template-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={t('templates.saveNamePlaceholder')}
                disabled={participants.length === 0}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!draftName.trim() || participants.length === 0}
              >
                {t('templates.saveButton')}
              </Button>
            </div>
            {participants.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('templates.emptyHint')}</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
