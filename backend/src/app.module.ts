import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { StoreModule } from './store/store.module';
import { SessionModule } from './session/session.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { DocumentsModule } from './documents/documents.module';
import { AwardsModule } from './awards/awards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IntakeModule } from './intake/intake.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    CommonModule,
    StoreModule,
    SessionModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
    CasesModule,
    HearingsModule,
    DocumentsModule,
    AwardsModule,
    NotificationsModule,
    DashboardModule,
    IntakeModule,
    SettingsModule,
  ],
})
export class AppModule {}
