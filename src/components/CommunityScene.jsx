import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Text, Sky } from '@react-three/drei';
import * as THREE from 'three';

const HOUSE_POSITIONS = [
  [-4.2, 0, -3.0], [-1.4, 0, -3.0], [1.4, 0, -3.0], [4.2, 0, -3.0],
  [-2.8, 0, 3.1], [2.8, 0, 3.1]
];
const HOUSE_COLORS = ['#d8c1a1', '#b4c8bd', '#d9b7a9', '#c7c2dc', '#ddcba9', '#b8c6d8'];

function Ground() {
  return <>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[30, 24]} /><meshStandardMaterial color="#8eaa8d" roughness={1} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.045, 0]}>
      <planeGeometry args={[30, 2.4]} /><meshStandardMaterial color="#606b70" roughness={0.92} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.04, 0]}>
      <planeGeometry args={[0.12, 2.4]} /><meshStandardMaterial color="#f5e7a9" />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.035, -6.4]}>
      <planeGeometry args={[22, 0.65]} /><meshStandardMaterial color="#a8b8a2" />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.035, 6.7]}>
      <planeGeometry args={[22, 0.65]} /><meshStandardMaterial color="#a8b8a2" />
    </mesh>
    {Array.from({ length: 13 }).map((_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[-12 + i * 2, -0.032, 0]}>
      <planeGeometry args={[0.72, 0.08]} /><meshStandardMaterial color="#d9dfd4" />
    </mesh>)}
  </>;
}

function Tree({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.65, 0]} castShadow><cylinderGeometry args={[0.09, 0.14, 1.3, 8]} /><meshStandardMaterial color="#75563d" /></mesh>
    <mesh position={[0, 1.55, 0]} castShadow><icosahedronGeometry args={[0.78, 1]} /><meshStandardMaterial color="#477a59" roughness={0.95} /></mesh>
    <mesh position={[0.42, 1.35, 0.1]} castShadow><icosahedronGeometry args={[0.48, 1]} /><meshStandardMaterial color="#5c8c64" roughness={0.95} /></mesh>
  </group>;
}

function StreetLamp({ position, lit }) {
  return <group position={position}>
    <mesh position={[0, 1.45, 0]}><cylinderGeometry args={[0.045, 0.065, 2.9, 10]} /><meshStandardMaterial color="#56636a" metalness={0.6} /></mesh>
    <mesh position={[0.28, 2.82, 0]} rotation-z={-0.15}><boxGeometry args={[0.62, 0.07, 0.12]} /><meshStandardMaterial color="#56636a" /></mesh>
    <mesh position={[0.52, 2.76, 0]}><boxGeometry args={[0.3, 0.1, 0.22]} /><meshStandardMaterial color={lit ? '#f7df92' : '#a8b1b0'} emissive={lit ? '#f9cf62' : '#000000'} emissiveIntensity={lit ? 1.6 : 0} /></mesh>
    {lit && <pointLight position={[0.5, 2.55, 0]} color="#ffe2a0" intensity={1.2} distance={3.6} />}
  </group>;
}

function SolarPanels({ position, rotation = [0, 0, 0], count = 3 }) {
  return <group position={position} rotation={rotation}>
    {Array.from({ length: count }).map((_, i) => <group key={i} position={[(i - (count - 1) / 2) * 0.52, 0.075, 0]}>
      <mesh castShadow><boxGeometry args={[0.47, 0.08, 0.52]} /><meshStandardMaterial color="#1b5e38" metalness={0.52} roughness={0.38} /></mesh>
      <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.42, 0.012, 0.47]} /><meshStandardMaterial color="#27864b" metalness={0.35} roughness={0.34} /></mesh>
      <mesh position={[0, 0.054, 0]}><boxGeometry args={[0.012, 0.012, 0.47]} /><meshStandardMaterial color="#b9e2c4" metalness={0.3} /></mesh>
    </group>)}
  </group>;
}

