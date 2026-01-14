# AutoServe Application Flow Map

## Overview
This document maps out the complete user flows for all three user roles: Customer, Mechanic, and Admin.

## Entry Points

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page (with super admin testing)
- `/auth/sign-up` - Registration page
- `/onboarding` - Role selection (Customer/Mechanic)
- `/onboarding/customer` - Customer onboarding flow
- `/onboarding/mechanic` - Mechanic onboarding flow

---

## Customer Flow - "Repair Journey"

### 1. Onboarding
- **Route**: `/onboarding/customer`
- **Steps**:
  1. Enter phone/email
  2. Add car details (Make, Model, Year) - *To be implemented*
  3. Service preferences selection
  4. Optional photo upload

### 2. Main Dashboard (Map View)
- **Route**: `/dashboard`
- **Features**:
  - Full-screen map view
  - Floating search bar
  - Notification bell
  - Settings access
  - Mobile bottom navigation

### 3. Request Service
- **Route**: `/dashboard` → Search Modal → Job Request
- **Flow**:
  1. Click search bar → Opens SearchModal
  2. Enter location
  3. Select services needed
  4. Submit request → Triggers matching

### 4. Matching Process
- **Route**: `/dashboard` (with matching overlay)
- **Features**:
  - Pulsing ripple animation while scanning
  - Real-time status updates via WebSocket
  - Shows matched mechanic when found

### 5. Live Service Tracking
- **Route**: `/dashboard/live-tracking`
- **Features**:
  - Real-time mechanic location on map
  - ETA updates
  - Service progress indicator
  - Communication with mechanic

### 6. Service Completion
- **Route**: `/dashboard/booking-details/[id]`
- **Features**:
  - View digital invoice
  - Payment options (PayStack, Flutterwave, Wallet)
  - Service history

### 7. Garage Management
- **Route**: `/dashboard/garage`
- **Features**:
  - View all vehicles
  - Add new vehicle (`/dashboard/garage/add`)
  - View service history per vehicle
  - Upload car photos

### 8. Profile & Settings
- **Route**: `/dashboard` → Settings
- **Features**:
  - Edit contact info
  - Manage saved locations
  - Payment methods

### Customer Routes Summary
```
/dashboard                    - Map view (main entry)
/dashboard/bookings            - All bookings
/dashboard/booking-details/[id] - Booking details
/dashboard/booking-summary     - Booking summary
/dashboard/checkout            - Checkout page
/dashboard/find-mechanic       - Find mechanic list
/dashboard/garage              - Vehicle garage
/dashboard/garage/add          - Add vehicle
/dashboard/garage/[id]         - Vehicle details
/dashboard/live-tracking       - Live service tracking
/dashboard/mechanic-tracking   - Mechanic tracking
/dashboard/select-services     - Service selection
/dashboard/services            - Available services
/dashboard/wallet              - Wallet & payments
/dashboard/disputes/[id]       - Dispute details
```

---

## Mechanic Flow - "Workday"

### 1. Onboarding & Verification
- **Route**: `/onboarding/mechanic`
- **Steps**:
  1. Upload ID documents
  2. Upload certificates
  3. Shop information
  4. Service radius setup
- **Admin Approval**: Admin must verify at `/admin/merchant-verification`

### 2. Dashboard
- **Route**: `/mechanic/dashboard`
- **Features**:
  - Today's earnings
  - Active jobs count
  - Rating display
  - Repeat clients
  - Online/Offline toggle

### 3. Service Management
- **Route**: `/mechanic/profile/services`
- **Features**:
  - Add/Edit services
  - Set pricing
  - Toggle service availability
  - Service categories

### 4. Job Loop
- **Flow**:
  1. Go online (toggle in dashboard)
  2. Receive job popup (WebSocket notification)
  3. View distance and customer details
  4. Accept/Reject job
  5. Navigate to customer (turn-by-turn directions)
  6. Complete service
  7. Submit invoice

### 5. Job Details
- **Route**: `/mechanic/job/[id]`
- **Features**:
  - Customer information
  - Vehicle details
  - Service requirements
  - Navigation to location
  - Service completion form

### 6. Profile & Earnings
- **Routes**:
  - `/mechanic/profile` - Profile overview
  - `/mechanic/profile/clients` - Client list
  - `/mechanic/payout-history` - Earnings history
  - `/mechanic/payout-details/[id]` - Payout details
  - `/mechanic/profile/settings` - Settings
- **Features**:
  - Update shop bio
  - Upload profile picture
  - View total earnings
  - Client management

### Mechanic Routes Summary
```
/mechanic/dashboard            - Main dashboard
/mechanic/job/[id]             - Job details
/mechanic/profile               - Profile overview
/mechanic/profile/services      - Service management
/mechanic/profile/clients       - Client list
/mechanic/profile/settings     - Settings
/mechanic/payout-history        - Earnings history
/mechanic/payout-details/[id]   - Payout details
```

---

## Admin Flow - "Command Center"

### 1. Dashboard
- **Route**: `/admin/dashboard`
- **Features**:
  - Key metrics (users, services, revenue, issues)
  - Daily redemptions chart
  - Revenue impact chart
  - Recent redemptions list

