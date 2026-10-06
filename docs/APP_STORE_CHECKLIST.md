# App Store checklist

Mark items when complete before submission.

| Item | Status |
|------|--------|
| Apple Developer account and confirmed bundle IDs (`com.godwit.client*`) | ☐ |
| App Store Connect app record | ☐ |
| Privacy policy URL (public) | ☐ |
| App Privacy questionnaire (email, name, phone, push token, crash data, etc.) | ☐ |
| Privacy manifests and Required Reason API declarations | ☐ |
| `ITSAppUsesNonExemptEncryption` confirmed (export compliance) | ☐ |
| Sign in with Apple offered when Google sign-in is offered (guideline 4.8 — verify current wording) | ☐ |
| Account deletion in-app if required (guideline 5.1.1 — confirm applicability) | ☐ |
| App Review demo account / fixed OTP for reviewers | ☐ |
| Screenshots for required iPhone display sizes | ☐ |
| Push Notifications entitlement and APNs key in Apple Developer | ☐ |
| No hidden or undocumented features (guideline 2.3.1) | ☐ |
| No dev-only or mock auth in production builds (`__DEV__` + `APP_ENV`) | ☐ |
| TestFlight external beta review (if using external testers) | ☐ |
| Schedule buffer for rejection / resubmission cycle | ☐ |

See also `docs/DEPENDENCIES.md` for third-party SDK disclosure.
