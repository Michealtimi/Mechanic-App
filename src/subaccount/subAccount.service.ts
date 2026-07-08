// src/modules/subaccount/subaccount.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from '../payment/interface/payment-gateway.interface';
import { CreateSubaccountDto, QuerySubaccountsDto } from './dto/subAccount.dto';

@Injectable()
export class SubaccountService {
  private readonly logger = new Logger(SubaccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway,
  ) {
    this.logger.log(`Subaccount service initialized using Gateway: ${this.gateway.constructor.name}`);
  }

  async createMechanicSubaccount(userId: string, dto: CreateSubaccountDto) {
    const operation = `Create subaccount for user ${userId}`;
    this.logger.debug(`Starting: ${operation}`);

    try {
      await this.assertMechanicEligibility(userId);

      this.logger.log(`Delegating subaccount creation to gateway for ${dto.businessName}`);

      const gatewayResult = await this.gateway.createSubaccount({
        businessName: dto.businessName,
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        percentageCharge: dto.percentageCharge,
      });

      if (!gatewayResult || !gatewayResult.subaccountId) {
        this.logger.error(`Gateway returned invalid result: ${JSON.stringify(gatewayResult)}`);
        throw new BadRequestException(
          'Payment gateway failed to create subaccount. Check bank details or gateway configuration.',
        );
      }

      const subaccount = await this.prisma.subaccount.create({
        data: {
          mechanicId: userId,
          gateway: this.gateway.constructor.name.replace('Gateway', '').toUpperCase() || 'PAYSTACK',
          subaccountCode: gatewayResult.subaccountId,
          subaccountId: gatewayResult.subaccountId,
          bankCode: dto.bankCode,
          accountNumber: dto.accountNumber,
          businessName: dto.businessName,
          percentageCharge: dto.percentageCharge,
          provider: 'paystack',
        },
      });

      this.logger.log(`Subaccount created and linked (Code: ${subaccount.subaccountCode})`);
      return subaccount;
    } catch (err: any) {
      this.logger.error(`Failed: ${operation}. Error: ${err.message}`, err.stack);

      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Failed to create subaccount due to an unexpected server issue.');
    }
  }

  async getSubaccount(userId: string) {
    const operation = `Get subaccount for user ${userId}`;
    this.logger.debug(`Starting: ${operation}`);

    try {
      const sub = await this.prisma.subaccount.findFirst({ where: { mechanicId: userId } });

      if (!sub) {
        this.logger.warn(`Subaccount not found for user ID: ${userId}`);
        throw new NotFoundException('Subaccount not found.');
      }

      this.logger.log(`Subaccount retrieved for ${userId}`);
      return sub;
    } catch (err: any) {
      if (!(err instanceof NotFoundException)) {
        this.logger.error(`Failed: ${operation}`, err.stack);
      }
      throw err;
    }
  }

  async findAll(query: QuerySubaccountsDto) {
    const operation = `Get all subaccounts (Page ${query.page || 1})`;
    this.logger.debug(`Starting: ${operation}`);

    try {
      const page = Math.max(query.page || 1, 1);
      const limit = Math.min(Math.max(query.limit || 20, 1), 200);
      const skip = (page - 1) * limit;

      const [total, data] = await Promise.all([
        this.prisma.subaccount.count({}),
        this.prisma.subaccount.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            mechanic: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        }),
      ]);

      this.logger.log(`Retrieved ${data.length} subaccounts out of ${total}.`);

      return {
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
        data,
      };
    } catch (err: any) {
      this.logger.error(`Failed: ${operation}. Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Could not retrieve subaccounts.');
    }
  }

  private async assertMechanicEligibility(userId: string): Promise<void> {
    const mechanic = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!mechanic) {
      throw new NotFoundException('Mechanic not found.');
    }

    const existing = await this.prisma.subaccount.findFirst({ where: { mechanicId: userId } });
    if (existing) {
      throw new ConflictException('Mechanic already has a subaccount.');
    }
  }
}
