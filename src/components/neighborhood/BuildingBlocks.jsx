import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { groundHeight } from './terrain.js';

const PANEL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#173b57', metalness: 0.45, roughness: 0.36 });
const PANEL_GRID_MATERIAL = new THREE.MeshStandardMaterial({ color: '#80b6c6', metalness: 0.25, roughness: 0.38 });
const WINDOW_MATERIAL = new THREE.MeshStandardMaterial({ color: '#9cc5cb', metalness: 0.12, roughness: 0.25 });
const DOOR_MATERIAL = new THREE.MeshStandardMaterial({ color: '#624638', roughness: 0.82 });
const CONCRETE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#85847d', roughness: 0.94 });

function SolarArray({ position = [0, 0, 0], count = 3, rotation = [0, 0, 0] }) {
  return <group position={position} rotation={rotation}>
    {Array.from({ length: count }).map((_, index) => <group key={index} position={[(index - (count - 1) / 2) * 0.72, 0.08, 0]}>
      <mesh castShadow><boxGeometry args={[0.66, 0.08, 1.05]} /><primitive object={PANEL_MATERIAL} attach="material" /></mesh>
      <mesh position={[0, 0.052, 0]}><boxGeometry args={[0.6, 0.014, 0.98]} /><primitive object={PANEL_GRID_MATERIAL} attach="material" /></mesh>
      <mesh position={[0, 0.062, 0]}><boxGeometry args={[0.012, 0.014, 0.98]} /><meshBasicMaterial color="#bad9df" /></mesh>
      <mesh position={[0, 0.062, 0]} rotation-y={Math.PI / 2}><boxGeometry args={[0.012, 0.014, 0.6]} /><meshBasicMaterial color="#bad9df" /></mesh>
    </group>)}
  </group>;
}

