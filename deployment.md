# Deployment

## Prerequisites

Node.js 20 or newer.

## Install and run

```powershell
npm.cmd install
npm.cmd test
npm.cmd start
```

## Environment variables

Copy `.env.example` to `.env` and set values as appropriate:

- `PORT`
- `SESSION_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Set `GEMINI_API_KEY` only on the server. When it is absent, the local development adapter keeps the review flow usable and labels its output as development-generated. When configured, Gemini generates the summary and first-reply draft server-side; the browser never receives the API key.

## Demo accounts

- Admin: `admin@example.test` / `Admin@123`
- Consultant: `consultant@example.test` / `Consult@123`
- Buyer: `buyer@example.test` / `Buyer@123`

These are fictional local-only accounts. Passwords are stored as scrypt hashes by the local adapter and must be replaced with managed production credentials before deployment.

## Production notes

Use PostgreSQL with Prisma migrations, a managed secret store, HTTPS-only cookies, Argon2/bcrypt password hashing, request rate limiting, structured audit logs, and an external AI provider with schema validation. The current zero-dependency JSON adapter is for take-home evaluation and local demonstration only.

## Known limitations

The current build intentionally focuses on the core journey. It has lightweight English/Hindi navigation support, a local persistence adapter, deterministic AI-assistance fallback, and no payments, messaging integrations, or service booking.
