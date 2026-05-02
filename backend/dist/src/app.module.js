"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const common_module_1 = require("./common/common.module");
const store_module_1 = require("./store/store.module");
const session_module_1 = require("./session/session.module");
const users_module_1 = require("./users/users.module");
const services_module_1 = require("./services/services.module");
const bookings_module_1 = require("./bookings/bookings.module");
const cases_module_1 = require("./cases/cases.module");
const hearings_module_1 = require("./hearings/hearings.module");
const documents_module_1 = require("./documents/documents.module");
const awards_module_1 = require("./awards/awards.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const intake_module_1 = require("./intake/intake.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            common_module_1.CommonModule,
            store_module_1.StoreModule,
            session_module_1.SessionModule,
            users_module_1.UsersModule,
            services_module_1.ServicesModule,
            bookings_module_1.BookingsModule,
            cases_module_1.CasesModule,
            hearings_module_1.HearingsModule,
            documents_module_1.DocumentsModule,
            awards_module_1.AwardsModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
            intake_module_1.IntakeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map