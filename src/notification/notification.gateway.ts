// src/modules/notifications/notification.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// NOTE: Ensure Admin role users have a way to identify themselves or that
// you have a pre-defined 'admin' room they all join.

@WebSocketGateway({ 
    cors: true, 
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>(); 
  // ⬅️ Optional: Use a dedicated admin room for broadcasts
  private static readonly ADMIN_ROOM = 'admins'; 

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize Socket.IO with Redis adapter for multi-instance support
   */
  async afterInit(server: Server) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 
      `redis://${this.configService.get<string>('REDIS_HOST', 'localhost')}:${this.configService.get<number>('REDIS_PORT', 6379)}`;
    
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      // Create Redis clients for pub/sub
      const pubClient = createClient({
        url: redisUrl,
        ...(redisPassword && { password: redisPassword }),
      });

      const subClient = pubClient.duplicate();

      // Connect clients
      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Set up error handlers
      pubClient.on('error', (err) => {
        this.logger.error(`Redis pub client error: ${err.message}`, err.stack);
      });

      subClient.on('error', (err) => {
        this.logger.error(`Redis sub client error: ${err.message}`, err.stack);
      });

      // Create and set Redis adapter
      server.adapter(createAdapter(pubClient, subClient));

      this.logger.log(`[NotificationGateway] Redis adapter configured successfully for multi-instance support`);
    } catch (error: any) {
      this.logger.error(`[NotificationGateway] Failed to configure Redis adapter: ${error.message}`, error.stack);
      this.logger.warn(`[NotificationGateway] Continuing without Redis adapter - multi-instance support disabled`);
      // Continue without Redis adapter - single instance will still work
    }
  }

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
        const payload = this.jwtService.verify(token); 
        const userId = payload.sub || payload.id;
        const userRole = payload.role; // ⬅️ Assume role is in JWT payload

        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId; 
        socket.join(userId); // Join user-specific room

        // ⬅️ NEW: Admins join a special room for broadcasts
        if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
            socket.join(NotificationGateway.ADMIN_ROOM);
        }
        
        this.logger.log(`User connected (verified): ${userId} (${userRole})`);
    } catch (e) {
        this.logger.error('Unauthorized WebSocket connection attempt. Token invalid.', e.message);
        socket.disconnect();
    }
  }

  handleDisconnect(socket: any) {
    const userId = socket.userId; 
    if (userId) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
    }
  }

  // ------------------------------------
  // STANDARDIZED EMITTER
  // ------------------------------------

    emitToUser(userId: string, event: string, payload: any): boolean {
        const isUserOnline = this.connectedUsers.has(userId); 
        
        if (isUserOnline) {
            this.server.to(userId).emit(event, payload);
            return true;
        }
        return false;
    }
  
  // ------------------------------------
  // APPLICATION-SPECIFIC EMITTERS
  // ------------------------------------

    /**
     * Notifies the admin channel that a new dispute has been opened.
     */
    emitToAdmin(event: string, payload: any) {
        this.server.to(NotificationGateway.ADMIN_ROOM).emit(event, payload);
        this.logger.debug(`Emitted event ${event} to Admin Room.`);
    }
    
    // Corresponds to: async emitBookingCompleted(userId: string, bookingId: string) { ... }
    async emitBookingCompleted(userId: string, bookingId: string) {
        const payload = { bookingId, status: 'completed', message: 'Your booking has been successfully completed.' };
        this.emitToUser(userId, 'booking.completed', payload);
        
        // Optional: Notify Admin for completed booking for auditing/stats
        // this.emitToAdmin('admin.bookingUpdate', { ... });
    }

    // Corresponds to: async emitBookingCancelled(userId: string, bookingId: string) { ... }
    async emitBookingCancelled(userId: string, bookingId: string) {
        const payload = { bookingId, status: 'cancelled', message: 'Your booking has been cancelled.' };
        this.emitToUser(userId, 'booking.cancelled', payload);
        
        // Optional: Notify Admin
        this.emitToAdmin('admin.bookingCancelled', payload);
    }

    // Corresponds to: async emitDisputeOpened(customerId: string, mechanicId: string, bookingId: string) { ... }
    async emitDisputeOpened(customerId: string, mechanicId: string, bookingId: string) {
        const payload = { bookingId, status: 'disputed', message: 'A new dispute related to your booking has been opened.' };
        
        // 1. Notify Customer
        this.emitToUser(customerId, 'dispute.opened', payload);
        
        // 2. Notify Mechanic
        this.emitToUser(mechanicId, 'dispute.opened', payload);
        
        // 3. Notify Admin Dashboard (CRITICAL)
        this.emitToAdmin('admin.disputeAlert', { 
            bookingId, 
            customerId, 
            mechanicId, 
            message: 'A new dispute requires review.' 
        });
    }
}