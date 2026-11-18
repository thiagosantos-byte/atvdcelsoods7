import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Html, Text, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight } from './terrain.js';

const PANEL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#173b57', metalness: 0.45, roughness: 0.36 });
const PANEL_GRID_MATERIAL = new THREE.MeshStandardMaterial({ color: '#80b6c6', metalness: 0.25, roughness: 0.38 });
const WINDOW_MATERIAL = new THREE.MeshStandardMaterial({ color: '#9cc5cb', metalness: 0.12, roughness: 0.25 });
const GRILLE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const GRILLE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#46514f', metalness: 0.42, roughness: 0.66 });
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

function WindowGrilles({ width, depth }) {
  const grilleRef = useRef();
  const matrices = useMemo(() => {
    const items = [];
    const helper = new THREE.Object3D();
    [-width * 0.29, width * 0.29].forEach((centerX) => {
      [-0.3, 0, 0.3].forEach((offsetX) => {
        helper.position.set(centerX + offsetX, 1.65, depth / 2 + 0.12);
        helper.scale.set(0.035, 0.72, 0.04);
        helper.updateMatrix();
        items.push(helper.matrix.clone());
      });
      helper.position.set(centerX, 1.65, depth / 2 + 0.12);
      helper.scale.set(0.94, 0.035, 0.04);
      helper.updateMatrix();
      items.push(helper.matrix.clone());
    });
    return items;
  }, [width, depth]);
  useLayoutEffect(() => {
    matrices.forEach((matrix, index) => grilleRef.current?.setMatrixAt(index, matrix));
    if (grilleRef.current) grilleRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <instancedMesh ref={grilleRef} args={[GRILLE_GEOMETRY, GRILLE_MATERIAL, matrices.length]} castShadow receiveShadow />;
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
    <WindowGrilles width={width} depth={depth} />
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
    <mesh position={[-width * 0.3, height + 0.57, -depth * 0.3]} castShadow>
      <cylinderGeometry args={[0.43, 0.46, 0.92, 14]} />
      <meshStandardMaterial color="#1e6b9b" roughness={0.62} />
    </mesh>
    <mesh position={[-width * 0.3, height + 1.04, -depth * 0.3]}>
      <cylinderGeometry args={[0.43, 0.43, 0.05, 14]} />
      <meshStandardMaterial color="#174c70" roughness={0.6} />
    </mesh>
    {plot.variation % 4 === 1 && <mesh position={[width * 0.13, height + 0.22, depth * 0.16]} rotation-x={-0.035} castShadow>
      <boxGeometry args={[width * 0.66, 0.08, depth * 0.48]} />
      <meshStandardMaterial color="#747267" metalness={0.12} roughness={0.86} />
    </mesh>}
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

function buildCarModel(scene, bodyColor) {
  const source = scene.clone(true);
  source.updateMatrixWorld(true);
  const root = new THREE.Group();
  const buckets = new Map();
  const paintedMaterials = new Map();

  source.traverse((node) => {
    if (!node.isMesh) return;
    const transform = node.matrixWorld;
    const sourceMaterials = Array.isArray(node.material) ? node.material : [node.material];
    const materials = sourceMaterials.map((material) => {
      if (material?.name !== 'paint') return material;
      if (!paintedMaterials.has(material.uuid)) {
        const painted = material.clone();
        painted.color.set(bodyColor);
        paintedMaterials.set(material.uuid, painted);
      }
      return paintedMaterials.get(material.uuid);
    });

    if (Array.isArray(node.material)) {
      const geometry = node.geometry.clone().applyMatrix4(transform);
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      return;
    }

    const geometry = node.geometry.clone().applyMatrix4(transform);
    geometry.clearGroups();
    const material = materials[0];
    const attributes = Object.entries(geometry.attributes)
      .map(([name, attribute]) => `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`)
      .sort()
      .join('|');
    const key = `${material.uuid}:${attributes}:${geometry.index?.array.constructor.name || 'non-indexed'}`;
    if (!buckets.has(key)) buckets.set(key, { material, geometries: [] });
    buckets.get(key).geometries.push(geometry);
  });

  buckets.forEach(({ material, geometries }) => {
    const merged = mergeGeometries(geometries, false);
    if (!merged) {
      geometries.forEach((geometry) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);
      });
      return;
    }
    geometries.forEach((geometry) => geometry.dispose());
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  });
  return root;
}

export function ParkedCar({ position, color = '#d8dcdd', rotation = 0 }) {
  const { scene } = useGLTF('/models/sedan.glb');
  const model = useMemo(() => buildCarModel(scene, color), [scene, color]);
  return <group position={position} rotation-y={rotation}>
    <primitive object={model} rotation-y={Math.PI / 2} />
  </group>;
}

useGLTF.preload('/models/sedan.glb');

const RUBBER_MATERIAL = new THREE.MeshStandardMaterial({ color: '#252827', roughness: 0.92 });
const SPOKE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#b9c1bf', metalness: 0.72, roughness: 0.36 });
const MOTO_FRAME_MATERIAL = new THREE.MeshStandardMaterial({ color: '#252d30', metalness: 0.58, roughness: 0.34 });
const DARK_TRIM_MATERIAL = new THREE.MeshStandardMaterial({ color: '#202322', roughness: 0.68 });
const SEAT_MATERIAL = new THREE.MeshStandardMaterial({ color: '#303333', roughness: 0.72 });
const CHROME_MATERIAL = new THREE.MeshStandardMaterial({ color: '#c4cece', metalness: 0.78, roughness: 0.25 });

function FrameBeam({ start, end, radius = 0.025, material = BIKE_FRAME_MATERIAL, segments = 8 }) {
  const pose = useMemo(() => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return { position: from.add(to).multiplyScalar(0.5), quaternion, length: direction.length() };
  }, [start[0], start[1], start[2], end[0], end[1], end[2]]);
  return <mesh position={pose.position} quaternion={pose.quaternion} castShadow>
    <cylinderGeometry args={[radius, radius, pose.length, segments]} />
    <primitive object={material} attach="material" />
  </mesh>;
}

