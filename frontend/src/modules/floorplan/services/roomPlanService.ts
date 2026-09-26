import { v4 as uuidv4 } from 'uuid';
import { FloorPlan, Point2D, Wall, Opening } from '../types';

export function parseRoomPlan(data: any): FloorPlan {
  const points: Record<string, Point2D> = {};
  const walls: Record<string, Wall> = {};
  
  // Snap tolerance in cm (25cm)
  const SNAP_TOLERANCE = 25;

  const getOrAddPoint = (x: number, y: number): string => {
    for (const p of Object.values(points)) {
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= SNAP_TOLERANCE) {
        return p.id;
      }
    }
    const id = uuidv4();
    points[id] = { id, x, y };
    return id;
  };

  // Helper to project a point onto a line segment and get relative position (0 to 1)
  const getRelativePosition = (px: number, py: number, p1x: number, p1y: number, p2x: number, p2y: number) => {
    const l2 = Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2);
    if (l2 === 0) return 0;
    let t = ((px - p1x) * (p2x - p1x) + (py - p1y) * (p2y - p1y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return t;
  };

  // Helper to get distance from point to line segment
  const distToSegment = (px: number, py: number, p1x: number, p1y: number, p2x: number, p2y: number) => {
    const l2 = Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2);
    if (l2 === 0) return Math.hypot(px - p1x, py - p1y);
    let t = ((px - p1x) * (p2x - p1x) + (py - p1y) * (p2y - p1y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = p1x + t * (p2x - p1x);
    const projY = p1y + t * (p2y - p1y);
    return Math.hypot(px - projX, py - projY);
  };

  // Base Y floor for distance calculation
  let floorY = 0;
  if (data.floors && data.floors.length > 0) {
    floorY = data.floors[0].transform[13]; // ty
  }

  // Parse Walls
  (data.walls || []).forEach((w: any) => {
    const width = w.dimensions[0] * 100;
    const height = w.dimensions[1] * 100;
    const thickness = w.dimensions[2] * 100 || 15; // default 15cm
    
    const m = w.transform;
    const ux = m[0];
    const uz = m[2];
    
    // translation
    const tx = m[12] * 100;
    const tz = m[14] * 100;

    // RoomPlan X maps to our X. RoomPlan Z maps to our -Y.
    const centerX = tx;
    const centerY = -tz;

    const p1x = centerX - (width / 2) * ux;
    const p1y = centerY - (width / 2) * (-uz);
    
    const p2x = centerX + (width / 2) * ux;
    const p2y = centerY + (width / 2) * (-uz);

    const pointA = getOrAddPoint(p1x, p1y);
    const pointB = getOrAddPoint(p2x, p2y);

    const wallId = uuidv4();
    walls[wallId] = {
      id: wallId,
      pointA,
      pointB,
      espessura_cm: thickness,
      altura_cm: height,
      status: 'real',
      aberturas: [],
      room_a: null,
      room_b: null,
      label: null,
      material: 'alvenaria',
      cor: null,
      textura: null
    };
  });

  // Helper to attach opening to closest wall
  const processOpenings = (items: any[], type: 'porta' | 'janela' | 'vao') => {
    if (!items) return;
    items.forEach(item => {
      const width = item.dimensions[0] * 100;
      const height = item.dimensions[1] * 100;
      
      const m = item.transform;
      const tx = m[12] * 100;
      const ty = m[13]; // in meters!
      const tz = m[14] * 100;
      
      const centerX = tx;
      const centerY = -tz;
      const distChao = (ty - (item.dimensions[1] / 2)) - floorY;

      // Encontrar parede mais próxima
      let closestWall: string | null = null;
      let minDistance = Infinity;
      let posRelativa = 0.5;

      for (const [wallId, wall] of Object.entries(walls)) {
        const p1 = points[wall.pointA];
        const p2 = points[wall.pointB];
        
        const dist = distToSegment(centerX, centerY, p1.x, p1.y, p2.x, p2.y);
        
        if (dist < minDistance) {
          minDistance = dist;
          closestWall = wallId;
          posRelativa = getRelativePosition(centerX, centerY, p1.x, p1.y, p2.x, p2.y);
        }
      }

      if (closestWall && minDistance < 50) {
        const wallIdStr = closestWall as string;
        const p1 = points[walls[wallIdStr].pointA];
        const p2_id = walls[wallIdStr].pointB;
        const p2_obj = points[p2_id];
        const wallLength = Math.hypot(p2_obj.x - p1.x, p2_obj.y - p1.y);

        const opening: Opening = {
          id: uuidv4(),
          tipo: type,
          posicao_na_parede_cm: posRelativa * wallLength,
          largura_cm: width,
          altura_cm: height,
          peitoril_cm: Math.max(0, distChao * 100),
          material: null,
          material_porta: null,
          estilo: null,
          cor: null,
          status: 'real'
        };
        walls[closestWall].aberturas.push(opening);
      }
    });
  };

  processOpenings(data.doors, 'porta');
  processOpenings(data.windows, 'janela');
  processOpenings(data.openings, 'vao');

  // Ajustar coordenadas para serem sempre positivas e centralizar perto do 0,0
  let minX = Infinity;
  let minY = Infinity;
  for (const p of Object.values(points)) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  
  // Offset to start at (0, 0)
  for (const p of Object.values(points)) {
    p.x -= minX;
    p.y -= minY;
  }

  return {
    points,
    walls,
    rooms: {}
  };
}
