import { FloorPlan } from '../types';

function getCardinalDirection(angle: number): string {
  // Normalize angle to [0, 360)
  let deg = (angle * 180) / Math.PI;
  if (deg < 0) deg += 360;

  // 0 is East, 90 is North (assuming Y points up, if Y points down then 90 is South)
  if (deg >= 315 || deg < 45) return 'Leste';
  if (deg >= 45 && deg < 135) return 'Norte';
  if (deg >= 135 && deg < 225) return 'Oeste';
  return 'Sul';
}

export function generateLabels(plan: FloorPlan): FloorPlan {
  const newPlan = { ...plan, walls: { ...plan.walls } };
  const usedLabels = new Set<string>();

  for (const roomId of Object.keys(plan.rooms)) {
    const room = plan.rooms[roomId];
    if (!room.paredes || room.paredes.length === 0) continue;

    const cx = room.labelPosition.x;
    const cy = room.labelPosition.y;

    for (const wallId of room.paredes) {
      const wall = plan.walls[wallId];
      if (!wall) continue;

      const pA = plan.points[wall.pointA];
      const pB = plan.points[wall.pointB];
      if (!pA || !pB) continue;

      const mx = (pA.x + pB.x) / 2;
      const my = (pA.y + pB.y) / 2;

      const angle = Math.atan2(my - cy, mx - cx);
      const cardinal = getCardinalDirection(angle);

      let labelBase = `${room.nome}-${cardinal}`;
      let finalLabel = labelBase;
      let counter = 1;

      while (usedLabels.has(finalLabel)) {
        finalLabel = `${labelBase}-${counter}`;
        counter++;
      }

      usedLabels.add(finalLabel);
      
      newPlan.walls[wallId] = {
        ...newPlan.walls[wallId],
        label: finalLabel,
        room_a: newPlan.walls[wallId].room_a || roomId
      };
    }
  }

  let externalCounter = 1;
  for (const wallId of Object.keys(newPlan.walls)) {
    if (!newPlan.walls[wallId].label) {
      newPlan.walls[wallId] = {
        ...newPlan.walls[wallId],
        label: `Parede-${externalCounter}`
      };
      externalCounter++;
    }
  }

  return newPlan;
}