function SpokedWheel({ z, radius, rimRadius, tireWidth, spokeCount = 8 }) {
  return <group position={[0, radius, z]}>
    <mesh rotation-y={Math.PI / 2} castShadow>
      <torusGeometry args={[radius - tireWidth, tireWidth, 9, 28]} />
      <primitive object={RUBBER_MATERIAL} attach="material" />
    </mesh>
    <mesh rotation-y={Math.PI / 2}>
      <torusGeometry args={[rimRadius, 0.018, 6, 24]} />
      <primitive object={SPOKE_MATERIAL} attach="material" />
    </mesh>
    <mesh rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.055, 0.055, 0.16, 10]} />
      <primitive object={CHROME_MATERIAL} attach="material" />
    </mesh>
    {Array.from({ length: spokeCount }).map((_, index) => {
      const angle = (index / spokeCount) * Math.PI * 2;
      return <FrameBeam key={index} start={[0, 0, 0]} end={[0, Math.cos(angle) * rimRadius, Math.sin(angle) * rimRadius]} radius={0.006} material={SPOKE_MATERIAL} segments={5} />;
    })}
  </group>;
}

export function ParkedBicycle({ position, color = '#236c56', rotation = 0 }) {
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.48, roughness: 0.34 }), [color]);
  return <group position={position} rotation-y={rotation}>
    <SpokedWheel z={-0.92} radius={0.42} rimRadius={0.37} tireWidth={0.045} />
    <SpokedWheel z={0.92} radius={0.42} rimRadius={0.37} tireWidth={0.045} />
    <FrameBeam start={[0, 0.42, -0.92]} end={[0, 1.05, -0.42]} material={frameMaterial} />
    <FrameBeam start={[0, 1.05, -0.42]} end={[0, 1.02, 0.66]} material={frameMaterial} />
    <FrameBeam start={[0, 0.42, -0.92]} end={[0, 0.42, -0.02]} material={frameMaterial} />
    <FrameBeam start={[0, 0.42, -0.02]} end={[0, 1.05, -0.42]} material={frameMaterial} />
    <FrameBeam start={[0, 0.42, -0.02]} end={[0, 0.73, 0.66]} material={frameMaterial} />
    <FrameBeam start={[0, 0.73, 0.66]} end={[0, 1.02, 0.66]} material={frameMaterial} />
    <FrameBeam start={[0, 1.02, 0.66]} end={[0, 0.42, 0.92]} radius={0.018} material={CHROME_MATERIAL} />
    <FrameBeam start={[-0.32, 1.12, 0.68]} end={[0.32, 1.12, 0.68]} radius={0.022} material={DARK_TRIM_MATERIAL} />
    <FrameBeam start={[0, 1.04, 0.66]} end={[0, 1.12, 0.68]} radius={0.025} material={CHROME_MATERIAL} />
    <mesh position={[0, 1.08, -0.45]} rotation-x={-0.08} castShadow>
      <boxGeometry args={[0.28, 0.07, 0.42]} /><meshStandardMaterial color={color} metalness={0.42} roughness={0.38} />
    </mesh>
    <mesh position={[0, 0.42, -0.02]} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.035, 0.035, 0.16, 10]} /><primitive object={CHROME_MATERIAL} attach="material" />
    </mesh>
    <FrameBeam start={[-0.35, 0.4, -0.02]} end={[0.35, 0.4, -0.02]} radius={0.018} material={DARK_TRIM_MATERIAL} />
    <mesh position={[0, 0.48, 0.93]}>
      <sphereGeometry args={[0.065, 10, 8]} /><meshBasicMaterial color="#f7e4a4" />
    </mesh>
  </group>;
}

