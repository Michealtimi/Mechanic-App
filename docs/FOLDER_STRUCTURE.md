# Folder Structure & Naming Conventions

## Overview

This document defines the standard folder structure and naming conventions for the Mechanic App codebase. All modules should follow these guidelines to ensure consistency, maintainability, and scalability.

---

## Standard Module Structure

Every feature module should follow this structure:

```
src/
├── {module-name}/
│   ├── dto/                          # Data Transfer Objects
│   │   ├── create-*.dto.ts          # DTOs for creation operations
│   │   ├── update-*.dto.ts          # DTOs for update operations
│   │   └── *-response.dto.ts        # DTOs for response objects
│   ├── {module-name}.controller.ts  # REST API controller
│   ├── {module-name}.service.ts     # Business logic service
│   ├── {module-name}.module.ts      # NestJS module definition
│   └── {module-name}.spec.ts        # Unit tests (optional but recommended)
```

### Examples

**Good Examples:**
- `src/organizations/` ✅
  - `dto/create-organization.dto.ts`
  - `dto/update-organization.dto.ts`
  - `organizations.controller.ts`
  - `organizations.service.ts`
  - `organizations.module.ts`

- `src/vehicles/` ✅
  - `dto/create-vehicle.dto.ts`
  - `vehicles.controller.ts`
  - `vehicles.service.ts`
  - `vehicles.module.ts`

- `src/telemetry/` ✅
  - `dto/create-metric.dto.ts`
  - `dto/metric-filter.dto.ts`
  - `telemetry.controller.ts`
  - `telemetry.service.ts`
  - `telemetry.module.ts`

**Issues Found:**
- `src/paymnet/` ❌ (typo: should be `payment/`)
- `src/wallet/wallet..controller.ts` ❌ (double dot: should be `wallet.controller.ts`)
- `src/admin/admin.service..ts` ❌ (double dot: should be `admin.service.ts`)

---

## Shared/Common Code Structure

```
src/
├── common/
│   ├── decorators/          # Custom decorators (@Public(), @TenantId(), etc.)
│   ├── guards/              # Route guards (TenantGuard, RolesGuard)
│   ├── interceptors/        # Interceptors (TenantInterceptor)
│   ├── pipes/               # Validation pipes (future)
│   ├── filters/             # Exception filters (future)
│   └── encryption/          # Encryption service (future)
├── config/                  # Configuration modules (future)
└── types/                   # Shared TypeScript types (future)
```

---

## Current Module Audit

### ✅ Modules Following Standard Structure

| Module | DTOs | Controller | Service | Module | Notes |
|--------|------|-----------|---------|--------|-------|
| `organizations/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `vehicles/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `telemetry/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `mechanic/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `auth/` | ✅ `dto/` | ✅ | ✅ | ✅ | Has additional `guard/` subfolder |
| `booking/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `dispatch/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `ev/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `rating/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `dispute/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `chat/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `location/` | ⚠️ Inline | ✅ | ✅ | - | DTOs in root, should move to `dto/` |
| `payout/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `subaccount/` | ✅ `dto/` | ✅ | ✅ | ✅ | Perfect structure |
| `sla/` | ⚠️ None | ✅ | ✅ | ✅ | No DTOs found |
| `audit/` | ⚠️ Inline | ✅ | ✅ | ✅ | DTOs in root, should move to `dto/` |
| `admin/` | ⚠️ Inline | ✅ | ⚠️ `admin.service..ts` | - | Has naming issue |

### ❌ Modules with Issues

| Module | Issue | Fix Required |
|--------|-------|--------------|
| `paymnet/` | Typo in folder name | Rename to `payment/` |
| `wallet/` | `wallet..controller.ts` (double dot) | Rename to `wallet.controller.ts` |
| `admin/` | `admin.service..ts` (double dot) | Rename to `admin.service.ts` |

---

## Naming Conventions

### Files

1. **Controllers**: `{module-name}.controller.ts`
   - ✅ `organizations.controller.ts`
   - ✅ `vehicles.controller.ts`
   - ❌ `wallet..controller.ts` (double dot)

2. **Services**: `{module-name}.service.ts`
   - ✅ `organizations.service.ts`
   - ✅ `vehicles.service.ts`
   - ❌ `admin.service..ts` (double dot)

3. **Modules**: `{module-name}.module.ts`
   - ✅ `organizations.module.ts`
   - ✅ `vehicles.module.ts`

4. **DTOs**: 
   - Creation: `create-{entity}.dto.ts`
   - Update: `update-{entity}.dto.ts`
   - Response: `{entity}-response.dto.ts`
   - ✅ `create-organization.dto.ts`
   - ✅ `update-organization.dto.ts`
   - ✅ `organization-response.dto.ts`

### Folders

1. **Module folders**: Use kebab-case
   - ✅ `organizations/`
   - ✅ `vehicles/`
   - ❌ `paymnet/` (typo: should be `payment/`)

2. **Subfolders**: Use lowercase
   - ✅ `dto/`
   - ✅ `guard/`
   - ✅ `interceptors/`

---

## Module Dependencies

### Core Modules (No dependencies on other feature modules)
- `auth/` - Authentication & authorization
- `users/` - User management
- `organizations/` - Organization/fleet management

### Feature Modules (Depend on core modules)
- `vehicles/` → `organizations/`
- `telemetry/` → `vehicles/`
- `booking/` → `users/`, `vehicles/`
- `payment/` → `booking/`, `wallet/`
- `dispatch/` → `booking/`, `vehicles/`
- `dispute/` → `booking/`, `payment/`

---

## Migration Checklist

### Immediate Fixes Required

- [ ] Rename `src/paymnet/` → `src/payment/`
- [ ] Update all imports from `paymnet` to `payment`
- [ ] Rename `src/wallet/wallet..controller.ts` → `src/wallet/wallet.controller.ts`
- [ ] Update import in `wallet.module.ts`
- [ ] Rename `src/admin/admin.service..ts` → `src/admin/admin.service.ts`
- [ ] Update imports referencing `admin.service..ts`

### Standardization Tasks

- [ ] Move inline DTOs to `dto/` subfolders for:
  - `dispatch/`
  - `ev/`
  - `rating/`
  - `dispute/`
  - `chat/`
  - `location/`
  - `audit/`
  - `admin/`

- [ ] Create `dto/` folders where missing
- [ ] Ensure all modules have `.module.ts` files
- [ ] Add `.spec.ts` test files for critical modules

---

## Best Practices

1. **One module per feature**: Each feature should be self-contained in its own folder
2. **DTOs in subfolder**: All DTOs should be in a `dto/` subfolder
3. **Consistent naming**: Use kebab-case for folders, camelCase for files
4. **No circular dependencies**: Modules should not import each other circularly
5. **Export only necessary**: Only export services/controllers that other modules need
6. **Test files co-located**: Keep `.spec.ts` files next to the files they test

---

## Future Enhancements

- [ ] Create `src/config/` for configuration modules
- [ ] Create `src/types/` for shared TypeScript types
- [ ] Add `src/common/pipes/` for validation pipes
- [ ] Add `src/common/filters/` for exception filters
- [ ] Standardize error handling across modules
- [ ] Add module boundary linting rules

---

**Last Updated**: January 26, 2026  
**Status**: Audit Complete, Migration In Progress
