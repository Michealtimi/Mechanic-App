# Unit Testing

## Overview

This lesson covers writing unit tests for services, controllers, and guards in the Mechanic App.

---

## Test Structure

```
test/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── guards/
├── integration/
│   ├── modules/
│   └── workflows/
└── e2e/
    └── scenarios/
```

---

## Example: Service Unit Test

### WalletService Test

```typescript
// test/unit/services/wallet-ledger.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../../../src/wallet/wallet.service';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from 'decimal.js';

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should create transaction record for credit operations', async () => {
    const mockTx = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        update: jest.fn().mockResolvedValue({ balance: new Decimal(1000) }),
      },
      walletTransaction: {
        create: jest.fn(),
      },
    };

    await service.creditWalletWithTx(mockTx as any, 'user-1', new Decimal(1000));

    expect(mockTx.walletTransaction.create).toHaveBeenCalled();
  });
});
```

---

## Example: Guard Unit Test

### TenantGuard Test

```typescript
// test/unit/guards/tenant.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TenantGuard } from '../../../src/common/guard/tenant.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard, Reflector],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should throw ForbiddenException when user has no tenantId', () => {
    const request = {
      user: { id: 'user-1', role: 'CUSTOMER', tenantId: null },
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

---

## Best Practices

1. **Mock Dependencies**: Mock all external dependencies (Prisma, services)
2. **Test Edge Cases**: Test error conditions, null values, edge cases
3. **Clear Test Names**: Use descriptive test names
4. **Arrange-Act-Assert**: Structure tests clearly

---

## Exercises

1. **Write a Service Test**: Write a unit test for a service method.

2. **Write a Guard Test**: Write a unit test for a guard.

3. **Test Error Cases**: Add tests for error conditions.

---

## Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
