# TeamReady API

Backend foundation for organisation, coach, player, invitation, wellness check-in and dashboard flows.

## Local setup

```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name initial
npm run dev
```

API: `http://localhost:4000`
Health check: `GET /health`

## Main API flows

### Authentication

- `POST /api/auth/register-organisation`
- `POST /api/auth/login`
- `GET /api/me`

### Team management

- `POST /api/organisations/:organisationId/teams`
- `POST /api/teams/:teamId/invitations`

### Invitation acceptance

- `GET /api/invitations/:token`
- `POST /api/invitations/:token/accept`

### Player wellness

- `POST /api/teams/:teamId/check-ins`

One check-in is stored per player, team and calendar date. Re-submitting the same date updates the existing record.

### Coach views

- `GET /api/teams/:teamId/dashboard?date=YYYY-MM-DD`
- `GET /api/teams/:teamId/players/:playerId`
- `POST /api/teams/:teamId/players/:playerId/notes`

## Readiness rules

The current readiness score is an initial product rule, not medical clearance. Severe pain or illness forces the result into the unavailable range. Authorised staff still make the final training or match decision.

## Security included

- Password hashing with bcrypt
- Signed JWT access tokens
- Team role checks
- Request validation with Zod
- Helmet security headers
- Invitation tokens stored as SHA-256 hashes
- Invitation expiry
- Audit-log model
- Medical-note restrictions

## Before production

Replace SQLite with PostgreSQL, configure transactional email, add email verification and password reset, rotate refresh tokens, rate-limit authentication and invitation routes, add automated tests, implement child/guardian consent rules, encrypt sensitive medical fields, and define retention/deletion policies.
