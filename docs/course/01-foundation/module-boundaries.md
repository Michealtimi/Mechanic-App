# Module Boundaries & Dependencies

## Overview

This lesson explains how modules should interact with each other, how to define module boundaries, and how to avoid circular dependencies.

---

## Module Dependency Graph

```
Core Modules (no dependencies on other feature modules):
├── auth/
├── users/
└── organizations/

Feature Modules (depend on core):
├── vehicles/ → organizations/
├── telemetry/ → vehicles/
├── booking/ → users/, vehicles/
├── payment/ → booking/, wallet/
└── dispatch/ → booking/, vehicles/
```

---

## Dependency Rules

### 1. Core Modules

Core modules should not depend on feature modules:

```typescript
// ✅ GOOD: Auth module is independent
@Module({
  imports: [ConfigModule, JwtModule],
  // No feature module dependencies
})
export class AuthModule {}
```

### 2. Feature Modules

Feature modules can depend on core modules and other feature modules (carefully):

```typescript
// ✅ GOOD: Vehicles depends on Organizations (core)
@Module({
  imports: [OrganizationsModule, PrismaModule],
  // ...
})
export class VehiclesModule {}
```

### 3. Avoid Circular Dependencies

```typescript
// ❌ BAD: Circular dependency
// BookingModule imports PaymentModule
// PaymentModule imports BookingModule

// ✅ GOOD: Use interfaces or shared types
// Create a shared interface in common/types/
```

---

## Cross-Module Communication

### Using Interfaces

Instead of importing services directly, use interfaces:

```typescript
// common/interfaces/payment.interface.ts
export interface IPaymentService {
  processPayment(amount: number): Promise<Payment>;
}

// payment/payments.service.ts
@Injectable()
export class PaymentsService implements IPaymentService {
  // Implementation
}

// booking/booking.service.ts
constructor(
  @Inject('IPaymentService') private paymentService: IPaymentService
) {}
```

### Exporting Services

Only export services that other modules need:

```typescript
// wallet/wallet.module.ts
@Module({
  providers: [WalletService],
  exports: [WalletService], // ✅ Export for other modules
})
export class WalletModule {}
```

---

## Best Practices

1. **Keep modules focused**: Each module should have a single responsibility
2. **Use dependency injection**: Don't create instances directly
3. **Export sparingly**: Only export what's necessary
4. **Document dependencies**: Comment on why a module depends on another

---

## Exercises

1. **Map Dependencies**: Create a dependency graph for all modules in the codebase.

2. **Identify Circular Dependencies**: Use a tool or manual inspection to find any circular dependencies.

3. **Refactor if Needed**: If you find circular dependencies, refactor using interfaces or shared types.

---

## Related Documentation

- [NestJS Modules Documentation](https://docs.nestjs.com/modules)
