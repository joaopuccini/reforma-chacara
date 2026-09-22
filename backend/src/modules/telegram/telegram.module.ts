import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { GeminiParserService } from './services/gemini-parser.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { PlanningModule } from '../planning/planning.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ExpensesModule, PlanningModule, DatabaseModule],
  controllers: [TelegramController],
  providers: [TelegramService, GeminiParserService],
})
export class TelegramModule {}
