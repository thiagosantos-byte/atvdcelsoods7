import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sky, Stars } from '@react-three/drei';
import { ODS_POINTS } from '../../data/odsData.js';
import { groundHeight, ROAD_GRID, createDistrictLayout } from './terrain.js';
import {
  BusStop, CableSegment, CommunitySquare, EnergyHub, HouseBlock, LocalBusiness,
  ParkedBicycle, ParkedCar, ParkedMotorcycle, PublicBuilding, SalvadorBus, SolarLamp, SportsCourt, Tree, UtilityPole, WalkingPerson
} from './BuildingBlocks.jsx';
import { OdsOverlay } from './OdsOverlay.jsx';

function makeRibbonGeometry(roads, width, segmentsPerRoad = 32, heightOffset = 0.065) {
  const vertices = [];
  const indices = [];
  roads.forEach((road) => {
    const [x1, z1] = road.start;
    const [x2, z2] = road.end;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz) || 1;
    const px = -dz / length;
    const pz = dx / length;
    const baseIndex = vertices.length / 3;
    for (let step = 0; step <= segmentsPerRoad; step += 1) {
      const t = step / segmentsPerRoad;
      const x = x1 + dx * t;
      const z = z1 + dz * t;
      const leftX = x + px * width / 2;
      const leftZ = z + pz * width / 2;
      const rightX = x - px * width / 2;
      const rightZ = z - pz * width / 2;
      vertices.push(leftX, groundHeight(leftX, leftZ) + heightOffset, leftZ);
      vertices.push(rightX, groundHeight(rightX, rightZ) + heightOffset, rightZ);
      if (step < segmentsPerRoad) {
        const current = baseIndex + step * 2;
        indices.push(current, current + 2, current + 1, current + 1, current + 2, current + 3);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(124, 124, 88, 88);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      positions.setY(index, groundHeight(x, z));
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);
  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color="#77796c" roughness={1} metalness={0} />
  </mesh>;
}

function RoadNetwork() {
  const roads = useMemo(() => {
    const result = [];
    ROAD_GRID.forEach((line) => {
      const primary = line === 0;
      result.push({ start: [line, -61], end: [line, 61], width: primary ? 6.2 : 4.4 });
      result.push({ start: [-61, line], end: [61, line], width: primary ? 6.2 : 4.4 });
    });
    return result;
  }, []);
  const primaryRoads = useMemo(() => roads.filter((road) => road.width > 5), [roads]);
  const secondaryRoads = useMemo(() => roads.filter((road) => road.width <= 5), [roads]);
  const roadGeometry = useMemo(() => makeRibbonGeometry(primaryRoads, 6.2, 44, 0.075), [primaryRoads]);
  const secondaryGeometry = useMemo(() => makeRibbonGeometry(secondaryRoads, 4.4, 44, 0.078), [secondaryRoads]);
  const alleys = useMemo(() => {
    const inner = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        if ((row === 1 && (col === 0 || col === 3))) continue;
        const x0 = ROAD_GRID[col];
        const x1 = ROAD_GRID[col + 1];
        const z0 = ROAD_GRID[row];
        const z1 = ROAD_GRID[row + 1];
        const cx = (x0 + x1) / 2;
        const cz = (z0 + z1) / 2;
        inner.push({ start: [cx, z0 + 3], end: [cx, z1 - 3] });
        inner.push({ start: [x0 + 3, cz], end: [x1 - 3, cz] });
      }
    }
    return inner;
  }, []);
  const alleyGeometry = useMemo(() => makeRibbonGeometry(alleys, 1.65, 18, 0.095), [alleys]);

  return <>
    <mesh geometry={roadGeometry} receiveShadow><meshStandardMaterial color="#4b4f50" roughness={0.95} /></mesh>
    <mesh geometry={secondaryGeometry} receiveShadow><meshStandardMaterial color="#55595a" roughness={0.95} /></mesh>
    <mesh geometry={alleyGeometry} receiveShadow><meshStandardMaterial color="#a49d8c" roughness={1} /></mesh>
    {ROAD_GRID.map((line) => <group key={line}>
      {line === 0 && [-49, -37, -25, -13, -1, 11, 23, 35, 47, 59].map((z) => <mesh key={`${line}-${z}`} position={[line + 0.05, groundHeight(line, z) + 0.1, z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.1, 1.25]} /><meshBasicMaterial color="#d5cdb7" transparent opacity={0.38} />
      </mesh>)}
    </group>)}
  </>;
}

