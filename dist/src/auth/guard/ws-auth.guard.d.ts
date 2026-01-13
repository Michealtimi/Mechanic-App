import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';
export interface AuthenticatedSocket extends Socket {
    data: {
        user: User;
    };
}
export declare class WsAuthGuard implements CanActivate {
    private jwtService;
    private prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
