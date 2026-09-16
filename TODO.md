# TODO

Geplante Features, geordnet nach Bereich. Nichts hiervon ist umgesetzt — reine Dokumentation für spätere Iterationen.

## Kern-Features

- [x] Mitarbeiter-Stammdaten speichern und auswählbar machen — jeder eingetragene Name landet automatisch in einer geräteweiten Stammdaten-Liste (übersteht Pool-Reset); beim Eintippen im Zeitplan-Schritt erscheint ein Auswahl-Dropdown mit bereits bekannten Namen (bereits im aktuellen Pool aktive Namen werden ausgeblendet), Klick fügt die Person direkt hinzu; Namen lassen sich per Hover-× aus der Stammdaten-Liste entfernen
- [x] Mehrere Gruppen/Bereiche (Küche, Service, Bar) — Mitarbeiter bekommen optional einen frei wählbaren Bereich (Schnellauswahl-Chips + eigener Text, Vorschläge merken sich über Pools hinweg); als Badge im Zeitplan und Ergebnis sichtbar, dort zusätzlich Subtotals pro Bereich, sowie eigene Spalte im CSV-/PDF-Export. Bewusst keine getrennten Pools/Trinkgeldtöpfe pro Bereich — die Gesamtsumme wird weiterhin gemeinsam nach Schichtzeit verteilt, der Bereich ist rein organisatorisch
- [ ] Schicht-Vorlagen (Standardbesetzung laden)
- [x] Historie vergangener Abrechnungen — jede berechnete Auszahlung wird automatisch (und bei Änderungen aktualisiert) lokal in einer Historie gesammelt; eigene Ansicht über den "Historie"-Button im Header zum Ansehen/Wiederherstellen (lädt den Pool zurück in den Ergebnis-Schritt) und Löschen einzelner Einträge
- [x] Export als PDF — Button "PDF" im Ergebnis-Schritt sowie pro Eintrag in der Historie, per `jspdf` clientseitig erzeugt (Tabelle Name/Kommt/Geht/Gew. Zeit/Anteil/Betrag + Summenzeile, seitenumbruchfähig)
- [x] Export als CSV — Button "Als CSV exportieren" im Ergebnis-Schritt sowie pro Eintrag in der Historie; semikolon-getrennt mit deutschem Zahlenformat (Komma), UTF-8-BOM für Excel-Umlaute
- [x] Mitternachts-Schichten unterstützen (Schicht über 00:00 hinaus) — Rechen-Engine splittet die Schicht intern in zwei Tagesabschnitte, Matrix zeigt sie als zwei verbundene Balken (Abend-/Morgen-Teil), die zusammen verschoben und an den Außenkanten unabhängig verlängert/gekürzt werden können. Bewusst nicht unterstützt: eine Mitternachts-Schicht direkt per Ziehen über den Tagesrand hinaus *neu erstellen* — dafür im Popover (Kommt/Geht) einfach eine Geht-Zeit eintragen, die vor der Kommt-Zeit liegt, z. B. 22:00–02:00.

## UI/UX

- [x] Light/Dark-Mode-Umschalter — Toggle in der Header-Zeile auf allen Seiten (Landing, App, Impressum, Datenschutz), Startet standardmäßig im Dark Mode, Einstellung wird geteilt (localStorage) und gilt seitenübergreifend
- [x] Sichtbare Resize-Griffe an Schicht-/Stoßzeit-Balken (waren rein funktional, aber unsichtbar)

## Business

- [ ] Accounts und Login (Supabase)
- [ ] Team-Zugang: Mitarbeiter sehen eigene Auszahlung
- [ ] Abo-Abwicklung (Stripe)
- [x] Landing Page (Pricing-Seite, FAQ fehlen noch)
- [x] Impressum und Datenschutzerklärung (rechtlich Pflicht) — vollständig, nutzt aktuell timknoll26@gmail.com als Kontakt-E-Mail
- [ ] Eigene Domain + projektbezogene E-Mail-Adresse kaufen, dann in Impressum/Datenschutz die private Gmail-Adresse ersetzen

## Später

- [x] Trinkgeld-Statistik pro Person über Zeit — eigene Ansicht ("Statistik"-Button im Header) wertet die Historie pro Person aus (Namen case-insensitiv zusammengeführt), zeigt Gesamtsumme/gewichtete Zeit über alle Pools sowie aufklappbar die chronologische Aufschlüsselung pro Pool
- [ ] Mehrsprachigkeit

## Code-Qualität (nicht dringend)

- [ ] Code-Optimierung: mehr wiederverwendbarer Code (z. B. ShiftBar und IntensityLane teilen sich aktuell sehr ähnliche Drag-Logik, die dupliziert statt geteilt ist), sowie Trennung von HTML/Struktur und CSS/Styling sauberer durchziehen
