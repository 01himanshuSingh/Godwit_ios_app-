# Trips — Firestore / Instant Sale context (for CRM)

**Audience:** CRM / backend team  
**Purpose:** Explain how the Godwit **iOS client app** reads trip data from Firestore, which collection and fields it uses per service, and how those map to the Trips list and Active Trip detail screens.  
**Status:** As implemented in the mobile app today (direct Firestore reads). Long-term product architecture may move these behind a BFF `/v1` API; field expectations below should still stay stable.

---

## 1. One-line model

> A **trip** on the mobile app is **one Instant Sale document**.  
> There is **no** separate `trips` collection.

```text
admins/{adminId}/clients/{clientId}/sales/{saleId}
```

| Concept in app        | Firestore / CRM                                              |
| --------------------- | ------------------------------------------------------------ |
| Trip / booking detail | Instant Sale doc `sales/{saleId}`                            |
| `saleId`              | `saleId` or `customerVisitId` or document id                 |
| Service line          | Usually `serviceModelList[0]` + `walkInModel`                |
| Service kind          | Prefer stamped `serviceKind`; else inferred from names/flags |

---

## 2. What the app reads

### Trips list (Upcoming)

| Step            | What happens                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Path            | Paginated `getDocs` on `admins/{adminId}/clients/{clientId}/sales`                                     |
| Order           | `orderBy(documentId())`, page size 40                                                                  |
| Filter (in app) | Active sales only (`saleStatus` / `status` ≠ `false`); date bucket **upcoming** or **current** (today) |
| UI              | Grouped by travel date                                                                                 |

**Code:** `src/lib/firebase/sales/getClientUpcomingSales.ts`

### Active Trip detail

| Step                    | What happens                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Path                    | Single `getDoc` on `admins/.../sales/{saleId}`                                                         |
| Extra read (hotel only) | If `preferredPartnershipId` is set → `admins/{adminId}/preferredPartnerships/{id}` for Godwit benefits |
| UI                      | Service-specific DETAIL rows (Hotel / Air / VIP / Chauffeur / Generic)                                 |

**Code:** `src/lib/firebase/sales/getActiveTripDetail.ts` + service folders under `hotelServices/`, `airServices/`, `vipServices/`

### Tenant scope

Mobile always scopes by **`adminId` + `clientId`** (from active client profile / session / navigation params). It never lists sales across tenants.

---

## 3. Shared Instant Sale shape (all services)

The app expects Instant Sale documents to look roughly like this (only fields the app actually uses):

```text
sales/{saleId}
├── saleId | customerVisitId
├── adminId, clientId
├── serviceKind                    ← preferred service stamp (see §4)
├── serviceName
├── saleStatus | status            ← false = cancelled
├── confirmationNo
├── hotelBrand | customHotelBrand | nameOfHotel | hotelAirlines
├── preferredPartnershipId         ← hotel benefits lookup
├── travellers[]                   ← { id, name, role? }
├── depositModel                   ← { balanceAmount, initialAmount } → Paid / Deposit
├── walkInModel { ... }            ← primary Instant Sale form payload
├── bookModel { ... }              ← dates / address fallbacks
└── serviceModelList[0] {
      serviceName,
      isHotelRoomExtension?, isAirExtras?, isAirReissue?,
      additionalFields | additionalProperties  ← form sections with fieldKey/value
    }
```

### How the app resolves a field (priority)

Different mappers use slight variants; the usual Instant Sale pattern is:

1. **`serviceModelList[0]` form** — `additionalFields` / `additionalProperties` → section → `fields[]` where `fieldKey` matches
2. **`walkInModel.{key}`**
3. **`bookModel.{key}`** (when used)
4. **Top-level sale `{key}`**
5. **Direct `serviceModelList[0].{key}`**

Form field values are read from `value` | `dateValue` | `textValue`.

### Travellers (all services)

| Priority | Source                                                         |
| -------- | -------------------------------------------------------------- |
| 1        | `travellers[].name`                                            |
| 2        | `walkInModel.guestNames[]` (+ `guestNameList` for ids on list) |

### Status / payment

| UI           | Source                                       |
| ------------ | -------------------------------------------- |
| Cancelled    | `saleStatus === false` OR `status === false` |
| Confirmed    | otherwise                                    |
| Paid in full | `depositModel.balanceAmount <= 0`            |
| Deposit paid | `depositModel.initialAmount > 0`             |

### Cancellation terms (any service)

From `walkInModel` (applied on detail for all services):

| CRM-ish field                             | Used for                    |
| ----------------------------------------- | --------------------------- |
| `cancellationPolicyType`                  | Refundable / Non-Refundable |
| `cancellationText` / `cancellationPolicy` | Policy body                 |
| `cancellationDate`                        | Free-cancel-by date         |

