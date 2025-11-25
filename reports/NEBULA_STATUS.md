# NEBULA_STATUS

## Architecture Overview
- Workspace splits into `apps/web`, `apps/admin`, `packages/shared`, and shared configs/docs as documented in the setup guide (docs/developer-setup.md:49).
- Web client `@nebula/web` is a Vite + React app depending on `@nebula/shared` for tokens and mock data (apps/web/package.json:1, apps/web/package.json:20).
- Admin dashboard `@nebula/admin` mirrors the stack and also consumes the shared workspace package (apps/admin/package.json:1, apps/admin/package.json:16).
- Shared package exports domain models, tokens, mock products, rewards, and invite state for both front-ends (packages/shared/src/index.ts:1, packages/shared/src/data/products.ts:3, packages/shared/src/data/coinRewards.ts:3, packages/shared/src/data/invite.ts:3).
- Backend, Drizzle schemas, and Telegraf bot are only described in documentation; no server/runtime code exists in the repository yet (agent.md:475, agent.md:492, agent.md:522).

## Tooling, Scripts & Ports
- Root scripts orchestrate workspace builds, linting, tests, Storybook, and env-specific dev servers (package.json:6, package.json:7, package.json:9, package.json:12, package.json:13).
- App-level scripts follow the same pattern for Vite dev/build/test/typecheck flows (apps/web/package.json:6, apps/admin/package.json:6).
- Vite dev servers expose the web app on 5173 and admin on 5273; preview ports are 4173/4273 (apps/web/vite.config.ts:15, apps/admin/vite.config.ts:15).
- Developer guide reiterates install/test/storybook flows and expected ports for local workstations (docs/developer-setup.md:18, docs/developer-setup.md:24, docs/developer-setup.md:33).

## Data & Mock Services
- Mock API module returns seeded categories, products, reward tiers, and invite status with artificial latency plus an interval-based shop feed (apps/web/src/api/shop.ts:14, apps/web/src/api/shop.ts:19, apps/web/src/api/shop.ts:24, apps/web/src/api/shop.ts:44).
- Shop store bootstraps state via the mock API, tracks selections/cart, and subscribes to feed updates for inventory/interest (apps/web/src/store/shop.ts:51, apps/web/src/store/shop.ts:66, apps/web/src/store/shop.ts:86, apps/web/src/store/shop.ts:129).
- Drops store preloads drop data, synthesises interest/activity lists, and keeps a global interval for mock progress (apps/web/src/store/drops.ts:69, apps/web/src/store/drops.ts:86, apps/web/src/store/drops.ts:114).
- Client auth is session-storage based, hydrating from query params or a demo user in dev (apps/web/src/api/auth.ts:5, apps/web/src/api/auth.ts:26, apps/web/src/store/auth.ts:13).

## Feature Diagnostics
- **Product images**: Product cards render plain `<img>` tags without `loading`, `srcset`, or error handling, so LCP assets are uncontrolled; a dedicated `ProductImage` with fallback/lazy exists but is unused (apps/web/src/components/shop/ProductCard.tsx:62, apps/web/src/components/media/ProductImage.tsx:10, apps/web/src/components/media/ProductImage.tsx:18).
- Product data references `/images/products/*.png`, yet no matching assets ship in `apps/web/public`, leading to broken product imagery in the grid (packages/shared/src/data/products.ts:41).
- **Drops**: Filters and highlights are declarative in `DropsPage`, and selecting a card opens the modal; interest counts increment via the drops store while the "Preorder" CTA is still a stub (apps/web/src/pages/DropsPage.tsx:16, apps/web/src/pages/DropsPage.tsx:149, apps/web/src/components/DropModal.tsx:52, apps/web/src/components/DropModal.tsx:120).
- Drops store also feeds activity/interest lists and exposes `startMockFeed`, which accelerates interest/progress for demo purposes (apps/web/src/store/drops.ts:69, apps/web/src/store/drops.ts:114).
- **Coins & invites**: Reward tiers are fixed at 50/100/200 coins with minimum spends 30/50/90 and no earn logic; documentation still expects +5% earn and +100 preorder rewards (packages/shared/src/data/coinRewards.ts:3, agent.md:460, agent.md:531).
- Invite state is seeded as an always-on mock, surfaced in shop header highlights and profile placeholders (packages/shared/src/data/invite.ts:3, apps/web/src/pages/ShopPage.tsx:1, apps/web/src/pages/ProfilePage.tsx:5).
- **Checkout/Payment**: Cart, profile, and support pages are placeholders awaiting backend integration; the product modal only links out to the Telegram bot with no on-page payment provider (apps/web/src/pages/CartPage.tsx:1, apps/web/src/pages/ProfilePage.tsx:5, apps/web/src/components/shop/ProductModal.tsx:166, agent.md:494).

## Testing & Quality
- ESLint flat config pulls React, hooks, and a11y plugins with shared ignores (configs/eslint.config.js:1, configs/eslint.config.js:17, configs/eslint.config.js:29).
- Vitest configs exist for both apps with jsdom environments and shared aliasing (apps/web/vitest.config.ts:1, apps/admin/vitest.config.ts:1).
- Unit tests cover DropCard rendering and the admin dashboard smoke check (apps/web/src/components/DropCard.test.tsx:1, apps/admin/src/App.test.tsx:1).
- Playwright config targets the web view with a Pixel 7 profile and bootstraps Vite on port 5173 for e2e runs (apps/web/playwright.config.ts:3, apps/web/playwright.config.ts:20, apps/web/tests/drops.spec.ts:1).

## Database & Pipeline Status
- Database tables, payment endpoints, and webhook/idempotency strategies remain design-only; there are no Drizzle migrations or Express handlers implemented (agent.md:475, agent.md:492, agent.md:531).
- Current TypeScript build is blocked because `ShopPage.tsx` embeds literal `\n` sequences and control characters, causing compiler failures (apps/web/src/pages/ShopPage.tsx:1).