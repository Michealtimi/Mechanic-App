# 🚀 Quick Start Guide

## Current Integration Status

### ✅ What's Connected:
1. **API Client** - Complete REST API client ready (`lib/api-client.ts`)
2. **Real-Time Context** - Socket.io client ready (`lib/realtime-context.tsx`)
3. **Auth Integration** - Login page now uses real API

### ⚠️ What Needs Work:
1. Backend endpoints need to be running
2. Some missing endpoints need to be added to backend
3. Frontend components need to use API client instead of mock data

## 🎯 How to Start Development

### Method 1: Windows (Easiest)
```bash
# Double-click or run:
start-dev.bat
```
This opens two command windows - one for backend, one for frontend.

### Method 2: Manual (Recommended for First Time)

**Step 1: Start Backend**
```bash
cd mechanic/Mechanic-App
npm install  # First time only
npm run start:dev
```
✅ Backend runs on http://localhost:3000

**Step 2: Start Frontend** (New Terminal)
```bash
# In project root
npm install socket.io-client  # If not installed
npm run dev
```
✅ Frontend runs on http://localhost:3001

### Method 3: Using npm scripts
```bash
# Install concurrently (one time)
npm install -g concurrently

# Then run both:
npm run dev:all  # (if you add this script)
```

## ✅ Verify Connection

1. **Backend Health**: Visit http://localhost:3000/api
   - Should see Swagger documentation

2. **Frontend Health**: Visit http://localhost:3001
   - Should see AutoServe homepage

3. **Test Login**:
   - Go to http://localhost:3001/auth/login
   - Try logging in (use test credentials from backend)
   - Check browser DevTools → Network tab
   - Should see request to `http://localhost:3000/auth/login`

4. **Check WebSocket**:
   - Open browser Console (F12)
   - After login, should see: `[Realtime] Connected to Socket.io`

## 🔧 Environment Setup

### Backend (.env in mechanic/Mechanic-App/)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/autoserve
JWT_SECRET=your-secret-key-here
PORT=3000
```

### Frontend (.env.local in project root)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## 🐛 Common Issues

**"Cannot connect to backend"**
- Make sure backend is running on port 3000
- Check CORS is enabled in backend
- Verify .env.local has correct API_URL

**"WebSocket connection failed"**
- Backend must be running
- Check NEXT_PUBLIC_WS_URL in .env.local
- Verify Socket.io gateway is configured in backend

**"401 Unauthorized"**
- Check JWT token is being sent
- Verify backend JWT_SECRET is set
- Token might be expired - try logging in again

## 📊 Current Status

- **Backend**: ✅ Ready (NestJS with Prisma)
- **Frontend**: ✅ Ready (Next.js with API client)
- **Connection**: ⚠️ Partially connected (auth works, other endpoints need testing)
- **Real-Time**: ⚠️ Ready but needs backend WebSocket events

## 🎯 Next Steps

1. ✅ Start both servers (you're here!)
2. Test login flow
3. Test booking creation
4. Test real-time matching (when backend events are added)
5. Connect remaining frontend components to API

## 📝 Quick Commands Reference

```bash
# Backend
cd mechanic/Mechanic-App
npm run start:dev          # Start dev server
npx prisma migrate dev      # Run migrations
npx prisma studio          # View database

# Frontend  
npm run dev                # Start dev server
npm run build              # Build for production
npm run lint               # Check code quality
```
