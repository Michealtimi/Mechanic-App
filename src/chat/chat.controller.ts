// src/chat/chat.controller.ts

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger'; // For Swagger
import { AuthGuard } from '@nestjs/passport'; // For JWT authentication
import { Request } from 'express'; // To access req.user
import { ChatService } from './chat.service';
import { ChatRoom, ChatMessage } from '@prisma/client'; // Import Prisma types

// Define an interface to augment the Express Request object with user data
// This assumes your JWT strategy attaches a 'user' object with an 'id' property.
interface AuthenticatedRequest extends Request {
  user: { id: string }; // Adjust based on your actual JWT payload structure
}

@ApiTags('Chat') // Groups endpoints under 'Chat' in Swagger UI
@ApiBearerAuth() // Indicates that JWT token is required for these endpoints
@UseGuards(AuthGuard('jwt')) // Protects all endpoints within this controller with JWT authentication
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private chatService: ChatService) {}

  /**
   * Retrieves all chat rooms that the authenticated user is a participant of.
   * This is typically used to display a list of active conversations in the UI.
   *
   * @param req The request object, containing the authenticated user's ID.
   * @returns An array of ChatRoom objects.
   */
  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user chat rooms.', type: [ChatRoom] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getUserChatRooms(
    @Req() req: AuthenticatedRequest,
  ): Promise<ChatRoom[]> {
    const userId = req.user.id; // Safely get the authenticated user's ID
    this.logger.verbose(`Fetching chat rooms for user: ${userId}`);
    try {
      return await this.chatService.getUserChatRooms(userId);
    } catch (error) {
      this.logger.error(`Error fetching chat rooms for user ${userId}: ${error.message}`, error.stack);
      // ChatService should ideally throw specific NestJS exceptions
      throw new BadRequestException('Could not retrieve your chat rooms.');
    }
  }

  /**
   * Retrieves the chat history (messages) for a specific chat room.
   * Access is restricted to participants of that chat room.
   *
   * @param roomId The ID of the chat room.
   * @param req The request object, containing the authenticated user's ID.
   * @returns An array of ChatMessage objects.
   * @throws UnauthorizedException if the user is not a participant.
   * @throws NotFoundException if the chat room does not exist.
   */
  @Get(':roomId/messages')
  @ApiOperation({ summary: 'Get messages for a specific chat room' })
  @ApiParam({ name: 'roomId', description: 'ID of the chat room', type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved chat messages.', type: [ChatMessage] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Chat room not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChatMessage[]> {
    const userId = req.user.id; // Safely get the authenticated user's ID
    this.logger.verbose(`Fetching messages for room ${roomId} by user: ${userId}`);

    // 1. Authorize: Check if the authenticated user is a participant of this room
    const room = await this.chatService.getChatRoomById(roomId);
    if (!room) {
      this.logger.warn(`Attempt to access non-existent room ${roomId} by user ${userId}.`);
      throw new NotFoundException(`Chat room with ID "${roomId}" not found.`);
    }

    if (room.customerId !== userId && room.mechanicId !== userId) {
      this.logger.warn(`Unauthorized access attempt: User ${userId} tried to access room ${roomId}.`);
      throw new UnauthorizedException('You are not authorized to view messages in this chat room.');
    }

    // 2. Retrieve messages from the service
    try {
      return await this.chatService.getMessages(roomId);
    } catch (error) {
      this.logger.error(`Error fetching messages for room ${roomId} by user ${userId}: ${error.message}`, error.stack);
      // ChatService should throw more specific exceptions, but if it throws generic, handle here
      throw new BadRequestException('Could not retrieve chat messages.');
    }
  }

  // --- Future REST Endpoints for Chat Management (Optional) ---
  // @Post('room/create-or-get')
  // async createOrGetChatRoom(@Body() dto: InitiateChatDto, @Req() req: AuthenticatedRequest) {
  //     const customerId = req.user.id;
  //     // This might be better as a WS event, but can also be a REST endpoint.
  //     return this.chatService.getOrCreateRoom({ customerId, mechanicId: dto.mechanicId, bookingId: dto.bookingId });
  // }
}