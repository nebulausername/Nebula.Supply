# Nebula Design & UX Playbook

## 1. Ziele & Leitbild

Nebula Supply liefert ein nahtloses E-Commerce Erlebnis für Gum-Vape Drops mit starker Community-Bindung. Das Playbook definiert visuelle Sprache, UX-Flows und Admin-Erfahrung, damit alle Touchpoints konsistent, performant und produktionstauglich bleiben.

- Markenerlebnis: futuristisch, clean, vertrauenswürdig. Dunkles UI mit neonartigen Akzenten.
- Kohärenz: WebView, Bot, Admin Dashboard nutzen dieselben Design Tokens und Komponenten.
- Effizienz: schnelle Entscheidungen durch klare Informationshierarchie und Datenvisualisierung.
- Skalierbarkeit: Komponenten und Layouts sind erweiterbar für neue Drops, Rewards und Integrationen.

---

## 2. Brand Identity

### 2.1 Logo
- Primärlogo (siehe Anhang) auf dunklem Hintergrund (#050505 bis #111111).
- Schutzzone: mindestens 0.5x der Galaxie-Höhe um das Logo.
- Varianten: invertierte Version (schwarz auf weiß) für Druck, Favicon als vereinfachter Wirbel ohne Wortmarke.

### 2.2 Farbpalette
- Galaxy Black `#0A0A0A` (Hintergrund)
- Nebula Dark `#111827` (Cards, Panels)
- Ion Mint `#0BF7BC` (Primär-CTA, Highlights)
- Stellar Pink `#FF5EDB` (Status "Limitiert", VIP Badges)
- Lunar Slate `#64748B` (Sekundärtext)
- Star White `#F8FAFC` (Primärtext)
- Warning Amber `#FBBF24` (Timer, Risk)
- Success Emerald `#34D399`
- Error Red `#F87171`

### 2.3 Typografie
- Headline: Space Grotesk (Bold/Medium)
- Body: Inter (Regular/Medium)
- Numerik/Monospace: JetBrains Mono für Timer, IDs
- Zeilendichte: Headlines 1.1 line-height, Body 1.5.

### 2.4 Iconografie & Illustrationen
- Linienbasierte Icons mit 2px Stroke, abgerundete Ecken.
- Nutzung von Heroicons oder Phosphor als Basis, angepasst auf Nebula-Farbakzente.
- Illustrationen minimalistisch (neon outlines, gradient glows).

---

## 3. Design-Prinzipien

1. Clarity First – Jede Ansicht priorisiert Informationen nach Nutzerziel (z.B. Drop Status, Timer, Coins).
2. Progressive Disclosure – Details (Batch-Infos, Historie) erst bei Interaktion zeigen.
3. Edge-to-Edge Mobile – WebView nutzt volle Breite, Buttons und Filterchips fingerfreundlich (44px).
4. Immersive Feedback – Animationen (scale-in, glow) bei Aktionen wie "Gratis sichern".
5. Data Trust – Zahlen und Status stets mit Kontext (Badge + Tooltip, Timestamp).

---

## 4. Layout-System & Grid

- Mobile WebView: 4pt Spacing-Scale (4, 8, 12, 16, 24, 32).
- Breakpoints: `sm` ≤ 480 (Telegram WebView), `md` 768 (Tablet), `lg` ≥ 1024 (Admin Desktop).
- Cards: Border Radius 16px, innere Polsterung 16/20.
- Shadows: `0 16px 32px rgba(11, 247, 188, 0.15)` für Primary Cards, dezenter 8px Shadow für Listen.
- Admin Layout: Sidebar 280px, Content max 1440px, Grid mit 12 Spalten (80px + 24px Gap).

---

## 5. Design Tokens

| Token | Wert | Verwendung |
| --- | --- | --- |
| color.bg.default | #0A0A0A | Haupt-Hintergrund |
| color.bg.surface | #111827 | Panels, Karten |
| color.text.primary | #F8FAFC | Primärtext |
| color.text.secondary | #94A3B8 | Sekundärtext |
| color.accent.primary | #0BF7BC | CTA, Aktive Filter |
| color.accent.secondary | #FF5EDB | VIP, Limit |
| color.status.success | #34D399 | Erfolg |
| color.status.warning | #FBBF24 | Timer, Risiko |
| color.status.error | #F87171 | Fehler |
| radius.lg | 16px | Karten |
| radius.sm | 8px | Chips |
| shadow.card | 0 16px 32px rgba(11, 247, 188, 0.15) | Produktkarten |
| font.heading | Space Grotesk | Headlines |
| font.body | Inter | Texte |

Tokens als zentrale Datei `packages/shared/tokens.json` für Tailwind und Admin-Styles exportieren.

---

## 6. Komponentenbibliothek

### 6.1 Navigation
- Tab-Bar (Shop, Drops, Profil, Warenkorb, VIP): Icons + Label, aktiver Tab mit Ion Mint Glow.
- Filter-Chips: Pill-Buttons mit Zuständen aktiv, hover, disabled.
- Breadcrumbs und Page Tabs für Admin Sektionen.

### 6.2 Aktionen
- Primary Button: Gradient `linear(135deg, #0BF7BC, #61F4F4)`, Hover scale 1.02.
- Secondary Button: Outline in Ion Mint, transparenter Hintergrund.
- Destructive Button: Error Red Hintergrund, weiße Schrift.
- Icon Button: runde 44px Buttons für Bot/Telegram Shortcuts.

### 6.3 Anzeigeelemente
- Drop Card: Badge (Kostenlos/VIP/Limit), Flavor-Tag, Preis, CTA.
- Progress Bar: Neon Glow, Zustände normal, 90% Pulse, 100% locked.
- Coin Counter: Digit-Gruppierung, Icon + Label.
- Timer Pill: Countdown mm:ss, Amber Hintergrund, Monospace.
- Leaderboard Row: Rang Icon, Avatar, Stats, optional Fake-Flag Badge.

### 6.4 Formulare & Eingaben
- Input: Dark Field, Ion Mint Focus Ring, Fehlermeldungen rot.
- Select/Segment Control: Sortierung (Preis, Beliebtheit).
- Stepper: Mengenwahl mit Buttons + Input.
- Toggle: VIP Only, Fake Drops (Admin) mit sanfter 150ms Transition.

### 6.5 Kommunikation
- Toast: Slide-in von unten (Mobile) bzw. oben rechts (Desktop), Farben nach Status.
- Modal/Sheet: Bottom Sheet für Checkout, Fullscreen Modal für Selfie Upload.
- Inline Alert: Info/Warning Banner mit Icon links.

### 6.6 Datenvisualisierung (Admin)
- KPI Cards: Drops live, Umsatz, Coin Burn Rate.
- Area Charts: Preorder Verlauf, Timer.
- Donut Charts: Zahlungsarten.
- Table: Orders, Tickets mit Sticky Header, Quick Filters.

---

## 7. Screen Spezifikationen

### 7.1 WebView – Home/Shop
- Hero-Banner (aktueller Drop, Countdown).
- Kategorie-Chips (Alle, Kostenlos, Limitiert, VIP, Klamotten, Bundles).
- Liste der Drops (Scroll, Snap Points, Sticky Überschrift "Drops").
- CTA Buttons: "Gratis sichern" (Kostenlos), "Preorder" (kostenpflichtig), Disabled wenn locked.

### 7.2 WebView – Drop Detail
- Full-bleed Card mit Flavor Carousel.
- Fortschrittsbalken, Mindestmenge, Straßenpreis, Buttons (Interesse, Ganze Menge).
- Info Tabs: Beschreibung, Sortenliste, Bewertungen (optional).
- Countdown + Reminder CTA (Opt-in für Push).

### 7.3 WebView – Checkout
- Stepper: Menge & Sorten → Zahlungsart → Review.
- Zahlmethoden: BTC (QR + Timer), Voucher (Code + Validierung), Barzahlung (Selfie Upload).
- Bestätigung: Erfolgsscreen, Coins Gutschrift, Share/Invite CTA.

### 7.4 WebView – Profil
- Status Card: Rang, Coins, Invites, Orders.
- VIP-Leiter linear + Tooltip für nächste Stufe.
- Rewards Liste (5€, 10€, 20€) mit Bedingungen.
- Invite-Link Modul, Historie (letzte Bestellungen).

### 7.5 WebView – Leaderboard & Tickets
- Tabs: Invites, Käufer, Coins.
- Live Badge (WebSocket) bei Veränderungen.
- Ticket Formular (Thema Dropdown, Nachricht, optional Screenshot Upload).

### 7.6 Admin Dashboard – Overview
- KPI Row (Umsatz 24h, Offene Tickets, Drops Live, Conversion).
- Trend Chart Preorders, Coin Burn Ratio.
- Activity Feed (Neue Tickets, Zahlung bestätigt, Drop gelocked).

### 7.7 Admin – Drop Management
- Tabelle mit Filter (Status, VIP, Fake Flag).
- Detail Drawer: Bearbeiten von Preisen, Promo Flags, Stock.
- Aktion Buttons: Publish, Lock, Toggle Fake.
- Bulk Aktionen (Mehrere Drops offline nehmen).

### 7.8 Admin – Orders & Payments
- Tabellenansicht mit Status Chips (Pending, Paid, Fulfilled, Chargeback).
- Payment Detail Modal (Method, Tx Hash, Confirmations, Admin Notes).
- Selfie Review Queue (Approve/Reject mit Lightbox).

### 7.9 Admin – Users & Wallets
- Nutzerliste mit Rang, Coins, Invites, Stornozähler.
- Detail-Panel: Timeline (Bestellungen, Coins Earn/Burn Events).
- Aktionen: Ban, Reset Cancels, Grant Coins, Add Invite.

### 7.10 Admin – Tickets & Support
- Kanban (Open, In Progress, Done).
- Ticket Detail: Chatverlauf, Priorität, Tags.
- SLA Timer (Amber wenn Überschreitung droht).

### 7.11 Admin – Analytics & Settings
- Charts für Conversion Funnel, Drop Performance, Payment Split.
- Regel-Editor (Coins Caps, Storno-Fenster) mit Inline-Diff und History.
- Audit Log Table (User, Aktion, Zeitpunkt, IP Hash).

---

## 8. Interaction Guidelines

- Animationsdauer: 150ms (Buttons), 300ms (Modals), 450ms (Page Transitions).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Haptics (mobil): Vibrationsmuster bei Erfolgen/Fehlern.
- Loading States: Skeletons für Karten, Puls für Timer.
- Empty States: Illustrationen + CTA (z.B. keine Drops → Invite Freunde).
- Error States: Inline Feedback + Retry, Logging-ID anzeigen.

---

## 9. UX-Flows

1. Onboarding: Sprache → Nickname → Profil → Bot Welcome + WebView Link.
2. Invite & Zugang: Share Link → Bot Join → Invite Counter Update.
3. Drop Discover → Preorder: Filter → Drop Detail → Menge → Checkout → Bestätigung → Coins Earn.
4. Payment: BTC (QR + Timer + Auto-Refresh), Voucher (Code Validate), Cash (Selfie Upload → Admin Approve).
5. Coin Burn: Profil → Rewards → Staffel wählen → Mindestwert Check → Checkout Rabatt.
6. Notifications: Worker sendet Bot Push (50/90%, Drop endet, Payment bestätigt) → Deep Link.
7. Support Ticket: Profil → Ticket → Thema + Nachricht → Ticket ID → Admin Kanban.
8. Admin Drop Lifecycle: Entwurf → Preview → Publish → Monitor → Lock/Done.
9. Admin Risk Control: Monitor Cancels, Selfie Queue, Toggle Fake Entries.

---

## 10. Accessibility & Usability

- Kontrastverhältnis ≥ 4.5:1.
- Fokus-Indikatoren in Ion Mint + Outline.
- Screenreader Labels für Tabs, Timer (aria-live polite) und Progress.
- Tastaturnavigation vollständig (Tab, Shift+Tab, Enter, Escape).
- Lokalisierung: i18n Strings, numerische Formatierung per Locale.
- Telegram WebView Safe Areas berücksichtigen (Bottom Inset, Statusbar).

---

## 11. Responsives Verhalten

- Mobile: Bottom Nav fixiert, Scroll Snap für Cards.
- Tablet: 2-Spalten Layout im Drop Detail (Gallery + Info).
- Desktop (Admin): Sidebar + Topbar, Content 3 Spalten, Tabellen full height mit Sticky Filterbar.
- Charts passen sich auf min Höhe 320px an, Tooltips mobil-freundlich.

---

## 12. Content Guidelines

- Tonalität: direkt, motivierend, Emojis sparsam.
- Preise mit zwei Dezimalstellen: `0,00 €`.
- Badge Texte kurz: "VIP", "Kostenlos", "Limit".
- Timer: mm:ss, bei >60min → hh:mm.
- Coin Begriffe konsistent: "Coins sichern", "Coins einlösen".

---

## 13. Qualitätskontrolle

- Storybook + Chromatic/Playwright Visual Regression.
- `pnpm -w run test:visual` für UI Snapshots.
- Lighthouse Checks (Performance ≥ 85, Accessibility ≥ 90).
- Axe-Core automatisiert im CI.
- Manual QA Checklist für Checkout, Payment, Coin-Flows.

---

## 14. Implementation Phasen (Design & Frontend)

1. Tokenisierung: Tokens + Tailwind Config, CSS Variables.
2. Core Components: Buttons, Chips, Cards, Progress, Inputs.
3. Navigation & Layout: Tab-Bar, Header, Sheets.
4. Feature Modules: Drops, Profil, Checkout, Tickets.
5. Admin Components: Tables, Charts, Drawers, Analytics Widgets.
6. Visual Regression Setup: Playwright + Storybook.
7. Polish & Motion: Micro-Interactions, Haptics, Accessibility Pass.

---

## 15. Handover & Governance

- Dokumentation in `docs/` (Storybook, Figma-Exports, Tokens).
- Change Requests via Design Review PR mit Screenshots und Accessibility Checkliste.
- Monatliches Design QA Meeting mit Insights aus Support und Analytics.
- Backlog für zukünftige Module: Loyalty Upgrades, Bundles, Marketplace.

## 29) Shop Experience (WebView)

- Kategorien: Sneaker, T-Shirts, Hosen, Shorts, Caps, Uhren, Bundles.
- Produktkarten mit Farb-Swatches, Größenchips, Quick-Add und Live-Interest.
- Produktmodal: Varianten-Auswahl, Preisstaffeln, Lieferzeit, Interessenten-Tabs.
- Echtzeit: Inventory & Interest werden via Mock-WebSocket aktualisiert, visuell animiert.
- Warenkorb Drawer (WIP) nimmt ausgewählte Varianten + Coin-Rabatt auf.

## 30) Coin Shop & Invite System

- Coin Rewards: 50 → 5 €, 100 → 10 €, 200 → 20 € (Mindestumsatz je Staffel).
- Burn Flow: Coins werden im Checkout oder Bundle automatisch abgezogen.
- Invite Status: Rank, freie Invites, Invite-Link via Bot.
- Bot Flows: `/invite`, `/coins`, `/shop <slug>` öffnen WebView mit JWT + Nonce.

## 31) Admin Dashboard Panels

- Shop Kategorien: Übersicht je Kategorie inkl. Produktanzahl.
- Coin Rewards: editierbare Rewards, Anzeige Mindestumsatz.
- Invite Status: aktueller Rang, verfügbare Invites, Invite Code.
- Ticket Backlog: anonymisierte Telegram Handles, Status (open/in_progress/done).
- Activity Feed: Drop Updates + Echtzeit Ereignisse.

## 32) Telegram Bot & MCP Anbindung

- Bot liefert JWT + Nonce an WebView, Auth Provider übernimmt.
- Endpunkte (geplant): `/api/shop/categories`, `/api/shop/products`, `/api/coins/burn`, `/api/invites/status`, `/api/drops/interest`.
- MCP Tools: `fs`, `git`, `shell_guarded`, `http`, `playwright` unterstützen den Autopiloten.
- Ticket System: Bot `/ticket` erstellt anonym, Admin Antwort via Dashboard → Bot DM.
