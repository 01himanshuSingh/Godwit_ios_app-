# Godwit Trips — Visible Data & Current Layout Spec

**Audience:** UI restructure (Trips tab + Active Trip).  
**Intent:** Document **brand colors**, **current layout** (baseline to redesign against), and **visible data** that must remain available.

**Related:** `docs/HOME_PAGE_VISIBLE_DATA.md` · `docs/HOME_PAGE_UI_INVENTORY.md`

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
| `surface`           | `#DEDBD4` |
| `border`            | `#D4D0C8` |
| `headerBorder`      | `#C2BDB4` |
| `muted`             | `#5C6658` |
| `accent`            | `#3D4F38` |
| `primaryForeground` | `#F7F6F4` |

---

## Current layout (baseline)

### Trips tab — screen structure (top → bottom)

Hosted inside `MainTabScreen` when tab = Trips. App chrome (`GODWIT` header) sits above; floating tab bar sits below.

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Header                                  │
│   Title: Trips                          │
│   Subtitle: Everything arranged…        │
├─────────────────────────────────────────┤
│ Segment row (underline tabs)            │
│   Current · Upcoming · Past             │
│   (default selected: Upcoming)          │
│   hairline under full width             │
├─────────────────────────────────────────┤
│ Scrollable list body                    │
│   · loading / error / empty states      │
│   · day groups:                         │
│       DATE HEADER (e.g. SAT 31 OCT)     │
│       ┌ card (rounded) ─────────────┐   │
│       │ trip row                    │   │
│       │ ──────── underline ───────  │   │
│       │ trip row                    │   │
│       └─────────────────────────────┘   │
│   · pagination spinner at end           │
│   · bottom padding for tab bar (~96)    │
├─────────────────────────────────────────┤
│ Floating HomeTabBar                     │
└─────────────────────────────────────────┘
```

**Trip row layout (inside day card):**

```
[ TIME ]  [ icon + TYPE LABEL ]
          [ Title (1–2 lines) ]
          [ Detail line (optional) ]
          [ Status (optional) ]
                                    [ › ]
```

- Horizontal: time column left · body center · chevron right
- Vertical: type row → title → detail → status
- Rows separated by hairline underline (not between last row and card edge when last)

**Responsive:** page horizontal padding ~16 / 24 / 32 by width; title size scales ~34–44.

---

### Active trip detail — screen structure (top → bottom)

Route: `/trips/[saleId]`. Still under app chrome. Full-screen scroll (no floating tab bar on this stack screen).

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Back row: ‹ Itinerary                   │
├─────────────────────────────────────────┤
│ Loading spinner  OR  error + Retry      │
│              OR                         │
│ Scroll content (max-width ~680 on wide) │
│                                         │
│   1. Title block                        │
│        title (Cormorant)                │
│        subtitle (optional)              │
│                                         │
│   2. Chip row (wrap)                    │
│        service · status · confirmation  │
│        · inclusion · payment            │
│                                         │
│   3. DETAILS card                       │
│        label / value rows               │
│                                         │
│   4. Service-specific cards (see below) │
│                                         │
│   5. DOCUMENTS card (always last)       │
│        file name · View · Download      │
│                                         │
└─────────────────────────────────────────┘
```

**Shared content column:** centered, `paddingHorizontal` ~16–40 by width, safe-area bottom padding.

---

### Active trip — section order by service

Order is top → bottom inside the scroll (Documents always appended by the shell after the body).

| Service                        | Section order                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Hotel / room extension**     | Title → Chips → DETAILS → SPECIAL REQUESTS → CANCELLATION TERMS → Message Godwit → YOUR GODWIT BENEFITS → **DOCUMENTS** |
| **Air / extras / reissue**     | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |
| **Private jet**                | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |
| **Yacht**                      | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |
| **Airport VIP**                | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |
| **Chauffeur**                  | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |
| **Visa / Experiences / Other** | Title → Chips → DETAILS → CANCELLATION TERMS → Message Godwit → **DOCUMENTS**                                           |

Optional blocks render only when data exists (`specialRequests`, `cancellationTerms`, `showMessageGodwitCta`, benefits, voucher).

**DETAILS card pattern:** uppercase section heading `DETAILS` · stacked rows (muted label above forest value) · telephone rows include phone icon.

**Chip row pattern:** horizontal wrap of filled or outline pills under the title.

---

## A. Trips tab — list screen (visible data)

### Screen chrome

| Data             | Example / shape                  |
| ---------------- | -------------------------------- |
| Page title       | `Trips`                          |
| Subtitle         | `Everything arranged, In order.` |
| Segment / filter | `Current` · `Upcoming` · `Past`  |
| Session loading  | `Loading client session…`        |

### List states

