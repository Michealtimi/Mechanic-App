import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UserRequest } from 'src/common/interfaces/user-request.interface';
export declare class RatingController {
    private readonly ratingService;
    constructor(ratingService: RatingService);
    rate(req: UserRequest, dto: CreateRatingDto): Promise<any>;
    list(id: string, page?: number, pageSize?: number): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
}
