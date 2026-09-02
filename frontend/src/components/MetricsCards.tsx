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
      
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-blue-500">
        <p className="text-sm font-medium text-muted-foreground">João (Total Pago)</p>
        <div className="text-2xl font-bold mt-2">{formatCurrency(metrics.totalPagoJoao)}</div>
      </div>
      
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-green-500">
        <p className="text-sm font-medium text-muted-foreground">Fofo (Total Pago)</p>
        <div className="text-2xl font-bold mt-2">{formatCurrency(metrics.totalPagoFofo)}</div>
      </div>
      
      <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
        <p className="text-sm font-medium text-muted-foreground">Total Pendente (À Pagar)</p>
        <div className="text-2xl font-bold text-amber-500 mt-2">{formatCurrency(metrics.totalPendente)}</div>
      </div>

      {/* Card de Acerto de Contas Ocupando 2 Colunas */}
      <div className="glass-card p-6 md:col-span-2 lg:col-span-4 bg-primary/5 border border-primary/20 flex flex-col justify-between">
        <h3 className="text-lg font-bold text-primary mb-2">Acerto de Contas (Divisão 50/50)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          A diferença de pagamentos entre os dois é de <strong>{formatCurrency(metrics.acertoContas.diferenca)}</strong>.
        </p>
        <div className="text-xl font-bold">
          {metrics.acertoContas.diferenca === 0 ? (
            <span className="text-green-600">Contas estão empatadas! Tudo certo.</span>
          ) : (
            <span>
              <span className="text-red-500">{metrics.acertoContas.devedor}</span> deve pagar{' '}
              <span className="text-green-600 font-extrabold">{formatCurrency(metrics.acertoContas.valorCompensacao)}</span>{' '}
              para <span className="text-blue-500">{metrics.acertoContas.credor}</span>.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
