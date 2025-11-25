# Nebula Agent - Design, Prompts & Runbook

Ziel: Ein lokaler, VPS-fähiger, sicherer Autopilot-Agent für das Projekt Nebula Supply (Web + API + Worker). Der Agent nutzt MCP (Model Context Protocol) Tools, erkennt Fehler automatisch, behebt sie, testet und deployt mit klaren Prompts, Guard-Rails und wiederholbaren Playbooks.

---

## 1. Vision & Scope

- Was: Full-stack KI-Agent erledigt Aufgaben (Tasks) für Nebula Supply – Code schreiben/ändern, UI verbessern, Bugs fixen, Tests erweitern, Migrations fahren, deployen.
- Wie: LLM + MCP-Tools (Filesystem, Git, HTTP Browser/Playwright, Sqlite/Postgres, Shell mit Guardrails).
- Wo: Zunächst lokal (100% offline testbar), anschließend VPS (Docker Compose + Caddy/Nginx + Let's Encrypt).
- Warum: Geschwindigkeit, Wiederholbarkeit, Sicherheit, Anonymität.
- Nicht-Ziele: Offene Shell ohne Safeguards, heimliche Telemetrie, unkontrollierte Internet-Schreibzugriffe.

---

## 2. Architektur (High-Level)

- ChatGPT Code-Modus steuert den Nebula CLI Agent über MCP.
- MCP-Server stellen Tools bereit (`fs`, `git`, `http`, `playwright`, `sqlite`, `shell_guarded`).
- Der Agent arbeitet im Autofix-Loop: Plan → Patch → Tests → Feedback → Iterate → Commit.
- Services: Web-App, API, Worker, DBCache, Monitoring.

---

## 3. Empfohlene Repository-Struktur

```text
nebula
  apps
    web            # React + Vite oder Next.js
    server         # Express/Fastify + Drizzle ORM
    worker         # BullMQ Queues & Cronjobs
  packages
    shared         # Zod Typen, Drizzle Schema
  mcp
    servers        # MCP Server Wrapper & Configs
  infra
    docker         # compose.yml, Dockerfiles
    caddy          # Caddyfile oder nginx
    scripts        # bootstrap, backup, restore
  tests
    e2e            # Playwright
    api            # Supertest + Vitest
  .env.example
```

---

## 4. Sicherheit & Privacy

- Least Privilege: MCP-Server nur auf erlaubte Pfade; Shell-Kommandos strikt whitelisten (`pnpm`, `git`, `drizzle-kit`, `tsc`, `eslint`, `vitest`, `playwright`).
- Secrets: `.env` lokal, im Repo nur `.env.example`. Auf dem VPS Secrets via Docker secrets oder Caddy-Env-Files. Optional SOPS + age.
- Anonymität: Git-Identity mit noreply, DoH/HTTPS-Proxies, Caddy vor Origin, optional Cloudflare.
- Audit Logs: Anonymisierte Logs ohne PII, Rotations-Policy.

---

## 5. Lokaler Quickstart

Voraussetzungen: Node 20+, pnpm, Docker, Docker Compose, Git, Playwright Dependencies (Chromium).

```bash
# 1) Repo
git clone https://github.com/nebulausername/Nebula.git nebula
cd nebula

# 2) Bootstrap
pnpm i
cp .env.example .env    # Secrets befüllen
pnpm -w run prepare     # Husky etc., optional

# 3) Dev
pnpm --filter @nebula/server dev
pnpm --filter @nebula/web dev

# 4) Tests
pnpm test
pnpm exec playwright install --with-deps
pnpm -w run test:e2e
```

---

## 6. MCP Setup (Client & Server)

Ziel: ChatGPT (Code-Modus) spricht über MCP mit lokalen Tools.

### 6.1 Client-Konfiguration (Beispiel)

Datei `~/.config/mcp/nebula.json`:

```jsonc
{
  "servers": {
    "fs": {
      "command": "node",
      "args": ["mcp/servers/fs.js"],
      "env": { "ALLOW": ".apps,.packages,.tests" }
    },
    "git": {
      "command": "node",
      "args": ["mcp/servers/git.js"],
      "env": { "GIT_SAFE": "1" }
    },
    "http": {
      "command": "node",
      "args": ["mcp/servers/http.js"]
    },
    "playwright": {
      "command": "node",
      "args": ["mcp/servers/playwright.js"]
    },
    "sqlite": {
      "command": "node",
      "args": ["mcp/servers/sqlite.js"],
      "env": { "DB_PATH": "./.local/nebula.sqlite" }
    },
    "shell_guarded": {
      "command": "node",
      "args": ["mcp/servers/shell-guarded.js"],
      "env": { "ALLOW_CMDS": "pnpm,git,drizzle-kit,tsc,eslint,vitest,playwright" }
    }
  }
}
```

### 6.2 Server-Skeletons (Node)

`shell-guarded` Beispiel:

```js
import { createServer } from "@modelcontextprotocol/sdk";
import { spawn } from "node:child_process";

const ALLOW = (process.env.ALLOW_CMDS ?? "").split(",");
const server = await createServer({ name: "shell-guarded" });

server.tool(
  "run",
  {
    description: "Run a whitelisted command",
    inputSchema: {
      type: "object",
      properties: {
        cmd: { type: "string" },
        args: { type: "array", items: { type: "string" } }
      },
      required: ["cmd"]
    }
  },
  async ({ cmd, args = [] }) => {
    if (!ALLOW.includes(cmd)) {
      return { error: `Command not allowed: ${cmd}` };
    }

    return await new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd: process.cwd() });
      let out = "";
      let err = "";

      child.stdout.on("data", (d) => { out += d.toString(); });
      child.stderr.on("data", (d) => { err += d.toString(); });
      child.on("close", (code) => resolve({ code, out, err }));
    });
  }
);

await server.start();
```

Analoge Server für `fs` (read/write mit Allowlist), `git` (status, diff, commit), `http` (GET), `playwright` (open, screenshot, assert), `sqlite` (query/exec).

---

## 7. Autofix Loop (Agent Execution)

Ziel: Task → Plan → Patch → Tests → Feedback → Iteration → Commit/PR.

Pseudocode (`infra/scripts/agent.ts`):

```ts
for (let i = 0; i < MAX_ITERS; i++) {
  const plan = await llm.plan(task, contextFromRepo());
  const patch = await llm.edit(plan, selectFiles());
  await fs.applyPatch(patch);

  const result = await shell.run("pnpm", ["-w", "test:ci"]);
  if (result.code === 0) break;

  const analysis = await llm.errorAnalysis(result.out + result.err);
  task = `${task}\nFIX:\n${analysis.nextSteps}`;
}

await git.commitAndPush(`feat(agent): ${summarize(task)}`);
```

Tests in CI: `tsc --noEmit`, `eslint`, `vitest`, `playwright` (headless), API-Smoketest via Supertest.

---

## 8. Master Prompts (für ChatGPT Code Modus)

### 8.1 System / Initial Context

```
Du bist mein Nebula Supply Build-Agent. Ziele: Code-Qualität, Sicherheit, Anonymität, Reproduzierbarkeit. Nutze MCP Tools (fs, git, http, playwright, sqlite, shell_guarded) strikt gemäß Allowlist.

Vorgehen bei jeder Aufgabe:
1) Kontext verstehen (Repo-Map, package.json Scripts, env-Bedarf).
2) Einen Plan mit minimal-invasiven Änderungen und Backout-Strategie erstellen.
3) In kleinen Patches arbeiten, jeweils Tests und Lint laufen lassen.
4) `pnpm -w test:ci` ausführen. Bei Fehlern Logs analysieren, Patch verbessern, wiederholen.
5) Commit-Message nach Conventional Commits erzeugen.
6) Änderungen in `CHANGELOG.md` und `agent-report.md` dokumentieren.

Guard-Rails: Keine Secrets ausgeben; nur erlaubte Kommandos; keine PII in Logs.
```

### 8.2 Task-Prompt Vorlage

```
TASK: Konkrete Aufgabe
CONSTRAINTS: Architektur einhalten, nur betroffene Module anpassen, 100% Tests grün.
DELIVERABLES: Git-Diff, Testergebnisse, kurze Doku.
RUN: Führe nacheinander `tsc`, `eslint`, `vitest`, `playwright`, `supertest` via `pnpm -w test:ci` aus.
```

### 8.3 Bugfix Prompt

```
BUG: Fehlerbeschreibung + Logs
Erzeuge minimalen Patch mit Repro-Test. Nutze Playwright für E2E, wenn UI betroffen.
```

### 8.4 UI-Polish Prompt

```
Verbessere UI laut Design-Screenshots (Spacing, Typografie, Responsiveness). Nutze Tailwind und shadcn/ui. Keine Breaking Changes in der API. Erzeuge visuelle Snapshots mit Playwright.
```

### 8.5 Datenmodell/Migration Prompt

```
Ändere Drizzle Schema + Migration. Bewahre Backward Compatibility. Schreibe Datenmigrations-Script und Rollback. Aktualisiere Zod-Schemas, API-DTOs und Tests.
```

### 8.6 Commit-Message Prompt

```
Erzeuge eine prägnante Conventional-Commit-Message + Body + BREAKING CHANGE (falls nötig) basierend auf dem Diff.
```

---

## 9. Git-Workflow

- Branches: `main` (stabil), `dev` (Integration), `feat/<name>` (Feature), `fix/<name>` (Hotfix).
- Regeln: PRs gegen `dev`, CI muss grün sein, danach Merge, Release-Tag, Merge nach `main`.
- Hooks: `pre-commit` (lint-staged), `pre-push` (test:quick), CI Gates (`pnpm -w test:ci`, Build, E2E).

---

## 10. Tests & QA

- Unit: Vitest + Testing Library.
- API: Supertest gegen Express.
- E2E: Playwright (headless) inkl. Snapshots, Axe-Accessibility-Check.
- Smoke: `api/health` muss 200 liefern.

---

## 11. Deployment (VPS)

Basis: Ubuntu 24.04 LTS, Docker, Compose, Caddy (oder Nginx) + Let's Encrypt.

### 11.1 Docker Compose (minimal)

`infra/docker/compose.yml`:

```yaml
services:
  web:
    build: ...
    command: pnpm -w run start:web
    env_file: ../..../.env
    depends_on: [api]
    ports: ["127.0.0.1:5173:5173"]

  api:
    build: ...
    command: pnpm -w run start:server
    env_file: ../..../.env
    ports: ["127.0.0.1:5000:5000"]

  caddy:
    image: caddy:latest
    volumes:
      - ../caddy/Caddyfile:/etc/caddy/Caddyfile
    ports:
      - "80:80"
      - "443:443"
    depends_on: [web, api]
```

### 11.2 Caddyfile (TLS + Reverse Proxy)

`infra/caddy/Caddyfile`:

```
example.com {
  encode gzip

  handle_path /api* {
    reverse_proxy 127.0.0.1:5000
  }

  handle {
    reverse_proxy 127.0.0.1:5173
  }

  log {
    output file /var/log/caddy/nebula.log
    format json
  }
}
```

### 11.3 CI (GitHub Actions, minimal)

`.github/workflows/ci.yml`:

```yaml
name: ci

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm i
      - run: pnpm -w run test:ci
```

---

## 12. Ops Runbooks

- Backup DB: `pg_dump $DATABASE_URL > backups/$(date +%F).sql` (oder `sqlite3 db.sqlite .dump`).
- Restore: `psql < dump.sql`.
- Secrets rotieren: neue `.env`, `docker compose up -d --force-recreate`.
- Zero-Downtime: Blue/Green via `docker compose -p nebula_a ...` + `nebula_b`, Caddy-Switch.

---

## 13. Observability

- Logs: pino-http + JSON; Rotation via `logrotate`.
- Metrics: Prometheus Endpoint `/metrics`, optional Grafana.
- Tracing: OpenTelemetry SDK (HTTP Server + Client).

---

## 14. Checklisten

### Day 0 (Lokal)

- [ ] Repo clean, `pnpm i`, `pnpm -w test:ci` grün.
- [ ] MCP-Server laufen, Allowlist verifiziert.
- [ ] Agent-Loop erstellt Patch und Commit lokal.

### Day 1 (VPS)

- [ ] VPS gehärtet (ufw, fail2ban), Docker + Compose installiert.
- [ ] Caddy TLS + Reverse Proxy OK.
- [ ] Health-Checks grün.

### Day 2 (Scale)

- [ ] Worker/Queues bereit.
- [ ] Alerts für Uptime und Error-Rate aktiv.

---

## 15. `.env.example` (Auszug)

```
# Server
PORT=5000
NODE_ENV=production

# DB
DATABASE_URL=postgres://user:pass@host:5432/nebula

# Auth & Secrets
SESSION_SECRET=change-me

# Playwright
HEADLESS=true
```

---

## 16. `package.json` Scripts (Vorschlag)

```jsonc
{
  "scripts": {
    "dev": "pnpm -w --parallel -r run dev",
    "build": "pnpm -w -r run build",
    "start:web": "node apps/web/dist/server.js",
    "start:server": "node apps/server/dist/index.js",
    "test:ci": "tsc -b && eslint . && vitest run --reporter=dot && playwright test",
    "lint": "eslint .",
    "typecheck": "tsc -b",
    "e2e": "playwright test"
  }
}
```

---

## 17. Nächste Schritte (empfohlen)

1. Master-Prompt (8.1) im Code-Chat setzen.
2. MCP-Server starten und via Client verbinden.
3. Task: Autofix-Loop + Agent CLI aufsetzen.
4. Task: CI + Playwright + API Smoke Tests integrieren.
5. Task: Dockerize + Caddy Reverse Proxy.
6. Task: VPS Deploy mit `.env` + Secrets.

Dieses Dokument ist die Single Source of Truth für Agent-Arbeitsweise, Prompts und Ops.

---

## 18. Produkt- & UX-Flows

Onboarding: Sprache (DE/EN) → Nickname → Profil (Rang, Coins, Invites, Bestellungen). Regeln: Max. 1 Storno pro Woche, 30-Minuten-Storno-Fenster, Adresse erst nach Zahlung.

Hauptmenü WebView: Tabs `Home`, `Shop`, `Drops`, `Top`, `Profil` mit Filterleiste (Geschmack, Preis, Menge). Live-Daten via WebSocket.

Drop-Ansicht: Name, Drop-Preis, Straßenpreis, Mindest-Preorder, Fortschritt (Preorders / Mindestmenge + Balken), Sortenliste, Buttons `Interesse`, `Preorder`, `Ganze Menge`.

Preorder-Flow: Verbindliche Warnung (30-Minuten-Storno). Auswahl Menge/Sorten → Bestätigung → Timer startet → nach 30 Min keine Stornierung. Limit: 1 Storno pro Woche und Nutzer.

Erinnerungen: Push bei 50% und 90% Progress; optional Hinweis "Drop endet in 2h".

Zahlung: BTC (QR + Amount + Auto-Watcher), Voucher (Code prüfen), Barzahlung (Selfie + Admin-Freigabe; ohne Einladung Selfie Pflicht).

Nach Zahlung: Adressformular → Profil aktualisiert (Bestellungen, Coins) → Admin erhält Order + Adresse.

Coin-Shop (Rewards, Regeln serverseitig enforced):

- 50 Coins → 5 € Rabatt (Mindestbestellwert 15 €)
- 100 Coins → 10 € Rabatt (Mindestbestellwert 30 €)
- Cap: Max. 20 € Rabatt pro Bestellung (Mindestbestellwert ≥ 30 €)
- Earning: 5% Coins auf Subtotal + fix +100 Coins pro Preorder (intern, nicht prominent).

Leaderboard: Top Inviter (1-5), Top Käufer (1-3), Top Coins (1-5) live via WebSocket. Admin kann Promo-Fake-Einträge togglen (Flag in Admin UI, intern markiert).

Ticket-System: `ticket` → Thema + Nachricht; Admin-Queue mit Status `[Bearbeitet]`, `[Geschlossen]`.

Admin-Panel: `adddrop`, `editdrop <id>`, `removedrop <id>`, `fakedrop`, `faketop`.

---

## 19. Domain-Modell & DB (Drizzle/SQL)

- `User`: `id`, `nickname`, `lang`, `rank`, `invited_by`, `selfie_url`, `bans`, `weekly_cancels_count`, `created_at`.
- `Wallet`: `user_id` FK, `coins` INT DEFAULT 0, `lifetime_coins` INT.
- `Drop`: `id`, `name`, `price_drop` DECIMAL, `price_street` DECIMAL, `min_qty` INT, `status` ENUM('draft','live','locked','done'), `assortments` JSONB, `created_at`, `promo_fake` BOOL DEFAULT false.
- `Preorder`: `id`, `user_id` FK, `drop_id` FK, `items` JSONB[{flavor, qty}], `qty_total` INT, `status` ENUM('pending','locked','cancelled','paid','fulfilled'), `created_at`, `lock_at`.
- `Payment`: `id`, `preorder_id` FK, `method` ENUM('btc','voucher','cash'), `amount` DECIMAL, `tx_ref`, `status` ENUM('pending','confirmed','failed'), `confirmed_at`.
- `Order`: `id`, `user_id`, `drop_id`, `items` JSONB, `total` DECIMAL, `address` JSONB, `status` ENUM('processing','shipped','delivered').
- `Voucher`: `code` UNIQUE, `value_eur` DECIMAL, `min_subtotal` DECIMAL, `active` BOOL, `used_by` USER_ID NULL.
- `LeaderboardSnapshot`: `id`, `kind` ENUM('invites','buyers','coins'), `payload` JSONB, `created_at`.
- `Ticket`: `id`, `user_id`, `topic`, `message`, `status` ENUM('open','done'), `created_at`, `updated_at`.
- `Rules`: `id`, `key`, `value` JSONB (z.B. Rabatt-Caps, Storno-Fenster, Coin-Raten).

Indizes: `(user_id)`, `(drop_id, status)`, `(created_at DESC)`. Caps und Regeln zusätzlich via DB CHECKs + Service-Layer.

---

## 20. API Endpoints (Express/Fastify, Auszug)

### Public

- `GET /api/drops` (listet live Drops inkl. Progress, Flavors)
- `GET /api/drops/:id` (Detail)
- `POST /api/preorders` (create; body: `drop_id`, `items`)
- `POST /api/preorders/:id/cancel` (innerhalb 30 Min & 1/Woche)
- `POST /api/payments/:preorderId` (method `btc`/`voucher`/`cash`)
- `POST /api/payments/:id/confirm` (Webhook/Watcher)
- `POST /api/address` (nach Zahlung)
- `GET /api/profile` (Orders, Coins)
- `GET /api/leaderboard`
- `POST /api/tickets`

### Admin (Token geschützt)

- `POST /api/admin/drop` (add)
- `PATCH /api/admin/drop/:id` (edit)
- `DELETE /api/admin/drop/:id` (remove)
- `POST /api/admin/fake-drop` (toggle)
- `POST /api/admin/fake-top` (toggle)

### System

- `GET /api/health` (200)
- `GET /api/metrics` (Prometheus)

---

## 21. Bot-Flows (Telegram, aiogram/Telegraf)

- `start`: Begrüßung + Sprache → Profil anlegen.
- `shop`, `drops`, `top`, `profile`, `ticket`.
- Drop-Detail via Deep-Link → WebView URL mit Signatur (`user_id`, `nonce`).
- Admin-Befehle: `adddrop`, `editdrop`, `removedrop`, `fakedrop`, `faketop`, `info @user`.

---

## 22. Coins & Discounts (Server-Regeln)

- Earn: `+100` Coins pro Preorder (fix) + `ceil(subtotal * 0.05)` Coins.
- Burn: Einlösen nur in vordefinierten Staffeln (5 €, 10 €, 20 € Cap pro Bestellung). Mindestbestellwerte erzwingen.
- Sichtbarkeit: Coins-Stand anzeigen; Bonus-Logik serverseitig, keine manipulierbaren Client-Checks.
- Anti-Abuse: Keine Coins bei Storno/Chargeback; rückwirkende Abzüge möglich.

---

## 23. Notifications & Scheduler

- Jobs: 50% & 90% Fortschritt → Push; Drop endet in 2h; Payment-Watcher (BTC); Storno-Timer nach 30 Min → Preorder locken.
- Queue: BullMQ mit Redis; idempotente Jobs, Dead-Letter Queue, Retry + Backoff.

---

## 24. Sicherheit, Rate Limits, Privacy

- Admin-API tokenisiert, optional IP-Allowlist.
- Rate Limits pro IP/Nutzer (Login, Preorder, Payment).
- Cash-Zahlung: Selfie Pflicht bei fehlender Einladung. Medien-Storage mit signierten URLs.
- DSGVO: Minimierte Daten, Lösch-Routinen, Consent im Onboarding.

---

## 25. Admin-Panel (Web + Bot)

- Drop CRUD, Fake-Toggles (mit Audit Log), Übersicht Payments/Preorders, Ticket-Queue, Leaderboard-Preview, Regel-Editor für Caps/Timer.

---

## 26. Implementation Roadmap

1. Repo-Cleanup & Monorepo-Struktur (`apps`, `packages`, `infra`, `mcp`, `tests`).
2. DB & Models (Drizzle Schema + Migrationen + Seeds).
3. Public API (Drops, Preorder, Payments, Profile).
4. Coins/Rules Engine (Caps, Mindestwerte, 5% earn, +100 fix).
5. Bot (Commands, WebView Signed Links).
6. WebView (Drop-Detail, Progressbar, Preorder UI, Checkout).
7. Payments (BTC Watcher, Voucher-Prüfung, Cash-Flow mit Selfie-Review).
8. Notifications (BullMQ + Redis, 50/90% + Endtimer).
9. Admin-Panel (CRUD, Fakes, Tickets, Leaderboard).
10. QA & CI (unit/api/e2e, Accessibility, Smoke).
11. Docker & VPS (Compose + Caddy).

---

## 27. Schritt-Prompts (für Codex)

A. Repo-Cleanup & Skeleton

```
TASK: Richte die Monorepo-Struktur (apps/web, apps/server, packages/shared, infra, mcp, tests) ein, überführe bestehenden Code minimal-invasiv. Füge Scripts aus agent.md §16 hinzu. Ziel: `pnpm -w test:ci` grün.
```

B. DB-Schema + Migrationen

```
TASK: Implementiere Drizzle-Schemas gemäß agent.md §19 und generiere Migrationen. Schreibe Seeds für Demo-Drop und zwei User. Liefere SQL + Type-Safety-Tests.
```

C. Public API

```
TASK: Baue Endpoints aus §20 (public) inkl. Zod-DTOs, Fehlercodes, Supertest-Specs. Health-Check muss 200 liefern.
```

D. Coins/Rules

```
TASK: Implementiere Coins Earn/Burn und Rabatt-Caps exakt wie in §22, inkl. Unit-Tests für Edge Cases.
```

E. Bot + WebView

```
TASK: Telegram-Bot mit Commands aus §21, WebView-Signaturen, Drop-Detail-Linking, E2E-Tests mit Playwright Screenshots.
```

F. Payments + Watcher

```
TASK: BTC-Watcher (MockAdapter), Voucher-Prüfung, Cash-Flow (Selfie + Admin Approve). Webhooks & Status-Transitions testen.
```

G. Notifications

```
TASK: BullMQ-Jobs (50/90% Push, Endtimer, Storno-Lock), Retry + Backoff, Idempotenz-Keys, Tests.
```

H. Admin-Panel

```
TASK: CRUD UI, Toggle-Flags, Ticket-Queue, Leaderboard-Preview. Access-Guards + Audit-Log.
```

---

## 28. Compliance & Risiken (Kurz)

- Nutzeridentität nur, wenn nötig (Cash).
- Keine unverifizierten Marketing-Fake-Statistiken öffentlich ohne Kennzeichnung.
- Zahlungsdaten minimal halten.
- Logs ohne PII.
- DSGVO-Rechte umsetzen (Export, Löschung).


