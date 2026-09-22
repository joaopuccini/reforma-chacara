import { FloorPlan, Point2D } from '../types';

/**
 * Calculates the polygon area using the Shoelace formula.
 * Returns signed area.
 */
function polygonArea(points: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    let j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return area / 2;
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon.
 */
function pointInPolygon(point: {x: number, y: number}, vs: Point2D[]): boolean {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Gets distance from point to segment, and the projected point on the segment.
 */
function pointToSegment(px: number, py: number, p1x: number, p1y: number, p2x: number, p2y: number) {
  const l2 = Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2);
  if (l2 === 0) return { dist: Math.hypot(px - p1x, py - p1y), proj: { x: p1x, y: p1y } };
  let t = ((px - p1x) * (p2x - p1x) + (py - p1y) * (p2y - p1y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = p1x + t * (p2x - p1x);
  const projY = p1y + t * (p2y - p1y);
  return { dist: Math.hypot(px - projX, py - projY), proj: { x: projX, y: projY } };
}

/**
 * Finds intersection between two line segments (if any).
 */
function getIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (d === 0) return null;
  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return { x: p1.x + u * (p2.x - p1.x), y: p1.y + u * (p2.y - p1.y) };
  }
  return null;
}

export function calculateRoomArea(x: number, y: number, plan: FloorPlan): number {
  // 1. Extract active edges
  const rawEdges = Object.values(plan.walls).filter(w => w.status !== 'removida');
  if (rawEdges.length === 0) return 0;

  // 2. Node the graph (split segments at intersections and T-junctions)
  const TOLERANCE = 15; // 15cm tolerance for snapping to walls
  let nextNodeId = 10000;
  
  // All points from the plan
  const nodes: Record<string, Point2D> = {};
  for (const p of Object.values(plan.points)) {
    nodes[p.id] = { ...p };
  }

  const getNewId = () => `node_${nextNodeId++}`;

  const segments = rawEdges.map(w => {
    return {
      pA: plan.points[w.pointA],
      pB: plan.points[w.pointB],
      internalNodes: [] as Point2D[]
    };
  }).filter(s => s.pA && s.pB);

  // A. Segment Intersections
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];
      const int = getIntersection(s1.pA, s1.pB, s2.pA, s2.pB);
      if (int) {
        const id = getNewId();
        const pt = { id, x: int.x, y: int.y };
        nodes[id] = pt;
        s1.internalNodes.push(pt);
        s2.internalNodes.push(pt);
      }
    }
  }

  // B. T-junctions (point close to a segment)
  for (const s of segments) {
    for (const p of Object.values(nodes)) {
      // Don't check endpoints against their own segment
      if (p.id === s.pA.id || p.id === s.pB.id) continue;
      
      const res = pointToSegment(p.x, p.y, s.pA.x, s.pA.y, s.pB.x, s.pB.y);
      if (res.dist < TOLERANCE) {
        // Project the point exactly onto the segment to ensure planarity
        // But to keep it simple, we just add the existing point to the segment
        s.internalNodes.push(p);
      }
    }
  }

  // 3. Build adjacency list for half-edges
  // adj[nodeId] = array of { to: nodeId, angle: rad, id: 'u_v' }
  const adj: Record<string, { to: string, angle: number, id: string }[]> = {};

  const addHalfEdge = (n1: Point2D, n2: Point2D) => {
    // Avoid zero-length edges
    if (Math.hypot(n1.x - n2.x, n1.y - n2.y) < 1) return;
    
    if (!adj[n1.id]) adj[n1.id] = [];
    if (!adj[n2.id]) adj[n2.id] = [];

    const angle12 = Math.atan2(n2.y - n1.y, n2.x - n1.x);
    const angle21 = Math.atan2(n1.y - n2.y, n1.x - n2.x);

    // Only add if not already present (avoid duplicates)
    if (!adj[n1.id].find(e => e.to === n2.id)) {
      adj[n1.id].push({ to: n2.id, angle: angle12, id: `${n1.id}_${n2.id}` });
      adj[n2.id].push({ to: n1.id, angle: angle21, id: `${n2.id}_${n1.id}` });
    }
  };

  // Subdivide segments
  for (const s of segments) {
    const pts = [s.pA, ...s.internalNodes, s.pB];
    // Sort points by distance from pA
    pts.sort((a, b) => Math.hypot(a.x - s.pA.x, a.y - s.pA.y) - Math.hypot(b.x - s.pA.x, b.y - s.pA.y));
    
    for (let i = 0; i < pts.length - 1; i++) {
      addHalfEdge(pts[i], pts[i+1]);
    }
  }

  // Sort adjacency lists by angle (counter-clockwise)
  for (const nodeId in adj) {
    adj[nodeId].sort((a, b) => a.angle - b.angle);
  }

  const visitedHalfEdges = new Set<string>();
  const faces: Point2D[][] = [];

  // 3. Extract faces
  for (const nodeId in adj) {
    for (let i = 0; i < adj[nodeId].length; i++) {
      const startEdge = adj[nodeId][i];
      if (visitedHalfEdges.has(startEdge.id)) continue;

      // Trace the face
      const face: Point2D[] = [];
      let currentEdge = startEdge;
      let currentNode = nodeId;
      
      let safetyCounter = 0;
      
      while (!visitedHalfEdges.has(currentEdge.id) && safetyCounter < 1000) {
        visitedHalfEdges.add(currentEdge.id);
        face.push(nodes[currentNode]);

        // The edge goes from currentNode -> nextNode
        const nextNode = currentEdge.to;
        
        // Find the reverse edge in nextNode's adjacency list (nextNode -> currentNode)
        const reverseEdges = adj[nextNode];
        const reverseIndex = reverseEdges.findIndex(e => e.to === currentNode);
        
        if (reverseIndex === -1) break; // Should never happen in an undirected graph

        // The next edge to take is the one immediately "left" (counter-clockwise) from the reverse edge.
        // Since the array is sorted by angle ascending (CCW), the next one is index + 1.
        // This keeps the face on the LEFT side of the traversal.
        const nextEdgeIndex = (reverseIndex + 1) % reverseEdges.length;
        
        currentNode = nextNode;
        currentEdge = reverseEdges[nextEdgeIndex];
        safetyCounter++;
      }

      if (face.length >= 3) {
        faces.push(face);
      }
    }
  }

  // 4. Find which face contains the point (x,y)
  let bestArea = 0;
  let minPositiveArea = Infinity;

  for (const face of faces) {
    // The area can be negative or positive depending on orientation
    // Wait, in our geometry, points.y is actually correctly standard if we use the same math,
    // but the pointInPolygon doesn't care about CW or CCW.
    const a = polygonArea(face);
    
    // An internal face (room) should be CCW so a > 0.
    // Let's just check absolute area if it's positive.
    if (a > 0 && pointInPolygon({x, y}, face)) {
      if (a < minPositiveArea) {
        minPositiveArea = a;
        bestArea = a;
      }
    }
  }

  if (bestArea > 0) {
    // Convert from cm² to m²
    const areaM2 = bestArea / 10000;
    // Round to 1 decimal place
    return Math.round(areaM2 * 10) / 10;
  }

  return 0;
}
