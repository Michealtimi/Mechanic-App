import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    changes?: any,
  ) {
    try {
      await this.prisma.audit.create({
        data: { userId, action, resource, resourceId, changes },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for action: ${action} on resource: ${resource}:${resourceId}`,
        error,
      );
    }
  }
}