export function HouseBlock({ plot, selected, onSelect }) {
  const home = plot.home;
  const floors = plot.floors;
  const height = floors * 2.85;
  const width = plot.width;
  const depth = plot.depth;
  const installations = home?.installations || [];
  const solar = installations.includes('solar') || installations.includes('offgrid') || plot.hasDemoSolar;
  const hasHeater = installations.includes('heater');
  const hasBiodigester = installations.includes('biodigester');
  const base = groundHeight(plot.x, plot.z);
  const detailColor = plot.variation % 2 === 0 ? '#e7d2ad' : '#c4b4a1';

  return <group
    position={[plot.x, base + 0.04, plot.z]}
    onClick={(event) => {
      event.stopPropagation();
      onSelect?.(plot);
    }}
  >
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={plot.color} roughness={0.92} />
    </mesh>
    <mesh position={[0, height + 0.12, 0]} castShadow receiveShadow>
      <boxGeometry args={[width + 0.36, 0.24, depth + 0.36]} />
      <primitive object={CONCRETE_MATERIAL} attach="material" />
    </mesh>
    <mesh position={[0, 0.98, depth / 2 + 0.035]} castShadow>
      <boxGeometry args={[0.95, 1.92, 0.09]} />
      <primitive object={DOOR_MATERIAL} attach="material" />
    </mesh>
    {[-width * 0.29, width * 0.29].map((x) => <group key={x} position={[x, 1.65, depth / 2 + 0.055]}>
      <mesh><boxGeometry args={[1.0, 0.82, 0.09]} /><primitive object={WINDOW_MATERIAL} attach="material" /></mesh>
      <mesh position={[0, 0, 0.055]}><boxGeometry args={[1.08, 0.08, 0.045]} /><meshStandardMaterial color={detailColor} /></mesh>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.07, 0.9, 0.05]} /><meshStandardMaterial color="#eee1c8" /></mesh>
    </group>)}
    {floors > 1 && <>
      <mesh position={[0, 3.35, depth / 2 + 0.12]} castShadow>
        <boxGeometry args={[width * 0.72, 0.16, 0.55]} />
        <meshStandardMaterial color="#aaa59b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.86, depth / 2 + 0.38]}>
        <boxGeometry args={[width * 0.45, 0.78, 0.06]} />
        <meshStandardMaterial color="#8b9b9a" metalness={0.35} roughness={0.65} />
      </mesh>
    </>}
    {plot.variation % 3 === 0 && <mesh position={[0, height - 0.45, depth / 2 + 0.1]}>
      <boxGeometry args={[width * 0.62, 0.12, 0.9]} />
      <meshStandardMaterial color="#a75e43" roughness={0.9} />
    </mesh>}
    <mesh position={[-width * 0.28, height + 0.75, -depth * 0.22]} castShadow>
      <cylinderGeometry args={[0.62, 0.62, 1.2, 16]} />
      <meshStandardMaterial color="#1e6b9b" roughness={0.62} />
    </mesh>
    <mesh position={[-width * 0.28, height + 1.37, -depth * 0.22]}>
      <cylinderGeometry args={[0.62, 0.62, 0.06, 16]} />
      <meshStandardMaterial color="#174c70" roughness={0.6} />
    </mesh>
    {solar && <SolarArray position={[width * 0.12, height + 0.25, -depth * 0.1]} count={Math.max(2, Math.min(4, Math.round(width / 2.2)))} rotation={[-0.12, 0, 0]} />}
    {hasHeater && <group position={[width * 0.28, height + 0.55, depth * 0.18]}>
      <mesh><cylinderGeometry args={[0.19, 0.19, 1.1, 14]} /><meshStandardMaterial color="#c5d1d1" metalness={0.45} roughness={0.32} /></mesh>
      <mesh position={[0, 0.58, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.055, 0.055, 0.68, 10]} /><meshStandardMaterial color="#7d969a" /></mesh>
    </group>}
    {hasBiodigester && <mesh position={[width / 2 + 0.72, 0.5, -depth * 0.25]} castShadow>
      <cylinderGeometry args={[0.48, 0.52, 0.9, 14]} />
      <meshStandardMaterial color="#71876c" roughness={0.9} />
    </mesh>}
    <mesh position={[0, 0.025, 0]}>
      <boxGeometry args={[width + 1.1, 0.06, depth + 1.1]} />
      <meshStandardMaterial color={selected ? '#9cbd9d' : '#b4a995'} roughness={1} />
    </mesh>
    {selected && <mesh position={[0, 0.09, 0]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[Math.max(width, depth) * 0.58, Math.max(width, depth) * 0.67, 48]} />
      <meshBasicMaterial color="#f2c65c" transparent opacity={0.95} side={THREE.DoubleSide} />
    </mesh>}
    <mesh position={[0, height + 1.52, 0]}>
      <sphereGeometry args={[0.1, 10, 10]} />
      <meshBasicMaterial color={selected ? '#f2c65c' : '#fff1cb'} />
    </mesh>
  </group>;
}

export function LocalBusiness({ place, onSelect }) {
  const { x, z, width, depth, type } = place;
  const isBakery = type === 'bakery';
  const isMarket = type === 'market';
  const labelColor = isBakery ? '#a85e3c' : '#326e59';
  const base = groundHeight(x, z);
  return <group position={[x, base + 0.05, z]} onClick={(event) => { event.stopPropagation(); onSelect?.(place); }}>
    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, 3.4, depth]} /><meshStandardMaterial color={isBakery ? '#d5a779' : '#c7b69c'} roughness={0.9} />
    </mesh>
    <mesh position={[0, 3.48, 0]} castShadow>
      <boxGeometry args={[width + 0.35, 0.18, depth + 0.35]} /><primitive object={CONCRETE_MATERIAL} attach="material" />
    </mesh>
    <mesh position={[0, 2.82, depth / 2 + 0.065]}>
      <boxGeometry args={[width * 0.82, 0.55, 0.12]} /><meshStandardMaterial color={labelColor} roughness={0.7} />
    </mesh>
    <mesh position={[0, 1.05, depth / 2 + 0.075]}>
      <boxGeometry args={[1.12, 1.9, 0.1]} /><meshStandardMaterial color="#5e473a" roughness={0.85} />
    </mesh>
    {[-width * 0.28, width * 0.28].map((windowX) => <mesh key={windowX} position={[windowX, 1.7, depth / 2 + 0.08]}>
      <boxGeometry args={[1.0, 0.9, 0.1]} /><primitive object={WINDOW_MATERIAL} attach="material" />
    </mesh>)}
    <mesh position={[width * 0.34, 2.2, depth / 2 + 0.22]} rotation-x={-0.1}>
      <boxGeometry args={[width * 0.35, 0.14, 0.62]} /><meshStandardMaterial color={isBakery ? '#e0a05f' : '#e7d07a'} roughness={0.82} />
    </mesh>
    <mesh position={[0, 3.58, 0]}>
      <boxGeometry args={[width - 0.25, 0.12, depth - 0.25]} /><meshStandardMaterial color="#81776c" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.025, 0]}>
      <boxGeometry args={[width + 0.9, 0.05, depth + 0.9]} /><meshStandardMaterial color="#b8ad9c" />
    </mesh>
    <Html position={[0, 4.25, 0]} center distanceFactor={27} style={{ pointerEvents: 'none' }}><span className="neighborhood-world-label">{place.title}</span></Html>
  </group>;
}

