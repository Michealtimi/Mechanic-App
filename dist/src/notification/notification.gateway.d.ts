import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    private connectedUsers;
    constructor(jwtService: JwtService);
    handleConnection(socket: any): any;
    handleDisconnect(socket: any): void;
    emitToUser(userId: string, event: string, payload: any): boolean;
    emitBookingCancelled(mechanicId: string, bookingId: string): void;
    sendBookingCompleted(userId: string, bookingId: string): void;
    emitBookingCompleted(userId: string, bookingId: string): void;
}
