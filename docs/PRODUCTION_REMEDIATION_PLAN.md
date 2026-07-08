# Production Remediation Plan

**Purpose:** Actionable plan to address the full system audit (NestJS backend).  
**Baseline (2026-04-10):** `npm run build` passes after TS/Prisma alignment across payments, booking/cron, reporting, revenue-sharing, subaccounts, telemetry, wallet, and related modules. **Env validation:** `ConfigModule` uses Joi (`src/config/env.validation.ts`) — `DATABASE_URL` required; `JWT_SECRET` / `API_KEY_SECRET` / `ENCRYPTION_KEY` stricter in `production`. **Webhook tests:** `src/payment/payments.webhook.spec.ts` (run `npm test -- payments.webhook`). Remaining items: operational runbooks, full e2e against real DB, and gateway-specific staging tests.

---

## 1. Goals and exit criteria

| Goal | Exit criteria |
|------|----------------|
| **Shippable build** | `npm run build` passes in CI on every merge to main. |
| **Money path safe** | Webhooks verified per provider; idempotent processing; segment release wired after completion. |
| **Access control** | Mutations enforce ownership / role / tenant where applicable; no placeholder public APIs for sensitive data. |
| **Operational readiness** | Required env vars validated at startup; health checks cover DB + Redis; critical paths have tests or runbooks. |

---

## 2. Phasing overview

| Phase | Horizon | Focus |
|-------|---------|--------|
| **P0** | Blocker (days1–3) | Green build, payments webhooks, cancel authz, segment payment release, env validation |
| **P1** | High (days 4–10) | Cron/reconcile alignment, queue refund path, reporting/Prisma field fixes, duplicate dispatch consolidation |
| **P2** | Medium (weeks 2–4) | Observability, DLQ, rate limits per route, security review, load/chaos on payment paths |

---

## 3. P0 — Must fix before any production traffic

### 3.1 Restore a compiling codebase

**Problem:** Broad TS failures (controllers, DTOs, services vs Prisma schema, missing types, wrong method signatures).

**Actions (sequenced):**

1. **Payment module**
   - Align `PaystackGateway` / `FlutterwaveGateway` constructors with `payments.module.ts` factory.
   - Split webhook handling: Paystack (HMAC-SHA512 on raw body) vs Flutterwave (`verif-hash` equals secret); stop passing parsed `@Body()` into `handleWebhook` expecting `Buffer`.
   - Remove or fix generic `POST /payments/webhook` if redundant with `/webhooks/paystack` and `/webhooks/flutterwave`.

2. **Booking**
   - Fix `payment` variable typing in `createBooking` (e.g. union type instead of `null` only).
   - Implement `cancelBooking` checks: caller must be `customerId` (or explicit admin path); validate cancellable statuses before refund.

3. **Dispatch**
   - Replace undefined `User` / `UserRequest` with proper Express request types (e.g. `Request` + typed `req.user` or a shared `AuthenticatedRequest` interface).

4. **Reporting**
   - Remove syntax error (`if (pay) {y`).
   - Replace invalid Prisma filters: use `orgId` / relation shapes that match `schema.prisma` (`organization`, not stray `organizationId` on `Booking` where invalid).
   - Use `segment.payments` and valid `PaymentStatus` values (no `COMPLETED` if not in enum).

5. **Users / DTOs**
   - Fix `CreateUserDto` export and `createmechanic.dto` ordering (class before extend).
   - Align `UsersController` with `UsersService.createUser(dto, callerId, callerRole)` and implement or wire `update` / `remove` or remove dead routes.

6. **Wallet / payout / rating / EV / SLA / telemetry / vin / vehicles**
   - Fix each cluster until `nest build` is clean: Prisma model names (`Review` vs `rating`, `evCertification` vs schema), `Payout` fields vs schema, missing gateway methods, import fixes (`ParseUUIDPipe`, `ApiPropertyOptional`, `nodemailer` types).

**Verification:** `npm run build` + optional `npm run lint`.

---

### 3.2 Payment webhooks (security + correctness)

**Problem:** Single `handleWebhook` assumes Paystack HMAC; Flutterwave path reuses it; `PaymentController` may pass JSON instead of raw buffer.

**Actions:**

- Implement `handlePaystackWebhook(signature, rawBody)` and `handleFlutterwaveWebhook(signature, rawBody)` (or equivalent) in `PaymentsService`.
- Controllers: use `@Req() req: RawBodyRequest<Request>` and `req.rawBody` only.
- Persist webhook idempotency using `PaymentEvent` unique constraint on `(gateway, gatewayEvent)` before mutating payment state.
- Document gateway-specific env: `PAYSTACK_WEBHOOK_SECRET`, `FLW_WEBHOOK_SECRET` (or name used in `.env.example`).

**Verification:** Manual tests with signed sample payloads; duplicate webhook delivery does not double-credit.

---

### 3.3 Segment completion → fund release

