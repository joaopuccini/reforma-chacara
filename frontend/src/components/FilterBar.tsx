import { Search } from 'lucide-react';

interface FilterBarProps {
  filters: {
    categoria: string;
    status: string;
    origem_pagamento: string;
    responsavel: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export default function FilterBar({ filters, onFilterChange, onClearFilters }: FilterBarProps) {
  const categorias = [
    'Mão de Obra',
    'Material para a Casa',
    'Material de Apoio',
    'Serviços e Locações'
  ];

  return (
    <div className="glass flex flex-col gap-4 w-full p-4 rounded-xl border border-border/50">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="flex h-10 w-full rounded-lg border border-border/50 bg-background/30 px-3 py-1 text-sm shadow-inner transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary pl-9 backdrop-blur-sm"
            placeholder="Buscar despesa..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1 sm:justify-end">
          <select
            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-primary flex-1 sm:flex-none backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors"
            value={filters.categoria}
            onChange={(e) => onFilterChange('categoria', e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-primary flex-1 sm:flex-none backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors"
            value={filters.origem_pagamento}
            onChange={(e) => onFilterChange('origem_pagamento', e.target.value)}
          >
            <option value="">Todas Origens</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO_CREDITO_JOAO">Cartão João</option>
            <option value="CARTAO_PRETO_CREDITO_FOFO">Cartão Preto Fofo</option>
          </select>

          <select
            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-primary flex-1 sm:flex-none backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors"
            value={filters.responsavel}
            onChange={(e) => onFilterChange('responsavel', e.target.value)}
          >
            <option value="">Todos Resp.</option>
            <option value="João">João</option>
            <option value="Fofo">Fofo</option>
          </select>

          <select
            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-primary flex-1 sm:flex-none backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="">Qualquer Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>

          {(filters.categoria || filters.status || filters.origem_pagamento || filters.responsavel || filters.search) && (
            <button
              onClick={onClearFilters}
              className="h-10 px-4 w-full sm:w-auto rounded-lg border border-border/50 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center"
              title="Limpar todos os filtros"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