| State            | Visible copy                                                                           |
| ---------------- | -------------------------------------------------------------------------------------- |
| Loading bookings | Spinner; optionally `Looking for upcoming bookings…`                                   |
| Error            | Error message or `Could not load upcoming trips.`                                      |
| Empty            | `No upcoming trips for this client.` _(same copy for Current / Upcoming / Past today)_ |
| Day header       | e.g. `SAT 31 OCT` · unknown → `DATE TBD`                                               |

### Each trip row (all service types)

| Data               | Example / shape                                                                                        | Notes          |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------- |
| Time               | `15:00` / `09:30` / `—`                                                                                | Left column    |
| Service type label | `FLIGHT`, `HOTEL`, `YACHT`, `PRIVATE JET`, `AIRPORT VIP`, `CHAUFFEUR`, `VISA`, `EXPERIENCE`, `SERVICE` | Uppercase chip |
| Service icon       | Airplane, bed, boat, car, star, document, etc.                                                         | By type        |
| Title              | Brand, airline, `Private jet`, yacht charter title, etc.                                               |                |
| Detail line        | e.g. `Paris · Deluxe Suite`, `DEL → BOM`, `Sanlorenzo SL78 · 8 hours`                                  | Optional       |
| Status             | `Confirmed` / `Cancelled`                                                                              | Optional       |
| Open action        | Navigate to active trip                                                                                | Row press      |

### List row data by service type

| Service                      | Type label    | Title (typical)        | Detail line (typical)     |
| ---------------------------- | ------------- | ---------------------- | ------------------------- |
| Hotel / hotel room extension | `HOTEL`       | Hotel brand / property | `{city} · {room[, view]}` |
| Air / extras / reissue       | `FLIGHT`      | Airline / category     | Route                     |
| Private jet                  | `PRIVATE JET` | `Private jet`          | Route / destination       |
| Yacht                        | `YACHT`       | Charter title          | Brand · duration          |
| Airport VIP                  | `AIRPORT VIP` | Service name           | Meet & assist / notes     |
| Chauffeur                    | `CHAUFFEUR`   | Service name           | Route / city              |
| Visa                         | `VISA`        | Service name           | Destination               |
| Experiences                  | `EXPERIENCE`  | Service name           | Destination               |
| Other                        | `SERVICE`     | Service name / `Other` | Destination / route       |

---

## B. Active trip — shared shell (all services)

Shown on every active booking detail, regardless of service.

### Navigation & load states

| Data              | Example / shape                         |
| ----------------- | --------------------------------------- |
| Back label        | `Itinerary`                             |
| Loading           | Spinner                                 |
| Not found / error | `Booking not found.` or load error text |
| Retry             | `Retry` / `Retrying…`                   |

### Header & status

| Data               | Example / shape                                                                                       | Notes                         |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------- |
| Title              | Service-specific headline                                                                             | Required                      |
| Subtitle           | Secondary line                                                                                        | Optional                      |
| Service type chip  | `Hotel`, `Air`, `Yacht`, `Airport VIP`, `Chauffeur`, `Private jet`, `Visa`, `Experiences`, `Other`, … |                               |
| Status             | `Confirmed` / `Cancelled`                                                                             |                               |
| Confirmation badge | `Confirmation MO-PAR-449120`                                                                          | When present                  |
| Inclusion badge    | `Included in your trip`                                                                               | VIP / chauffeur (and similar) |
| Payment label      | `Paid in full` / `Deposit paid`                                                                       | When present                  |

### DETAILS block

| Data            | Notes                                                             |
| --------------- | ----------------------------------------------------------------- |
| Section heading | `DETAILS`                                                         |
| Detail rows     | Uppercase **label** + **value** pairs (service-specific — see §C) |
| Telephone rows  | Value + phone affordance                                          |

### Documents

| Data            | Example / shape                               |
| --------------- | --------------------------------------------- |
| Section heading | `DOCUMENTS`                                   |
| Document name   | Trip title or `Trip voucher`                  |
| Actions         | `View` · `Download`                           |
| Empty           | `No documents released for this service yet.` |

### Cancellation (when present)

| Data            | Example / shape           |
| --------------- | ------------------------- |
| Section heading | `CANCELLATION TERMS`      |
| Body            | Free-text terms paragraph |

### Concierge CTA (when enabled)

| Data    | Example / shape                     |
| ------- | ----------------------------------- |
| Eyebrow | `ANYTHING TO ADJUST?`               |
| Message | `Message Godwit about this booking` |

---

## C. Active trip — service-specific visible data

### Hotel & hotel room extension

| Area           | Data                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| Title          | Property / hotel name                                                                        |
| Subtitle       | `{room type} - {n} nights`                                                                   |
| DETAILS rows   | `ROOM`, `CHECK-IN`, `CHECK-OUT`, `NIGHTS`, `MEAL PLAN`, `ADDRESS`, `TELEPHONE`, `TRAVELLERS` |
| Date shape     | e.g. `28 October 2026, 15:00`                                                                |
| Extra sections | `SPECIAL REQUESTS` (bullet list) · `YOUR GODWIT BENEFITS` (benefit title + optional note)    |
| Also           | Cancellation terms · Message Godwit · Documents                                              |

