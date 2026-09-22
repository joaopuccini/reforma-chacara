import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdateDto } from './dto/telegram-update.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller('api/v1/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @UseGuards(ApiKeyGuard)
  async handleWebhook(@Body() update: TelegramUpdateDto) {
    // Processamento assíncrono para liberar o Telegram rapidamente
    this.telegramService.handleWebhook(update);
    return { status: 'OK' };
  }

  @Post('web-chat')
  async handleWebChat(@Body() body: { text: string }) {
    if (!body.text) {
      return { reply: "Por favor, envie um texto." };
    }
    const reply = await this.telegramService.processCommand(body.text);
    return { reply };
  }
}
