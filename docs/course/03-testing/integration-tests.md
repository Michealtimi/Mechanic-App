# Integration Testing

## Overview

This lesson covers writing integration tests that test multiple components working together.

---

## Example: Tenant Isolation Integration Test

```typescript
// test/integration/modules/tenant-isolation.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Tenant Isolation (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should enforce tenant isolation on protected endpoints', async () => {
    // 1. Create test users with different tenantIds
    // 2. Authenticate as user from tenant-1
    // 3. Try to access data from tenant-2
    // 4. Verify access is denied

    const token = await getAuthToken('user-tenant-1');
    const response = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify response only contains tenant-1 data
    expect(response.body).not.toContainEqual(
      expect.objectContaining({ tenantId: 'tenant-2' })
    );
  });
});
```

---

## Best Practices

1. **Test Real Workflows**: Test complete user workflows
2. **Use Test Database**: Use a separate test database
3. **Clean Up**: Clean up test data after tests
4. **Test Edge Cases**: Test error scenarios

---

## Exercises

1. **Write Integration Test**: Write an integration test for a complete workflow (e.g., create booking → payment → completion).

2. **Test Multi-Tenancy**: Write a test that verifies tenant isolation across multiple modules.

---

## Related Documentation

- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS E2E Testing](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing)
