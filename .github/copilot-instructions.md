# Copilot Instructions für NebulaCodex

## Architektur-Überblick
- Monorepo mit mehreren Apps (`apps/admin`, `apps/web`), einem Bot (`apps/bot`) und gemeinsam genutzten Paketen (`packages/shared`).
- Frontend-Apps nutzen React, TypeScript und Vite. Gemeinsame UI- und Datenlogik liegt in `packages/shared`.
- Bot-Komponenten sind in `apps/bot/src/clients`, `apps/bot/src/flows` und `apps/bot/src/middlewares` organisiert.
- Konfigurationen und Presets liegen in `configs/`.

## Wichtige Workflows
- **Build & Start:**
  - Apps: `pnpm install` und dann `pnpm dev` im jeweiligen App-Ordner (`apps/admin`, `apps/web`).
  - Bot: `pnpm install` und dann `pnpm start` in `apps/bot`.
- **Tests:**
  - Frontend: `pnpm test` (Vitest) in `apps/admin` und `apps/web`.
  - End-to-End: Playwright-Tests in `apps/web/tests` mit `pnpm test`.
- **Linting:**
  - ESLint-Konfigurationen in jedem App- und Paket-Ordner (`eslint.config.js`).
  - TypeScript-Checks über `tsc` oder `pnpm typecheck`.

## Projekt-Konventionen
- **TypeScript:**
  - Gemeinsame Typen in `packages/shared/src/types.ts`.
  - Strikte Typisierung empfohlen, siehe ESLint-Konfigurationen.
- **Styling:**
  - Tailwind CSS mit eigenen Presets (`configs/tailwind.preset.cjs`).
- **Daten & Komponenten:**
  - UI-Komponenten und Datenmodelle in `packages/shared/src/components` und `packages/shared/src/data`.
  - KPI-Daten und Karten in `apps/admin/src/data/kpis.ts` und `apps/admin/src/components/KpiCard.tsx`.

## Integration & Kommunikation
- **Bot-Integration:**
  - API-Clients in `apps/bot/src/clients` für Identität, Zahlungen, Tickets.
  - Flows in `apps/bot/src/flows` steuern Abläufe.
- **Frontend-Backend:**
  - API-Logik in `apps/web/src/api` und `apps/admin/src/utils`.

## Beispiele für Patterns
- Komponentenstruktur: `apps/admin/src/components/Sidebar.tsx`, `apps/web/src/components/`
- Datenfluss: KPI-Daten aus `apps/admin/src/data/kpis.ts` werden in Komponenten wie `KpiCard.tsx` verwendet.
- Bot-Flows: Siehe `apps/bot/src/flows/onboarding.ts` für Ablaufsteuerung.

## Hinweise für AI Agents
- Nutze die bestehenden Typen und Komponenten aus `packages/shared` für Wiederverwendbarkeit.
- Halte dich an die ESLint- und Tailwind-Konventionen.
- Baue neue Features analog zu bestehenden Mustern in den jeweiligen App-Ordnern.
- Dokumentiere neue Patterns und Workflows direkt in den jeweiligen README.md-Dateien.

---

Feedback zu unklaren oder fehlenden Abschnitten erwünscht!