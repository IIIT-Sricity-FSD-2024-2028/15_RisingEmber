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
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
let DashboardService = class DashboardService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    getDashboard(actor) {
        return this.storeService.getDashboard(actor);
    }
};
DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], DashboardService);
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    customer(req) {
        return {
            data: this.dashboardService.getDashboard(req.actor),
        };
    }
    provider(req) {
        return {
            data: this.dashboardService.getDashboard(req.actor),
        };
    }
    admin(req) {
        return {
            data: this.dashboardService.getDashboard(req.actor),
        };
    }
    arbitrator(req) {
        return {
            data: this.dashboardService.getDashboard(req.actor),
        };
    }
};
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.CUSTOMER),
    (0, common_1.Get)('customer'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "customer", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.PROVIDER),
    (0, common_1.Get)('provider'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "provider", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Get)('admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "admin", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ARBITRATOR),
    (0, common_1.Get)('arbitrator'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "arbitrator", null);
DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [DashboardService])
], DashboardController);
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        controllers: [DashboardController],
        providers: [DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map