"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicModule = void 0;
const common_1 = require("@nestjs/common");
const mechanic_controller_1 = require("./mechanic.controller");
const mechanic_service_1 = require("./mechanic.service");
const users_module_1 = require("../users/users.module");
let MechanicModule = class MechanicModule {
};
exports.MechanicModule = MechanicModule;
exports.MechanicModule = MechanicModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule],
        controllers: [mechanic_controller_1.MechanicController],
        providers: [mechanic_service_1.MechanicService],
    })
], MechanicModule);
//# sourceMappingURL=mechanic.module.js.map