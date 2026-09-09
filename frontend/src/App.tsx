import { useState } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import FilterBar from './components/FilterBar';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFormModal from './components/ExpenseFormModal';
import { useExpenses } from './hooks/useExpenses';
import { useMetrics } from './hooks/useMetrics';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    categoria: '',
    status: '',
    origem_pagamento: '',
    responsavel: '',
    search: ''
  });

  const { data, isLoading } = useExpenses(filters);
  const { data: metrics, isLoading: isLoadingMetrics } = useMetrics();

  const handleOpenModal = (id?: string) => {
    setEditingExpenseId(id || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpenseId(null);
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      categoria: '',
      status: '',
      origem_pagamento: '',
      responsavel: '',
      search: ''
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onNewExpense={() => handleOpenModal()} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <MetricsCards 
          metrics={metrics} 
          isLoading={isLoadingMetrics} 
          activeCategory={filters.categoria}
          onCategoryClick={(cat) => handleFilterChange('categoria', cat)}
          onClearFilters={handleClearFilters}
        />
        
        <div className="glass rounded-xl p-4 sm:p-6 space-y-6">
          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClearFilters={handleClearFilters}
          />
          
          <ExpenseTable 
            data={data?.data || []}
            meta={data?.meta}
            isLoading={isLoading}
            onEdit={handleOpenModal}
            onPageChange={(page) => handleFilterChange('page', page)}
          />
        </div>
      </main>

      {isModalOpen && (
        <ExpenseFormModal 
          expenseId={editingExpenseId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
