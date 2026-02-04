# Database Migration Guide

> **Last Updated**: January 26, 2026

---

## ⚠️ **CRITICAL: Before Running Migration**

1. **Backup your database** (if production)
2. **Ensure DATABASE_URL is set** in `.env`
3. **Review schema changes** in `prisma/schema.prisma`

---

## 📋 Phase 1 & 2 Schema Changes

### New Models:
- ✅ `OrganizationWallet` - B2B wallet operations
- ✅ Enhanced `Dispute` - Priority, escalation fields
- ✅ Enhanced `SlaRecord` - Status tracking

### Modified Models:
- ✅ `WalletTransaction` - Added `orgWalletId` field
- ✅ `Organization` - Added `wallet` relation (deprecated `walletBalance`)

---

## 🚀 Migration Steps

### Step 1: Generate Prisma Client

```bash
npx --package=prisma@6.19.2 prisma generate
```

### Step 2: Create Migration

```bash
npx --package=prisma@6.19.2 prisma migrate dev --name phase1_and_2_complete
```

This will:
- Create migration SQL file
- Apply migration to database
- Regenerate Prisma client

### Step 3: Verify Migration

```bash
# Check migration status
npx --package=prisma@6.19.2 prisma migrate status

# Open Prisma Studio to verify
npx --package=prisma@6.19.2 prisma studio
```

---

## 📝 Migration SQL Preview

The migration will include:

```sql
-- Create OrganizationWallet table
CREATE TABLE "OrganizationWallet" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationWallet_pkey" PRIMARY KEY ("id")
);

-- Add fields to Dispute
ALTER TABLE "Dispute" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Dispute" ADD COLUMN "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Dispute" ADD COLUMN "escalatedBy" TEXT;

-- Add orgWalletId to WalletTransaction
ALTER TABLE "WalletTransaction" ADD COLUMN "orgWalletId" TEXT;
ALTER TABLE "WalletTransaction" ALTER COLUMN "walletId" DROP NOT NULL;
```

---

## ✅ Post-Migration Checklist

- [ ] Verify `OrganizationWallet` table exists
- [ ] Verify `Dispute` has new fields
- [ ] Verify `WalletTransaction` has `orgWalletId`
- [ ] Test organization wallet creation
- [ ] Test dispute escalation
- [ ] Test all new API endpoints

---

## 🔄 Rollback (If Needed)

```bash
# Rollback last migration
npx --package=prisma@6.19.2 prisma migrate resolve --rolled-back <migration-name>

# Or manually revert SQL
# (Check migration files in prisma/migrations/)
```

---

**Note**: Always test migrations in a development environment first!
