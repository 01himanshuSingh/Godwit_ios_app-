# Firebase / BFF module map

Server tenant root: `admins/{adminId}`. Mobile reads/writes only via `/v1` BFF.

| # | Module | Feature folder | Existing CRM collections (reuse) | New collections (client-side) |
|---|--------|----------------|----------------------------------|-------------------------------|
| 1 | Authentication | `src/auth` | `clients`, `configuration` | `auth_identities`, `mobile_users`, `account_users`, `refresh_tokens`, `device_tokens`, `email_otps` (proposed) |
| 2 | Permissions and session | `src/permissions` | `clients` | `mobile_users`, `account_users` |
| 3 | Home and attention | `features/home` | `customerServices`, `sales`, `quotations`, `clientLedger`, `enquiries`, `customers` | `notifications`, `messages` (read), `attention_items` (optional) |
| 4 | Trips and itinerary | `features/trips` | `customerServices`, `sales`, `customers` | - |
| 5 | Booking detail | `features/bookings` | `customerServices`, `sales`, `customerProfile` | `client_documents` |
| 6 | Travel requests | `features/requests` | `enquiries`, `quotations`, `customers` | `request_questions` |
| 7 | Quotes and approval | `features/quotes` | `quotations` | `quotation_approvals`, `quotation_questions` |
| 8 | Messaging | `features/messages` | `staff` (lookup only) | `conversations`, `messages`, `message_attachments`, `conversation_reads` |
| 9 | Payments and statements | `features/payments` | `customers`, `clientLedger`, `billingDetails`, `payment`, `servicePayment`, `exchange_rates` | `invoices` (optional) |
| 10 | Documents vault | `features/documents` | `customerServices`, `sales`, `customerProfile` | `client_documents` |
| 11 | Notifications and push | `features/notifications` | - | `notifications`, `device_tokens` |
| 12 | Profile hub | `features/profile` | `clients`, `staff` (lookup only) | - |
| 13 | Travellers and identity | `features/travellers` | `customers`, `customerProfile` | `profile_change_requests` |
| 14 | Preferences | `features/preferences` | `clients`, `customerProfile` | `traveller_preferences` (optional) |
| 15 | Account access | `features/account-access` | `clients` | `account_users`, `account_access_requests` |
| 16 | Security (placeholder) | `features/security` | - | `mobile_users` (read) |
| 17 | Hotels (Sabre) | `features/hotels` | Phase 2 | Phase 2 |
| 18 | Private Jets (Avinode) | `features/private-jets` | Phase 2 | Phase 2 |

**Notes**

- Trips are not a separate collection: `tripId` = `bookingId` = `customerVisitId` from `customerServices` + `clients/{clientId}/sales`.
- `staff` is never used for mobile login.
- `appNotification` and `channels` are not reused.
