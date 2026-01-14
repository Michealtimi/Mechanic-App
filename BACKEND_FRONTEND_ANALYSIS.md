# Backend-Frontend Integration Analysis

## Executive Summary

Your backend (NestJS) is **well-architected** and **mostly aligns** with your frontend requirements. However, there are some **gaps** and **integration points** that need attention to achieve the full real-time, high-performance ecosystem you envision.

## ✅ What Matches Perfectly

### 1. **Authentication System**
- ✅ Backend: JWT with refresh tokens (`/auth/login`, `/auth/register`, `/auth/refresh`)
- ✅ Frontend: Auth context ready, needs API integration
- **Status**: Ready to connect

### 2. **Booking System**
- ✅ Backend: Full CRUD (`/bookings`, `/bookings/:id`, `/bookings/:id/status`)
- ✅ Frontend: Booking pages exist
- **Status**: Needs API integration

### 3. **Mechanic Management**
- ✅ Backend: Profile, services, certifications (`/mechanic/profile`, `/mechanic/services`)
- ✅ Frontend: Mechanic dashboard exists
- **Status**: Ready to connect

### 4. **Payment System**
- ✅ Backend: Multi-gateway (Paystack, Flutterwave), webhooks
- ✅ Frontend: Wallet page exists
- **Status**: Needs integration

### 5. **Real-Time Chat**
- ✅ Backend: Socket.io gateway (`/chat` namespace)
- ✅ Frontend: Chat components exist
- **Status**: Needs WebSocket connection

## ⚠️ What Needs Attention

### 1. **Real-Time Matching System** (CRITICAL)

**Frontend Requirement**: 
- Customer searches → Pulse animation → Real-time match
- Global overlay for mechanics to accept jobs

**Backend Current State**:
- ✅ Has `DispatchService` with auto-matching
- ✅ Has `NotificationGateway` for real-time updates
- ⚠️ **Missing**: Direct "search" endpoint that triggers matching
- ⚠️ **Missing**: WebSocket events for job requests to mechanics

**What's Needed**:
```typescript
// Backend needs:
POST /bookings/search  // Customer initiates search
// Should trigger:
// 1. Find nearby mechanics
// 2. Create dispatch records
// 3. Emit WebSocket events to mechanics
// 4. Return jobId for tracking

// WebSocket events needed:
- 'job:request' → Sent to mechanics
- 'job:matched' → Sent to customer
- 'job:accepted' → Sent to customer
```

### 2. **Admin Dispatch Map** (HIGH PRIORITY)

**Frontend Requirement**:
- Live map showing all active jobs and mechanic locations
- Real-time updates

**Backend Current State**:
- ✅ Has `Dispatch` model and service
- ❌ **Missing**: Endpoint to get all active dispatches with locations
- ❌ **Missing**: Real-time location updates endpoint

**What's Needed**:
```typescript
// Backend needs:
GET /admin/dispatch-map
// Returns:
{
  activeJobs: Array<{
    id: string
    customerLocation: { lat, lng }
    mechanicLocation: { lat, lng } | null
    status: string
    eta: number
  }>
  availableMechanics: Array<{
    id: string
    location: { lat, lng }
    status: string
  }>
}

// WebSocket:
- 'dispatch:update' → Real-time updates
```

### 3. **Location Tracking** (HIGH PRIORITY)

**Frontend Requirement**:
- Live tracking screen with fixed map background
- Real-time mechanic location updates

**Backend Current State**:
- ✅ Has `LocationService`
- ⚠️ **Missing**: Real-time location update endpoint
- ⚠️ **Missing**: WebSocket for location streaming

**What's Needed**:
```typescript
// Backend needs:
POST /location/update  // Mechanic updates location
GET /tracking/:bookingId  // Get tracking data

// WebSocket:
- 'location:update' → Stream mechanic location
```

### 4. **Customer Map-Centric Home** (MEDIUM PRIORITY)

