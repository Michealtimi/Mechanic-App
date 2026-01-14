# AutoServe Full-Scale Refactor Plan

## Overview
This document outlines the complete refactor to transform AutoServe into a high-performance, real-time service ecosystem with unified navigation, real-time matching, and enhanced UX.

## Backend Integration Strategy

### Next.js API Routes Structure
Next.js 16 allows us to create API routes in the `app/api/` directory. These routes can:
- Handle HTTP requests (GET, POST, PUT, DELETE)
- Connect to databases
- Integrate with external services
- Handle WebSocket connections (via Server-Sent Events or Socket.io)

### Backend File Structure
```
app/api/
├── auth/
│   ├── login/route.ts          # POST - User authentication
│   ├── signup/route.ts          # POST - User registration
│   ├── refresh/route.ts         # POST - Token refresh
│   └── logout/route.ts          # POST - User logout
├── users/
│   ├── profile/route.ts         # GET/PUT - User profile
│   └── [id]/route.ts            # GET - Get user by ID
├── vehicles/
│   ├── route.ts                 # GET/POST - List/Create vehicles
│   ├── [id]/route.ts            # GET/PUT/DELETE - Vehicle CRUD
│   └── [id]/history/route.ts    # GET - Service history
├── bookings/
│   ├── route.ts                 # GET/POST - List/Create bookings
│   ├── [id]/route.ts            # GET/PUT - Booking details
│   ├── [id]/accept/route.ts     # POST - Mechanic accepts job
│   ├── [id]/cancel/route.ts     # POST - Cancel booking
│   └── [id]/status/route.ts     # PUT - Update booking status
├── mechanics/
│   ├── route.ts                 # GET - List mechanics
│   ├── [id]/route.ts            # GET - Mechanic profile
│   ├── [id]/services/route.ts   # GET/PUT - Toggle services
│   └── nearby/route.ts          # GET - Find nearby mechanics
├── matching/
│   ├── search/route.ts          # POST - Customer searches for mechanic
│   ├── accept/route.ts          # POST - Mechanic accepts request
│   └── websocket/route.ts       # WebSocket endpoint for real-time
├── tracking/
│   ├── [bookingId]/route.ts     # GET - Get tracking data
│   └── [bookingId]/location/route.ts # POST - Update location
├── payments/
│   ├── route.ts                 # GET - Payment history
│   ├── process/route.ts         # POST - Process payment
│   └── verify/route.ts          # POST - Verify payment
└── admin/
    ├── dashboard/route.ts        # GET - Admin metrics
    ├── dispatch-map/route.ts    # GET - Live dispatch data
    ├── users/route.ts           # GET - User management
    └── financial/route.ts       # GET - Financial logs
```

## Implementation Phases

### Phase 1: Backend API Foundation
1. Create API route structure
2. Implement authentication endpoints
3. Set up database connection utilities
4. Create type definitions for API requests/responses

### Phase 2: Real-Time Infrastructure
1. WebSocket context provider
2. Real-time matching service
3. Live tracking updates
4. Global notification system

### Phase 3: Enhanced Role-Based Navigation
1. Unified state management for roles
2. Admin: Sidebar + Live Dispatch Map
3. Customer: Map-centric home with pulse animation
4. Mechanic: Footer navigation with global overlays

### Phase 4: Specific Screen Implementations
1. Garage with editing and service history
2. Mechanic Profile with Book Now
3. Wallet with payment history only
4. Live Tracking with fixed map background

### Phase 5: UI/UX Refinements
1. Map as background for location screens
2. Perfect alignment with navbars/footers
3. Interactive hover/active states
4. Smooth transitions and animations

## Color Theme Usage
All implementations will use the established theme:
- Primary: `#00ff88` (bright green) - CTAs, active states
- Background: `#0f2818` (dark green) - Main backgrounds
- Cards: White - Content areas
- Accent: `#2563eb` (blue) - Secondary actions
- Status colors: Success (green), Warning (orange), Error (red)

## Next Steps
1. Create backend API route templates
2. Implement WebSocket context
3. Build enhanced role-based layouts
4. Create real-time matching flow
5. Update specific screens
