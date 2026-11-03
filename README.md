# Brand X Digital Showroom

A premium digital showroom for Brand X dealerships in Lucknow. Buyers can explore new and certified used cars, see transparent city pricing, and request a test drive. Consultants receive assigned enquiries in a focused workspace, while administrators control vehicle and pricing data.

## What is included

- Responsive showroom homepage and inventory browsing
- New-car and certified used-car detail pages
- Server-calculated Lucknow on-road pricing with itemised breakup and validity date
- Consent-gated test-drive booking with server-side slot checks
- Automatic showroom-based lead assignment
- Consultant lead inbox with response urgency and editable reply drafts
- Role-protected administrator pricing workspace
- Fictional seed data, masked registration numbers, and demo accounts
- Lightweight English/Hindi navigation support

## Run locally

Prerequisite: Node.js 20 or newer.

```powershell
npm.cmd install
npm.cmd test
npm.cmd start
```

Open `http://localhost:3000`. The first run creates the local data file. Full setup, environment variables, demo accounts, and production notes are in [deployment.md](deployment.md).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.test` | `Admin@123` |
| Sales consultant | `consultant@example.test` | `Consult@123` |
| Buyer | `buyer@example.test` | `Buyer@123` |

These accounts use fictional data and are for local review only.

## Main routes

- `/` and `/cars` — new-car showroom
- `/used` — certified used inventory
- `/book/:vehicleId` — test-drive booking
- `/consultant` — assigned enquiry inbox
- `/admin` — pricing administration

## Architecture

The Node HTTP server owns validation, authorization, lead assignment, booking conflict checks, and the deterministic price engine. The browser consumes API responses and never calculates authoritative on-road prices. The local persistence adapter keeps the project easy to run and can be replaced by PostgreSQL/Prisma without changing the route contract.

## Testing

```powershell
npm test
```

The test suite covers the price engine's normal calculation and missing-pricing behavior. The API also re-checks booking availability immediately before persisting a booking.

## Project documentation

- [Technical Design Document](TDD.md)
- [Deployment guide](deployment.md)
