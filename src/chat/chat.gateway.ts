// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard'; // You'll need to create this WS Auth Guard
import { ChatService } from './chat.service';
import { InitiateChatDto } from './dto/initiate-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthenticatedSocket } from '../auth/interfaces/authenticated-socket.interface'; // Custom interface for authenticated socket

@WebSocketGateway({
  cors: { origin: '*' }, // Adjust for production
  namespace: '/chat' // Optional: Organize chat sockets under a specific namespace
})
@UseGuards(WsAuthGuard) // Apply the WebSocket authentication guard at the gateway level
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  // --- WebSocket Connection & Authentication ---
  // WsAuthGuard will handle token validation and attach user to client.data.user
  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id} (User: ${client.data.user.id})`);
    // Join a private room for the user to receive direct notifications (e.g., new chat requests)
    client.join(`user:${client.data.user.id}`);
  }

  async handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id} (User: ${client.data.user.id})`);
    // Cleanup any specific logic on disconnect if needed
  }

  // --- 1. Initiate a New Chat Room (or get existing one) ---
  @SubscribeMessage('initiateChat')
  async initiateChat(
    @MessageBody() dto: InitiateChatDto,
    @ConnectedSocket() client: AuthenticatedSocket, // Ensure socket is authenticated
  ) {
    const customerId = client.data.user.id; // Sender is the authenticated customer

    try {
      const room = await this.chatService.getOrCreateRoom(
        customerId,
        dto.mechanicId,
        dto.bookingId, // Optional booking link
      );

      // Save the initial message
      const initialMessage = await this.chatService.saveMessage(
        room.id,
        customerId, // Sender is authenticated user
        dto.initialMessage,
      );

      // Inform the client about the new/existing room and the initial message
      // Client should immediately join this room after receiving this
      client.emit('chatInitiated', { roomId: room.id, initialMessage });

      // Notify the mechanic if they are online
      this.server.to(`user:${dto.mechanicId}`).emit('newChatRequest', {
        roomId: room.id,
        senderId: customerId,
        message: initialMessage,
        // Include sender's name/avatar here for immediate display
      });

      this.logger.log(`User ${customerId} initiated/joined room ${room.id} with mechanic ${dto.mechanicId}`);
      return { roomId: room.id, initialMessage }; // Acknowledge to sender
    } catch (error) {
      this.logger.error(`Failed to initiate chat for ${customerId}: ${error.message}`, error.stack);
      client.emit('chatError', { message: error.message || 'Failed to initiate chat' });
    }
  }

  // --- 2. Send Message to an Existing Chat Room ---
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket, // Ensure socket is authenticated
  ) {
    const senderId = client.data.user.id; // Sender is the authenticated user

    try {
      const message = await this.chatService.saveMessage(
        dto.roomId,
        senderId, // Sender is securely derived from authentication
        dto.message,
      );

      // Broadcast the new message to all participants in the room
      this.server.to(dto.roomId).emit('newMessage', message);
      this.logger.verbose(`Message sent in room ${dto.roomId} by ${senderId}`);

      return { success: true, message }; // Acknowledge to sender
    } catch (error) {
      this.logger.error(`Failed to send message in room ${dto.roomId} by ${senderId}: ${error.message}`, error.stack);
      client.emit('chatError', { message: error.message || 'Failed to send message' });
    }
  }

  // --- 3. Join a Specific Chat Room to receive messages ---
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: AuthenticatedSocket, // Ensure socket is authenticated
  ) {
    // Optional: Add authorization check - verify client.data.user.id is part of roomId
    const room = await this.chatService.getChatRoomById(roomId); // You'd need this method in ChatService
    if (!room || (room.customerId !== client.data.user.id && room.mechanicId !== client.data.user.id)) {
      throw new UnauthorizedException('You are not authorized to join this chat room.');
    }

    client.join(roomId);
    this.logger.log(`User ${client.data.user.id} joined room ${roomId}`);
    // Optionally emit a success confirmation
    client.emit('roomJoined', { roomId });
  }

  // --- 4. Get Chat History (typically a REST endpoint, but can be WS for convenience) ---
  @SubscribeMessage('getChatHistory')
  async getChatHistory(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Add authorization check - verify client.data.user.id is part of roomId
    const room = await this.chatService.getChatRoomById(roomId);
    if (!room || (room.customerId !== client.data.user.id && room.mechanicId !== client.data.user.id)) {
      throw new UnauthorizedException('You are not authorized to view this chat history.');
    }

    try {
      const messages = await this.chatService.getMessages(roomId);
      client.emit('chatHistory', { roomId, messages });
      return { roomId, messages };
    } catch (error) {
      this.logger.error(`Failed to get history for room ${roomId}: ${error.message}`, error.stack);
      client.emit('chatError', { message: error.message || 'Failed to get chat history' });
    }
  }
}