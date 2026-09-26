import React, { useEffect, useState } from 'react';
import { Editor2D } from './components/Editor2D';
import { Viewer3D } from './components/Viewer3D';
import { PropertyPanel } from './components/PropertyPanel';
import { FloorplanChat } from './components/FloorplanChat';
import { useFloorPlanStore } from './useFloorPlanStore';
import { generatePlanDiff } from './services/diffService';
import { planningApi } from '../../services/api';
import { hasDraft, loadDraft, clearDraft } from './utils/draftPersistence';

export function PlanningModule() {
  const { addPoint } = useFloorPlanStore();
  const [versions, setVersions] = useState<string[]>(['planta.json']);
  const [selectedVersion, setSelectedVersion] = useState<string>('planta.json');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  useEffect(() => {
    planningApi.getFloorPlanVersions().then(v => {
      const allVersions = ['planta.json', ...(v || [])];
      setVersions(allVersions);
      setSelectedVersion(allVersions[allVersions.length - 1]);
    }).catch(console.error);

    // Check for draft
    hasDraft().then(exists => {
      if (exists) {
        if (window.confirm("Você tem alterações não salvas. Continuar de onde parou?")) {
          loadDraft().then(draft => {
            if (draft) {
              useFloorPlanStore.getState().loadPlan(draft.plan);
            }
          });
        } else {
          clearDraft();
        }
      }
    });
  }, []);

  const handleCreateSquare = () => {
    // Helper para teste rápido: cria um cômodo 300x300
    addPoint(0, 0);
    useFloorPlanStore.getState().generateBaseSquare();
  };

  const handleLoadChacara = async () => {
    try {
      // If it's the default offline one, fetch from public dir
      if (selectedVersion === 'planta.json') {
        const response = await fetch('/planta.json');
        if (!response.ok) throw new Error(`Falha ao carregar planta.json local`);
        const data = await response.json();
        useFloorPlanStore.getState().importRoomPlan(data);
        return;
      }
      
      const data = await planningApi.downloadFloorPlanVersion(selectedVersion);
      // The backend saves { metadata, plan }, so if metadata exists, load the inner plan
      if (data && data.plan) {
        useFloorPlanStore.getState().importRoomPlan(data.plan);
      } else {
        useFloorPlanStore.getState().importRoomPlan(data);
      }
    } catch (err) {
      console.error(err);
      alert(`Erro ao carregar o arquivo ${selectedVersion}.`);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportDiff = async () => {
    const plan = useFloorPlanStore.getState().plan;
    const diff = generatePlanDiff(plan);
    setIsExporting(true);
    try {
      const res = await planningApi.estimateBudgetFromDiff(diff);
      alert(res.text); // Idealmente isso abriria um modal ou a conversa do Telegram
    } catch (e) {
      alert("Erro ao exportar diff.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToBackend = async () => {
    const plan = useFloorPlanStore.getState().plan;
    try {
      const res = await planningApi.saveFloorPlan(plan);
      alert(res.message || 'Planta salva com sucesso!');
      
      // Refresh versions
      const v = await planningApi.getFloorPlanVersions();
      if (v && v.length > 0) {
        setVersions(v);
        setSelectedVersion(v[v.length - 1]);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar no backend.');
    }
  };

  return (
    <div className="flex flex-col w-full h-[80vh] bg-background text-foreground border border-border rounded-xl overflow-hidden shadow-sm mt-4">
      {/* Header / Toolbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <h1 className="text-xl font-semibold">Planta 2D/3D</h1>
        
        <div className="flex space-x-4 items-center">
          <button 
            onClick={handleCreateSquare}
            className="px-4 py-2 bg-muted rounded-md hover:bg-muted/80 text-sm border border-border"
          >
            + Sala Base
          </button>
          
          <div className="flex bg-emerald-600/10 border border-emerald-500/30 rounded-md overflow-hidden h-9">
            <select 
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-transparent text-emerald-400 text-sm pl-3 pr-2 outline-none cursor-pointer border-r border-emerald-500/30"
            >
              {versions.map(v => (
                <option key={v} value={v} className="bg-background text-foreground">{v}</option>
              ))}
            </select>
            <button 
              onClick={handleLoadChacara}
              className="px-4 text-emerald-400 hover:bg-emerald-600/20 text-sm font-medium transition-colors"
            >
              Carregar
            </button>
          </div>

          <button 
            onClick={handleSaveToBackend}
            className="px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-md hover:bg-slate-600 text-sm font-medium transition-colors"
          >
            💾 Salvar Planta (Backend)
          </button>
          <button 
            onClick={handleExportDiff}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {isExporting ? 'Calculando...' : 'Exportar Diff (IA)'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        <PropertyPanel />
        <div className="absolute bottom-4 right-4 z-30 w-80 h-96 hidden md:block">
          <FloorplanChat />
        </div>
        
        {/* Mobile View Toggle */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 md:hidden flex bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-lg overflow-hidden p-1">
          <button 
            onClick={() => setViewMode('2d')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === '2d' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Planta 2D
          </button>
          <button 
            onClick={() => setViewMode('3d')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === '3d' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Visualizador 3D
          </button>
        </div>

        {/* Painel Esquerdo: 2D Editor */}
        <div className={`flex-1 flex-col border-border relative ${viewMode === '2d' ? 'flex' : 'hidden'} md:flex md:border-r`}>
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border shadow-sm rounded-md px-3 py-1 text-sm font-medium text-foreground hidden md:block">
            Editor 2D
          </div>
          <Editor2D />
        </div>

        {/* Painel Direito: 3D Viewer */}
        <div className={`flex-1 flex-col relative bg-muted/10 ${viewMode === '3d' ? 'flex' : 'hidden'} md:flex`}>
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border shadow-sm rounded-md px-3 py-1 text-sm font-medium text-foreground hidden md:block">
            Visualizador 3D
          </div>
          <Viewer3D />
        </div>
      </div>
    </div>
  );
}
