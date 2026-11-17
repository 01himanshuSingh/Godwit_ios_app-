# Godwit Profile → Documents — Visible Data & Current Layout Spec

**Audience:** UI restructure of the **Documents** section under Profile.  
**Out of scope:** Profile hub, Travellers (including Travel Documents on traveller detail), Payments, other profile sections.

**Intent:** Brand colors, **current layout**, and **all visible data** on the Documents screens that will be restructured.

**Code**

| Screen        | Path                                                      | Route                       |
| ------------- | --------------------------------------------------------- | --------------------------- |
| Documents hub | `src/features/profile/documents/DocumentsScreen.tsx`      | `/profile/documents`        |
| Trips list    | `…/components/TripDocumentsListCard.tsx`                  | (same screen, Trips tab)    |
| Personal list | `…/components/PersonalDocumentsListCard.tsx`              | (same screen, Personal tab) |
| Tabs          | `…/components/DocumentsTabs.tsx`                          | —                           |
| Shell         | `src/features/profile/components/ProfileSectionShell.tsx` | —                           |

**Related:** `docs/PROFILE_HUB_VISIBLE_DATA.md` · `docs/PROFILE_TRAVELLERS_VISIBLE_DATA.md` · `docs/PROFILE_PAYMENTS_VISIBLE_DATA.md`

---

## Brand colors

| Role          | Token    | Hex       |
| ------------- | -------- | --------- |
| **Primary**   | `forest` | `#1B2915` |
| **Secondary** | `sand`   | `#D8CDB8` |

Supporting: `background` `#EDECEA` · `card` `#F7F6F4` · `border` `#D4D0C8` · `muted` `#5C6658` · `accent` `#3D4F38`

Hardcoded today: trip group cards `#F8F7F4` · personal list card `#FFFFFF` · error box `#F8F7F4` · file icon + actions use `muted`

---

## Screens in this flow

| #   | Surface                           | Opens from               |
| --- | --------------------------------- | ------------------------ |
| 1   | **Documents hub** (single screen) | Profile menu → Documents |
| 1a  | **Trips** tab (default)           | Tab control on hub       |
| 1b  | **Personal** tab                  | Tab control on hub       |

There is **no document detail route** today. View / Download open the file URL (PDF / storage) outside a nested Profile screen.

**Not part of this section:** passport / visa / membership rows on **Traveller detail** (`TravelDocumentsCard`) — those belong to Travellers restructure.

---

## Current layout — Documents hub

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Back: ‹ Profile                         │
│ Title: Documents                        │
│ Subtitle: Vouchers, tickets and         │
│           confirmations.                │
├─────────────────────────────────────────┤
│ Tabs:  Trips  |  Personal               │
│        (underline on active)            │
├─────────────────────────────────────────┤
│ Body (active tab only):                 │
│   · Loading spinner                     │
│     (+ scanning copy when paging empty) │
│   · Error + Retry                       │
│   · List card(s)                        │
│   · Load more (when more pages)         │
└─────────────────────────────────────────┘
```

Default tab on open: **Trips**.

---

## Visible data — chrome

| Data     | Copy                                   |
| -------- | -------------------------------------- |
| Back     | `Profile` (shell default)              |
| Title    | `Documents`                            |
| Subtitle | `Vouchers, tickets and confirmations.` |

### Hub menu row (Profile first screen — context only)

| Data          | Copy                                     |
| ------------- | ---------------------------------------- |
| Menu title    | `Documents`                              |
| Menu subtitle | `Vouchers, tickets and travel documents` |

---

## Tabs

| Tab id     | Label      | Selected look                     |
| ---------- | ---------- | --------------------------------- |
| `trips`    | `Trips`    | Forest underline + forest label   |
| `personal` | `Personal` | Same when active; muted when idle |

---

## Shared tab states

| State                             | Visible                                        |
| --------------------------------- | ---------------------------------------------- |
| Loading                           | Spinner (`forest`)                             |
| Scanning (empty list, more pages) | Spinner + scanning copy (below)                |
| Error                             | Friendly message · `Retry` / `Retrying…`       |
| Empty list                        | Empty card copy (per tab)                      |
| Has more                          | `Load more` (spinner while fetching next page) |

### Error messages

| Surface               | Message                                                         |
| --------------------- | --------------------------------------------------------------- |
| Missing scope         | `Account details are missing. Please sign in again.`            |
| Permission — Trips    | `You don’t have access to trip documents for this account.`     |
| Permission — Personal | `You don’t have access to personal documents for this account.` |
| Offline               | `Connection issue. Check your network and try again.`           |
| Unknown — Trips       | `Couldn’t load trip documents. Please try again.`               |
| Unknown — Personal    | `Couldn’t load personal documents. Please try again.`           |

### View / Download failures (alerts / action copy)

| Action          | Message                                               |
| --------------- | ----------------------------------------------------- |
| Permission      | `This file isn’t available to open.`                  |
| Offline         | `Connection issue. Check your network and try again.` |
| Open failed     | `Couldn’t open this file. Please try again.`          |
| Download failed | `Couldn’t download this file. Please try again.`      |

---

## 1. Trips tab

**Source:** client sales with a `confirmationDoc` URL (vouchers / confirmations).  
**Grouping:** by `groupLabel` (trip / destination name); fallback group `Trips`.

| Data            | Copy                                  |
| --------------- | ------------------------------------- |
| Scanning        | `Looking for trip documents…`         |
| Empty           | `No trip confirmations uploaded yet.` |
| Load more a11y  | `Load more trip documents`            |
| Load more label | `Load more`                           |

### Group card

| Data          | Example / shape                                | Notes              |
| ------------- | ---------------------------------------------- | ------------------ |
| Group heading | `Dubai` · trip / destination name · or `Trips` | One card per group |
| Card fill     | `#F8F7F4`                                      |                    |

