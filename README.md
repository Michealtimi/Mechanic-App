# Mechanic Service Booking Platform

A NestJS backend for a mechanic-service marketplace. The application supports customer and mechanic workflows, service discovery, booking and dispatch operations, payment-provider integrations, and asynchronous processing.

## Backend capabilities

- Authentication and role-aware access for platform users
- Mechanic profiles, service listings, and service discovery
- Booking and dispatch workflows
- Payment integration adapters, including Paystack, Flutterwave, Stripe, and sandbox/testing flows
- Payment webhook endpoints and payment-status handling
- Wallet- and payout-related application services
- Tenant-aware access patterns
- Background jobs and scheduled processing with BullMQ
- Real-time application events with Socket.IO
- API documentation with Swagger

## Technology

- Node.js, NestJS, TypeScript
- PostgreSQL and Prisma
- Redis and BullMQ
- Socket.IO
- Jest and Swagger/OpenAPI

## Run locally

### Prerequisites

- Node.js (use the version specified by the project configuration, if present)
- PostgreSQL
- Redis
- A package manager compatible with the lockfile
- Provider credentials only if testing live payment integrations

### Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Configure the environment variables in `.env` before starting the application. Do not commit real credentials or production secrets.

## Useful scripts

Check `package.json` for the current scripts. The project includes commands for building, running tests, end-to-end tests, webhook-related tests, and Prisma tooling.

## Engineering considerations

Payment and wallet workflows require careful verification before production use. In particular, validate provider webhook signatures, idempotency, payment state transitions, database transaction boundaries, ledger invariants, concurrent requests, secret configuration, and tenant isolation. The presence of an integration or test does not by itself establish production certification.

## Project status

This repository is shared for technical review and demonstration. Review the current implementation and configuration before deploying it in a production environment.

## License

UNLICENSED. All rights reserved.