**Frontend Requirement**:
- Full-screen map with floating search
- Pulse animation during matching

**Backend Current State**:
- ✅ Has booking creation
- ⚠️ **Missing**: Search endpoint that returns nearby mechanics
- ⚠️ **Missing**: Matching status endpoint

**What's Needed**:
```typescript
// Backend needs:
GET /mechanics/nearby?lat=...&lng=...&radius=...
POST /bookings/search  // Initiate matching
GET /bookings/:id/match-status  // Check matching progress
```

## 🔧 Integration Roadmap

### Phase 1: Core API Integration (Week 1)

1. **Update Frontend API Client**
   ```typescript
   // lib/api-client.ts
   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
   
   export const apiClient = {
     auth: {
       login: (data) => fetch(`${API_BASE}/auth/login`, {...}),
       register: (data) => fetch(`${API_BASE}/auth/register`, {...}),
     },
     bookings: {
       create: (data) => fetch(`${API_BASE}/bookings`, {...}),
       getAll: () => fetch(`${API_BASE}/bookings`, {...}),
     },
     // ... etc
   }
   ```

2. **Connect Authentication**
   - Update `lib/auth-context.tsx` to use backend API
   - Store JWT tokens securely
   - Implement token refresh

3. **Connect Booking Flow**
   - Update booking pages to use real API
   - Handle loading/error states

### Phase 2: Real-Time Infrastructure (Week 2)

1. **WebSocket Connection**
   ```typescript
   // lib/realtime-context.tsx - UPDATE
   const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'
   const socket = io(`${wsUrl}/chat`, {
     auth: { token: accessToken }
   })
   ```

2. **Backend WebSocket Events** (Add to backend)
   ```typescript
   // src/notification/notification.gateway.ts
   @WebSocketGateway({ namespace: '/notifications' })
   export class NotificationGateway {
     // Add these events:
     emitJobRequest(mechanicId: string, jobData: any) {
       this.server.to(`mechanic:${mechanicId}`).emit('job:request', jobData)
     }
     
     emitJobMatched(customerId: string, mechanicData: any) {
       this.server.to(`customer:${customerId}`).emit('job:matched', mechanicData)
     }
   }
   ```

3. **Update Frontend Real-Time Context**
   - Connect to WebSocket
   - Handle job request overlays
   - Handle matching updates

### Phase 3: Missing Backend Endpoints (Week 2-3)

1. **Add Search/Matching Endpoint**
   ```typescript
   // src/booking/booking.controller.ts - ADD
   @Post('search')
   @Roles(Role.CUSTOMER)
   async searchForMechanic(@Body() dto: SearchMechanicDto, @Req() req) {
     // 1. Find nearby mechanics
     // 2. Create dispatch records
     // 3. Emit WebSocket events
     // 4. Return jobId
   }
   ```

2. **Add Admin Dispatch Map Endpoint**
   ```typescript
   // src/admin/admin.controller.ts - ADD
   @Get('dispatch-map')
   @Roles(Role.ADMIN, Role.SUPERADMIN)
   async getDispatchMap() {
     // Return all active jobs + mechanic locations
   }
   ```

3. **Add Location Tracking Endpoints**
   ```typescript
   // src/location/location.controller.ts - ADD
   @Post('update')
   @Roles(Role.MECHANIC)
   async updateLocation(@Body() dto: UpdateLocationDto, @Req() req) {
     // Update mechanic location
     // Emit WebSocket event
   }
   
   @Get('tracking/:bookingId')
   async getTrackingData(@Param('bookingId') id: string) {
     // Return tracking data for booking
   }
   ```

### Phase 4: UI Enhancements (Week 3-4)

1. **Pulse Match Screen**
   - Create component with animation
   - Connect to matching WebSocket events

2. **Global Job Request Overlay**
   - Already created (`components/job-request-overlay.tsx`)
   - Connect to WebSocket `job:request` event