export function PublicBuilding({ place, onSelect }) {
  const base = groundHeight(place.x, place.z);
  const isSchool = place.type === 'school';
  const isClinic = place.type === 'clinic';
  const height = isSchool ? 4.7 : 3.8;
  const color = isSchool ? '#dfd3b6' : isClinic ? '#d8d7cb' : '#d5c49e';
  return <group position={[place.x, base + 0.05, place.z]} onClick={(event) => { event.stopPropagation(); onSelect?.(place); }}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[place.width, height, place.depth]} /><meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    <mesh position={[0, height + 0.12, 0]} castShadow>
      <boxGeometry args={[place.width + 0.4, 0.22, place.depth + 0.4]} /><primitive object={CONCRETE_MATERIAL} attach="material" />
    </mesh>
    <mesh position={[0, 1.25, place.depth / 2 + 0.06]}>
      <boxGeometry args={[1.05, 2.35, 0.1]} /><primitive object={DOOR_MATERIAL} attach="material" />
    </mesh>
    {[-place.width * 0.28, 0, place.width * 0.28].map((x) => <mesh key={x} position={[x, 2.45, place.depth / 2 + 0.07]}>
      <boxGeometry args={[1.0, 0.82, 0.1]} /><primitive object={WINDOW_MATERIAL} attach="material" />
    </mesh>)}
    <mesh position={[0, height + 0.5, -place.depth * 0.12]}>
      <boxGeometry args={[Math.min(5.8, place.width * 0.66), 0.12, 1.1]} /><meshStandardMaterial color="#315f52" roughness={0.8} />
    </mesh>
    <SolarArray position={[0, height + 0.38, -place.depth * 0.1]} count={isSchool ? 5 : 3} />
    {isClinic && <mesh position={[0, 2.9, place.depth / 2 + 0.14]}>
      <boxGeometry args={[0.18, 1.05, 0.06]} /><meshBasicMaterial color="#b64e42" />
    </mesh>}
    {isClinic && <mesh position={[0, 2.9, place.depth / 2 + 0.15]}>
      <boxGeometry args={[0.85, 0.18, 0.06]} /><meshBasicMaterial color="#b64e42" />
    </mesh>}
    <mesh position={[0, 0.03, 0]}>
      <boxGeometry args={[place.width + 1.1, 0.06, place.depth + 1.1]} /><meshStandardMaterial color="#b7ab97" />
    </mesh>
    <Html position={[0, height + 1.05, 0]} center distanceFactor={27} style={{ pointerEvents: 'none' }}><span className="neighborhood-world-label">{place.title}</span></Html>
  </group>;
}

