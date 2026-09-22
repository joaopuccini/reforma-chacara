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
      // Fail gracefully if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const totalEstimado = costs.reduce((acc, c) => acc + Number(c.valor_estimado), 0);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Carregando planejamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
          <h3 className="text-amber-700 text-sm font-medium">Orçamento Estimado (Futuro)</h3>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEstimado)}
          </p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-lg">
          <h3 className="text-violet-700 text-sm font-medium">Convertido em Realizado</h3>
          <p className="text-2xl font-bold text-violet-900 mt-1">R$ 0,00</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
          <h3 className="text-emerald-700 text-sm font-medium">Economia (Budget vs Actual)</h3>
          <p className="text-2xl font-bold text-emerald-900 mt-1">R$ 0,00</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Cronograma e Insumos</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Fase de Testes
          </span>
        </div>
        
        {costs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhum orçamento futuro cadastrado ainda.</p>
            <p className="text-sm mt-2">Use o comando <code>/planejar</code> no Telegram para adicionar.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimativa (R$)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Limite</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.map((cost) => (
                <tr key={cost.id} className={cost.status_aprovacao === 'ATRASADO' ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cost.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cost.tipo === 'MATERIAL' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                      {cost.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.valor_estimado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cost.data_limite_aquisicao || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cost.status_aprovacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
