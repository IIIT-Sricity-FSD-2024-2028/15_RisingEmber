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
exports.HearingsModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
class CreateHearingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHearingDto.prototype, "caseId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateHearingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.HearingType),
    __metadata("design:type", String)
], CreateHearingDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateHearingDto.prototype, "agenda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateHearingDto.prototype, "notes", void 0);
class UpdateHearingDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateHearingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.HearingType),
    __metadata("design:type", String)
], UpdateHearingDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.HearingStatus),
    __metadata("design:type", String)
], UpdateHearingDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateHearingDto.prototype, "agenda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateHearingDto.prototype, "notes", void 0);
let HearingsService = class HearingsService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    listHearings(actor, filters) {
        return this.storeService.listHearings(actor, filters);
    }
    createHearing(actor, payload) {
        return this.storeService.createHearing(actor, payload);
    }
    updateHearing(actor, hearingId, payload) {
        return this.storeService.updateHearing(actor, hearingId, payload);
    }
    deleteHearing(actor, hearingId) {
        return this.storeService.deleteHearing(actor, hearingId);
    }
};
HearingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], HearingsService);
let HearingsController = class HearingsController {
    constructor(hearingsService) {
        this.hearingsService = hearingsService;
    }
    listHearings(req, caseId, status) {
        return {
            data: this.hearingsService.listHearings(req.actor, { caseId, status }),
        };
    }
    createHearing(req, payload) {
        return {
            data: this.hearingsService.createHearing(req.actor, payload),
            message: 'Hearing created successfully.',
        };
    }
    updateHearing(req, id, payload) {
        return {
            data: this.hearingsService.updateHearing(req.actor, id, payload),
            message: 'Hearing updated successfully.',
        };
    }
    deleteHearing(req, id) {
        return {
            data: this.hearingsService.deleteHearing(req.actor, id),
            message: 'Hearing deleted successfully.',
        };
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('caseId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "listHearings", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateHearingDto]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "createHearing", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateHearingDto]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "updateHearing", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "deleteHearing", null);
HearingsController = __decorate([
    (0, common_1.Controller)('hearings'),
    __metadata("design:paramtypes", [HearingsService])
], HearingsController);
let HearingsModule = class HearingsModule {
};
exports.HearingsModule = HearingsModule;
exports.HearingsModule = HearingsModule = __decorate([
    (0, common_1.Module)({
        controllers: [HearingsController],
        providers: [HearingsService],
    })
], HearingsModule);
//# sourceMappingURL=hearings.module.js.map