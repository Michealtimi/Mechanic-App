import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    private connectedUsers;
    private static readonly ADMIN_ROOM;
    constructor(jwtService: JwtService);
    handleConnection(socket: any): any;
    handleDisconnect(socket: any): void;
    emitToUser(userId: string, event: string, payload: any): boolean;
    emitToAdmin(event: string, payload: any): void;
    emitBookingCompleted(userId: string, bookingId: string): Promise<void>;
    emitBookingCancelled(userId: string, bookingId: string): Promise<void>;
    emitDisputeOpened(customerId: string, mechanicId: string, bookingId: string): Promise<void>;
}
