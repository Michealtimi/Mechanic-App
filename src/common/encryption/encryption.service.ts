import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * EncryptionService
 * 
 * Provides AES-256-GCM encryption for sensitive data such as:
 * - Webhook secrets
 * - Refresh tokens (at rest)
 * - Sensitive audit log fields
 * 
 * Uses AES-256-GCM which provides both confidentiality and authenticity.
 * The encryption key is derived from ENCRYPTION_KEY environment variable.
 * 
 * Security Notes:
 * - Each encryption operation uses a unique IV (Initialization Vector)
 * - The IV and auth tag are prepended to the encrypted data
 * - Format: IV (16 bytes) + Auth Tag (16 bytes) + Encrypted Data
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      this.logger.error(
        'ENCRYPTION_KEY environment variable is not set. Encryption service will not work properly.',
      );
      throw new InternalServerErrorException(
        'Encryption service misconfigured: ENCRYPTION_KEY missing',
      );
    }

    // Derive key from environment variable
    // In production, ENCRYPTION_KEY should be a 64-character hex string (32 bytes)
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== this.keyLength) {
      this.logger.error(
        `ENCRYPTION_KEY must be ${this.keyLength * 2} characters (${this.keyLength} bytes) hex string.`,
      );
      throw new InternalServerErrorException(
        'Encryption service misconfigured: Invalid ENCRYPTION_KEY format',
      );
    }
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM
   * @param plaintext The text to encrypt
   * @returns Base64-encoded string containing IV + Auth Tag + Encrypted Data
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate a random IV for each encryption
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV + Auth Tag + Encrypted Data
      const combined = Buffer.concat([iv, authTag, encrypted]);

      // Return as base64 for easy storage
      return combined.toString('base64');
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  /**
   * Decrypts an encrypted string using AES-256-GCM
   * @param encryptedText Base64-encoded string containing IV + Auth Tag + Encrypted Data
   * @returns The decrypted plaintext
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64');

      // Extract IV, Auth Tag, and Encrypted Data
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.ivLength + this.tagLength);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to decrypt data');
    }
  }

  /**
   * Synchronous version of encrypt (for cases where async is not needed)
   * Note: Still uses randomBytes which is async, but we handle it synchronously
   */
  encryptSync(plaintext: string): string {
    try {
      const iv = randomBytes(this.ivLength);
      const cipher = createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  /**
   * Synchronous version of decrypt
   */
  decryptSync(encryptedText: string): string {
    try {
      const combined = Buffer.from(encryptedText, 'base64');
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.ivLength + this.tagLength);
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to decrypt data');
    }
  }
}
