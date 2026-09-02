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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ExpensesModule,
    TelegramModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
