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
exports.CasesModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
class CreateCaseDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)({ low: 'low', medium: 'medium', high: 'high' }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "priority", void 0);
class UpdateCaseDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.CaseStatus),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "arbitratorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "resolutionSummary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)({ low: 'low', medium: 'medium', high: 'high' }),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "priority", void 0);
class UpdateCaseMessageDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCaseMessageDto.prototype, "flagged", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCaseMessageDto.prototype, "reviewed", void 0);
let CasesService = class CasesService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    listCases(actor, filters) {
        return this.storeService.listCases(actor, filters);
    }
    getCase(actor, caseId) {
        return this.storeService.getCase(actor, caseId);
    }
    createCase(actor, payload) {
        return this.storeService.createCase(actor, payload);
    }
    updateCase(actor, caseId, payload) {
        return this.storeService.updateCase(actor, caseId, payload);
    }
    updateCaseMessage(actor, caseId, messageId, payload) {
        return this.storeService.updateCaseMessage(actor, caseId, messageId, payload);
    }
    deleteCaseMessage(actor, caseId, messageId) {
        return this.storeService.deleteCaseMessage(actor, caseId, messageId);
    }
};
CasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], CasesService);
let CasesController = class CasesController {
    constructor(casesService) {
        this.casesService = casesService;
    }
    listCases(req, status, bookingId, arbitratorId) {
        return {
            data: this.casesService.listCases(req.actor, { status, bookingId, arbitratorId }),
        };
    }
    getCase(req, id) {
        return {
            data: this.casesService.getCase(req.actor, id),
        };
    }
    createCase(req, payload) {
        return {
            data: this.casesService.createCase(req.actor, payload),
            message: 'Case created successfully.',
        };
    }
    updateCase(req, id, payload) {
        return {
            data: this.casesService.updateCase(req.actor, id, payload),
            message: 'Case updated successfully.',
        };
    }
    updateCaseMessage(req, id, messageId, payload) {
        return {
            data: this.casesService.updateCaseMessage(req.actor, id, messageId, payload),
            message: 'Case message updated successfully.',
        };
    }
    deleteCaseMessage(req, id, messageId) {
        return {
            data: this.casesService.deleteCaseMessage(req.actor, id, messageId),
            message: 'Case message deleted successfully.',
        };
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('bookingId')),
    __param(3, (0, common_1.Query)('arbitratorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "listCases", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "getCase", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateCaseDto]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "createCase", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateCaseDto]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "updateCase", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Patch)(':id/messages/:messageId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, UpdateCaseMessageDto]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "updateCaseMessage", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Delete)(':id/messages/:messageId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "deleteCaseMessage", null);
CasesController = __decorate([
    (0, common_1.Controller)('cases'),
    __metadata("design:paramtypes", [CasesService])
], CasesController);
let CasesModule = class CasesModule {
};
exports.CasesModule = CasesModule;
exports.CasesModule = CasesModule = __decorate([
    (0, common_1.Module)({
        controllers: [CasesController],
        providers: [CasesService],
    })
], CasesModule);
//# sourceMappingURL=cases.module.js.map