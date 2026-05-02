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
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const store_service_1 = require("../store/store.service");
class UpdateNotificationDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationDto.prototype, "read", void 0);
class BulkUpdateNotificationsDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkUpdateNotificationsDto.prototype, "read", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkUpdateNotificationsDto.prototype, "ids", void 0);
let NotificationsService = class NotificationsService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    listNotifications(actor) {
        return this.storeService.listNotifications(actor);
    }
    updateNotification(actor, notificationId, payload) {
        return this.storeService.updateNotification(actor, notificationId, payload.read);
    }
    bulkUpdateNotifications(actor, payload) {
        return this.storeService.bulkUpdateNotifications(actor, payload.read, payload.ids);
    }
};
NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], NotificationsService);
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    listNotifications(req) {
        return {
            data: this.notificationsService.listNotifications(req.actor),
        };
    }
    updateNotification(req, id, payload) {
        return {
            data: this.notificationsService.updateNotification(req.actor, id, payload),
            message: 'Notification updated successfully.',
        };
    }
    bulkUpdateNotifications(req, payload) {
        return {
            data: this.notificationsService.bulkUpdateNotifications(req.actor, payload),
            message: 'Notifications updated successfully.',
        };
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "listNotifications", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateNotificationDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "updateNotification", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, BulkUpdateNotificationsDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "bulkUpdateNotifications", null);
NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [NotificationsService])
], NotificationsController);
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        controllers: [NotificationsController],
        providers: [NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map