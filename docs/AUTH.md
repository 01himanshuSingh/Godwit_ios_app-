# Authentication (AUTH-1)

Signed-in users are CRM **clients** (invite-only). Firebase Auth proves email ownership; `app_users/{uid}` (or trusted provisioning) grants mobile access and maps `adminId` / `clientId`.

## Real APK / production-style flow (preferred)

1. User enters email → **`assertRegisteredClientEmail`** (Firestore `app_users` / CRM gate).
2. App calls Firebase `sendSignInLinkToEmail` with `handleCodeInApp: true` and **`android.packageName`** / **`iOS.bundleId`** for this build.
3. User opens Gmail **on the phone** and **taps** the sign-in link.
4. Android App Link / iOS Universal Link opens the Godwit app with the Firebase Hosting URL.
5. `useMagicLinkHandler` → `signInWithEmailLink` → validate `app_users/{uid}` → home.

Paste UI is **dev-only** (`__DEV__`). Release / EAS preview builds show “Waiting for you to tap the sign-in link…”.

### Firebase Console (same project as CRM web)

1. Authentication → Sign-in method → enable **Email link**.
2. Project settings → add **Android apps** for each package you ship:
   - `com.godwit.client.dev`
   - `com.godwit.client.staging` (EAS `preview`)
   - `com.godwit.client` (production)
3. Add the EAS Android signing **SHA-256** to each Android app (App Links verification).
4. Authorized domains must include `{projectId}.firebaseapp.com` (default).

CRM web keeps its own `ActionCodeSettings` (web continue URL). Mobile only sets package/bundle when _this app_ sends the link — it does not change CRM’s send path.

## Expo Go / local development

1. Same email gate + `sendSignInLinkToEmail`.
2. Expo Go cannot own App Links reliably → **Complete sign-in** paste UI (`__DEV__`).
3. `signInWithEmailLink` → same entitlement + session path.

Pending wait state (`pending_auth_email`, `pending_auth_sent_at`) survives reload so cold start opens **complete-login**.

**Development fallback:** if `app_users` is missing and `APP_ENV=development` (unless `EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK=false`), the app may resolve the CRM `clients` doc by email. Staging/production builds must provision `app_users` server-side — never auto-enroll every CRM email.

Do **not** store Firebase ID/refresh tokens in SecureStore; Firebase Auth RN persistence owns them. SecureStore keeps app `clientId` scope markers only.

## Later phases

| Phase          | Work                                                             | Build   |
| -------------- | ---------------------------------------------------------------- | ------- |
| Google / Apple | Provider token → same entitlement check                          | —       |
| BFF tokens     | Exchange Firebase (or provider) proof for `/v1` access + refresh | Backend |

## Security

- Never accept `clientId` from the client as proof of authorization.
- Frontend entitlement checks are UX only; Firestore rules must enforce tenant scope.
- Logout: `signOut(auth)` + clear pending keys + clear profile / session markers + React Query user cache.