**Code:** `hotelServices/extractHotelCancellationTerms.ts` (name says hotel; used for any sale with these walkIn fields)

---

## 4. Service type detection (`serviceKind`)

Preferred: stamp **`serviceKind`** on the sale with one of:

| `serviceKind` value  | App label            |
| -------------------- | -------------------- |
| `hotel`              | Hotel                |
| `hotelRoomExtension` | Hotel room extension |
| `air`                | Air                  |
| `airExtras`          | Air extras           |
| `airReissue`         | Air reissue          |
| `chauffeur`          | Chauffeur            |
| `vip`                | Airport VIP          |
| `visa`               | Visa                 |
| `experiences`        | Experiences          |
| `other`              | Other                |

If `serviceKind` is missing, the app **infers** from:

- Flags: `serviceModelList[0].isHotelRoomExtension`, `isAirExtras`, `isAirReissue`
- Name substrings on `serviceName` / `serviceModelList[0].serviceName`: hotel, vip, meet and greet, chauffeur, air, flight, visa, experiences, transfer, car, …

**Ask for CRM:** Please always set **`serviceKind`** explicitly so list + detail routing stay correct.

---

## 5. Trips list — fields → UI

List card model: `ClientSaleTrip`.

| List UI                  | Firestore sources (priority / notes)                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Travel date / grouping   | `walkIn.travelDateKey` → `walkIn.travelDate` → top `travelDateKey` / `travelDate` (string or Timestamp)                                                                            |
| End date                 | `walkIn.returnDate` → `walkIn.endDate` → `bookModel.endDate` → top `endDate`                                                                                                       |
| Destination              | `walkIn.destinationCity`                                                                                                                                                           |
| Title (hotel)            | `hotelBrand` → `customHotelBrand` → walkIn same → `nameOfHotel` → `hotelAirlines`                                                                                                  |
| Title (air)              | Prefer **`walkIn.category`** (selected airline), then `hotelAirlines` / `serviceName` / type label                                                                                 |
| Title (private jet)      | Always **"Private jet"** (route on detail line from `walkIn.route`)                                                                                                                |
| Type label (private jet) | **PRIVATE JET** when `serviceKind` is `privateJet` or service name contains “private jet”                                                                                          |
| Title (other)            | `hotelBrand` / `serviceName` / walkIn `hotelAirlines` / first service name / type label                                                                                            |
| Time                     | `walkIn.checkInTime`, `departureTime`, `arrivalTime`, `pickupTime`, `time`, `flightTime`, top `checkInTime`, or time embedded in travelDate; **hotel defaults to `15:00`** if none |
| Detail line (hotel)      | `{destinationCity} · {room}` where room = `roomType`/`roomName` + optional `roomView`/`view`                                                                                       |
| Detail line (air)        | `walkIn.route` or destination                                                                                                                                                      |
| Detail line (vip)        | `walkIn.notes` / `walkIn.serviceType` / `Meet & assist, {city}`                                                                                                                    |
| Detail line (chauffeur)  | `walkIn.route` / destination / `serviceType`                                                                                                                                       |
| Status                   | Cancelled if inactive; else Confirmed                                                                                                                                              |
| Confirmation             | `confirmationNo`                                                                                                                                                                   |

---

## 6. Active Trip detail — by service

### 6.1 Hotel (`hotel` | `hotelRoomExtension`)

**UI rows:** ROOM → CHECK-IN → CHECK-OUT → NIGHTS → MEAL PLAN → ADDRESS → TELEPHONE → TRAVELLERS  
Plus cards: Special requests, Cancellation terms, Godwit benefits.

| UI                 | CRM / Firestore fields (app lookup order)                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title (hotel name) | Form/walkIn/top: `nameOfHotel`, `hotelBrand`, `customHotelBrand`, `hotelAirlines` → top `hotelBrand` / `serviceName`                                                                                                    |
| Subtitle           | `{ROOM} - {N nights}`                                                                                                                                                                                                   |
| Confirmation badge | Prefer top-level `confirmationNo`; else form/walkIn: `confirmationNo`, `bookingReference`, `pnr`, `hotelConfirmationNo`                                                                                                 |
| **ROOM**           | **Primary CRM field today: `walkInModel.route`** (comma-joined selected rooms). Fallback: `walkIn.roomType` / `roomName` / `room` (+ `roomView`/`view`), top `roomType`, form `roomType`/`roomName`/`route`             |
| **CHECK-IN**       | `checkInDate`, `checkIn`, `travelDate`, `travelDateKey`, `startDate` — default display time **15:00** if date-only                                                                                                      |
| **CHECK-OUT**      | `checkOutDate`, `checkOut`, `returnDate`, `endDate`, `departureDate` — default display time **12:00** if date-only                                                                                                      |
| **NIGHTS**         | Computed from check-in / check-out dates                                                                                                                                                                                |
| **MEAL PLAN**      | `mealPlan`, `boardBasis`                                                                                                                                                                                                |
| **ADDRESS**        | `addressOfHotel`, `hotelAddress`, `address`                                                                                                                                                                             |
| **TELEPHONE**      | `hotelPhone`, `telephone`, `phone`, `contactPhone`                                                                                                                                                                      |
| **TRAVELLERS**     | See §3                                                                                                                                                                                                                  |
| Special requests   | `specialRequests`, `specialRequest`, `requests` (split on newlines / bullets)                                                                                                                                           |
| Cancellation       | See §3                                                                                                                                                                                                                  |
| Godwit benefits    | Sale only has `preferredPartnershipId` → load `admins/{adminId}/preferredPartnerships/{id}` → `linkedSuppliers[].standardBenefits` (match hotel) or partnership `standardBenefits`; fallback sale form `godwitBenefits` |

