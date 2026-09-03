import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { Expense } from './entities/expense.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class ExpensesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async findAll(query: QueryExpenseDto) {
    const { page = 1, limit = 20, categoria, status, origem_pagamento, responsavel, search, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    let dbQuery = this.client
      .from('despesas')
      .select('*', { count: 'exact' });

    if (categoria) dbQuery = dbQuery.eq('categoria', categoria);
    if (status) dbQuery = dbQuery.eq('status', status);
    if (origem_pagamento) dbQuery = dbQuery.eq('origem_pagamento', origem_pagamento);
    if (responsavel) dbQuery = dbQuery.eq('responsavel', responsavel);
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

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense | Expense[]> {
    const parcelasTotal = createExpenseDto.parcelas_total || 1;
    
    if (parcelasTotal === 1) {
      // Compra à vista
      const expenseToInsert = {
        ...createExpenseDto,
        parcela_numero: 1,
        parcelas_total: 1,
        valor_parcela: createExpenseDto.valor_final,
        data_vencimento: null,
      };

      const { data, error } = await this.client
        .from('despesas')
        .insert([expenseToInsert])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Expense;
    } else {
      // Compra parcelada
      const compraGrupoId = randomUUID();
      const valorBaseParcela = Math.floor((createExpenseDto.valor_final / parcelasTotal) * 100) / 100;
      let somaParcelasBase = valorBaseParcela * (parcelasTotal - 1);
      const valorUltimaParcela = Number((createExpenseDto.valor_final - somaParcelasBase).toFixed(2));

      const parcelasToInsert = [];
      const hoje = new Date();

      for (let i = 1; i <= parcelasTotal; i++) {
        const isPrimeira = i === 1;
        const valorAtual = i === parcelasTotal ? valorUltimaParcela : valorBaseParcela;
        
        let dataVencimento = null;
        if (!isPrimeira) {
          // Vencimento dia 10 dos próximos meses
          const mesVencimento = hoje.getMonth() + (i - 1); // +1 mês para cada parcela subsequente
          dataVencimento = new Date(hoje.getFullYear(), mesVencimento, 10);
        }

        parcelasToInsert.push({
          ...createExpenseDto,
          compra_grupo_id: compraGrupoId,
          parcela_numero: i,
          parcelas_total: parcelasTotal,
          valor_parcela: valorAtual,
          status: isPrimeira ? 'Pago' : 'Pendente',
          data_vencimento: dataVencimento ? dataVencimento.toISOString().split('T')[0] : null,
        });
      }

      const { data, error } = await this.client
        .from('despesas')
        .insert(parcelasToInsert)
        .select();

      if (error) throw new Error(error.message);
      return data as Expense[];
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const existing = await this.findOne(id);

    // Se houver alteração de valor_final e for uma compra parcelada (grupo)
    if (updateExpenseDto.valor_final !== undefined && existing.compra_grupo_id && existing.parcelas_total > 1) {
      const parcelasTotal = existing.parcelas_total;
      const novoValorFinal = updateExpenseDto.valor_final;

      const valorBaseParcela = Math.floor((novoValorFinal / parcelasTotal) * 100) / 100;
      const somaParcelasBase = valorBaseParcela * (parcelasTotal - 1);
      const valorUltimaParcela = Number((novoValorFinal - somaParcelasBase).toFixed(2));

      // Atualiza parcelas de 1 a N-1
      await this.client
        .from('despesas')
        .update({ valor_final: novoValorFinal, valor_parcela: valorBaseParcela })
        .eq('compra_grupo_id', existing.compra_grupo_id)
        .neq('parcela_numero', parcelasTotal);

      // Atualiza a última parcela (para corrigir os centavos)
      await this.client
        .from('despesas')
        .update({ valor_final: novoValorFinal, valor_parcela: valorUltimaParcela })
        .eq('compra_grupo_id', existing.compra_grupo_id)
        .eq('parcela_numero', parcelasTotal);

      // Remover valor_final do DTO, pois já tratamos todas as parcelas no banco
      delete updateExpenseDto.valor_final;
    } else if (updateExpenseDto.valor_final !== undefined) {
      // Compra à vista ou edição isolada
      updateExpenseDto.valor_parcela = updateExpenseDto.valor_final;
    }

    // Processa quaisquer campos restantes (ex: status, observacoes) para a linha selecionada
    if (Object.keys(updateExpenseDto).length > 0) {
      const { data, error } = await this.client
        .from('despesas')
        .update(updateExpenseDto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Expense;
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    // Primeiro, verifica se a despesa existe e se pertence a um grupo
    const expense = await this.findOne(id);
    
    let dbQuery = this.client.from('despesas').delete({ count: 'exact' });
    
    if (expense.compra_grupo_id) {
      // Exclui todas as parcelas do mesmo grupo
      dbQuery = dbQuery.eq('compra_grupo_id', expense.compra_grupo_id);
    } else {
      dbQuery = dbQuery.eq('id', id);
    }

    const { error, count } = await dbQuery;

    if (error) throw new Error(error.message);
    if (count === 0) throw new NotFoundException(`Expense(s) not found`);
    
    return { success: true };
  }

  async getMetrics() {
    const { data, error } = await this.client
      .from('despesas')
      .select('valor_parcela, responsavel, status, categoria');

    if (error) throw new Error(error.message);

    const totalGeral = data.reduce((acc: number, curr: any) => acc + Number(curr.valor_parcela), 0);
    const totalPendente = data.filter(d => d.status === 'Pendente').reduce((acc: number, curr: any) => acc + Number(curr.valor_parcela), 0);
    
    // Pagos por responsável
    const totalPagoJoao = data
      .filter(d => d.status === 'Pago' && d.responsavel === 'João')
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_parcela), 0);
      
    const totalPagoFofo = data
      .filter(d => d.status === 'Pago' && d.responsavel === 'Fofo')
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_parcela), 0);

    const totalPorCategoria = data.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.valor_parcela);
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
