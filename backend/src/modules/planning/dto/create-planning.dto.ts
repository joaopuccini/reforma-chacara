export class CreateWorkStageDto {
  nome: string;
  descricao?: string;
  ordem?: number;
}

export class CreateExecutionScheduleDto {
  work_stage_id: string;
  prestador_nome: string;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  status_insumos?: string;
  status_execucao?: string;
  observacoes?: string;
}

export class CreatePlanningCostDto {
  schedule_id: string;
  descricao: string;
  tipo: 'MATERIAL' | 'MAO_DE_OBRA' | 'OUTROS';
  valor_estimado: number;
  data_limite_aquisicao?: string;
  status_aprovacao?: string;
}