**Important CRM note (hotel room):** Instant Sale currently stores selected room type(s) on **`walkInModel.route`**. The app treats that as ROOM. If CRM later moves rooms to a dedicated field, keep writing `route` or align with the app team.

---

### 6.2 Air (`air` | `airExtras` | `airReissue`)

**UI rows:** CARRIER / FLIGHT / DEPARTS / ARRIVES / CABIN / SEATS / BAGGAGE / TRAVELLERS

| UI                    | CRM / Firestore fields                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title                 | Carrier / airline — prefer **`walkIn.category`** (e.g. "Emirates"), then `hotelAirlines`, `airline`, `carrier`, `airlineName`, or `serviceName`              |
| Subtitle              | Route arrow-normalized from `route`                                                                                                                          |
| Confirmation / PNR    | Prefer `walkIn.bookingReference` / `walkIn.pnr`; else top `confirmationNo`                                                                                   |
| **CARRIER**           | Prefer **`walkInModel.category`** (CRM selected airline). Fallbacks: `hotelAirlines`, `airline`, `carrier`, `airlineName`, `serviceName`                     |
| **FLIGHT**            | `flightNumber`, `flightNo`, `flight` — if missing, PNR may show here on Instant Sale                                                                         |
| **DEPARTS / ARRIVES** | Prefer `walkIn.airLegs[]` (city/code, departureTime/arrivalTime, terminals). Else Instant Sale: split `route` (e.g. `DEL-BOM`) + `travelDate` / `returnDate` |
| **CABIN**             | `cabinClass`, `cabin`, `class`                                                                                                                               |
| **SEATS**             | `seats`, `seatNumbers`, `seat`, `seatPreference`                                                                                                             |
| **BAGGAGE**           | `baggage`, `baggageAllowance`, `luggage`                                                                                                                     |
| **TRAVELLERS**        | See §3                                                                                                                                                       |

**Optional richer structure:** `walkInModel.airLegs[]` with airport city/code, times, terminals — used when present.

---

### 6.3 Airport VIP (`vip`)

**UI rows:** AIRPORT / SERVICE / TIME / INCLUDED / TRAVELLERS  
Badge: “Included in your trip”

| UI             | Instant Sale / walkIn field (CRM label → storage)                                             |
| -------------- | --------------------------------------------------------------------------------------------- |
| **AIRPORT**    | `destinationCity` (City Name) + optional `terminal` / `arrivalTerminal` / `departureTerminal` |
| **SERVICE**    | `serviceType` (Service Type) + optional `category` (brand)                                    |
| **TIME**       | `travelDate` (Service Date) — often date-only (midnight → no clock)                           |
| **INCLUDED**   | **`walkIn.route`** ← CRM “VIP Description” (split on commas → middle dots)                    |
| **TRAVELLERS** | See §3                                                                                        |

**Important CRM note (VIP):** “VIP Description” is stored on **`walkInModel.route`** (same field name as hotel room). Please keep that contract or coordinate a rename with mobile.

---

### 6.4 Chauffeur (`chauffeur`)

**UI rows:** VEHICLE → ROUTE → TRAVELLERS  
(No pick-up / drop-off — Instant Sale stores itinerary on `route` only.)  
Title: “Chauffeur”; subtitle = route; badge “Included in your trip”

**Code:** `src/lib/firebase/sales/chauffeurServices/` + `src/features/trips/chauffeur/`

| UI             | Fields                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subtitle       | Prefer **`walkIn.route`**                                                                                                                                              |
| **VEHICLE**    | Prefer **`walkInModel.category`** (selected vehicle / chauffeur package). Fallbacks: `chauffeurVehicleDescription`, `vehicleType`, `vehicle`, `carType`, `description` |
| **ROUTE**      | Prefer **`walkIn.route`**                                                                                                                                              |
| **TRAVELLERS** | See §3                                                                                                                                                                 |

