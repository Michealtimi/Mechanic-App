// src/modules/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

 handleConnection(socket: any) {
  const token = socket.handshake.auth.token;
  try {
    const payload = this.jwtService.verify(token); // Use injected JwtService
    const userId = payload.sub; // Or payload.id
    
    this.connectedUsers.set(userId, socket.id);
    this.logger.log(`User connected (verified): ${userId}`);
  } catch (e) {
    this.logger.error('Unauthorized WebSocket connection attempt.');
    socket.disconnect(); // Reject the connection
  }
}

 handleDisconnect(socket: any) {
    const userId = socket.userId; // Retrieve the attached ID
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User disconnected: ${userId}`);
    }
}
  emitBookingCompleted(userId: string, bookingId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('bookingCompleted', { bookingId });
    }
  }

  emitPaymentConfirmed(userId: string, amount: number) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('paymentConfirmed', { amount });
    }
  }

  emitBookingCancelled(mechanicId: string, bookingId: string) {
    const socketId = this.connectedUsers.get(mechanicId);
    if (socketId) {
      this.server.to(socketId).emit('bookingCancelled', { bookingId });
    }
  }
}
