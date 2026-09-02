import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpensesService } from '../expenses/expenses.service';
import { GeminiParserService } from './services/gemini-parser.service';
import { TelegramUpdateDto } from './dto/telegram-update.dto';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(
    private configService: ConfigService,
    private expensesService: ExpensesService,
    private geminiParser: GeminiParserService,
  ) {
    this.botToken = this.configService.get<string>('telegram.botToken') as string;
  }

  async handleWebhook(update: TelegramUpdateDto) {
    if (!update.message) return;
    
    const msg = update.message;
    const chatId = msg.chat.id;

    if (msg.text && (msg.text === '/start' || msg.text.toLowerCase() === 'ajuda')) {
      const helpMsg = "🏡 *Assistente Financeiro da Chácara*\n\n" +
        "Você pode interagir por texto ou áudio livremente:\n\n" +
        "➕ *Cadastrar:* `Comprei 5 sacos de areia por 80 reais pago pelo Joao` (ou envie áudio/foto)\n" +
        "📊 *Consultar:* `Quanto já gastamos até agora?`, `Quanto o Fofo pagou?`, `Quais gastos estão pendentes?`\n" +
        "✏️ *Editar:* `Altera o valor das latas de tinta para 180 reais pago 50/50`\n" +
        "🗑️ *Excluir:* `Exclui o último gasto` ou `Apaga a linha do cimento`";
      await this.sendMessage(chatId, helpMsg);
      return;
    }

    try {
      await this.sendMessage(chatId, "⏳ *Processando com IA...*");

      // Obter as despesas recentes para contexto
      const { data: recentExpenses } = await this.expensesService.findAll({ limit: 15 });
      let sheetContext = "DADOS ATUAIS DA BASE (ID | Descrição | Categoria | Valor Parcela | Status | Origem | Resp. | Parcela | Vencimento):\n";
      
      recentExpenses.forEach(r => {
        sheetContext += `[ID: ${r.id}] ${r.descricao} (${r.categoria}) | R$ ${Number(r.valor_parcela).toFixed(2)} | Status: ${r.status} | Origem: ${r.origem_pagamento} | Resp: ${r.responsavel} | Parcela: ${r.parcela_numero}/${r.parcelas_total} | Venc: ${r.data_vencimento || '—'}\n`;
      });

      let geminiParts = [];

      if (msg.voice || msg.audio) {
        const media = msg.voice || msg.audio;
        if (!media) return;
        const fileId = media.file_id;
        const fileBase64 = await this.downloadTelegramBlob(fileId);
        geminiParts.push({
          inlineData: {
            mimeType: media.mime_type || "audio/ogg",
            data: fileBase64
          }
        });
        geminiParts.push({ text: "Analise o comando de áudio do usuário e execute a ação correta." });
      } else if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileBase64 = await this.downloadTelegramBlob(fileId);
        geminiParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: fileBase64
          }
        });
        const legenda = msg.caption ? ` Legenda informada: "${msg.caption}"` : "";
        geminiParts.push({ text: "Analise esta foto de nota/recibo para cadastrar como novo gasto." + legenda });
      } else if (msg.text) {
        geminiParts.push({ text: `Mensagem do usuário: "${msg.text}"` });
      } else {
        await this.sendMessage(chatId, "⚠️ Formato não reconhecido. Envie texto, foto ou áudio.");
        return;
      }

      const decision = await this.geminiParser.parse(geminiParts, sheetContext);

      if (decision.action === 'INSERT') {
        const d = decision.data;
        await this.expensesService.create({
          descricao: d.descricao,
          categoria: d.categoria || 'Material para a Casa',
          subcategoria: d.subcategoria || 'Geral',
          valor_bruto: Number(d.valor_bruto || d.valor_final),
          desconto: Number(d.desconto || 0),
          valor_final: Number(d.valor_final),
          origem_pagamento: d.origem_pagamento || 'PIX',
          responsavel: d.responsavel || 'João',
          parcelas_total: Number(d.parcelas_total || 1),
          link_comprovante: d.link_comprovante || '—',
          observacoes: d.observacoes || 'Telegram IA',
        });
        await this.sendMessage(chatId, decision.reply || "✅ *Gasto registrado com sucesso!*");

      } else if (decision.action === 'DELETE') {
        if (decision.id) {
          await this.expensesService.remove(decision.id);
          await this.sendMessage(chatId, decision.reply || `🗑️ *Item excluído com sucesso!*`);
        } else {
          await this.sendMessage(chatId, "⚠️ Não encontrei o ID indicado para exclusão.");
        }

      } else if (decision.action === 'UPDATE') {
        if (decision.id) {
          const d = decision.data;
          await this.expensesService.update(decision.id, {
            ...d,
            observacoes: d.observacoes || 'Atualizado via Telegram'
          });
          await this.sendMessage(chatId, decision.reply || `✏️ *Item atualizado com sucesso!*`);
        } else {
          await this.sendMessage(chatId, "⚠️ Não encontrei o item para atualizar.");
        }

      } else if (decision.action === 'QUERY') {
        await this.sendMessage(chatId, decision.reply);
      }
    } catch (err: any) {
      this.logger.error(`Erro ao processar: ${err.message}`);
      await this.sendMessage(chatId, "❌ Erro ao processar: " + err.message);
    }
  }

  private async sendMessage(chatId: number, text: string) {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
    } catch (e: any) {
      this.logger.error('Erro envio Telegram: ' + e.message);
    }
  }

  private async downloadTelegramBlob(fileId: string): Promise<string> {
    const getFileUrl = `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`;
    const fileRes = await axios.get(getFileUrl);
    const filePath = fileRes.data.result.file_path;
    
    const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    
    return Buffer.from(downloadRes.data, 'binary').toString('base64');
  }
}
