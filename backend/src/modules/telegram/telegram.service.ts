import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpensesService } from '../expenses/expenses.service';
import { PlanningService } from '../planning/planning.service';
import { SupabaseService } from '../database/supabase.service';
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
    private planningService: PlanningService,
    private supabaseService: SupabaseService,
    private geminiParser: GeminiParserService,
  ) {
    this.botToken = this.configService.get<string>('telegram.botToken') as string;
  }

  async registerWebhook(baseUrl: string) {
    const secretToken = this.configService.get<string>('telegram.webhookSecret');
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/telegram/webhook`;
    
    try {
      const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        url: webhookUrl,
        secret_token: secretToken
      });
      
      this.logger.log(`Webhook registrado com sucesso: ${webhookUrl}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Erro ao registrar webhook: ${error.message}`);
      throw error;
    }
  }

  async handleWebhook(update: TelegramUpdateDto) {
    const updateId = update.update_id;

    // Idempotency check: prevent processing duplicate webhook retries from Telegram
    if (updateId) {
      try {
        const client = this.supabaseService.getClient();
        const { error } = await client.from('telegram_updates').insert([{ update_id: updateId }]);
        if (error) {
          if (error.code === '23505') { // Unique violation
            this.logger.warn(`Idempotency: ignorando update duplicado ${updateId}`);
            return;
          } else {
            this.logger.error(`Idempotency table error (pode estar faltando a tabela): ${error.message}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Erro ao verificar idempotência: ${err.message}`);
      }
    }

    if (!update.message) return;
    
    const msg = update.message;
    const chatId = msg.chat.id;

    if (msg.text && (msg.text === '/start' || msg.text.toLowerCase() === 'ajuda')) {
      const helpMsg = "🏡 *Assistente Financeiro da Chácara*\n\n" +
        "Você pode interagir por texto ou áudio livremente:\n\n" +
        "➕ *Cadastrar (Realizado):* `Comprei 5 sacos de areia...`\n" +
        "🔮 *Planejar (Orçamento):* `/planejar Orçamento de tinta 500 reais`\n" +
        "📊 *Consultar:* `Quanto já gastamos até agora?`\n" +
        "✏️ *Editar:* `Altera o valor das latas...`\n" +
        "🗑️ *Excluir:* `Exclui o último gasto`";
      await this.sendMessage(chatId, helpMsg);
      return;
    }

    try {
      await this.sendMessage(chatId, "⏳ *Processando com IA...*");

      let text = msg.text;
      let mediaData: { mimeType: string, base64: string } | undefined;
      let extraInstruction: string | undefined;

      if (msg.voice || msg.audio) {
        const media = msg.voice || msg.audio;
        if (media) {
          const fileBase64 = await this.downloadTelegramBlob(media.file_id);
          mediaData = { mimeType: media.mime_type || "audio/ogg", base64: fileBase64 };
          extraInstruction = "Analise o comando de áudio do usuário e execute a ação correta.";
        }
      } else if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileBase64 = await this.downloadTelegramBlob(fileId);
        mediaData = { mimeType: "image/jpeg", base64: fileBase64 };
        const legenda = msg.caption ? ` Legenda informada: "${msg.caption}"` : "";
        extraInstruction = "Analise esta foto de nota/recibo para cadastrar como novo gasto ou atualizar um existente." + legenda;
      } else if (!msg.text) {
        await this.sendMessage(chatId, "⚠️ Formato não reconhecido. Envie texto, foto ou áudio.");
        return;
      }

      const reply = await this.processCommand(text, mediaData, extraInstruction);
      await this.sendMessage(chatId, reply);
    } catch (err: any) {
      this.logger.error(`Erro ao processar webhook: ${err.message}`);
      await this.sendMessage(chatId, "❌ Erro ao processar: " + err.message);
    }
  }

  async processCommand(text?: string, mediaData?: { mimeType: string, base64: string }, extraInstruction?: string): Promise<string> {
    try {
      // Obter as despesas recentes para contexto
      const { data: recentExpenses } = await this.expensesService.findAll({ limit: 15 });
      let sheetContext = "DADOS ATUAIS DA BASE (ID | Descrição | Categoria | Valor Parcela | Status | Origem | Resp. | Parcela | Vencimento):\n";
      
      recentExpenses.forEach(r => {
        sheetContext += `[ID: ${r.id}] ${r.descricao} (${r.categoria}) | R$ ${Number(r.valor_parcela).toFixed(2)} | Status: ${r.status} | Origem: ${r.origem_pagamento} | Resp: ${r.responsavel} | Parcela: ${r.parcela_numero}/${r.parcelas_total} | Venc: ${r.data_vencimento || '—'}\n`;
      });

      let geminiParts = [];

      if (text) {
        geminiParts.push({ text: `Mensagem do usuário: "${text}"` });
      }
      
      if (mediaData) {
        geminiParts.push({
          inlineData: {
            mimeType: mediaData.mimeType,
            data: mediaData.base64
          }
        });
        if (extraInstruction) geminiParts.push({ text: extraInstruction });
      }
      
      if (geminiParts.length === 0) {
        return "⚠️ Não consegui entender o comando fornecido.";
      }

      const decision = await this.geminiParser.parse(geminiParts, sheetContext);

      // Routing baseado no domínio
      if (decision.domain === 'PLANNING') {
        const response = await this.planningService.processTelegramCommand(decision);
        return decision.reply || `🔮 *${response.message}*`;
      }

      // Lógica existente de Despesas (REALIZED)
      let uploadedUrl: string | undefined;
      const isImage = mediaData && mediaData.mimeType.startsWith('image/');
      if ((decision.action === 'INSERT' || decision.action === 'UPDATE') && isImage) {
        try {
          const buffer = Buffer.from(mediaData.base64, 'base64');
          const ext = mediaData.mimeType.split('/')[1] || 'jpg';
          const fileName = `receipt-${Date.now()}.${ext}`;
          uploadedUrl = await this.expensesService.uploadBuffer(fileName, buffer, mediaData.mimeType);
        } catch (e: any) {
          this.logger.error("Erro ao subir imagem pro supabase: " + e.message);
        }
      }

      if (decision.action === 'INSERT') {
        const d = decision.data || {};
        await this.expensesService.create({
          descricao: d.descricao || 'Despesa identificada por IA',
          categoria: d.categoria || 'Material para a Casa',
          subcategoria: d.subcategoria || 'Geral',
          valor_bruto: Number(d.valor_bruto || d.valor_final || 0),
          desconto: Number(d.desconto || 0),
          valor_final: Number(d.valor_final || 0),
          origem_pagamento: d.origem_pagamento || 'PIX',
          responsavel: d.responsavel || 'João',
          parcelas_total: Number(d.parcelas_total || 1),
          link_comprovante: d.link_comprovante || '—',
          observacoes: d.observacoes || 'IA Assistant',
          ...(uploadedUrl ? { comprovante_url: uploadedUrl } : {})
        });
        return decision.reply || "✅ *Gasto registrado com sucesso!*";

      } else if (decision.action === 'DELETE') {
        if (decision.id) {
          await this.expensesService.remove(decision.id);
          return decision.reply || `🗑️ *Item excluído com sucesso!*`;
        } else {
          return "⚠️ Não encontrei o ID indicado para exclusão.";
        }

      } else if (decision.action === 'UPDATE') {
        if (decision.id) {
          const d = decision.data || {};
          await this.expensesService.update(decision.id, {
            ...d,
            observacoes: d.observacoes || 'Atualizado via IA',
            ...(uploadedUrl ? { comprovante_url: uploadedUrl } : {})
          });
          return decision.reply || `✏️ *Item atualizado com sucesso!*`;
        } else {
          return "⚠️ Não encontrei o item para atualizar.";
        }

      } else if (decision.action === 'QUERY') {
        return decision.reply || "Busca finalizada.";
      }
      
      return "⚠️ Nenhuma ação reconhecida pela IA.";
    } catch (err: any) {
      this.logger.error(`Erro no processCommand: ${err.message}`);
      return "❌ Erro ao processar: " + err.message;
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
    
    return Buffer.from(downloadRes.data).toString('base64');
  }
}
