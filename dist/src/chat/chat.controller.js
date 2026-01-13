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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const chat_service_1 = require("./chat.service");
let ChatController = ChatController_1 = class ChatController {
    chatService;
    logger = new common_1.Logger(ChatController_1.name);
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getUserChatRooms(req) {
        const userId = req.user.id;
        this.logger.verbose(`Fetching chat rooms for user: ${userId}`);
        try {
            return await this.chatService.getUserChatRooms(userId);
        }
        catch (error) {
            this.logger.error(`Error fetching chat rooms for user ${userId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not retrieve your chat rooms.');
        }
    }
    async getMessages(roomId, req) {
        const userId = req.user.id;
        this.logger.verbose(`Fetching messages for room ${roomId} by user: ${userId}`);
        const room = await this.chatService.getChatRoomById(roomId);
        if (!room) {
            this.logger.warn(`Attempt to access non-existent room ${roomId} by user ${userId}.`);
            throw new common_1.NotFoundException(`Chat room with ID "${roomId}" not found.`);
        }
        if (room.customerId !== userId && room.mechanicId !== userId) {
            this.logger.warn(`Unauthorized access attempt: User ${userId} tried to access room ${roomId}.`);
            throw new common_1.UnauthorizedException('You are not authorized to view messages in this chat room.');
        }
        try {
            return await this.chatService.getMessages(roomId);
        }
        catch (error) {
            this.logger.error(`Error fetching messages for room ${roomId} by user ${userId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Could not retrieve chat messages.');
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('rooms'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all chat rooms for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved user chat rooms.', type: [client_1.ChatRoom] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserChatRooms", null);
__decorate([
    (0, common_1.Get)(':roomId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages for a specific chat room' }),
    (0, swagger_1.ApiParam)({ name: 'roomId', description: 'ID of the chat room', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved chat messages.', type: [client_1.ChatMessage] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error.' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map