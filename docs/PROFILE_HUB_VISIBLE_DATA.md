# Godwit Profile Hub — Visible Data & Current Layout Spec

**Audience:** UI restructure of the **Profile first screen only** (hub).  
**Out of scope:** Travellers, Payments, Documents, and other section detail screens — those open from this hub and are not documented here.

**Intent:** Brand colors, **current layout**, and **visible data** on the Profile tab root.

**Code:** `src/features/profile/screens/ProfileScreen.tsx`  
**Related:** `docs/HOME_PAGE_VISIBLE_DATA.md` · `docs/TRIPS_VISIBLE_DATA.md`

---

## Brand colors

| Role          | Token    | Hex       |
| ------------- | -------- | --------- |
| **Primary**   | `forest` | `#1B2915` |
| **Secondary** | `sand`   | `#D8CDB8` |

Supporting palette:

| Token               | Hex       |
| ------------------- | --------- |
| `background`        | `#EDECEA` |
| `card`              | `#F7F6F4` |
| `border`            | `#D4D0C8` |
| `muted`             | `#5C6658` |
| `accent`            | `#3D4F38` |
| `primaryForeground` | `#F7F6F4` |

Hardcoded on this screen today: account/menu card fill `#F8F7F4`; chevron `#C4C0B8`.

---

## Important note on “client amount”

The **Profile hub does not show a monetary balance / amount due** today.

| Where amount lives                               | Screen                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Amount due / credit, invoices, payments received | **Payments** section (`/profile/payments`) — opened from the Payments menu row |

If the restructure should put **client amount on the Profile first screen**, that is a **new UI placement**; the live amount data already exists on the Payments flow (ledger), not on this hub.

---

## Current layout (baseline)

Hosted in `MainTabScreen` when tab = Profile. App chrome (`GODWIT` header) above; floating tab bar below.

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Scroll (background)                     │
│                                         │
│   Hero                                  │
│     Title: Profile                      │
│     Family label (muted)                │
│                                         │
│   ACCOUNT card (rounded)                │
│     ┌ left ──────────┬ right ─────────┐ │
│     │ ACCOUNT        │ YOUR DIRECTOR  │ │
│     │ Display name   │ Director name  │ │
│     │ Email          │ Director title │ │
│     │ Account role   │                │ │
│     └────────────────┴────────────────┘ │
│     (stacks vertically on very narrow)  │
│                                         │
│   Menu card (rounded list)              │
│     [icon] Title                        │
│            subtitle………………… ›            │
│     ─────────────────────────────────── │
│     … (one row per section) …           │
│                                         │
│   bottom padding for tab bar (~96)      │
├─────────────────────────────────────────┤
│ Floating HomeTabBar                     │
└─────────────────────────────────────────┘
```

**States instead of ACCOUNT card:**

- Loading (session / first fetch): full-screen spinner
- Error with no profile: error message · adminId/clientId hint · `Retry` / `Retrying…`

**Responsive:** horizontal pad ~16 / 24 / 40; content max-width ~680 on wide; title size ~34–48; ACCOUNT columns stack under ~340 width.

---

## Visible data

### Hero

| Data         | Example / shape    | Source                                                     |
| ------------ | ------------------ | ---------------------------------------------------------- |
| Page title   | `Profile`          | Fixed                                                      |
| Family label | e.g. `Modi Family` | `client.familyLabel` (from client name); fallback `Family` |

### ACCOUNT card

| Data             | Example / shape                | Source                                                     |
| ---------------- | ------------------------------ | ---------------------------------------------------------- |
| Section eyebrow  | `ACCOUNT`                      | Fixed                                                      |
| Display name     | Client full name               | `client.displayName` (or session name); fallback `—`       |
| Contact email    | e.g. `ruchir@…`                | `client.contactEmail` / session email; **hidden if empty** |
| Account role     | e.g. `Principal - Modi Family` | `client.accountRole`; **hidden if empty**                  |
| Director eyebrow | `YOUR DIRECTOR`                | Fixed (column only if director present)                    |
| Director name    | Relationship manager name      | `client.directorName`; **column hidden if empty**          |
| Director title   | e.g. job title                 | `client.directorTitle`; **hidden if empty**                |

### Menu rows (section entry points)

Each row: **icon** · **title** · **subtitle** · chevron. Opens `/profile/{section}`.

| Section id       | Title            | Default subtitle                            | Icon          | Dynamic subtitle                                                                     |
| ---------------- | ---------------- | ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| `travellers`     | `Travellers`     | `Details, documents, loyalty, preferences`  | `users`       | If `travellerCount > 0`: `{n} travellers - details, documents, loyalty, preferences` |
| `payments`       | `Payments`       | `Invoices, payments received and statement` | `credit-card` | —                                                                                    |
| `documents`      | `Documents`      | `Vouchers, tickets and travel documents`    | `file-text`   | —                                                                                    |
| `notifications`  | `Notifications`  | `What your Godwit team has sent you`        | `bell`        | —                                                                                    |
| `account-access` | `Account access` | `Who may use this Godwit account`           | `key`         | —                                                                                    |
| `security`       | `Security`       | `Sign-in, devices and sessions`             | `shield`      | —                                                                                    |
| `support`        | `Godwit support` | `Your travel team, available 24/7`          | `help-circle` | —                                                                                    |

### Load / error copy

| State            | Visible                    |
| ---------------- | -------------------------- |
| Loading          | Spinner only               |
| Error title/body | Fetch error message        |
| Error hint       | `adminId: … · clientId: …` |
| Retry            | `Retry` / `Retrying…`      |

---

## Data readiness

| Item                                              | Live today                                  |
| ------------------------------------------------- | ------------------------------------------- |
| Family label, display name, email, role, director | Yes (`getClientProfileSafe`)                |
| Traveller count on Travellers subtitle            | Yes (`travellerCount`)                      |
| Client amount / balance on this hub               | **No** — lives under Payments section       |
| Menu titles / subtitles (except travellers count) | Static definitions in `profileMenuItems.ts` |

---

## Restructure notes

1. This doc is the **Profile hub only** — not Travellers / Payments / Documents detail UIs.
2. Use **Current layout** as the baseline; change structure freely.
3. Preserve the **visible account fields** and **seven menu destinations** unless product drops them.
4. If the new hub should show **client amount**, plan that as an added block and wire it from payments/ledger data.
5. Prefer `forest` / `sand` tokens over one-off greys where possible.

---

_Content + current-layout baseline for Profile first-screen UI restructure._
