# NebulaOrderBot Skeleton - Developer Notes

## Start the bot locally
1. Ensure `.env` contains `BOT_TOKEN`, `BOT_NAME`, and optional URLs (`WEB_APP_URL`, service endpoints).
2. From repo root run:
   ```powershell
   pnpm.cmd --filter @nebula/bot dev
   ```
   The script uses `tsx` watch mode and loads env variables automatically.

## Current capabilities
- `/start` welcomes users and offers a WebView launch button (if `WEB_APP_URL` is set).
- `/selfie` moves the session into `awaiting_selfie` and nudges the user into the future capture flow.
- `/tickets` and `/payments` return copy that explains the planned flows and encourages launching the WebView.
- In-memory session middleware preserves minimal state per user.

## TODO before MVP launch
- Replace in-memory session store with Redis-backed storage.
- Implement invite validation and persistence against the shared identity/ticket services.
- Integrate selfie vendor APIs via `createIdentityClient` stubs and wire webhook handling.
- Connect ticket and payment clients to real services; surface catalog data inside the WebView.
- Add mini-app deep links once the WebView package is available.
- Harden logging/monitoring (structured logs, error alerts) and add automated tests for the flows.
