# Godwit Profile → Payments — Visible Data & Current Layout Spec

**Audience:** UI restructure of **Payments hub** and **invoice detail**.  
**Out of scope:** Profile hub, Home payments spotlight, Travellers, Documents, other profile sections.

**Intent:** Brand colors, **current layout**, and **all visible data** across Payments screens.

**Code**

| Screen         | Path                                                            | Route                        |
| -------------- | --------------------------------------------------------------- | ---------------------------- |
| Payments hub   | `src/features/profile/payments/PaymentsScreen.tsx`              | `/profile/payments`          |
| Invoice detail | `src/features/profile/payments/invoice/InvoiceDetailScreen.tsx` | `/profile/payments/{saleId}` |
| Shell          | `src/features/profile/components/ProfileSectionShell.tsx`       | —                            |

**Related:** `docs/PROFILE_HUB_VISIBLE_DATA.md` · `docs/PROFILE_TRAVELLERS_VISIBLE_DATA.md`

---

## Brand colors

| Role          | Token    | Hex       |
| ------------- | -------- | --------- |
| **Primary**   | `forest` | `#1B2915` |
| **Secondary** | `sand`   | `#D8CDB8` |

Supporting: `background` `#EDECEA` · `card` `#F7F6F4` · `border` `#D4D0C8` · `muted` `#5C6658` · `accent` `#3D4F38`

Hardcoded today: white cards `#FFFFFF` · error/empty `#F8F7F4` · status pills (see upcoming badges below)

---

## Screens in this flow

| #   | Screen             | Opens from              |
| --- | ------------------ | ----------------------- |
| 1   | **Payments hub**   | Profile menu → Payments |
| 2   | **Invoice detail** | Hub → Invoices row tap  |

No other payment routes under Profile.

---

## Current layout — Payments hub

```
┌─────────────────────────────────────────┐
│ App chrome (shared)                     │
├─────────────────────────────────────────┤
│ Back: ‹ Profile                         │
│ Title: Payments                         │
│ Subtitle …………………  Account               │
│                       statement         │
├─────────────────────────────────────────┤
│ Body (one of):                          │
│   · Full-page loading spinner           │
│   · Global error + Retry                │
│   · Stack (top → bottom):               │
│       1. Amount due / credit card       │
│          (omitted if no card)           │
│       2. UPCOMING PAYMENTS              │
│       3. INVOICES                       │
│       4. PAYMENTS RECEIVED              │
│       5. CREDITS AND REFUNDS            │
└─────────────────────────────────────────┘
```

---

## Current layout — Invoice detail

```
┌─────────────────────────────────────────┐
│ Back: ‹ Payments                        │
│ Title: {invoice number} or Invoice      │
│ Subtitle: {service title} (optional)    │
├─────────────────────────────────────────┤
│ Body:                                   │
│   · Loading spinner                     │
│   · Error + Retry                       │
│   · Invoice card + footer note          │
└─────────────────────────────────────────┘
```

---

## Visible data — Payments hub chrome

| Data                    | Copy                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Back                    | `Profile`                                                                                     |
| Title                   | `Payments`                                                                                    |
| Subtitle                | `Everything owed to Godwit, and everything you have paid.`                                    |
| Trailing CTA            | `Account` / `statement` (two lines)                                                           |
| Account statement alert | Title `Account statement` · Body `Your Godwit account statement will be available here soon.` |

### Global states

| State   | Visible                                  |
| ------- | ---------------------------------------- |
| Loading | Spinner only                             |
| Error   | Friendly message · `Retry` / `Retrying…` |

**Error messages:**  
`Account details are missing. Please sign in again.` · `Your session has expired. Please sign in again.` · `You don't have access to payments for this account.` · `Connection issue. Check your network and try again.` · `Couldn't load payments. Please try again.`

---

## 1. Amount due / credit card

**Shown only when a payments card exists.** Omitted when null.

### Empty ledger variant

| Visible            |
| ------------------ |
| `No payments yet.` |

### Balance / ledger variant

| Data            | Example / shape                                           | Notes                      |
| --------------- | --------------------------------------------------------- | -------------------------- |
| Section heading | `AMOUNT DUE TO GODWIT` or `CREDIT WITH GODWIT`            | By tag                     |
| Tag pill        | `Due` · `Credit` · `Settled`                              | Hidden if none             |
| Amount          | `USD 31,700` · `USD 820 credit` · `USD 0`                 |                            |
| Body            | `Each currency is shown separately, exactly as invoiced.` | Fixed                      |
| Footer          | `Next payment due {date}`                                 | Hidden if no next-due date |

---

## 2. Upcoming payments

| Data          | Copy                    |
| ------------- | ----------------------- |
| Section label | `UPCOMING PAYMENTS`     |
| Empty         | `No upcoming payments.` |

### Each upcoming row

| Data         | Example / shape                      | Notes    |
| ------------ | ------------------------------------ | -------- |
| Day          | `15`                                 | Optional |
| Month        | `AUG`                                | Optional |
| Title        | `Dubai – Hotel` · `Hotel – Aman`     |          |
| Subtitle     | Particulars / place                  | Optional |
| Amount       | `USD 18,500`                         |          |
| Status badge | `Due` · `Overdue` · `Partially paid` |          |

**Badge colors (current):** Overdue warm · Partial muted grey · Due soft green.

