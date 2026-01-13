// src/auth/guards/ws-auth.guard.ts
import { CanActivate, Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt'; // Assuming you have JwtService for token validation
import { Socket } from 'socket.io';
import { PrismaService } from 'prisma/prisma.service'; // Assuming PrismaService for user lookup
import { User } from '@prisma/client';

// Interface to extend Socket with authenticated user data
export interface AuthenticatedSocket extends Socket {
  data: { user: User };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService, // To fetch user details
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = client.handshake.auth.token || client.handshake.query.token;

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const payload = this.jwtService.verify(token); // Verify JWT payload
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } }); // Assuming payload.sub is userId

      if (!user) {
        throw new WsException('Unauthorized: User not found');
      }

      client.data.user = user; // Attach authenticated user to socket data
      return true;
    } catch (e) {
      throw new WsException(`Unauthorized: ${e.message}`);
    }
  }
}