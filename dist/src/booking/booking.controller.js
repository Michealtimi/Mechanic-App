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
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const bookingresponse_dto_1 = require("./dto/bookingresponse.dto");
let BookingController = class BookingController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createBooking(req, dto) {
        const customerId = req.user.id;
        const booking = await this.bookingService.createBooking(dto, dto.serviceId, customerId);
        return booking;
    }
    async getMechanicBooking(req) {
        const id = req.user.id;
        return this.bookingService.getMechanicBooking(id);
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create mechanic service' }),
    (0, swagger_1.ApiResponse)({ type: bookingresponse_dto_1.bookingResponseDto, status: 201, description: 'Booking Created created successfully' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createBooking", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all mechanic services' }),
    (0, swagger_1.ApiResponse)({ type: [bookingresponse_dto_1.bookingResponseDto], status: 200, description: 'List of boookings' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getMechanicBooking", null);
exports.BookingController = BookingController = __decorate([
    (0, swagger_1.ApiTags)('booking'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, common_1.Controller)('booking'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map