# Production & Global Deployment (Manual Steps)

Code changes implement production hardening. **You run migrations and CI manually** as agreed.

## 1. Environment (production)

Set at minimum:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<64+ chars>
JWT_ACCESS_SECRET=<same or dedicated>
JWT_REFRESH_SECRET=<64+ chars>
ENCRYPTION_KEY=<64 hex chars>
API_KEY_SECRET=<16+ chars>
ALLOWED_ORIGINS=https://your-frontend.com
PAYMENT_GATEWAY=PAYSTACK
PAYMENT_GATEWAY_BY_COUNTRY={"NG":"PAYSTACK","US":"STRIPE","KE":"FLUTTERWAVE"}
PAYMENT_GATEWAY_BY_CURRENCY={"NGN":"PAYSTACK","USD":"STRIPE"}
STRIPE_SECRET_KEY=sk_live_...
PAYSTACK_SECRET_KEY=...
PAYSTACK_WEBHOOK_SECRET=...
REDIS_HOST=...
REDIS_PORT=6379
SWAGGER_ENABLED=false
DEFAULT_CURRENCY=NGN
DEFAULT_LOCALE=en-NG
GOOGLE_CLIENT_ID=<if using Google sign-in>
STORAGE_PROVIDER=s3
AWS_REGION=...
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
STORAGE_PUBLIC_BASE_URL=https://cdn.example.com
```

For additional countries, set `DEFAULT_CURRENCY` (e.g. `USD`, `KES`, `GBP`) and use a gateway that supports that currency.

## 2. Database migrations (manual)

```bash
npx prisma migrate deploy
```

## 3. Build & run

```bash
npm ci
npm run build
node dist/main.js
```

## 4. Webhook URLs

- Paystack: `https://api.example.com/webhooks/paystack`
- Flutterwave: `https://api.example.com/webhooks/flutterwave`

## 5. GitHub Actions (manual)

Add workflow: install → `npm run build` → `npm run test:webhooks` → `npm test` (when DB test service available).

## 6. Money path invariant

- Payment success **confirms** booking (escrow).
- Mechanic wallet credit runs on **segment completion** or **completion PIN** (booking-level).
- Duplicate release is prevented via `payment.metadata.released`.
