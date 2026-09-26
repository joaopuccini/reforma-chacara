import React, { useState, useRef, useEffect } from 'react';
import { Hand, PenTool, Hammer, Tag } from 'lucide-react';
import { useFloorPlanStore } from '../useFloorPlanStore';
import { Wall, Room } from '../types';
import { calculateRoomArea } from '../utils/geometry';

type EditorMode = 'pan' | 'draw' | 'demolish' | 'room';

export function Editor2D() {
  const { 
    plan, addPoint, addWall, removeWall, updateWallStatus, 
    selectedElement, setSelectedElement 
  } = useFloorPlanStore();
  
  // ViewBox state for pan and zoom
  const [vb, setVb] = useState({ x: -200, y: -1900, w: 1200, h: 2200 });
  const [mode, setMode] = useState<EditorMode>('pan');
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); // para diferenciar drag de click no pan
  
  // Undo/Redo keydown hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ferramentas de atalho
      if (e.key.toLowerCase() === 'h') setMode('pan');
      if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'w') setMode('draw');
      if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'x') setMode('demolish');

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            useFloorPlanStore.temporal.getState().redo();
          } else {
            useFloorPlanStore.temporal.getState().undo();
          }
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          useFloorPlanStore.temporal.getState().redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Draw mode state
  const [draftStart, setDraftStart] = useState<{ x: number, y: number, id?: string } | null>(null);
  const [draftEnd, setDraftEnd] = useState<{ x: number, y: number, id?: string } | null>(null);
  const [snapPoint, setSnapPoint] = useState<{ x: number, y: number, id?: string } | null>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);

  const updatePoint = useFloorPlanStore(state => state.updatePoint);

  const svgRef = useRef<SVGSVGElement>(null);

  // Helper para converter mouse de tela para coordenadas do grupo SVG
  const getSvgPoint = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = vb.w / rect.width;
    const scaleY = vb.h / rect.height;
    const svgX = vb.x + (e.clientX - rect.left) * scaleX;
    const svgY = vb.y + (e.clientY - rect.top) * scaleY;
    return { x: svgX, y: -svgY }; // y invertido pelo <g transform="scale(1, -1)">
  };

  const getSnapPoint = (x: number, y: number, tolerance = 40) => {
    let closestId: string | null = null;
    let minDistance = Infinity;
    for (const p of Object.values(plan.points)) {
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = p.id;
      }
    }
    if (closestId && minDistance <= tolerance) {
      const p = plan.points[closestId];
      return { x: p.x, y: p.y, id: p.id };
    }
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    // e.preventDefault() was throwing passive event listener errors
    const zoom = e.deltaY > 0 ? 1.1 : 0.9;
    setVb(prev => ({
      x: prev.x - (prev.w * (zoom - 1)) / 2,
      y: prev.y - (prev.h * (zoom - 1)) / 2,
      w: prev.w * zoom,
      h: prev.h * zoom
    }));
  };

  const handlePointPointerDown = (e: React.PointerEvent, pointId: string) => {
    if (mode === 'pan') {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraggingPointId(pointId);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // Only left or middle click
    
    if (mode === 'pan') {
      setIsDragging(true);
      setHasDragged(false);
    } else if (mode === 'draw') {
      e.currentTarget.setPointerCapture(e.pointerId);
      const pt = getSvgPoint(e);
      const snapped = getSnapPoint(pt.x, pt.y);
      setDraftStart(snapped);
      setDraftEnd(snapped);
      setIsDragging(true);
    } else if (mode === 'room') {
      const pt = getSvgPoint(e);
      const currentPlan = useFloorPlanStore.getState().plan;
      const computedArea = calculateRoomArea(pt.x, pt.y, currentPlan);
      const roomId = useFloorPlanStore.getState().addRoom(pt.x, pt.y, 'Novo Cômodo', computedArea);
      setSelectedElement({ type: 'room', id: roomId });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getSvgPoint(e);
    const snapped = getSnapPoint(pt.x, pt.y);
    setSnapPoint(snapped);

    if (draggingPointId) {
      updatePoint(draggingPointId, snapped.x, snapped.y);
      return;
    }

    if (!isDragging) return;
    
    if (mode === 'pan') {
      if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
        setHasDragged(true);
      }
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = vb.w / rect.width;
      const scaleY = vb.h / rect.height;

      setVb(prev => ({
        ...prev,
        x: prev.x - e.movementX * scaleX,
        y: prev.y - e.movementY * scaleY
      }));
    } else if (mode === 'draw' && draftStart) {
      setDraftEnd(snapped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingPointId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingPointId(null);
      return;
    }

    if (mode === 'draw') {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);

    if (mode === 'pan' && !hasDragged) {
      // Click no fundo deseleciona
      // Mas cuidado pra não limpar se ele clicou numa parede (propagation)
      // Vamos limpar apenas se clicou direto no SVG
      if (e.target === svgRef.current || (e.target as Element).tagName === 'rect' && (e.target as Element).getAttribute('fill') === 'transparent') {
        setSelectedElement(null);
      }
    }

    if (mode === 'draw' && draftStart && draftEnd) {
      // Se não for o mesmo ponto (evitar parede de tamanho 0)
      if (draftStart.x !== draftEnd.x || draftStart.y !== draftEnd.y) {
        // Encontrar ou criar ponto A
        const idA = draftStart.id || addPoint(draftStart.x, draftStart.y);
        // Encontrar ou criar ponto B
        const idB = draftEnd.id || addPoint(draftEnd.x, draftEnd.y);
        
        // Adicionar parede (planejada default)
        addWall(idA, idB, 15, 280, 'planejada');
      }
    }
    
    setDraftStart(null);
    setDraftEnd(null);
  };

  const handleWallClick = (e: React.MouseEvent, wallId: string) => {
    e.stopPropagation(); // Evitar que dispare cliques do SVG root
    if (mode === 'demolish') {
      const wall = plan.walls[wallId];
      if (wall.status === 'removida') {
        updateWallStatus(wallId, 'real');
      } else {
        removeWall(wallId);
      }
    } else if (mode === 'pan') {
      setSelectedElement({ type: 'wall', id: wallId });
    }
  };

  const handleOpeningClick = (e: React.MouseEvent, wallId: string, openingId: string) => {
    e.stopPropagation();
    if (mode === 'pan') {
      setSelectedElement({ type: 'opening', id: openingId, parentWallId: wallId });
    }
  };

  let cursorClass = 'cursor-default';
  if (mode === 'pan') cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';
  if (mode === 'draw') cursorClass = 'cursor-crosshair';
  if (mode === 'demolish') cursorClass = 'cursor-pointer';
  if (mode === 'room') cursorClass = 'cursor-crosshair';

  return (
    <div className="w-full h-full bg-background flex flex-col relative overflow-hidden">
      
      {/* Toolbar Flutuante */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:translate-x-0 w-[90%] max-w-sm md:w-auto md:top-4 md:bottom-auto md:left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-row justify-around md:flex-col gap-2 shadow-xl">
        <button 
          className={`p-3 rounded-lg transition-colors ${mode === 'pan' ? 'bg-primary/30 text-primary border border-primary/50' : 'hover:bg-white/10 text-white/70'}`}
          onClick={() => setMode('pan')}
          title="Navegar e Selecionar (Pan/Zoom)"
        >
          <Hand size={20} />
        </button>
        <button 
          className={`p-3 rounded-lg transition-colors ${mode === 'draw' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' : 'hover:bg-white/10 text-white/70'}`}
          onClick={() => setMode('draw')}
          title="Desenhar Parede (Planejada)"
        >
          <PenTool size={20} />
        </button>
        <button 
          className={`p-3 rounded-lg transition-colors ${mode === 'demolish' ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'hover:bg-white/10 text-white/70'}`}
          onClick={() => setMode('demolish')}
          title="Demolir Parede Existente"
        >
          <Hammer size={20} />
        </button>
        <button 
          className={`p-3 rounded-lg transition-colors ${mode === 'room' ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50' : 'hover:bg-white/10 text-white/70'}`}
          onClick={() => setMode('room')}
          title="Criar Cômodo"
        >
          <Tag size={20} />
        </button>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} 
        className={`w-full h-full ${cursorClass}`}
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g transform="scale(1, -1)"> {/* Inverter Y para matemática padrão */}
          {/* Background rect for deselect click */}
          <rect x={vb.x} y={-vb.y-vb.h} width={vb.w} height={vb.h} fill="transparent" onClick={() => setSelectedElement(null)} />
          
          {Object.values(plan.walls as Record<string, Wall>).map((wall) => {
            const pA = plan.points[wall.pointA];
            const pB = plan.points[wall.pointB];
            
            if (!pA || !pB) return null;

            const isRemovida = wall.status === 'removida';
            const isPlanejada = wall.status === 'planejada';
            const isSelected = selectedElement?.type === 'wall' && selectedElement.id === wall.id;

            let stroke = 'currentColor'; // real
            if (isRemovida) stroke = '#ef4444'; // vermelho
            else if (isPlanejada) stroke = '#3b82f6'; // azul
            
            if (isSelected) stroke = '#eab308'; // amarelo para selecionado

            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const lengthCm = Math.hypot(dx, dy);
            const lengthM = (lengthCm / 100).toFixed(2);
            const midX = pA.x + dx / 2;
            const midY = pA.y + dy / 2;

            let angleText = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angleText > 90 || angleText < -90) {
              angleText += 180;
            }

            return (
              <g key={wall.id}>
                {/* Highlight/Glow for selected wall */}
                {isSelected && (
                  <line
                    x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                    stroke="#eab308" strokeWidth={wall.espessura_cm + 10} opacity={0.3}
                  />
                )}
                
                {/* Hitbox e linha principal da parede */}
                <g onClick={(e) => handleWallClick(e, wall.id)} style={{ cursor: mode === 'demolish' || mode === 'pan' ? 'pointer' : 'inherit' }}>
                  {/* Hitbox invisível para facilitar o clique */}
                  <line
                    x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                    stroke="transparent" strokeWidth={40}
                  />
                  
                  <line
                    x1={pA.x} 
                    y1={pA.y} 
                    x2={pB.x} 
                    y2={pB.y}
                    strokeWidth={wall.espessura_cm}
                    stroke={stroke}
                    strokeDasharray={isPlanejada || isRemovida ? '10,10' : 'none'}
                    opacity={isRemovida ? 0.3 : 1}
                    className="transition-all duration-200 hover:opacity-75"
                  />
                  
                  {/* Vértices */}
                  <circle 
                    cx={pA.x} cy={pA.y} r={wall.espessura_cm / 2 + 5} 
                    fill={stroke} opacity={isRemovida ? 0.3 : 1}
                    onPointerDown={(e) => handlePointPointerDown(e, wall.pointA)}
                    style={{ cursor: mode === 'pan' ? 'move' : 'inherit' }}
                    className="hover:scale-125 transition-transform"
                  />
                  <circle 
                    cx={pB.x} cy={pB.y} r={wall.espessura_cm / 2 + 5} 
                    fill={stroke} opacity={isRemovida ? 0.3 : 1}
                    onPointerDown={(e) => handlePointPointerDown(e, wall.pointB)}
                    style={{ cursor: mode === 'pan' ? 'move' : 'inherit' }}
                    className="hover:scale-125 transition-transform"
                  />
                </g>
                
                {/* Etiqueta de Medida (Comprimento) */}
                {lengthCm > 50 && (
                  <g 
                    transform={`translate(${midX}, ${midY}) rotate(${angleText}) scale(1, -1)`}
                    className="pointer-events-none select-none"
                  >
                    <rect x={-30} y={-10} width={60} height={20} fill="#111111" opacity={0.8} rx={4} />
                    <text
                      x={0} y={4}
                      textAnchor="middle"
                      fill={isRemovida ? '#ef4444' : '#9ca3af'}
                      fontSize="14"
                      fontWeight="500"
                    >
                      {lengthM}m
                    </text>
                  </g>
                )}

                {/* Aberturas (Portas/Janelas) */}
                {wall.aberturas?.map(op => {
                  const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
                  const angleDeg = angle * (180 / Math.PI);
                  const isOpSelected = selectedElement?.type === 'opening' && selectedElement.id === op.id;
                  
                  return (
                    <g 
                      key={op.id} 
                      transform={`translate(${pA.x}, ${pA.y}) rotate(${angleDeg})`}
                      onClick={(e) => handleOpeningClick(e, wall.id, op.id)}
                      style={{ cursor: mode === 'pan' ? 'pointer' : 'inherit' }}
                    >
                      {/* Highlight */}
                      {isOpSelected && (
                        <rect 
                          x={op.posicao_na_parede_cm - op.largura_cm / 2 - 5} 
                          y={-wall.espessura_cm / 2 - 5} 
                          width={op.largura_cm + 10} 
                          height={wall.espessura_cm + 10} 
                          fill="transparent"
                          stroke="#eab308"
                          strokeWidth={4}
                        />
                      )}
                      <rect 
                        x={op.posicao_na_parede_cm - op.largura_cm / 2} 
                        y={-wall.espessura_cm / 2} 
                        width={op.largura_cm} 
                        height={wall.espessura_cm} 
                        fill={op.tipo === 'porta' ? 'var(--color-background, #111)' : '#87ceeb'}
                        stroke={isOpSelected ? '#eab308' : stroke}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Rastro do mouse durante o desenho de uma parede */}
          {mode === 'draw' && draftStart && draftEnd && (
             <g>
               <line 
                 x1={draftStart.x} y1={draftStart.y} 
                 x2={draftEnd.x} y2={draftEnd.y} 
                 stroke="#3b82f6" strokeWidth={15} strokeDasharray="10,10" opacity={0.6} 
               />
               <circle cx={draftStart.x} cy={draftStart.y} r={7.5} fill="#3b82f6" />
               <circle cx={draftEnd.x} cy={draftEnd.y} r={7.5} fill="#3b82f6" />
             </g>
          )}

          {/* Indicador de Snap (Aparece um círculo amarelo quando chega perto de um vértice) */}
          {mode === 'draw' && snapPoint && snapPoint.id && (
            <circle cx={snapPoint.x} cy={snapPoint.y} r={20} fill="transparent" stroke="#eab308" strokeWidth={4} />
          )}

          {/* Renderizar Cômodos */}
          {Object.values(plan.rooms as Record<string, Room>).map((room) => {
            const isSelected = selectedElement?.type === 'room' && selectedElement.id === room.id;
            return (
              <g 
                key={room.id}
                transform={`translate(${room.labelPosition.x}, ${room.labelPosition.y}) scale(1, -1)`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'pan') setSelectedElement({ type: 'room', id: room.id });
                }}
                style={{ cursor: mode === 'pan' ? 'pointer' : 'inherit' }}
              >
                {/* Hitbox invisível maior para facilitar o clique */}
                <rect x={-60} y={-30} width={120} height={60} fill="transparent" />
                
                <circle cx={0} cy={0} r={25} fill={isSelected ? '#a855f7' : '#000000'} opacity={0.6} />
                <text 
                  x={0} 
                  y={4} 
                  textAnchor="middle" 
                  fill={isSelected ? '#ffffff' : '#a855f7'}
                  fontSize="24"
                  fontWeight="bold"
                  className="select-none"
                >
                  {room.nome}
                </text>
                {room.area_m2 > 0 && (
                  <text 
                    x={0} 
                    y={22} 
                    textAnchor="middle" 
                    fill="#9ca3af"
                    fontSize="16"
                    className="select-none"
                  >
                    {room.area_m2} m²
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