function House({ home, index, selected, onSelect }) {
  const position = HOUSE_POSITIONS[index];
  const installs = home.installations || [];
  const has = (id) => installs.includes(id);
  const roofColor = '#7d6257';
  return <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(home.id); }}>
    <mesh position={[0, 0.93, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.15, 1.8, 1.85]} /><meshStandardMaterial color={HOUSE_COLORS[index]} roughness={0.92} />
    </mesh>
    <mesh position={[0, 1.92, 0]} rotation-x={Math.PI / 4.6} castShadow>
      <boxGeometry args={[2.42, 0.13, 1.55]} /><meshStandardMaterial color={roofColor} roughness={0.85} />
    </mesh>
    <mesh position={[0, 1.92, 0]} rotation-x={-Math.PI / 4.6} castShadow>
      <boxGeometry args={[2.42, 0.13, 1.55]} /><meshStandardMaterial color="#8b6a5a" roughness={0.85} />
    </mesh>
    <mesh position={[0, 0.63, 0.934]} castShadow>
      <boxGeometry args={[0.43, 0.86, 0.06]} /><meshStandardMaterial color="#76513b" />
    </mesh>
    <mesh position={[-0.62, 1.16, 0.94]}>
      <boxGeometry args={[0.48, 0.42, 0.05]} /><meshStandardMaterial color="#8bb5c0" metalness={0.15} roughness={0.28} />
    </mesh>
    <mesh position={[0.62, 1.16, 0.94]}>
      <boxGeometry args={[0.48, 0.42, 0.05]} /><meshStandardMaterial color="#8bb5c0" metalness={0.15} roughness={0.28} />
    </mesh>
    {has('solar') && <SolarPanels position={[-0.32, 2.18, -0.36]} rotation={[Math.PI / 4.6, 0, 0]} count={3} />}
    {has('offgrid') && <>
      <SolarPanels position={[0.45, 2.18, 0.38]} rotation={[-Math.PI / 4.6, 0, 0]} count={2} />
      <group position={[1.4, 0.15, 0.5]}>
        <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.44, 0.7, 0.42]} /><meshStandardMaterial color="#3f5964" metalness={0.25} /></mesh>
        <mesh position={[0, 0.38, 0.218]}><boxGeometry args={[0.28, 0.16, 0.015]} /><meshStandardMaterial color="#82c4b0" emissive="#245b52" emissiveIntensity={0.4} /></mesh>
      </group>
    </>}
    {has('heater') && <group position={[0.92, 2.3, -0.15]} rotation={[0, 0, -0.12]}>
      <mesh><cylinderGeometry args={[0.15, 0.15, 0.82, 12]} /><meshStandardMaterial color="#c6d7da" metalness={0.48} /></mesh>
      <mesh position={[0.0, 0.42, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.045, 0.045, 0.55, 10]} /><meshStandardMaterial color="#819da5" /></mesh>
    </group>}
    {has('biodigester') && <group position={[-1.34, 0.18, -0.28]}>
      <mesh position={[0, 0.32, 0]} castShadow><cylinderGeometry args={[0.35, 0.38, 0.62, 16]} /><meshStandardMaterial color="#718b70" roughness={0.82} /></mesh>
      <mesh position={[0, 0.65, 0]}><sphereGeometry args={[0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#94a98b" /></mesh>
      <mesh position={[0.28, 0.78, 0]}><cylinderGeometry args={[0.035, 0.035, 0.34, 8]} /><meshStandardMaterial color="#6b7970" /></mesh>
    </group>}
    <mesh position={[0, -0.02, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[2.65, 2.45]} /><meshStandardMaterial color={selected ? '#b9dfc2' : '#9da98b'} roughness={1} />
    </mesh>
    <mesh position={[0, 2.94, 0]}>
      <sphereGeometry args={[selected ? 0.11 : 0.055, 12, 12]} /><meshStandardMaterial color={selected ? '#00a859' : '#e8e4d5'} emissive={selected ? '#006b35' : '#000000'} emissiveIntensity={selected ? 0.4 : 0} />
    </mesh>
    <Text position={[0, 3.22, 0]} fontSize={0.23} color={selected ? '#253b3c' : '#344544'} anchorX="center" outlineWidth={0.018} outlineColor="#e4e9df">
      {home.name}
    </Text>
    {selected && <mesh position={[0, 0.04, 0]}>
      <ringGeometry args={[1.45, 1.56, 48]} /><meshBasicMaterial color="#00a859" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>}
  </group>;
}

function School({ sharedSolar }) {
  return <group position={[7.2, 0, 2.9]}>
    <mesh position={[0, 1.18, 0]} castShadow><boxGeometry args={[3.0, 2.25, 2.35]} /><meshStandardMaterial color="#e1d9c8" roughness={0.9} /></mesh>
    <mesh position={[0, 2.34, 0]} castShadow><boxGeometry args={[3.25, 0.16, 2.55]} /><meshStandardMaterial color="#8f6558" /></mesh>
    <mesh position={[0, 0.75, 1.19]}><boxGeometry args={[0.72, 1.12, 0.06]} /><meshStandardMaterial color="#7c6049" /></mesh>
    {[-0.95, 0.95].map(x => <mesh key={x} position={[x, 1.38, 1.19]}><boxGeometry args={[0.55, 0.48, 0.06]} /><meshStandardMaterial color="#8fb5c2" /></mesh>)}
    {sharedSolar && <SolarPanels position={[0, 2.48, 0]} count={5} />}
    <Text position={[0, 2.9, 0]} fontSize={0.25} color="#3d4e4b" anchorX="center" outlineWidth={0.02} outlineColor="#e8e7dc">ESCOLA</Text>
  </group>;
}

function CommunityObjects({ homes }) {
  const hasLamp = homes.some(h => h.installations.includes('street_lights'));
  const hasShared = homes.some(h => h.installations.includes('shared_solar'));
  return <>
    <School sharedSolar={hasShared} />
    {[-7.4, -0.2, 6.8].map((x, i) => <Tree key={x} position={[x, 0, i === 1 ? -6.0 : 6.0]} scale={i === 1 ? 1.1 : 0.9} />)}
    {[-6.5, -0.4, 5.8].map(x => <StreetLamp key={x} position={[x, 0, 0]} lit={hasLamp} />)}
    <group position={[-8.0, 0, -0.9]}>
      <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.045, 0.06, 2.8, 8]} /><meshStandardMaterial color="#626d6d" /></mesh>
      <mesh position={[0.5, 2.65, 0]}><boxGeometry args={[1.0, 0.05, 0.05]} /><meshStandardMaterial color="#626d6d" /></mesh>
      <mesh position={[0.5, 2.44, 0]}><boxGeometry args={[0.7, 0.3, 0.12]} /><meshStandardMaterial color="#dfd9c9" /></mesh>
      <Text position={[0.5, 2.44, 0.08]} fontSize={0.12} color="#34524a" anchorX="center" anchorY="middle">ODS 7</Text>
    </group>
  </>;
}

