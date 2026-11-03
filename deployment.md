# Deployment

## Prerequisites

Node.js 20 or newer.

## Install and run

```powershell
npm install
npm test
npm start
```

## Environment variables

Copy `.env.example` to `.env` and set values as appropriate:

- `PORT`
- `SESSION_SECRET`
- `AI_PROVIDER_URL`
- `AI_PROVIDER_API_KEY`

The current local demo uses a deterministic server-side development adapter so the consultant workflow remains usable without an external provider. Configure a real server-side provider before production use; the browser must never receive the API key.

## Demo accounts

- Admin: `admin@example.test` / `Admin@123`
- Consultant: `consultant@example.test` / `Consult@123`
- Buyer: `buyer@example.test` / `Buyer@123`

These are fictional local-only accounts. Passwords are stored as scrypt hashes by the local adapter and must be replaced with managed production credentials before deployment.

## Production notes

Use PostgreSQL with Prisma migrations, a managed secret store, HTTPS-only cookies, Argon2/bcrypt password hashing, request rate limiting, structured audit logs, and an external AI provider with schema validation. The current zero-dependency JSON adapter is for take-home evaluation and local demonstration only.

## Known limitations

The current build intentionally focuses on the core journey. It has lightweight English/Hindi navigation support, a local persistence adapter, deterministic AI-assistance fallback, and no payments, messaging integrations, or service booking.
