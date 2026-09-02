import { Metrics } from '../types/expense';
import { TrendingUp, Users, Scale, AlertCircle } from 'lucide-react';

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Geral */}
      <div className="glass-card p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Custo Total da Obra</p>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{formatCurrency(metrics?.totalGeral || 0)}</h2>
        </div>
      </div>

      {/* Card 2: Acerto de Contas */}
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-primary/60">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Acerto de Contas (50/50)</p>
          <Scale className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">
            {metrics?.acertoContas?.diferenca === 0 
              ? 'Tudo certo!' 
              : formatCurrency(metrics?.acertoContas?.valorCompensacao || 0)}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 truncate" title={metrics?.acertoContas?.resumoTexto}>
            {metrics?.acertoContas?.resumoTexto}
          </p>
        </div>
      </div>

      {/* Card 3: Resumo João vs Fofo */}
      <div className="glass-card p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Pago por Sócio</p>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">João</span>
            <span>{formatCurrency(metrics?.totalPagoJoao || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Fofo</span>
            <span>{formatCurrency(metrics?.totalPagoFofo || 0)}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Pendente */}
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-amber-500/60">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Total a Pagar (Pendente)</p>
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-amber-500">
            {formatCurrency(metrics?.totalPendente || 0)}
          </h2>
        </div>
      </div>
    </div>
  );
}
