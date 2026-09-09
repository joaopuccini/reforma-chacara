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
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Gasto Total da Obra</p>
        <div className="text-2xl font-bold mt-2 tracking-tight">{formatCurrency(metrics.totalGeral)}</div>
      </div>
      
      <div className="glass-card p-6 flex flex-col justify-between border-t border-t-amber-500/30 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Total Pendente (À Pagar)</p>
        <div className="text-2xl font-bold text-amber-500 mt-2 tracking-tight">{formatCurrency(metrics.totalPendente)}</div>
      </div>

      {Object.entries(metrics.totalPorCategoria).map(([categoria, valor], index) => {
        // Subtle top glows for categories
        const colors = [
          'border-t-blue-500/30 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]', 
          'border-t-purple-500/30 shadow-[inset_0_1px_0_rgba(168,85,247,0.1)]', 
          'border-t-emerald-500/30 shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]', 
          'border-t-pink-500/30 shadow-[inset_0_1px_0_rgba(236,72,153,0.1)]',
          'border-t-indigo-500/30 shadow-[inset_0_1px_0_rgba(99,102,241,0.1)]'
        ];
        const colorClass = colors[index % colors.length];

        return (
          <div key={categoria} className={`glass-card p-6 flex flex-col justify-between border-t ${colorClass}`}>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px] truncate" title={categoria}>{categoria}</p>
            <div className="text-2xl font-bold mt-2 tracking-tight">{formatCurrency(valor)}</div>
          </div>
        );
      })}
    </div>
  );
}
