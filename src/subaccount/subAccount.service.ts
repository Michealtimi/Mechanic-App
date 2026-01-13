// src/modules/subaccount/subaccount.service.ts

import { 
  Injectable,
  Logger, 
  NotFoundException, 
  InternalServerErrorException, 
  ConflictException,  
  BadRequestException,
  Inject, // ⬅️ NEW: Added Inject for gateway pattern
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
// Assuming the Subaccount logic is now part of your generic Payment Gateway interface:
import { IPaymentGateway } from '../payment/interface/payment-gateway.interface'; 
import { CreateSubaccountDto } from './subaccount.dto'; // Assuming path

@Injectable()
export class SubaccountService {
  private readonly logger = new Logger(SubaccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    // 1. ⚡ REFACTORED: Injecting the generic gateway, just like PaymentService
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway, 
  ) {
    this.logger.log(`Subaccount service initialized using Gateway: ${this.gateway.constructor.name}`);
  }

  // ===============================
  // 1. CREATE MECHANIC SUBACCOUNT
  // ===============================
  async createMechanicSubaccount(userId: string, dto: CreateSubaccountDto) {
    const operation = `Create subaccount for user ${userId}`;
    this.logger.debug(`Starting: ${operation}`);

    try {
      
      await this.assertMechanicEligibility(userId);
      
      this.logger.log(`Delegating subaccount creation to gateway for ${dto.businessName}`);

      // 2. Delegate creation to the active Gateway Strategy
      // NOTE: This assumes IPaymentGateway has a createSubaccount method.
      const gatewayResult = await this.gateway.createSubaccount({ 
        businessName: dto.businessName,
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        percentageCharge: dto.percentageCharge,
      });

      // ⚠️ Robust Check for Gateway Success
      if (!gatewayResult || !gatewayResult.subaccountId) {
          this.logger.error(`Gateway returned invalid result: ${JSON.stringify(gatewayResult)}`);
          throw new BadRequestException('Payment gateway failed to create subaccount. Check bank details or gateway configuration.');
      }
      
      // 3. Store subaccount details locally in the database
      const subaccount = await this.prisma.subaccount.create({
        data: {
          userId,
          gateway: this.gateway.constructor.name, // ⚡ Use the actual gateway name
          subaccountCode: gatewayResult.subaccountId,
          bankCode: dto.bankCode,
          accountNumber: dto.accountNumber,
          businessName: dto.businessName,
          percentageCharge: dto.percentageCharge,
        },
      });

      this.logger.log(`✅ Subaccount created and linked (Code: ${subaccount.subaccountCode})`);
      return subaccount;

    } catch (err: any) {
      this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
      
      // Re-throw specific, controlled exceptions
      if (err instanceof NotFoundException || err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }

      // Throw generic server error for unhandled exceptions
      throw new InternalServerErrorException('Failed to create subaccount due to an unexpected server issue.');
    }
  }

  // ===============================
  // 2. GET SUBACCOUNT
  // ===============================
  async getSubaccount(userId: string) {
    const operation = `Get subaccount for user ${userId}`;
    this.logger.debug(`Starting: ${operation}`);
    
    try {
      const sub = await this.prisma.subaccount.findUnique({ where: { userId } });
      
      if (!sub) {
        this.logger.warn(`Subaccount not found for user ID: ${userId}`);
        throw new NotFoundException('Subaccount not found.');
      }
      
      this.logger.log(`✅ Subaccount retrieved for ${userId}`);
      return sub;
      
    } catch (err: any) {
      // Log stack for true failures, but just re-throw controlled errors
      if (!(err instanceof NotFoundException)) {
        this.logger.error(`❌ Failed: ${operation}`, err.stack);
      }
      throw err;
    }
  }

  async findAll(query: QuerySubaccountsDto) {
    const operation = `Get all subaccounts (Page ${query.page || 1})`;
    this.logger.debug(`Starting: ${operation}`);

    try {
      // 1. Pagination setup
      const page = Math.max(query.page || 1, 1);
      const limit = Math.min(Math.max(query.limit || 20, 1), 200);
      const skip = (page - 1) * limit;

      // 2. Fetch data and count concurrently
      const [total, data] = await Promise.all([
        this.prisma.subaccount.count({}), // Query 1: Get total count
        this.prisma.subaccount.findMany({ // Query 2: Get paged data
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { 
            user: { 
              select: { id: true, firstName: true, lastName: true, email: true } // Include basic user info
            } 
          }
        }),
      ]);

      this.logger.log(`✅ Retrieved ${data.length} subaccounts out of ${total}.`);

      return {
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
        data,
      };
      
    } catch (err: any) {
      this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Could not retrieve subaccounts.');
    }
  }

  // --------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------

  /** Asserts that the user exists and does not already have a subaccount. */
  private async assertMechanicEligibility(userId: string): Promise<void> {
      const mechanic = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!mechanic) {
        throw new NotFoundException('Mechanic not found.');
      }

      const existing = await this.prisma.subaccount.findUnique({ where: { userId } });
      if (existing) {
        throw new ConflictException('Mechanic already has a subaccount.');
      }
  }
}