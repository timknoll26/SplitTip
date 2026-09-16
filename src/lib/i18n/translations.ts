export type Language = 'de' | 'en'

/**
 * German is the source of truth for keys — every key declared here must
 * also exist (with an English value) in `en` below, enforced at compile
 * time via `Record<keyof typeof de, string>` and checked at test time via
 * i18n.test.ts (which also checks {{placeholder}} tokens match 1:1).
 */
const de = {
  // Shared across multiple components
  'common.unnamed': 'Unbenannt',
  'common.back': 'Zurück',
  'common.remove': 'Entfernen',
  'common.name': 'Name',
  'common.sum': 'Summe',
  'common.poolFallback': 'Trinkgeld-Pool',
  'common.weighted': 'gewichtet',

  // App.tsx — header
  'app.tagline': 'Faires Trinkgeld-Pooling nach Schichtzeit und Stoßzeiten.',
  'app.statsButton': 'Statistik',
  'app.historyButton': 'Historie',

  // StepProgress.tsx
  'stepProgress.pool': 'Pool',
  'stepProgress.schedule': 'Zeitplan',
  'stepProgress.results': 'Ergebnis',
  'stepProgress.stepOf': 'Schritt {{current}} / {{total}}',

  // StorageNotice.tsx
  'storageNotice.before':
    'SplitTip speichert deine Eingaben nur lokal in deinem Browser — nichts wird an einen Server gesendet. Mehr dazu in der',
  'storageNotice.linkText': 'Datenschutzerklärung',
  'storageNotice.dismissAria': 'Hinweis schließen',

  // ThemeToggle.tsx
  'themeToggle.toLight': 'Zu hellem Design wechseln',
  'themeToggle.toDark': 'Zu dunklem Design wechseln',

  // LanguageToggle.tsx
  'languageToggle.switchTo': 'Auf Englisch wechseln',

  // PoolSetup.tsx
  'poolSetup.eyebrow': 'GRUNDDATEN',
  'poolSetup.title': 'Neuer Trinkgeld-Pool',
  'poolSetup.poolNameLabel': 'Name des Pools',
  'poolSetup.poolNamePlaceholder': 'z. B. Samstagabend',
  'poolSetup.dateLabel': 'Datum',
  'poolSetup.totalTipLabel': 'Gesamttrinkgeld',
  'poolSetup.totalTipPlaceholder': '0,00',
  'poolSetup.continueButton': 'Weiter',

  // ScheduleStep.tsx
  'scheduleStep.eyebrow': 'PLANUNG',
  'scheduleStep.title': 'Zeitplan',
  'scheduleStep.description':
    'Ziehe oben die Stoßzeiten und darunter je Person die Schicht auf die Zeitachse. Klick auf einen Balken öffnet die genaue Zeiteingabe.',
  'scheduleStep.overlapAlertTitle': 'Überschneidende Zeitfenster',
  'scheduleStep.overlapLine':
    '„{{a}}“ und „{{b}}“ überschneiden sich von {{start}}–{{end}} Uhr. Diese Zeit wird doppelt gewichtet.',
  'scheduleStep.calculateButton': 'Berechnen',

  // ShiftMatrix.tsx
  'shiftMatrix.namePlaceholder': 'Name',
  'shiftMatrix.addPersonAria': 'Person hinzufügen',
  'shiftMatrix.emptyState': 'Noch niemand erfasst — unten hinzufügen.',
  'shiftMatrix.hint': 'Name eintragen und Enter drücken, dann Schicht auf der Zeile ziehen.',
  'shiftMatrix.removeSuggestionAria': '{{name}} aus Stammdaten entfernen',

  // ShiftBar.tsx
  'shiftBar.emptyTrackHint': 'Ziehen oder tippen für Schicht',
  'shiftBar.adjustStartAria': 'Start von {{name}} anpassen',
  'shiftBar.adjustEndAria': 'Ende von {{name}} anpassen',
  'shiftBar.areaLabel': 'Bereich',
  'shiftBar.customAreaPlaceholder': 'Eigener Bereich…',
  'shiftBar.comesLabel': 'Kommt',
  'shiftBar.goesLabel': 'Geht',

  // IntensityLane.tsx
  'intensityLane.laneLabel': 'Stoßzeiten',
  'intensityLane.emptyHint': 'Ziehen oder tippen für ein Stoßzeit-Fenster',
  'intensityLane.defaultLabelFallback': 'Stoßzeit',
  'intensityLane.adjustStartAria': 'Start von {{label}} anpassen',
  'intensityLane.adjustEndAria': 'Ende von {{label}} anpassen',
  'intensityLane.labelFieldLabel': 'Bezeichnung',
  'intensityLane.labelPlaceholder': 'z. B. Stoßzeit Abend',
  'intensityLane.fromLabel': 'Von',
  'intensityLane.toLabel': 'Bis',
  'intensityLane.multiplierLabel': 'Multiplikator',

  // ShiftTemplatesMenu.tsx
  'templates.triggerButton': 'Vorlagen',
  'templates.loadSectionLabel': 'Besetzung laden',
  'templates.personSingular': 'Person',
  'templates.personPlural': 'Personen',
  'templates.deleteAria': 'Vorlage "{{name}}" löschen',
  'templates.saveSectionLabel': 'Aktuelle Besetzung speichern',
  'templates.saveNamePlaceholder': 'z. B. Standard Wochenende',
  'templates.saveButton': 'Speichern',
  'templates.emptyHint': 'Erst Personen mit Zeiten erfassen, dann als Vorlage speichern.',

  // SplitSummary.tsx
  'splitSummary.eyebrow': 'AUSZAHLUNG',
  'splitSummary.noValidShiftsTitle': 'Keine gültigen Schichten',
  'splitSummary.noValidShiftsDesc':
    'Es konnte keine Verteilung berechnet werden. Prüfe die Kommt-/Geht-Zeiten deines Teams.',
  'splitSummary.noShiftLong': 'Keine Schichtzeit erfasst — im Zeitplan-Schritt auf der Zeile ziehen.',
  'splitSummary.normalTimeLabel': 'Normalzeit (1.00x)',
  'splitSummary.noShiftShort': 'Keine Schichtzeit erfasst.',
  'splitSummary.copyButton': 'Als WhatsApp-Text kopieren',
  'splitSummary.copiedButton': 'In Zwischenablage kopiert',
  'splitSummary.newPoolButton': 'Neuer Pool',

  // HistoryPage.tsx
  'historyPage.eyebrow': 'HISTORIE',
  'historyPage.title': 'Vergangene Abrechnungen',
  'historyPage.description':
    'Nur lokal in diesem Browser gespeichert — abgeschlossene Pools werden hier automatisch gesammelt, sobald du eine Auszahlung berechnest.',
  'historyPage.emptyState':
    'Noch keine abgeschlossenen Pools. Sobald du eine Auszahlung berechnest, taucht sie hier auf.',
  'historyPage.savedAt': 'Gespeichert am {{date}}',
  'historyPage.viewButton': 'Ansehen',
  'historyPage.exportCsvAria': 'Als CSV exportieren',
  'historyPage.exportPdfAria': 'Als PDF exportieren',
  'historyPage.removeAria': 'Aus Historie entfernen',

  // StatsPage.tsx
  'statsPage.eyebrow': 'STATISTIK',
  'statsPage.title': 'Trinkgeld pro Person',
  'statsPage.description': 'Auswertung über alle Pools in deiner Historie, absteigend nach Gesamtsumme.',
  'statsPage.emptyState':
    'Noch keine Daten. Sobald Pools in der Historie landen, siehst du hier, wer über die Zeit wie viel bekommen hat.',
  'statsPage.poolSingular': 'Pool',
  'statsPage.poolPlural': 'Pools',

  // lib/format.ts — buildWhatsAppText
  'whatsapp.total': 'Gesamt',
  'whatsapp.footer': 'Fair verteilt nach Schichtzeit & Stoßzeiten ⏱️',

  // lib/export.ts — CSV/PDF
  'export.weightedTimeMin': 'Gewichtete Zeit (Min.)',
  'export.sharePercent': 'Anteil (%)',
  'export.amountEur': 'Betrag (EUR)',
  'pdf.weightedShort': 'Gew. Zeit',
  'pdf.share': 'Anteil',
  'pdf.amount': 'Betrag',
  'pdf.createdWith': 'Erstellt mit SplitTip',
}

