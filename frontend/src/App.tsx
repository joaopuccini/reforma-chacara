import { useState } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import FilterBar from './components/FilterBar';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFormModal from './components/ExpenseFormModal';
import { PlanningDashboard } from './components/PlanningDashboard';
import { useExpenses } from './hooks/useExpenses';
import { useMetrics, useEtapas } from './hooks/useMetrics';

function App() {
  const [activeTab, setActiveTab] = useState<'REALIZED' | 'PLANNING'>('REALIZED');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    categoria: '',
    status: '',
    origem_pagamento: '',
    responsavel: '',
    search: '',
    etapa: ''
  });

  const { data, isLoading } = useExpenses(filters);
  const { data: metrics, isLoading: isLoadingMetrics } = useMetrics(filters.etapa);
  const { data: etapas = ['Laje'] } = useEtapas();

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
      search: '',
      etapa: ''
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onNewExpense={() => handleOpenModal()} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Main Tabs (Glassmorphism Pilled) */}
        <div className="flex justify-center mb-8">
          <div className="glass inline-flex items-center p-1.5 rounded-full">
            <button
              onClick={() => setActiveTab('REALIZED')}
              className={`relative px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'REALIZED'
                  ? 'text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'REALIZED' && (
                <div className="absolute inset-0 bg-primary/80 border border-primary/20 backdrop-blur-md rounded-full -z-10 animate-in zoom-in-95 duration-200"></div>
              )}
              <span className="flex items-center gap-2 relative z-10">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Realizado (Caixa)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('PLANNING')}
              className={`relative px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'PLANNING'
                  ? 'text-violet-50 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'PLANNING' && (
                <div className="absolute inset-0 bg-violet-600/80 border border-violet-500/30 backdrop-blur-md rounded-full -z-10 animate-in zoom-in-95 duration-200"></div>
              )}
              <span className="flex items-center gap-2 relative z-10">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Planejamento & Orçamento
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'REALIZED' ? (
          <>
            {/* Etapa Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => handleFilterChange('etapa', '')}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  !filters.etapa || filters.etapa === ''
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30' 
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                Todas as Etapas
              </button>
              {etapas.map((etapa) => (
                <button
                  key={etapa}
                  onClick={() => handleFilterChange('etapa', etapa)}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    filters.etapa === etapa 
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30' 
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  {etapa}
                </button>
              ))}
            </div>

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
          </>
        ) : (
          <PlanningDashboard />
        )}
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