export function EnergyHub({ place, onSelect }) {
  const base = groundHeight(place.x, place.z);
  return <group position={[place.x, base + 0.05, place.z]} onClick={(event) => { event.stopPropagation(); onSelect?.(place); }}>
    <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
      <boxGeometry args={[8.4, 2.2, 7.6]} /><meshStandardMaterial color="#c7d0ba" roughness={0.9} />
    </mesh>
    <mesh position={[0, 2.27, 0]}>
      <boxGeometry args={[8.8, 0.16, 8]} /><primitive object={CONCRETE_MATERIAL} attach="material" />
    </mesh>
    <SolarArray position={[-1.2, 2.42, 0]} count={4} />
    <mesh position={[2.6, 0.75, 2.3]} castShadow>
      <boxGeometry args={[1.15, 1.5, 1.05]} /><meshStandardMaterial color="#4f6670" metalness={0.25} roughness={0.65} />
    </mesh>
    <mesh position={[2.6, 0.8, 2.84]}>
      <boxGeometry args={[0.72, 0.6, 0.03]} /><meshStandardMaterial color="#8fb8a3" emissive="#426b55" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[0, 0.03, 0]}>
      <boxGeometry args={[10.2, 0.06, 9.2]} /><meshStandardMaterial color="#b7ab97" />
    </mesh>
    <Html position={[0, 3.35, 0]} center distanceFactor={27} style={{ pointerEvents: 'none' }}><span className="neighborhood-world-label">{place.title}</span></Html>
  </group>;
}

export function SportsCourt({ place, onSelect }) {
  const base = groundHeight(place.x, place.z);
  return <group position={[place.x, base + 0.06, place.z]} onClick={(event) => { event.stopPropagation(); onSelect?.(place); }}>
    <mesh receiveShadow><boxGeometry args={[place.width, 0.16, place.depth]} /><meshStandardMaterial color="#52765d" roughness={0.9} /></mesh>
    <mesh position={[0, 0.09, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[place.width - 1, place.depth - 1]} /><meshStandardMaterial color="#9b9b83" roughness={0.92} />
    </mesh>
    <mesh position={[0, 0.19, 0]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[3.5, 3.62, 48]} /><meshBasicMaterial color="#f0e9d4" side={THREE.DoubleSide} />
    </mesh>
    {[-1, 1].map((sign) => <group key={sign} position={[sign * (place.width / 2 - 0.45), 0, 0]}>
      <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.12, 2.7, 0.12]} /><meshStandardMaterial color="#eeeeea" /></mesh>
      <mesh position={[0, 2.65, 0]}><boxGeometry args={[1.4, 0.12, 0.12]} /><meshStandardMaterial color="#eeeeea" /></mesh>
      <mesh position={[0, 1.35, 0.7]}><boxGeometry args={[0.08, 2.4, 0.08]} /><meshStandardMaterial color="#eeeeea" /></mesh>
    </group>)}
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.08, 0.03, place.depth - 1]} /><meshBasicMaterial color="#f0e9d4" /></mesh>
    {[-place.depth / 2 + 0.5, place.depth / 2 - 0.5].map((z) => <mesh key={z} position={[0, 0.2, z]}><boxGeometry args={[place.width - 1, 0.03, 0.08]} /><meshBasicMaterial color="#f0e9d4" /></mesh>)}
    <Html position={[0, 2.1, 0]} center distanceFactor={32} style={{ pointerEvents: 'none' }}><span className="neighborhood-world-label">{place.title}</span></Html>
  </group>;
}

function Bench({ position, rotation = 0 }) {
  return <group position={position} rotation-y={rotation}>
    <mesh position={[0, 0.48, 0]}><boxGeometry args={[1.8, 0.14, 0.48]} /><meshStandardMaterial color="#8b6848" roughness={0.9} /></mesh>
    {[-0.65, 0.65].map((x) => <mesh key={x} position={[x, 0.23, 0]}><boxGeometry args={[0.12, 0.5, 0.35]} /><meshStandardMaterial color="#5f6260" metalness={0.45} /></mesh>)}
  </group>;
}

