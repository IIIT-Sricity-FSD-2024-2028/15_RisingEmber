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
exports.SessionModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const store_service_1 = require("../store/store.service");
const entities_1 = require("../store/entities");
class LoginDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.Role),
    __metadata("design:type", String)
], LoginDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ResetPasswordDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(entities_1.Role),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "identifier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
let SessionService = class SessionService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    login(payload) {
        return this.storeService.login(payload.role, payload.email, payload.password);
    }
    resetPassword(payload) {
        return this.storeService.resetPassword(payload.role, payload.identifier, payload.password);
    }
};
SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], SessionService);
let SessionController = class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    login(payload) {
        return {
            data: this.sessionService.login(payload),
            message: 'Login bootstrap successful.',
        };
    }
    resetPassword(payload) {
        return {
            data: this.sessionService.resetPassword(payload),
            message: 'Password reset successfully.',
        };
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('password-reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "resetPassword", null);
SessionController = __decorate([
    (0, common_1.Controller)('session'),
    __metadata("design:paramtypes", [SessionService])
], SessionController);
let SessionModule = class SessionModule {
};
exports.SessionModule = SessionModule;
exports.SessionModule = SessionModule = __decorate([
    (0, common_1.Module)({
        controllers: [SessionController],
        providers: [SessionService],
    })
], SessionModule);
//# sourceMappingURL=session.module.js.map