# Godwit Home Page — UI & Data Inventory

**Purpose:** Single reference for restructuring the Home tab UI while preserving current information architecture, data contracts, and brand colors.

**Scope:** Authenticated Home tab surface (chrome + scroll body + floating tab bar).  
**Out of scope:** New-request wizard internals, Trips/Profile full screens (linked from Home only).

**Source of truth (code):**

| Layer        | Path                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Route entry  | `src/app/index.tsx` → `MainTabScreen`                                 |
| Tab shell    | `src/features/home/screens/MainTabScreen.tsx`                         |
| Home body    | `src/features/home/screens/HomeScreen.tsx`                            |
| App header   | `src/features/home/components/AppChromeHeader.tsx` → `HomeHeader.tsx` |
| Tab bar      | `src/features/home/components/HomeTabBar.tsx`                         |
| Color tokens | `src/ui/tokens/colors.ts`                                             |
| Typography   | `src/ui/tokens/typography.ts`                                         |

---

## 1. Brand colors (Home)

There is **no** token named `primary` / `secondary` in the design system. On Home, treat the mapping below as the working brand pair.

### Primary & secondary (recommended mapping)

| Role          | Token           | Hex       | How it is used on Home                                                                                                                |
| ------------- | --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary**   | `colors.forest` | `#1B2915` | Wordmark weight, greetings & trip titles, CTA fills/borders (with sand text), active tab, spinners, badge/avatar fills, icon emphasis |
| **Secondary** | `colors.sand`   | `#D8CDB8` | New request label + plus icon on forest pill; soft contrast against primary                                                           |

### Full Home palette

| Token               | Hex       | Home usage                                           |
| ------------------- | --------- | ---------------------------------------------------- |
| `forest`            | `#1B2915` | **Primary** — text, CTAs, active UI, shadows         |
| `sand`              | `#D8CDB8` | **Secondary** — accent text/icons on dark CTAs       |
| `background`        | `#EDECEA` | Screen / scroll / header / tab shell fill            |
| `card`              | `#F7F6F4` | Floating tab bar pill                                |
| `surface`           | `#DEDBD4` | Trip image placeholder surface                       |
| `border`            | `#D4D0C8` | Card edges, dividers, tab bar outline                |
| `headerBorder`      | `#C2BDB4` | Header bottom rule                                   |
| `muted`             | `#5C6658` | Eyebrows, meta lines, inactive tabs, secondary links |
| `accent`            | `#3D4F38` | New request pill border                              |
| `primaryForeground` | `#F7F6F4` | Text on forest badge / avatar                        |
| `fieldLabel`        | `#2F382C` | **Not used** on Home today                           |

### Hardcoded hex still on Home (prefer tokens when restructuring)

| Hex       | Where                                                 | Note                                                    |
| --------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `#FFFFFF` | `CurrentTripCard`, `PaymentsDueCard` card backgrounds | Closest token: `card` / `primaryForeground` (`#F7F6F4`) |
| `#1B2915` | Card `shadowColor`                                    | Same as `colors.forest`                                 |

---

## 2. Current layout (top → bottom)

```
┌─────────────────────────────────────────┐
│ Status bar                              │
├─────────────────────────────────────────┤
│ App chrome (HomeHeader)                 │
│   GODWIT · bell(+badge) · avatar        │
├─────────────────────────────────────────┤
│ HomeScreen ScrollView (background)      │
│                                         │
│   1. GreetingSection                    │
│      · family eyebrow                   │
│      · "{greeting}, {firstName}"        │
│      · "{n} new update(s)"              │
│                                         │
│   2. NewRequestButton                   │
│      · forest pill · “New request”      │
│                                         │
│   3. Current trip block (one of)        │
│      · loading spinner                  │
│      · CurrentTripCard                  │
│      · CurrentTripEmptyCard             │
│                                         │
│   4. PaymentsDueCard (conditional)      │
│                                         │
│   (paddingBottom ~96 for tab bar)       │
├─────────────────────────────────────────┤
│ Floating HomeTabBar (absolute)          │
│   Home · Trips · Messages · Profile · … │
└─────────────────────────────────────────┘
```

**Overlay:** tapping **New request** replaces the entire Home body with `RequestsScreen` (tab bar suppressed).

**Responsive inset:** horizontal padding via `homeContentInset(width)` on section components.

---

## 3. Everything shown — section inventory

### 3.1 App chrome — `HomeHeader`

| Item          | What the user sees               | Data field           | Source                                                                                            |
| ------------- | -------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| Wordmark      | `GODWIT`                         | Hardcoded            | `HomeHeader`                                                                                      |
| Notifications | Bell icon + badge (`n` or `99+`) | `notificationsCount` | `useAppHeaderState` → **static** `staticHomeViewModel.notificationsCount` (`4`) when no live feed |
| Profile       | Circle with initials             | `profileInitials`    | Session name → `getProfileInitial`; fallback `RM`                                                 |

