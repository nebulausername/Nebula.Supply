# Nebula Telegram Bot - Blueprint Verifiziertes Hauptmenue

## Zielsetzung
- Premium-Erlebnis direkt nach erfolgreicher Selfie- oder Invite-Pruefung liefern und Mitglieder im Telegram-Kanal halten.
- Compliance-Gate beibehalten, aber den Freischaltmoment emotional staerken und sofortige Aktivierung ermoeglichen.
- Das Hauptmenue als Kommandozentrale fuer Tickets, Wallet, Drops, Support und Entdeckungen positionieren.

## Lifecycle-Zustaende
| Zustand             | Ausloeser                               | Bot-Verhalten                                                         | UX-Ziel                               |
|---------------------|------------------------------------------|-----------------------------------------------------------------------|----------------------------------------|
| `prospect`          | `/start` ohne Invite oder Selfie         | Teaser-Karussell, CTA auf Selfie oder Invite                          | Neugier erzeugen, Verifizierung pushen |
| `verification_pending` | Selfie eingereicht oder Invite in Pruefung | Statuskarte mit Countdown, FAQ, Option zur Korrektur                  | Erwartungsmanagement, Vertrauen        |
| `member_verified`   | Selfie genehmigt oder Invite bestaetigt  | Umschalten auf volles Hauptmenue inkl. Quick Actions                   | Erfolg feiern, erste Aktion triggern   |
| `member_restricted` | Compliance-Verstoss oder manueller Lock  | Hinweis auf Einschrankung, Link zum Support                           | Kommunikation sichern                  |

State-Transitions basieren auf Identity-Webhooks und Invite-Pruefungen laut `docs/mvp-telegram-bot.md` sowie `docs/BOT_TODO.md`.

## Hauptmenue nach Verifizierung
Sobald ein Mitglied `member_verified` erreicht, ersetzt der Bot das Onboarding-Keypad durch folgendes Layout:

### Primaere Navigation (Inline Keyboard)
```
[ Tickets ]   [ Wallet ]
[ Drops ]     [ Support ]
[ Explore ]   [ Profil ]
```
- **Tickets**: Oeffnet die Mini-App Checkout Experience (`Telegram.WebApp.openCheckout`), aktive Bestellungen zuerst.
- **Wallet**: Zeigt Guthaben-Snapshot (Voucher, BTC-Invoices, Cash-Status) + Buttons fuer `Aufladen`, `Historie`, `Auszahlung`.
- **Drops**: Kuratierte Kampagnen, limitierte Drops, Wartelisten. Dringlichkeit (Restzeit, verfuegbare Slots) klar visualisieren.
- **Support**: Deep Link zur Ticket-Zentrale. Bei offenen Tickets Badge anzeigen, z. B. `Support (2)`.
- **Explore**: Content-Hub fuer News, Referral-Links, Produkt-Guides.
- **Profil**: Identitaetsstatus, Invite-Sharing, Sprache, Datenschutz.

### Quick-Action-Leiste
Wird als zweite Button-Reihe eingeblendet, sobald der Bot reichhaltige Antworten sendet:
- `QR-Pass anzeigen`: zeigt den letzten Ticket-QR sofort an.
- `Voucher einloesen`: erfragt Code inline, verifiziert und quittiert Feedback.
- `BTC zahlen`: erzeugt Lightning-Invoice via `payments/btc/invoice` und startet Countdown.

### Kontextkarten im Chat
Nach Freischaltung sendet der Bot gestapelte Karten:
1. **Hero Card**: "Willkommen zurueck, <Vorname>!" + Artwork + CTA.
2. **Progress Snapshot**: Loyalty-Tier, letzte Aktivitaet, offene Aufgaben.
3. **Alerts**: z. B. Selfie-Laeuft-Ab-Hinweis, CashDesk wartet auf Freigabe.
4. **Empfehlungen**: Personalisierte Drops, Broadcasts, Rewards.

