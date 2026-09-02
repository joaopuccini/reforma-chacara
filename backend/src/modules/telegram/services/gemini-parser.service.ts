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
   - Responda de forma clara, amigável e direta em Markdown no campo "reply". Calcule os valores exatos usando a tabela acima.
2. "INSERT": O usuário informou uma nova compra/despesa para adicionar.
   - Preencha o objeto "data" com os campos financeiros.
3. "UPDATE": O usuário quer alterar, corrigir ou editar um gasto existente.
   - Identifique o "id" exato da linha correspondente e retorne o objeto "data" com os valores atualizados.
4. "DELETE": O usuário quer apagar/excluir um item ou a última linha.
   - Identifique o "id" exato da linha a ser apagada.

REGRAS FINANCEIRAS PARA INSERT E UPDATE:
- Categorias válidas: "Mão de Obra", "Material para a Casa", "Material de Apoio", "Serviços e Locações".
- Divisão:
  * Se pago por João: pago_joao = valor_final, pago_fofo = 0, pendente = 0, status = "Pago"
  * Se pago por Fofo: pago_fofo = valor_final, pago_joao = 0, pendente = 0, status = "Pago"
  * Se 50/50 ou ambos: pago_joao = valor_final/2, pago_fofo = valor_final/2, pendente = 0, status = "Pago"
  * Se pendente/a pagar: pendente = valor_final, pago_joao = 0, pago_fofo = 0, status = "Pendente"

JSON SCHEMA DE RETORNO OBRIGATÓRIO:
{
  "action": "QUERY" | "INSERT" | "UPDATE" | "DELETE",
  "id": "uuid-string (apenas para UPDATE e DELETE)",
  "reply": "Texto de resposta ou confirmação formatado em Markdown para o Telegram",
  "data": {
    "descricao": "string",
    "categoria": "string",
    "subcategoria": "string",
    "valor_bruto": 0.0,
    "desconto": 0.0,
    "valor_final": 0.0,
    "status": "Pago" | "Pendente",
    "parcelas": "string",
    "pago_joao": 0.0,
    "pago_fofo": 0.0,
    "pendente": 0.0,
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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
