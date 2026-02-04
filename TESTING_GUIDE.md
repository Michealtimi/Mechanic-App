# Testing Guide - MVP & All Phases

> **Last Updated**: January 26, 2026  
> **Status**: Comprehensive Testing Guide

This guide provides step-by-step instructions for testing all features across MVP, Phase 1, Phase 2, and Phase 3.

---

## 📋 Prerequisites

### 1. Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure all environment variables** in `.env`:
   - Database connection
   - JWT secrets
   - Redis connection
   - Payment gateway keys
   - Google Maps API key
   - Telemetry provider keys
   - API key secret
   - Webhook secrets

3. **Install dependencies**:
   ```bash
   yarn install
   ```

4. **Run database migrations**:
   ```bash
   yarn prisma:generate
   yarn prisma:migrate dev --name complete_setup
   ```

5. **Start Redis** (if not running):
   ```bash
   redis-server
   # Or using Docker:
   docker run -d -p 6379:6379 redis:alpine
   ```

6. **Start the application**:
   ```bash
   yarn start:dev
   ```

---

## 🧪 Testing Checklist

### ✅ MVP (v0.1) Features

#### 1. Authentication & Authorization

**Test Cases**:
- [ ] **User Registration**
  ```bash
  POST /auth/register
  Body: {
    "email": "customer@test.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+2348012345678",
    "role": "CUSTOMER"
  }
  ```
  - Verify user is created
  - Verify default B2C organization is created
  - Verify tenantId is set

- [ ] **User Login**
  ```bash
  POST /auth/login
  Body: {
    "email": "customer@test.com",
    "password": "Password123!"
  }
  ```
  - Verify JWT token is returned
  - Verify refresh token is returned
  - Verify token contains tenantId

- [ ] **Refresh Token**
  ```bash
  POST /auth/refresh
  Body: {
    "refreshToken": "<refresh-token>"
  }
  ```
  - Verify new access token is returned

- [ ] **Role-Based Access**
  - Test accessing admin endpoints as customer (should fail)
  - Test accessing mechanic endpoints as customer (should fail)
  - Test accessing customer endpoints as mechanic (should fail)

#### 2. Organizations & Multi-Tenancy

**Test Cases**:
- [ ] **Create Organization**
  ```bash
  POST /organizations
  Headers: { "Authorization": "Bearer <token>", "X-Tenant-Id": "<org-id>" }
  Body: {
    "name": "Test Fleet",
    "type": "B2B",
    "address": "123 Test St"
  }
  ```
  - Verify organization is created
  - Verify user is added as owner

- [ ] **Add Organization Member**
  ```bash
  POST /organizations/:id/members
  Body: {
    "userId": "<user-id>",
    "role": "MEMBER"
  }
  ```
  - Verify member is added
  - Verify role is set correctly

- [ ] **Tenant Isolation**
  - Create booking in Organization A
  - Try to access booking from Organization B (should fail)
  - Verify TenantGuard is working

#### 3. Vehicles

**Test Cases**:
- [ ] **Create Vehicle**
  ```bash
  POST /vehicles
  Body: {
    "vin": "1HGBH41JXMN109186",
    "make": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "type": "EV",
    "latitude": 6.5244,
    "longitude": 3.3792
  }
  ```
  - Verify vehicle is created
  - Verify tenantId is set
  - Verify location is stored correctly

- [ ] **Update Vehicle Location**
  ```bash
  PATCH /vehicles/:id/location
  Body: {
    "latitude": 6.5250,
    "longitude": 3.3800
  }
  ```
  - Verify location is updated
  - Verify coordinates are valid

- [ ] **List Vehicles**
  ```bash
  GET /vehicles
  ```
  - Verify only vehicles from user's tenant are returned

#### 4. Bookings

**Test Cases**:
- [ ] **Create Single-Segment Booking**
  ```bash
  POST /bookings
  Body: {
    "mechanicId": "<mechanic-id>",
    "pickupLatitude": 6.5244,
    "pickupLongitude": 3.3792,
    "pickupAddress": "123 Test St",
    "serviceId": "<service-id>",
    "scheduledAt": "2026-01-27T10:00:00Z"
  }
  ```
  - Verify booking is created
  - Verify segment is created
  - Verify payment is initialized
  - Verify webhook is triggered (BOOKING_CREATED)