| State     | Behavior                                                    |
| --------- | ----------------------------------------------------------- |
| Badge `0` | Badge hidden                                                |
| No name   | Initials may show `?` / fallback                            |
| Actions   | Bell & avatar are pressable but **not wired** to navigation |

**Files:** `AppChromeHeader.tsx`, `HomeHeader.tsx`, `useAppHeaderState.ts`

---

### 3.2 Greeting — `GreetingSection`

| Item         | What the user sees            | Data field              | Source                                                                    |
| ------------ | ----------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| Eyebrow      | e.g. `MODI FAMILY`            | `familyName`            | Live: `familyLabelFromClientName(profile.name)` uppercased; else static   |
| Headline     | e.g. `Good afternoon, Ruchir` | `greeting` + `userName` | Live: `greetingForLocalTime()` + `getProfileFirstName`; else static       |
| Updates line | e.g. `4 new updates`          | `updatesCount`          | **Always static** `staticHomeViewModel.updatesCount` (`4`) — not live CRM |

| State                     | Behavior                                                       |
| ------------------------- | -------------------------------------------------------------- |
| Fonts / session hydrating | Full-screen forest spinner                                     |
| No profile name           | Static mock greeting copy                                      |
| Bootstrap                 | If hydrated & name empty → `getClientByAdminAndClientIdSafe()` |

**Files:** `GreetingSection.tsx`, `homeViewModel.ts`, `useActiveClientProfile`

---

### 3.3 New request — `NewRequestButton`

| Item   | What the user sees                    | Source                  |
| ------ | ------------------------------------- | ----------------------- |
| CTA    | Forest pill, sand “+” + “New request” | Hardcoded label         |
| Action | Opens in-tab `RequestsScreen`         | `setShowRequests(true)` |

**Colors:** fill `forest`, border `accent`, label/icon `sand`.

---

### 3.4 Current trip spotlight — `CurrentTripCard` / empty / loader

#### Loading

Centered `ActivityIndicator` (`colors.forest`) while trip query pending and no card yet.

#### Empty — `CurrentTripEmptyCard`

| Copy    | Notes                                              |
| ------- | -------------------------------------------------- |
| Section | `CURRENT TRIP`                                     |
| Title   | `No trips arranged yet`                            |
| Body    | `Send a New request and your trip will show here.` |

#### Populated — `CurrentTripCard` (displayed fields)

| UI element    | Card field            | Notes                                                                                               |
| ------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| Section label | `sectionLabel`        | e.g. `YOUR CURRENT TRIP` / `YOUR UPCOMING TRIP` (`mode`)                                            |
| Cover image   | `coverUrl`            | Placeholder CDN image (CRM has no trip image)                                                       |
| Title         | `title`               | Destination / trip headline                                                                         |
| Dates line    | `dateSummary`         | Built from start/end/nights/day                                                                     |
| Party line    | `partySummary`        | Travellers + services count                                                                         |
| Place line    | `placeLine`           | Optional                                                                                            |
| Next up       | `nextUp.displayLabel` | Prefixed `Next — …` when present                                                                    |
| Service chips | `services[]`          | icon + label (`private-jet`, `villa`, `chauffeur`, `yacht`, `flight`, `vip`, `experience`, `other`) |
| CTA           | —                     | `View trip →`                                                                                       |

**Underlying model (also available for restructure, not all printed):**  
`mode`, `primarySaleId`, `saleIds`, `startDate`, `endDate`, `nights`, `dayIndex`, `dayLabel`, `travellerCount`, `servicesCount`, `serviceTypes`, `nextUp.{saleId,label,time}`.

| Data source | Detail                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Query       | React Query `['home', 'current-trip', adminId, clientId]`                                          |
| Fetch       | `getClientCurrentTripCardSafe` → Firestore sales under `admins/{adminId}/clients/{clientId}/sales` |
| Scope       | `profile.adminId` / `profile.clientId` (or test mocks)                                             |
| Error       | Safe wrapper → `card: null` → **same UI as empty** (no error banner)                               |
| Action      | `router.push('/trips/{primarySaleId}')`                                                            |

**Files:** `CurrentTripCard.tsx`, `currentTripCardTypes.ts`, `getClientCurrentTripCard.ts`

---

### 3.5 Payments spotlight — `PaymentsDueCard` (conditional)

Shown only when card is non-null **and** `lines.length > 0` (zero balance hidden upstream).

| UI element     | Card field            | Notes                                       |
| -------------- | --------------------- | ------------------------------------------- |
| Section label  | `sectionLabel`        | e.g. `PAYMENTS DUE` or `CREDIT WITH GODWIT` |
| Amount line(s) | `lines[].amountLabel` | Formatted currency strings                  |
| CTA            | —                     | `View payments`                             |

| Data source   | Detail                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| Query         | React Query `['home', 'payments-due', adminId, clientId]`                            |
| Fetch         | `getHomePaymentsDueSafe` → client ledger (`clientLedgerBalanceUsd` + `clientLedger`) |
| Loading       | No dedicated spinner — section appears when ready                                    |
| Error / empty | Card null → **section omitted**                                                      |
| Action        | `router.push('/profile/payments')`                                                   |