export function CommunitySquare({ place, onSelect }) {
  const base = groundHeight(place.x, place.z);
  return <group position={[place.x, base + 0.05, place.z]} onClick={(event) => { event.stopPropagation(); onSelect?.(place); }}>
    <mesh position={[0, 0.06, 0]} receiveShadow><boxGeometry args={[place.width, 0.14, place.depth]} /><meshStandardMaterial color="#b5ad99" roughness={0.94} /></mesh>
    <mesh position={[0, 0.14, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[place.width - 2, place.depth - 2]} /><meshStandardMaterial color="#c7c0ad" roughness={0.96} /></mesh>
    <Bench position={[-5, 0.15, -4]} /><Bench position={[5, 0.15, 4]} rotation={Math.PI} />
    <Tree position={[-6.5, 0.15, 5.5]} scale={0.9} />
    <Tree position={[6.5, 0.15, -5.5]} scale={0.85} />
    <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[1.25, 1.25, 0.22, 24]} /><meshStandardMaterial color="#8c9a86" /></mesh>
    <Html position={[0, 2.0, 0]} center distanceFactor={32} style={{ pointerEvents: 'none' }}><span className="neighborhood-world-label">{place.title}</span></Html>
  </group>;
}

export function Tree({ position = [0, 0, 0], scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.05, 0]} castShadow><cylinderGeometry args={[0.16, 0.25, 2.1, 9]} /><meshStandardMaterial color="#71523d" roughness={1} /></mesh>
    <mesh position={[0, 2.55, 0]} castShadow><icosahedronGeometry args={[1.18, 1]} /><meshStandardMaterial color="#54795a" roughness={1} /></mesh>
    <mesh position={[0.62, 2.25, 0.12]} castShadow><icosahedronGeometry args={[0.72, 1]} /><meshStandardMaterial color="#6c8b61" roughness={1} /></mesh>
    <mesh position={[-0.55, 2.2, -0.18]} castShadow><icosahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color="#476d53" roughness={1} /></mesh>
  </group>;
}

export function UtilityPole({ position, isNight = false, lampActive = true }) {
  return <group position={position}>
    <mesh position={[0, 4.15, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, 8.3, 10]} /><meshStandardMaterial color="#6c6b64" roughness={0.92} /></mesh>
    <mesh position={[0, 7.55, 0]}><boxGeometry args={[2.1, 0.16, 0.16]} /><meshStandardMaterial color="#66584a" /></mesh>
    {[-0.75, 0, 0.75].map((x) => <mesh key={x} position={[x, 7.78, 0]}><cylinderGeometry args={[0.065, 0.065, 0.45, 8]} /><meshStandardMaterial color="#4d4d48" /></mesh>)}
    <mesh position={[0, 6.2, 0.28]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.95, 14]} /><meshStandardMaterial color="#596b59" metalness={0.35} roughness={0.65} /></mesh>
    <mesh position={[0.9, 7.25, 0]} rotation-z={-0.06}><boxGeometry args={[0.9, 0.09, 0.16]} /><meshStandardMaterial color="#5f6868" /></mesh>
    <mesh position={[1.22, 7.15, 0]}><boxGeometry args={[0.35, 0.11, 0.28]} /><meshStandardMaterial color={isNight && lampActive ? '#f9e0a0' : '#b8c2bd'} emissive={isNight && lampActive ? '#f5c967' : '#000000'} emissiveIntensity={isNight && lampActive ? 1.2 : 0} /></mesh>
    {isNight && lampActive && <pointLight position={[1.15, 6.95, 0]} color="#ffe4a4" intensity={0.7} distance={13} decay={2} />}
  </group>;
}

export function CableSegment({ start, end }) {
  const curve = useMemo(() => {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, sy, sz),
      new THREE.Vector3((sx + ex) / 2, Math.min(sy, ey) - 0.9, (sz + ez) / 2),
      new THREE.Vector3(ex, ey, ez)
    ]);
  }, [start, end]);
  return <mesh>
    <tubeGeometry args={[curve, 18, 0.025, 5, false]} />
    <meshStandardMaterial color="#3c4140" roughness={0.85} />
  </mesh>;
}

export function ParkedCar({ position, color = '#788b8e', rotation = 0 }) {
  return <group position={position} rotation-y={rotation}>
    <mesh position={[0, 0.62, 0]} castShadow><boxGeometry args={[2.1, 0.82, 4.1]} /><meshStandardMaterial color={color} metalness={0.12} roughness={0.55} /></mesh>
    <mesh position={[0, 1.16, -0.25]}><boxGeometry args={[1.68, 0.56, 2.0]} /><meshStandardMaterial color="#8ea8ad" metalness={0.3} roughness={0.25} /></mesh>
    {[-1, 1].map((side) => [-1.3, 1.3].map((z) => <mesh key={`${side}-${z}`} position={[side * 1.02, 0.42, z]} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.38, 0.38, 0.18, 16]} /><meshStandardMaterial color="#242625" roughness={1} />
    </mesh>))}
    <mesh position={[0, 0.72, 2.08]}><boxGeometry args={[0.35, 0.18, 0.06]} /><meshBasicMaterial color="#f6e3ac" /></mesh>
  </group>;
}