- [ ] **Create Multi-Segment Booking**
  ```bash
  POST /bookings
  Body: {
    "mechanicId": "<mechanic-id>",
    "pickupLatitude": 6.5244,
    "pickupLongitude": 3.3792,
    "pickupAddress": "123 Test St",
    "segments": [
      {
        "type": "diagnosis",
        "price": "5000"
      },
      {
        "type": "repair",
        "price": "15000"
      }
    ]
  }
  ```
  - Verify booking is created with multiple segments
  - Verify total price is calculated correctly
  - Verify platform fee is calculated (10%)

- [ ] **Update Booking Status**
  ```bash
  PATCH /bookings/:id/status
  Body: {
    "status": "CONFIRMED"
  }
  ```
  - Verify status is updated
  - Verify status transitions are valid

- [ ] **Complete Booking**
  ```bash
  POST /bookings/:id/complete
  ```
  - Verify booking status is COMPLETED
  - Verify revenue share is recorded
  - Verify webhook is triggered (BOOKING_COMPLETED)

- [ ] **Cancel Booking**
  ```bash
  DELETE /bookings/:id
  ```
  - Verify booking is cancelled
  - Verify payment is refunded (if paid)
  - Verify webhook is triggered (BOOKING_CANCELLED)

#### 5. Payments & Wallets

**Test Cases**:
- [ ] **Initialize Payment**
  ```bash
  POST /payments/initialize
  Body: {
    "bookingId": "<booking-id>",
    "amount": 20000,
    "gateway": "PAYSTACK"
  }
  ```
  - Verify payment is created
  - Verify payment reference is returned
  - Verify escrow is set up

- [ ] **Verify Payment**
  ```bash
  POST /payments/verify
  Body: {
    "reference": "<payment-reference>"
  }
  ```
  - Verify payment status is updated to SUCCESS
  - Verify funds are held in escrow
  - Verify webhook is triggered (PAYMENT_SUCCESS)

- [ ] **Release Payment (Segment)**
  ```bash
  POST /payments/segments/:segmentId/release
  Body: {
    "amount": 5000
  }
  ```
  - Verify partial payment is released
  - Verify mechanic receives funds
  - Verify platform fee is deducted

- [ ] **Refund Payment**
  ```bash
  POST /payments/:id/refund
  Body: {
    "amount": 20000,
    "reason": "Customer cancellation"
  }
  ```
  - Verify refund is processed
  - Verify payment status is updated

#### 6. Disputes

**Test Cases**:
- [ ] **Create Dispute**
  ```bash
  POST /disputes
  Body: {
    "bookingId": "<booking-id>",
    "segmentId": "<segment-id>",
    "reason": "Service not completed",
    "amount": 5000
  }
  ```
  - Verify dispute is created
  - Verify auto-triage for disputes < NGN10k
  - Verify webhook is triggered (DISPUTE_CREATED)

- [ ] **Add Evidence**
  ```bash
  POST /disputes/:id/evidence
  Body: {
    "type": "IMAGE",
    "url": "https://example.com/evidence.jpg",
    "description": "Photo of incomplete work"
  }
  ```
  - Verify evidence is added
  - Verify evidence is linked to dispute

- [ ] **Resolve Dispute**
  ```bash
  PATCH /disputes/:id/resolve
  Body: {
    "resolution": "REFUND_CUSTOMER",
    "amount": 5000
  }
  ```
  - Verify dispute is resolved
  - Verify refund is processed (if applicable)

#### 7. Real-Time Features

**Test Cases**:
- [ ] **Chat**
  - Connect to Socket.IO
  - Send message in booking chat room
  - Verify message is received by other user
  - Verify messages are persisted

- [ ] **Notifications**
  - Create booking
  - Verify notification is sent via Socket.IO
  - Verify notification is queued (BullMQ)
  - Verify notification is delivered

---

### ✅ Phase 1 (B2B Scale) Features

