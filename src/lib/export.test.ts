import { describe, expect, it } from 'vitest'
import { calculateSplit } from '@/lib/calculator'
import { buildCsv, exportFilename } from '@/lib/export'
import type { Participant } from '@/types'

function participant(overrides: Partial<Participant>): Participant {
  return { id: 'p1', name: 'Person', startTime: '00:00', endTime: '00:00', ...overrides }
}

describe('buildCsv', () => {
  it('renders title, header, one row per payout and a summary row, semicolon-delimited', () => {
    const result = calculateSplit(
      100,
      [participant({ id: 'p1', name: 'Anna', startTime: '18:00', endTime: '22:00' })],
      []
    )

    const csv = buildCsv({ poolName: 'Samstagabend', date: '2026-09-16' }, result)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Samstagabend (16.09.2026)')
    expect(lines[1]).toBe('Name;Kommt;Geht;Gewichtete Zeit (Min.);Anteil (%);Betrag (EUR)')
    expect(lines[2]).toBe('Anna;18:00;22:00;240;100,00;100,00')
    expect(lines[3]).toBe('Summe;;;;;100,00')
  })

  it('quotes fields containing the delimiter and escapes embedded quotes', () => {
    const result = calculateSplit(50, [participant({ name: 'Ann;a "Boss"' })], [])
    const csv = buildCsv({ poolName: 'Test', date: '' }, result)
    expect(csv).toContain('"Ann;a ""Boss"""')
  })

  it('adds a Bereich column only when at least one participant has an area', () => {
    const result = calculateSplit(
      100,
      [participant({ id: 'p1', name: 'Anna', area: 'Service', startTime: '18:00', endTime: '22:00' })],
      []
    )
    const csv = buildCsv({ poolName: 'Test', date: '' }, result)
    const lines = csv.split('\r\n')

    expect(lines[1]).toBe('Name;Bereich;Kommt;Geht;Gewichtete Zeit (Min.);Anteil (%);Betrag (EUR)')
    expect(lines[2]).toBe('Anna;Service;18:00;22:00;240;100,00;100,00')
  })
})

describe('exportFilename', () => {
  it('slugifies the pool name and appends the date and extension', () => {
    expect(exportFilename({ poolName: 'Samstag Abend!', date: '2026-09-16' }, 'csv')).toBe(
      'splittip-samstag-abend-2026-09-16.csv'
    )
  })

  it('falls back to a generic name when the pool has none', () => {
    expect(exportFilename({ poolName: '', date: '' }, 'csv')).toBe(
      'splittip-trinkgeld-pool-ohne-datum.csv'
    )
  })
})
