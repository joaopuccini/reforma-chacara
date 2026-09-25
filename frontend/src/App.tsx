import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import FilterBar from './components/FilterBar';
import ExpenseTable from './components/ExpenseTable';
import { AiAssistant } from './components/AiAssistant';
import { PlanningDashboard } from './components/PlanningDashboard';
import { PlanningModule } from './modules/floorplan/PlanningModule';
import { Login } from './components/Login';
import { useExpenses } from './hooks/useExpenses';
import { useMetrics, useEtapas } from './hooks/useMetrics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState<'REALIZED' | 'PLANNING' | 'FLOORPLAN'>('REALIZED');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    categoria: '',
    status: '',
    origem_pagamento: '',
    responsavel: '',
    search: '',
    etapa: ''
  });

  const { data, isLoading, refetch } = useExpenses(filters);
  const { data: metrics, isLoading: isLoadingMetrics } = useMetrics(filters.etapa);
  const { data: etapas = ['Laje'] } = useEtapas();

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleEdit = (id: string) => {
    // If they click edit, we could handle via AiAssistant later
    console.log('Edit clicked for', id);
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value as number : 1
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      categoria: '',
      status: '',
      origem_pagamento: '',
      responsavel: '',
      search: '',
      page: 1
    }));
  };

  const handleEtapaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'TODAS_AS_ETAPAS') {
      setFilters(prev => ({ ...prev, etapa: '' }));
    } else {
      setFilters(prev => ({ ...prev, etapa: value }));
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Etapa Selector (Global) */}
        <div className="flex justify-center -mt-2 mb-4 relative z-20">
          <div className="inline-flex items-center gap-2 bg-muted/40 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Etapa Ativa:</span>
            <select 
              value={filters.etapa || 'TODAS_AS_ETAPAS'}
              onChange={handleEtapaChange}
              className="bg-transparent text-sm font-bold text-foreground border-0 outline-none cursor-pointer hover:text-primary transition-colors focus:ring-0 pl-1 pr-6"
            >
              <option value="TODAS_AS_ETAPAS">Todas as Etapas</option>
              {etapas.map((etapa: string) => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Tabs (Glassmorphism Pilled) */}
        <div className="flex justify-center mb-8 w-full">
          <div className="glass flex flex-col sm:flex-row sm:inline-flex items-stretch sm:items-center p-1.5 rounded-2xl sm:rounded-full gap-1 sm:gap-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('REALIZED')}
              className={`relative w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl sm:rounded-full transition-all duration-300 ${
                activeTab === 'REALIZED'
                  ? 'text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'REALIZED' && (
                <div className="absolute inset-0 bg-primary/80 border border-primary/20 backdrop-blur-md rounded-xl sm:rounded-full -z-10 animate-in zoom-in-95 duration-200"></div>
              )}
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Realizado (Caixa)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('PLANNING')}
              className={`relative w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl sm:rounded-full transition-all duration-300 ${
                activeTab === 'PLANNING'
                  ? 'text-violet-50 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'PLANNING' && (
                <div className="absolute inset-0 bg-violet-600/80 border border-violet-500/30 backdrop-blur-md rounded-xl sm:rounded-full -z-10 animate-in zoom-in-95 duration-200"></div>
              )}
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Planejamento & Orçamento
              </span>
            </button>
            <button
              onClick={() => setActiveTab('FLOORPLAN')}
              className={`relative w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl sm:rounded-full transition-all duration-300 ${
                activeTab === 'FLOORPLAN'
                  ? 'text-cyan-50 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'FLOORPLAN' && (
                <div className="absolute inset-0 bg-cyan-600/80 border border-cyan-500/30 backdrop-blur-md rounded-xl sm:rounded-full -z-10 animate-in zoom-in-95 duration-200"></div>
              )}
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Planta 2D/3D
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'REALIZED' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MetricsCards 
              metrics={metrics} 
              isLoading={isLoadingMetrics}
              activeCategory={filters.categoria}
              onCategoryClick={(cat) => handleFilterChange('categoria', cat)}
              onClearFilters={handleClearFilters}
            />

            <FilterBar 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onClearFilters={handleClearFilters}
            />

            <ExpenseTable 
              data={data?.data || []}
              meta={data?.meta}
              isLoading={isLoading}
              onEdit={handleEdit}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          </div>
        )}
        
        {activeTab === 'PLANNING' && (
          <PlanningDashboard />
        )}

        {activeTab === 'FLOORPLAN' && (
          <PlanningModule />
        )}
      </main>

      <AiAssistant onActionComplete={() => refetch()} />
    </div>
  );
}

export default App;
