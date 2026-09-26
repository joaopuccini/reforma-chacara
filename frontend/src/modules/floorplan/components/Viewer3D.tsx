import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { useFloorPlanStore } from '../useFloorPlanStore';
import { Wall, Point2D } from '../types';

interface Wall3DProps {
  wall: Wall;
  pA: Point2D;
  pB: Point2D;
}

function Wall3D({ wall, pA, pB }: Wall3DProps) {
  if (!pA || !pB) return null;

  const length = Math.hypot(pB.x - pA.x, pB.y - pA.y);
  const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
  
  const centerX = (pA.x + pB.x) / 2;
  const centerY = (pA.y + pB.y) / 2;
  const height = wall.altura_cm;
  
  let color = wall.cor || '#ffffff';
  let opacity = 1;
  let roughness = 0.8;
  let metalness = 0.1;

  if (wall.material === 'madeira') color = wall.cor || '#8b5a2b';
  else if (wall.material === 'vidro') {
    color = wall.cor || '#add8e6';
    opacity = 0.4;
    roughness = 0.1;
    metalness = 0.8;
  }
  else if (wall.material === 'pedra') {
    color = wall.cor || '#808080';
    roughness = 0.9;
  }
  else if (wall.material === 'concreto') {
    color = wall.cor || '#a9a9a9';
  }
  else if (wall.material === 'tijolo_aparente') {
    color = wall.cor || '#b22222';
  }

  if (wall.status === 'planejada') {
    color = '#3b82f6';
    opacity = Math.min(opacity, 0.6);
  } else if (wall.status === 'removida') {
    color = '#ef4444';
    opacity = Math.min(opacity, 0.3);
  }
  
  const geometry = useMemo(() => {
    const wallGeo = new THREE.BoxGeometry(length, wall.espessura_cm, height);
    const wallMesh = new THREE.Mesh(wallGeo);
    wallMesh.updateMatrix();

    if (!wall.aberturas || wall.aberturas.length === 0) {
      return wallGeo;
    }

    let bspWall = CSG.fromMesh(wallMesh);

    wall.aberturas.forEach(op => {
      // BoxGeometry in 3D: X is length, Y is espessura, Z is height
      const opGeo = new THREE.BoxGeometry(op.largura_cm, wall.espessura_cm + 10, op.altura_cm);
      const opMesh = new THREE.Mesh(opGeo);
      
      const opX = -length / 2 + op.posicao_na_parede_cm;
      const opZ = -height / 2 + op.peitoril_cm + op.altura_cm / 2;
      
      opMesh.position.set(opX, 0, opZ);
      opMesh.updateMatrix();

      const bspOp = CSG.fromMesh(opMesh);
      bspWall = bspWall.subtract(bspOp);
    });

    const finalMesh = CSG.toMesh(bspWall, new THREE.Matrix4());
    return finalMesh.geometry;
  }, [length, height, wall.espessura_cm, wall.aberturas]);
  
  return (
    <mesh 
      position={[centerX, centerY, height / 2]} 
      rotation={[0, 0, angle]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={color} 
        transparent={opacity < 1} 
        opacity={opacity} 
        roughness={roughness}
        metalness={metalness}
        depthWrite={opacity === 1}
      />
    </mesh>
  );
}

export function Viewer3D() {
  const plan = useFloorPlanStore((state) => state.plan);

  const { minX, minY, maxX, maxY } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(plan.points).forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    // Add margin
    return { 
      minX: minX === Infinity ? 0 : minX - 100, 
      minY: minY === Infinity ? 0 : minY - 100, 
      maxX: maxX === -Infinity ? 1000 : maxX + 100, 
      maxY: maxY === -Infinity ? 1000 : maxY + 100 
    };
  }, [plan.points]);

  const floorWidth = maxX - minX;
  const floorHeight = maxY - minY;
  const floorCenterX = (minX + maxX) / 2;
  const floorCenterY = (minY + maxY) / 2;

  return (
    <div className="w-full h-full bg-background/50 relative">
      <Canvas camera={{ position: [400, 2000, 500], fov: 50, far: 10000 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        {/* Helper Grid de piso */}
        <Grid infiniteGrid fadeDistance={4000} cellColor="#555555" sectionColor="#333333" />
        
        <OrbitControls makeDefault target={[400, 0, -850]} />
        
        {/* Rotação converte o plano XY (2D) para XZ (3D, chão) */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* Piso base */}
          <mesh position={[floorCenterX, floorCenterY, -0.1]}>
            <planeGeometry args={[floorWidth, floorHeight]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
          </mesh>

          {Object.values(plan.walls).map(wall => (
            <Wall3D 
              key={wall.id} 
              wall={wall} 
              pA={plan.points[wall.pointA]} 
              pB={plan.points[wall.pointB]} 
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
