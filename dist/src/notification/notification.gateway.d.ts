import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedUsers;
    handleConnection(socket: any): void;
    handleDisconnect(socket: any): void;
    emitBookingCompleted(userId: string, bookingId: string): void;
    emitPaymentConfirmed(userId: string, amount: number): void;
    emitBookingCancelled(mechanicId: string, bookingId: string): void;
}
