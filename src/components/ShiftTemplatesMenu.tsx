import { useState } from 'react'
import { Layers, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

/**
 * Save the current team roster (names, areas, times) as a named template and
 * load it back into a later pool with one click — for teams whose staffing
 * barely changes from shift to shift. Loading adds each template member that
 * isn't already in the current pool by name; it never overwrites or removes
 * existing participants.
 */
export function ShiftTemplatesMenu() {
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
          <Layers /> Vorlagen
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-3">
          {templates.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Besetzung laden</Label>
              <div className="flex flex-col gap-1">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-0 flex-1 justify-start"
                      onClick={() => {
                        applyTemplate(t.id)
                        setOpen(false)
                      }}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t.members.length} {t.members.length === 1 ? 'Person' : 'Personen'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Vorlage "${t.name}" löschen`}
                      onClick={() => removeTemplate(t.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Aktuelle Besetzung speichern</Label>
            <div className="flex gap-1.5">
              <Input
                id="template-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="z. B. Standard Wochenende"
                disabled={participants.length === 0}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!draftName.trim() || participants.length === 0}
              >
                Speichern
              </Button>
            </div>
            {participants.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Erst Personen mit Zeiten erfassen, dann als Vorlage speichern.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
