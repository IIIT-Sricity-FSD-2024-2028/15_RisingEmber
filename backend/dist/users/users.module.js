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
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
const HUMAN_NAME_PATTERN = /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/;
const HUMAN_NAME_MESSAGE = 'Name must contain letters only, with optional spaces, apostrophes, periods, or hyphens.';
class RegisterCustomerDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterCustomerDto.prototype, "preferredCategories", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], RegisterCustomerDto.prototype, "bio", void 0);
class RegisterProviderDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "businessName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "serviceArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "experienceLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "bio", void 0);
class ApplyArbitratorDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "specialization", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ApplyArbitratorDto.prototype, "experienceYears", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ApplyArbitratorDto.prototype, "bio", void 0);
class UpdateMeDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.Matches)(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE }),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateMeDto.prototype, "preferredCategories", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "businessName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "serviceArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "experienceLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateMeDto.prototype, "experienceYears", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "title", void 0);
class UpdateUserDto extends UpdateMeDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.ApplicationStatus),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "approvalStatus", void 0);
let UsersService = class UsersService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    registerCustomer(payload) {
        return this.storeService.registerCustomer(payload);
    }
    registerProvider(payload) {
        return this.storeService.registerProvider(payload);
    }
    applyArbitrator(payload) {
        return this.storeService.applyArbitrator(payload);
    }
    getMe(actor) {
        return this.storeService.getMe(actor);
    }
    listUsers(actor, role, q) {
        return this.storeService.listUsers(actor, { role, q });
    }
    updateMe(actor, payload) {
        return this.storeService.updateMe(actor, payload);
    }
    updateUser(actor, userId, payload) {
        return this.storeService.updateUser(actor, userId, payload);
    }
};
UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], UsersService);
let CustomersController = class CustomersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    register(payload) {
        return {
            data: this.usersService.registerCustomer(payload),
            message: 'Customer registered successfully.',
        };
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "register", null);
CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [UsersService])
], CustomersController);
let ProvidersController = class ProvidersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    register(payload) {
        return {
            data: this.usersService.registerProvider(payload),
            message: 'Provider registered successfully.',
        };
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterProviderDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "register", null);
ProvidersController = __decorate([
    (0, common_1.Controller)('providers'),
    __metadata("design:paramtypes", [UsersService])
], ProvidersController);
let ArbitratorsController = class ArbitratorsController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    apply(payload) {
        return {
            data: this.usersService.applyArbitrator(payload),
            message: 'Arbitrator application received.',
        };
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('applications'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ApplyArbitratorDto]),
    __metadata("design:returntype", void 0)
], ArbitratorsController.prototype, "apply", null);
ArbitratorsController = __decorate([
    (0, common_1.Controller)('arbitrators'),
    __metadata("design:paramtypes", [UsersService])
], ArbitratorsController);
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMe(req) {
        return {
            data: this.usersService.getMe(req.actor),
        };
    }
    updateMe(req, payload) {
        return {
            data: this.usersService.updateMe(req.actor, payload),
            message: 'Profile updated successfully.',
        };
    }
    listUsers(req, role, q) {
        return {
            data: this.usersService.listUsers(req.actor, role, q),
        };
    }
    updateUser(req, userId, payload) {
        return {
            data: this.usersService.updateUser(req.actor, userId, payload),
            message: 'User updated successfully.',
        };
    }
};
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateMeDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUser", null);
UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        controllers: [CustomersController, ProvidersController, ArbitratorsController, UsersController],
        providers: [UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map