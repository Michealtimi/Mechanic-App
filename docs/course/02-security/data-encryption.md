# Data Encryption

## Overview

This lesson explains how sensitive data is encrypted using AES-256-GCM encryption in the Mechanic App.

---

## EncryptionService

The `EncryptionService` provides AES-256-GCM encryption for sensitive data:

```typescript
// src/common/encryption/encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new InternalServerErrorException('ENCRYPTION_KEY missing');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  async decrypt(encryptedText: string): Promise<string> {
    const combined = Buffer.from(encryptedText, 'base64');
    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const encrypted = combined.subarray(32);
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }
}
```

---

## Usage Examples

### Encrypting Webhook Secrets

```typescript
// payment/payments.service.ts
constructor(
  private encryptionService: EncryptionService,
) {}

async storeWebhookSecret(secret: string) {
  const encrypted = await this.encryptionService.encrypt(secret);
  // Store encrypted secret in database
  await this.prisma.webhookSecret.create({
    data: { encryptedSecret: encrypted },
  });
}

async verifyWebhookSignature(signature: string, payload: string) {
  const stored = await this.prisma.webhookSecret.findFirst();
  const decrypted = await this.encryptionService.decrypt(stored.encryptedSecret);
  // Use decrypted secret for verification
  return this.verifySignature(signature, payload, decrypted);
}
```

### Encrypting Refresh Tokens

```typescript
// auth/auth.service.ts
async storeRefreshToken(userId: string, token: string) {
  const encrypted = await this.encryptionService.encrypt(token);
  await this.prisma.refreshToken.create({
    data: {
      userId,
      encryptedToken: encrypted,
    },
  });
}
```

---

## Security Best Practices

1. **Key Management**: Store `ENCRYPTION_KEY` in environment variables, never in code
2. **Key Rotation**: Plan for key rotation strategy (requires re-encryption)
3. **IV Uniqueness**: Each encryption uses a unique IV (handled automatically)
4. **Authentication Tag**: GCM provides authenticity verification

---

## Environment Configuration

```bash
# .env
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**Key Requirements**:
- 64-character hex string (32 bytes)
- Generate using: `openssl rand -hex 32`
- Keep secure and never commit to version control

---

## Exercises

1. **Encrypt Data**: Use EncryptionService to encrypt a sensitive string.

2. **Decrypt Data**: Decrypt the encrypted string and verify it matches the original.

3. **Add Encryption**: Find a place in the codebase where sensitive data is stored and add encryption.

---

## Related Documentation

- [EncryptionService Implementation](../../../src/common/encryption/encryption.service.ts)
- [EncryptionModule](../../../src/common/encryption/encryption.module.ts)
