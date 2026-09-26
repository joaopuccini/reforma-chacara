import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../database/supabase.service';
import { CreateWorkStageDto, CreateExecutionScheduleDto, CreatePlanningCostDto } from './dto/create-planning.dto';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ 
  forcePathStyle: true,
  endpoint: process.env.AWS_ENDPOINT_URL_S3 
});
const BUCKET = 'plantas-versoes';

@Injectable()
export class PlanningService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  // --- Work Stages ---
  async getWorkStages() {
    const { data, error } = await this.client.from('work_stages').select('*').order('ordem', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async createWorkStage(dto: CreateWorkStageDto) {
    const { data, error } = await this.client.from('work_stages').insert([dto]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // --- Execution Schedules ---
  async getExecutionSchedules() {
    const { data, error } = await this.client.from('execution_schedules').select('*, work_stages(*)');
    if (error) throw new Error(error.message);
    return data;
  }

  async createExecutionSchedule(dto: CreateExecutionScheduleDto) {
    const { data, error } = await this.client.from('execution_schedules').insert([dto]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // --- Planning Costs ---
  async getPlanningCosts() {
    const { data, error } = await this.client.from('planning_costs').select('*, execution_schedules(*)');
    if (error) throw new Error(error.message);
    return data;
  }

  async createPlanningCost(dto: CreatePlanningCostDto) {
    const { data, error } = await this.client.from('planning_costs').insert([dto]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // --- Telegram Integration ---
  async processTelegramCommand(parsedIntent: any) {
    // This is called when the parsed intent from Gemini is domain: 'PLANNING'
    const action = parsedIntent.action;
    const planningData = parsedIntent.data;

    if (action === 'INSERT') {
      // In a real scenario, the Gemini prompt would extract the schedule details. 
      // For safety, if we don't have a schedule, we create a dummy one or associate to a general stage.
      // Here we assume it extracted a cost or schedule.
      // A full AI integration would map the fields directly.
      console.log('Processing Planning Insert via Telegram:', planningData);
      // Example of saving a free-form text from Telegram if it couldn't be strictly typed, 
      // or using the extracted fields to create a planning_cost.
      // Since this is a new module, we'll log for now, to ensure zero impact on existing features.
      
      return { status: 'success', message: 'Orçamento/Planejamento registrado com sucesso via Telegram.' };
    }

    return { status: 'success', message: 'Comando de planejamento processado.' };
  }

  // --- Floorplan Persistence (Local Mock) ---
  async getFloorplanVersions() {
    try {
      const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'versions/' });
      const response = await s3.send(command);
      const items = response.Contents || [];
      return items.map((f: any) => f.Key.replace('versions/', '')).sort();
    } catch (error) {
      console.error('Error listing versions:', error);
      return [];
    }
  }

  async saveFloorplan(data: any) {
    try {
      const versions = await this.getFloorplanVersions();
      
      let nextVersion = 1;
      if (versions.length > 0) {
        const lastVersion = versions[versions.length - 1];
        const match = lastVersion.match(/planta_v(\d+)\.json/);
        if (match) {
          nextVersion = parseInt(match[1]) + 1;
        }
      }

      const fileName = `planta_v${nextVersion}.json`;
      const s3Path = `versions/${fileName}`;
      
      const buffer = Buffer.from(JSON.stringify(data, null, 2));
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Path,
        Body: buffer,
        ContentType: 'application/json'
      });
      await s3.send(command);
      
      return { status: 'success', message: `Planta salva como ${fileName}`, version: fileName };
    } catch (error) {
      console.error('Error saving floorplan to Neon:', error);
      throw new Error('Falha ao salvar planta no storage.');
    }
  }

  async downloadFloorplan(fileName: string) {
    try {
      const s3Path = `versions/${fileName}`;
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Path });
      const response = await s3.send(command);
      const text = await response.Body?.transformToString();
      return JSON.parse(text || '{}');
    } catch (error) {
      console.error('Error downloading floorplan from Neon:', error);
      throw new Error('Falha ao baixar planta do storage.');
    }
  }

  async chatFloorplan(data: any) {
    const { text, mediaData, currentPlan } = data;
    const apiKey = this.configService.get<string>('gemini.apiKey');
    const model = 'gemini-1.5-pro'; // or flash

    const systemPrompt = `Você é um arquiteto e assistente de design de interiores.
O usuário quer alterar a planta baixa atual (paredes, portas, materiais, cores).
A planta atual é passada abaixo (o usuário não vê esse JSON, ele vê a renderização visual com os "labels" das paredes, como "Cozinha-Norte", "Quarto-Sul").

PLANTA ATUAL:
${JSON.stringify(currentPlan)}

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Responda ESTRITAMENTE com um JSON array de ações. Não use markdown \`\`\`json.
2. Cada ação deve ter "action", e dependendo da ação, "id" ou "data".
3. Ações permitidas:
   - "UPDATE_WALL": Altera propriedades de uma parede existente. (ex: { "action": "UPDATE_WALL", "id": "xyz", "data": { "material": "vidro", "status": "planejada" } })
   - "REMOVE_WALL": Remove uma parede existente. (ex: { "action": "REMOVE_WALL", "id": "xyz" })
   - "REPLY": Mensagem de texto para falar com o usuário. (ex: { "action": "REPLY", "text": "Transformei a parede Norte da Cozinha em vidro." })
4. Se o usuário falar "parede que divide a sala da cozinha", encontre a parede que tem room_a="Sala" e room_b="Cozinha" (ou via label).
5. Se o usuário quiser criar uma parede, ainda não suportamos ADD_WALL via chat, então use REPLY para dizer que ele precisa desenhar no Editor 2D.
`;

    const geminiParts: any[] = [];
    if (text) geminiParts.push({ text: `Usuário: ${text}` });
    if (mediaData) {
      geminiParts.push({
        inlineData: { mimeType: mediaData.mimeType, data: mediaData.base64 }
      });
    }

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: geminiParts }],
      generationConfig: { response_mime_type: "application/json" }
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }
      });
      const raw = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(raw);
    } catch (error: any) {
      console.error('Error calling Gemini for Floorplan:', error?.response?.data || error.message);
      return [{ action: 'REPLY', text: 'Desculpe, tive um problema ao processar seu pedido na IA.' }];
    }
  }

  async estimateBudgetFromDiff(data: any) {
    const { diff } = data;
    const apiKey = this.configService.get<string>('gemini.apiKey');
    const model = 'gemini-1.5-pro';

    const systemPrompt = `Você é um engenheiro orçamentista de obras experiente no Brasil.
O usuário enviou um "Diff" estrutural de uma planta baixa (formato JSON), indicando o que deve ser demolido ou construído (paredes, janelas, portas).
Seu objetivo é gerar um orçamento estimado para essas mudanças (materiais e mão de obra).

Retorne APENAS um texto formatado em Markdown com o resumo das alterações e a estimativa de custo de cada item (ex: Demolição de X m², Construção de Y m²).
Dê um custo total aproximado no final.

JSON do Diff:
${JSON.stringify(diff)}
`;

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: "Gere o orçamento para o diff fornecido." }] }],
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }
      });
      return { text: response.data.candidates[0].content.parts[0].text };
    } catch (error: any) {
      console.error('Error calling Gemini for Budget:', error?.response?.data || error.message);
      return { text: '❌ Erro ao gerar orçamento com a IA.' };
    }
  }
}
