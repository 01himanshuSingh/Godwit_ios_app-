# Authentication (AUTH-1)

Signed-in users are CRM **clients** (invite-only). Firebase Auth proves email ownership; `app_users/{uid}` (or trusted provisioning) grants mobile access and maps `adminId` / `clientId`.

## Current mobile flow (Expo Go development)

1. **Email magic link** via Firebase `sendSignInLinkToEmail`.
2. User copies the link from Gmail and pastes it on **Complete sign-in** (Expo Go cannot own `godwit://` yet).
3. `signInWithEmailLink` → Firebase UID.
4. Validate `app_users/{uid}` (`role: client`, `status: active`) → set active client profile + app session markers.
5. `onAuthStateChanged` + Auth persistence restore the Firebase user; entitlement is re-checked on launch.

Pending wait state (`pending_auth_email`, `pending_auth_sent_at`) survives Expo Go reload so cold start opens **complete-login**, not a blank sign-in.

**Development fallback:** if `app_users` is missing and `APP_ENV=development` (unless `EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK=false`), the app may resolve the CRM `clients` doc by email. Production must provision `app_users` server-side — never auto-enroll every CRM email.

Do **not** store Firebase ID/refresh tokens in SecureStore; Firebase Auth RN persistence owns them. SecureStore keeps app `clientId` scope markers only.

## Later phases

| Phase             | Work                                                             | Build             |
| ----------------- | ---------------------------------------------------------------- | ----------------- |
| Deep link handoff | Replace paste UI with Linking / Dev Client scheme                | Development build |
| Universal Links   | HTTPS → app                                                      | Production config |
| Google / Apple    | Provider token → same entitlement check                          | —                 |
| BFF tokens        | Exchange Firebase (or provider) proof for `/v1` access + refresh | Backend           |

## Security

- Never accept `clientId` from the client as proof of authorization.
- Frontend entitlement checks are UX only; Firestore rules must enforce tenant scope.
- Logout: `signOut(auth)` + clear pending keys + clear profile / session markers + React Query user cache.
