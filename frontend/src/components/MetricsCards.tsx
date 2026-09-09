import { Metrics } from '../types/expense';

interface MetricsCardsProps {
  metrics: Metrics | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-6 h-32 animate-pulse bg-muted/20"></div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="glass-card p-6 flex flex-col justify-between">
        <p className="text-sm font-medium text-muted-foreground">Gasto Total da Obra</p>
        <div className="text-2xl font-bold mt-2">{formatCurrency(metrics.totalGeral)}</div>
      </div>
      
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
        <p className="text-sm font-medium text-muted-foreground">Total Pendente (À Pagar)</p>
        <div className="text-2xl font-bold text-amber-500 mt-2">{formatCurrency(metrics.totalPendente)}</div>
      </div>

      {Object.entries(metrics.totalPorCategoria).map(([categoria, valor], index) => {
        // Cores intercaladas para as categorias
        const colors = [
          'border-l-blue-500', 
          'border-l-purple-500', 
          'border-l-emerald-500', 
          'border-l-pink-500',
          'border-l-indigo-500'
        ];
        const colorClass = colors[index % colors.length];

        return (
          <div key={categoria} className={`glass-card p-6 flex flex-col justify-between border-l-4 ${colorClass}`}>
            <p className="text-sm font-medium text-muted-foreground">{categoria}</p>
            <div className="text-2xl font-bold mt-2">{formatCurrency(valor)}</div>
          </div>
        );
      })}
    </div>
  );
}
