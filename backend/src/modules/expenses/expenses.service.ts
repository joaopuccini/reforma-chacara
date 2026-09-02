import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async findAll(query: QueryExpenseDto) {
    const { page = 1, limit = 20, categoria, status, search, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    let dbQuery = this.client
      .from('despesas')
      .select('*', { count: 'exact' });

    if (categoria) dbQuery = dbQuery.eq('categoria', categoria);
    if (status) dbQuery = dbQuery.eq('status', status);
    if (search) dbQuery = dbQuery.or(`descricao.ilike.%${search}%,observacoes.ilike.%${search}%`);
    if (startDate) dbQuery = dbQuery.gte('created_at', startDate);
    if (endDate) dbQuery = dbQuery.lte('created_at', endDate);

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data,
      meta: {
        total: count,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findOne(id: string): Promise<Expense> {
    const { data, error } = await this.client
      .from('despesas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Expense with ID ${id} not found`);
    return data as Expense;
  }

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const { data, error } = await this.client
      .from('despesas')
      .insert([createExpenseDto])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const { data, error } = await this.client
      .from('despesas')
      .update(updateExpenseDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException(`Expense with ID ${id} not found`);
    
    return data as Expense;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const { error, count } = await this.client
      .from('despesas')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    if (count === 0) throw new NotFoundException(`Expense with ID ${id} not found`);
    
    return { success: true };
  }

  async getMetrics() {
    const { data, error } = await this.client
      .from('despesas')
      .select('valor_final, pago_joao, pago_fofo, pendente, categoria');

    if (error) throw new Error(error.message);

    const totalGeral = data.reduce((acc: number, curr: any) => acc + Number(curr.valor_final), 0);
    const totalPagoJoao = data.reduce((acc: number, curr: any) => acc + Number(curr.pago_joao), 0);
    const totalPagoFofo = data.reduce((acc: number, curr: any) => acc + Number(curr.pago_fofo), 0);
    const totalPendente = data.reduce((acc: number, curr: any) => acc + Number(curr.pendente), 0);

    const totalPorCategoria = data.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.valor_final);
      return acc;
    }, {} as Record<string, number>);

    let diferenca = Math.abs(totalPagoJoao - totalPagoFofo);
    let devedor = totalPagoJoao < totalPagoFofo ? 'João' : 'Fofo';
    let credor = totalPagoJoao > totalPagoFofo ? 'João' : 'Fofo';
    let valorCompensacao = diferenca / 2;
    
    if (diferenca === 0) {
      devedor = 'Nenhum';
      credor = 'Nenhum';
    }

    const resumoTexto = diferenca === 0 
      ? 'Contas empatadas.' 
      : `${devedor} deve pagar R$ ${valorCompensacao.toFixed(2)} para ${credor} para igualar os gastos efetuados.`;

    return {
      totalGeral,
      totalPagoJoao,
      totalPagoFofo,
      totalPendente,
      acertoContas: {
        diferenca,
        devedor,
        credor,
        valorCompensacao,
        resumoTexto,
      },
      totalPorCategoria,
    };
  }
}
