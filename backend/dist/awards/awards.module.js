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
exports.AwardsModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
class CreateAwardDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAwardDto.prototype, "caseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateAwardDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateAwardDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AwardStatus),
    __metadata("design:type", String)
], CreateAwardDto.prototype, "status", void 0);
class UpdateAwardDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], UpdateAwardDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateAwardDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.AwardStatus),
    __metadata("design:type", String)
], UpdateAwardDto.prototype, "status", void 0);
let AwardsService = class AwardsService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    listAwards(actor, filters) {
        return this.storeService.listAwards(actor, filters);
    }
    createAward(actor, payload) {
        return this.storeService.createAward(actor, payload);
    }
    updateAward(actor, awardId, payload) {
        return this.storeService.updateAward(actor, awardId, payload);
    }
};
AwardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], AwardsService);
let AwardsController = class AwardsController {
    constructor(awardsService) {
        this.awardsService = awardsService;
    }
    listAwards(req, caseId, status) {
        return {
            data: this.awardsService.listAwards(req.actor, { caseId, status }),
        };
    }
    createAward(req, payload) {
        return {
            data: this.awardsService.createAward(req.actor, payload),
            message: 'Award created successfully.',
        };
    }
    updateAward(req, id, payload) {
        return {
            data: this.awardsService.updateAward(req.actor, id, payload),
            message: 'Award updated successfully.',
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
], AwardsController.prototype, "listAwards", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateAwardDto]),
    __metadata("design:returntype", void 0)
], AwardsController.prototype, "createAward", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateAwardDto]),
    __metadata("design:returntype", void 0)
], AwardsController.prototype, "updateAward", null);
AwardsController = __decorate([
    (0, common_1.Controller)('awards'),
    __metadata("design:paramtypes", [AwardsService])
], AwardsController);
let AwardsModule = class AwardsModule {
};
exports.AwardsModule = AwardsModule;
exports.AwardsModule = AwardsModule = __decorate([
    (0, common_1.Module)({
        controllers: [AwardsController],
        providers: [AwardsService],
    })
], AwardsModule);
//# sourceMappingURL=awards.module.js.map