# Godwit Profile → Travellers — Visible Data & Current Layout Spec

**Audience:** UI restructure of **Travellers list** and **individual traveller detail**.  
**Out of scope:** Profile hub, Payments, Documents (account-level), other profile sections.

**Intent:** Brand colors, **current layout**, and **visible data** for both screens.

**Code**

| Screen | Path                                                        |
| ------ | ----------------------------------------------------------- |
| List   | `src/features/profile/travellers/TravellersScreen.tsx`      |
| Detail | `src/features/profile/travellers/TravellerDetailScreen.tsx` |
| Shell  | `src/features/profile/components/ProfileSectionShell.tsx`   |

**Related:** `docs/PROFILE_HUB_VISIBLE_DATA.md`

---

## Brand colors

| Role          | Token    | Hex       |
| ------------- | -------- | --------- |
| **Primary**   | `forest` | `#1B2915` |
| **Secondary** | `sand`   | `#D8CDB8` |

Supporting: `background` `#EDECEA` · `card` `#F7F6F4` · `border` `#D4D0C8` · `muted` `#5C6658` · `accent` `#3D4F38`

Hardcoded today: card fill `#F8F7F4` · chevron `#C4C0B8`

---

## Current layout (baseline)

### A. Travellers list

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Back: ‹ Profile                         │
│ Title: Travellers                       │
│ Subtitle: Details, travel documents…    │
├─────────────────────────────────────────┤
│ Body (one of):                          │
│   · Loading spinner                     │
│   · Error card + Retry                  │
│   · List card:                          │
│       Name ……………………………………… ›             │
│       Detail line (optional)            │
│       ───────────────────────────────   │
│       … more rows …                     │
│   · Or empty: “No travellers linked…”   │
└─────────────────────────────────────────┘
```

Tap row → `/profile/travellers/{customerId}`

---

### B. Individual traveller detail

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Back: ‹ Travellers                      │
│ Title: {full name} or Traveller         │
│ Subtitle: {relationship} or Principal   │
├─────────────────────────────────────────┤
│ Body (one of):                          │
│   · Loading spinner                     │
│   · Error + Retry                       │
│   · Stack of expandable cards (↓):      │
│       1. PERSONAL DETAILS               │
│       2. TRAVEL DOCUMENTS               │
│       3. LOYALTY                        │
│       4. HOTELS                         │
│       5. COMMERCIAL AIRLINES            │
└─────────────────────────────────────────┘
```

Each card: **collapsed header** (eyebrow + summary + chevron) · **expanded body** (fields / rows / edit). Cards start expanded today.

---

## Visible data — Travellers list

### Chrome

| Data     | Copy                                                  |
| -------- | ----------------------------------------------------- |
| Back     | `Profile`                                             |
| Title    | `Travellers`                                          |
| Subtitle | `Details, travel documents, loyalty and preferences.` |

### States

| State      | Visible                                        |
| ---------- | ---------------------------------------------- |
| Loading    | Spinner                                        |
| Error      | Friendly error message · `Retry` / `Retrying…` |
| Empty list | `No travellers linked to this client yet.`     |

**Error message shapes:**  
`Account details are missing. Please sign in again.` · `You don't have access to travellers for this account.` · `Connection issue. Check your network and try again.` · `Couldn't load travellers. Please try again.`

### Each traveller row

| Data        | Example / shape                                  | Notes               |
| ----------- | ------------------------------------------------ | ------------------- |
| Name        | `Ananya Modi`                                    | Fallback `—`        |
| Detail line | `Daughter · India` · `Principal · India · Minor` | **Hidden if empty** |
| Chevron     | ›                                                | Opens detail        |

---

## Visible data — Individual traveller

### Chrome

| Data     | Rule                                                     |
| -------- | -------------------------------------------------------- |
| Back     | `Travellers`                                             |
| Title    | `fullName` or `Traveller`                                |
| Subtitle | `relationship` or `Principal` (only when details loaded) |

### States

| State   | Visible                                                   |
| ------- | --------------------------------------------------------- |
| Loading | Spinner · title `Traveller` · no subtitle                 |
| Error   | Message or `Traveller not found.` · `Retry` / `Retrying…` |

---

### 1. PERSONAL DETAILS

| Area                | Data                                                      |
| ------------------- | --------------------------------------------------------- |
| Eyebrow             | `PERSONAL DETAILS`                                        |
| Summary (collapsed) | e.g. `India · born 12 April 1978` · or `Personal details` |
| Empty body          | `No personal details available yet.`                      |

**Expanded fields** (row omitted if empty):

