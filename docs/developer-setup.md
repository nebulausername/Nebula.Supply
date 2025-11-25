# Nebula Frontend Workspace - Developer Setup

## Prerequisites

- Node.js 20+
- pnpm 10+
- Playwright browsers (`pnpm --filter @nebula/web exec playwright install`)

## Install

```bash
pnpm install
```

## Run Dev Servers

```bash
pnpm dev:web     # WebView / Telegram client UI on http://localhost:5173
pnpm dev:admin   # Admin dashboard on http://localhost:5273
```

## Tests & Quality

```bash
pnpm --filter @nebula/web lint         # ESLint (flat config)
pnpm --filter @nebula/web test         # Vitest unit tests
pnpm --filter @nebula/web typecheck    # TypeScript checks
pnpm --filter @nebula/admin test       # Admin Vitest suite
pnpm --filter @nebula/admin typecheck  # Admin TypeScript checks
pnpm --filter @nebula/web test:e2e     # Playwright smoke (starts Vite automatically)
```

## Storybook

```bash
pnpm --filter @nebula/web storybook   # Component catalogue on http://localhost:6006
```

## Live Data Mocks

- `packages/shared/src/types.ts` – zentrale Domain-Modelle (Kategorien, Produkte, Varianten, Coins, Invites).
- `packages/shared/src/data/*` – Mock Seeds für Shop & Reward Logik.
- `apps/web/src/api/shop.ts` – Fake API + WebSocket Feed für Inventory/Interest.
- `apps/web/src/store/shop.ts` – Zustand Store für Kategorien, Produkte, Warenkorb.
- `apps/web/src/store/drops.ts` – Drop Feed (Progress, Interessenten, Aktivitäten).

Beim Start der WebView (`pnpm dev:web`) werden die Stores automatisch initialisiert (`useShopStore.fetchAll()`, `startMockFeed()` in DropsPage).

## Workspace Layout

- `apps/web` – Telegram WebView (Shop, Drops, CoinShop Intro, Product Modal).
- `apps/admin` – Operations Dashboard (Kategorien, Coin Rewards, Invite/Ticket Panels).
- `packages/shared` – Tokens, Domain Typen, Mock-Daten.
- `configs/` – Base tsconfig, Tailwind Preset, ESLint Flat Config.
- `docs/` – Design & UX Playbook, Developer Setup.

## Visual Regression (optional)

```bash
pnpm --filter @nebula/web test:e2e -- --update-snapshots
```