function SceneContent({ homes, selectedId, onSelect, lowMotion }) {
  return <>
    <color attach="background" args={['#dce8e1']} />
    <Sky distance={450000} sunPosition={[9, 12, 4]} inclination={0.52} azimuth={0.25} rayleigh={1.8} turbidity={8} />
    <ambientLight intensity={0.9} />
    <directionalLight position={[8, 12, 6]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
    <Ground />
    {homes.map((home, index) => <House key={home.id} home={home} index={index} selected={selectedId === home.id} onSelect={onSelect} />)}
    <CommunityObjects homes={homes} />
    <ContactShadows position={[0, -0.07, 0]} opacity={0.22} scale={25} blur={2.3} far={2.5} />
    <OrbitControls makeDefault minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.05} minDistance={8} maxDistance={24} enableDamping={!lowMotion} dampingFactor={0.08} />
  </>;
}

export default function CommunityScene({ homes, selectedId, onSelect, lowMotion = false }) {
  const dpr = useMemo(() => Math.min(window.devicePixelRatio || 1, 1.6), []);
  return <div className="scene-canvas" role="img" aria-label="Maquete tridimensional de uma comunidade brasileira; selecione uma residência para abrir o simulador. Use a lista de casas como alternativa acessível.">
    <Canvas shadows dpr={dpr} camera={{ position: [11, 11, 15], fov: 42 }} gl={{ antialias: true, powerPreference: 'default' }}>
      <Suspense fallback={null}>
        <SceneContent homes={homes} selectedId={selectedId} onSelect={onSelect} lowMotion={lowMotion} />
      </Suspense>
    </Canvas>
    <div className="scene-hint"><span className="hint-dot" /> Arraste para explorar · Clique em uma casa para selecionar</div>
    <div className="scene-legend">
      <span><i className="legend-panel" /> Painéis</span>
      <span><i className="legend-light" /> Iluminação solar</span>
      <span><i className="legend-home" /> Residência</span>
    </div>
  </div>;
}
