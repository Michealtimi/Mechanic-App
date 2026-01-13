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
var AuditController_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const query_audit_dto_1 = require("./dto/query-audit.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["JSON"] = "json";
    ExportFormat["CSV"] = "csv";
})(ExportFormat || (ExportFormat = {}));
let AuditController = AuditController_1 = class AuditController {
    auditService;
    logger = new common_1.Logger(AuditController_1.name);
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(queryDto) {
        this.logger.debug(`Fetching all audit logs with query: ${JSON.stringify(queryDto)}`);
        return this.auditService.findAll(queryDto);
    }
    async findByEntity(entity, entityId) {
        this.logger.debug(`Fetching audit logs for entity: ${entity}, ID: ${entityId}`);
        return this.auditService.findByEntity(entity, entityId);
    }
    async getStatistics(startDate, endDate) {
        this.logger.debug(`Fetching audit log statistics from ${startDate} to ${endDate}`);
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.auditService.getStatistics(start, end);
    }
    async exportAuditLogs(queryDto, format = ExportFormat.JSON, res) {
        this.logger.debug(`Exporting audit logs in ${format} format with query: ${JSON.stringify(queryDto)}`);
        const exportData = await this.auditService.export(queryDto, format);
        if (format === ExportFormat.CSV) {
            res.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString()}.csv"`,
            });
            return exportData;
        }
        res.set({
            'Content-Type': 'application/json',
            'Content-Disposition': `inline; filename="audit_logs_${new Date().toISOString()}.json"`,
        });
        return exportData;
    }
    async findOne(id) {
        this.logger.debug(`Fetching audit log with ID: ${id}`);
        return this.auditService.findOne(id);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retrieve a list of audit logs' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'actor', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'entity', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, format: 'date-time' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, format: 'date-time' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof query_audit_dto_1.QueryAuditDto !== "undefined" && query_audit_dto_1.QueryAuditDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('entity/:entity/:entityId'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retrieve audit logs for a specific entity' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('entity')),
    __param(1, (0, common_1.Param)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findByEntity", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retrieve audit log statistics' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, format: 'date-time' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, format: 'date-time' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Export audit logs', content: {
            'application/json': { schema: { type: 'object' } },
            'text/csv': { schema: { type: 'string', format: 'binary' } }
        } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiQuery)({ name: 'format', enum: ExportFormat, required: false, description: 'Output format (json or csv)', default: ExportFormat.JSON }),
    (0, swagger_1.ApiQuery)({ name: 'actor', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'entity', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, format: 'date-time' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, format: 'date-time' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('format', new common_1.ParseEnumPipe(ExportFormat, { optional: true }))),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof query_audit_dto_1.QueryAuditDto !== "undefined" && query_audit_dto_1.QueryAuditDto) === "function" ? _b : Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retrieve a single audit log by ID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Audit log not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findOne", null);
exports.AuditController = AuditController = AuditController_1 = __decorate([
    (0, swagger_1.ApiTags)('Audit Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.HasRoles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.Controller)('audit-logs'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map