Display only (not tappable).

---

## 3. Invoices

| Data          | Copy               |
| ------------- | ------------------ |
| Section label | `INVOICES`         |
| Empty         | `No invoices yet.` |

### Each invoice card (tappable → invoice detail)

| Data   | Example / shape                         | Notes                      |
| ------ | --------------------------------------- | -------------------------- |
| Title  | `Hotel – Aman` · service name           |                            |
| Meta   | `{invoiceNo} · Issued 1 September 2026` | Hidden if both parts empty |
| Amount | `USD 18,500`                            |                            |

---

## 4. Payments received

| Data          | Copy                                 |
| ------------- | ------------------------------------ |
| Section label | `PAYMENTS RECEIVED`                  |
| Empty         | `No payments received yet.`          |
| Scanning      | Spinner + `Looking for payments…`    |
| Load more     | `Load more` (spinner while fetching) |

### Each received row

| Data        | Example / shape                    | Notes    |
| ----------- | ---------------------------------- | -------- |
| Title       | Bank name or `Payment`             |          |
| Subtitle    | `{date} · {docNo} · {particulars}` | Optional |
| Amount      | `USD 8,500`                        |          |
| Status pill | `Received` · `Cleared`             |          |

Proof / receipt URL not shown in UI today.

---

## 5. Credits and refunds

| Data          | Copy                                         |
| ------------- | -------------------------------------------- |
| Section label | `CREDITS AND REFUNDS`                        |
| Empty         | `No credits or refunds yet.`                 |
| Scanning      | Spinner + `Looking for credits and refunds…` |
| Load more     | `Load more`                                  |

### Each credit / refund row

| Data        | Example / shape                    | Notes                                                       |
| ----------- | ---------------------------------- | ----------------------------------------------------------- |
| Title       | `Refund`                           | Fixed                                                       |
| Subtitle    | `{date} · {docNo} · {particulars}` | Optional; default particulars e.g. sale cancellation refund |
| Amount      | `– USD 4,800`                      | Leading dash                                                |
| Status pill | `Refunded` · `Cleared`             |                                                             |

---

## Visible data — Invoice detail

### Chrome

| Data     | Rule                            |
| -------- | ------------------------------- |
| Back     | `Payments`                      |
| Title    | Invoice number or `Invoice`     |
| Subtitle | Service / trip title (optional) |

### States

| State   | Visible                                                                               |
| ------- | ------------------------------------------------------------------------------------- |
| Loading | Spinner                                                                               |
| Error   | Message (e.g. `Invoice not found` / `Failed to load invoice`) · `Retry` / `Retrying…` |

### Invoice card

| Order       | Data                          |
| ----------- | ----------------------------- |
| Brand       | `G O D W I T` (spaced)        |
| Tagline     | `Private travel management`   |
| Fields      | See below                     |
| Line items  | Description · amount per line |
| PDF actions | Only if PDF URL exists        |

**Fields** (hide when empty except number & currency):

| Label            | Value                                          |
| ---------------- | ---------------------------------------------- |
| `INVOICE NUMBER` | Invoice number                                 |
| `CLIENT`         | Client name                                    |
| `ISSUE DATE`     | e.g. `1 September 2026`                        |
| `TRIP REFERENCE` | e.g. `28–31 October` or `Dubai, 28–31 October` |
| `CURRENCY`       | e.g. `USD`                                     |

**Each line item:** description · amount label (e.g. `USD 18,500`)

**PDF actions (when URL present):** `View invoice PDF` · `Share` · `Download`

**Footer (below card):**  
`To settle this invoice, please contact your travel director for payment instructions.`

**Loaded but not shown today:** total / paid / outstanding / status badge / voucher URL (PDF often null in mapper).

---

## Fixed strings checklist

### Hub

`Payments` · `Everything owed to Godwit, and everything you have paid.` · `Account` / `statement` · `AMOUNT DUE TO GODWIT` · `CREDIT WITH GODWIT` · `No payments yet.` · `Each currency is shown separately, exactly as invoiced.` · `UPCOMING PAYMENTS` · `No upcoming payments.` · `INVOICES` · `No invoices yet.` · `PAYMENTS RECEIVED` · `No payments received yet.` · `Looking for payments…` · `CREDITS AND REFUNDS` · `No credits or refunds yet.` · `Looking for credits and refunds…` · `Load more` · `Retry` · `Retrying…` · status pills `Due` / `Overdue` / `Partially paid` / `Received` / `Cleared` / `Refunded` / `Credit` / `Settled`

### Invoice detail

`Payments` (back) · `Invoice` · `G O D W I T` · `Private travel management` · `INVOICE NUMBER` · `CLIENT` · `ISSUE DATE` · `TRIP REFERENCE` · `CURRENCY` · `View invoice PDF` · `Share` · `Download` · settle footer copy · `Retry` / `Retrying…`

---

## Restructure notes

1. Keep the **five hub domains** (amount/credit, upcoming, invoices, received, credits/refunds) unless product drops one.
2. Keep **invoice detail** as a linked screen from the invoices list.
3. Use **current layout** as baseline; change hierarchy freely.
4. Prefer `forest` / `sand` tokens over one-off greys where possible.
5. Account statement is a placeholder alert today — decide product behavior in the new UI.

---

_Content + current-layout baseline for Profile → Payments UI restructure._
