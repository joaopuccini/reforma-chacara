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
  async handleWebChat(@Body() body: { text?: string; mediaData?: { mimeType: string; base64: string } }) {
    if (!body.text && !body.mediaData) {
      return { reply: "Por favor, envie um texto ou uma imagem." };
    }
    const extraInstruction = body.mediaData ? (body.text ? undefined : "Analise esta foto de nota/recibo para cadastrar como novo gasto ou atualizar um existente.") : undefined;
    const reply = await this.telegramService.processCommand(body.text, body.mediaData, extraInstruction);
    return { reply };
  }

  @Post('setup-webhook')
  async setupWebhook(@Body() body: { baseUrl: string }) {
    if (!body.baseUrl) {
      return { error: 'Por favor, forneça a baseUrl (ex: https://reforma-chacara-api.onrender.com)' };
    }
    const result = await this.telegramService.registerWebhook(body.baseUrl);
    return result;
  }
}
