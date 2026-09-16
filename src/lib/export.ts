import { jsPDF } from 'jspdf'
import { translate, type Language } from '@/lib/i18n/translations'
import { formatDate, formatEUR, formatPercent } from '@/lib/format'
import { formatDuration } from '@/lib/time'
import type { SplitResult, TipPool } from '@/types'

/** Wraps a CSV field in quotes (doubling inner quotes) if it contains the delimiter, a quote, or a newline. */
function csvField(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** German uses a comma decimal (matching the ";" delimiter for direct Excel-DE import); English uses a period. */
function csvNumber(n: number, language: Language): string {
  return language === 'en' ? n.toFixed(2) : n.toFixed(2).replace('.', ',')
}

export function buildCsv(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult,
  language: Language = 'de'
): string {
  const hasAreas = result.payouts.some((p) => p.area)
  const title = `${pool.poolName || translate(language, 'common.poolFallback')}${
    pool.date ? ` (${formatDate(pool.date, language)})` : ''
  }`
  const header = [
    translate(language, 'common.name'),
    ...(hasAreas ? [translate(language, 'shiftBar.areaLabel')] : []),
    translate(language, 'shiftBar.comesLabel'),
    translate(language, 'shiftBar.goesLabel'),
    translate(language, 'export.weightedTimeMin'),
    translate(language, 'export.sharePercent'),
    translate(language, 'export.amountEur'),
  ]
  const rows = result.payouts.map((p) =>
    [
      p.name || translate(language, 'common.unnamed'),
      ...(hasAreas ? [p.area ?? ''] : []),
      p.startTime,
      p.endTime,
      String(Math.round(p.weightedMinutes)),
      csvNumber(p.hoursShare * 100, language),
      csvNumber(p.amount, language),
    ].map(csvField)
  )
  const summary = [
    translate(language, 'common.sum'),
    ...(hasAreas ? [''] : []),
    '',
    '',
    '',
    '',
    csvNumber(result.payouts.reduce((s, p) => s + p.amount, 0), language),
  ]

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

export function downloadCsv(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult,
  language: Language = 'de'
): void {
  // UTF-8 BOM so Excel on Windows picks up umlauts in names correctly.
  downloadTextFile(
    exportFilename(pool, 'csv'),
    '﻿' + buildCsv(pool, result, language),
    'text/csv;charset=utf-8'
  )
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

/** Lays out columns left-to-right from PDF_MARGIN_X, computing each one's x from the running total of the widths before it. */
function layoutPdfColumns(specs: Array<Omit<PdfColumn, 'x'>>): PdfColumn[] {
  let x = PDF_MARGIN_X
  return specs.map((spec) => {
    const col = { ...spec, x }
    x += spec.width
    return col
  })
}

function buildPdfColumns(hasAreas: boolean, language: Language): PdfColumn[] {
  return layoutPdfColumns([
    {
      label: translate(language, 'common.name'),
      width: hasAreas ? 38 : 52,
      align: 'left',
      value: (p) => p.name || translate(language, 'common.unnamed'),
    },
    ...(hasAreas
      ? [
          {
            label: translate(language, 'shiftBar.areaLabel'),
            width: 26,
            align: 'left' as const,
            value: (p: SplitResult['payouts'][number]) => p.area ?? '',
          },
        ]
      : []),
    { label: translate(language, 'shiftBar.comesLabel'), width: 18, align: 'left', value: (p) => p.startTime },
    { label: translate(language, 'shiftBar.goesLabel'), width: 18, align: 'left', value: (p) => p.endTime },
    {
      label: translate(language, 'pdf.weightedShort'),
      width: 24,
      align: 'right',
      value: (p) => formatDuration(p.weightedMinutes),
    },
    {
      label: translate(language, 'pdf.share'),
      width: 20,
      align: 'right',
      value: (p) => formatPercent(p.hoursShare, language),
    },
    {
      label: translate(language, 'pdf.amount'),
      width: 30,
      align: 'right',
      value: (p) => (p.isUnset ? '—' : formatEUR(p.amount, language)),
    },
  ])
}

export function buildPdf(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult,
  language: Language = 'de'
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const columns = buildPdfColumns(
    result.payouts.some((p) => p.area),
    language
  )
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0)
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text(pool.poolName || translate(language, 'common.poolFallback'), PDF_MARGIN_X, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  const subtitle = [
    pool.date ? formatDate(pool.date, language) : null,
    `${translate(language, 'whatsapp.total')} ${formatEUR(result.totalTip, language)}`,
  ]
    .filter(Boolean)
    .join('   ·   ')
  doc.text(subtitle, PDF_MARGIN_X, y)
  y += 9

  function drawTableHeader() {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(90)
    for (const col of columns) {
      doc.text(col.label, col.align === 'right' ? col.x + col.width : col.x, y, { align: col.align })
    }
    y += 2
    doc.setDrawColor(200)
    doc.line(PDF_MARGIN_X, y, PDF_MARGIN_X + tableWidth, y)
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
    for (const col of columns) {
      doc.text(col.value(p), col.align === 'right' ? col.x + col.width : col.x, y, { align: col.align })
    }
    y += PDF_ROW_HEIGHT
  }

  doc.setDrawColor(200)
  doc.line(PDF_MARGIN_X, y - PDF_ROW_HEIGHT + 3, PDF_MARGIN_X + tableWidth, y - PDF_ROW_HEIGHT + 3)
  y += 1
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(20)
  doc.text(translate(language, 'common.sum'), PDF_MARGIN_X, y)
  const total = result.payouts.reduce((sum, p) => sum + p.amount, 0)
  const amountCol = columns[columns.length - 1]
  doc.text(formatEUR(total, language), amountCol.x + amountCol.width, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(translate(language, 'pdf.createdWith'), PDF_MARGIN_X, 290)

  return doc
}

export function downloadPdf(
  pool: Pick<TipPool, 'poolName' | 'date'>,
  result: SplitResult,
  language: Language = 'de'
): void {
  buildPdf(pool, result, language).save(exportFilename(pool, 'pdf'))
}
