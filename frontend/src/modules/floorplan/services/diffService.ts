import { FloorPlan, Wall, Opening } from '../types';

export interface PlanDiff {
  paredes_a_demolir: Wall[];
  paredes_a_construir: Wall[];
  aberturas_a_fechar: { wallId: string; opening: Opening }[];
  aberturas_novas: { wallId: string; opening: Opening }[];
}

export function generatePlanDiff(plan: FloorPlan): PlanDiff {
  const diff: PlanDiff = {
    paredes_a_demolir: [],
    paredes_a_construir: [],
    aberturas_a_fechar: [],
    aberturas_novas: [],
  };

  Object.values(plan.walls).forEach(wall => {
    if (wall.status === 'removida') {
      diff.paredes_a_demolir.push(wall);
    } else if (wall.status === 'planejada') {
      diff.paredes_a_construir.push(wall);
    }
    
    // Análise de aberturas na parede
    if (wall.status !== 'removida') {
      wall.aberturas.forEach(opening => {
        if (opening.status === 'removida') {
          diff.aberturas_a_fechar.push({ wallId: wall.id, opening });
        } else if (opening.status === 'planejada') {
          diff.aberturas_novas.push({ wallId: wall.id, opening });
        }
      });
    }
  });

  return diff;
}