export function ParkedMotorcycle({ position, color = '#9e5546', rotation = 0 }) {
  return <group position={position} rotation-y={rotation}>
    <SpokedWheel z={-0.78} radius={0.39} rimRadius={0.29} tireWidth={0.07} spokeCount={6} />
    <SpokedWheel z={0.92} radius={0.39} rimRadius={0.29} tireWidth={0.07} spokeCount={6} />
    <FrameBeam start={[0, 0.39, -0.78]} end={[0, 0.76, 0.2]} radius={0.045} material={MOTO_FRAME_MATERIAL} />
    <FrameBeam start={[0, 0.39, -0.78]} end={[0, 0.82, -0.12]} radius={0.045} material={MOTO_FRAME_MATERIAL} />
    <FrameBeam start={[0, 0.82, -0.12]} end={[0, 1.0, 0.62]} radius={0.04} material={MOTO_FRAME_MATERIAL} />
    <FrameBeam start={[0, 1.0, 0.62]} end={[0, 0.39, 0.92]} radius={0.04} material={CHROME_MATERIAL} />
    <FrameBeam start={[-0.24, 0.4, -0.78]} end={[0.24, 0.4, -0.78]} radius={0.025} material={CHROME_MATERIAL} />
    <mesh position={[0, 0.61, -0.12]} castShadow>
      <boxGeometry args={[0.42, 0.4, 0.48]} /><primitive object={MOTO_FRAME_MATERIAL} attach="material" />
    </mesh>
    <mesh position={[0, 0.92, 0.13]} rotation-x={-0.12} scale={[0.28, 0.2, 0.44]} castShadow>
      <sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
    </mesh>
    <mesh position={[0, 1.0, -0.38]} rotation-x={0.06} castShadow>
      <boxGeometry args={[0.4, 0.12, 0.64]} /><primitive object={SEAT_MATERIAL} attach="material" />
    </mesh>
    <FrameBeam start={[0, 1.03, 0.62]} end={[0, 1.2, 0.78]} radius={0.035} material={CHROME_MATERIAL} />
    <FrameBeam start={[-0.4, 1.19, 0.78]} end={[0.4, 1.19, 0.78]} radius={0.03} material={DARK_TRIM_MATERIAL} />
    {[-1, 1].map((side) => <React.Fragment key={side}>
      <FrameBeam start={[side * 0.18, 1.2, 0.78]} end={[side * 0.29, 1.48, 0.8]} radius={0.015} material={CHROME_MATERIAL} />
      <mesh position={[side * 0.29, 1.48, 0.8]} scale={[0.14, 0.09, 0.04]}>
        <sphereGeometry args={[1, 10, 8]} /><primitive object={DARK_TRIM_MATERIAL} attach="material" />
      </mesh>
    </React.Fragment>)}
    <mesh position={[0, 1.04, 0.97]} rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} /><meshStandardMaterial color="#e5dcae" emissive="#b99d50" emissiveIntensity={0.18} />
    </mesh>
    <FrameBeam start={[0.18, 0.42, -0.55]} end={[0.18, 0.19, -0.29]} radius={0.018} material={CHROME_MATERIAL} />
    <FrameBeam start={[0.18, 0.19, -0.29]} end={[0, 0.04, -0.17]} radius={0.018} material={DARK_TRIM_MATERIAL} />
    <FrameBeam start={[0.22, 0.52, -0.56]} end={[0.22, 0.48, 0.12]} radius={0.045} material={CHROME_MATERIAL} />
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


function BusWheel({ position }) {
  return <group position={position}>
    <mesh rotation-y={Math.PI / 2} castShadow>
      <torusGeometry args={[0.43, 0.105, 10, 28]} /><meshStandardMaterial color="#202322" roughness={0.92} />
    </mesh>
    <mesh rotation-y={Math.PI / 2}>
      <torusGeometry args={[0.31, 0.025, 8, 24]} /><meshStandardMaterial color="#aeb7b8" metalness={0.68} roughness={0.34} />
    </mesh>
    <mesh rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.13, 0.13, 0.2, 12]} /><meshStandardMaterial color="#687477" metalness={0.62} roughness={0.36} />
    </mesh>
  </group>;
}

