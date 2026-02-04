# Mechanic Platform API — production Dockerfile
# Build: docker build -t mechanic-api .
# Run: docker run -p 3000:3000 --env-file .env mechanic-api

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json yarn.lock* package-lock.json* ./
RUN corepack enable && (test -f yarn.lock && yarn install --frozen-lockfile || npm ci)
COPY . .
RUN (test -f yarn.lock && yarn build || npm run build) && npx prisma generate

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p uploads/receipts && chown -R nestjs:nodejs uploads
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