function Sidewalks() {
  const segments = useMemo(() => {
    const items = [];
    ROAD_GRID.forEach((line) => {
      [-1, 1].forEach((side) => {
        items.push({ start: [line + side * 3.1, -60], end: [line + side * 3.1, 60] });
        items.push({ start: [-60, line + side * 3.1], end: [60, line + side * 3.1] });
      });
    });
    return items;
  }, []);
  const geometry = useMemo(() => makeRibbonGeometry(segments, 0.85, 36, 0.09), [segments]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#b2aa98" roughness={1} /></mesh>;
}

function Stairs({ x, z, steps = 9, direction = 1 }) {
  return <group>
    {Array.from({ length: steps }).map((_, index) => {
      const stepZ = z + index * direction * 0.92;
      const y = groundHeight(x, stepZ) + 0.12;
      return <mesh key={index} position={[x, y, stepZ]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.22, 0.98]} /><meshStandardMaterial color="#9b978c" roughness={0.95} />
      </mesh>;
    })}
    {[-1, 1].map((side) => <mesh key={side} position={[x + side * 1.42, groundHeight(x, z + (steps / 2) * direction) + 0.8, z + (steps / 2) * direction]}>
      <boxGeometry args={[0.16, 1.6, steps * 0.9]} /><meshStandardMaterial color="#77766e" roughness={0.95} />
    </mesh>)}
  </group>;
}

function UtilityNetwork({ isNight, streetLightsActive }) {
  const poleRows = [-43, -14, 15, 44];
  const poles = poleRows.map((z, index) => ({ x: 4.25, z, id: `pole-${index}` }));
  const cableEnds = poleRows.slice(0, -1).map((z, index) => ({
    start: [4.25, groundHeight(4.25, z) + 7.5, z],
    end: [4.25, groundHeight(4.25, poleRows[index + 1]) + 7.5, poleRows[index + 1]]
  }));
  const crossWires = [-28, 0, 28].map((z, index) => ({
    start: [-29, groundHeight(-29, z) + 7.45, z],
    end: [29, groundHeight(29, z) + 7.45, z]
  }));
  return <>
    {poles.map((pole) => <UtilityPole key={pole.id} position={[pole.x, groundHeight(pole.x, pole.z), pole.z]} isNight={isNight} lampActive={streetLightsActive} />)}
    {cableEnds.map((item, index) => <CableSegment key={`long-${index}`} {...item} />)}
    {crossWires.map((item, index) => <CableSegment key={`cross-${index}`} {...item} />)}
    {[-42, -14, 14, 42].map((z, index) => <SolarLamp key={`lamp-${index}`} position={[-4.6, groundHeight(-4.6, z), z]} isNight={isNight && streetLightsActive} />)}
    {[-42, -14, 14, 42].map((z, index) => <SolarLamp key={`lamp-r-${index}`} position={[8.5, groundHeight(8.5, z), z]} isNight={isNight && streetLightsActive} />)}
  </>;
}

function StreetLife({ lowMotion }) {
  const trees = [
    [-51, -48, 0.9], [-51, -16, 0.86], [-51, 18, 0.9], [-51, 48, 0.8],
    [51, -48, 0.86], [51, -16, 0.9], [51, 18, 0.84], [51, 48, 0.9],
    [-6, -51, 0.72], [11, 50, 0.8], [43, -2, 0.78], [-42, 42, 0.76]
  ];
  const cars = [
    { x: 1.55, z: -40, color: '#d8dcdd', rotation: 0 },
    { x: -1.55, z: -8, color: '#586a75', rotation: 0 },
    { x: 1.55, z: 23, color: '#9e5546', rotation: 0 },
    { x: 28, z: 46, color: '#aeb2ae', rotation: 0 }
  ];
  const motorcycles = [
    { x: -2.35, z: 6.5, color: '#b64e3d', rotation: 0 }
  ];
  const bicycles = [
    { x: -31, z: -14, color: '#236c56', rotation: 0 },
    { x: 31, z: -14, color: '#d08c42', rotation: 0 }
  ];
  const walkers = [
    { start: [-5.2, -28], color: '#315f74', phase: 0.2 },
    { start: [5.4, -12], color: '#a66d4c', phase: 1.6 },
    { start: [-5.2, 17], color: '#6b7752', phase: 2.7 },
    { start: [8.8, 34], color: '#9b647a', phase: 3.5 },
    { start: [0, 48], color: '#4f657b', phase: 4.3 }
  ];
  return <>
    {trees.map(([x, z, scale]) => <Tree key={`tree-${x}-${z}`} position={[x, groundHeight(x, z), z]} scale={scale} />)}
    {cars.map((car, index) => <ParkedCar key={`car-${index}`} position={[car.x, groundHeight(car.x, car.z), car.z]} color={car.color} rotation={car.rotation} />)}
    {motorcycles.map((vehicle, index) => <ParkedMotorcycle key={`motorcycle-${index}`} position={[vehicle.x, groundHeight(vehicle.x, vehicle.z) + 0.14, vehicle.z]} color={vehicle.color} rotation={vehicle.rotation} />)}
    {bicycles.map((vehicle, index) => <ParkedBicycle key={`bicycle-${index}`} position={[vehicle.x, groundHeight(vehicle.x, vehicle.z) + 0.14, vehicle.z]} color={vehicle.color} rotation={vehicle.rotation} />)}
    {walkers.map((person, index) => <WalkingPerson key={`person-${index}`} {...person} lowMotion={lowMotion} />)}
  </>;
}

