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
  
  let color = '#ffffff';
  let opacity = 1;

  if (wall.status === 'planejada') {
    color = '#add8e6';
    opacity = 0.6;
  } else if (wall.status === 'removida') {
    color = '#ff9999';
    opacity = 0.3;
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
        roughness={0.8}
        depthWrite={opacity === 1}
      />
    </mesh>
  );
}

export function Viewer3D() {
  const plan = useFloorPlanStore((state) => state.plan);

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