### Each trip document row

| Data         | Example / shape                  | Notes                                                          |
| ------------ | -------------------------------- | -------------------------------------------------------------- |
| Leading icon | File-text (`muted`)              | Decorative                                                     |
| Title        | `{hotel/service} – Confirmation` | e.g. `Aman – Confirmation` · fallback `Booking – Confirmation` |
| Meta         | Travel date                      | e.g. `11 July 2026` · hidden if none                           |
| Action       | `View`                           | Opens PDF / URL                                                |
| Action       | `Download`                       | Spinner while downloading                                      |

Rows are **not** navigational to an in-app detail screen.

---

## 2. Personal tab

**Source:** travellers linked to the client → customer profile passports / visas / memberships **with a file URL**.  
**Layout:** single white card; section label + flat list (not grouped by traveller in UI today).

| Data            | Copy                                  |
| --------------- | ------------------------------------- |
| Scanning        | `Looking for personal documents…`     |
| Empty           | `No personal documents uploaded yet.` |
| Section label   | `PERSONAL`                            |
| Load more a11y  | `Load more personal documents`        |
| Load more label | `Load more`                           |

### Each personal document row

| Data         | Example / shape       | Notes                                      |
| ------------ | --------------------- | ------------------------------------------ |
| Leading icon | File-text (`muted`)   | Decorative                                 |
| Title        | See title rules below |                                            |
| Meta line    | `{date} · {size}`     | Either part alone OK; hidden if both empty |
| Fixed label  | `Personal document`   | Always under meta                          |
| Action       | `View`                |                                            |
| Action       | `Download`            | Spinner while downloading                  |

### Title rules (by type)

| Type       | Title pattern                                  | Example                                                         |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Passport   | `Passport scan — {travellerName}`              | `Passport scan — Anmol Singh`                                   |
| Visa       | `Visa ({country}) — {name}` or `Visa — {name}` | `Visa (UAE) — Anmol Singh`                                      |
| Membership | `{program} — {name}`                           | `Marriott Bonvoy — Anmol Singh` · program fallback `Membership` |

### Meta line pieces

| Piece     | Example                       | When                           |
| --------- | ----------------------------- | ------------------------------ |
| Date      | `4 June 2025`                 | Expiry / issue when CRM has it |
| File size | `1.2 MB` · `340 KB` · `512 B` | When CRM exposes size          |

Combined as `{date} · {size}` when both exist.

---

## Fixed strings checklist

### Chrome & tabs

`Documents` · `Vouchers, tickets and confirmations.` · `Profile` (back) · `Trips` · `Personal`

### Trips

`Looking for trip documents…` · `No trip confirmations uploaded yet.` · `Load more` · `View` · `Download` · group fallback `Trips` · title suffix ` – Confirmation` · booking fallback `Booking`

### Personal

`Looking for personal documents…` · `No personal documents uploaded yet.` · `PERSONAL` · `Personal document` · `Load more` · `View` · `Download` · title prefixes `Passport scan —` · `Visa` · membership / `Membership`

### Shared

`Retry` · `Retrying…` · error / file-action strings above

---

## Loaded but not shown (or shown elsewhere)

| Data                                                | Notes                                            |
| --------------------------------------------------- | ------------------------------------------------ |
| Sale / traveller IDs, raw URLs, document paths      | Used for keys / open-download only               |
| Service name on trip docs                           | Mapped; not a separate UI field (may feed title) |
| Traveller name as its own column                    | Embedded in personal **title** only              |
| Doc type badge (`passport` / `visa` / `membership`) | Drives title copy; no type chip in UI            |
| Traveller-detail Travel Documents                   | Separate screen — see Travellers MD              |

---

## Restructure notes

1. Keep the **two domains** (trip confirmations vs personal travel docs) unless product merges them.
2. Keep **View** and **Download** as primary actions unless the new UI adds an in-app preview screen.
3. Use **current layout** as baseline; change grouping (e.g. by traveller on Personal) freely.
4. Prefer `forest` / `sand` tokens; trip vs personal card fills differ today (`#F8F7F4` vs `#FFFFFF`).
5. Hub menu subtitle still says “travel documents”; shell subtitle says “confirmations” — align copy in the new UI if desired.

---

_Content + current-layout baseline for Profile → Documents UI restructure._