**Files:** `PaymentsDueCard.tsx`, `homePaymentsDueTypes.ts`, `getHomePaymentsDue.ts`

---

### 3.6 Floating tab bar — `HomeTabBar`

| Tab      | Label    | Behavior on Home shell                  |
| -------- | -------- | --------------------------------------- |
| Home     | Home     | Default selected                        |
| Trips    | Trips    | Local tab switch (not Expo Router tabs) |
| Messages | Messages | Placeholder “Messages — coming soon”    |
| Profile  | Profile  | Profile tab body                        |
| Testing  | Testing  | Dev/testing clients screen              |

| Behavior    | Detail                                                          |
| ----------- | --------------------------------------------------------------- |
| Position    | Absolute over content, `zIndex: 50`                             |
| Scroll hide | `HomeTabBarVisibility` — hide on scroll down; reveal after idle |
| Suppress    | Fully hidden during `RequestsScreen`                            |
| Clearance   | Home scroll `paddingBottom: 96`                                 |
| Colors      | Pill `card` + `border`; active `forest`; inactive `muted`       |

---

## 4. Static vs live data (quick matrix)

| Surface                                     | Live today?                      | Fallback / note            |
| ------------------------------------------- | -------------------------------- | -------------------------- |
| Family eyebrow + first name + time greeting | Yes (session / client)           | Static mock if no name     |
| Updates count                               | **No**                           | Always static `4`          |
| Notification badge                          | **No** (header uses static path) | Static `4`                 |
| Profile initials                            | Yes                              | Static `RM`                |
| Current / upcoming trip card                | Yes (Firestore sales)            | Empty card UI              |
| Payments due / credit                       | Yes (ledger)                     | Hidden if none             |
| New request label                           | Hardcoded                        | —                          |
| Trip cover image                            | Placeholder URL                  | No CRM image field         |
| `staticHomeViewModel.upcomingTrips`         | **Unused on Home**               | Replaced by live trip card |

---

## 5. Typography on Home

Families from `fontFamily` (Manrope + Cormorant). Representative sizes in current styles:

| Element                   | Family                     | Approx size     |
| ------------------------- | -------------------------- | --------------- |
| GODWIT wordmark           | Manrope semibold           | 25 (compact 21) |
| Greeting fixed / name     | Cormorant regular / medium | 24              |
| Trip title                | Cormorant medium           | 28              |
| Payment amounts           | Cormorant medium           | 24–28           |
| Eyebrows / section labels | Manrope semibold           | 11              |
| Meta / updates            | Manrope regular            | 14              |
| New request / View trip   | Manrope semibold           | 14              |
| Tab labels                | Manrope medium/semibold    | 11              |

Fonts gate Home content via `useGodwitFonts()`.

---

## 6. Navigation map (from Home)

| Trigger              | Destination                                      |
| -------------------- | ------------------------------------------------ |
| New request          | In-tab `RequestsScreen` (service grid → wizards) |
| View trip            | `/trips/[saleId]` → active trip detail           |
| View payments        | `/profile/payments`                              |
| Tab bar              | In-shell Trips / Messages / Profile / Testing    |
| Header bell / avatar | **Not connected**                                |

---

## 7. Component & data file checklist

**UI**

- `screens/HomeScreen.tsx`
- `screens/MainTabScreen.tsx`
- `components/GreetingSection.tsx`
- `components/NewRequestButton.tsx`
- `components/CurrentTripCard.tsx`
- `components/PaymentsDueCard.tsx`
- `components/HomeHeader.tsx`
- `components/AppChromeHeader.tsx`
- `components/HomeTabBar.tsx`
- `layout/homeContentInset.ts`
- `tabBar/HomeTabBarVisibility.tsx`
- `schemas/homeViewModel.ts`
- `hooks/useAppHeaderState.ts`

**Data**

- `lib/session/useActiveClientProfile.ts`
- `lib/firebase/sales/currentTrip/*`
- `lib/firebase/payments/getHomePaymentsDue.ts` (+ ledger mappers)
- `lib/firebase/clients` (`familyLabelFromClientName`)
- `mocks/testingClientSession.ts` (dev ID fallback)

---

## 8. Restructure guidance (preserve contracts)

When redesigning Home UI:

1. **Keep the information set** above unless product explicitly drops a field (greeting, new request, trip spotlight, payments spotlight, chrome, tab destinations).
2. **Keep query keys / safe fetchers** (`getClientCurrentTripCardSafe`, `getHomePaymentsDueSafe`) so Firestore contracts stay stable.
3. **Map brand roles** to `forest` (primary) and `sand` (secondary); prefer tokens over `#FFFFFF` / raw `#1B2915`.
4. **Call out dead/static surfaces** for product: updates count, notification badge, header actions, unused `upcomingTrips` mock blob.
5. **Empty / loading / hidden** behaviors (trip empty card, payments omit, no trip error banner) should be decided intentionally in the new layout.

---

_Generated from the current Home implementation for UI restructuring. Update this doc when Home sections or data contracts change._
