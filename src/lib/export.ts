import { jsPDF } from 'jspdf'
import { formatDateDE, formatEUR, formatPercent } from '@/lib/format'
import { formatDuration } from '@/lib/time'
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

interface PdfColumn {
  label: string
  x: number
  width: number
  align: 'left' | 'right'
  value: (p: SplitResult['payouts'][number]) => string
}

const PDF_MARGIN_X = 18
const PDF_PAGE_BOTTOM = 280
const PDF_ROW_HEIGHT = 8
const PDF_COLUMNS: PdfColumn[] = [
  { label: 'Name', x: PDF_MARGIN_X, width: 52, align: 'left', value: (p) => p.name || 'Unbenannt' },
  { label: 'Kommt', x: PDF_MARGIN_X + 52, width: 18, align: 'left', value: (p) => p.startTime },
  { label: 'Geht', x: PDF_MARGIN_X + 70, width: 18, align: 'left', value: (p) => p.endTime },
  {
    label: 'Gew. Zeit',
    x: PDF_MARGIN_X + 88,
    width: 24,
    align: 'right',
    value: (p) => formatDuration(p.weightedMinutes),
  },
  {
    label: 'Anteil',
    x: PDF_MARGIN_X + 112,
    width: 20,
    align: 'right',
    value: (p) => formatPercent(p.hoursShare),
  },
  {
    label: 'Betrag',
    x: PDF_MARGIN_X + 132,
    width: 30,
    align: 'right',
    value: (p) => (p.isUnset ? '—' : formatEUR(p.amount)),
  },
]
const PDF_TABLE_WIDTH = PDF_MARGIN_X + 162 - PDF_MARGIN_X

export function buildPdf(pool: Pick<TipPool, 'poolName' | 'date'>, result: SplitResult): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text(pool.poolName || 'Trinkgeld-Pool', PDF_MARGIN_X, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  const subtitle = [pool.date ? formatDateDE(pool.date) : null, `Gesamt ${formatEUR(result.totalTip)}`]
    .filter(Boolean)
    .join('   ·   ')
  doc.text(subtitle, PDF_MARGIN_X, y)
  y += 9

  function drawTableHeader() {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(90)
    for (const col of PDF_COLUMNS) {
      doc.text(col.label, col.align === 'right' ? col.x + col.width : col.x, y, { align: col.align })
    }
    y += 2
    doc.setDrawColor(200)
    doc.line(PDF_MARGIN_X, y, PDF_MARGIN_X + PDF_TABLE_WIDTH, y)
    y += 6
  }

  function setRowStyle() {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30)
  }

  drawTableHeader()
  setRowStyle()

  for (const p of result.payouts) {
    if (y > PDF_PAGE_BOTTOM) {
      doc.addPage()
      y = 20
      drawTableHeader()
      setRowStyle()
    }
    for (const col of PDF_COLUMNS) {
      doc.text(col.value(p), col.align === 'right' ? col.x + col.width : col.x, y, { align: col.align })
    }
    y += PDF_ROW_HEIGHT
  }

  doc.setDrawColor(200)
  doc.line(PDF_MARGIN_X, y - PDF_ROW_HEIGHT + 3, PDF_MARGIN_X + PDF_TABLE_WIDTH, y - PDF_ROW_HEIGHT + 3)
  y += 1
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(20)
  doc.text('Summe', PDF_MARGIN_X, y)
  const total = result.payouts.reduce((sum, p) => sum + p.amount, 0)
  const amountCol = PDF_COLUMNS[PDF_COLUMNS.length - 1]
  doc.text(formatEUR(total), amountCol.x + amountCol.width, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Erstellt mit SplitTip', PDF_MARGIN_X, 290)

  return doc
}

export function downloadPdf(pool: Pick<TipPool, 'poolName' | 'date'>, result: SplitResult): void {
  buildPdf(pool, result).save(exportFilename(pool, 'pdf'))
}
