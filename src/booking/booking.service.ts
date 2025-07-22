import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"
import { CreateBookingDto } from "./dto/booking.dto"



@Injectable()
export class BookingService {constructor(private readonly prisma: PrismaService) {}

        async createBooking(dto: CreateBookingDto, serviceId : string, customerId: string) {
           /// checking if the mechanic exit
            const mechanic = await this.prisma.user.findUnique({
                where: { id: dto.mechanicId },
            });  /// fetching the mechanic by id from the prisma service

        if(!mechanic){
           throw new NotFoundException("Mechanic not found")

        }

        /// checking if the service exists
        const service = await this.prisma.mechanicService.findUnique({
            where: { id: serviceId },
        });

        if(!service){
            throw new NotFoundException("Service not found")

        }

    // ✅ Validate and parse scheduledAt
    const scheduledDate = new Date( dto.schedudledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }

        ////  create a booking
      return this.prisma.booking.create({
      data: {
        customerId,
        mechanicId: dto.mechanicId,
        serviceId: serviceId,
        scheduledAt: new Date(dto.schedudledAt) , // ensure it's Date type
        status: dto.status || 'PENDING',
      },
    });
}

 async getMechanicBooking(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        OR: [
          { mechanicId: userId },
          { customerId: userId },
        ]
      },
      include: {
        service: true,
        customer: true,
      },
    });
  }
  }