const en: Record<keyof typeof de, string> = {
  'common.unnamed': 'Unnamed',
  'common.back': 'Back',
  'common.remove': 'Remove',
  'common.name': 'Name',
  'common.sum': 'Total',
  'common.poolFallback': 'Tip pool',
  'common.weighted': 'weighted',

  'app.tagline': 'Fair tip pooling by shift time and rush hours.',
  'app.statsButton': 'Stats',
  'app.historyButton': 'History',

  'stepProgress.pool': 'Pool',
  'stepProgress.schedule': 'Schedule',
  'stepProgress.results': 'Results',
  'stepProgress.stepOf': 'Step {{current}} of {{total}}',

  'storageNotice.before':
    'SplitTip stores your input only locally in your browser — nothing is sent to a server. More details in the',
  'storageNotice.linkText': 'privacy policy (German)',
  'storageNotice.dismissAria': 'Dismiss notice',

  'themeToggle.toLight': 'Switch to light theme',
  'themeToggle.toDark': 'Switch to dark theme',

  'languageToggle.switchTo': 'Switch to German',

  'poolSetup.eyebrow': 'BASICS',
  'poolSetup.title': 'New tip pool',
  'poolSetup.poolNameLabel': 'Pool name',
  'poolSetup.poolNamePlaceholder': 'e.g. Saturday night',
  'poolSetup.dateLabel': 'Date',
  'poolSetup.totalTipLabel': 'Total tip',
  'poolSetup.totalTipPlaceholder': '0.00',
  'poolSetup.continueButton': 'Continue',

  'scheduleStep.eyebrow': 'PLANNING',
  'scheduleStep.title': 'Schedule',
  'scheduleStep.description':
    "Drag out rush-hour windows above, and each person's shift below on the timeline. Click a bar to open exact time entry.",
  'scheduleStep.overlapAlertTitle': 'Overlapping time windows',
  'scheduleStep.overlapLine':
    '"{{a}}" and "{{b}}" overlap from {{start}}–{{end}}. This time is weighted twice.',
  'scheduleStep.calculateButton': 'Calculate',

  'shiftMatrix.namePlaceholder': 'Name',
  'shiftMatrix.addPersonAria': 'Add person',
  'shiftMatrix.emptyState': 'No one added yet — add below.',
  'shiftMatrix.hint': 'Enter a name and press Enter, then drag the shift on the row.',
  'shiftMatrix.removeSuggestionAria': 'Remove {{name}} from saved names',

  'shiftBar.emptyTrackHint': 'Drag or tap for a shift',
  'shiftBar.adjustStartAria': "Adjust {{name}}'s start",
  'shiftBar.adjustEndAria': "Adjust {{name}}'s end",
  'shiftBar.areaLabel': 'Area',
  'shiftBar.customAreaPlaceholder': 'Custom area…',
  'shiftBar.comesLabel': 'Starts',
  'shiftBar.goesLabel': 'Ends',

  'intensityLane.laneLabel': 'Rush hours',
  'intensityLane.emptyHint': 'Drag or tap to add a rush-hour window',
  'intensityLane.defaultLabelFallback': 'Rush hour',
  'intensityLane.adjustStartAria': "Adjust {{label}}'s start",
  'intensityLane.adjustEndAria': "Adjust {{label}}'s end",
  'intensityLane.labelFieldLabel': 'Label',
  'intensityLane.labelPlaceholder': 'e.g. Evening rush',
  'intensityLane.fromLabel': 'From',
  'intensityLane.toLabel': 'To',
  'intensityLane.multiplierLabel': 'Multiplier',

  'templates.triggerButton': 'Templates',
  'templates.loadSectionLabel': 'Load roster',
  'templates.personSingular': 'person',
  'templates.personPlural': 'people',
  'templates.deleteAria': 'Delete template "{{name}}"',
  'templates.saveSectionLabel': 'Save current roster',
  'templates.saveNamePlaceholder': 'e.g. Standard weekend',
  'templates.saveButton': 'Save',
  'templates.emptyHint': 'Add people with times first, then save as a template.',

  'splitSummary.eyebrow': 'PAYOUT',
  'splitSummary.noValidShiftsTitle': 'No valid shifts',
  'splitSummary.noValidShiftsDesc': "No split could be calculated. Check your team's start/end times.",
  'splitSummary.noShiftLong': 'No shift time set — drag on the row in the schedule step.',
  'splitSummary.normalTimeLabel': 'Normal time (1.00x)',
  'splitSummary.noShiftShort': 'No shift time set.',
  'splitSummary.copyButton': 'Copy as WhatsApp text',
  'splitSummary.copiedButton': 'Copied to clipboard',
  'splitSummary.newPoolButton': 'New pool',

  'historyPage.eyebrow': 'HISTORY',
  'historyPage.title': 'Past payouts',
  'historyPage.description':
    "Stored only locally in this browser — finished pools are collected here automatically once you calculate a payout.",
  'historyPage.emptyState': "No finished pools yet. Once you calculate a payout, it'll show up here.",
  'historyPage.savedAt': 'Saved on {{date}}',
  'historyPage.viewButton': 'View',
  'historyPage.exportCsvAria': 'Export as CSV',
  'historyPage.exportPdfAria': 'Export as PDF',
  'historyPage.removeAria': 'Remove from history',

  'statsPage.eyebrow': 'STATS',
  'statsPage.title': 'Tips per person',
  'statsPage.description': "Breakdown across every pool in your history, sorted by total amount.",
  'statsPage.emptyState':
    "No data yet. Once pools land in your history, you'll see who earned what over time here.",
  'statsPage.poolSingular': 'pool',
  'statsPage.poolPlural': 'pools',

  'whatsapp.total': 'Total',
  'whatsapp.footer': 'Split fairly by shift time & rush hours ⏱️',

  'export.weightedTimeMin': 'Weighted time (min)',
  'export.sharePercent': 'Share (%)',
  'export.amountEur': 'Amount (EUR)',
  'pdf.weightedShort': 'Weighted',
  'pdf.share': 'Share',
  'pdf.amount': 'Amount',
  'pdf.createdWith': 'Made with SplitTip',
}

export const translations = { de, en } satisfies Record<Language, Record<string, string>>

export type TranslationKey = keyof typeof de

/** Replaces `{{token}}` placeholders — the only interpolation syntax this app needs. */
export function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let str = translations[language][key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{{${k}}}`, String(v))
  }
  return str
}
