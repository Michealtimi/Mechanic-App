import { PrismaService } from 'prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
export declare class RatingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createRating(dto: CreateRatingDto, customerId: string): Promise<any>;
    listMechanicRatings(mechanicId: string, page?: number, pageSize?: number): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
}
