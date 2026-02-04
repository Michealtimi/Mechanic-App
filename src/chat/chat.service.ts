// src/chat/chat.service.ts

import { Injectable, Logger, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; // Assuming your PrismaService path
import { ChatRoom, ChatMessage, User } from '@prisma/client'; // Import Prisma generated types

// Import DTOs from your consolidated chat.dto.ts
import {
  CreateChatRoomDto,
  SendChatMessageDto,
  ChatRoomResponseDto, // Also used internally for clarity of return types
  ChatMessageResponseDto,
  GetChatMessagesDto, // For pagination
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Finds an existing chat room by customer/mechanic pair OR by bookingId (if provided and unique),
   * or creates a new one.
   *
   * @param params CreateChatRoomDto containing customerId, mechanicId, and an optional unique bookingId.
   * @returns The existing or newly created ChatRoom.
   * @throws BadRequestException if the operation fails or if a unique bookingId already has a room.
   * @throws ConflictException if trying to create a room for an existing unique bookingId.
   */
  async getOrCreateRoom(params: CreateChatRoomDto): Promise<ChatRoom> {
    const { customerId, mechanicId, bookingId } = params;

    try {
      // 1. Prioritize finding by bookingId if provided, due to its unique constraint.
      if (bookingId) {
        const roomByBooking = await this.prisma.chatRoom.findUnique({
          where: { bookingId }, // This leverages the unique constraint
          include: { customer: true, mechanic: true }, // Include for context in response
        });

        if (roomByBooking) {
          // If a room already exists for this unique bookingId, return it.
          // We also verify the participants match, though the unique constraint on bookingId is primary.
          if (roomByBooking.customerId === customerId && roomByBooking.mechanicId === mechanicId) {
            this.logger.verbose(`Found existing chat room ${roomByBooking.id} for booking ${bookingId}`);
            return roomByBooking;
          } else {
            // This should ideally not happen if bookingId is truly unique and linked correctly,
            // but as a safeguard, throw an error if the booking is linked to different users.
            throw new BadRequestException(`Booking ${bookingId} is already linked to a different chat room/participants.`);
          }
        }
      }

      // 2. If no bookingId provided OR no room found by bookingId,
      //    try to find a general (non-booking-specific) room between the customer and mechanic.
      //    This uses the compound unique constraint { customerId, mechanicId }.
      let room = await this.prisma.chatRoom.findUnique({
        where: { customerId_mechanicId: { customerId, mechanicId } },
        include: { customer: true, mechanic: true },
      });

      if (!room) {
        // 3. If still no room found, create a new one.
        //    If bookingId was provided, it will be linked here.
        //    If not, bookingId will be null.
        room = await this.prisma.chatRoom.create({
          data: {
            customerId,
            mechanicId,
            bookingId: bookingId || null, // Link bookingId if present, otherwise null
          },
          include: { customer: true, mechanic: true },
        });
        this.logger.log(`Created new chat room: ${room.id} (bookingId: ${bookingId || 'none'}) for customer ${customerId} and mechanic ${mechanicId}`);
      } else if (bookingId && !room.bookingId) {
        // 4. If a general room exists but a bookingId is provided *now* and the room isn't linked,
        //    update the existing general room to link it to this unique booking.
        room = await this.prisma.chatRoom.update({
          where: { id: room.id },
          data: { bookingId: bookingId },
          include: { customer: true, mechanic: true },
        });
        this.logger.log(`Updated existing chat room ${room.id} to link unique booking ${bookingId}`);
      }
      // Note: If room already exists AND has a bookingId (which is unique) AND a new bookingId is passed,
      // it means the new bookingId must either match the existing one (handled in step 1),
      // or we're trying to link a different bookingId to an already linked room, which should be prevented by schema.
      // Prisma's unique constraint on `bookingId` will throw an error if we try to link the same `bookingId` to a new room,
      // or a different `bookingId` to an already-linked `room` if not careful.

      return room;
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('bookingId')) {
        // Prisma error for unique constraint violation, specifically for bookingId
        throw new BadRequestException(`A chat room for booking ID "${bookingId}" already exists.`);
      }
      this.logger.error(`Failed to get or create chat room for ${customerId}-${mechanicId} (booking ${bookingId || 'none'}): ${error.message}`, error.stack);
      throw new BadRequestException('Could not create or retrieve chat room due to an internal error.');
    }
  }

  /**
   * Retrieves a ChatRoom by its ID, including participant details.
   *
   * @param roomId The ID of the chat room.
   * @returns The ChatRoom object with included customer and mechanic, or null if not found.
   */
  async getChatRoomById(roomId: string): Promise<ChatRoom | null> {
    try {
      return await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
          mechanic: {
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
          booking: { // Include booking details if you want
            select: { id: true, scheduledAt: true, status: true },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve chat room ${roomId} with details: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Saves a new message to the database. Includes content processing and security checks.
   *
   * @param params Parameters for saving the message (roomId, senderId, message).
   * @returns The newly created ChatMessage with sender details.
   * @throws UnauthorizedException if the sender is not a participant of the room.
   * @throws BadRequestException if the message cannot be saved due to internal error.
   */
  async saveMessage(params: { roomId: string; senderId: string; message: string }): Promise<ChatMessage> {
    const { roomId, senderId, message } = params;

    try {
      // 1. Authorization: Verify sender is a participant of the room
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { customerId: true, mechanicId: true },
      });

      if (!room || (room.customerId !== senderId && room.mechanicId !== senderId)) {
        this.logger.warn(`Unauthorized message attempt: Sender ${senderId} not in room ${roomId}.`);
        throw new UnauthorizedException('You are not authorized to send messages in this chat room.');
      }

      // 2. Leakage Prevention / Content Moderation
      let processedMessage = message;
      if (this.isLikelyLeakage(message)) {
        processedMessage = this.maskLeakage(message);
        this.logger.warn(`Leakage detected and masked in room ${roomId} by sender ${senderId}. Original: "${message}"`);
        // await this.auditService.logLeakageAttempt(senderId, roomId, message);
      }

      // 3. Save the message to the database, including sender for immediate return
      const savedMessage = await this.prisma.chatMessage.create({
        data: {
          roomId: roomId,
          senderId: senderId,
          message: processedMessage,
        },
        include: {
          sender: { // Directly include sender details now that the relation exists
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
        },
      });

      // Update the chat room's `updatedAt` to reflect new activity
      await this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      });


      this.logger.verbose(`Message saved: ${savedMessage.id} in room ${roomId} by ${senderId}`);
      return savedMessage;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Failed to save message in room ${roomId} by ${senderId}: ${error.message}`, error.stack);
      throw new BadRequestException('Could not send message due to an internal error.');
    }
  }

  /**
   * Retrieves all messages for a given chat room, ordered chronologically, with pagination.
   *
   * @param roomId The ID of the chat room.
   * @param paginationParams GetChatMessagesDto for skip/take.
   * @returns An array of ChatMessage objects with sender details.
   * @throws NotFoundException if the room does not exist.
   * @throws BadRequestException if messages cannot be retrieved.
   */
  async getMessages(roomId: string, paginationParams: GetChatMessagesDto): Promise<ChatMessage[]> {
    const { skip = 0, take = 50 } = paginationParams;
    try {
      const roomExists = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
      if (!roomExists) {
        throw new NotFoundException(`Chat room with ID "${roomId}" not found.`);
      }

      return this.prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: {
          sender: { // Include sender details
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve messages for room ${roomId}: ${error.message}`, error.stack);
      throw new BadRequestException('Could not retrieve chat messages due to an internal error.');
    }
  }

  /**
   * Retrieves all chat rooms a specific user is a part of, leveraging the new relations.
   * Includes customer, mechanic, and the latest message for preview.
   *
   * @param userId The ID of the user whose chat rooms are to be retrieved.
   * @returns An array of ChatRoom objects, ordered by the latest update.
   * @throws BadRequestException if the operation fails.
   */
  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      return await this.prisma.chatRoom.findMany({
        where: {
          OR: [
            { customerId: userId },
            { mechanicId: userId },
          ],
        },
        orderBy: { updatedAt: 'desc' }, // Order by most recent activity
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
          mechanic: {
            select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
          },
          booking: { // Include booking details if relevant for chat list UI
            select: { id: true, scheduledAt: true, status: true },
          },
          messages: { // Include the very last message for chat preview
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              senderId: true,
              message: true,
              createdAt: true,
              sender: { // Include sender of the last message
                select: { id: true, firstName: true, profilePictureUrl: true },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve chat rooms for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Could not retrieve user chat rooms due to an internal error.');
    }
  }

  // --- Private Helper Methods for Leakage Prevention ---
  private isLikelyLeakage(message: string): boolean {
    const phoneRegex = /(0|\+234)[789]\d{9}|\b\d{11}\b/;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;
    return phoneRegex.test(message) || emailRegex.test(message) || urlRegex.test(message);
  }

  private maskLeakage(message: string): string {
    message = message.replace(/(0|\+234)[789]\d{9}|\b\d{11}\b/g, '[PHONE NUMBER REDACTED]');
    message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
    message = message.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/g, '[LINK REDACTED]');
    return message;
  }
}