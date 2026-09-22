import React, { useEffect, useState } from 'react';
import { planningApi } from '../services/api';

export const PlanningDashboard: React.FC = () => {
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await planningApi.getPlanningCosts();
      setCosts(data);
    } catch (error) {
      console.error('Erro ao buscar dados de planejamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEstimado = costs.reduce((acc, c) => acc + Number(c.valor_estimado), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-amber-400 text-sm font-semibold tracking-wider uppercase mb-1">Orçamento Estimado</h3>
            <p className="text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEstimado)}
            </p>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Projeção futura de gastos</div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-violet-400 text-sm font-semibold tracking-wider uppercase mb-1">Convertido em Realizado</h3>
            <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Gastos efetivados a partir do planejamento</div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-1">Economia (Budget vs Actual)</h3>
            <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Diferença entre o estimado e o pago</div>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden border border-border">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Cronograma e Insumos</h3>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe as datas limite de aprovação e aquisição.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Fase de Testes
          </span>
        </div>
        
        {costs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum orçamento cadastrado</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Use o comando <code className="bg-muted px-1.5 py-0.5 rounded text-primary-foreground font-mono text-xs">/planejar</code> no Telegram para registrar compras futuras ou mão de obra agendada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/40 uppercase tracking-wider text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estimativa</th>
                  <th className="px-6 py-4">Data Limite</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {costs.map((cost) => (
                  <tr key={cost.id} className={`hover:bg-muted/20 transition-colors ${cost.status_aprovacao === 'ATRASADO' ? 'bg-red-500/5' : ''}`}>
                    <td className="px-6 py-4 font-medium text-foreground">{cost.descricao}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                        cost.tipo === 'MATERIAL' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {cost.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.valor_estimado)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{cost.data_limite_aquisicao ? new Date(cost.data_limite_aquisicao).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                        cost.status_aprovacao === 'ATRASADO'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {cost.status_aprovacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
