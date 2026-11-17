# Godwit Home — Visible Data Spec

**Audience:** UI restructure.  
**Intent:** List only the **brand colors** and **data the Home experience must surface**. Layout, component structure, and current screen composition are intentionally omitted.

---

## Brand colors

| Role          | Token    | Hex       |
| ------------- | -------- | --------- |
| **Primary**   | `forest` | `#1B2915` |
| **Secondary** | `sand`   | `#D8CDB8` |

Supporting palette (available, not required as primary/secondary):

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

## Visible data (must show)

### Identity & greeting

| Data                     | Example / shape                                    | Notes                               |
| ------------------------ | -------------------------------------------------- | ----------------------------------- |
| Family / household label | `MODI FAMILY`                                      | From client display name            |
| Time-of-day greeting     | `Good morning` / `Good afternoon` / `Good evening` | Local time                          |
| First name               | `Ruchir`                                           | From client name                    |
| Updates count            | `4`                                                | Count of new updates for the client |

### App chrome

| Data                | Example / shape                  | Notes                      |
| ------------------- | -------------------------------- | -------------------------- |
| Brand wordmark      | `GODWIT`                         | Fixed                      |
| Notifications count | `0`–`n` (cap display e.g. `99+`) | Unread / new notifications |
| Profile initials    | `RM`                             | Derived from client name   |

### Primary action

| Data                  | Example / shape | Notes                             |
| --------------------- | --------------- | --------------------------------- |
| New request CTA label | `New request`   | Entry to create a service request |

### Trip spotlight

Show when the client has a current or upcoming trip cluster; otherwise show an empty state.

| Data             | Example / shape                            | Notes                                                              |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| Section label    | `YOUR CURRENT TRIP` / `YOUR UPCOMING TRIP` | Mode-driven                                                        |
| Cover image URL  | HTTPS image                                | May be placeholder until CRM provides media                        |
| Trip title       | Destination / trip headline                |                                                                    |
| Date summary     | `14–21 September · 7 nights`               | Inclusive stay / travel window                                     |
| Party summary    | `4 travelling · 4 services arranged`       | Guests + arranged services                                         |
| Place line       | Stay / location copy                       | Optional                                                           |
| Next-up line     | `Private jet · 07:30`                      | Optional next service                                              |
| Service chips    | Label + type icon                          | e.g. Private jet, Villa, Chauffeur, Yacht, Flight, VIP, Experience |
| View trip action | Opens trip detail                          | Requires primary sale id                                           |

**Empty state copy (when no trip):**

| Data        | Copy                                               |
| ----------- | -------------------------------------------------- |
| Empty title | `No trips arranged yet`                            |
| Empty hint  | `Send a New request and your trip will show here.` |

### Payments spotlight

Show only when there is a non-zero ledger signal (amount due or credit).

| Data                 | Example / shape                       | Notes                      |
| -------------------- | ------------------------------------- | -------------------------- |
| Section label        | `PAYMENTS DUE` / `CREDIT WITH GODWIT` | Mode-driven                |
| Amount line(s)       | `USD 31,700` / `USD 820 credit`       | One or more currency lines |
| View payments action | Opens payments                        |                            |

### Main navigation destinations

Labels the Home experience must expose (placement is free):

| Destination | Label      |
| ----------- | ---------- |
| Home        | `Home`     |
| Trips       | `Trips`    |
| Messages    | `Messages` |
| Profile     | `Profile`  |

---

## Data readiness (for product / design)

| Item                               | Live from CRM / session today |
| ---------------------------------- | ----------------------------- |
| Family label, first name, greeting | Yes                           |
| Profile initials                   | Yes                           |
| Trip spotlight fields              | Yes (sales)                   |
| Payments / credit amounts          | Yes (ledger)                  |
| Updates count                      | Static placeholder today      |
| Notifications count                | Static placeholder today      |
| Trip cover image                   | Placeholder URL today         |

---

_Use this spec as the content contract for a new Home UI. Do not infer layout from this document._
