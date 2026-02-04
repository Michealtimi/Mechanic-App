# Endpoint Authorization

This document summarizes which API routes are **public** (no JWT), **authenticated** (JWT required), and **role-restricted** (JWT + specific roles). All endpoints are also subject to global **TenantGuard** (multi-tenancy) and **ThrottlerGuard** (rate limits) unless excluded.

## Public (no JWT)

| Module | Route / Controller | Notes |
|--------|--------------------|--------|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, etc. | Login, signup, refresh token |
| Health | `GET /health` | Liveness/readiness; returns 503 when DB down |
| VIN | `GET /vin/decode`, `GET /vin/validate` | VIN decode/validate |
| Webhooks | `POST /webhooks/*` | Incoming webhooks (verify signature in handler) |
| Payment | Paystack/Flutterwave webhook controllers | Server-to-server; verified by signature |
| External Mechanics | `GET /external-mechanics` (if configured) | Public list |

## Authenticated (JWT only)

- **Wallet** (most): `GET /wallet/*` — JWT required; `POST /wallet/credit/:mechanicId` is **ADMIN/SUPERADMIN** only.
- **Dispatch**: Most dispatch routes require JWT; some require **ADMIN/SUPERADMIN** or **MECHANIC** (see below).
- **Rating**: `@UseGuards(JwtAuthGuard)` — any authenticated user.
- **Chat**: `AuthGuard('jwt')` — any authenticated user.
- **Charging**: `JwtAuthGuard` — any authenticated user.
- **Public API / ApiKey**: Api-key management requires JWT.
- **App Ecosystem**: Webhook subscription endpoints require JWT.

## Role-restricted (JWT + RolesGuard)

| Role(s) | Controllers / Endpoints |
|---------|-------------------------|
| **ADMIN, SUPERADMIN** | Admin, dispute (admin actions), wallet credit, reporting (admin), SLA, revenue-sharing, organization-wallet (admin), subaccount (admin view), payout (admin list), external-mechanics (admin), EV (verify certs). |
| **ADMIN, SUPERADMIN, ORG_ADMIN** | Reporting analytics. |
| **ADMIN, SUPERADMIN, MECHANIC** | Dispatch (e.g. accept/reject), organization-wallet (mechanic view), payout (mechanic view). |
| **ADMIN, CUSTOMER, MECHANIC** | Users (profile view). |
| **ADMIN** | Users (create, delete), EV (verify certificates), mechanic (varies). |
| **MECHANIC** | Booking (status updates, arrived, etc.), users (mechanic profile), subaccount (create/own), payout (own). |
| **CUSTOMER** | Booking (create, cancel, verify completion). |
| **ADMIN, SYSTEM** | SLA (record timestamps). |

## CORS and security headers

- **CORS**: Configured in `main.ts` from `ALLOWED_ORIGINS` (comma-separated). **Production must set `ALLOWED_ORIGINS`** to explicit front-end origins (e.g. `https://app.example.com`).
- **Helmet**: Security headers (HSTS, CSP, etc.) are applied via `helmet()` in `main.ts`.

## Summary

- **Public**: Auth, health, VIN, webhooks, payment gateway webhooks.
- **Authenticated**: Wallet (read/own), dispatch (own), rating, chat, charging, API key management.
- **Admin-only (ADMIN/SUPERADMIN)**: Wallet credit, dispute admin, reporting admin, SLA, revenue-sharing, admin controller, external-mechanics, payout list, EV verify.

When adding new endpoints, ensure they use `@Public()` only when intended, and `@UseGuards(JwtAuthGuard)` plus `@UseGuards(RolesGuard)` and `@Roles(...)` where role-based access is required.
