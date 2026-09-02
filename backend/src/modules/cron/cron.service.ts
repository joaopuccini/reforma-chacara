import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // Executa todos os dias às 00:05
  @Cron('5 0 * * *')
  async handleVencimentosParcelas() {
    this.logger.log('Iniciando rotina de verificação de parcelas vencidas...');
    
    try {
      const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error, count } = await this.supabaseService.getClient()
        .from('despesas')
        .update({ status: 'Pago', updated_at: new Date().toISOString() })
        .eq('status', 'Pendente')
        .lte('data_vencimento', hoje)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Rotina concluída: ${data?.length || 0} parcelas atualizadas para "Pago".`);
    } catch (err: any) {
      this.logger.error(`Erro ao atualizar parcelas vencidas: ${err.message}`);
    }
  }
}
