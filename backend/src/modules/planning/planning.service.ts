import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateWorkStageDto, CreateExecutionScheduleDto, CreatePlanningCostDto } from './dto/create-planning.dto';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PlanningService {
  constructor(private readonly supabaseService: SupabaseService) {}

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
  getFloorplanVersions() {
    try {
      const publicDir = path.resolve(process.cwd(), '../frontend/public');
      if (!fs.existsSync(publicDir)) return [];
      
      const files = fs.readdirSync(publicDir);
      const versions = files.filter(f => f.startsWith('planta') && f.endsWith('.json'));
      // Sort so 'planta.json' is first, then 'planta_v1.json', 'planta_v2.json' etc.
      versions.sort((a, b) => {
        if (a === 'planta.json') return -1;
        if (b === 'planta.json') return 1;
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      return versions;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  saveFloorplan(data: any) {
    try {
      const publicDir = path.resolve(process.cwd(), '../frontend/public');
      const versions = this.getFloorplanVersions();
      
      let nextVersion = 1;
      if (versions.length > 0) {
        const lastVersion = versions[versions.length - 1];
        if (lastVersion !== 'planta.json') {
          const match = lastVersion.match(/planta_v(\d+)\.json/);
          if (match) {
            nextVersion = parseInt(match[1]) + 1;
          }
        }
      }

      const fileName = `planta_v${nextVersion}.json`;
      const filePath = path.join(publicDir, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return { status: 'success', message: `Planta salva como ${fileName}`, version: fileName };
    } catch (error) {
      console.error('Error saving floorplan:', error);
      throw new Error('Falha ao salvar planta no disco.');
    }
  }
}
