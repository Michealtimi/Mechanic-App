// payment.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto, PaymentResponseDto } from './dto/createPayment.dto';

@Injectable()
export class PaymentService {
  private PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(dto: CreatePaymentDto, customerEmail: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      // Generate reference
      const reference = `PS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Save pending payment in DB
      await this.prisma.payment.create({
        data: {
          bookingId: dto.bookingId,
          amount: dto.amount,
          reference,
        },
      });

      // Call Paystack API
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: customerEmail,
          amount: dto.amount * 100, // Paystack uses kobo
          reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
        },
      );

      return plainToInstance(PaymentResponseDto, {
        success: true,
        message: 'Payment initiated',
        data: response.data.data, // contains payment link
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error.response?.data || 'Payment initiation failed',
      );
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
        },
      );

      const payment = await this.prisma.payment.update({
        where: { reference },
        data: { status: response.data.data.status.toUpperCase() },
      });

      if (payment.status === 'SUCCESS') {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      }

      return {
        success: true,
        message: 'Payment verified',
        data: payment,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.response?.data || 'Payment verification failed',
      );
    }
  }
}
