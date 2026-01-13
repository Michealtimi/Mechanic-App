import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        pushToken: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.Status;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        lastLogin: Date | null;
        shopName: string | null;
        currentLat: number | null;
        currentLng: number | null;
        isAvailableForJobs: boolean;
        mechanicOnlineStatus: import(".prisma/client").$Enums.MechanicOnlineStatus;
        isEvSpecialist: boolean;
        serviceRadiusKm: number;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
        averageRating: number;
        totalReviews: number;
        totalJobsCompleted: number;
    }>;
}
export {};
