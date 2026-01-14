# Quick Start Guide - Development Servers

## 🚀 Start Both Servers

### Option 1: Manual (Recommended for First Time)

**Terminal 1 - Backend:**
```bash
cd mechanic/Mechanic-App
npm install  # or yarn install
npm run start:dev
```
✅ Backend running on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd next-js-tailwind-app  # or just stay in root
npm install  # or pnpm install
npm install socket.io-client  # if not installed
npm run dev
```
✅ Frontend running on http://localhost:3001

### Option 2: Using npm scripts (if configured)

Create a root `package.json` with scripts to run both:
```json
{
  "scripts": {
    "dev:backend": "cd mechanic/Mechanic-App && npm run start:dev",
    "dev:frontend": "npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
  }
}
```

Then run: `npm run dev`

## ✅ Verification Checklist

1. **Backend Health Check**
   - Visit: http://localhost:3000/api
   - Should see Swagger documentation

2. **Frontend Health Check**
   - Visit: http://localhost:3001
   - Should see AutoServe homepage

3. **API Connection Test**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Should see request to `http://localhost:3000/auth/login`

4. **WebSocket Connection Test**
   - Open browser DevTools Console
   - After login, should see: `[Realtime] Connected to Socket.io`
   - If error, check backend WebSocket gateway is running

## 🔧 Environment Setup

### Backend Environment (mechanic/Mechanic-App/.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/autoserve
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Frontend Environment (next-js-tailwind-app/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Run `npx prisma migrate dev` in backend directory
- Check .env file exists and has correct values

**Frontend won't start:**
- Run `npm install` or `pnpm install`
- Check Node.js version (should be 18+)
- Clear `.next` folder and try again

**CORS errors:**
- Backend needs CORS enabled (should already be in main.ts)
- Check frontend URL matches CORS origin

**WebSocket connection fails:**
- Verify backend is running
- Check `NEXT_PUBLIC_WS_URL` in .env.local
- Check browser console for specific error