| Label           | Value                            |
| --------------- | -------------------------------- |
| `FULL NAME`     | Full name                        |
| `DATE OF BIRTH` | e.g. `12 April 1978`             |
| `NATIONALITY`   | e.g. `India`                     |
| `RELATIONSHIP`  | e.g. `Daughter` / `Principal`    |
| `EMAIL`         | Email                            |
| `TELEPHONE`     | Phone (may include country code) |

---

### 2. TRAVEL DOCUMENTS

| Area    | Data                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------ |
| Eyebrow | `TRAVEL DOCUMENTS`                                                                               |
| Summary | e.g. `4 on file · numbers always masked` · or `0 on file · numbers always masked`                |
| Empty   | `No travel documents on file yet.`                                                               |
| Footer  | `A new or renewed document is uploaded securely by your Godwit team — request the change below.` |

**Each document row:**

| Data         | Example                                            |
| ------------ | -------------------------------------------------- |
| Title        | `Passport` · `Visa` · membership program name      |
| Status badge | `Valid` · `Renew soon` · `Expired` · `Unknown`     |
| Detail line  | Country or masked number `· · · · 1234` (optional) |
| Expiry       | `Expires 2 November 2029` (optional)               |
| Open         | Opens doc URL when present                         |

---

### 3. LOYALTY

| Area    | Data                                                                                       |
| ------- | ------------------------------------------------------------------------------------------ |
| Eyebrow | `LOYALTY`                                                                                  |
| Summary | e.g. `Emirates Skywards · Marriott Bonvoy` · or `No programmes yet` / `Loyalty programmes` |
| Empty   | `No loyalty programmes linked yet.`                                                        |
| Footer  | `Membership numbers are added and verified by your Godwit team.`                           |

**Each programme row:**

| Data                 | Notes                        |
| -------------------- | ---------------------------- |
| Program name         | Required                     |
| Tier badge           | Optional                     |
| Member name          | Optional                     |
| Masked member number | Optional e.g. `· · · · 3391` |

---

### 4. HOTELS

| Area    | Data                                                           |
| ------- | -------------------------------------------------------------- |
| Eyebrow | `HOTELS`                                                       |
| Summary | Brands / room type / special requests / or `Hotel preferences` |

**Expanded preference fields** (always listed; empty → `Not set`):

| Label                    | Field                           |
| ------------------------ | ------------------------------- |
| `PREFERRED HOTEL BRANDS` | Brands string                   |
| `PREFERRED ROOM TYPE`    | e.g. `Suite, high floor, quiet` |

**Edit UX:** `Edit` · input placeholder `Enter value` · `Save` · `Cancel`  
**Save error alert:** `Unable to save` + message

---

### 5. COMMERCIAL AIRLINES

| Area    | Data                                                                       |
| ------- | -------------------------------------------------------------------------- |
| Eyebrow | `COMMERCIAL AIRLINES`                                                      |
| Summary | e.g. `Emirates · Business · Aisle · Vegetarian` · or `Airline preferences` |

**Expanded preference fields** (always listed; empty → `Not set`):

| Label                     | Field               |
| ------------------------- | ------------------- |
| `PREFERRED AIRLINES`      | Airlines string     |
| `SPECIAL MEAL`            | Meal preference     |
| `SEAT PREFERENCE`         | e.g. aisle / window |
| `AIRPORT VIP REQUIREMENT` | VIP preference      |

Same **Edit / Save / Cancel** pattern as Hotels.  
**Save error alert:** `Unable to save` + message

---

## Fixed strings checklist

### List

`Travellers` · `Details, travel documents, loyalty and preferences.` · `Profile` · `No travellers linked to this client yet.` · `Retry` · `Retrying…` · name `—`

### Detail shell

`Travellers` (back) · `Traveller` · `Principal` · `Traveller not found.` · `Retry` · `Retrying…`

### Cards

`PERSONAL DETAILS` · `TRAVEL DOCUMENTS` · `LOYALTY` · `HOTELS` · `COMMERCIAL AIRLINES` · `Not set` · `Edit` · `Save` · `Cancel` · `Enter value` · `Valid` · `Renew soon` · `Expired` · `Unknown` · empty-state copies and footers above

---

## Restructure notes

1. Preserve **list + detail** as two screens; detail keeps the five content domains (personal, docs, loyalty, hotels, airlines) unless product drops one.
2. Use **current layout** as baseline; change hierarchy freely.
3. Prefer `forest` / `sand` tokens over one-off greys.
4. Hotels / Airlines are editable prefs today; documents and loyalty are mostly read-only concierge-managed — keep that product intent clear in the new UI.

---

_Content + current-layout baseline for Profile → Travellers UI restructure._
