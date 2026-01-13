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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingController = void 0;
const common_1 = require("@nestjs/common");
const rating_service_1 = require("./rating.service");
const create_rating_dto_1 = require("./dto/create-rating.dto");
const jwt_guard_1 = require("src/auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const user_request_interface_1 = require("src/common/interfaces/user-request.interface");
let RatingController = class RatingController {
    ratingService;
    constructor(ratingService) {
        this.ratingService = ratingService;
    }
    async rate(req, dto) {
        const customerId = req.user.id;
        return this.ratingService.createRating(dto, customerId);
    }
    async list(id, page = 1, pageSize = 10) {
        return this.ratingService.listMechanicRatings(id, page, pageSize);
    }
};
exports.RatingController = RatingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new rating and review for a mechanic after a completed booking.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof user_request_interface_1.UserRequest !== "undefined" && user_request_interface_1.UserRequest) === "function" ? _a : Object, typeof (_b = typeof create_rating_dto_1.CreateRatingDto !== "undefined" && create_rating_dto_1.CreateRatingDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], RatingController.prototype, "rate", null);
__decorate([
    (0, common_1.Get)('mechanic/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a paginated list of all reviews for a specific mechanic.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'The UUID of the Mechanic whose ratings are being requested.', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 10)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], RatingController.prototype, "list", null);
exports.RatingController = RatingController = __decorate([
    (0, swagger_1.ApiTags)('Rating'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ratings'),
    __metadata("design:paramtypes", [rating_service_1.RatingService])
], RatingController);
//# sourceMappingURL=rating.controller.js.map