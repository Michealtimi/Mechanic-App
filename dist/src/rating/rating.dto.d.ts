export declare class CreateRatingDto {
    bookingId: string;
    mechanicId: string;
    score: number;
    comment?: string;
}
export declare class UpdateRatingDto {
    score?: number;
    comment?: string;
}
