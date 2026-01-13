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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
const booking_dto_1 = require("./dto/booking.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("src/auth/guards/roles.guard");
const roles_decorator_1 = require("src/auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
let BookingController = class BookingController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createBooking(createBookingDto, req) {
        const customerId = req.user.id;
        const { booking, payment } = await this.bookingService.createBooking(createBookingDto, customerId);
        return (0, class_transformer_1.plainToInstance)(booking_dto_1.BookingResponseDto, booking, { excludeExtraneousValues: true });
    }
    async getAllBookings(req, filterDto) {
        const userId = req.user.id;
        const { data, meta } = await this.bookingService.getAllBookings(userId, filterDto);
        return {
            data: (0, class_transformer_1.plainToInstance)(booking_dto_1.BookingResponseDto, data, { excludeExtraneousValues: true }),
            meta,
        };
    }
    async getBookingById(id, req) {
        const userId = req.user.id;
        const booking = await this.bookingService.getBookingById(id, userId);
        return (0, class_transformer_1.plainToInstance)(booking_dto_1.BookingResponseDto, booking, { excludeExtraneousValues: true });
    }
    async updateBookingStatus(id, updateBookingStatusDto, req) {
        const mechanicId = req.user.id;
        const updatedBooking = await this.bookingService.updateBookingStatus(id, updateBookingStatusDto, mechanicId);
        return (0, class_transformer_1.plainToInstance)(booking_dto_1.BookingResponseDto, updatedBooking, { excludeExtraneousValues: true });
    }
    async cancelBooking(id, req) {
        const customerId = req.user.id;
        const cancelledBooking = await this.bookingService.cancelBooking(id, customerId);
        return (0, class_transformer_1.plainToInstance)(booking_dto_1.BookingResponseDto, cancelledBooking, { excludeExtraneousValues: true });
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, booking_dto_1.BookingFilterDto]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.MECHANIC),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.UpdateBookingStatusDto, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "cancelBooking", null);
exports.BookingController = BookingController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map