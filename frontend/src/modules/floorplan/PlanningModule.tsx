import React, { useEffect, useState } from 'react';
import { Editor2D } from './components/Editor2D';
import { Viewer3D } from './components/Viewer3D';
import { PropertyPanel } from './components/PropertyPanel';
import { useFloorPlanStore } from './useFloorPlanStore';
import { generatePlanDiff } from './services/diffService';
import { planningApi } from '../../services/api';

export function PlanningModule() {
  const { addPoint } = useFloorPlanStore();
  const [versions, setVersions] = useState<string[]>(['planta.json']);
  const [selectedVersion, setSelectedVersion] = useState<string>('planta.json');

  useEffect(() => {
    planningApi.getFloorPlanVersions().then(v => {
      if (v && v.length > 0) {
        setVersions(v);
        setSelectedVersion(v[v.length - 1]);
      }
    }).catch(console.error);
  }, []);

  const handleCreateSquare = () => {
    // Helper para teste rápido: cria um cômodo 300x300
    addPoint(0, 0);
    useFloorPlanStore.getState().generateBaseSquare();
  };

  const handleLoadChacara = async () => {
    try {
      const response = await fetch(`/${selectedVersion}`);
      if (!response.ok) throw new Error(`Falha ao carregar ${selectedVersion}`);
      const data = await response.json();
      useFloorPlanStore.getState().importRoomPlan(data);
    } catch (err) {
      console.error(err);
      alert(`Erro ao carregar o arquivo ${selectedVersion}.`);
    }
  };

  const handleExportDiff = () => {
    const plan = useFloorPlanStore.getState().plan;
    const diff = generatePlanDiff(plan);
    console.log('--- DIFF PARA A IA ---');
    console.log(JSON.stringify(diff, null, 2));
    alert('Diff gerado com sucesso! (Ver console)');
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Exportar Diff (IA)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <PropertyPanel />
        {/* Painel Esquerdo: 2D Editor */}
        <div className="flex-1 flex flex-col border-r border-border relative">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border shadow-sm rounded-md px-3 py-1 text-sm font-medium text-foreground">
            Editor 2D
          </div>
          <Editor2D />
        </div>

        {/* Painel Direito: 3D Viewer */}
        <div className="flex-1 flex flex-col relative bg-muted/10">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border shadow-sm rounded-md px-3 py-1 text-sm font-medium text-foreground">
            Visualizador 3D
          </div>
          <Viewer3D />
        </div>
      </div>
    </div>
  );
}
