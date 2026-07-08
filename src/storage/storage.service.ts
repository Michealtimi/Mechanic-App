import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface StoredObject {
  key: string;
  url: string;
  localPath?: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private provider: 'local' | 's3' = 'local';
  private localRoot: string;
  private publicBaseUrl: string;
  private s3Client: { send: (cmd: unknown) => Promise<unknown> } | null = null;
  private s3Bucket: string | null = null;
  private s3Region: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.localRoot = path.join(process.cwd(), 'uploads');
    this.publicBaseUrl =
      config.get<string>('STORAGE_PUBLIC_BASE_URL') ||
      `http://localhost:${config.get<number>('PORT', 3000)}`;
  }

  async onModuleInit() {
    this.provider = (this.config.get<string>('STORAGE_PROVIDER') || 'local') as 'local' | 's3';
    if (this.provider === 's3') {
      await this.initS3();
    } else {
      await fs.mkdir(this.localRoot, { recursive: true });
      this.logger.log(`Storage: local (${this.localRoot})`);
    }
  }

  private async initS3() {
    const bucket = this.config.get<string>('AWS_S3_BUCKET');
    const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    if (!bucket) {
      this.logger.warn('STORAGE_PROVIDER=s3 but AWS_S3_BUCKET missing — falling back to local');
      this.provider = 'local';
      await fs.mkdir(this.localRoot, { recursive: true });
      return;
    }
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        },
      }) as { send: (cmd: unknown) => Promise<unknown> };
      this.s3Bucket = bucket;
      this.s3Region = region;
      this.logger.log(`Storage: S3 (${bucket}, ${region})`);
      void PutObjectCommand;
    } catch (err: any) {
      this.logger.error(`S3 init failed: ${err.message} — using local storage`);
      this.provider = 'local';
      await fs.mkdir(this.localRoot, { recursive: true });
    }
  }

  async putObject(relativeKey: string, body: Buffer, contentType: string): Promise<StoredObject> {
    const key = relativeKey.replace(/^\/+/, '');

    if (this.provider === 's3' && this.s3Client && this.s3Bucket) {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      const url =
        this.config.get<string>('STORAGE_PUBLIC_BASE_URL') ||
        `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
      return { key, url };
    }

    const fullPath = path.join(this.localRoot, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);
    const url = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    return { key, url, localPath: fullPath };
  }

  resolveLocalPath(relativeKey: string): string {
    return path.join(this.localRoot, relativeKey.replace(/^\/+/, ''));
  }
}
