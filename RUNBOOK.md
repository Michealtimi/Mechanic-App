# Runbook — Mechanic Platform Backend

Operational guide: env, migrations, cron, queues, health, and platform config.

---

## 1. Environment variables

Copy from `.env.example` and set values. Required:

- **Database:** `DATABASE_URL` (PostgreSQL)
- **Auth:** `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (and expires)
- **Redis:** `REDIS_HOST`, `REDIS_PORT` (for BullMQ + Socket.IO adapter)
- **Payment:** `PAYSTACK_SECRET_KEY` and/or `FLW_SECRET_KEY`, webhook secrets; `PAYMENT_GATEWAY` (SANDBOX | PAYSTACK | FLUTTERWAVE)
- **Maps:** OpenStreetMap/Nominatim-based provider (`src/api/maps.service.ts`)
- **Encryption:** `ENCRYPTION_KEY` (64 hex chars, for webhook secrets etc.)
- **Platform config (Invisible Foreman):** see [Platform config](#2-platform-config) below.
- **Receipts:** `APP_URL` (e.g. `https://api.yourapp.com`) — used for receipt image URLs and static `/receipts` base.

---

## 2. Platform config

Configurable via env (and optionally `PlatformConfig` table). Defaults used when not set:

| Variable | Default | Description |
|----------|---------|-------------|
| `DISPATCH_RADIUS_KM` | 10 | Max distance (km) for mechanic offers |
| `GEOFENCE_RADIUS_METRES` | 200 | Mechanic must be within this (m) of job to start |
| `DISPATCH_FIRST_WAVE_SIZE` | 3 | Number of mechanics offered in first wave |
| `DISPATCH_SECOND_WAVE_SIZE` | 5 | New offers after timeout if no accept |
| `DISPATCH_OFFER_TIMEOUT_MS` | 120000 | Offer validity (2 min) before second wave |
| `PLATFORM_COMMISSION_PERCENT` | 10 | Platform commission % when not stored on booking |
| `APP_URL` | — | Base URL for receipt links; set in production |

See `.env.example` for full list and comments.

---

## 3. Database

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy   # production
# or
npx prisma migrate dev --name <name>   # development (creates migration)

# Optional: seed
npx prisma db seed
```

---

## 4. Cron jobs

- **Dispatch timeout (Invisible Foreman)**  
  - **Class:** `DispatchTimeoutCron` (`src/dispatch/dispatch-timeout.cron.ts`)  
  - **Schedule:** Every minute (`@Cron(CronExpression.EVERY_MINUTE)`)  
  - **Action:** Cancels expired dispatch offers and creates a second wave of 5 new offers for bookings still PENDING.  
  - **Requirement:** App must be running (NestJS `ScheduleModule`); no separate worker. Ensure a single instance runs this in production or use a distributed lock if you scale horizontally.

---

## 5. Queues (BullMQ)

- **Queues:** `payments`, `notifications` (and any other defined in `queues/`).  
- **Storage:** Redis (same as `REDIS_HOST` / `REDIS_PORT`).  
- **Processors:** Payment and notification processors run inside the API process.  
- **Monitoring:** Use Bull Board or Redis CLI to inspect queues and failed jobs.

---

## 6. Receipt images (Vehicle Health Certificate)

- **Generated at:** Job completion for EV-related bookings (backend).  
- **Served at:** `GET /receipts/:filename` (static from `uploads/receipts/`).  
- **URL in API:** `GET /bookings/:id/receipt` returns `{ imageUrl }` (e.g. `{APP_URL}/receipts/{bookingId}.png`).  
- **Requirement:** Set `APP_URL` so receipt links point to your API base.

---

## 7. Health / readiness

- **Swagger:** `GET /api` (or configured path).  
- **Health:** `GET /health` — returns 200 when DB is reachable; returns **503** with `Retry-After: 60` and body `{ statusCode: 503, message: "Service temporarily unavailable", ... }` when DB is down. Use for load-balancer health checks.

---

## 8. Query limits (scalability)

All list and report endpoints enforce bounded reads to avoid OOM at scale:

- **Booking list:** `GET /bookings` uses `skip`/`take` (pagination); default `take: 10`, max page size should be capped (e.g. 100) in controller or DTO.
- **Reporting analytics:** `getBookingAnalytics` uses DB `count`/`groupBy`/`aggregate`; the only `findMany` is capped at `take: 10000` for by-month grouping.
- **Wallet transactions:** `GET /wallet/transactions` uses `page`/`limit` with `limit` capped at 50.
- **General:** Any new list or report endpoint should use pagination (`skip`/`take`) or a hard cap (e.g. `take: 10000`) and document the cap here.

---

## 9. Start commands

```bash
# Install
yarn install   # or npm install

# Development
yarn start:dev   # or npm run start:dev

# Production build
yarn build
yarn start:prod
```

Ensure Redis and PostgreSQL are running and reachable before starting the app.

## 10. Docker

```bash
# Build
docker build -t mechanic-api .

# Run (set DATABASE_URL, REDIS_HOST, JWT secrets, etc. via env or --env-file .env)
docker run -p 3000:3000 --env-file .env mechanic-api
```

Migrations are not run automatically in the image; run them against your DB before or after deploy (e.g. `npx prisma migrate deploy` from a host with env).

---

## 11. Security

- **CORS:** Set `ALLOWED_ORIGINS` in production to explicit front-end origins (e.g. `https://app.example.com`). See `main.ts`.
- **Endpoint authorization:** See `docs/security/ENDPOINT_AUTHORIZATION.md` for which routes are public, JWT-only, or role-restricted (ADMIN/SUPERADMIN, etc.).
- **TypeScript:** Backend uses `noImplicitAny: true`. Run `npm run build` locally to ensure no type errors after changes.
