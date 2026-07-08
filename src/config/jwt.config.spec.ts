import { normalizeJwtUser } from './jwt.config';

describe('normalizeJwtUser', () => {
  it('maps sub to id for controller compatibility', () => {
    const user = normalizeJwtUser({
      sub: 'user-123',
      email: 'a@b.com',
      role: 'CUSTOMER',
      tenantId: 'org-1',
    });
    expect(user.id).toBe('user-123');
    expect(user.sub).toBe('user-123');
    expect(user.email).toBe('a@b.com');
    expect(user.role).toBe('CUSTOMER');
    expect(user.tenantId).toBe('org-1');
  });

  it('falls back to id when sub missing', () => {
    const user = normalizeJwtUser({
      id: 'legacy-id',
      email: 'x@y.com',
      role: 'MECHANIC',
    });
    expect(user.id).toBe('legacy-id');
  });
});
