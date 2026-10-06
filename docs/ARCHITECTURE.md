# Architecture

## Data flow

```text
Screen
  → feature hook (React Query)
  → ClientApi (interface)
  → http adapter
  → /v1 Cloud Function (BFF)
  → Firestore (admins/{adminId}/...)
```

The app **never** talks to Firestore directly.

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `src/app` | Thin Expo Router files, auth groups `(auth)` / `(app)` |
| Features | `src/features/*`, `src/auth` | Screens, hooks, feature schemas |
| API | `src/api` | `ClientApi`, Zod contracts, mock/http adapters |
| UI | `src/ui` | Tokens, primitives, shared components |
| Lib | `src/lib` | Query client, Keychain, errors, logger, format |
| Config | `src/config` | Validated env |

## Mock vs HTTP adapter

- **`mock`** adapter: default for local development; reads fixtures from `src/mocks`.
- **`http`** adapter: calls `EXPO_PUBLIC_API_BASE_URL` (`/v1/*`).
- Switch is a single configuration point (to be wired in `src/api` during Phase 1 build-out).

## Error model

- HTTP adapter maps status codes and BFF error payloads to typed app errors (`src/lib/errors`).
- React Query hooks surface errors to screens for retry / empty / permission-denied UI.

## Realtime messaging

Target: **WebSocket with polling fallback**. Final transport is **pending backend decision**; feature folder includes `realtime/` for the client transport layer.
