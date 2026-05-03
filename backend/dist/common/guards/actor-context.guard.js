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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActorContextGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
const store_service_1 = require("../../store/store.service");
const entities_1 = require("../../store/entities");
let ActorContextGuard = class ActorContextGuard {
    constructor(reflector, storeService) {
        this.reflector = reflector;
        this.storeService = storeService;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const roleHeader = this.normalizeRoleHeader(String(request.headers['x-role'] || ''));
        const actorId = String(request.headers['x-actor-id'] || '').trim();
        if (!roleHeader) {
            throw new common_1.ForbiddenException('Invalid or missing x-role header.');
        }
        if (!actorId) {
            throw new common_1.BadRequestException('Missing x-actor-id header.');
        }
        const user = this.storeService.findUserById(actorId);
        if (!user) {
            throw new common_1.ForbiddenException('Unknown actor context.');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('This actor account is not active.');
        }
        if (user.role !== roleHeader) {
            throw new common_1.ForbiddenException('x-role does not match actor.');
        }
        request.actor = {
            id: user.id,
            role: user.role,
            user,
        };
        return true;
    }
    normalizeRoleHeader(value) {
        const normalized = String(value || '').trim().toLowerCase();
        const roleMap = {
            customer: entities_1.Role.CUSTOMER,
            'service provider': entities_1.Role.PROVIDER,
            provider: entities_1.Role.PROVIDER,
            arbitrator: entities_1.Role.ARBITRATOR,
            admin: entities_1.Role.ADMIN,
        };
        return roleMap[normalized] || null;
    }
};
exports.ActorContextGuard = ActorContextGuard;
exports.ActorContextGuard = ActorContextGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        store_service_1.StoreService])
], ActorContextGuard);
//# sourceMappingURL=actor-context.guard.js.map