**Problem:** `releaseSegmentPayment` exists but is not called from segment completion flow.

**Actions:**

- After segment is marked `COMPLETED` (and authorization checks pass), call `PaymentsService.releaseSegmentPayment(segmentId)` or equivalent single transactional path.
- Reconcile with booking-level vs segment-level payment model (multiple `Payment` rows per booking).

**Verification:** Integration test: pay → complete segment → mechanic wallet credited once.

---

### 3.4 Environment validation at bootstrap

**Problem:** `ConfigModule.forRoot` has no schema; misconfiguration fails late.

**Actions:**

- Add Joi (or Zod) validation for: `DATABASE_URL`, JWT secrets, `REDIS_*`, `PAYMENT_GATEWAY`, provider secrets conditional on gateway, `NODE_ENV`, `PORT`, `ALLOWED_ORIGINS` in production.

**Verification:** App refuses to start with empty required secrets in production.

---

## 4. P1 — High priority after P0

### 4.1 Cron and reconciliation services

**Problem:** `booking-cleanup.service.ts` and `payment-reconcile.service.ts` reference wrong shapes (`booking.payment` vs `payments`), wrong `verifyPayment` arity, non-existent notification methods, invalid `PaymentStatus` literals.

**Actions:**

- Align includes/selects with Prisma relations.
- Pass gateway name into `verifyPayment(reference, gatewayName)`.
- Implement or remove calls to missing `NotificationGateway` methods.

---

### 4.2 BullMQ payment processor

**Problem:** Refund branch may call non-existent `refundPayment`; optional `PaymentsService` injection ambiguity.

**Actions:**

- Call `PaymentsService.refund(reference, amount, tx)` consistently.
- Ensure processor is constructed with `PaymentsService` required where refund jobs run.

---

### 4.3 Public API

**Problem:** `GET /public/mechanics` is a stub; parameter order breaks TS; booking/vehicle access must respect org boundaries.

**Actions:**

- Implement mechanics listing (e.g. delegate to `GeoService` / mechanic query) or return `501` with feature flag until ready.
- Fix handler signature order (`@Req` before optional `@Query` or make query params required).
- Enforce `apiKey.organizationId` on `getBooking` / `getVehicle` scoping.

---

### 4.4 Reporting and analytics

**Problem:** Field mismatches and broken aggregations undermine trust.

**Actions:**

- Fix all filters to match schema (`orgId`, `Booking.organization`, etc.).
- Fix `reporting.controller.ts` roles: remove or add `ORG_ADMIN` / `SYSTEM` to Prisma `Role` enum consistently across app.

---

### 4.5 Architecture: single dispatch authority

**Problem:** `BookingService.createDispatch` vs `DispatchService.createDispatch` duplicates logic.

**Actions:**

- Deprecate dispatch creation from `BookingService`; route all dispatch through `DispatchModule`.
- Update any callers and delete dead code paths.

---

## 5. P2 — Production hardening

- **Observability:** Structured logging (request ID), metrics for webhook latency, payment state transitions, dispatch acceptance rate.
- **Queues:** Dead-letter queues; alert on payment job failures after max retries.
- **Security:** Swagger exposure policy for production; CORS lockdown; rate limits on auth and payment init.
- **Testing:** Contract tests for Paystack/Flutterwave adapters (mocked); E2E for booking → payment → completion → wallet.
- **Data:** Migration review for monetary fields (kobo vs major units) documented in one place.

---

## 6. Work breakdown (suggested ownership)

| Workstream | Primary files / areas |
|------------|------------------------|
| Build unblock | `src/**/*.ts` per compiler errors; `package.json` scripts |
| Payments | `src/payment/*`, `prisma/schema.prisma` (if PaymentEvent usage changes) |
| Booking / dispatch | `src/booking/*`, `src/dispatch/*` |
| Infra config | `src/app.module.ts`, `src/main.ts` |
| Background jobs | `src/cron/*`, `src/queues/*` |
| Reporting / admin | `src/reporting/*`, `src/admin/*` |

---

## 7. Milestone checklist

- [ ] **M1:** `npm run build` green  
- [ ] **M2:** Paystack + Flutterwave webhooks verified and idempotent  
- [ ] **M3:** Cancel booking authorized + refund path tested  
- [ ] **M4:** Segment completion releases funds correctly  
- [ ] **M5:** Env validation on boot  
- [ ] **M6:** Cron/reconcile aligned with `PaymentsService` API  
- [ ] **M7:** Public API either complete or explicitly disabled  
- [ ] **M8:** Dispatch logic single-sourced  
- [ ] **M9:** CI pipeline runs build + tests  

---

## 8. References

- Audit findings summarized from: full system review of `Mechanic-App-main` (NestJS + Prisma + BullMQ).
- Related project layout: `docs/FOLDER_STRUCTURE.md`

---

*Last updated: aligned with audit baseline (build failures, webhook handling, authz, and flow gaps). Update this document as milestones complete.*
