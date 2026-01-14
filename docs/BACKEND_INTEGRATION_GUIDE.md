# AutoServe Backend Integration Guide

## Overview
This guide helps backend engineers understand the frontend architecture and how to integrate backend APIs with the AutoServe platform.

## Architecture Overview

### Frontend Structure
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks + SWR for client-side data fetching
- **Forms**: React Hook Form (ready to implement)
- **Maps**: google-map-react (configured, awaiting API key)

### Authentication Flow
1. User signs up/logs in at `/auth/sign-up`
2. JWT token stored in HTTP-only cookies (via middleware)
3. All subsequent requests include token in Authorization header
4. Token refresh happens automatically via middleware

**API Endpoints Needed:**
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

## API Integration Points

### 1. User Management
**Endpoints to Create:**
```
GET /api/users/profile
PUT /api/users/profile
GET /api/users/[id]
```

**Frontend Implementation:**
```tsx
// components/profile-section.tsx
const { data: profile } = useSWR('/api/users/profile', fetcher)
```

### 2. Vehicle Management
**Endpoints to Create:**
```
GET /api/vehicles
POST /api/vehicles
GET /api/vehicles/[id]
PUT /api/vehicles/[id]
DELETE /api/vehicles/[id]
POST /api/vehicles/[id]/maintenance
```

**Frontend Location:** `/app/dashboard/garage/*`

**Expected Request Format:**
```json
{
  "make": "Tesla",
  "model": "Model 3",
  "year": 2023,
  "licensePlate": "ABC-1234",
  "vin": "optional_vin_number"
}
```

### 3. Service Booking
**Endpoints to Create:**
```
GET /api/services
POST /api/bookings
GET /api/bookings
GET /api/bookings/[id]
PUT /api/bookings/[id]/status
POST /api/bookings/[id]/cancel
```

**Frontend Location:** `/app/dashboard/select-services`, `/app/dashboard/booking-summary`

**Booking Status States:**
- `PENDING` - Awaiting mechanic acceptance
- `ACCEPTED` - Mechanic accepted job
- `IN_PROGRESS` - Service being performed
- `COMPLETED` - Job completed
- `CANCELLED` - Job cancelled

### 4. Mechanic Management
**Endpoints to Create:**
```
GET /api/mechanics
GET /api/mechanics/[id]
POST /api/mechanics/profile
PUT /api/mechanics/profile
GET /api/mechanics/jobs
GET /api/mechanics/earnings
```

**Frontend Location:** `/app/mechanic/*`, `/app/dashboard/find-mechanic`

**Mechanic Profile Structure:**
```json
{
  "name": "John Doe",
  "rating": 4.8,
  "specializations": ["Tesla Repair", "EV Systems"],
  "certifications": ["Tesla Certified", "ASE Master"],
  "verified": true,
  "location": { "latitude": 37.7749, "longitude": -122.4194 }
}
```

### 5. Real-time Tracking
**Endpoints to Create:**
```
GET /api/tracking/[bookingId]
POST /api/tracking/[bookingId]/location
POST /api/tracking/[bookingId]/status
```

**WebSocket Connection (for real-time):**
```
WS /ws/tracking/[bookingId]
```

**Frontend Location:** `/app/dashboard/live-tracking`

**WebSocket Messages:**
```typescript
// Server sends location updates
{
  type: 'LOCATION_UPDATE',
  latitude: number,
  longitude: number,
  eta: number,
  distance: number
}

// Server sends status updates
{
  type: 'STATUS_UPDATE',
  status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED',
  timestamp: Date
}
```

### 6. Payment Processing
**Endpoints to Create:**
```
POST /api/payments/process
GET /api/payments/history
POST /api/payments/verify
POST /api/wallet/topup
POST /api/wallet/withdraw
```

**Frontend Location:** `/app/dashboard/checkout`, `/app/dashboard/wallet`

**Payment Methods:**
- `WALLET` - In-app balance
- `PAYSTACK` - Card/Bank Transfer
- `FLUTTERWAVE` - Global payments

**Payment Request Format:**
```json
{
  "bookingId": "booking_123",
  "amount": 450.00,
  "method": "PAYSTACK",
  "currency": "USD"
}
```

### 7. Disputes
**Endpoints to Create:**
```
GET /api/disputes
POST /api/disputes
GET /api/disputes/[id]
PUT /api/disputes/[id]/status
POST /api/disputes/[id]/comment
```

**Frontend Location:** `/app/dashboard/disputes/[id]`

**Dispute Status:**
- `OPEN` - Awaiting investigation
- `IN_REVIEW` - Being reviewed
- `RESOLVED` - Resolved
- `ESCALATED` - Escalated to senior admin

### 8. Analytics
**Endpoints to Create:**
```
GET /api/admin/dashboard/metrics
GET /api/admin/campaigns
POST /api/admin/campaigns
GET /api/admin/verification-queue
PUT /api/admin/verification-queue/[id]
GET /api/admin/demand-analytics
```

**Frontend Location:** `/app/admin/*`

