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
exports.IntakeModule = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const store_service_1 = require("../store/store.service");
const HUMAN_NAME_PATTERN = /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/;
const HUMAN_NAME_MESSAGE = 'Name must contain letters only, with optional spaces, apostrophes, periods, or hyphens.';
class CreateJobRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], CreateJobRequestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateJobRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateJobRequestDto.prototype, "serviceCategory", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], CreateJobRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateJobRequestDto.prototype, "budget", void 0);
class CreateContactMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], CreateContactMessageDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateContactMessageDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactMessageDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateContactMessageDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], CreateContactMessageDto.prototype, "message", void 0);
class CreateWaitlistEntryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], CreateWaitlistEntryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateWaitlistEntryDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateWaitlistEntryDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWaitlistEntryDto.prototype, "serviceCategory", void 0);
let IntakeService = class IntakeService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    createJobRequest(payload) {
        return this.storeService.createJobRequest(payload);
    }
    createContactMessage(payload) {
        return this.storeService.createContactMessage(payload);
    }
    createWaitlistEntry(payload) {
        return this.storeService.createWaitlistEntry(payload);
    }
};
IntakeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], IntakeService);
let IntakeController = class IntakeController {
    constructor(intakeService) {
        this.intakeService = intakeService;
    }
    createJobRequest(payload) {
        return {
            data: this.intakeService.createJobRequest(payload),
            message: 'Job request submitted successfully.',
        };
    }
    createContactMessage(payload) {
        return {
            data: this.intakeService.createContactMessage(payload),
            message: 'Contact message submitted successfully.',
        };
    }
    createWaitlistEntry(payload) {
        return {
            data: this.intakeService.createWaitlistEntry(payload),
            message: 'Waitlist entry submitted successfully.',
        };
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('job-requests'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateJobRequestDto]),
    __metadata("design:returntype", void 0)
], IntakeController.prototype, "createJobRequest", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('contact-messages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateContactMessageDto]),
    __metadata("design:returntype", void 0)
], IntakeController.prototype, "createContactMessage", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('waitlist'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWaitlistEntryDto]),
    __metadata("design:returntype", void 0)
], IntakeController.prototype, "createWaitlistEntry", null);
IntakeController = __decorate([
    (0, common_1.Controller)('intake'),
    __metadata("design:paramtypes", [IntakeService])
], IntakeController);
let IntakeModule = class IntakeModule {
};
exports.IntakeModule = IntakeModule;
exports.IntakeModule = IntakeModule = __decorate([
    (0, common_1.Module)({
        controllers: [IntakeController],
        providers: [IntakeService],
    })
], IntakeModule);
//# sourceMappingURL=intake.module.js.map