import { create } from 'zustand';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import { FloorPlan, Point2D, Wall, Opening, EntityStatus, Room } from './types';
import { detectRooms } from './utils/geometry';
import { generateLabels } from './utils/labelGenerator';

export interface SelectedElement {
  type: 'wall' | 'opening' | 'room';
  id: string;
  parentWallId?: string; // Usado para openings
}

export interface FloorPlanState {
  plan: FloorPlan;
  selectedElement: SelectedElement | null;
  
  // Actions
  addPoint: (x: number, y: number) => string;
  updatePoint: (pointId: string, x: number, y: number) => void;
  addWall: (pointA: string, pointB: string, espessura?: number, altura?: number, status?: EntityStatus) => string;
  updateWallStatus: (wallId: string, status: EntityStatus) => void;
  updateWall: (wallId: string, data: Partial<Wall>) => void;
  removeWall: (wallId: string) => void; // Apenas muda status para 'removida' se for 'real', ou deleta se 'planejada'
  addOpening: (wallId: string, opening: Omit<Opening, 'id'>) => string;
  updateOpeningStatus: (wallId: string, openingId: string, status: EntityStatus) => void;
  updateOpening: (wallId: string, openingId: string, data: Partial<Opening>) => void;
  
  addRoom: (x: number, y: number, name?: string, area_m2?: number) => string;
  updateRoom: (roomId: string, data: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;

  renameWall: (wallId: string, label: string) => void;
  autoDetectAndLabelRooms: () => void;

  setSelectedElement: (element: SelectedElement | null) => void;
  
  // Helpers
  loadPlan: (plan: FloorPlan) => void;
  importRoomPlan: (jsonData: any) => void;
  loadChacaraPlan: () => void;
  generateBaseSquare: () => void;
}

export const useFloorPlanStore = create<FloorPlanState>()(
  temporal(
    (set) => ({
      plan: {
        points: {},
        walls: {},
        rooms: {}
      },
      selectedElement: null,

      setSelectedElement: (element) => set({ selectedElement: element }),

  addPoint: (x: number, y: number) => {
    const id = uuidv4();
    set((state) => ({
      plan: {
        ...state.plan,
        points: { ...state.plan.points, [id]: { id, x, y } }
      }
    }));
    return id;
  },

  updatePoint: (pointId: string, x: number, y: number) => {
    set((state) => {
      const point = state.plan.points[pointId];
      if (!point) return state;
      return {
        plan: {
          ...state.plan,
          points: {
            ...state.plan.points,
            [pointId]: { ...point, x, y }
          }
        }
      };
    });
  },

  addWall: (pointA: string, pointB: string, espessura: number = 15, altura: number = 280, status: EntityStatus = 'planejada') => {
    const id = uuidv4();
    const newWall: Wall = {
      id,
      pointA,
      pointB,
      espessura_cm: espessura,
      altura_cm: altura,
      aberturas: [],
      status,
      room_a: null,
      room_b: null,
      label: null,
      material: 'alvenaria',
      cor: null,
      textura: null
    };

    set((state) => ({
      plan: {
        ...state.plan,
        walls: { ...state.plan.walls, [id]: newWall }
      }
    }));
    return id;
  },

  updateWallStatus: (wallId: string, status: EntityStatus) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, status }
          }
        }
      };
    });
  },

  updateWall: (wallId: string, data: Partial<Wall>) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, ...data }
          }
        }
      };
    });
  },

  renameWall: (wallId: string, label: string) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, label }
          }
        }
      };
    });
  },

  removeWall: (wallId: string) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;

      const newWalls = { ...state.plan.walls };
      
      if (wall.status === 'planejada') {
        // Se foi criada durante o planejamento e desistiu, apaga de vez
        delete newWalls[wallId];
      } else {
        // Se era 'real', marca como 'removida' (demolição)
        newWalls[wallId] = { ...wall, status: 'removida' };
      }

      return {
        plan: {
          ...state.plan,
          walls: newWalls
        }
      };
    });
  },

  addOpening: (wallId: string, openingData: Omit<Opening, 'id'>) => {
    const id = uuidv4();
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      
      const newOpening: Opening = { 
        ...openingData, 
        id,
        material_porta: null,
        estilo: null
      };
      
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, aberturas: [...wall.aberturas, newOpening] }
          }
        }
      };
    });
    return id;
  },

  updateOpeningStatus: (wallId: string, openingId: string, status: EntityStatus) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      
      const updatedAberturas = wall.aberturas.map(o => 
        o.id === openingId ? { ...o, status } : o
      );
      
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, aberturas: updatedAberturas }
          }
        }
      };
    });
  },

  updateOpening: (wallId: string, openingId: string, data: Partial<Opening>) => {
    set((state) => {
      const wall = state.plan.walls[wallId];
      if (!wall) return state;
      
      const updatedAberturas = wall.aberturas.map(o => 
        o.id === openingId ? { ...o, ...data } : o
      );
      
      return {
        plan: {
          ...state.plan,
          walls: {
            ...state.plan.walls,
            [wallId]: { ...wall, aberturas: updatedAberturas }
          }
        }
      };
    });
  },

  addRoom: (x: number, y: number, name: string = 'Novo Cômodo', area_m2: number = 0) => {
    const id = uuidv4();
    set((state) => ({
      plan: {
        ...state.plan,
        rooms: {
          ...state.plan.rooms,
          [id]: {
            id,
            nome: name,
            area_m2,
            paredes: [],
            status: 'planejada',
            labelPosition: { x, y },
            autoDetected: false
          }
        }
      }
    }));
    return id;
  },

  updateRoom: (roomId: string, data: Partial<Room>) => {
    set((state) => {
      const room = state.plan.rooms[roomId];
      if (!room) return state;
      return {
        plan: {
          ...state.plan,
          rooms: {
            ...state.plan.rooms,
            [roomId]: { ...room, ...data }
          }
        }
      };
    });
  },

  removeRoom: (roomId: string) => {
    set((state) => {
      const newRooms = { ...state.plan.rooms };
      delete newRooms[roomId];
      return {
        plan: {
          ...state.plan,
          rooms: newRooms
        }
      };
    });
  },

  loadPlan: (plan: FloorPlan) => set({ plan }),

  importRoomPlan: (jsonData: any) => {
    import('./services/roomPlanService').then(({ parseRoomPlan }) => {
      const newPlan = parseRoomPlan(jsonData);
      set({ plan: newPlan });
      useFloorPlanStore.getState().autoDetectAndLabelRooms();
    });
  },

  autoDetectAndLabelRooms: () => {
    set((state) => {
      const roomsArray = detectRooms(state.plan);
      const rooms: Record<string, Room> = {};
      
      // Keep user-defined rooms that weren't auto-detected, maybe?
      // For now, let's just merge or replace auto-detected ones.
      // To keep it simple: replace all rooms that are autoDetected, keep user ones.
      const existingUserRooms = Object.values(state.plan.rooms).filter(r => !r.autoDetected);
      for (const r of existingUserRooms) {
        rooms[r.id] = r;
      }
      for (const r of roomsArray) {
        rooms[r.id] = r;
      }

      let newPlan = { ...state.plan, rooms };
      newPlan = generateLabels(newPlan);

      return { plan: newPlan };
    });
  },

  generateBaseSquare: () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 300 },
      { x: 0, y: 300 }
    ];
    const points: Record<string, Point2D> = {};
    const pointIds = pts.map(p => {
      const id = uuidv4();
      points[id] = { id, x: p.x, y: p.y };
      return id;
    });

    const walls: Record<string, Wall> = {};
    for (let i = 0; i < pointIds.length; i++) {
      const p1 = pointIds[i];
      const p2 = pointIds[(i + 1) % pointIds.length];
      const wallId = uuidv4();
      walls[wallId] = {
        id: wallId,
        pointA: p1,
        pointB: p2,
        espessura_cm: 15,
        status: 'real',
        aberturas: [],
        altura_cm: 280,
        room_a: null,
        room_b: null,
        label: null,
        material: 'alvenaria',
        cor: null,
        textura: null
      };
    }
    set({ plan: { points, walls, rooms: {} } });
    useFloorPlanStore.getState().autoDetectAndLabelRooms();
  },

  loadChacaraPlan: () => {
    // Generate the exact floor plan from the user's measurements
    const pts = [
      { x: 0, y: 0 },       // 0: bottom-left
      { x: 804, y: 0 },     // 1: bottom-right
      { x: 804, y: 1701 },  // 2: top-right (flush on right)
      { x: 508, y: 1701 },  // 3: top-left of right room
      { x: 508, y: 1379 },  // 4: inner corner
      { x: 149, y: 1379 },  // 5: top-left of left room
      { x: 149, y: 785 },   // 6: inner corner (base square top)
      { x: 0, y: 785 }      // 7: top-left of base square
    ];

    const points: Record<string, Point2D> = {};
    const pointIds = pts.map(p => {
      const id = uuidv4();
      points[id] = { id, x: p.x, y: p.y };
      return id;
    });

    const walls: Record<string, Wall> = {};
    
    // Connect outer shell
    for (let i = 0; i < pointIds.length; i++) {
      const p1 = pointIds[i];
      const p2 = pointIds[(i + 1) % pointIds.length];
      const wallId = uuidv4();
      
      walls[wallId] = {
        id: wallId,
        pointA: p1,
        pointB: p2,
        espessura_cm: 15,
        status: 'real',
        aberturas: [],
        altura_cm: 280,
        room_a: null,
        room_b: null,
        label: null,
        material: 'alvenaria',
        cor: null,
        textura: null
      };
    }

    set({ plan: { points, walls, rooms: {} } });
    useFloorPlanStore.getState().autoDetectAndLabelRooms();
  }
})));

let timeoutId: any = null;
useFloorPlanStore.subscribe((state, prevState) => {
  if (state.plan !== prevState.plan) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      import('./utils/draftPersistence').then(({ saveDraft }) => {
        saveDraft(state.plan, null);
      });
    }, 2000);
  }
});