export function SalvadorBus({ position, rotation = 0 }) {
  const windowPositions = [-4.55, -3.55, -2.55, -1.55, 0.65, 1.45, 3.85, 4.65];
  return <group position={position} rotation-y={rotation}>
    {/* Caixa alta branca, faixa turquesa e frente de ônibus urbano de Salvador. */}
    <mesh position={[0, 2.22, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.56, 2.16, 10.62]} /><meshStandardMaterial color="#e9ece8" roughness={0.72} />
    </mesh>
    <mesh position={[0, 3.34, 0]} castShadow>
      <boxGeometry args={[2.52, 0.18, 10.58]} /><meshStandardMaterial color="#10a99b" roughness={0.48} />
    </mesh>
    {[-1, 1].map((side) => <React.Fragment key={side}>
      <mesh position={[side * 1.3, 3.13, 0]}>
        <boxGeometry args={[0.09, 0.34, 10.5]} /><meshStandardMaterial color="#10a99b" roughness={0.5} />
      </mesh>
      <mesh position={[side * 1.3, 2.08, 4.55]}>
        <boxGeometry args={[0.08, 1.75, 1.28]} /><meshStandardMaterial color="#087f79" roughness={0.6} />
      </mesh>
    </React.Fragment>)}
    <mesh position={[0, 0.85, 5.34]} castShadow>
      <boxGeometry args={[2.5, 0.72, 0.13]} /><meshStandardMaterial color="#087f79" roughness={0.5} />
    </mesh>
    <mesh position={[0, 3.04, 5.34]}>
      <boxGeometry args={[2.52, 0.42, 0.14]} /><meshStandardMaterial color="#0a8c82" roughness={0.48} />
    </mesh>
    <mesh position={[0, 2.33, 5.37]} rotation-x={0.12} castShadow>
      <boxGeometry args={[2.14, 1.12, 0.055]} /><meshStandardMaterial color="#172a30" metalness={0.24} roughness={0.2} />
    </mesh>
    <mesh position={[0, 3.05, 5.44]}>
      <boxGeometry args={[1.94, 0.31, 0.055]} /><meshStandardMaterial color="#121a1d" roughness={0.4} />
    </mesh>
    <Text position={[0, 3.055, 5.48]} fontSize={0.19} color="#f5e8b6" anchorX="center" anchorY="middle" letterSpacing={0.015}>
      0331 ABAETÉ
    </Text>
    <Text position={[0, 1.18, 5.45]} fontSize={0.12} color="#f0eee2" anchorX="center" anchorY="middle" letterSpacing={0.02}>
      BRASILBUS
    </Text>
    {[-0.96, 0.96].map((x) => <React.Fragment key={x}>
      <mesh position={[x, 0.95, 5.43]}>
        <boxGeometry args={[0.48, 0.2, 0.07]} /><meshStandardMaterial color="#f1e2ae" emissive="#8a7139" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[x, 0.69, 5.43]}>
        <boxGeometry args={[0.37, 0.07, 0.07]} /><meshStandardMaterial color="#c33f35" />
      </mesh>
    </React.Fragment>)}
    <mesh position={[0, 0.69, 5.44]}>
      <boxGeometry args={[0.92, 0.21, 0.07]} /><meshStandardMaterial color="#20282a" roughness={0.68} />
    </mesh>
    <mesh position={[0, 0.48, 5.44]}>
      <boxGeometry args={[0.46, 0.13, 0.075]} /><meshStandardMaterial color="#b83c35" roughness={0.58} />
    </mesh>
    <FrameBeam start={[-0.72, 1.93, 5.43]} end={[0.04, 1.98, 5.43]} radius={0.015} material={DARK_TRIM_MATERIAL} />
    <FrameBeam start={[0.05, 1.98, 5.43]} end={[0.72, 2.05, 5.43]} radius={0.015} material={DARK_TRIM_MATERIAL} />
    {[-1, 1].map((side) => <React.Fragment key={`mirror-${side}`}>
      <FrameBeam start={[side * 1.17, 2.13, 4.85]} end={[side * 1.48, 2.28, 4.95]} radius={0.025} material={CHROME_MATERIAL} />
      <mesh position={[side * 1.48, 2.3, 4.95]} scale={[0.2, 0.12, 0.08]}>
        <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#152126" metalness={0.3} roughness={0.24} />
      </mesh>
    </React.Fragment>)}

    {[-1, 1].map((side) => <React.Fragment key={`side-${side}`}>
      {windowPositions.map((z) => <mesh key={z} position={[side * 1.31, 2.52, z]}>
        <boxGeometry args={[0.052, 0.91, 0.84]} /><meshStandardMaterial color="#1a2c31" metalness={0.18} roughness={0.23} />
      </mesh>)}
      {windowPositions.slice(0, -1).map((z) => <mesh key={`pillar-${z}`} position={[side * 1.34, 2.52, z + 0.47]}>
        <boxGeometry args={[0.065, 1.0, 0.075]} /><meshStandardMaterial color="#e3e6e1" roughness={0.7} />
      </mesh>)}
      <mesh position={[side * 1.34, 1.54, 0]}>
        <boxGeometry args={[0.07, 0.13, 10.46]} /><meshStandardMaterial color="#c8ceca" roughness={0.72} />
      </mesh>
      <Text position={[side * 1.35, 1.76, -2.0]} rotation={[0, side < 0 ? -Math.PI / 2 : Math.PI / 2, 0]} fontSize={0.44} color="#137f76" anchorX="center" anchorY="middle" letterSpacing={-0.03}>
        integra
      </Text>
      <Text position={[side * 1.35, 1.49, -2.0]} rotation={[0, side < 0 ? -Math.PI / 2 : Math.PI / 2, 0]} fontSize={0.105} color="#52635f" anchorX="center" anchorY="middle" letterSpacing={0.01}>
        TRANSPORTE DA BAHIA
      </Text>
      <Text position={[side * 1.35, 1.85, 3.72]} rotation={[0, side < 0 ? -Math.PI / 2 : Math.PI / 2, 0]} fontSize={0.17} color="#f0f2ed" anchorX="center" anchorY="middle">
        20700
      </Text>
      <mesh position={[side * 1.35, 1.82, 2.95]}>
        <boxGeometry args={[0.075, 0.28, 0.28]} /><meshStandardMaterial color="#0876b7" roughness={0.5} />
      </mesh>
    </React.Fragment>)}
    {/* Portas envidraçadas voltadas para o ponto de ônibus. */}
    {[-0.25, 2.55].map((z) => <React.Fragment key={`door-${z}`}>
      <mesh position={[-1.355, 1.96, z]}>
        <boxGeometry args={[0.06, 1.95, 1.03]} /><meshStandardMaterial color="#17292e" metalness={0.18} roughness={0.22} />
      </mesh>
      {[-0.48, 0, 0.48].map((offset) => <mesh key={offset} position={[-1.39, 1.96, z + offset]}>
        <boxGeometry args={[0.045, 1.96, 0.045]} /><meshStandardMaterial color="#e3e6e1" roughness={0.7} />
      </mesh>)}
      <mesh position={[-1.39, 1.96, z]}>
        <boxGeometry args={[0.045, 0.045, 1.0]} /><meshStandardMaterial color="#e3e6e1" roughness={0.7} />
      </mesh>
    </React.Fragment>)}
    {[-3.55, 3.55].map((z) => <React.Fragment key={`wheel-${z}`}>
      <BusWheel position={[-1.31, 0.54, z]} />
      <BusWheel position={[1.31, 0.54, z]} />
    </React.Fragment>)}
    {[-4.58, 0, 4.58].map((z) => <mesh key={`skirt-${z}`} position={[0, 0.91, z]}>
      <boxGeometry args={[2.5, 0.38, z === 0 ? 1.05 : 1.3]} /><meshStandardMaterial color="#e6e9e5" roughness={0.78} />
    </mesh>)}
    <mesh position={[0, 3.46, -0.25]} castShadow>
      <boxGeometry args={[1.15, 0.23, 1.9]} /><meshStandardMaterial color="#d7dbd7" roughness={0.78} />
    </mesh>
    <mesh position={[0, 3.455, 1.65]}>
      <boxGeometry args={[0.84, 0.11, 0.72]} /><meshStandardMaterial color="#f6f6f0" roughness={0.82} />
    </mesh>
    <mesh position={[0, 3.455, -2.12]}>
      <boxGeometry args={[0.84, 0.11, 0.72]} /><meshStandardMaterial color="#f6f6f0" roughness={0.82} />
    </mesh>
    <mesh position={[0, 2.18, -5.35]}>
      <boxGeometry args={[2.52, 1.2, 0.1]} /><meshStandardMaterial color="#0d9488" roughness={0.52} />
    </mesh>
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
