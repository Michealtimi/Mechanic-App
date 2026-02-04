# Folder Structure & Naming Conventions

## Overview

This lesson covers the folder structure and naming conventions used in the Mechanic App codebase. Understanding these patterns is essential for maintaining consistency and scalability.

---

## Standard Module Structure

Every feature module in the codebase follows this structure:

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

### Example: Organizations Module

```typescript
src/organizations/
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   ├── add-member.dto.ts
│   └── organization-response.dto.ts
├── organizations.controller.ts
├── organizations.service.ts
├── organizations.module.ts
└── organizations.spec.ts
```

---

## Naming Conventions

### Files

1. **Controllers**: `{module-name}.controller.ts`
   - ✅ `organizations.controller.ts`
   - ✅ `vehicles.controller.ts`
   - ❌ `wallet..controller.ts` (double dot - fixed)

2. **Services**: `{module-name}.service.ts`
   - ✅ `organizations.service.ts`
   - ✅ `vehicles.service.ts`

3. **Modules**: `{module-name}.module.ts`
   - ✅ `organizations.module.ts`

4. **DTOs**: 
   - Creation: `create-{entity}.dto.ts`
   - Update: `update-{entity}.dto.ts`
   - Response: `{entity}-response.dto.ts`

### Folders

1. **Module folders**: Use kebab-case
   - ✅ `organizations/`
   - ✅ `vehicles/`
   - ✅ `payment/` (was `paymnet/` - fixed)

2. **Subfolders**: Use lowercase
   - ✅ `dto/`
   - ✅ `guard/`
   - ✅ `interceptors/`

---

## Shared/Common Code Structure

```
src/
├── common/
│   ├── decorators/          # Custom decorators (@Public(), @TenantId())
│   ├── guards/              # Route guards (TenantGuard, RolesGuard)
│   ├── interceptors/        # Interceptors (TenantInterceptor)
│   ├── pipes/               # Validation pipes (future)
│   ├── filters/             # Exception filters (future)
│   └── encryption/          # Encryption service
├── config/                  # Configuration modules (future)
└── types/                   # Shared TypeScript types (future)
```

---

## Best Practices

1. **One module per feature**: Each feature should be self-contained
2. **DTOs in subfolder**: All DTOs should be in a `dto/` subfolder
3. **Consistent naming**: Use kebab-case for folders, camelCase for files
4. **No circular dependencies**: Modules should not import each other circularly
5. **Export only necessary**: Only export services/controllers that other modules need

---

## Exercises

1. **Identify Issues**: Look at the `src/` directory and identify any modules that don't follow the standard structure.

2. **Create a Module**: Create a new module following the standard structure:
   - Create `src/reports/` module
   - Add DTOs in `dto/` subfolder
   - Create controller, service, and module files

3. **Fix Naming**: If you find files with naming issues (like double dots), fix them and update imports.

---

## Related Documentation

- [FOLDER_STRUCTURE.md](../../FOLDER_STRUCTURE.md) - Complete folder structure guide