#### 1. B2B Wallet Operations

**Test Cases**:
- [ ] **Create Organization Wallet**
  ```bash
  POST /wallets/organizations/:orgId
  ```
  - Verify wallet is created
  - Verify initial balance is 0

- [ ] **Fund Organization Wallet**
  ```bash
  POST /wallets/organizations/:orgId/fund
  Body: {
    "amount": 100000,
    "gateway": "PAYSTACK"
  }
  ```
  - Verify wallet is funded
  - Verify ledger entry is created

- [ ] **Transfer Between Wallets**
  ```bash
  POST /wallets/organizations/:orgId/transfer
  Body: {
    "toWalletId": "<wallet-id>",
    "amount": 50000
  }
  ```
  - Verify transfer is processed
  - Verify both wallets are updated
  - Verify ledger entries are created

- [ ] **Bulk Payment Processing**
  ```bash
  POST /wallets/organizations/:orgId/bulk-pay
  Body: {
    "payments": [
      { "mechanicId": "<id>", "amount": 10000 },
      { "mechanicId": "<id>", "amount": 15000 }
    ]
  }
  ```
  - Verify all payments are processed
  - Verify ledger entries are created

#### 2. Advanced Dispute Features

**Test Cases**:
- [ ] **Escalate Dispute**
  ```bash
  POST /disputes/:id/escalate
  Body: {
    "level": "LEVEL_2",
    "reason": "Complex case"
  }
  ```
  - Verify dispute is escalated
  - Verify priority is updated

- [ ] **Set Dispute Priority**
  ```bash
  PATCH /disputes/:id/priority
  Body: {
    "priority": "HIGH"
  }
  ```
  - Verify priority is updated

- [ ] **Get Dispute Dashboard**
  ```bash
  GET /disputes/dashboard
  ```
  - Verify statistics are returned
  - Verify filters work correctly

#### 3. Advanced Reporting

**Test Cases**:
- [ ] **Booking Analytics**
  ```bash
  GET /reporting/bookings/analytics?startDate=2026-01-01&endDate=2026-01-31
  ```
  - Verify analytics are returned
  - Verify date filtering works

- [ ] **Revenue Reports**
  ```bash
  GET /reporting/revenue?startDate=2026-01-01&endDate=2026-01-31
  ```
  - Verify revenue data is returned
  - Verify calculations are correct

- [ ] **Mechanic Performance**
  ```bash
  GET /reporting/mechanics/:id/performance
  ```
  - Verify performance metrics are returned

#### 4. SLA Improvements

**Test Cases**:
- [ ] **SLA Breach Notification**
  - Create booking with SLA
  - Wait for breach (or manually trigger)
  - Verify notification is sent
  - Verify penalty is applied

- [ ] **SLA Dashboard**
  ```bash
  GET /sla/dashboard
  ```
  - Verify SLA statistics are returned

#### 5. Enhanced Dispatch

**Test Cases**:
- [ ] **Bidding System**
  ```bash
  POST /dispatch/:bookingId/bid
  Body: {
    "mechanicId": "<mechanic-id>",
    "bidAmount": 15000,
    "estimatedTime": 60
  }
  ```
  - Verify bid is created
  - Verify bidding is tracked

- [ ] **Auto-Assignment**
  ```bash
  POST /dispatch/:bookingId/auto-assign
  ```
  - Verify mechanic is assigned automatically
  - Verify assignment is based on algorithm

---

### ✅ Phase 2 (EV + Integrations) Features

#### 1. Telemetry Adapters

**Test Cases**:
- [ ] **Sync Telemetry (Smartcar)**
  ```bash
  POST /vehicles/:id/telemetry/sync
  Body: {
    "provider": "SMARTCAR",
    "accessToken": "<smartcar-token>"
  }
  ```
  - Verify telemetry is synced
  - Verify vehicle location is updated
  - Verify metrics are recorded

- [ ] **Sync Telemetry (Tor Loco)**
  ```bash
  POST /vehicles/:id/telemetry/sync
  Body: {
    "provider": "TOR_LOCO",
    "accessToken": "<tor-loco-token>"
  }
  ```
  - Verify telemetry is synced