---

### 6.5 Private jet (`privateJet`)

**UI rows:** CARRIER → AIRCRAFT → ROUTE → TRAVELLERS  
(No DEPARTS / ARRIVES — itinerary is a single **`walkIn.route`** line.)  
Title: “Private jet”; subtitle = route

**Code:** `src/lib/firebase/sales/privateJetServices/` + `src/features/trips/private-jet/`  
(Not Phase 2 Avinode `features/private-jets`.)

| UI             | Fields                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **CARRIER**    | Prefer **`walkIn.serviceType`** (Operator). Fallbacks: `bookingSource`, `supplier`, `operator`, `carrier`, top `serviceName` |
| **AIRCRAFT**   | Prefer **`walkIn.category`** (Aircraft Type). Fallbacks: form/walkIn `aircraftType`, `aircraft`, `vehicleType`               |
| **ROUTE**      | Prefer **`walkIn.route`**                                                                                                    |
| **TRAVELLERS** | See §3                                                                                                                       |

### 6.6 Generic (`visa` | `experiences` | `other`)

| UI              | Fields                                            |
| --------------- | ------------------------------------------------- |
| Title / SERVICE | `serviceName` or form `description` or type label |
| DATE            | `travelDate`, `startDate`, `serviceDateTime`      |
| DESTINATION     | `destinationCity`, `cityName`, `route`            |
| TRAVELLERS      | See §3                                            |

---

## 7. Field collisions CRM should be aware of

| Field                  | Hotel                 | VIP              | Air               | Chauffeur   |
| ---------------------- | --------------------- | ---------------- | ----------------- | ----------- |
| `walkInModel.route`    | Selected room type(s) | VIP Description  | Flight route      | **ROUTE**   |
| `walkInModel.category` | —                     | Brand (optional) | Airline (CARRIER) | **VEHICLE** |
| `hotelAirlines`        | Hotel name fallback   | —                | Airline fallback  | —           |
| `travelDate`           | Check-in date         | Service date     | Departure date    | Travel date |

Same key, different Instant Sale forms — mobile branches by **`serviceKind`**. Stamping `serviceKind` is critical.

---

## 8. Gaps the mobile app notices (`missingForMockup`)

When a field is empty, detail mappers may record missing keys (for debugging / Testing), e.g.:

- Hotel: `roomType`, `checkInDate`, `checkOutDate`, `mealPlan`, `addressOfHotel`, `telephone`, `specialRequests`, `godwitBenefits`, `cancellationPolicy`, `confirmationNo`
- VIP: airport, terminal, travelDate, vipDescription (`walkIn.route`), clock time
- Air: various flight mock fields when Instant Sale only has route + dates

These do **not** block the screen; empty UI rows/cards are hidden.

---

## 9. Code map (for engineers)

| Concern                | File                                                    |
| ---------------------- | ------------------------------------------------------- |
| List + service type    | `src/lib/firebase/sales/getClientUpcomingSales.ts`      |
| Detail orchestration   | `src/lib/firebase/sales/getActiveTripDetail.ts`         |
| Detail UI model        | `src/lib/firebase/sales/activeTripDetailTypes.ts`       |
| Hotel map + extractors | `src/lib/firebase/sales/hotelServices/`                 |
| Air map + extractors   | `src/lib/firebase/sales/airServices/`                   |
| VIP map + extractors   | `src/lib/firebase/sales/vipServices/`                   |
| Trips list screen      | `src/features/trips/screens/TripsScreen.tsx`            |
| Detail screen          | `src/features/trips/screens/ActiveTripDetailScreen.tsx` |
| Route                  | `src/app/trips/[saleId].tsx`                            |

---

## 10. Requests for CRM (summary)

1. Always set **`serviceKind`** on Instant Sales written for mobile clients.
2. Keep **hotel rooms** on `walkInModel.route` (or tell mobile before changing).
3. Keep **VIP description** on `walkInModel.route` (or align a dedicated field).
4. Prefer **top-level `confirmationNo`** for hotels; **`walkIn.bookingReference` / PNR** for air.
5. For hotel Godwit benefits, ensure **`preferredPartnershipId`** points at a real `preferredPartnerships` doc with `standardBenefits` / linked hotel benefits.
6. Use real check-out fields (`returnDate` / `endDate` / `checkOutDate`) so NIGHTS and CHECK-OUT populate.
7. Travellers: populate **`travellers[]`** (preferred) or `walkIn.guestNames`.

---

_Generated from the Godwit iOS app Instant Sale readers. Share this file with CRM when aligning Instant Sale form field keys._
