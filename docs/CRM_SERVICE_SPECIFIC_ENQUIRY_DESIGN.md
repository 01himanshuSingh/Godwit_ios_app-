# Godwit CRM — Service-Specific Enquiry & 1-Click Instant Sale ("Book") System Design

**Role / Perspective:** Senior System Design Specification (Mobile Client App + Godwit Web CRM)  
**Target Firestore Path:** `admins/{adminId}/enquiries/{enquiryId}`  
**Downstream Conversion Path:** `admins/{adminId}/clients/{clientId}/sales/{saleId}` (Instant Sale)

---

## Table of Contents

1. [Executive Summary & Design Principles](#1-executive-summary--design-principles)
2. [End-to-End System Architecture & Lifecycle Flow](#2-end-to-end-system-architecture--lifecycle-flow)
3. [Canonical Firestore Data Contract (Single Source of Truth)](#3-canonical-firestore-data-contract-single-source-of-truth)
4. [Deliverable 1 — Client App Screens & Collected Keys per Service](#4-deliverable-1--client-app-screens--collected-keys-per-service)
5. [Deliverable 2 — Ready-to-Paste Sample Firestore Documents (All 8 Services)](#5-deliverable-2--ready-to-paste-sample-firestore-documents-all-8-services)
6. [Deliverable 3 — Field Audit: Non-Contract App Fields, Current Bugs & Missing UI Inputs](#6-deliverable-3--field-audit-non-contract-app-fields-current-bugs--missing-ui-inputs)
7. [Deliverable 4 — `serviceName` & `serviceId` Catalog Alignment](#7-deliverable-4--servicename--serviceid-catalog-alignment)
8. [CRM Restructured Service-Specific Enquiry Page Design](#8-crm-restructured-service-specific-enquiry-page-design)
9. ["Book" (`Make Sale`) → Instant Sale Auto-Prefill Engine](#9-book-make-sale--instant-sale-auto-prefill-engine)
10. [State Machine, Concurrency, Indexes & Rollout Plan](#10-state-machine-concurrency-indexes--rollout-plan)

---

## 1. Executive Summary & Design Principles

Historically, CRM enquiries behaved as generic free-text notes, forcing staff to re-type client requests into **Instant Sale** when converting an enquiry into a booking.

We are restructuring Godwit Enquiries around **four core engineering invariants**:

1. **One Enquiry = One Service:** Every enquiry document represents exactly **one** bookable service (`hotel`, `flight`, `private_jet`, `villa`, `yacht`, `car_chauffeur`, `airport_vip`, or `other`). Multi-component trips create multiple single-service enquiries (optionally linked by a shared `tripGroupId` metadata tag in the future, never bundled into one polymorphic blob).
2. **Symmetric Producer Contract ("Two Producers, One Schema, One Consumer"):** Whether an enquiry is created **automatically by the iOS Client App** (`source: "client_app"`, `createdByType: "client"`) or **manually by CRM Staff** (`source: "crm_manual"`, `createdByType: "staff"`), both write the **exact same `enquiryModel` service keys and `appCategory`**.
3. **Strict Semantic Purity on Overloaded Keys (`route` & `category`):** Instant Sale reuses `walkInModel.route` and `walkInModel.category` across services with service-specific meanings (e.g. Hotel `route` = Room Type; Flight `category` = Airline; Private Jet `category` = Aircraft Type; Chauffeur `category` = Vehicle Type). **Room counts, bedroom counts, and guest/passenger counts must NEVER be written into `route` or `category`.**
4. **Zero-Loss 1-Click "Book" (`Make Sale`) Conversion:** Clicking **Book** on any open enquiry opens **Instant Sale** pre-selected to the matching service tab with all structured fields hydrated into form inputs, and any non-form context (room count, bedroom count, guest breakdown, charter duration, special chips) deterministically formatted into `remarks` under an `App request` / `Enquiry summary` block.

---

## 2. End-to-End System Architecture & Lifecycle Flow

```text
┌────────────────────────────────────┐       ┌────────────────────────────────────┐
│      PRODUCER A: iOS Client App    │       │    PRODUCER B: CRM Staff Manual    │
│  New Request 4-Step Service Wizard │       │   CRM "New Enquiry" Service Form   │
│  source: "client_app"              │       │   source: "crm_manual"             │
│  createdByType: "client"           │       │   createdByType: "staff"           │
└─────────────────┬──────────────────┘       └─────────────────┬──────────────────┘
                  │                                            │
                  └────────────────────┬───────────────────────┘
                                       ▼
             ┌───────────────────────────────────────────────────┐
             │     Shared Service-Specific Schema Validator      │
             │  • Enforces appCategory ∈ 8 canonical categories  │
             │  • Enforces YYYY-MM-DD / ISO date strings         │
             │  • Blocks counts in route / category              │
             └─────────────────────────┬─────────────────────────┘
                                       ▼
             ┌───────────────────────────────────────────────────┐
             │  Firestore: admins/{adminId}/enquiries/{enquiryId}│
             │  Top-level envelope + serviceModelList +          │
             │  enquiryModel (status: 0 Open)                    │
             └─────────────────────────┬─────────────────────────┘
                                       ▼
             ┌───────────────────────────────────────────────────┐
             │      CRM Restructured Enquiries Workspace         │
             │  • Filterable Queue (Service, Source, Status)     │
             │  • Service-Specific Structured Detail Drawer      │
             │  • Inline Edit (same polymorphic service form)    │
             │  • Primary CTA: [ Book ] (Make Sale)              │
             └─────────────────────────┬─────────────────────────┘
                                       │ Staff clicks [ Book ]
                                       ▼
             ┌───────────────────────────────────────────────────┐
             │     Instant Sale Prefill Hydrator (Read-Only)     │
             │  Route: /instant-sale?enquiryId={enquiryId}       │
             │  1. Selects tab via serviceId / serviceName       │
             │  2. Hydrates client + primary traveller           │
             │  3. Maps enquiryModel.* → Instant Sale fields     │
             │  4. Appends unmapped keys to remarks block        │
             └─────────────────────────┬─────────────────────────┘
                                       │ Staff completes commercial/supplier
                                       │ details & clicks [ Save Sale ]
                                       ▼
             ┌───────────────────────────────────────────────────┐
             │          Atomic Firestore WriteBatch              │
             │  1. SET admins/{adminId}/clients/{clientId}/      │
             │         sales/{saleId} (stamps serviceKind +      │
             │         enquiryId back-reference)                 │
             │  2. UPDATE admins/{adminId}/enquiries/{enquiryId} │
             │         enquiryModel.status = 1 (Sold), saleId,   │
             │         endStaffId, endStaffName, endDate         │
             └───────────────────────────────────────────────────┘
```

---

## 3. Canonical Firestore Data Contract (Single Source of Truth)

### 3.1 Top-Level Document (`admins/{adminId}/enquiries/{enquiryId}`)

| Field              | Type                                | Client App Value               | CRM Staff Manual Value         | Notes                                              |
| :----------------- | :---------------------------------- | :----------------------------- | :----------------------------- | :------------------------------------------------- |
| `enquiryId`        | `string`                            | Document ID                    | Document ID                    | Client-generated ID for idempotent retries         |
| `adminId`          | `string`                            | Tenant ID                      | Tenant ID                      | Scope root                                         |
| `branchId`         | `string`                            | Resolved branch ID             | Staff's active branch ID       | Required                                           |
| `date`             | `Timestamp`                         | Creation timestamp             | Creation timestamp             | Server/client Firestore `Timestamp`                |
| `status`           | `boolean`                           | `true`                         | `true`                         | `false` only if soft-deleted                       |
| `clientId`         | `string`                            | Signed-in `clientId`           | Selected `clientId`            | Links to `admins/{adminId}/clients/{clientId}`     |
| `clientName`       | `string`                            | Client display name            | Selected client name           | Denormalized for table search                      |
| `travellerId`      | `string`                            | Lead traveller `customerId`    | Selected `customerId`          | Primary traveller ID                               |
| `travellerName`    | `string`                            | Lead traveller name            | Selected traveller name        | Primary traveller name                             |
| `travellerMobile`  | `string`                            | Lead traveller mobile          | Selected traveller mobile      | Primary traveller phone                            |
| `customerId`       | `string`                            | `= travellerId`                | `= travellerId`                | Legacy CRM compatibility mirror                    |
| `name`             | `string`                            | `= travellerName`              | `= travellerName`              | Legacy CRM compatibility mirror                    |
| `mobile`           | `string`                            | `= travellerMobile`            | `= travellerMobile`            | Legacy CRM compatibility mirror                    |
| `source`           | `string`                            | `"client_app"`                 | `"crm_manual"`                 | Identifies origin channel                          |
| `createdByType`    | `string`                            | `"client"`                     | `"staff"`                      | Actor class                                        |
| `serviceIdList`    | `string[]`                          | `[serviceId]`                  | `[serviceId]`                  | Single-element array with exact Godwit `serviceId` |
| `serviceModelList` | `Array<{ serviceId, serviceName }>` | `[{ serviceId, serviceName }]` | `[{ serviceId, serviceName }]` | Exact Godwit `serviceName`                         |
| `enquiryModel`     | `object`                            | See §3.2                       | See §3.2                       | Polymorphic service payload                        |

### 3.2 `enquiryModel` Common Envelope

| Field             | Type          | Required    | Value / Rules                                                                                                                    |
| :---------------- | :------------ | :---------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `status`          | `0 \| 1 \| 2` | Yes         | `0` = Open, `1` = Sold (Booked), `2` = Cancelled                                                                                 |
| `serviceId`       | `string`      | Yes         | Must match `serviceModelList[0].serviceId`                                                                                       |
| `serviceName`     | `string`      | Yes         | Must match `serviceModelList[0].serviceName`                                                                                     |
| `source`          | `string`      | Yes         | `"client_app"` (or `"crm_manual"` when staff-created; CRM prefill checks `source === "client_app"` OR presence of `appCategory`) |
| `appCategory`     | `string`      | Yes         | `hotel` \| `flight` \| `private_jet` \| `villa` \| `yacht` \| `car_chauffeur` \| `airport_vip` \| `other`                        |
| `remarks`         | `string`      | Conditional | Human-readable summary + notes                                                                                                   |
| `additionalNotes` | `string`      | Conditional | Raw free-text notes typed by client/staff                                                                                        |

---

## 4. Deliverable 1 — Client App Screens & Collected Keys per Service

In the iOS app (`src/features/requests/`), the user enters `RequestsScreen` (`"What can we arrange?"` 2×4 service grid) and opens a **4-tab wizard** (`RequestWizardShell`) per service. Every wizard ends with `Step 4: Review` (summary + `"Send to Godwit"` CTA, no new inputs).

Below is the exact screen-by-screen inventory of what the app collects today vs. the contract keys.

### 4.1 Hotel — `HotelRequestScreen` → `HotelRequestWizard` (`appCategory: "hotel"`)

| Wizard Tab        | UI Controls on Screen                                                                                                                       | Contract Keys Collected                                                         | Contract Keys NOT Yet on Screen                                                                                                                                    |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Stay**       | City autocomplete, Check-in / Check-out range calendar, Preferred hotel picker + brand quick-select chips, Number of rooms stepper (`1–20`) | `destinationCity`, `checkInDate`, `checkOutDate`, `preferredHotel`, `roomCount` | `route` (Room type, e.g. `"Deluxe Sea View"` — not asked in app UI today; **must be omitted/empty, never set to `roomCount`**)                                     |
| **2. Travellers** | Adults, Children, Infants steppers                                                                                                          | `adults`, `children`, `infants`                                                 | Lead traveller selector (`travellerId`, `travellerName`, `travellerMobile` — hook `useRequestTravellers` exists, needs wiring/auto-default to Principal traveller) |
| **3. Notes**      | Free-text notes + quick chips (`Late check-in`, `Ski-in/ski-out`, `Adjoining rooms`, `Anniversary`, `Dietary needs`, `Airport transfer`)    | `additionalNotes`, `remarks`                                                    | —                                                                                                                                                                  |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                                                        | Submits document                                                                | —                                                                                                                                                                  |

### 4.2 Flight — `FlightRequestScreen` → `FlightRequestWizard` (`appCategory: "flight"`)

| Wizard Tab        | UI Controls on Screen                                                                                                                                                                                    | Contract Keys Collected                                                                                                                 | Contract Keys NOT Yet on Screen                                             |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **1. Trip**       | Trip type segmented control (`One Way` / `Round Trip`), Flying from airport search, Flying to airport search, Departure / Return calendar, Preferred airline picker + quick-select, Cabin class selector | `tripType`, `flyingFrom`, `flyingTo`, `route` (optional `"from → to"`), `departureDate`, `returnDate`, `preferredAirline`, `cabinClass` | — (All service contract keys are collected)                                 |
| **2. Travellers** | Adults, Children, Infants steppers                                                                                                                                                                       | `adults`, `children`, `infants`                                                                                                         | Lead traveller identity (`travellerId`, `travellerName`, `travellerMobile`) |
| **3. Notes**      | Free-text notes + quick chips (`Window seat`, `Extra legroom`, `Special meal`, `Lounge access`, `Fast track`, `Assistive needs`)                                                                         | `additionalNotes`, `remarks`                                                                                                            | —                                                                           |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                                                                                                                     | Submits document                                                                                                                        | —                                                                           |

### 4.3 Private Jet — `PrivateJetRequestScreen` → `PrivateJetRequestWizard` (`appCategory: "private_jet"`)

| Wizard Tab        | UI Controls on Screen                                                                                                                      | Contract Keys Collected                                        | Contract Keys NOT Yet on Screen                                                                                                                                                            |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Trip**       | Trip type segmented control (`One Way` / `Round Trip`), Flying from airport/FBO, Flying to airport/FBO, Departure (+ Return if Round Trip) | `tripType`, `flyingFrom`, `flyingTo`, `route`, `departureDate` | `category` (Aircraft type, e.g. `"Light Jet"` / `"Heavy Jet"` — not asked in UI today; **must be omitted/empty until UI adds optional aircraft preference, never set to passenger count**) |
| **2. Travellers** | Single `Passengers` stepper (`1–20`)                                                                                                       | `passengers`                                                   | `adults`, `children`, `infants` (contract allows `or passengers`), Lead traveller identity                                                                                                 |
| **3. Notes**      | Free-text notes + quick chips (`Catering`, `Ground transfer`, `Pet onboard`, `Wi-Fi`, `Flexible timing`)                                   | `additionalNotes`, `remarks`                                   | —                                                                                                                                                                                          |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                                                       | Submits document                                               | —                                                                                                                                                                                          |

### 4.4 Villa — `VillaRequestScreen` → `VillaRequestWizard` (`appCategory: "villa"`)

| Wizard Tab        | UI Controls on Screen                                                                                                         | Contract Keys Collected                                      | Contract Keys NOT Yet on Screen                                                                                         |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **1. Stay**       | Destination search, Check-in / Check-out range calendar, Bedrooms stepper (`1–20`)                                            | `destinationCity`, `checkInDate`, `checkOutDate`, `bedrooms` | `category` (Villa type, optional), `route` (Specific area/estate only if distinct from city — **never `"5 Bedrooms"`**) |
| **2. Travellers** | Adults, Children, Infants steppers + Child age selectors                                                                      | `adults`, `children`, `infants`                              | Lead traveller identity                                                                                                 |
| **3. Notes**      | Free-text notes + quick chips (`Private chef`, `Pool heating`, `Staffed villa`, `Near beach`, `EV charger`, `Baby equipment`) | `additionalNotes`, `remarks`                                 | —                                                                                                                       |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                                          | Submits document                                             | —                                                                                                                       |

### 4.5 Yacht — `YachtRequestScreen` → `YachtRequestWizard` (`appCategory: "yacht"`)

| Wizard Tab     | UI Controls on Screen                                                                                                                   | Contract Keys Collected                                                            | Contract Keys NOT Yet on Screen                                                                |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **1. Charter** | Destination search, Charter start / end dates, Charter type segmented (`Private` / `Shared`), Duration time picker or `Flexible` toggle | `destinationCity`, `charterStartDate`, `charterEndDate`, `charterType`, `duration` | `category` (Yacht type, e.g. `"Motor Yacht"` / `"Catamaran"`, or party size text per contract) |
| **2. Guests**  | Single `Guests` stepper (`1–50`)                                                                                                        | `guests`                                                                           | `adults`, `children`, `infants` (contract allows `or guests`), Lead traveller identity         |
| **3. Notes**   | Free-text notes + quick chips (`Crewed`, `Watersports`, `Chef onboard`, `Marina berth`, `Celebration`)                                  | `additionalNotes`, `remarks`                                                       | —                                                                                              |
| **4. Review**  | Read-only summary + `Send to Godwit`                                                                                                    | Submits document                                                                   | —                                                                                              |

### 4.6 Chauffeur — `ChauffeurRequestScreen` → `ChauffeurRequestWizard` (`appCategory: "car_chauffeur"`)

| Wizard Tab        | UI Controls on Screen                                                                                                                                                                 | Contract Keys Collected                                                                                                       | Contract Keys NOT Yet on Screen                                                                                                      |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **1. Trip**       | City search, Service type sheet (`Airport Arrival`, `Airport Departure`, `Disposal`, `Self Drive`), Pick-up location, Drop-off location, Pick-up datetime, Return datetime (optional) | `destinationCity`, `serviceType`, `pickUpLocation`, `dropOffLocation`, `pickUpDateTime`, `returnDateTime`, `route` (optional) | `category` (Vehicle type, e.g. `"Mercedes S-Class"` / `"MPV / V-Class"` — not asked in UI today; **never put passenger count here**) |
| **2. Passengers** | Single `Number of passengers` stepper (`1–20`)                                                                                                                                        | Mapped to `adults` (with `children: 0`, `infants: 0` unless split stepper is used; see §6)                                    | Split `adults`, `children`, `infants` steppers, Lead traveller identity                                                              |
| **3. Notes**      | Free-text notes + quick chips (`Child seat`, `Meet & greet`, `Extra luggage`, `Quiet ride`, `Multilingual driver`)                                                                    | `additionalNotes`, `remarks`                                                                                                  | —                                                                                                                                    |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                                                                                                  | Submits document                                                                                                              | —                                                                                                                                    |

### 4.7 Airport VIP — `AirportVipRequestScreen` → `AirportVipRequestWizard` (`appCategory: "airport_vip"`)

| Wizard Tab        | UI Controls on Screen                                                                                             | Contract Keys Collected                                                | Contract Keys NOT Yet on Screen                                                                                                                               |
| :---------------- | :---------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Service**    | Airport search, Service type sheet (`Arrival`, `Departure`, `Transit`), Service start / optional end date         | `destinationCity`, `serviceType`, `serviceStartDate`, `serviceEndDate` | `route` (Terminal / flight details if collected separately), `category` (Service tier/option, e.g. `"VIP Lounge / Tarmac"`, optional — **never guest count**) |
| **2. Travellers** | Adults, Children, Infants steppers                                                                                | `adults`, `children`, `infants`                                        | Lead traveller identity                                                                                                                                       |
| **3. Notes**      | Free-text notes + quick chips (`Fast track`, `Lounge`, `Baggage assist`, `Meet on aircraft`, `Family assistance`) | `additionalNotes`, `remarks`                                           | —                                                                                                                                                             |
| **4. Review**     | Read-only summary + `Send to Godwit`                                                                              | Submits document                                                       | —                                                                                                                                                             |

### 4.8 Other ("Something else") — `SomethingElseRequestScreen` → `SomethingElseRequestWizard` (`appCategory: "other"`)

| Wizard Tab        | UI Controls on Screen                                                              | Contract Keys Collected                                                                        | Contract Keys NOT Yet on Screen                                                                                                                                              |
| :---------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Details**    | City or region search, When (`From` / optional `Until` dates)                      | `destinationCity`, `serviceStartDate` (or `checkInDate`), `serviceEndDate` (or `checkOutDate`) | `category` (Request type, e.g. `"Dining"` / `"Event Tickets"` — can be populated from selected chip only if appropriate, else omitted), `route` (Venue / itinerary if known) |
| **2. Travellers** | Adults, Children, Infants steppers                                                 | `adults`, `children`, `infants`                                                                | Lead traveller identity                                                                                                                                                      |
| **3. Notes**      | Free-text notes + quick chips (`Dining`, `Tickets`, `Experience`, `Gift`, `Other`) | `additionalNotes`, `remarks`                                                                   | —                                                                                                                                                                            |
| **4. Review**     | Read-only summary + `Send to Godwit`                                               | Submits document                                                                               | —                                                                                                                                                                            |

---

## 5. Deliverable 2 — Ready-to-Paste Sample Firestore Documents (All 8 Services)

> **Note on `date` and `serviceName`:** In Firestore SDK writes, `date` is stored as a Firestore `Timestamp` (shown as ISO string `"2026-11-20T09:00:00.000Z"` below for JSON pasteability). `serviceId` and `serviceName` use explicit placeholders (`<GODWIT_*_SERVICE_ID>`, `<GODWIT_*_SERVICE_NAME>`) pending live catalog confirmation in §7.

### 5.1 Hotel (`admins/{adminId}/enquiries/enq_hotel_001`)

```json
{
  "enquiryId": "enq_hotel_001",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:00:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_HOTEL_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_HOTEL_SERVICE_ID>",
      "serviceName": "<GODWIT_HOTEL_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_HOTEL_SERVICE_ID>",
    "serviceName": "<GODWIT_HOTEL_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "hotel",
    "destinationCity": "Courchevel",
    "preferredHotel": "Aman Le Mélézin",
    "checkInDate": "2026-12-20",
    "checkOutDate": "2026-12-27",
    "route": "Deluxe Ski Piste Room",
    "roomCount": 2,
    "adults": 2,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Adjoining rooms preferred. Late check-in around 21:30. Ski-in/ski-out.",
    "remarks": "City: Courchevel\nCheck-in: 2026-12-20\nCheck-out: 2026-12-27\nPreferred hotel: Aman Le Mélézin\nRoom type: Deluxe Ski Piste Room\nRooms: 2\nGuests: 2 Adults, 2 Children\nNotes: Adjoining rooms preferred. Late check-in around 21:30. Ski-in/ski-out."
  }
}
```

### 5.2 Flight (`admins/{adminId}/enquiries/enq_flight_002`)

```json
{
  "enquiryId": "enq_flight_002",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:05:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_FLIGHT_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_FLIGHT_SERVICE_ID>",
      "serviceName": "<GODWIT_FLIGHT_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_FLIGHT_SERVICE_ID>",
    "serviceName": "<GODWIT_FLIGHT_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "flight",
    "preferredAirline": "Swiss International Air Lines",
    "cabinClass": "Business",
    "tripType": "return",
    "flyingFrom": "London Heathrow (LHR)",
    "flyingTo": "Geneva (GVA)",
    "route": "London Heathrow (LHR) → Geneva (GVA)",
    "departureDate": "2026-12-20",
    "returnDate": "2026-12-27",
    "adults": 2,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Morning outbound flight preferred. Window seats.",
    "remarks": "Route: London Heathrow (LHR) → Geneva (GVA)\nTrip type: return\nDeparture: 2026-12-20\nReturn: 2026-12-27\nCabin: Business\nPreferred airline: Swiss International Air Lines\nPassengers: 2 Adults, 2 Children\nNotes: Morning outbound flight preferred. Window seats."
  }
}
```

### 5.3 Private Jet (`admins/{adminId}/enquiries/enq_pjet_003`)

```json
{
  "enquiryId": "enq_pjet_003",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:10:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_PRIVATE_JET_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_PRIVATE_JET_SERVICE_ID>",
      "serviceName": "<GODWIT_PRIVATE_JET_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_PRIVATE_JET_SERVICE_ID>",
    "serviceName": "<GODWIT_PRIVATE_JET_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "private_jet",
    "category": "Super Midsize Jet",
    "tripType": "one way",
    "flyingFrom": "Farnborough (FAB)",
    "flyingTo": "Sion Airport (SIR)",
    "route": "Farnborough (FAB) → Sion Airport (SIR)",
    "departureDate": "2026-12-20",
    "passengers": 6,
    "additionalNotes": "6 sets of skis in hold. Pet onboard (small dog). Light alpine catering.",
    "remarks": "Route: Farnborough (FAB) → Sion Airport (SIR)\nTrip type: one way\nDeparture: 2026-12-20\nAircraft: Super Midsize Jet\nPassengers: 6\nNotes: 6 sets of skis in hold. Pet onboard (small dog). Light alpine catering."
  }
}
```

### 5.4 Villa (`admins/{adminId}/enquiries/enq_villa_004`)

```json
{
  "enquiryId": "enq_villa_004",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:15:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_VILLA_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_VILLA_SERVICE_ID>",
      "serviceName": "<GODWIT_VILLA_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_VILLA_SERVICE_ID>",
    "serviceName": "<GODWIT_VILLA_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "villa",
    "destinationCity": "Saint-Tropez",
    "checkInDate": "2027-07-10",
    "checkOutDate": "2027-07-24",
    "bedrooms": 5,
    "route": "Ramatuelle / Pampelonne",
    "category": "Staffed Seafront Villa",
    "adults": 6,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Private chef, heated pool, gated driveway. Child ages: 7, 10.",
    "remarks": "Destination: Saint-Tropez (Ramatuelle / Pampelonne)\nCheck-in: 2027-07-10\nCheck-out: 2027-07-24\nVilla type: Staffed Seafront Villa\nBedrooms: 5\nGuests: 6 Adults, 2 Children (ages 7, 10)\nNotes: Private chef, heated pool, gated driveway. Child ages: 7, 10."
  }
}
```

### 5.5 Yacht (`admins/{adminId}/enquiries/enq_yacht_005`)

```json
{
  "enquiryId": "enq_yacht_005",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:20:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_YACHT_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_YACHT_SERVICE_ID>",
      "serviceName": "<GODWIT_YACHT_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_YACHT_SERVICE_ID>",
    "serviceName": "<GODWIT_YACHT_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "yacht",
    "destinationCity": "Amalfi Coast & Capri",
    "charterStartDate": "2027-07-25",
    "charterEndDate": "2027-07-30",
    "charterType": "Private",
    "duration": "Flexible",
    "category": "Crewed Motor Yacht",
    "guests": 8,
    "additionalNotes": "Crewed charter with Seabobs and tender for Capri beach clubs. Chef onboard.",
    "remarks": "Destination: Amalfi Coast & Capri\nCharter dates: 2027-07-25 to 2027-07-30\nCharter type: Private\nDuration: Flexible\nYacht category: Crewed Motor Yacht\nGuests: 8\nNotes: Crewed charter with Seabobs and tender for Capri beach clubs. Chef onboard."
  }
}
```

### 5.6 Chauffeur (`admins/{adminId}/enquiries/enq_chauf_006`)

```json
{
  "enquiryId": "enq_chauf_006",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:25:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_CHAUFFEUR_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_CHAUFFEUR_SERVICE_ID>",
      "serviceName": "<GODWIT_CHAUFFEUR_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_CHAUFFEUR_SERVICE_ID>",
    "serviceName": "<GODWIT_CHAUFFEUR_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "car_chauffeur",
    "destinationCity": "Geneva",
    "serviceType": "Airport Arrival",
    "category": "Mercedes-Benz V-Class",
    "pickUpLocation": "Geneva Airport (GVA)",
    "dropOffLocation": "Aman Le Mélézin, Courchevel 1850",
    "pickUpDateTime": "2026-12-20T11:30:00.000Z",
    "returnDateTime": "2026-12-27T09:00:00.000Z",
    "route": "Geneva Airport (GVA) → Aman Le Mélézin, Courchevel 1850",
    "adults": 2,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Child booster seat required. Extra ski luggage.",
    "remarks": "City: Geneva\nService type: Airport Arrival\nVehicle: Mercedes-Benz V-Class\nPick-up: Geneva Airport (GVA) (2026-12-20T11:30:00.000Z)\nDrop-off: Aman Le Mélézin, Courchevel 1850\nReturn: 2026-12-27T09:00:00.000Z\nPassengers: 2 Adults, 2 Children\nNotes: Child booster seat required. Extra ski luggage."
  }
}
```

### 5.7 Airport VIP (`admins/{adminId}/enquiries/enq_vip_007`)

```json
{
  "enquiryId": "enq_vip_007",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:30:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_AIRPORT_VIP_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_AIRPORT_VIP_SERVICE_ID>",
      "serviceName": "<GODWIT_AIRPORT_VIP_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_AIRPORT_VIP_SERVICE_ID>",
    "serviceName": "<GODWIT_AIRPORT_VIP_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "airport_vip",
    "destinationCity": "London Heathrow (LHR)",
    "serviceType": "Departure",
    "serviceStartDate": "2026-12-20",
    "serviceEndDate": "2026-12-20",
    "route": "Terminal 2",
    "category": "Private VIP Suite & Tarmac Transfer",
    "adults": 2,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Fast track security and porter baggage assistance for 4 ski bags.",
    "remarks": "Airport: London Heathrow (LHR)\nTerminal / Route: Terminal 2\nService type: Departure\nOption: Private VIP Suite & Tarmac Transfer\nService dates: 2026-12-20 to 2026-12-20\nTravellers: 2 Adults, 2 Children\nNotes: Fast track security and porter baggage assistance for 4 ski bags."
  }
}
```

### 5.8 Other (`admins/{adminId}/enquiries/enq_other_008`)

```json
{
  "enquiryId": "enq_other_008",
  "adminId": "admin_godwit_prod",
  "branchId": "branch_london_hq",
  "date": "2026-11-20T09:35:00.000Z",
  "status": true,
  "clientId": "client_9081",
  "clientName": "Aarav Mehta",
  "travellerId": "cust_4410",
  "travellerName": "Aarav Mehta",
  "travellerMobile": "+447700900123",
  "customerId": "cust_4410",
  "name": "Aarav Mehta",
  "mobile": "+447700900123",
  "source": "client_app",
  "createdByType": "client",
  "serviceIdList": ["<GODWIT_OTHER_SERVICE_ID>"],
  "serviceModelList": [
    {
      "serviceId": "<GODWIT_OTHER_SERVICE_ID>",
      "serviceName": "<GODWIT_OTHER_SERVICE_NAME>"
    }
  ],
  "enquiryModel": {
    "status": 0,
    "serviceId": "<GODWIT_OTHER_SERVICE_ID>",
    "serviceName": "<GODWIT_OTHER_SERVICE_NAME>",
    "source": "client_app",
    "appCategory": "other",
    "destinationCity": "Courchevel",
    "route": "Le 1947 à Cheval Blanc",
    "category": "Dining Reservation",
    "serviceStartDate": "2026-12-24",
    "serviceEndDate": "2026-12-24",
    "adults": 2,
    "children": 2,
    "infants": 0,
    "additionalNotes": "Christmas Eve dinner table for 4 at 20:00. Vegetarian tasting menu for 1 adult.",
    "remarks": "City: Courchevel\nCategory: Dining Reservation\nVenue / Route: Le 1947 à Cheval Blanc\nDate: 2026-12-24\nGuests: 2 Adults, 2 Children\nNotes: Christmas Eve dinner table for 4 at 20:00. Vegetarian tasting menu for 1 adult."
  }
}
```

---

## 6. Deliverable 3 — Field Audit: Non-Contract App Fields, Current Bugs & Missing UI Inputs

### 6.1 App Fields Not in the Contract — Disposition (`remarks` vs New Key)

| App Field Collected / Generated Today                                                   | Services Where Present                                                                   | In Contract?                                                   | Recommended Disposition                                                                                                                     | Rationale                                                                                                                                                                                          |
| :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeId`, `fromPlaceId`, `toPlaceId`, `cityPlaceId`, `pickUpPlaceId`, `dropOffPlaceId` | All 8 services                                                                           | **No**                                                         | **Move to `remarks` (or drop)** — do **not** add to Instant Sale contract                                                                   | Google Places IDs are UI autocomplete artifacts; Instant Sale does not consume Google Place IDs.                                                                                                   |
| `preferredHotelBrandId`                                                                 | Hotel                                                                                    | **No**                                                         | **Put in `remarks`** (unless CRM links `preferredPartnershipId` automatically)                                                              | `preferredHotel` (string) already fills the hotel name on Instant Sale.                                                                                                                            |
| `preferredAirlineId`, `preferredAirlineCode`                                            | Flight                                                                                   | **No**                                                         | **Put in `remarks`**                                                                                                                        | `preferredAirline` (string) already maps to `walkInModel.category` on Instant Sale.                                                                                                                |
| Quick-select `chips[]` (e.g. `Ski-in/ski-out`, `Pet onboard`, `Child seat`)             | All 8 services                                                                           | **No**                                                         | **Merge into `additionalNotes` and `remarks`** (already joined into notes string)                                                           | Pure concierge context; belongs in `additionalNotes` + `remarks`.                                                                                                                                  |
| `childAges: number[]`                                                                   | Villa (`VillaRequestWizard` collects child ages in UI, currently dropped before submit!) | **No**                                                         | **Put in `remarks` + `additionalNotes`** (e.g. `"Child ages: 7, 10"`)                                                                       | Instant Sale has no child-ages array box; writing into `remarks` prevents losing data the client entered.                                                                                          |
| Private Jet `returnDate` (when `tripType === "round_trip"`)                             | Private Jet                                                                              | **Not listed under Private Jet** (listed under Flight & Other) | **Needs contract confirmation — recommend allowing `returnDate` (`YYYY-MM-DD`) on `private_jet` AND echoing in `remarks`**                  | `PrivateJetRequestWizard` lets clients choose `Round Trip` + `returnDate`. Including `returnDate` (same key name as Flight, no new key invented) + `remarks` ensures return leg date is preserved. |
| Chauffeur `passengers` (single integer)                                                 | Chauffeur                                                                                | Contract specifies `adults, children, infants` for Chauffeur   | **Map `adults = passengers, children = 0, infants = 0` in app (or upgrade Chauffeur wizard to `TravellersTabContent`) + echo in `remarks`** | Keeps strict compliance with `adults, children, infants` without inventing keys.                                                                                                                   |
| Display `travelDate` string (e.g. `"20 Dec – 27 Dec 2026"`)                             | Written by `buildEnquiryDocument.ts` today                                               | **No**                                                         | **Remove from `enquiryModel` (or confirm CRM ignores it)**; rely on `YYYY-MM-DD` contract keys + `remarks`                                  | Formatted human ranges risk colliding with CRM `walkInModel.travelDate` date parsing.                                                                                                              |
| Top-level `travellerIds: string[]` (multi-traveller array)                              | Envelope                                                                                 | Contract specifies singular `travellerId`/`customerId`         | **Keep lead traveller in `travellerId`/`customerId`, list additional co-traveller names in `remarks`**                                      | Preserves multi-traveller party info without breaking CRM's primary traveller binding.                                                                                                             |

### 6.2 Critical Contract Violations in Existing App Codebase (Must Fix in App)

Auditing `src/features/requests/*/map*FormToAppRequest.ts` and `src/lib/firebase/enquiries/buildEnquiryDocument.ts` revealed **8 active contract violations** in current app code that must be cleaned up:

1. **Hotel (`mapHotelFormToAppRequest.ts` lines 70–71) & `serviceMap.ts` (`hotel.extraKey: 'route'`):** Currently writes `route: "2 Rooms"` and `category: "2 Adults"`. **Fix:** Remove both! Only write `roomCount: 2` and `adults`/`children`/`infants`; leave `route` empty unless a real room type string is selected.
2. **Flight (`mapFlightFormToAppRequest.ts` line 98):** Currently writes `category: guestLabel` (`"2 Adults"`). **Fix:** Delete `category: guestLabel` (CRM maps `preferredAirline` → Instant Sale `category`).
3. **Private Jet (`mapPrivateJetFormToAppRequest.ts` line 80 & `serviceMap.ts`):** Currently writes `category: "4 Passengers"`. **Fix:** Delete! `category` on `private_jet` is strictly aircraft type.
4. **Villa (`mapVillaFormToAppRequest.ts` lines 51, 57 & `serviceMap.ts`):** Currently writes `route: "5 Bedrooms"` and `category: destination`. **Fix:** Delete both! Destination belongs in `destinationCity`, bedroom count in `bedrooms`.
5. **Chauffeur (`mapChauffeurFormToAppRequest.ts` line 69):** Currently writes `route: routeExtra || passengersLabel` (falls back to `"2 Passengers"` if drop-off is empty on Disposal). **Fix:** Set `route` only when both `pickUp` and `dropOff` exist, else omit so CRM builds it cleanly.
6. **Airport VIP (`mapAirportVipFormToAppRequest.ts` line 60):** Currently writes `category: guestLabel` (`"2 Adults"`). **Fix:** Delete! `category` is strictly a VIP service option, never guest count.
7. **Other (`buildEnquiryDocument.ts` line 70 & `mapSomethingElseFormToAppRequest.ts` line 44):** Currently writes `category: city` and `instantSaleFields.route = notes`. **Fix:** Keep `city` in `destinationCity`, `notes` in `additionalNotes`/`remarks`, and only populate `category`/`route` when real category/venue values exist.
8. **Missing Envelope Fields (`buildEnquiryDocument.ts` & Wizards):**
   - `buildEnquiryDocument.ts` does **not** currently write top-level `travellerMobile` or `mobile`, nor `enquiryModel.source: "client_app"`.
   - All 8 wizards currently pass `travellerIds: []` and `travellers: []` instead of resolving the client's Principal traveller from `admins/{adminId}/customers` (`getTravellersForClient`) to populate `travellerId`, `travellerName`, `travellerMobile` (and mirrors `customerId`, `name`, `mobile`).

---

## 7. Deliverable 4 — `serviceName` & `serviceId` Catalog Alignment

### 7.1 What the App Knows Today vs What We Need Confirmed

Today, `src/lib/firebase/enquiries/resolveBranchAndService.ts` queries `admins/{adminId}/services` at runtime and performs a **case-insensitive substring match** (`serviceName.toLowerCase().includes(keyword)`), falling back to hardcoded strings in `SERVICE_MAP` if offline or unmatched:

| `appCategory`   | Current Substring Keyword | Current Fallback String in App | Status / Risk                                                                                                                                    | Placeholder Used in §5              |
| :-------------- | :------------------------ | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| `hotel`         | `"hotel"`                 | `"Hotel Booking"`              | Substring `"hotel"` could match `"Hotel Room Extension"` before `"Hotel"` if unsorted!                                                           | `<GODWIT_HOTEL_SERVICE_NAME>`       |
| `flight`        | `"air"`                   | `"AIR"`                        | Substring `"air"` could match `"Air Extras"`, `"Air Reissue"`, or `"Airport VIP"`!                                                               | `<GODWIT_FLIGHT_SERVICE_NAME>`      |
| `private_jet`   | `"private jet"`           | `"Private Jet"`                | Needs exact live name confirmation                                                                                                               | `<GODWIT_PRIVATE_JET_SERVICE_NAME>` |
| `villa`         | `"other"`                 | `"Other Service"`              | **Does Godwit have a dedicated `"Villa"` service in `admins/{adminId}/services`, or does Villa intentionally book under `"Hotel"` / `"Other"`?** | `<GODWIT_VILLA_SERVICE_NAME>`       |
| `yacht`         | `"yacht"`                 | `"Yacht"`                      | Needs exact live name confirmation                                                                                                               | `<GODWIT_YACHT_SERVICE_NAME>`       |
| `car_chauffeur` | `"chauffeur"`             | `"Chauffeur"`                  | Needs exact live name confirmation                                                                                                               | `<GODWIT_CHAUFFEUR_SERVICE_NAME>`   |
| `airport_vip`   | `"vip"`                   | `"Airport VIP"`                | Needs exact live name confirmation (e.g. `"Airport VIP"` vs `"VIP Meet & Greet"`)                                                                | `<GODWIT_AIRPORT_VIP_SERVICE_NAME>` |
| `other`         | `"other"`                 | `"Other Service"`              | Needs exact live name confirmation                                                                                                               | `<GODWIT_OTHER_SERVICE_NAME>`       |

### 7.2 Exact List Needed from You (Live Godwit Catalog)

Please share the exact `serviceId` and `serviceName` strings from `admins/{adminId}/services` for these 8 rows so we replace substring guessing with an exact deterministic lookup table:

1. **Hotel** (`serviceId` + exact `serviceName`)
2. **Flight / Commercial Air** (`serviceId` + exact `serviceName`)
3. **Private Jet** (`serviceId` + exact `serviceName`)
4. **Villa** (`serviceId` + exact `serviceName` — or confirm if mapped to `Other` / `Hotel`)
5. **Yacht** (`serviceId` + exact `serviceName`)
6. **Chauffeur** (`serviceId` + exact `serviceName`)
7. **Airport VIP** (`serviceId` + exact `serviceName`)
8. **Other** (`serviceId` + exact `serviceName`)

> **Senior Design Recommendation:** Stamp an immutable `appCategory` slug (`hotel`, `flight`, `private_jet`, `villa`, `yacht`, `car_chauffeur`, `airport_vip`, `other`) directly onto each master service doc in `admins/{adminId}/services/{serviceId}`. Then both the Client App and CRM resolve services by exact `where("appCategory", "==", category)` instead of fragile string matching, even if an admin renames `"AIR"` to `"Commercial Flights"` later.

---

## 8. CRM Restructured Service-Specific Enquiry Page Design

### 8.1 Architectural Goal for CRM Web

Restructure the Godwit CRM Enquiries module so **every enquiry in the system is service-specific**:

- **Inbound from Client App (`source: "client_app"`):** Appears immediately in the CRM Enquiry queue with structured service badges, parsed dates, route/destination summary, and a 1-click **`Book`** button.
- **Created Manually by CRM Staff (`source: "crm_manual"`):** Staff select a Client + Traveller, pick one of the **8 Service Tabs**, fill the **exact same service-specific fields** (`enquiryModel`), and either click **`Save Enquiry`** (to track/quote/follow up) or **`Save & Book`** (writes the enquiry and immediately opens Instant Sale prefilled).

### 8.2 Restructured CRM UI Layout

#### A. Enquiries Pipeline List View (`/enquiries`)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  Client Enquiries                                                 [ + New Service Enquiry ] │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  Status: [ Open (24) ] [ Booked / Sold (118) ] [ Cancelled (9) ] [ All ]                    │
│  Service: [All] [Hotel] [Flight] [Private Jet] [Villa] [Yacht] [Chauffeur] [VIP] [Other]    │
│  Source:  [All] [📱 Client App] [💼 Staff Manual]     Search: [ Client, city, PNR, hotel… ] │
├────────────┬──────────────────┬───────────────┬──────────────────────────┬─────────┬────────┤
│ Created    │ Client/Traveller │ Service       │ Request Summary          │ Source  │ Action │
├────────────┼──────────────────┼───────────────┼──────────────────────────┼─────────┼────────┤
│ 20 Nov     │ Aarav Mehta      │ 🏨 Hotel      │ Courchevel · Aman        │ 📱 App  │ [Book] │
│ 09:00      │ +447700900123    │               │ 20–27 Dec · 2 Rms · 4 Pax│         │  ⋮     │
├────────────┼──────────────────┼───────────────┼──────────────────────────┼─────────┼────────┤
│ 20 Nov     │ Aarav Mehta      │ ✈️ Flight     │ LHR → GVA · Return       │ 📱 App  │ [Book] │
│ 09:05      │ +447700900123    │               │ 20–27 Dec · Business     │         │  ⋮     │
├────────────┼──────────────────┼───────────────┼──────────────────────────┼─────────┼────────┤
│ 19 Nov     │ Riya Kapoor      │ 🛥️ Yacht      │ Amalfi & Capri · Private │ 💼 CRM  │ [Book] │
│ 16:40      │ +919820011223    │               │ 25–30 Jul · 8 Guests     │         │  ⋮     │
└────────────┴──────────────────┴───────────────┴──────────────────────────┴─────────┴────────┘
```

**Smart Summary Column Renderer (by `enquiryModel.appCategory`):**

- `hotel`: `{destinationCity} · {preferredHotel || route || 'Any Hotel'} · {checkInDate} → {checkOutDate} · {roomCount} Rm`
- `flight`: `{route || (flyingFrom + ' → ' + flyingTo)} · {tripType} · {departureDate} · {cabinClass}`
- `private_jet`: `{route || (flyingFrom + ' → ' + flyingTo)} · {category || 'Jet TBD'} · {departureDate}`
- `villa`: `{destinationCity} · {checkInDate} → {checkOutDate} · {bedrooms} BR`
- `yacht`: `{destinationCity} · {charterStartDate} → {charterEndDate} · {charterType}`
- `car_chauffeur`: `{destinationCity} · {serviceType} · {pickUpDateTime}`
- `airport_vip`: `{destinationCity} · {serviceType} · {serviceStartDate}`
- `other`: `{destinationCity} · {category || route || 'Custom'} · {serviceStartDate || checkInDate || departureDate}`
- _Legacy fallback (when `appCategory` is absent):_ First line of `enquiryModel.remarks`.

#### B. CRM "New / Edit Service Enquiry" Page / Drawer (Staff Manual Entry)

Staff manual enquiry creation is driven by a **declarative `ENQUIRY_FORM_SCHEMA[appCategory]`** registry so adding or tweaking a field updates validation, form rendering, and detail view together.

**Section 1 — Client & Traveller Binding (Required):**

1. **Branch Selector:** Defaults to logged-in staff's `branchId`.
2. **Client Search (`admins/{adminId}/clients`):** Sets `clientId`, `clientName`.
3. **Traveller Picker (`admins/{adminId}/customers` filtered by `clientIds` / `clientId`):**
   - Auto-selects the client's `Principal` traveller by default.
   - Sets `travellerId` (= `customerId`), `travellerName` (= `name`), `travellerMobile` (= `mobile`).
   - Includes `[+ Quick Add Traveller]` inline modal if the traveller is new.

**Section 2 — Service Category Selector (Required, Single-Select):**

- 8 visual tiles: **Hotel · Flight · Private Jet · Villa · Yacht · Chauffeur · Airport VIP · Other**.
- Selecting a tile resolves `{ serviceId, serviceName }` from `admins/{adminId}/services` and swaps Section 3's field grid dynamically.
- Note: When editing an existing enquiry, switching service prompts confirmation before clearing incompatible service-specific keys.

**Section 3 — Dynamic Service-Specific Form Grid (Writes exact contract keys into `enquiryModel`):**

| Service (`appCategory`)         | CRM Manual Form Inputs → Exact `enquiryModel` Key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Validation Rules                                                        |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **Hotel** (`hotel`)             | • Destination City (`destinationCity`, required)<br>• Check-in / Check-out (`checkInDate`, `checkOutDate`, `YYYY-MM-DD`, required)<br>• Preferred Hotel (`preferredHotel`, autocomplete from `masterData/hotelBrands` + free text)<br>• Room Type (`route`, text, e.g. `"Deluxe Sea View"` — **never room count**)<br>• Room Count (`roomCount`, number ≥ 1)<br>• Guests (`adults` ≥ 1, `children` ≥ 0, `infants` ≥ 0)                                                                                                                                                                    | `checkOutDate >= checkInDate`; `route` regex blocks `/^\d+\s*rooms?$/i` |
| **Flight** (`flight`)           | • Trip Type (`tripType`: `"one way"` \| `"return"`, required)<br>• Flying From / Flying To (`flyingFrom`, `flyingTo`, airport picker, required)<br>• Route Override (`route`, optional — auto-derived `"from → to"` if blank)<br>• Departure Date (`departureDate`, `YYYY-MM-DD`, required)<br>• Return Date (`returnDate`, `YYYY-MM-DD`, required if `"return"`)<br>• Cabin Class (`cabinClass`: Economy / Premium Economy / Business / First)<br>• Preferred Airline (`preferredAirline`, from `masterData/airlines` + free text)<br>• Passengers (`adults` ≥ 1, `children`, `infants`) | `flyingFrom !== flyingTo`; if `"return"`, `returnDate >= departureDate` |
| **Private Jet** (`private_jet`) | • Trip Type (`tripType`: `"one way"` \| `"return"`, required)<br>• Flying From / Flying To (`flyingFrom`, `flyingTo`, airport/FBO picker, required)<br>• Aircraft Category (`category`: Light Jet / Midsize / Super Midsize / Heavy Jet / Ultra Long Range / Turboprop)<br>• Departure Date (`departureDate`, `YYYY-MM-DD`, required; + `returnDate` if return)<br>• Party (`adults`, `children`, `infants` — or total `passengers`)                                                                                                                                                      | `category` must not be numeric guest count                              |
| **Villa** (`villa`)             | • Destination City (`destinationCity`, required)<br>• Area / Estate (`route`, optional real location only)<br>• Villa Type (`category`, optional, e.g. `"Beachfront"` / `"Alpine Chalet"`)<br>• Check-in / Check-out (`checkInDate`, `checkOutDate`, `YYYY-MM-DD`, required)<br>• Bedrooms (`bedrooms`, number ≥ 1)<br>• Guests (`adults` ≥ 1, `children`, `infants`)                                                                                                                                                                                                                     | `checkOutDate >= checkInDate`; `route` blocks `/^\d+\s*bedrooms?$/i`    |
| **Yacht** (`yacht`)             | • Cruising Area / Destination (`destinationCity`, required)<br>• Charter Start / End (`charterStartDate`, `charterEndDate`, `YYYY-MM-DD`, required)<br>• Charter Type (`charterType`: `"Private"` \| `"Shared"`)<br>• Duration (`duration`: `"Full Day"` / `"Half Day"` / `"Multi-day"` / `"Flexible"` / time)<br>• Yacht Type (`category`, e.g. `"Motor Yacht"` / `"Sailing Yacht"` / `"Catamaran"`)<br>• Guests (`adults`, `children`, `infants` — or `guests`)                                                                                                                         | `charterEndDate >= charterStartDate`                                    |
| **Chauffeur** (`car_chauffeur`) | • City (`destinationCity`, required)<br>• Service Type (`serviceType`: `"Airport Arrival"` \| `"Airport Departure"` \| `"Disposal"` \| `"Self Drive"`, required)<br>• Vehicle Type (`category`: S-Class / V-Class / Maybach / Range Rover / Sprinter)<br>• Pick-up Location (`pickUpLocation`, required)<br>• Drop-off Location (`dropOffLocation`, required for Airport Arrival/Departure)<br>• Pick-up Date & Time (`pickUpDateTime`, ISO datetime, required)<br>• Return Date & Time (`returnDateTime`, ISO datetime, optional)<br>• Passengers (`adults` ≥ 1, `children`, `infants`)  | `category` must be vehicle class, never passenger count                 |
| **Airport VIP** (`airport_vip`) | • Airport / City (`destinationCity`, required)<br>• Terminal / Flight Info (`route`, optional, e.g. `"Terminal 5 · BA0728"`)<br>• Service Type (`serviceType`: `"Arrival"` \| `"Departure"` \| `"Transit"`, required)<br>• VIP Tier / Option (`category`, optional, e.g. `"Private Suite"` / `"Meet & Assist"`)<br>• Service Start / End (`serviceStartDate`, `serviceEndDate`, `YYYY-MM-DD`, required)<br>• Travellers (`adults` ≥ 1, `children`, `infants`)                                                                                                                             | `serviceEndDate >= serviceStartDate`                                    |
| **Other** (`other`)             | • City (`destinationCity`, required)<br>• Category (`category`, e.g. `"Dining"` / `"Tickets"` / `"Experience"` / `"Visa"`)<br>• Venue / Route (`route`, optional)<br>• Start / End Date (`serviceStartDate`, `serviceEndDate`, `YYYY-MM-DD`, required)<br>• Travellers (`adults` ≥ 1, `children`, `infants`)                                                                                                                                                                                                                                                                              | Requires `destinationCity` + start date                                 |

**Section 4 — Concierge Notes & CRM Follow-up Controls:**

- `additionalNotes` (textarea — client/request notes; auto-synced into structured `remarks`).
- CRM Staff metadata: `interestIndex` (`0` Low, `1` Medium, `2` High), Follow-up Reminder Date (`reminderDateList`), Assigned Staff (`staffId`, `staffName`), Tags (`tagIdList`).

**Footer Actions:**

- `[ Cancel ]`
- `[ Save Enquiry ]` → Writes `admins/{adminId}/enquiries/{enquiryId}` with `enquiryModel.status = 0`.
- `[ Save & Book → ]` → Writes `admins/{adminId}/enquiries/{enquiryId}` (`status = 0`) and immediately navigates to `/instant-sale?enquiryId={enquiryId}`.

#### C. Enquiry Detail Drawer & Action Bar

When staff click any row in the Enquiries table, a slide-over Detail Drawer opens showing:

1. **Header Badges:** Status (`Open` / `Sold` / `Cancelled`), Source (`Client App` vs `Staff Manual`), Service Pill, Created timestamp.
2. **Primary Action Bar:**
   - When `enquiryModel.status === 0` (**Open**):
     - Primary Green CTA: **`[ Book ]`** (triggers Instant Sale prefill flow).
     - Secondary CTAs: `[ Edit Enquiry ]`, `[ Add Follow-up Note ]`, `[ Cancel Enquiry ]` (prompts cancellation reason → sets `enquiryModel.status = 2`, `endRemarks`, `endDate`, `endStaffId`).
   - When `enquiryModel.status === 1` (**Sold / Booked**):
     - **`[ Book ]` button is replaced by `[ View Booking → #{saleId} ]`** (prevents accidental double-booking of the same enquiry; secondary `[ Clone as New Enquiry ]` available if client wants a repeat booking).
3. **Structured Service Brief Card:** Renders clean key-value pairs for that `appCategory` + copy-to-clipboard brief button for supplier emails/WhatsApp.
4. **Audit Timeline (`enquiryModel.updateLogs[]`):** Shows `CREATED_FROM_APP` / `CREATED_MANUALLY`, staff edits, follow-ups, and `CONVERTED_TO_SALE` with `saleId` link.

---

## 9. "Book" (`Make Sale`) → Instant Sale Auto-Prefill Engine

### 9.1 Navigation & Hydration Contract

1. **Trigger:** Staff clicks **`Book`** (on the Enquiries table row, Detail Drawer, or via **`Save & Book`**).
2. **Route:** Navigate to Instant Sale with `?enquiryId={enquiryId}` (optionally passing `{ state: { enquiryDoc } }` in router memory for 0ms instant render, while always falling back to `getDoc(doc(db, 'admins', adminId, 'enquiries', enquiryId))` on hard refresh).
3. **Important Invariant:** Clicking **`Book`** **does NOT** mark the enquiry `Sold` yet! If the staff member closes the browser tab mid-form, the enquiry remains `status: 0` (Open) in the queue so no lead is lost. Status transitions to `1` (**Sold**) **only** when Instant Sale is actually saved.

### 9.2 Instant Sale Prefill Mapping Matrix (CRM Consumer Behavior)

When Instant Sale loads `enquiryDoc`:

1. **Client & Traveller Header:**
   - Pre-select Client: `enquiryDoc.clientId` (`enquiryDoc.clientName`).
   - Pre-select Lead Traveller: `enquiryDoc.travellerId || enquiryDoc.customerId` (`travellerName`, `travellerMobile`).
2. **Service Tab Selection:**
   - Match `enquiryModel.serviceId` (fallback: exact `enquiryModel.serviceName` → `enquiryModel.appCategory`) and activate that service's Instant Sale form tab.
   - Pre-stamp `serviceKind` on the draft sale (`hotel`, `air`, `privateJet`, `chauffeur`, `vip`, `other`) so the mobile app's **Trips** tab renders the confirmed booking card accurately (per `docs/TRIPS_FIRESTORE_CONTEXT.md`).
3. **Service Form Field Mapping (`enquiryModel` → Instant Sale `walkInModel` / form fields):**

| `appCategory`       | `enquiryModel` Source Keys                                                                                                                           | Instant Sale Target Fields                                                                                                                           | Overflow → `remarks` ("App request" Block)                                                                                                   |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **`hotel`**         | `destinationCity`<br>`preferredHotel`<br>`checkInDate`, `checkOutDate`<br>`route` (room type only)                                                   | `destinationCity`<br>`nameOfHotel` / `hotelBrand`<br>`travelDate` / `checkInDate` & `returnDate` / `checkOutDate`<br>`walkInModel.route` (Room Type) | `roomCount`, `adults`, `children`, `infants` (or `guests`), `additionalNotes`                                                                |
| **`flight`**        | `preferredAirline`<br>`cabinClass`<br>`tripType`<br>`route` (else `flyingFrom → flyingTo`)<br>`departureDate`, `returnDate`                          | `walkInModel.category` (Airline)<br>`cabinClass`<br>`tripType`<br>`walkInModel.route`<br>`travelDate` / `departureDate` & `returnDate`               | `flyingFrom`, `flyingTo`, `adults`, `children`, `infants` (or `passengers`), `additionalNotes`                                               |
| **`private_jet`**   | `category` (aircraft type)<br>`route` (else `flyingFrom → flyingTo`)<br>`departureDate`                                                              | `walkInModel.category` (Aircraft Type)<br>`walkInModel.route`<br>`travelDate` / `departureDate`                                                      | `tripType`, `returnDate` (if round trip), `adults`/`children`/`infants`/`passengers`, `additionalNotes`                                      |
| **`villa`**         | `destinationCity`<br>`checkInDate`, `checkOutDate`<br>`route` (if real place)<br>`category` (if villa type)                                          | `destinationCity`<br>`travelDate` / `checkInDate` & `returnDate` / `checkOutDate`<br>`walkInModel.route`<br>`walkInModel.category`                   | `bedrooms`, `adults`, `children`, `infants` (or `guests`), `additionalNotes`                                                                 |
| **`yacht`**         | `destinationCity`<br>`charterStartDate`, `charterEndDate`<br>`category`                                                                              | `destinationCity`<br>`travelDate` / `charterStartDate` & `returnDate` / `charterEndDate`<br>`walkInModel.category`                                   | `charterType`, `duration`, `adults`/`children`/`infants`/`guests`, `additionalNotes`                                                         |
| **`car_chauffeur`** | `destinationCity`<br>`serviceType`<br>`category` (vehicle type)<br>`route` (else `pickUpLocation → dropOffLocation`)<br>`pickUpDateTime` (date part) | `destinationCity`<br>`serviceType`<br>`walkInModel.category` (Vehicle)<br>`walkInModel.route`<br>`travelDate`                                        | `pickUpLocation`, `dropOffLocation`, full timestamps `pickUpDateTime` & `returnDateTime`, `adults`, `children`, `infants`, `additionalNotes` |
| **`airport_vip`**   | `destinationCity`<br>`serviceType`<br>`serviceStartDate`, `serviceEndDate`<br>`route`, `category`<br>`adults + children + infants`                   | `destinationCity`<br>`serviceType`<br>`travelDate` & `returnDate`<br>`walkInModel.route`, `walkInModel.category`<br>Traveller count (`sum`)          | Individual breakdown (`adults`, `children`, `infants`), `additionalNotes`                                                                    |
| **`other`**         | `destinationCity`, `route`, `category`<br>`checkInDate \| departureDate \| serviceStartDate`<br>`checkOutDate \| returnDate \| serviceEndDate`       | `destinationCity`, `walkInModel.route`, `walkInModel.category`<br>`travelDate`<br>`returnDate`                                                       | `adults`, `children`, `infants`, `additionalNotes`                                                                                           |

### 9.3 Atomic Conversion on Instant Sale Submit

When staff submit the prefilled Instant Sale form (when `enquiryId` is present in context):

```typescript
// Pseudo-code for CRM Instant Sale submit handler when converting an enquiry
const batch = writeBatch(db);

const saleRef = doc(db, 'admins', adminId, 'clients', clientId, 'sales', saleId);
const enquiryRef = doc(db, 'admins', adminId, 'enquiries', enquiryId);

// 1. Write the Instant Sale with back-reference + explicit serviceKind for mobile Trips
batch.set(saleRef, {
  ...salePayload,
  saleId,
  enquiryId, // Traceability back to originating enquiry
  serviceKind, // 'hotel' | 'air' | 'privateJet' | 'chauffeur' | 'vip' | 'other'
});

// 2. Atomically transition the Enquiry to Sold (1)
batch.update(enquiryRef, {
  saleId,
  endStaffId: currentStaff.staffId,
  endStaffName: currentStaff.name,
  'enquiryModel.status': 1,
  'enquiryModel.saleId': saleId,
  'enquiryModel.endDate': serverTimestamp(),
  'enquiryModel.endStaffId': currentStaff.staffId,
  'enquiryModel.endStaffName': currentStaff.name,
  'enquiryModel.updateLogs': arrayUnion({
    date: Timestamp.now(),
    staffId: currentStaff.staffId,
    staffName: currentStaff.name,
    action: 'CONVERTED_TO_SALE',
    remarks: `Booked via Instant Sale (${saleId})`,
    changes: [`status=0->1`, `saleId=${saleId}`],
  }),
});

await batch.commit();
```

---

## 10. State Machine, Concurrency, Indexes & Rollout Plan

### 10.1 Enquiry Lifecycle State Machine

```text
                  (Client App OR CRM Staff Manual)
                                 │
                                 ▼
                      ┌────────────────────┐
                      │   status: 0 (Open) │◄──────────────┐
                      └────┬──────────┬────┘               │
                           │          │                    │
       Staff clicks [Book] │          │ Staff clicks       │ Sale cancelled &
       & submits Sale      │          │ [Cancel Enquiry]   │ staff re-opens lead
                           ▼          ▼                    │
            ┌───────────────────┐  ┌───────────────────────┴┐
            │ status: 1 (Sold)  │  │ status: 2 (Cancelled)  │
            │ + saleId stamped  │  │ + endRemarks required  │
            └───────────────────┘  └────────────────────────┘
```

### 10.2 Concurrency & Edge-Case Safeguards

1. **Double-Book Guard:** Before Instant Sale commits a conversion for `enquiryId`, check `enquiryDoc.enquiryModel.status`. If another staff member already booked it (`status === 1`), show a confirmation warning (`"This enquiry was already booked as Sale #XYZ by {endStaffName}. Create another sale anyway?"`) before committing.
2. **Idempotent Client App Retries:** The mobile app pre-generates `enquiryId = doc(collection(db, 'admins', adminId, 'enquiries')).id` per form submission attempt and writes via `setDoc(..., { merge: true })`, preventing duplicate enquiries on flaky mobile networks.
3. **Legacy Enquiry Compatibility:** Existing enquiries in Firestore without `enquiryModel.appCategory` continue to render in the `"All"` filter using `serviceModelList[0].serviceName` and `enquiryModel.remarks`; clicking **`Book`** still opens the matching `serviceId` tab and injects `remarks`.

### 10.3 Recommended Firestore Composite Indexes (`admins/{adminId}/enquiries`)

1. `status ASC, enquiryModel.status ASC, date DESC` — Default CRM Open / Sold / Cancelled tabs.
2. `status ASC, enquiryModel.status ASC, enquiryModel.appCategory ASC, date DESC` — Filtering Open enquiries by Service (`Hotel`, `Flight`, etc.).
3. `status ASC, source ASC, enquiryModel.status ASC, date DESC` — Filtering `"Client App"` inbox queue.
4. `clientId ASC, status ASC, date DESC` — Client Profile → Enquiries history tab (both CRM and Mobile App).

### 10.4 Phased Engineering Rollout

- **Phase 1 — Contract Lock & Client App Mapper Cleanup (1–2 days):**
  - Confirm the 8 live `{ serviceId, serviceName }` pairs from `admins/{adminId}/services`.
  - Fix the 8 mapper/envelope issues in `Godwit_ios_app-` (§6.2): strip counts out of `route` and `category`, add `travellerMobile`/`mobile` and `enquiryModel.source: "client_app"`, auto-bind the client's Principal traveller, and preserve Villa `childAges` + Private Jet `returnDate` in `remarks`.
- **Phase 2 — CRM Service-Specific Enquiry Workspace (3–4 days):**
  - Build `ENQUIRY_FORM_SCHEMA[appCategory]` in CRM Web.
  - Ship the restructured Enquiries Pipeline table (service filter pills, source badges, smart summary column, inline `[Book]` action) and the Staff Manual "New Service Enquiry" form (`Save Enquiry` + `Save & Book`).
- **Phase 3 — Instant Sale Prefill Verification & Atomic WriteBatch (2 days):**
  - Verify `/instant-sale?enquiryId={enquiryId}` prefill across all 8 sample JSON payloads in §5.
  - Wire the atomic `writeBatch` sale-to-enquiry conversion (`enquiryModel.status = 1`, `saleId`, `serviceKind` stamp) and double-book guard.