### 2. Dispatch & Control
- **Route**: `/admin/demand-analytics`
- **Features**:
  - Live map of all active jobs
  - Available mechanics locations
  - Job status monitoring
  - ETA tracking

### 3. User Control
- **Route**: `/admin/merchant-verification`
- **Features**:
  - Approve/Reject mechanics
  - View verification documents
  - Ban/Suspend users
  - User management

### 4. Dispute Management
- **Route**: `/admin/disputes/[id]` (via dashboard)
- **Features**:
  - Handle complaints
  - Process refunds
  - Resolution tracking

### 5. Analytics & Reports
- **Routes**:
  - `/admin/demand-analytics` - Demand analytics
  - `/admin/campaigns` - Campaign management
  - `/admin/promotions` - Promotions
- **Features**:
  - Revenue charts
  - Most popular services
  - Active mechanics count
  - User growth metrics

### 6. System Health
- **Route**: `/admin/system-health`
- **Features**:
  - System status
  - Performance metrics
  - Error logs

### Admin Routes Summary
```
/admin/dashboard               - Main dashboard
/admin/demand-analytics        - Dispatch map & analytics
/admin/merchant-verification   - User verification
/admin/campaigns               - Campaign management
/admin/promotions              - Promotions
/admin/system-health           - System monitoring
```

---

## Route Protection

### Role-Based Access
- **Customer**: Can only access `/dashboard/*` routes
- **Mechanic**: Can only access `/mechanic/*` routes
- **Admin**: Can only access `/admin/*` routes

### Implementation
- `RouteGuard` component wraps protected routes
- Checks user role from `AuthContext`
- Redirects to appropriate dashboard if unauthorized

---

## Authentication Flow

1. User visits `/auth/login`
2. Enters credentials or uses Super Admin testing
3. API call to `/api/auth/login`
4. User data stored in localStorage
5. Auth context updated via `userUpdated` event
6. Redirect based on role:
   - Customer → `/dashboard`
   - Mechanic → `/mechanic/dashboard`
   - Admin → `/admin/dashboard`

---

## Real-Time Features

### WebSocket Events (via Socket.io)

#### Customer Events
- `job:matched` - Mechanic found
- `job:accepted` - Mechanic accepted job
- `location:update` - Mechanic location updates
- `job:status` - Job status changes

#### Mechanic Events
- `job:request` - New job request received
- `location:update` - Location tracking
- `job:status` - Job status updates

#### Admin Events
- `dispatch:update` - Dispatch map updates
- System-wide notifications

---

## Dynamic Rules & Permissions

### Role-Based Visibility
- **Customer**: 
  - Sees live mechanic location
  - Service availability
  - Invoices updating dynamically
  
- **Mechanic**:
  - Receives real-time job popups
  - Earnings update dynamically
  - Online/Offline toggle visible
  
- **Admin**:
  - Sees live job map
  - Verification buttons only for pending mechanics
  - Analytics charts update with data

### Conditional Rendering
- Components check `useAuth()` hook for user role
- UI elements show/hide based on permissions
- API calls respect role-based endpoints

---

## UI Standards

### Color Scheme
- **Primary**: `#00ff88` (Green)
- **Background**: `#0f2818` (Dark Green) or theme-based
- **Cards**: White with borders
- **Text**: Theme-aware (light/dark)

### Components
- Consistent spacing: 16-24px
- Rounded corners: `rounded-lg` (0.5rem)
- Shadows: `shadow-lg` for modals
- Transitions: 200-300ms ease

### Typography
- **Headings**: Poppins (600-700 weight)
- **Body**: Inter (400-500 weight)
- Consistent font sizes across breakpoints

---

## Navigation Structure

### Customer Navigation
- Sidebar (desktop) / Bottom nav (mobile)
- Map view for main dashboard
- Standard layout for other pages

### Mechanic Navigation
- Bottom navigation bar (mobile-first)
- Fixed footer with main actions
- Dashboard-focused layout

### Admin Navigation
- Sidebar navigation
- Desktop-optimized
- Full-width content area

---

## Next Steps for Implementation

1. ✅ Route protection implemented
2. ✅ Auth flow fixed
3. ✅ Layout standardization in progress
4. ⏳ Pulsing ripple animation for matching
5. ⏳ Real-time location tracking
6. ⏳ Complete onboarding flows
7. ⏳ Payment integration
8. ⏳ Dispute management
9. ⏳ Analytics charts with real data
10. ⏳ Mobile responsiveness testing

---

## File Structure Reference

```
app/
  ├── admin/              # Admin routes
  ├── auth/              # Authentication
  ├── dashboard/         # Customer routes
  ├── mechanic/          # Mechanic routes
  ├── onboarding/        # Onboarding flows
  └── page.tsx           # Landing page

components/
  ├── admin-layout.tsx   # Admin layout
  ├── customer-layout.tsx # Customer layout
  ├── mechanic-layout.tsx # Mechanic layout
  ├── route-guard.tsx    # Route protection
  ├── sidebar-nav.tsx    # Navigation
  └── ui/               # Reusable UI components

lib/
  ├── auth-context.tsx   # Auth state management
  ├── realtime-context.tsx # WebSocket management
  └── api-client.ts      # API client
```