### Air / air extras / air reissue

| Area         | Data                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| Title        | e.g. `Emirates ABC123` or `Flight`                                                   |
| Subtitle     | Route e.g. `DEL → BOM`                                                               |
| Type chip    | `Air` / `Air extras` / `Air reissue`                                                 |
| DETAILS rows | `CARRIER`, `FLIGHT`, `DEPARTS`, `ARRIVES`, `CABIN`, `SEATS`, `BAGGAGE`, `TRAVELLERS` |
| Leg shape    | Rich: `Dubai (DXB) · 08:45 · Terminal 3` · or simple city + date                     |
| Also         | Cancellation terms · Message Godwit · Documents                                      |

### Private jet

| Area         | Data                                            |
| ------------ | ----------------------------------------------- |
| Title        | `Private jet`                                   |
| Subtitle     | Formatted route                                 |
| DETAILS rows | `CARRIER`, `AIRCRAFT`, `ROUTE`, `TRAVELLERS`    |
| Also         | Cancellation terms · Message Godwit · Documents |

### Yacht

| Area         | Data                                            |
| ------------ | ----------------------------------------------- |
| Title        | Charter title e.g. `Day charter, Capri`         |
| Subtitle     | Yacht brand / category (when applicable)        |
| DETAILS rows | `BEGINS`, `ENDS`, `INCLUDED`, `TRAVELLERS`      |
| Date shape   | e.g. `18 September 2026, 09:30`                 |
| Included     | Description items joined (e.g. with `·`)        |
| Confirmation | `Confirmation {bookingReference}` when present  |
| Also         | Cancellation terms · Message Godwit · Documents |

### Airport VIP

| Area          | Data                                                   |
| ------------- | ------------------------------------------------------ |
| Title         | `Airport VIP`                                          |
| Subtitle      | Service type e.g. `Meet & assist, Brand`               |
| Inclusion     | `Included in your trip`                                |
| DETAILS rows  | `AIRPORT`, `SERVICE`, `TIME`, `INCLUDED`, `TRAVELLERS` |
| Airport shape | `{city}, Terminal {n}` when terminal exists            |
| Also          | Cancellation terms · Message Godwit · Documents        |

### Chauffeur

| Area            | Data                                            |
| --------------- | ----------------------------------------------- |
| Title           | `Chauffeur`                                     |
| Subtitle        | Route (`A → B` style)                           |
| Inclusion       | `Included in your trip`                         |
| DETAILS rows    | `VEHICLE`, `ROUTE`, `TRAVELLERS`                |
| Vehicle default | `Chauffeur` if category missing                 |
| Also            | Cancellation terms · Message Godwit · Documents |

### Visa · Experiences · Other (generic)

| Area         | Data                                            |
| ------------ | ----------------------------------------------- |
| Title        | Service name / description / type label         |
| Subtitle     | Destination city or route                       |
| Type chip    | `Visa` / `Experiences` / `Other`                |
| DETAILS rows | `SERVICE`, `DATE`, `DESTINATION`, `TRAVELLERS`  |
| Also         | Cancellation terms · Message Godwit · Documents |

> **Villa:** No dedicated active-trip type in sales today. If surfaced, treat as **generic / other** unless CRM mapping is added.

---

## Fixed strings checklist

### Trips list

`Trips` · `Everything arranged, In order.` · `Current` · `Upcoming` · `Past` · `Loading client session…` · `Looking for upcoming bookings…` · `Could not load upcoming trips.` · `No upcoming trips for this client.` · `DATE TBD` · `Confirmed` · `Cancelled` · time `—`

### Active trip shared

`Itinerary` · `Booking not found.` · `Retry` · `Retrying…` · `DETAILS` · `DOCUMENTS` · `View` · `Download` · `No documents released for this service yet.` · `Trip voucher` · `CANCELLATION TERMS` · `ANYTHING TO ADJUST?` · `Message Godwit about this booking` · `SPECIAL REQUESTS` · `YOUR GODWIT BENEFITS` · `Paid in full` · `Deposit paid` · `Included in your trip` · `Confirmed` · `Cancelled`

---

## Restructure notes

1. Use **Current layout** as the baseline to redesign; you may change structure freely.
2. Preserve the **visible data sets** (sections A–C) unless product drops a field.
3. Keep **Current / Upcoming / Past** as distinct list modes.
4. Keep **shared active-trip shell** + **per-service DETAILS rows** as the detail content contract.
5. Prefer brand tokens (`forest` / `sand`) over one-off colors.
6. Empty-list copy is currently identical across segments — decide intentionally in the new UI.

---

_Content + current-layout baseline for Trips tab and Active Trip UI restructure._