### Micro-Interactions
- Typing Indicator max. zwei Sekunden vor personalisierten Antworten.
- Konfetti-GIF beim ersten Unlock.
- Inline-Toasts fuer asynchrone Events ("BTC-Invoice bezahlt - QR wird aufgebaut...").

## Flow-Ueberblick
```
/start -> prospect_home
  |- hat Invite -> validate_invite -> member_verified -> show_main_menu
  |- Selfie eingereicht -> verification_pending -> webhook update
  \- spaeterer webhook -> member_verified -> show_main_menu

member_verified
  |- Tickets -> open_webapp(scene=tickets)
  |- Wallet  -> wallet_scene (Kurzueberblick + Deep Link)
  |- Drops   -> drops_scene (Listing + CTA)
  |- Support -> support_scene (Ticket-Bridge)
  |- Explore -> content_scene (Carousel, Guides)
  \- Profil -> profile_scene (Settings, Invites, Privacy)
```

### Copy-Snippets
- Unlock: "Verifizierung abgeschlossen! Du hast jetzt vollen Zugriff auf Tickets, Wallet und Drops."
- Reminder: "Tipp: `Voucher einloesen` jederzeit senden und Codes direkt pruefen lassen."
- Restriction: "Dein Account ist voruebergehend gesperrt. Oeffne Support, um das zu klaeren."

## Implementierungs-Blueprint
- **Scene Management**: Telegraf Stage mit `prospectScene`, `verificationScene`, `memberScene`. Entry Middleware prueft `ctx.session.memberState`.
- **Session-Modell**: `{ state, memberId, lastMenuAt, unreadTickets, walletSnapshot }` in Redis speichern (Phase 1 Aufgabe in `docs/BOT_TODO.md`).
- **Keyboard Factory**: Inline-Keyboards zentral in `apps/bot/src/ui/menus.ts` erstellen, inklusive Badges und Lokalisierung.
- **WebView-Integration**: `Telegram.WebApp.openUrl` mit `scene`-Parameter (z. B. `/dashboard?scene=tickets`) fuer deeplinks.
- **Badge-Logik**: Button-Label ergaenzen, sobald Counts > 0. Labels unter 20 Zeichen halten.
- **Analytics Hooks**: Events `bot_menu_opened`, `bot_action_clicked`, `bot_quick_action` mit `{ memberId, action, context }` senden.
- **Fehlerhandling**: Fallback-Reply bei Servicefehler, strukturierte Logs inkl. Correlation-ID an ELK.

## Content-Governance
- Ton: Premium, klar, deutsch; englische Begriffe nur fuer Feature- oder Compliance-Texte.
- Emojis sparsam einsetzen (maximal 1 je Button), Body Copy sachlich halten.
- Hero-Artwork quartalsweise rotieren, damit das Menue frisch wirkt.

## Launch-Checkliste
1. Identity-Webhook verdrahten, der `member_verified` setzt.
2. Redis-basierte Session und State-Machine-Helper implementieren.
3. `memberScene`-Antwort mit Hero Card, Quick Actions, Keyboard bauen.
4. Analytics und Badge-Logik fuer Tickets/Support ausliefern.
5. QA fuer Invite-only und Selfie-Pfade inkl. Restricted-Recovery fahren.
6. `docs/mvp-telegram-bot.md` sowie `docs/BOT_TODO.md` auf dieses Blueprint referenzieren.

## Optimierungsfahrplan
- Quick Actions basierend auf letzter Aktivitaet dynamisch ordnen (z. B. `Top Up`, wenn Wallet < 20 CHF).
- Saisonale Menue-Skins als Feature-Flag (Halloween, New Year, Festival).
- Admin-Broadcasts erlauben temporaeren Primaer-Button (z. B. `NYE Tickets Live`).
- Profil-Szene um Device-Linking, Consent-Export und Sprachumschaltung erweitern.

---

Maintainer: Telegram Pod (Kontakt: `@nebula_delivery`)
Letztes Update: 2025-10-04
Naechste Review: Sprint 3 Planning Sync