3. **Live Tracking Screen**
   - Fixed map background
   - Real-time location updates
   - Scrollable content overlay

## 📋 API Endpoint Mapping

### Frontend → Backend Mapping

| Frontend Need | Backend Endpoint | Status |
|--------------|----------------|--------|
| Login | `POST /auth/login` | ✅ Exists |
| Register | `POST /auth/register` | ✅ Exists |
| Get Bookings | `GET /bookings` | ✅ Exists |
| Create Booking | `POST /bookings` | ✅ Exists |
| Search for Mechanic | `POST /bookings/search` | ❌ **MISSING** |
| Accept Job (Mechanic) | `PATCH /dispatch/:id/accept` | ✅ Exists |
| Get Mechanic Profile | `GET /mechanic/profile` | ✅ Exists |
| Update Location | `POST /location/update` | ⚠️ Needs enhancement |
| Get Tracking Data | `GET /tracking/:bookingId` | ❌ **MISSING** |
| Admin Dispatch Map | `GET /admin/dispatch-map` | ❌ **MISSING** |
| Payment History | `GET /payments` | ⚠️ Check exists |
| Wallet Balance | `GET /wallet` | ✅ Exists |

## 🔌 WebSocket Events Mapping

### Required Events

| Event Name | Direction | Purpose | Status |
|-----------|-----------|---------|--------|
| `job:request` | Backend → Frontend (Mechanic) | New job available | ⚠️ Needs implementation |
| `job:matched` | Backend → Frontend (Customer) | Mechanic found | ⚠️ Needs implementation |
| `job:accepted` | Backend → Frontend (Customer) | Mechanic accepted | ⚠️ Needs implementation |
| `location:update` | Backend → Frontend | Mechanic location update | ⚠️ Needs implementation |
| `dispatch:update` | Backend → Frontend (Admin) | Dispatch status change | ⚠️ Needs implementation |
| `chat:message` | Bidirectional | Chat messages | ✅ Exists |

## 🎨 Frontend Components Status

| Component | Status | Backend Integration Needed |
|-----------|--------|---------------------------|
| Pulse Match Screen | ❌ Not created | Search endpoint + WebSocket |
| Job Request Overlay | ✅ Created | WebSocket `job:request` event |
| Live Tracking | ⚠️ Partial | Location update endpoint |
| Admin Dispatch Map | ⚠️ Partial | Dispatch map endpoint |
| Garage (with editing) | ✅ Exists | Vehicle CRUD endpoints |
| Mechanic Profile | ✅ Exists | Profile endpoint exists |
| Wallet (history only) | ✅ Exists | Payment history endpoint |

## 🚀 Quick Start Integration Guide

### Step 1: Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

**Backend** (`.env`):
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
```

### Step 2: Update Frontend API Client

Create `lib/api-client.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL!

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  
  auth: {
    login: (data) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  // ... more endpoints
}
```

### Step 3: Connect WebSocket

Update `lib/realtime-context.tsx`:
```typescript
import { io } from 'socket.io-client'

const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/notifications`, {
  auth: { token: accessToken }
})
```

## 📝 Action Items

### Immediate (This Week)
1. ✅ Create API client utility
2. ✅ Connect authentication to backend
3. ✅ Add missing backend endpoints (search, dispatch-map, tracking)
4. ✅ Implement WebSocket events for matching

### Short Term (Next 2 Weeks)
1. Build pulse match screen
2. Connect live tracking
3. Complete admin dispatch map
4. Test end-to-end flows

### Long Term (Next Month)
1. Performance optimization
2. Error handling improvements
3. Loading states
4. Testing

## 🎯 Conclusion

Your backend is **80% ready** for the frontend. The main gaps are:
1. **Search/matching endpoint** for customer-initiated matching
2. **Admin dispatch map endpoint** for live overview
3. **Location tracking endpoints** for real-time updates
4. **WebSocket events** for job requests and matching

Once these are added, the integration will be seamless. The architecture is solid and well-designed for scaling.
