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
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const entities_1 = require("../store/entities");
const store_service_1 = require("../store/store.service");
class CreateBookingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "serviceId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "address", void 0);
class UpdateBookingDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.BookingStatus),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "cancellationReason", void 0);
let BookingsService = class BookingsService {
    constructor(storeService) {
        this.storeService = storeService;
    }
    listBookings(actor, filters) {
        return this.storeService.listBookings(actor, filters);
    }
    getBooking(actor, bookingId) {
        return this.storeService.getBooking(actor, bookingId);
    }
    createBooking(actor, payload) {
        return this.storeService.createBooking(actor, payload);
    }
    updateBooking(actor, bookingId, payload) {
        return this.storeService.updateBooking(actor, bookingId, payload);
    }
    runWorkflowCleanup(actor) {
        return this.storeService.runWorkflowCleanup(actor);
    }
};
BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], BookingsService);
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    listBookings(req, status, serviceId, caseLinked) {
        return {
            data: this.bookingsService.listBookings(req.actor, {
                status,
                serviceId,
                caseLinked: caseLinked === undefined ? undefined : caseLinked === 'true',
            }),
        };
    }
    getBooking(req, id) {
        return {
            data: this.bookingsService.getBooking(req.actor, id),
        };
    }
    createBooking(req, payload) {
        return {
            data: this.bookingsService.createBooking(req.actor, payload),
            message: 'Booking created successfully.',
        };
    }
    runWorkflowCleanup(req) {
        return {
            data: this.bookingsService.runWorkflowCleanup(req.actor),
            message: 'Workflow cleanup completed.',
        };
    }
    updateBooking(req, id, payload) {
        return {
            data: this.bookingsService.updateBooking(req.actor, id, payload),
            message: 'Booking updated successfully.',
        };
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('serviceId')),
    __param(3, (0, common_1.Query)('caseLinked')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getBooking", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.CUSTOMER),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, roles_decorator_1.Roles)(entities_1.Role.ADMIN),
    (0, common_1.Post)('workflow-cleanup'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "runWorkflowCleanup", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateBooking", null);
BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [BookingsService])
], BookingsController);
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        controllers: [BookingsController],
        providers: [BookingsService],
    })
], BookingsModule);
//# sourceMappingURL=bookings.module.js.map