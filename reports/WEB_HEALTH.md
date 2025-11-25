# WEB_HEALTH

## Lighthouse & Build State
- Could not produce a Lighthouse run: `pnpm --filter @nebula/web build` fails because `ShopPage.tsx` contains escaped newlines/control characters that TypeScript rejects (apps/web/src/pages/ShopPage.tsx:1).

## LCP & Imagery
- Product grid cards render blocking `<img>` tags without `loading`, `decoding`, or `srcset`, making the first visible product image the likely LCP asset on `/shop` (apps/web/src/components/shop/ProductCard.tsx:62).
- A reusable `ProductImage` wrapper with lazy loading and fallback exists but is never used, so failed requests surface as broken images instead of branded placeholders (apps/web/src/components/media/ProductImage.tsx:10, apps/web/src/components/media/ProductImage.tsx:18).
- Mock catalog data points to `/images/products/*.png`, yet the public folder only contains the Vite favicon, so every product request 404s and the LCP image is missing (packages/shared/src/data/products.ts:41).

## Fonts & CSS
- Global stylesheet imports three Google font families via a blocking `@import`, delaying first paint in constrained WebView contexts (apps/web/src/index.css:1).

## Bundle Metrics
- Bundle size reports are unavailable until the ShopPage encoding issue is fixed and the build can complete (apps/web/src/pages/ShopPage.tsx:1).

## Runtime Hotspots
- Drops view starts a global `startMockFeed` interval every mount without calling `stopMockFeed`, keeping timers running even when the route is inactive (apps/web/src/pages/DropsPage.tsx:100, apps/web/src/store/drops.ts:114).
- Shop state subscribes to the mock feed but never unsubscribes, so repeated bootstraps accumulate listeners and extra update work (apps/web/src/store/shop.ts:66, apps/web/src/api/shop.ts:44).
- Mock API delays (`delay(...)`) add 100–250?ms per resource and could compound once real network calls replace the seeds (apps/web/src/api/shop.ts:12, apps/web/src/api/shop.ts:14, apps/web/src/api/shop.ts:19).
## Production Hardening Plan

### Gate 0 - Build & Asset Reliability (Day 0-2)
- Sanitize `apps/web/src/pages/ShopPage.tsx` to remove escaped control characters; wire a Prettier+ESLint check so CI blocks any non-printable glyphs before merge.
- Restore real product media (ship `apps/web/public/images/products` assets or point `packages/shared/src/data/products.ts` to a CDN) and cover with a Storybook/Visual test to catch regressions.
- Replace raw `<img>` usage in product cards and modals with `ProductImage` so lazy loading, fallbacks, and branded placeholders work across the catalog.
- Swap the blocking Google Fonts `@import` in `apps/web/src/index.css` for preconnect + async `<link>` tags in `apps/web/index.html`, and self-host the critical weights to keep builds reproducible.
- Re-enable `pnpm --filter @nebula/web build` locally and in CI, publishing bundle metrics artifacts so regressions are visible in PRs.

### Gate 1 - Performance & Observability (Week 1)
- Optimize LCP by marking hero and first product imagery with `fetchpriority="high"`, `decoding="async"`, responsive `srcset`, and ensure skeletons render while assets stream.
- Instrument Web Vitals (LCP, INP, CLS) via `web-vitals` and push results to the telemetry pipeline so regressions are caught post-deploy.
- Ship a dedicated bundle analyzer step (e.g. `pnpm analyze:web`) and track gzipped size budgets in `reports/bundle-baselines.json`.
- Configure alerting around 404 media responses and slow mock API calls so broken assets and latency spikes surface immediately.

### Gate 2 - Runtime Stability & Data (Week 2)
- Refactor `startMockFeed`/`subscribe` flows to use scoped abort controllers so intervals/listeners tear down on navigation, and add unit tests covering the cleanup paths.
- Replace artificial delays with environment-driven latency (`process.env.API_DELAY_MS`) and disable them for production builds.
- Transition catalog data to a real API contract (REST or GraphQL), keeping `packages/shared` for type definitions and seed fixtures only.
- Backfill integration tests that cover shop bootstrap, feed updates, and teardown to prevent memory leaks from reappearing.

### Gate 3 - Commerce Readiness (Weeks 3-4)
- Replace the preorder/checkout stubs with real payment orchestration (Stripe/Adyen) and ensure cart, profile, and support routes are feature complete.
- Implement server-side coin earn/burn logic aligned with documented +5% earn and +100 preorder bonus, exposing results through the shared package.
- Introduce feature flags for preorder, checkout, and invite campaigns so risky toggles can be rolled back instantly.
- Conduct accessibility pass (axe + manual) and localize all customer-facing strings to support launch locales.

### Launch Checklist
- CI green on build, lint, type-check, unit, and smoke e2e suites for both `@nebula/web` and `@nebula/admin`.
- Web Vitals: LCP < 2.5s (P75), INP < 200ms, CLS < 0.1 on `/shop` and `/drops` under mobile 4G.
- Error budget policy codified with Sentry dashboards, and on-call runbooks drafted for catalog, checkout, and auth incidents.
- Production assets served from CDN with cache headers; fallback strategy verified offline and under flaky network conditions.
- Rollout plan approved: staged deploy (canary -> 25% -> 100%), smoke checklist, and rollback automation tested.
