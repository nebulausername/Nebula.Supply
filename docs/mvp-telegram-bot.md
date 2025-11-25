# Nebula Telegram MVP - Bot, Selfie Onboarding, Ticket Checkout

## 1. Scope & Success
- Deliver a production-ready Telegram MVP that unlocks the ticketing web experience strictly inside Telegram Mini Apps (TMA).
- Supported payments: Crypto Voucher, BTC (Lightning + on-chain fallback), and Cash with selfie gate at point-of-sale.
- Mandatory selfie verification for non-invited users upfront and for invited users before first cash payment.
- Ticket purchase via WebView with dynamic availability, QR issuance, and admin visibility.
- Foundational observability and compliance (consent logging, audit trails, basic AML checks).

## 2. System Architecture
- **Bot Gateway (`apps/bot`)**: Telegraf/NestJS combo, handles commands, inline keyboards, TMA links, state machine. Stores session pointers in Redis.
- **API Gateway (`apps/api`)**: GraphQL or REST facade that the bot + WebView consume. Delegates to domain microservices. Auth via signed Telegram init data + service tokens.
- **Identity Service (`services/identity`)**: Selfie pipeline (vendor API wrapper, e.g. Sumsub-like) + status store. Exposes REST hooks for webhook callbacks, maintains verification history, issues JWT claims.
- **Ticket Service (`services/tickets`)**: Inventory, tiers, orders, QR generation (PNG + PassKit stub). Works with shared Postgres schema; exposes reservation + checkout endpoints.
- **Payment Service (`services/payments`)**: Abstraction over Crypto Voucher API, Lightning node/on-chain watcher, and CashDesk confirmations. Emits events for ledger + orders.
- **WebView App (`apps/webview`)**: React + Telegram Mini App SDK; modules for Dashboard, Ticket Catalog, Checkout, Wallet. Auth bootstrap via `Telegram.WebApp.initData`.
- **Shared Infrastructure**: Redis (sessions + short-lived caches), Postgres (primary DB), Object storage (selfie media, QR codes). Observability via OpenTelemetry, logs streamed to ELK.
- **Event Bus**: Redis Streams or Kafka. Used for asynchronous flows (selfie verification, payment confirmations, ticket fulfillment).

## 3. Data & Contracts
- **Invite**: `{ id, code, type (standard|vip), expiresAt, invitedUserId?, usedAt }`
- **Member**: `{ id, telegramId, selfieStatus (pending|approved|rejected), inviteId?, firstCashCheckAt?, createdAt }`
- **SelfieVerification**: `{ id, memberId, status, vendorRef, captureType (onboarding|cash), createdAt, reviewedBy? }`
- **TicketProduct**: `{ id, name, description, price, currency, inventory, startAt, endAt, metadata }`
- **Order**: `{ id, memberId, status, total, paymentMethod, paymentRef?, createdAt, updatedAt }`
- **PaymentLedgerEntry**: `{ id, orderId, method, amountFiat, assetAmount, assetType (voucher|btc|cash), ref, txHash?, voucherId?, cashierId?, confirmedAt }`

### API Snapshots
- `POST /bot/session/start` -> returns state, invite status, selfie requirement.
- `POST /identity/selfie/request` -> creates capture session; returns upload URL + guidelines.
- `POST /payments/voucher/redeem` / `POST /payments/btc/invoice` / `POST /payments/cash/confirm`.
- `POST /tickets/checkout` -> reserves inventory, ties to payment, emits `order.confirmed`.
- `GET /tickets/catalog` -> categories & availability for WebView.

## 4. Key Flows
1. **Onboarding without Invite**
   1. User starts bot -> sees teaser, CTA to selfie verify.
   2. Bot calls Identity Service to create session, sends WebView for capture.
   3. Vendor webhook triggers `selfie.approved` -> member unlocked, sees Dashboard WebView.
2. **Invited Member paying Cash**
   1. Invite recognized (bot matches token) -> skip selfie.
   2. At first cash checkout, staff triggers Bot prompt -> user completes selfie.
   3. CashDesk confirms payment; Payment Service updates ledger + order.
3. **Ticket Checkout in WebView**
   1. WebView fetches catalog, user selects tickets.
   2. Checkout screen chooses payment method (voucher/btc/cash) with contextual instructions.
   3. Payment service confirms -> Order fulfilled -> QR generated + shown in Bot & WebView.
4. **BTC Payment**
   1. WebView requests invoice, displays QR/invoice string + countdown.
   2. Lightning webhook on payment -> Payment Service marks confirmed -> triggers order issue.
5. **Crypto Voucher**
   1. User inputs voucher code -> Payment Service validates via API.
   2. Success updates order + ledger; failure returns error messaging.

## 5. Implementation Roadmap (MVP)

### Sprint 0 - Foundations
- Create repos/modules: `apps/bot`, `apps/webview`, `services/identity`, `services/payments`, `services/tickets`.
- Set up shared configs (env, secrets, Docker compose, CI stub).
- Implement Postgres schema migrations + Redis bootstrap.

