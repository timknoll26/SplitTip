import { describe, expect, it } from 'vitest'
import { translate, translations } from '@/lib/i18n/translations'

function placeholders(str: string): string[] {
  return [...str.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()
}

describe('translations', () => {
  it('has exactly the same keys in de and en', () => {
    const deKeys = Object.keys(translations.de).sort()
    const enKeys = Object.keys(translations.en).sort()
    expect(enKeys).toEqual(deKeys)
  })

  it('has no empty values in either language', () => {
    for (const [language, dict] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${language}.${key} is empty`).not.toBe('')
      }
    }
  })

  it('uses the same {{placeholder}} tokens in de and en for every key', () => {
    for (const key of Object.keys(translations.de) as Array<keyof typeof translations.de>) {
      expect(placeholders(translations.en[key]), key).toEqual(placeholders(translations.de[key]))
    }
  })
})

describe('translate', () => {
  it('substitutes {{token}} placeholders', () => {
    expect(translate('de', 'stepProgress.stepOf', { current: 2, total: 3 })).toBe('Schritt 2 / 3')
    expect(translate('en', 'stepProgress.stepOf', { current: 2, total: 3 })).toBe('Step 2 of 3')
  })

  it('returns the string unchanged when it has no placeholders', () => {
    expect(translate('de', 'common.back')).toBe('Zurück')
    expect(translate('en', 'common.back')).toBe('Back')
  })
})
