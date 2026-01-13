"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ChatService = ChatService_1 = class ChatService {
    prisma;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateRoom(params) {
        const { customerId, mechanicId, bookingId } = params;
        try {
            if (bookingId) {
                const roomByBooking = await this.prisma.chatRoom.findUnique({
                    where: { bookingId },
                    include: { customer: true, mechanic: true },
                });
                if (roomByBooking) {
                    if (roomByBooking.customerId === customerId && roomByBooking.mechanicId === mechanicId) {
                        this.logger.verbose(`Found existing chat room ${roomByBooking.id} for booking ${bookingId}`);
                        return roomByBooking;
                    }
                    else {
                        throw new common_1.BadRequestException(`Booking ${bookingId} is already linked to a different chat room/participants.`);
                    }
                }
            }
            let room = await this.prisma.chatRoom.findUnique({
                where: { customerId_mechanicId: { customerId, mechanicId } },
                include: { customer: true, mechanic: true },
            });
            if (!room) {
                room = await this.prisma.chatRoom.create({
                    data: {
                        customerId,
                        mechanicId,
                        bookingId: bookingId || null,
                    },
                    include: { customer: true, mechanic: true },
                });
                this.logger.log(`Created new chat room: ${room.id} (bookingId: ${bookingId || 'none'}) for customer ${customerId} and mechanic ${mechanicId}`);
            }
            else if (bookingId && !room.bookingId) {
                room = await this.prisma.chatRoom.update({
                    where: { id: room.id },
                    data: { bookingId: bookingId },
                    include: { customer: true, mechanic: true },
                });
                this.logger.log(`Updated existing chat room ${room.id} to link unique booking ${bookingId}`);
            }
            return room;
        }
        catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('bookingId')) {
                throw new common_1.BadRequestException(`A chat room for booking ID "${bookingId}" already exists.`);
            }
            this.logger.error(`Failed to get or create chat room for ${customerId}-${mechanicId} (booking ${bookingId || 'none'}): ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not create or retrieve chat room due to an internal error.');
        }
    }
    async getChatRoomById(roomId) {
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
                    booking: {
                        select: { id: true, scheduledAt: true, status: true },
                    },
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to retrieve chat room ${roomId} with details: ${error.message}`, error.stack);
            return null;
        }
    }
    async saveMessage(params) {
        const { roomId, senderId, message } = params;
        try {
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                select: { customerId: true, mechanicId: true },
            });
            if (!room || (room.customerId !== senderId && room.mechanicId !== senderId)) {
                this.logger.warn(`Unauthorized message attempt: Sender ${senderId} not in room ${roomId}.`);
                throw new common_1.UnauthorizedException('You are not authorized to send messages in this chat room.');
            }
            let processedMessage = message;
            if (this.isLikelyLeakage(message)) {
                processedMessage = this.maskLeakage(message);
                this.logger.warn(`Leakage detected and masked in room ${roomId} by sender ${senderId}. Original: "${message}"`);
            }
            const savedMessage = await this.prisma.chatMessage.create({
                data: {
                    roomId: roomId,
                    senderId: senderId,
                    message: processedMessage,
                },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
                    },
                },
            });
            await this.prisma.chatRoom.update({
                where: { id: roomId },
                data: { updatedAt: new Date() },
            });
            this.logger.verbose(`Message saved: ${savedMessage.id} in room ${roomId} by ${senderId}`);
            return savedMessage;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Failed to save message in room ${roomId} by ${senderId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not send message due to an internal error.');
        }
    }
    async getMessages(roomId, paginationParams) {
        const { skip = 0, take = 50 } = paginationParams;
        try {
            const roomExists = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!roomExists) {
                throw new common_1.NotFoundException(`Chat room with ID "${roomId}" not found.`);
            }
            return this.prisma.chatMessage.findMany({
                where: { roomId },
                orderBy: { createdAt: 'asc' },
                skip,
                take,
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to retrieve messages for room ${roomId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not retrieve chat messages due to an internal error.');
        }
    }
    async getUserChatRooms(userId) {
        try {
            return await this.prisma.chatRoom.findMany({
                where: {
                    OR: [
                        { customerId: userId },
                        { mechanicId: userId },
                    ],
                },
                orderBy: { updatedAt: 'desc' },
                include: {
                    customer: {
                        select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
                    },
                    mechanic: {
                        select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
                    },
                    booking: {
                        select: { id: true, scheduledAt: true, status: true },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            senderId: true,
                            message: true,
                            createdAt: true,
                            sender: {
                                select: { id: true, firstName: true, profilePictureUrl: true },
                            },
                        },
                    },
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to retrieve chat rooms for user ${userId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not retrieve user chat rooms due to an internal error.');
        }
    }
    isLikelyLeakage(message) {
        const phoneRegex = /(0|\+234)[789]\d{9}|\b\d{11}\b/;
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;
        return phoneRegex.test(message) || emailRegex.test(message) || urlRegex.test(message);
    }
    maskLeakage(message) {
        message = message.replace(/(0|\+234)[789]\d{9}|\b\d{11}\b/g, '[PHONE NUMBER REDACTED]');
        message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
        message = message.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/g, '[LINK REDACTED]');
        return message;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map