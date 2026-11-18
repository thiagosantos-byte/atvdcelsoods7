import React from 'react';
import { groundHeight } from './terrain.js';

export function OdsOverlay({ points, onSelect }) {
  return <group>
    {points.map((point) => {
      const [x, , z] = point.position;
      const y = groundHeight(x, z);
      return <group key={point.id} position={[x, y + 0.25, z]} onClick={(event) => { event.stopPropagation(); onSelect(point); }}>
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.9, 8]} />
          <meshBasicMaterial color="#e6bd55" transparent opacity={0.78} />
        </mesh>
        <mesh position={[0, 2.08, 0]}>
          <sphereGeometry args={[0.34, 18, 14]} />
          <meshStandardMaterial color="#f2c65c" emissive="#b9821d" emissiveIntensity={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.08, 0]}>
          <sphereGeometry args={[0.52, 18, 14]} />
          <meshBasicMaterial color="#f2c65c" wireframe transparent opacity={0.55} />
        </mesh>
      </group>;
    })}
  </group>;
}
