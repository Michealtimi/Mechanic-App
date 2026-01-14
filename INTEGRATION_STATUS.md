# Integration Status & Development Guide

## ✅ What Has Been Implemented

### Frontend (Next.js)
1. **API Client** (`lib/api-client.ts`) ✅
   - Complete REST API client for NestJS backend
   - Handles authentication, token refresh, error handling
   - All endpoints mapped: auth, bookings, mechanics, dispatch, location, admin, payments, vehicles

2. **Real-Time Context** (`lib/realtime-context.tsx`) ✅
   - Socket.io client integration
   - WebSocket connection to NestJS backend
   - Handles job matching, location updates, dispatch events

3. **Job Request Overlay** (`components/job-request-overlay.tsx`) ✅
   - Global overlay component for mechanics to accept jobs
   - Ready to connect to WebSocket events

### Backend (NestJS)
1. **Authentication** ✅
   - `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`
   - JWT tokens with refresh mechanism

2. **Bookings** ✅
   - `/bookings` - CRUD operations
   - `/bookings/:id/status` - Status updates
   - `/bookings/:id/cancel` - Cancellation

3. **Dispatch** ✅
   - `/dispatch` - Create dispatch
   - `/dispatch/:id/accept` - Accept job
   - `/dispatch/:id/reject` - Reject job

4. **Mechanics** ✅
   - `/mechanic/profile` - Get/Update profile
   - `/mechanic/services` - Service management

5. **WebSocket** ✅
   - Socket.io gateway at `/notifications` namespace
   - Chat gateway at `/chat` namespace

## ⚠️ What Still Needs Connection

### Frontend → Backend Integration
1. **Auth Context** - Needs to use `api.auth.login()` instead of localStorage mock
2. **Booking Pages** - Need to use `api.bookings.*` methods
3. **Mechanic Dashboard** - Need to use `api.mechanics.*` methods
4. **Real-Time Events** - WebSocket events need to be emitted from backend

### Missing Backend Endpoints (Need to Add)
1. `POST /bookings/search` - Customer search for mechanic
2. `GET /admin/dispatch-map` - Admin live dispatch map data
3. `GET /tracking/:bookingId` - Get tracking data
4. `GET /mechanics/nearby` - Find nearby mechanics
5. `GET /vehicles` - Vehicle CRUD (may exist, need to verify)

## 🔌 Connection Status

**Current Status**: ⚠️ **Partially Connected**

- ✅ API client created and ready
- ✅ Real-time context created and ready
- ⚠️ Frontend components still using mock data
- ⚠️ Backend WebSocket events need to emit job requests
- ❌ Missing some backend endpoints

## 🚀 How to Start Development Servers

### Step 1: Start Backend (NestJS)

```bash
# Navigate to backend directory
cd mechanic/Mechanic-App

# Install dependencies (if not done)
npm install
# OR
yarn install

# Set up environment variables
# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost:5432/autoserve
# JWT_SECRET=your-secret-key
# PORT=3000
# GOOGLE_MAPS_API_KEY=your-key

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
# OR
yarn start:dev

# Backend will run on http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

### Step 2: Start Frontend (Next.js)

```bash
# Navigate to frontend directory (if not already there)
cd ../..  # Go back to next-js-tailwind-app

# Install dependencies (if not done)
npm install
# OR
pnpm install

# Install socket.io-client (if not installed)
npm install socket.io-client

# Create .env.local file with:
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_WS_URL=http://localhost:3000

# Start development server
npm run dev
# OR
pnpm dev

# Frontend will run on http://localhost:3001 (or 3000 if backend not running)
```

### Step 3: Verify Connection

1. **Check Backend is Running**
   - Visit: http://localhost:3000/api (Swagger docs)
   - Should see API documentation

2. **Check Frontend is Running**
   - Visit: http://localhost:3001
   - Should see homepage

3. **Test API Connection**
   - Open browser DevTools → Network tab
   - Try logging in
   - Should see requests to `http://localhost:3000/auth/login`

4. **Test WebSocket Connection**
   - Open browser DevTools → Console
   - Should see: `[Realtime] Connected to Socket.io`
   - If not, check WebSocket connection errors

## 🔧 Quick Fixes Needed

### 1. Update Auth Context to Use Real API

**File**: `lib/auth-context.tsx`

```typescript
// Replace the mock login with:
import { api } from './api-client'

const handleLogin = async (email: string, password: string) => {
  try {
    const result = await api.auth.login(email, password)
    setUser(result.user)
    return result
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}
```

### 2. Update Login Page

**File**: `app/auth/login/page.tsx`

```typescript
// In handleSubmit:
import { api } from '@/lib/api-client'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const result = await api.auth.login(formData.email, formData.password)
    // User is now set in auth context
    router.push('/dashboard')
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Login failed')
  }
}
```

### 3. Add Missing Backend Endpoints

See `BACKEND_FRONTEND_ANALYSIS.md` for endpoint specifications.

## 📝 Environment Variables Checklist

### Backend (.env)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=3000
GOOGLE_MAPS_API_KEY=your-key
PAYSTACK_SECRET_KEY=your-key
FLUTTERWAVE_SECRET_KEY=your-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution**: Backend needs CORS enabled for frontend origin
```typescript
// In backend main.ts
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
})
```

### Issue 2: WebSocket Connection Failed
**Solution**: 
- Check backend is running
- Check `NEXT_PUBLIC_WS_URL` is correct
- Check Socket.io gateway is properly configured in backend

### Issue 3: 401 Unauthorized
**Solution**:
- Check JWT token is being sent in headers
- Verify token is valid (not expired)
- Check backend JWT_SECRET matches

### Issue 4: Database Connection Error
**Solution**:
- Verify DATABASE_URL is correct
- Run `npx prisma migrate dev`
- Check PostgreSQL is running

## ✅ Next Steps to Complete Integration

1. **Update Auth Flow** (30 min)
   - Connect login/signup to real API
   - Test authentication flow

2. **Add Missing Backend Endpoints** (2-3 hours)
   - `/bookings/search`
   - `/admin/dispatch-map`
   - `/tracking/:bookingId`
   - `/mechanics/nearby`

3. **Connect Frontend Components** (2-3 hours)
   - Update booking pages to use API
   - Update mechanic dashboard
   - Connect real-time events

4. **Test End-to-End** (1 hour)
   - Test customer booking flow
   - Test mechanic job acceptance
   - Test real-time updates

## 🎯 Current Integration Status: 60%

- ✅ Infrastructure: 100% (API client, WebSocket context)
- ⚠️ Backend Endpoints: 80% (missing 4 endpoints)
- ⚠️ Frontend Integration: 40% (components need API connection)
- ⚠️ Real-Time Events: 50% (context ready, backend events need implementation)

**Estimated Time to Full Integration**: 4-6 hours
