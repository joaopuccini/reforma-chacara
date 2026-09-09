import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeminiParserService {
  private readonly logger = new Logger(GeminiParserService.name);

  constructor(private configService: ConfigService) {}

  async parse(geminiParts: any[], sheetContext: string): Promise<any> {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    const models = this.configService.get<string[]>('gemini.preferredModels');

    const systemPrompt = `Você é o assistente financeiro pessoal da reforma da chácara do João e Fofo.
Você tem acesso aos dados atuais da base e deve decidir qual ação executar com base na mensagem do usuário.

${sheetContext}

REGRAS DE CLASSIFICAÇÃO DE AÇÃO:
1. "QUERY": O usuário está fazendo uma pergunta, pedindo resumo, soma ou consulta sobre os gastos.
   - Responda de forma clara, amigável e direta em Markdown no campo "reply". Calcule os valores usando a tabela acima.
2. "INSERT": O usuário informou uma nova compra/despesa para adicionar (por texto, áudio ou com foto de recibo).
   - Preencha o objeto "data" com os campos financeiros. Se enviou foto, extraia os valores visíveis da nota.
3. "UPDATE": O usuário quer alterar/corrigir um gasto, ou anexou um comprovante (foto) para um gasto que JÁ EXISTE.
   - Se for um comprovante para uma compra listada acima, identifique o "id" exato e retorne a ação "UPDATE". Retorne apenas o "id".
4. "DELETE": O usuário quer apagar um item ou a última compra.
   - Identifique o "id" exato.

REGRAS DE EXTRAÇÃO PARA INSERT/UPDATE:
- Origem do Pagamento obrigatória: 'PIX', 'DINHEIRO', 'CARTAO_CREDITO_JOAO', 'CARTAO_PRETO_CREDITO_FOFO'
- Responsável obrigatório: 'João' ou 'Fofo'. (Ex: Se usou cartão do João, responsável é João. Se pagou no PIX, descubra quem fez o PIX). Se não estiver explícito, pergunte ou deduza do contexto.
- Categorias válidas: "Mão de Obra", "Material para a Casa", "Material de Apoio", "Serviços e Locações".
- Etapa obrigatória: Tente deduzir a qual etapa/projeto da reforma essa despesa pertence (Ex: "Reforma do Forro", "Parte Elétrica", "Parte Hidráulica"). Se não souber, use "Reforma do Forro".
- Parcelas: Apenas o NÚMERO TOTAL de parcelas. Ex: 5 (para 5x), 1 (para à vista).

JSON SCHEMA DE RETORNO OBRIGATÓRIO:
{
  "action": "QUERY" | "INSERT" | "UPDATE" | "DELETE",
  "id": "uuid-string (para UPDATE/DELETE apenas)",
  "reply": "Texto de resposta ou confirmação para o Telegram",
  "data": {
    "descricao": "string",
    "categoria": "string",
    "subcategoria": "string",
    "etapa": "string",
    "valor_bruto": 0.0,
    "desconto": 0.0,
    "valor_final": 0.0,
    "origem_pagamento": "PIX" | "DINHEIRO" | "CARTAO_CREDITO_JOAO" | "CARTAO_PRETO_CREDITO_FOFO",
    "responsavel": "João" | "Fofo",
    "parcelas_total": 1,
    "link_comprovante": "—",
    "observacoes": "string"
  }
}`;

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: geminiParts }],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    let lastError: any = null;
    
    if (!models || models.length === 0) throw new Error("Modelos não configurados.");
    
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent`;
        const response = await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          }
        });

        const raw = response.data.candidates[0].content.parts[0].text;
        return JSON.parse(raw);
      } catch (error: any) {
        this.logger.warn(`Falha ao processar com modelo ${model}: ${error.message}`);
        lastError = error;
      }
    }

    throw new Error(lastError?.message || "Falha ao processar comando com IA em todos os modelos.");
  }
}
