import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ExpensesModule, DatabaseModule],
  providers: [CronService],
})
export class CronModule {}