export function WalkingPerson({ start = [0, 0], color = '#315f74', phase = 0, lowMotion = false }) {
  const personRef = useRef();
  useFrame((state) => {
    if (!personRef.current || lowMotion) return;
    const time = state.clock.elapsedTime * 0.22 + phase;
    const x = start[0] + Math.sin(time) * 2.1;
    const z = start[1] + Math.cos(time * 0.72) * 1.2;
    personRef.current.position.set(x, groundHeight(x, z), z);
    personRef.current.rotation.y = Math.atan2(Math.cos(time), -Math.sin(time) * 0.72);
  });
  const y = groundHeight(start[0], start[1]);
  return <group ref={personRef} position={[start[0], y, start[1]]}>
    <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.28, 0.72, 4, 8]} /><meshStandardMaterial color={color} roughness={0.86} /></mesh>
    <mesh position={[0, 1.67, 0]} castShadow><sphereGeometry args={[0.22, 12, 10]} /><meshStandardMaterial color="#9b7058" roughness={0.9} /></mesh>
    <mesh position={[0, 1.82, -0.025]}><sphereGeometry args={[0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><meshStandardMaterial color="#302b29" /></mesh>
    <mesh position={[-0.2, 0.3, 0.02]}><boxGeometry args={[0.17, 0.58, 0.2]} /><meshStandardMaterial color="#4a4843" /></mesh>
    <mesh position={[0.2, 0.3, 0.02]}><boxGeometry args={[0.17, 0.58, 0.2]} /><meshStandardMaterial color="#4a4843" /></mesh>
  </group>;
}


export function BusStop({ position }) {
  return <group position={position}>
    <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[2.9, 0.12, 1.45]} /><meshStandardMaterial color="#526b61" roughness={0.82} /></mesh>
    {[-1.28, 1.28].map((x) => <mesh key={x} position={[x, 0.82, 0]}><boxGeometry args={[0.1, 1.65, 0.1]} /><meshStandardMaterial color="#5c6660" metalness={0.35} /></mesh>)}
    <mesh position={[0, 0.12, -0.55]}><boxGeometry args={[1.9, 0.18, 0.5]} /><meshStandardMaterial color="#8d775c" roughness={0.9} /></mesh>
    <mesh position={[0, 1.65, 0.68]}><boxGeometry args={[0.46, 1.0, 0.08]} /><meshStandardMaterial color="#e0c16f" /></mesh>
    <mesh position={[0, 0.04, 0]}><boxGeometry args={[3.2, 0.06, 1.8]} /><meshStandardMaterial color="#a89d8c" roughness={1} /></mesh>
  </group>;
}

export function SolarLamp({ position, isNight = false }) {
  return <group position={position}>
    <mesh position={[0, 1.9, 0]} castShadow><cylinderGeometry args={[0.055, 0.08, 3.8, 9]} /><meshStandardMaterial color="#586c61" metalness={0.45} roughness={0.62} /></mesh>
    <mesh position={[0.22, 3.78, 0]} rotation-z={-0.08}><boxGeometry args={[0.95, 0.08, 0.5]} /><meshStandardMaterial color="#23495d" metalness={0.35} /></mesh>
    <mesh position={[0.22, 3.71, 0]}><boxGeometry args={[0.68, 0.09, 0.2]} /><meshStandardMaterial color={isNight ? '#f7e4a4' : '#a8b5b1'} emissive={isNight ? '#f0c765' : '#000000'} emissiveIntensity={isNight ? 1 : 0} /></mesh>
    {isNight && <pointLight position={[0.22, 3.55, 0]} color="#ffe1a0" intensity={0.48} distance={9} />}
  </group>;
}
