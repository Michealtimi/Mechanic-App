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
var ChatGateway_1;
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_auth_guard_1 = require("../auth/guards/ws-auth.guard");
const chat_service_1 = require("./chat.service");
const initiate_chat_dto_1 = require("./dto/initiate-chat.dto");
const send_message_dto_1 = require("./dto/send-message.dto");
const authenticated_socket_interface_1 = require("../auth/interfaces/authenticated-socket.interface");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handleConnection(client) {
        this.logger.log(`Client connected: ${client.id} (User: ${client.data.user.id})`);
        client.join(`user:${client.data.user.id}`);
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id} (User: ${client.data.user.id})`);
    }
    async initiateChat(dto, client) {
        const customerId = client.data.user.id;
        try {
            const room = await this.chatService.getOrCreateRoom(customerId, dto.mechanicId, dto.bookingId);
            const initialMessage = await this.chatService.saveMessage(room.id, customerId, dto.initialMessage);
            client.emit('chatInitiated', { roomId: room.id, initialMessage });
            this.server.to(`user:${dto.mechanicId}`).emit('newChatRequest', {
                roomId: room.id,
                senderId: customerId,
                message: initialMessage,
            });
            this.logger.log(`User ${customerId} initiated/joined room ${room.id} with mechanic ${dto.mechanicId}`);
            return { roomId: room.id, initialMessage };
        }
        catch (error) {
            this.logger.error(`Failed to initiate chat for ${customerId}: ${error.message}`, error.stack);
            client.emit('chatError', { message: error.message || 'Failed to initiate chat' });
        }
    }
    async sendMessage(dto, client) {
        const senderId = client.data.user.id;
        try {
            const message = await this.chatService.saveMessage(dto.roomId, senderId, dto.message);
            this.server.to(dto.roomId).emit('newMessage', message);
            this.logger.verbose(`Message sent in room ${dto.roomId} by ${senderId}`);
            return { success: true, message };
        }
        catch (error) {
            this.logger.error(`Failed to send message in room ${dto.roomId} by ${senderId}: ${error.message}`, error.stack);
            client.emit('chatError', { message: error.message || 'Failed to send message' });
        }
    }
    async joinRoom(roomId, client) {
        const room = await this.chatService.getChatRoomById(roomId);
        if (!room || (room.customerId !== client.data.user.id && room.mechanicId !== client.data.user.id)) {
            throw new UnauthorizedException('You are not authorized to join this chat room.');
        }
        client.join(roomId);
        this.logger.log(`User ${client.data.user.id} joined room ${roomId}`);
        client.emit('roomJoined', { roomId });
    }
    async getChatHistory(roomId, client) {
        const room = await this.chatService.getChatRoomById(roomId);
        if (!room || (room.customerId !== client.data.user.id && room.mechanicId !== client.data.user.id)) {
            throw new UnauthorizedException('You are not authorized to view this chat history.');
        }
        try {
            const messages = await this.chatService.getMessages(roomId);
            client.emit('chatHistory', { roomId, messages });
            return { roomId, messages };
        }
        catch (error) {
            this.logger.error(`Failed to get history for room ${roomId}: ${error.message}`, error.stack);
            client.emit('chatError', { message: error.message || 'Failed to get chat history' });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDisconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('initiateChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof initiate_chat_dto_1.InitiateChatDto !== "undefined" && initiate_chat_dto_1.InitiateChatDto) === "function" ? _c : Object, typeof (_d = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "initiateChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof send_message_dto_1.SendMessageDto !== "undefined" && send_message_dto_1.SendMessageDto) === "function" ? _e : Object, typeof (_f = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "sendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getChatHistory'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof authenticated_socket_interface_1.AuthenticatedSocket !== "undefined" && authenticated_socket_interface_1.AuthenticatedSocket) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "getChatHistory", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/chat'
    }),
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map