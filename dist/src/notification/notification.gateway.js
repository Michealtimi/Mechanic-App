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
var NotificationGateway_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let NotificationGateway = NotificationGateway_1 = class NotificationGateway {
    server;
    logger = new common_1.Logger(NotificationGateway_1.name);
    connectedUsers = new Map();
    handleConnection(socket) {
        const token = socket.handshake.auth.token;
        try {
            const payload = this.jwtService.verify(token);
            const userId = payload.sub;
            this.connectedUsers.set(userId, socket.id);
            this.logger.log(`User connected (verified): ${userId}`);
        }
        catch (e) {
            this.logger.error('Unauthorized WebSocket connection attempt.');
            socket.disconnect();
        }
    }
    handleDisconnect(socket) {
        const userId = socket.userId;
        if (userId) {
            this.connectedUsers.delete(userId);
            this.logger.log(`User disconnected: ${userId}`);
        }
    }
    emitBookingCompleted(userId, bookingId) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('bookingCompleted', { bookingId });
        }
    }
    emitPaymentConfirmed(userId, amount) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('paymentConfirmed', { amount });
        }
    }
    emitBookingCancelled(mechanicId, bookingId) {
        const socketId = this.connectedUsers.get(mechanicId);
        if (socketId) {
            this.server.to(socketId).emit('bookingCancelled', { bookingId });
        }
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], NotificationGateway.prototype, "server", void 0);
exports.NotificationGateway = NotificationGateway = NotificationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true })
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map