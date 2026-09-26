import React from 'react';
import { X } from 'lucide-react';
import { useFloorPlanStore } from '../useFloorPlanStore';

export function PropertyPanel() {
  const { plan, selectedElement, setSelectedElement, updateWall, updateOpening, updateRoom } = useFloorPlanStore();

  if (!selectedElement) return null;

  const isWall = selectedElement.type === 'wall';
  const isOpening = selectedElement.type === 'opening';
  const isRoom = selectedElement.type === 'room';

  let wall = null;
  let opening = null;
  let room = null;

  if (isWall) {
    wall = plan.walls[selectedElement.id];
  } else if (isOpening && selectedElement.parentWallId) {
    wall = plan.walls[selectedElement.parentWallId];
    opening = wall?.aberturas.find(o => o.id === selectedElement.id);
  } else if (isRoom) {
    room = plan.rooms[selectedElement.id];
  }

  if (!wall && !opening && !room) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 w-full md:absolute md:top-4 md:right-4 z-30 md:w-80 bg-black/80 backdrop-blur-md border-t md:border border-white/10 rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col text-sm max-h-[50vh] md:max-h-none overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-white/90">
          Propriedades: {isWall ? 'Parede' : isOpening ? (opening?.tipo === 'porta' ? 'Porta' : 'Janela') : 'Cômodo'}
        </h3>
        <button 
          onClick={() => setSelectedElement(null)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        
        {isWall && wall && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Espessura (cm)</label>
              <input 
                type="number" 
                value={wall.espessura_cm} 
                onChange={(e) => updateWall(wall.id, { espessura_cm: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Pé-direito / Altura (cm)</label>
              <input 
                type="number" 
                value={wall.altura_cm} 
                onChange={(e) => updateWall(wall.id, { altura_cm: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Status</label>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white/70 capitalize">
                {wall.status}
              </div>
            </div>
          </>
        )}

        {isOpening && opening && wall && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Largura (cm)</label>
              <input 
                type="number" 
                value={opening.largura_cm} 
                onChange={(e) => updateOpening(wall.id, opening.id, { largura_cm: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Altura (cm)</label>
              <input 
                type="number" 
                value={opening.altura_cm} 
                onChange={(e) => updateOpening(wall.id, opening.id, { altura_cm: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Peitoril / Altura do chão (cm)</label>
              <input 
                type="number" 
                value={opening.peitoril_cm} 
                onChange={(e) => updateOpening(wall.id, opening.id, { peitoril_cm: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Posição na Parede (cm)</label>
              <input 
                type="range" 
                min={0} 
                max={Math.hypot(
                  plan.points[wall.pointB].x - plan.points[wall.pointA].x, 
                  plan.points[wall.pointB].y - plan.points[wall.pointA].y
                )}
                value={opening.posicao_na_parede_cm} 
                onChange={(e) => updateOpening(wall.id, opening.id, { posicao_na_parede_cm: Number(e.target.value) })}
                className="mt-2"
              />
              <span className="text-xs text-white/50 text-right">{Math.round(opening.posicao_na_parede_cm)} cm</span>
            </div>
          </>
        )}

        {isRoom && room && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Nome do Cômodo</label>
              <input 
                type="text" 
                value={room.nome} 
                onChange={(e) => updateRoom(room.id, { nome: e.target.value })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-xs">Área (m²)</label>
              <input 
                type="number"
                step="0.1" 
                value={room.area_m2} 
                onChange={(e) => updateRoom(room.id, { area_m2: Number(e.target.value) })}
                className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1 mt-2 p-2 bg-purple-500/10 rounded-md border border-purple-500/20">
              <span className="text-xs text-purple-200/70">
                A IA usará esta área para orçar o piso, pintura e forro automaticamente.
              </span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