## Error Handling Pattern

All API routes should follow this response format:

```typescript
// Success Response (200)
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error Response (4xx/5xx)
{
  success: false,
  error: "ERROR_CODE",
  message: "Human-readable error message",
  details?: { ... }
}
```

**Common Error Codes:**
```
AUTH_REQUIRED - User not authenticated
UNAUTHORIZED - User lacks permissions
VALIDATION_ERROR - Invalid input data
NOT_FOUND - Resource not found
CONFLICT - Resource conflict
RATE_LIMITED - Too many requests
SERVER_ERROR - Internal server error
```

**Frontend Error Handling Example:**
```tsx
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch')
  }
  return res.json()
}

// In components:
const { data, error, isLoading } = useSWR('/api/endpoint', fetcher)

if (error) return <ErrorState message={error.message} />
if (isLoading) return <LoadingState />
if (data) return <YourComponent data={data} />
```

## Data Models & TypeScript Interfaces

### User
```typescript
interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}
```

### Vehicle
```typescript
interface Vehicle {
  id: string
  userId: string
  make: string
  model: string
  year: number
  licensePlate: string
  vin?: string
  maintenanceHistory: Maintenance[]
  createdAt: Date
}

interface Maintenance {
  id: string
  date: Date
  service: string
  cost: number
  mechanic: string
}
```

### Booking
```typescript
interface Booking {
  id: string
  customerId: string
  mechanicId: string
  vehicleId: string
  services: string[]
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  totalPrice: number
  scheduledAt: Date
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
}
```

### Mechanic
```typescript
interface Mechanic {
  id: string
  userId: string
  name: string
  rating: number
  totalJobs: number
  specializations: string[]
  certifications: Certification[]
  verified: boolean
  location: {
    latitude: number
    longitude: number
    address: string
  }
  availability: {
    available: boolean
    nextAvailableAt?: Date
  }
  createdAt: Date
}
```

## Environment Variables Setup

### Frontend (Add to Vars section in v0 sidebar)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Backend (.env file in your backend project)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/autoserve
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

GOOGLE_MAPS_API_KEY=your_google_maps_key

PAYSTACK_SECRET_KEY=your_paystack_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

FLUTTERWAVE_SECRET_KEY=your_flutterwave_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key

STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key

REDIS_URL=redis://localhost:6379
MAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
```

## Authentication & Security

### JWT Implementation
- Store JWT in HTTP-only cookie (more secure than localStorage)
- Include token in `Authorization: Bearer <token>` header
- Implement token refresh mechanism (refresh token stored separately)
- Set short expiry (15-30 minutes) for access token
- Set longer expiry (7 days) for refresh token

### Recommended Security Headers
```
Content-Security-Policy: default-src 'self';
X-Content-Type-Options: nosniff;
X-Frame-Options: DENY;
X-XSS-Protection: 1; mode=block;
Strict-Transport-Security: max-age=31536000; includeSubDomains;
```

### Rate Limiting Recommendations
- Authentication endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user
- File uploads: 10 requests/minute per user
- Payment endpoints: 1 request/minute per user

## Testing & Deployment

### Unit Testing
```typescript
describe('POST /api/bookings', () => {
  test('should create booking with valid data', async () => {
    const response = await request(app).post('/api/bookings').send({
      mechanicId: 'mech_123',
      vehicleId: 'vehicle_123',
      services: ['oil_change']
    })
    expect(response.status).toBe(201)
    expect(response.body.data.id).toBeDefined()
  })

  test('should reject with invalid data', async () => {
    const response = await request(app).post('/api/bookings').send({})
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('VALIDATION_ERROR')
  })
})
```

### Deployment Checklist
- [ ] All API endpoints implemented
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] JWT tokens working correctly
- [ ] Google Maps API key added
- [ ] Payment gateways configured
- [ ] WebSocket connections tested
- [ ] CORS properly configured (allow frontend domain)
- [ ] Rate limiting implemented
- [ ] Error logging set up (Sentry/similar)
- [ ] SSL certificates installed
- [ ] Backup and disaster recovery tested
- [ ] Load testing completed (target: 1000 concurrent users)
- [ ] Security audit completed
- [ ] GDPR compliance verified

## Common Integration Patterns

### Fetching Data with Error Handling
```tsx
'use client'

import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  })

export function BookingsList() {
  const { data, error, isLoading } = useSWR('/api/bookings', fetcher)

  if (error) return <div>Error: {error.message}</div>
  if (isLoading) return <div>Loading...</div>
  return <div>{/* render data */}</div>
}
```

### Handling Form Submissions
```tsx
'use client'

import { useState } from 'react'

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Booking failed')
      
      const result = await response.json()
      // Handle success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Create Booking'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
}
```

## Support & Questions

For frontend-specific integration questions:
- Check component locations in `/app/` and `/components/`
- Review API route templates in `/app/api/`
- Check TypeScript definitions in `/types/`
- Review the frontend's SWR data fetching patterns

Happy building! 🚀
