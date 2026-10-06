# Routes (Phase 1)

Documentation only — route files are created during screen implementation. Paths are under `src/app/(app)/` unless noted.

| # | Screen | Route file | Permission gate |
|---|--------|------------|-----------------|
| 1 | Home | `(tabs)/index.tsx` | - |
| 2 | SignIn | `(auth)/sign-in.tsx` (outside `(app)`) | - |
| 3 | NotFound | `+not-found.tsx` (at `src/app`) | - |
| 4 | ErrorFallback | `ErrorBoundary` export in `_layout.tsx` | - |
| 5 | TripsList | `(tabs)/trips/index.tsx` | - |
| 6 | TripDetail | `(tabs)/trips/[tripId]/index.tsx` | - |
| 7 | TripBookingDetail | `(tabs)/trips/[tripId]/b/[bookingId].tsx` | - |
| 8 | StandaloneBookingDetail | `bookings/[bookingId].tsx` | - |
| 9 | RequestsList | `requests/index.tsx` | - |
| 10 | NewRequest | `requests/new.tsx` | requests.create |
| 11 | RequestDetail | `requests/[requestId]/index.tsx` | - |
| 12 | GeneralQuoteDetail | `requests/[requestId]/q/[quoteId].tsx` | quotes.view / quotes.approve |
| 13 | Messages | `(tabs)/messages/index.tsx` | messages.use |
| 14 | Documents | `documents.tsx` | - |
| 15 | Notifications | `notifications.tsx` | - |
| 16 | PaymentsHub | `payments/index.tsx` | finance.view |
| 17 | AccountStatement | `payments/statement.tsx` | finance.view |
| 18 | InvoiceDetail | `payments/i/[invoiceId].tsx` | finance.view |
| 19 | ProfileHub | `(tabs)/profile/index.tsx` | - |
| 20 | TravellersList | `(tabs)/profile/travellers/index.tsx` | - |
| 21 | TravellerDetail | `(tabs)/profile/travellers/[travellerId].tsx` | preferences.edit / travellers.documents.view |
| 22 | Preferences | `(tabs)/profile/preferences.tsx` | preferences.edit |
| 23 | AccountAccess | `(tabs)/profile/access.tsx` | permissions.manage |
| 24 | Security | `(tabs)/profile/security.tsx` | - |

**Current scaffold:** temporary test Home at `src/app/index.tsx` (Day 2 → tab shell).
