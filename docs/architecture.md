# 🏗️ Backend Architecture & Module Specification

> **Last Updated**: January 26, 2026
> **Version**: MVP (v0.1) - ~90% Complete

This document provides a comprehensive overview of the Mechanic App backend architecture, including folder structure, modules, API contracts, security, and deployment considerations.

---

## 📋 Table of Contents

1. [Folder Structure & Organization](#1-folder-structure--organization)
2. [Modules & Responsibilities](#2-modules--responsibilities)
3. [Prisma Schema Overview](#3-prisma-schema-overview)
4. [API Contracts](#4-api-contracts)
5. [RBAC & Tenancy Rules](#5-rbac--tenancy-rules)
6. [Queue & Background Jobs](#6-queue--background-jobs)
7. [Payment & Escrow Flows](#7-payment--escrow-flows)
8. [EV Telemetry & Charging Integration](#8-ev-telemetry--charging-integration)
9. [Security Best Practices](#9-security-best-practices)
10. [Testing & CI/CD](#10-testing--cicd)

---

## 1. Folder Structure & Organization

### 1.1 Root Structure

```
Mechanic-App/
├── src/                          # Source code
│   ├── app.module.ts            # Root NestJS module
│   ├── main.ts                  # Application entry point
│   ├── common/                   # Shared utilities
│   ├── config/                   # Configuration (future)
│   ├── modules/                  # Feature modules (see below)
│   ├── queues/                   # BullMQ processors
│   ├── api/                      # External API integrations
│   ├── utils/                    # Helper utilities
│   └── workers/                  # Background workers
├── prisma/                       # Prisma ORM
│   └── schema.prisma            # Database schema
├── test/                         # Tests
│   ├── unit/                    # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── docs/                         # Documentation
├── dist/                         # Compiled output
└── package.json                  # Dependencies
```

### 1.2 Standard Module Structure

Every feature module follows this structure:

```
src/{module-name}/
├── dto/                          # Data Transfer Objects
│   ├── create-*.dto.ts          # Creation DTOs
│   ├── update-*.dto.ts          # Update DTOs
│   └── *-response.dto.ts        # Response DTOs
├── {module-name}.controller.ts  # REST API controller
├── {module-name}.service.ts     # Business logic
├── {module-name}.module.ts      # NestJS module
└── {module-name}.spec.ts        # Unit tests (optional)
```

**Example**: `src/organizations/`
```
organizations/
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   ├── add-member.dto.ts
│   └── organization-response.dto.ts
├── organizations.controller.ts
├── organizations.service.ts
└── organizations.module.ts
```

### 1.3 Common/Shared Code Structure

```
src/common/
├── decorators/
│   ├── public.decorator.ts      # @Public() - bypass auth
│   ├── tenant-id.decorator.ts   # @TenantId() - extract tenant
│   └── roles.decorators.ts      # @Roles() - role-based access
├── guards/
│   ├── tenant.guard.ts          # Multi-tenancy enforcement
│   └── roles.guards.ts          # Role-based access control
├── interceptors/
│   ├── tenant.interceptor.ts    # Auto-inject tenantId
│   └── wallet-ledger.interceptor.ts  # Wallet operation monitoring
├── encryption/
│   ├── encryption.service.ts    # AES-256-GCM encryption
│   └── encryption.module.ts
└── validator/
    └── is-bigint.validator.ts   # Custom validators
```

### 1.4 Queue Processors Structure

```
src/queues/
├── processors/
│   ├── payment-queue.processor.ts    # Payment jobs
│   └── notification-queue.processor.ts  # Notification jobs
└── queues.module.ts                   # Queue configuration
```

---

## 2. Modules & Responsibilities

### 2.1 Core Modules

#### **Users Module** (`src/users/`)

**Entities**: `User`, `Profile`, `OrgMembership`

**Responsibilities**:
- User account creation, login, JWT authentication
- Profile management (edit, upload photo, delete account)
- Organization association
- Role assignment

**API Contracts**:
```
POST   /users                    → Create user
GET    /users/:id                → Fetch profile
PATCH  /users/:id                → Edit profile
DELETE /users/:id                → Soft delete account
GET    /users/me                 → Current logged-in user
```

**RBAC Restrictions**:
- **Customer**: Own profile only
- **Mechanic**: Own profile + org memberships
- **OrgAdmin**: Can view/manage org users
- **PlatformAdmin**: Full access

---

#### **Organizations Module** (`src/organizations/`)

**Entities**: `Organization`, `OrgMember`

**Responsibilities**:
- Multi-tenant organization management
- Fleet management (B2B vs B2C)
- Member management (add, remove, roles)
- Organization-level settings

**API Contracts**:
```
POST   /organizations            → Create organization
GET    /organizations/:id         → Fetch organization
PATCH  /organizations/:id        → Update organization
DELETE /organizations/:id         → Delete organization
POST   /organizations/:id/members → Add member
DELETE /organizations/:id/members/:userId → Remove member
GET    /organizations/:id/members → List members
```

**RBAC**:
- **OrgOwner**: Full control
- **OrgAdmin**: Manage members, vehicles, bookings
- **FleetManager**: Manage vehicles and dispatch
- **Dispatcher**: Assignment only
- **Member**: Read-only access

---

#### **Auth Module** (`src/auth/`)

**Entities**: `User`, `RefreshToken`

**Responsibilities**:
- JWT token generation and validation
- User authentication (login, signup)
- Password hashing (bcrypt)
- Refresh token management
- Multi-tenant token support

**API Contracts**:
```
POST   /auth/signup              → Register new user
POST   /auth/login               → Login
POST   /auth/refresh             → Refresh access token
POST   /auth/logout              → Logout
```

**Security**:
- Password hashing with bcrypt (10 rounds)
- JWT tokens include `tenantId` for multi-tenancy
- Refresh tokens stored in database
- Rate limiting on login endpoints

---

### 2.2 Feature Modules

#### **Bookings Module** (`src/booking/`)

**Entities**: `Booking`, `BookingSegment`, `BookingStateHistory`

**Responsibilities**:
- Marketplace & fleet bookings
- Multi-segment booking support (EV battery, tires, etc.)
- State machine: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` → `CANCELLED`
- Segment assignment to mechanics
- Booking status calculation based on segments

**API Contracts**:
```
POST   /bookings                          → Create booking
GET    /bookings/:id                      → Fetch booking
PATCH  /bookings/:id                      → Update booking
GET    /bookings                          → List bookings (filtered by tenant)
GET    /bookings/org/:orgId               → Fleet dashboard
PATCH  /bookings/:id/cancel               → Cancel booking
POST   /bookings/:id/segments/:segmentId/assign → Assign mechanic to segment
PATCH  /bookings/:id/segments/:segmentId/status → Update segment status
POST   /bookings/:id/segments/:segmentId/complete → Complete segment
```

**State Machine**:
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
   ↓
CANCELLED
```

**Multi-Segment Support**:
- Each booking can have multiple segments
- Each segment can be assigned to different mechanics
- Segment status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- Booking status calculated from segment statuses

**RBAC**:
- **Customer**: Own bookings
- **Mechanic**: Assigned bookings
- **OrgAdmin/Dispatcher**: Fleet bookings
- **PlatformAdmin**: All bookings

---

#### **Payment & Wallet Module** (`src/payment/`, `src/wallet/`)

**Entities**: `Payment`, `Wallet`, `WalletTransaction`, `SubAccount`

**Responsibilities**:
- Payment gateway integration (Paystack, Flutterwave)
- Escrow handling (funds held until service completion)
- Partial releases for multi-segment bookings
- Refunds and chargebacks
- Wallet ledger integrity & idempotency
- Event-driven wallet updates

**API Contracts**:
```
POST   /payments/initialize       → Initialize payment
POST   /payments/verify           → Verify payment
POST   /payments/refund           → Process refund
POST   /payments/webhook/paystack → Paystack webhook
POST   /payments/webhook/flutterwave → Flutterwave webhook
GET    /wallets/:userId           → Get wallet balance
GET    /wallets/org/:orgId        → Get org wallet
POST   /wallets/transfer          → Transfer funds
POST   /payments/segments/:segmentId/release → Release segment payment
GET    /payments/bookings/:bookingId/status → Calculate payment status
```

**Payment Flow**:
1. Customer initiates payment → `PaymentStatus.PENDING`
2. Payment gateway processes → `PaymentStatus.SUCCESS`
3. Funds held in escrow
4. Segment completion → Partial release to mechanic
5. All segments complete → Remaining funds released

**Escrow Logic**:
- Platform fee: 10% of total amount
- Segment-level escrow: Each segment payment held separately
- Partial release: Funds released per segment completion
- Refund: Full or partial refunds supported

**Security**:
- All wallet operations use ledger methods
- Idempotency keys for payments
- Webhook signature verification
- Transaction-level locking

---

#### **Dispatch Module** (`src/dispatch/`)

**Entities**: `Dispatch`

**Responsibilities**:
- Manual mechanic assignment to bookings
- Distance and duration calculation
- Dispatch offer system (mechanics can accept/reject)
- SLA tracking for dispatch

**API Contracts**:
```
POST   /dispatch                  → Create dispatch
GET    /dispatch/:id              → Get dispatch
PATCH  /dispatch/:id/accept      → Accept dispatch
PATCH  /dispatch/:id/reject      → Reject dispatch
GET    /dispatch/bookings/:bookingId → Get dispatches for booking
```

**Dispatch Flow**:
1. Admin/Dispatcher creates dispatch → `DispatchStatus.OFFERED`
2. Mechanic receives notification
3. Mechanic accepts → `DispatchStatus.ACCEPTED`
4. Booking status updated to `CONFIRMED`
5. SLA tracking begins

**Integration**:
- Uses Google Maps API for distance/duration
- Real-time notifications via Socket.IO
- SLA service tracks dispatch times

---

#### **Dispute Module** (`src/dispute/`)

**Entities**: `Dispute`, `EvidenceUpload`

**Responsibilities**:
- Segment-level and booking-level disputes
- Evidence upload functionality
- Auto-triage for disputes < NGN10k
- Manual escalation for larger disputes
- Financial resolution (refunds, debits)

**API Contracts**:
```
POST   /disputes                  → Raise dispute
GET    /disputes                  → List disputes (admin)
GET    /disputes/:id              → Get dispute
PATCH  /disputes/:id/resolve      → Resolve dispute (admin)
POST   /disputes/:id/evidence     → Add evidence
```

**Auto-Triage**:
- Disputes < NGN10k: Auto-resolved with full refund
- Disputes >= NGN10k: Manual review required

**Dispute Flow**:
1. User raises dispute → `DisputeStatus.PENDING`
2. Evidence uploaded (optional)
3. Auto-triage check (if segment-level and < NGN10k)
4. Admin review (if not auto-resolved)
5. Resolution → `DisputeStatus.RESOLVED` or `REJECTED`

---

#### **Vehicles Module** (`src/vehicles/`)

**Entities**: `Vehicle`

**Responsibilities**:
- Vehicle CRUD operations
- EV/ICE badge support
- Location tracking
- Vehicle status management
- Soft delete with active booking check

**API Contracts**:
```
POST   /vehicles                  → Add vehicle
GET    /vehicles/:id              → Get vehicle
PATCH  /vehicles/:id              → Update vehicle
DELETE /vehicles/:id              → Soft delete vehicle
PATCH  /vehicles/:id/location    → Update location
GET    /vehicles/org/:orgId       → List org vehicles
```

**Vehicle Types**:
- `EV`: Electric Vehicle
- `ICE`: Internal Combustion Engine

**Status**:
- `ACTIVE`: Available for bookings
- `INACTIVE`: Not available
- `MAINTENANCE`: Under maintenance

---

#### **Telemetry Module** (`src/telemetry/`)

**Entities**: `EVMetric`

**Responsibilities**:
- EV telemetry data recording
- Metric filtering and aggregation
- Latest metric retrieval
- Time-series data storage

**API Contracts**:
```
POST   /telemetry                 → Record metric
GET    /telemetry/:vehicleId      → Get metrics
GET    /telemetry/:vehicleId/latest → Get latest metric
GET    /telemetry/:vehicleId/filter → Filter metrics
```

**Metric Types**:
- Battery level (0-100%)
- State of Charge (SOC) (0-1)
- Range (km)
- Timestamp
- Source (MANUAL, SMARTCAR, TOR_LOCO, HYUNDAI, OTHER)

**Future Integration** (Phase 2):
- Smartcar adapter
- Tor Loco adapter
- Hyundai adapter

---

#### **Chat Module** (`src/chat/`)

**Entities**: `ChatRoom`, `ChatMessage`

**Responsibilities**:
- Real-time chat via Socket.IO
- Message persistence
- Booking-scoped chat rooms
- Segment-level chat support

**API Contracts**:
```
GET    /chat/:bookingId           → Get chat messages
POST   /chat/:bookingId           → Send message
GET    /chat/:bookingId/segments/:segmentId → Get segment chat
```

**Real-time Events**:
- `message.sent` - New message broadcast
- `typing.start` - User typing indicator
- `typing.stop` - User stopped typing

---

#### **Notification Module** (`src/notification/`)

**Entities**: `Notification`

**Responsibilities**:
- Email notifications
- SMS notifications
- Push notifications
- Notification queuing (BullMQ)
- Retry logic for failed notifications

**API Contracts**:
```
GET    /notifications             → Get user notifications
POST   /notifications/send       → Send notification (admin)
PATCH  /notifications/:id/read   → Mark as read
```

**Channels**:
- Email: Via SMTP
- SMS: Via SMS provider (strategy pattern)
- Push: Via Socket.IO

**Queue Processing**:
- Jobs processed via BullMQ
- 3 retry attempts with exponential backoff
- Dead-letter queue for failed notifications

---

### 2.3 Infrastructure Modules

#### **Queues Module** (`src/queues/`)

**Responsibilities**:
- BullMQ queue configuration
- Payment queue processor
- Notification queue processor
- Retry and dead-letter queue handling

**Queues**:
- `payments`: Payment processing, escrow, refunds
- `notifications`: Email, SMS, push notifications
- `telemetry`: Telemetry data processing (future)

---

#### **Audit Module** (`src/audit/`)

**Entities**: `AuditLog`

**Responsibilities**:
- Comprehensive audit logging
- All modifications tracked
- Access logging
- Payment and dispute audit trails

**API Contracts**:
```
GET    /audit                     → Get audit logs (admin)
GET    /audit/:resourceType/:id   → Get resource audit trail
```

---

## 3. Prisma Schema Overview

### 3.1 Core Models

#### **User Model**
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  role        Role
  tenantId    String?  // Multi-tenancy
  profile     Profile?
  orgs        OrgMember[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete
}
```

#### **Organization Model**
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  type        OrgType  // B2B or B2C
  tenantId    String   @unique // Multi-tenancy
  members     OrgMember[]
  vehicles    Vehicle[]
  bookings    Booking[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### **Booking Model**
```prisma
model Booking {
  id            String   @id @default(cuid())
  customerId    String
  mechanicId    String?
  vehicleId     String?
  orgId         String?
  tenantId      String?  // Multi-tenancy
  status        BookingStatus
  totalPrice    Decimal
  platformFee   Decimal
  segments      BookingSegment[]
  payments      Payment[]
  disputes      Dispute[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### **BookingSegment Model**
```prisma
model BookingSegment {
  id            String   @id @default(cuid())
  bookingId     String
  type          String
  price         Decimal
  status        SegmentStatus
  mechanicId    String?
  serviceId     String?
  payments      Payment[]
  disputes      Dispute[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### **Payment Model**
```prisma
model Payment {
  id              String   @id @default(cuid())
  bookingId       String?
  bookingSegmentId String?
  amount          Decimal
  status          PaymentStatus
  gateway         String
  gatewayRef      String?
  tenantId        String?  // Multi-tenancy
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### **Wallet Model**
```prisma
model Wallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  balance       Decimal  @default(0)
  transactions  WalletTransaction[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.2 Enums

```prisma
enum Role {
  SUPERADMIN
  ADMIN
  MECHANIC
  CUSTOMER
}

enum BookingStatus {
  PENDING
  CONFIRMED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum SegmentStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
  REFUNDED
  PARTIAL
}

enum DisputeStatus {
  PENDING
  RESOLVED
  REJECTED
}

enum OrgType {
  B2B
  B2C
}

enum OrgRole {
  OWNER
  ADMIN
  FLEET_MANAGER
  DISPATCHER
  MEMBER
}
```

### 3.3 Multi-Tenancy

All models that require tenant isolation include:
- `tenantId String?` field
- Index on `tenantId` for performance
- TenantGuard enforces isolation at application level

---

## 4. API Contracts

### 4.1 Authentication

All endpoints (except public ones) require:
- `Authorization: Bearer <JWT_TOKEN>` header
- JWT token includes: `userId`, `role`, `tenantId`

**Public Endpoints** (marked with `@Public()`):
- `POST /auth/signup`
- `POST /auth/login`
- `POST /payments/webhook/*` (webhook verification required)

### 4.2 Response Format

**Success Response**:
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 4.3 Pagination

List endpoints support pagination:
```
GET /bookings?page=1&limit=20&sort=createdAt:desc
```

**Response**:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 4.4 Filtering

Most list endpoints support filtering:
```
GET /bookings?status=COMPLETED&orgId=xxx
GET /vehicles?type=EV&status=ACTIVE
```

---

## 5. RBAC & Tenancy Rules

### 5.1 Roles

| Role | Permissions |
|------|-------------|
| **SUPERADMIN** | Full system access, all tenants |
| **ADMIN** | Platform admin, can manage all resources |
| **MECHANIC** | Own profile, assigned bookings, own wallet |
| **CUSTOMER** | Own bookings, own profile, own wallet |
| **OrgOwner** | Full control within organization |
| **OrgAdmin** | Manage org members, vehicles, bookings |
| **FleetManager** | Manage vehicles and dispatch |
| **Dispatcher** | Create dispatches, assign mechanics |

### 5.2 Multi-Tenancy Enforcement

**TenantGuard** (Global):
- Applied to all endpoints by default
- Extracts `tenantId` from JWT token
- Validates user belongs to tenant
- Prevents cross-tenant data access

**TenantInterceptor**:
- Auto-injects `tenantId` into service methods
- Ensures all queries filter by `tenantId`

**@Public() Decorator**:
- Bypasses TenantGuard for public endpoints
- Used for: auth endpoints, webhooks

**@TenantId() Decorator**:
- Explicitly extracts tenantId from request
- Used in controllers when needed

### 5.3 Data Isolation Rules

1. **Users**: Can only access own data or org members (if OrgAdmin)
2. **Bookings**: Filtered by `tenantId` and user role
3. **Payments**: Isolated by `tenantId`
4. **Wallets**: User can only access own wallet
5. **Vehicles**: Org members can access org vehicles
6. **Disputes**: Filtered by `tenantId`

---

## 6. Queue & Background Jobs

### 6.1 Queue Configuration

**BullMQ Setup**:
- Redis connection for queue storage
- Separate queues for different job types
- Retry configuration: 3 attempts with exponential backoff
- Dead-letter queue for failed jobs

### 6.2 Payment Queue

**Jobs**:
- `processEscrow`: Hold funds in escrow
- `releasePayment`: Release funds to mechanic
- `refundPayment`: Process refunds

**Retry Logic**:
- 3 attempts
- Exponential backoff: 1s, 2s, 4s
- Dead-letter queue after max retries

### 6.3 Notification Queue

**Jobs**:
- `sendEmail`: Email notifications
- `sendSMS`: SMS notifications
- `sendPush`: Push notifications via Socket.IO

**Retry Logic**:
- 3 attempts per channel
- Exponential backoff
- Failed notifications logged for manual review

### 6.4 Queue Monitoring

- BullMQ dashboard for queue status
- Job status tracking
- Failed job alerts
- Queue length monitoring

---

## 7. Payment & Escrow Flows

### 7.1 Payment Initialization Flow

```
1. Customer creates booking
2. Payment initialized → PaymentStatus.PENDING
3. Customer redirected to payment gateway
4. Payment gateway processes payment
5. Webhook received → PaymentStatus.SUCCESS
6. Funds held in escrow
7. Payment record created
```

### 7.2 Multi-Segment Escrow Flow

```
1. Booking created with multiple segments
2. Payment initialized for total amount
3. Payment verified → Funds in escrow
4. Segment 1 completed → Partial release (segment 1 amount)
5. Segment 2 completed → Partial release (segment 2 amount)
6. All segments complete → Remaining funds released
```

### 7.3 Payment Release Flow

```
1. Segment marked as COMPLETED
2. Queue job: releaseSegmentPayment
3. Calculate release amount (segment price - platform fee)
4. Credit mechanic wallet
5. Update payment status
6. Send notification to mechanic
```

### 7.4 Refund Flow

```
1. Dispute raised or booking cancelled
2. Admin initiates refund
3. Queue job: refundPayment
4. Payment gateway refund API called
5. Update payment status → REFUNDED
6. Update wallet balances
7. Send notification to customer
```

### 7.5 Platform Fee Calculation

- Platform fee: 10% of total booking amount
- Calculated at booking creation
- Deducted from each segment release
- Tracked separately for reporting

---

## 8. EV Telemetry & Charging Integration

### 8.1 Current Implementation (MVP)

**Telemetry Recording**:
- Manual metric entry
- Battery level, SOC, range tracking
- Time-series data storage

**API Endpoints**:
```
POST /telemetry → Record metric
GET  /telemetry/:vehicleId → Get metrics
```

### 8.2 Future Integration (Phase 2)

**Telemetry Adapters**:
- **Smartcar**: OAuth-based, read-only access
- **Tor Loco**: API key-based, real-time tracking
- **Hyundai**: Manufacturer API integration

**Charging Station Integration**:
- Charging station finder API
- Charging session tracking
- Charging cost calculation
- Route optimization with charging stops

**Integration Points**:
```
POST /telemetry/push → Webhook endpoint for adapters
GET  /charging-stations → Find nearby charging stations
POST /charging-sessions → Track charging sessions
```

---

## 9. Security Best Practices

### 9.1 HTTP Security Headers

**Helmet Configuration**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-XSS-Protection
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### 9.2 Data Encryption

**EncryptionService**:
- AES-256-GCM encryption
- Used for: webhook secrets, sensitive tokens
- Key rotation support

**Data at Rest**:
- Passwords: bcrypt hashing (10 rounds)
- Sensitive fields: Encrypted before storage

**Data in Transit**:
- TLS 1.3 required
- HTTPS only in production

### 9.3 Authentication & Authorization

**JWT Tokens**:
- Access token: 24h expiry
- Refresh token: 7 days expiry
- Includes: `userId`, `role`, `tenantId`

**Password Policy**:
- Minimum 8 characters
- Bcrypt hashing
- No plaintext storage

### 9.4 Webhook Security

**Signature Verification**:
- HMAC-SHA256 signatures
- Paystack: `x-paystack-signature` header
- Flutterwave: `verif-hash` header
- Verification before processing

### 9.5 Rate Limiting

**Throttler Configuration**:
- Default: 20 requests/minute
- Login: 5 attempts/minute
- Burst: 5 requests/5 seconds

### 9.6 Input Validation

**DTO Validation**:
- Class-validator decorators
- Whitelist validation (strip unknown fields)
- Type transformation
- Custom validators for complex fields

### 9.7 Audit Logging

**Comprehensive Logging**:
- All modifications logged
- Access attempts logged
- Payment transactions logged
- Dispute actions logged
- Admin actions logged

---

## 10. Testing & CI/CD

### 10.1 Test Structure

```
test/
├── unit/                    # Unit tests
│   └── services/           # Service unit tests
├── integration/             # Integration tests
│   └── workflows/          # End-to-end workflows
└── e2e/                     # E2E tests
```

### 10.2 Unit Tests

**Coverage**:
- Services: 70%+ target
- Critical paths: 80%+ target
- Controllers: 60%+ target

**Test Files**:
- `test/unit/services/booking.service.spec.ts`
- `test/unit/services/payment.service.spec.ts`
- `test/unit/services/wallet.service.spec.ts`

### 10.3 Integration Tests

**Test Scenarios**:
- Booking-payment workflow
- Multi-tenancy isolation
- Queue job processing
- Real-time notifications

**Test File**:
- `test/integration/workflows/booking-payment-flow.spec.ts`

### 10.4 CI/CD Pipeline (Future)

**GitHub Actions / GitLab CI**:
1. Lint and format check
2. Unit tests
3. Integration tests
4. Build Docker image
5. Deploy to staging
6. Run E2E tests
7. Deploy to production (manual approval)

### 10.5 Deployment

**Docker**:
- Multi-stage builds
- Production-optimized images
- Health check endpoints

**Scaling**:
- Horizontal scaling with PM2/Kubernetes
- Redis for session/queue sharing
- Database read replicas for high load

### 10.6 Monitoring

**Metrics**:
- API response times
- Queue job processing times
- Database query performance
- Error rates

**Logging**:
- Structured logging (JSON)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation

---

## 📊 Architecture Diagrams

### System Architecture

```
┌─────────────┐
│   Client    │
│  (Mobile/   │
│    Web)     │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│   NestJS API    │
│  (Monolith)     │
│                 │
│  - Controllers  │
│  - Services     │
│  - Guards       │
│  - Interceptors │
└────┬──────┬─────┘
     │      │
     │      │
     ▼      ▼
┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis │
│         │ │         │
│ - Data  │ │ - Queue │
│ - Audit │ │ - Cache │
└─────────┘ └─────────┘
```

### Payment Flow

```
Customer → API → Payment Gateway
                ↓
            Webhook → Queue → Wallet Service
                            ↓
                        Escrow Release
                            ↓
                        Mechanic Wallet
```

### Multi-Tenancy Flow

```
Request → TenantGuard → Extract tenantId
                        ↓
                    TenantInterceptor → Inject tenantId
                                        ↓
                                    Service → Filter by tenantId
```

---

## 🔗 Related Documents

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Detailed folder structure
- [IMPLEMENTATION_PROGRESS.md](../IMPLEMENTATION_PROGRESS.md) - Implementation status
- [IMPLEMENTATION_ROADMAP.md](../IMPLEMENTATION_ROADMAP.md) - Roadmap
- [NEXT_STEPS.md](../NEXT_STEPS.md) - Next steps guide

---

**Last Updated**: January 26, 2026
**Status**: MVP ~90% Complete
