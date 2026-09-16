import { formatDateDE } from '@/lib/format'
import type { SplitResult, TipPool } from '@/types'

/** Wraps a CSV field in quotes (doubling inner quotes) if it contains the delimiter, a quote, or a newline. */
function csvField(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** German-locale decimal (comma) — matches the ";" delimiter below for direct Excel-DE import. */
function csvNumber(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

export function buildCsv(pool: Pick<TipPool, 'poolName' | 'date'>, result: SplitResult): string {
  const title = `${pool.poolName || 'Trinkgeld-Pool'}${pool.date ? ` (${formatDateDE(pool.date)})` : ''}`
  const header = ['Name', 'Kommt', 'Geht', 'Gewichtete Zeit (Min.)', 'Anteil (%)', 'Betrag (EUR)']
  const rows = result.payouts.map((p) =>
    [
      p.name || 'Unbenannt',
      p.startTime,
      p.endTime,
      String(Math.round(p.weightedMinutes)),
      csvNumber(p.hoursShare * 100),
      csvNumber(p.amount),
    ].map(csvField)
  )
  const summary = ['Summe', '', '', '', '', csvNumber(result.payouts.reduce((s, p) => s + p.amount, 0))]

  return [csvField(title), header.join(';'), ...rows.map((r) => r.join(';')), summary.join(';')].join(
    '\r\n'
  )
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'trinkgeld-pool'
  )
}

export function exportFilename(pool: Pick<TipPool, 'poolName' | 'date'>, extension: string): string {
  return `splittip-${slugify(pool.poolName || 'trinkgeld-pool')}-${pool.date || 'ohne-datum'}.${extension}`
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(pool: Pick<TipPool, 'poolName' | 'date'>, result: SplitResult): void {
  // UTF-8 BOM so Excel on Windows picks up umlauts in names correctly.
  downloadTextFile(exportFilename(pool, 'csv'), '﻿' + buildCsv(pool, result), 'text/csv;charset=utf-8')
}
