# Authentication (AUTH-1)

Signed-in users are CRM **clients** (invite-only). All sign-in methods link to one user and one `clientId`. The BFF verifies identity and returns **app access + refresh tokens** (stored in Keychain only).

## Methods (priority order)

1. **Email one-time 6-digit code** — matched to CRM client email on the server.
2. **Google sign-in** — ID token verified server-side.
3. **Sign in with Apple** — required alongside Google (App Store guideline 4.8).

Phone OTP is deferred.

## Email OTP flow (proposed)

| Step | Action |
|------|--------|
| 1 | User enters email on SignIn |
| 2 | `POST /v1/auth/email/request` — send code *(proposed — not yet in backend endpoint list)* |
| 3 | User enters 6-digit code |
| 4 | `POST /v1/auth/email/verify` — exchange for tokens *(proposed)* |

Google / Apple: client obtains provider token → BFF verify endpoint → same token pair.

## Account linking

- Link by **provider subject ID**, never by email alone.
- Apple hidden relay emails **cannot** be used to locate the CRM client record.

## Storage and session

- Access and refresh tokens: **Keychain** via `expo-secure-store` wrapper in `src/lib/storage`.
- Logout: revoke refresh token on server and unregister push device token.

## App Review

Provide a **reviewer demo account** with a fixed OTP or pre-provisioned credentials (no production client data).
