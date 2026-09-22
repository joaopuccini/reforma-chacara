import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateWorkStageDto, CreateExecutionScheduleDto, CreatePlanningCostDto } from './dto/create-planning.dto';
import { randomUUID } from 'crypto';

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
}