- [ ] **List Available Providers**
  ```bash
  GET /vehicles/telemetry/providers
  ```
  - Verify providers are listed

#### 2. Charging Stations

**Test Cases**:
- [ ] **Find Nearby Charging Stations**
  ```bash
  GET /charging-stations/nearby?latitude=6.5244&longitude=3.3792&radius=10
  ```
  - Verify stations are returned
  - Verify distance calculation is correct

- [ ] **Get Station Details**
  ```bash
  GET /charging-stations/:id
  ```
  - Verify station details are returned

- [ ] **Get Route to Station**
  ```bash
  GET /charging-stations/:id/route?latitude=6.5244&longitude=3.3792
  ```
  - Verify route is calculated
  - Verify distance and duration are returned

#### 3. EV Health Metrics

**Test Cases**:
- [ ] **Get EV Health Metrics**
  ```bash
  GET /vehicles/:id/health
  ```
  - Verify health metrics are returned
  - Verify battery health is calculated
  - Verify charging efficiency is calculated
  - Verify range degradation is calculated

- [ ] **Get Health Alerts**
  ```bash
  GET /vehicles/:id/health/alerts
  ```
  - Verify alerts are returned
  - Verify alerts are based on thresholds

#### 4. Webhooks (Incoming)

**Test Cases**:
- [ ] **Receive Telemetry Webhook**
  ```bash
  POST /webhooks/telemetry/SMARTCAR
  Headers: { "X-Webhook-Signature": "<signature>" }
  Body: { ... }
  ```
  - Verify webhook is processed
  - Verify signature is validated
  - Verify telemetry is updated

- [ ] **Receive Payment Webhook**
  ```bash
  POST /webhooks/payment/PAYSTACK
  Headers: { "X-Webhook-Signature": "<signature>" }
  Body: { ... }
  ```
  - Verify webhook is processed
  - Verify payment status is updated

#### 5. AI Dispute Triage

**Test Cases**:
- [ ] **Triage Single Dispute**
  ```bash
  POST /disputes/:id/triage
  ```
  - Verify dispute is triaged
  - Verify auto-resolution for small disputes

- [ ] **Batch Triage**
  ```bash
  POST /disputes/batch-triage
  Body: {
    "disputeIds": ["<id1>", "<id2>"]
  }
  ```
  - Verify all disputes are triaged

---

### ✅ Phase 3 (Marketplace + Platform) Features

#### 1. Public API

**Test Cases**:
- [ ] **Create API Key**
  ```bash
  POST /api-keys
  Headers: { "Authorization": "Bearer <token>" }
  Body: {
    "name": "Test API Key",
    "rateLimitPerMinute": 60,
    "scopes": ["read", "write"],
    "allowedIps": ["127.0.0.1"]
  }
  ```
  - Verify API key is created
  - Verify key is hashed
  - Verify key prefix is returned
  - **SAVE THE FULL KEY** (only shown once)

- [ ] **List API Keys**
  ```bash
  GET /api-keys
  Headers: { "Authorization": "Bearer <token>" }
  ```
  - Verify API keys are listed
  - Verify full keys are NOT shown

- [ ] **Use API Key**
  ```bash
  GET /public/mechanics
  Headers: { "X-API-Key": "<full-api-key>" }
  ```
  - Verify request is authenticated
  - Verify rate limiting is applied
  - Verify IP whitelist is checked

- [ ] **Revoke API Key**
  ```bash
  DELETE /api-keys/:id
  ```
  - Verify API key is revoked
  - Verify revoked key cannot be used

#### 2. External Mechanics

**Test Cases**:
- [ ] **Register External Mechanic**
  ```bash
  POST /external-mechanics/register
  Body: {
    "email": "external@test.com",
    "password": "Password123!",
    "firstName": "Jane",
    "lastName": "Mechanic",
    "phoneNumber": "+2348012345678",
    "shopName": "Jane's Auto Shop",
    "serviceRadiusKm": 25,
    "isEvSpecialist": true
  }
  ```
  - Verify mechanic is registered
  - Verify status is PENDING
  - Verify commission rate is 15% (default)
  - Verify isExternal is true

