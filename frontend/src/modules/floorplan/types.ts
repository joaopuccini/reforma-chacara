export type EntityStatus = 'real' | 'planejada' | 'removida';

export interface Point2D {
  id: string;
  x: number;
  y: number;
}

export interface Opening {
  id: string;
  tipo: 'porta' | 'janela' | 'vao';
  largura_cm: number;
  altura_cm: number;
  peitoril_cm: number; // Altura do chão (0 para porta, >0 para janela)
  posicao_na_parede_cm: number; // Distância do ponto A da parede
  material: string | null;
  cor: string | null;
  status: EntityStatus;
}

export interface Wall {
  id: string;
  pointA: string; // ID do Point2D
  pointB: string; // ID do Point2D
  espessura_cm: number;
  altura_cm: number; // Pé-direito, padrão ex: 280cm
  aberturas: Opening[];
  status: EntityStatus;
  room_a: string | null;
  room_b: string | null;
}

export interface Room {
  id: string;
  nome: string;
  area_m2: number;
  paredes: string[]; // IDs de Wall (usado p/ semântica de qual cômodo)
  status: EntityStatus;
  labelPosition: { x: number, y: number };
}

export interface FloorPlan {
  points: Record<string, Point2D>;
  walls: Record<string, Wall>;
  rooms: Record<string, Room>;
}