export default function NeighborhoodWorld({ homes, selectedId, isNight, showODS, lowMotion, onSelectHome, onSelectPlace }) {
  const layout = useMemo(() => createDistrictLayout(homes), [homes]);
  const streetLightsActive = homes.some((home) => home.installations?.includes('street_lights'));
  const housesById = layout.houses;

  return <>
    <color attach="background" args={[isNight ? '#101a23' : '#b9c9c1']} />
    {!isNight ? <Sky distance={450000} sunPosition={[45, 65, 24]} inclination={0.49} azimuth={0.25} rayleigh={1.7} turbidity={7} /> : <Stars radius={145} depth={45} count={900} factor={3} saturation={0} fade speed={0.15} />}
    <fog attach="fog" args={[isNight ? '#101a23' : '#b9c9c1', 85, 165]} />
    <ambientLight intensity={isNight ? 0.32 : 0.82} color={isNight ? '#91a8c2' : '#fff2dc'} />
    <directionalLight
      position={isNight ? [-22, 28, -18] : [45, 65, 24]}
      intensity={isNight ? 0.42 : 2.1}
      color={isNight ? '#b6c9f3' : '#fff0d8'}
      castShadow
      shadow-mapSize-width={isNight ? 1024 : 1536}
      shadow-mapSize-height={isNight ? 1024 : 1536}
      shadow-camera-left={-74}
      shadow-camera-right={74}
      shadow-camera-top={74}
      shadow-camera-bottom={-74}
    />
    {isNight && <hemisphereLight intensity={0.18} color="#9fb6dc" groundColor="#17202a" />}
    <Terrain />
    <RoadNetwork />
    <Sidewalks />
    {housesById.map((plot) => <HouseBlock
      key={plot.id}
      plot={plot}
      selected={plot.homeId ? selectedId === plot.homeId : false}
      onSelect={(item) => {
        if (item.homeId) onSelectHome?.(item.homeId);
        else onSelectPlace?.({
          id: item.id,
          type: 'residence',
          title: item.name,
          description: 'Residência demonstrativa do bairro. Esta construção representa a diversidade habitacional do território.',
          impact: 'O consumo e as oportunidades de melhoria podem ser analisados junto às famílias cadastradas na simulação.',
          recommendation: 'Avaliar iluminação eficiente, segurança das instalações e potencial de geração solar.'
        });
      }}
    />)}
    {layout.places.map((place) => {
      if (['bakery', 'market', 'barbershop', 'shop'].includes(place.type)) return <LocalBusiness key={place.id} place={place} onSelect={onSelectPlace} />;
      if (place.type === 'energy') return <EnergyHub key={place.id} place={place} onSelect={onSelectPlace} />;
      return <PublicBuilding key={place.id} place={place} onSelect={onSelectPlace} />;
    })}
    {layout.fullBlocks.map((place) => place.type === 'sports'
      ? <SportsCourt key={place.id} place={place} onSelect={onSelectPlace} />
      : <CommunitySquare key={place.id} place={place} onSelect={onSelectPlace} />)}
    <UtilityNetwork isNight={isNight} streetLightsActive={streetLightsActive} />
    <BusStop position={[-4.6, groundHeight(-4.6, -52), -52]} />
    <SalvadorBus position={[-1.75, groundHeight(-1.75, -54.2) + 0.075, -54.2]} />
    <StreetLife lowMotion={lowMotion} />
    <Stairs x={14} z={-22} steps={10} direction={1} />
    <Stairs x={-14} z={6} steps={8} direction={1} />
    <Stairs x={42} z={6} steps={8} direction={-1} />
    <Stairs x={-14} z={16} steps={9} direction={-1} />
    {showODS && <OdsOverlay points={ODS_POINTS} onSelect={onSelectPlace} />}
    {isNight && <group>
      <mesh position={[0, 42, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} /><meshBasicMaterial color="#f1dca1" />
      </mesh>
    </group>}
  </>;
}
