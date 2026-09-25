import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { CronModule } from './modules/cron/cron.module';
import { PlanningModule } from './modules/planning/planning.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    DatabaseModule,
    AuthModule,
    ExpensesModule,
    TelegramModule,
    CronModule,
    PlanningModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