### Sprint 1 - Bot Skeleton & Invite Flow
- Scaffold Telegraf bot with scene manager, connect webhook/poller.
- Implement invite validation + waitlist responses.
- Build Telegram Mini App launcher command + signed init token issuance.

### Sprint 2 - Selfie Onboarding
- Integrate Identity vendor sandbox, build `POST /identity/selfie/request` + webhook handler.
- Bot/WebView UI for selfie capture with retry messaging.
- Persist verification status; block other flows until approved.

### Sprint 3 - Ticket Service & Catalog WebView
- Model ticket products/orders in Postgres; seed sample data.
- WebView screens: Dashboard, Ticket Catalog, Order detail with QR placeholder.
- API endpoints for catalog, reservations, order status.

### Sprint 4 - Payments Integration
- Crypto Voucher redeem flow with success/fail states.
- BTC Lightning invoice issuance + webhook; on-chain watcher minimal viable (1-conf).
- CashDesk endpoint + staff confirmation UI (temporary internal panel).
- Connect payment confirmations to order fulfillment + QR generation.

### Sprint 5 - QA & Launch Hardening
- Automated tests (unit/integration) for bot scenes, payment flows, identity callbacks.
- Monitoring dashboards, alert setup, incident playbooks documentation.
- Security review, privacy policy + consent screens, pilot rollout.

## 6. Open Questions / Next Decisions
- Select selfie vendor (Sumsub/Onfido/Facetec?) and confirm pricing + SDK availability.
- Choose BTC infrastructure (self-managed node vs. provider like OpenNode/BTCPay).
- Define precise TMA UI toolkit (Vanilla, GramJS, design tokens alignment with Nebula brand).
- Clarify cash handling hardware (QR scanners, staff devices) for MVP vs. later.
- Determine legal thresholds for BTC/crypto volumes to trigger enhanced KYC.

## 7. Immediate Next Steps
1. Approve architecture + scope.
2. Kick off vendor evaluations for identity & BTC.
3. Start Sprint 0 tasks: repo scaffolding, infra IaC, secrets management.
4. Deliver detailed UX in Figma for bot copy, selfie WebView, ticket checkout.
## 8. Extended Execution Roadmap

### Phase 0 - Foundations (Week 0-1)
- Encoding und Repo-Hygiene abschliessen (Bot-Ausgaben, Docs, Configs)
- Gemeinsame Environment-Templates und Setup-Guides harmonisieren
- Incident- und Troubleshooting-Playbooks fuer Bot Start und Webhooks dokumentieren

### Phase 1 - Core Integrations (Week 1-3)
- Redis-gestuetzte Sessions produktiv schalten, TTL und Fallback testen
- Support-Tickets persistent machen und ueber apps/api bedienen
- Deployment-Playbooks fuer Polling/Webhook finalisieren (CI/CD, Secrets)
- Feature-Flags ueber zentrale Config-as-Code pflegen

### Phase 2 - Identity & Payments (Week 3-5)
- Selfie-Vendor anbinden inkl. Webhooks, Status-Mapping und Retry-Logik
- BTC Lightning, On-Chain und Voucher Flows Ende-zu-Ende durchtesten
- CashDesk Flow mit manueller Bestaetigung und Journalisierung liefern

### Phase 3 - Experience & Admin (Week 5-7)
- Telegram Mini App UX (Catalog, Wallet, Drops) verfeinern
- Personalisierte Broadcasts, Loyalty-Mechaniken und Deep Links ausrollen
- Admin-Dashboard um Live-Statistiken, Overrides und Alerting erweitern

### Phase 4 - Operations & Growth (Week 7+)
- Automatisiertes Support Center (Assist, SLA Routing) etablieren
- Growth-Experimente via Referral-Tracking, CRM Hooks, Targeted Campaigns starten
- SLOs, Alerting, Audit-Trails und Compliance-Dokumentation finalisieren

## 9. Cross-Cutting Workstreams
- Architecture & Code: Flows modularisieren, Domain-Typen schaerfen, Contract-Tests mit apps/api etablieren
- QA & Tooling: Playwright-E2E fuer Bot/WebView, Lasttests fuer Payments, GitHub Actions Matrix (lint/unit/smoke)
- Security & Compliance: Secrets-Management (Vault), Bot-Token Least-Privilege, Consent-Logs fuer DSGVO
- Data & Analytics: Event-Naming-Standards, Mixpanel/ELK Dashboards, Alerting auf Payment-Abbrueche

## 10. Delivery Operating Model
- Weekly Delivery Sync mit KPI-Review (Selfie Conversion, Payment Success, Ticket SLA)
- Zweiwoechige Steering-Sessions fuer Priorisierung und Vendor-Status
- Incident-Postmortems innerhalb von 48h mit Action Item Tracking
- Gemeinsame Roadmap im Produkt-Kanban sichtbar halten (Phase-Lanes, Owners, Deadlines)
