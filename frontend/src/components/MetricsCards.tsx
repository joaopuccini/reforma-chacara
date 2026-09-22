import { Metrics } from '../types/expense';

interface MetricsCardsProps {
  metrics: Metrics | undefined;
  isLoading: boolean;
  activeCategory: string;
  onCategoryClick: (categoria: string) => void;
  onClearFilters: () => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function MetricsCards({ metrics, isLoading, activeCategory, onCategoryClick, onClearFilters }: MetricsCardsProps) {
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
      <div 
        className="glass-card p-6 flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-all relative overflow-hidden group"
        onClick={onClearFilters}
        title="Limpar todos os filtros"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[11px] mb-1">Gasto Total da Obra</p>
          <div className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(metrics.totalGeral)}</div>
        </div>
      </div>
      
      <div className="glass-card p-6 flex flex-col justify-between border-t border-t-amber-500/30 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider text-[11px] mb-1">Total Pendente (À Pagar)</p>
          <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.totalPendente)}</div>
        </div>
      </div>

      {Object.entries(metrics.totalPorCategoria).map(([categoria, valor], index) => {
        const colors = [
          { border: 'border-t-blue-500/30', shadow: 'shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]', text: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' }, 
          { border: 'border-t-purple-500/30', shadow: 'shadow-[inset_0_1px_0_rgba(168,85,247,0.1)]', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' }, 
          { border: 'border-t-emerald-500/30', shadow: 'shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' }, 
          { border: 'border-t-pink-500/30', shadow: 'shadow-[inset_0_1px_0_rgba(236,72,153,0.1)]', text: 'text-pink-400', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]' },
          { border: 'border-t-indigo-500/30', shadow: 'shadow-[inset_0_1px_0_rgba(99,102,241,0.1)]', text: 'text-indigo-400', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]' }
        ];
        const color = colors[index % colors.length];

        return (
          <div 
            key={categoria} 
            className={`glass-card p-6 flex flex-col justify-between border-t ${color.border} ${color.shadow} cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              activeCategory === categoria 
                ? `ring-1 ring-white/20 bg-white/5 ${color.glow} scale-[1.02]` 
                : 'hover:bg-white/5'
            }`}
            onClick={() => onCategoryClick(activeCategory === categoria ? '' : categoria)}
            title={activeCategory === categoria ? 'Remover filtro' : `Filtrar por ${categoria}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className={`w-16 h-16 ${color.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="relative z-10">
              <p className={`text-sm font-semibold uppercase tracking-wider text-[11px] truncate mb-1 ${activeCategory === categoria ? color.text : 'text-muted-foreground'}`} title={categoria}>
                {categoria}
              </p>
              <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(valor)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