- [ ] **Verify External Mechanic (Admin)**
  ```bash
  PATCH /external-mechanics/:id/verify
  Headers: { "Authorization": "Bearer <admin-token>" }
  Body: {
    "status": "VERIFIED"
  }
  ```
  - Verify mechanic is verified
  - Verify verifiedAt is set
  - Verify verifiedBy is set

- [ ] **Update Commission Rate**
  ```bash
  PATCH /external-mechanics/:id/commission
  Headers: { "Authorization": "Bearer <admin-token>" }
  Body: {
    "commissionRate": 20
  }
  ```
  - Verify commission rate is updated
  - Verify commissionUpdatedAt is set
  - Verify validation (0-50%)

- [ ] **List External Mechanics**
  ```bash
  GET /external-mechanics?verifiedOnly=true
  ```
  - Verify mechanics are listed
  - Verify filtering works

#### 3. Revenue Sharing

**Test Cases**:
- [ ] **Calculate Revenue Share**
  ```bash
  GET /revenue-sharing/booking/:bookingId
  ```
  - Verify revenue share is calculated
  - Verify platform fee (10%)
  - Verify mechanic commission (15% for external, 0% for internal)

- [ ] **Get Revenue Report**
  ```bash
  GET /revenue-sharing/report?startDate=2026-01-01&endDate=2026-01-31&externalOnly=true
  ```
  - Verify report is returned
  - Verify totals are correct
  - Verify per-mechanic breakdown

- [ ] **Get Mechanic Revenue**
  ```bash
  GET /revenue-sharing/mechanic/:mechanicId
  ```
  - Verify mechanic revenue is returned
  - Verify calculations are correct

#### 4. App Ecosystem (Webhooks)

**Test Cases**:
- [ ] **Create Webhook Subscription**
  ```bash
  POST /webhook-subscriptions
  Body: {
    "url": "https://example.com/webhook",
    "events": ["BOOKING_CREATED", "BOOKING_COMPLETED"],
    "secret": "webhook-secret"
  }
  ```
  - Verify subscription is created
  - Verify events are stored

- [ ] **List Webhook Subscriptions**
  ```bash
  GET /webhook-subscriptions
  ```
  - Verify subscriptions are listed

- [ ] **Trigger Webhook (via Booking)**
  - Create a booking
  - Verify webhook is sent to subscribed URL
  - Verify signature is included
  - Verify payload is correct

- [ ] **Delete Webhook Subscription**
  ```bash
  DELETE /webhook-subscriptions/:id
  ```
  - Verify subscription is deleted
  - Verify webhooks are no longer sent

---

## 🔍 Integration Testing

### End-to-End Workflow

1. **Complete Booking Flow**:
   - Register customer
   - Register mechanic (external)
   - Create booking
   - Initialize payment
   - Verify payment
   - Complete booking
   - Verify revenue share is recorded
   - Verify webhooks are triggered

2. **Multi-Tenant Isolation**:
   - Create two organizations
   - Create bookings in each
   - Verify data isolation
   - Verify cross-tenant access is blocked

3. **Queue Processing**:
   - Create notification
   - Verify job is queued
   - Verify job is processed
   - Verify retry logic works

---

## 🐛 Common Issues & Solutions

### Issue: Database Connection Error
**Solution**: Check `DATABASE_URL` in `.env` and ensure PostgreSQL is running

### Issue: Redis Connection Error
**Solution**: Check `REDIS_HOST` and `REDIS_PORT`, ensure Redis is running

### Issue: JWT Token Invalid
**Solution**: Check `JWT_SECRET` matches between restarts

### Issue: Webhook Signature Verification Fails
**Solution**: Ensure webhook secret matches between provider and `.env`

### Issue: API Key Not Working
**Solution**: Ensure `API_KEY_SECRET` is set and matches between restarts

---

## 📊 Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: All critical workflows
- **E2E Tests**: Complete user journeys
- **API Tests**: All endpoints

---

## 🚀 Running Automated Tests

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e

# Coverage
yarn test:cov
```

---

**Last Updated**: January 26, 2026
