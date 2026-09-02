import { Search } from 'lucide-react';

interface FilterBarProps {
  filters: {
    categoria: string;
    status: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const categorias = [
    'Mão de Obra',
    'Material para a Casa',
    'Material de Apoio',
    'Serviços e Locações'
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          placeholder="Buscar despesa..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <select
          className="flex h-9 w-full sm:w-[180px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
          value={filters.categoria}
          onChange={(e) => onFilterChange('categoria', e.target.value)}
        >
          <option value="">Todas Categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="flex h-9 w-full sm:w-[140px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">Todos Status</option>
          <option value="Pago">Pago</option>
          <option value="Pendente">Pendente</option>
        </select>
      </div>
    </div>
  );
}
