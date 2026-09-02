import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { GeminiParserService } from './services/gemini-parser.service';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [ExpensesModule],
  controllers: [TelegramController],
  providers: [TelegramService, GeminiParserService],
})
export class TelegramModule {}
