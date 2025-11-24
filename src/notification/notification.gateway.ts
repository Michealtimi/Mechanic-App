// src/modules/notifications/notification.gateway.ts
 
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt'; // ⬅️ CRITICAL: Need this dependency

// NOTE: You must ensure JwtService is provided in the NotificationsModule.

@WebSocketGateway({ 
    cors: true, 
    // This allows the JWT token to be passed in the handshake
    // Or you can configure the adapter for Redis here for true scalability
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId (Used for basic tracking)

  constructor(
    // ⬅️ Inject the JwtService to verify the connection token
    private readonly jwtService: JwtService,
  ) {}

  // ------------------------------------
  // CONNECTION HANDLERS (Security & Setup)
  // ------------------------------------

  handleConnection(socket: any) {
    const token = socket.handshake.auth.token;

    if (!token) {
        this.logger.warn('Connection rejected: Missing token.');
        return socket.disconnect();
    }

    try {
        // 1. Validate the JWT token
        const payload = this.jwtService.verify(token); 
        const userId = payload.sub || payload.id; // Get the user ID from the payload

        // 2. Map & Track the connection
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId; // ⬅️ Attach the ID to the socket object for easy disconnect lookup
        socket.join(userId); // ⬅️ CRITICAL for scalability (joins the user to a Room named after their ID)
        
        this.logger.log(`User connected (verified): ${userId}`);
    } catch (e) {
        this.logger.error('Unauthorized WebSocket connection attempt. Token invalid.', e.message);
        socket.disconnect(); // Reject the connection
    }
}

  handleDisconnect(socket: any) {
    // 1. Retrieve the attached ID
    const userId = socket.userId; 

    if (userId) {
        // 2. Clean up memory map
        this.connectedUsers.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
    }
}

  // ------------------------------------
  // STANDARDIZED EMITTER (Used by NotificationService)
  // ------------------------------------

    /**
     * Sends a real-time event to a specific user.
     * @param userId The ID of the recipient user.
     * @param event The name of the socket event (e.g., 'paymentConfirmed').
     * @param payload The data to send.
     * @returns True if the user was online and the message was emitted, false otherwise.
     */
    emitToUser(userId: string, event: string, payload: any): boolean {
        // Use the Room feature for reliable, scalable targeting
        const isUserOnline = this.connectedUsers.has(userId); 
        
        if (isUserOnline) {
            // Emit to the user's room (works even across multiple instances via Redis Adapter)
            this.server.to(userId).emit(event, payload);
            return true;
        }
        return false;
    }
    
    // ------------------------------------
    // OLD/DEPRECATED EMIT METHODS (REMOVED or simplified)
    // NOTE: These are now superseded by emitToUser in a well-designed system
    // They are kept here for historical reference but should rely on emitToUser
    // for actual delivery.
    // ------------------------------------

    emitBookingCancelled(mechanicId: string, bookingId: string) {
        // Example of how the old methods would now use the new method
        this.emitToUser(mechanicId, 'bookingCancelled', { bookingId });
    }

    sendBookingCompleted(userId: string, bookingId: string) {
        this.emitToUser(userId, 'bookingCompleted', { bookingId, message: 'Your booking is complete!' });
    }

    emitBookingCompleted(userId: string, bookingId: string) {
        this.sendBookingCompleted(userId, bookingId);
    }
}