import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  CircleHelp, Compass, Expand, Footprints, Map, Moon, Sun, X, Zap
} from 'lucide-react';
import NeighborhoodWorld from './neighborhood/NeighborhoodWorld.jsx';
import { FirstPersonController, ThirdPersonController } from './neighborhood/PlayerController.jsx';
import { createDistrictLayout } from './neighborhood/terrain.js';

function AerialCamera({ active }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!active) return;
    camera.position.set(82, 84, 94);
    camera.lookAt(0, 2.2, 0);
  }, [active, camera]);
  return null;
}

function TouchPad({ inputRef }) {
  const bind = (key) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.stopPropagation();
      inputRef.current[key] = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerUp: (event) => {
      event.preventDefault();
      inputRef.current[key] = false;
    },
    onPointerCancel: () => { inputRef.current[key] = false; },
    onPointerLeave: () => { inputRef.current[key] = false; }
  });
  return <div className="neighborhood-touchpad" aria-label="Controles de movimentação por toque">
    <button type="button" aria-label="Caminhar para frente" {...bind('forward')}>▲</button>
    <div>
      <button type="button" aria-label="Caminhar para esquerda" {...bind('left')}>◀</button>
      <button type="button" aria-label="Caminhar para trás" {...bind('backward')}>▼</button>
      <button type="button" aria-label="Caminhar para direita" {...bind('right')}>▶</button>
    </div>
    <div className="touch-turn-row">
      <button type="button" aria-label="Girar para esquerda" {...bind('turnLeft')}>↶</button>
      <button type="button" className="touch-sprint" aria-label="Correr" {...bind('sprint')}>CORRER</button>
      <button type="button" aria-label="Girar para direita" {...bind('turnRight')}>↷</button>
    </div>
  </div>;
}

function PlaceCard({ place, onClose }) {
  if (!place) return null;
  return <aside className="neighborhood-place-card" aria-live="polite">
    <div className="place-card-top">
      <span>{place.type || 'Ponto de interesse'}</span>
      <button type="button" onClick={onClose} aria-label="Fechar informações"><X size={16} /></button>
    </div>
    <h3>{place.title}</h3>
    {place.odsGoal && <b className="place-ods-goal">{place.odsGoal}</b>}
    <p>{place.description}</p>
    {place.impact && <div><strong>Impacto comunitário</strong><p>{place.impact}</p></div>}
    {place.recommendation && <div><strong>Oportunidade de melhoria</strong><p>{place.recommendation}</p></div>}
  </aside>;
}

function MiniMap() {
  return <div className="neighborhood-minimap" role="img" aria-label="Mapa esquemático do bairro">
    <div className="mini-map-grid">
      <i /><i /><i /><i /><i />
      <span className="mini-map-player" />
    </div>
    <span><Map size={12} /> MAPA DO BAIRRO</span>
  </div>;
}

export default function CommunityScene({ homes, selectedId, onSelect, lowMotion = false }) {
  const sceneRef = useRef(null);
  const inputRef = useRef({ forward: false, backward: false, left: false, right: false, sprint: false, turnLeft: false, turnRight: false });
  const [viewMode, setViewMode] = useState('aerial');
  const [isNight, setIsNight] = useState(false);
  const [showODS, setShowODS] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const layout = useMemo(() => createDistrictLayout(homes), [homes]);

  useEffect(() => {
    if (viewMode !== 'first') setIsLocked(false);
    Object.keys(inputRef.current).forEach((key) => { inputRef.current[key] = false; });
  }, [viewMode]);

  function selectHouse(homeId) {
    onSelect?.(homeId);
    setSelectedPlace(null);
    setShowControls(false);
  }

  function enterFullscreen() {
    const element = sceneRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      element.requestFullscreen?.().catch(() => {});
    }
  }

  return <div className={`scene-canvas immersive-neighborhood ${viewMode === 'third' ? 'scene-walk-mode' : ''}`} ref={sceneRef} role="region" aria-label="Bairro interativo em 3D">
    <Canvas
      shadows
      dpr={[1, 1.55]}
      camera={{ position: [82, 84, 94], fov: 43, near: 0.1, far: 300 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(isNight ? '#101a23' : '#b9c9c1');
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = 2;
      }}
    >
      <NeighborhoodWorld
        homes={homes}
        selectedId={selectedId}
        isNight={isNight}
        showODS={showODS}
        lowMotion={lowMotion}
        onSelectHome={selectHouse}
        onSelectPlace={(place) => { setSelectedPlace(place); setShowControls(false); }}
      />
      {viewMode === 'aerial' && <>
        <AerialCamera active />
        <OrbitControls
          makeDefault
          target={[0, 2, 0]}
          enableDamping={!lowMotion}
          dampingFactor={0.08}
          minDistance={20}
          maxDistance={165}
          maxPolarAngle={Math.PI / 2.03}
          minPolarAngle={0.12}
          screenSpacePanning
        />
      </>}
      {viewMode === 'first' && <FirstPersonController inputRef={inputRef} obstacles={layout.obstacles} onLockChange={setIsLocked} />}
      {viewMode === 'third' && <ThirdPersonController inputRef={inputRef} obstacles={layout.obstacles} />}
    </Canvas>

    <div className="neighborhood-toolbar">
      <div className="neighborhood-view-switch" role="group" aria-label="Modo de visualização">
        <button type="button" className={viewMode === 'aerial' ? 'active' : ''} aria-pressed={viewMode === 'aerial'} onClick={() => setViewMode('aerial')} title="Visão aérea"><Compass size={14} /> <span>Visão do bairro</span></button>
        <button type="button" className={viewMode === 'first' ? 'active' : ''} aria-pressed={viewMode === 'first'} onClick={() => setViewMode('first')} title="Primeira pessoa"><Footprints size={14} /> <span>1ª pessoa</span></button>
        <button type="button" className={viewMode === 'third' ? 'active' : ''} aria-pressed={viewMode === 'third'} onClick={() => setViewMode('third')} title="Terceira pessoa"><span className="third-person-icon">●</span> <span>3ª pessoa</span></button>
      </div>
      <div className="neighborhood-tools">
        <button type="button" aria-pressed={isNight} onClick={() => setIsNight((value) => !value)} title={isNight ? 'Ativar dia' : 'Ativar noite'}>
          {isNight ? <Moon size={15} /> : <Sun size={15} />}<span>{isNight ? 'Noite' : 'Dia'}</span>
        </button>
        <button type="button" className={showODS ? 'tool-on' : ''} aria-pressed={showODS} onClick={() => setShowODS((value) => !value)} title="Exibir pontos do ODS 7">
          <Zap size={15} /><span>ODS 7</span>
        </button>
        <button type="button" onClick={enterFullscreen} aria-label="Alternar tela cheia" title="Tela cheia"><Expand size={15} /></button>
        <button type="button" className={showControls ? 'tool-on' : ''} aria-label="Ajuda de navegação" aria-expanded={showControls} aria-controls="scene-controls-help" onClick={() => { setShowControls(value => !value); setSelectedPlace(null); }} title="Como navegar"><CircleHelp size={16} /><span>Ajuda</span></button>
      </div>
    </div>

    {showControls && <aside className="scene-controls-help" id="scene-controls-help" aria-label="Ajuda de navegação">
      <div className="scene-help-head"><div><span>COMO NAVEGAR</span><b>{viewMode === 'aerial' ? 'Visão do bairro' : viewMode === 'first' ? 'Primeira pessoa' : 'Terceira pessoa'}</b></div><button type="button" onClick={() => setShowControls(false)} aria-label="Fechar ajuda"><X size={16} /></button></div>
      {viewMode === 'aerial' && <ul><li><b>Mouse:</b> arraste para girar; use a roda para aproximar.</li><li><b>Toque:</b> arraste para girar e use pinça para aproximar.</li><li><b>Residências:</b> selecione uma das casas na lista logo abaixo do bairro; ela também funciona por teclado.</li></ul>}
      {viewMode === 'first' && <ul><li><b>Mouse:</b> clique na cena para olhar ao redor; pressione Esc para liberar.</li><li><b>Teclado:</b> W A S D ou setas para andar; Shift para correr.</li><li><b>Toque:</b> use o direcional e os botões na cena.</li></ul>}
      {viewMode === 'third' && <ul><li><b>Teclado:</b> W A S D ou setas para andar; Q / E para girar; Shift para correr.</li><li><b>Toque:</b> use o direcional e os botões na cena.</li><li><b>Residências:</b> a lista abaixo mantém a seleção acessível sem depender da câmera.</li></ul>}
      <p>Selecione um marcador dourado para consultar informações do território e do ODS 7.</p>
    </aside>}

    {viewMode === 'first' && <div className={`neighborhood-first-hint ${isLocked ? 'is-locked' : ''}`}>
      {isLocked ? 'WASD para caminhar · SHIFT para correr · ESC para liberar o mouse' : 'Clique dentro do bairro para começar a explorar · ESC libera o mouse'}
    </div>}
    {viewMode === 'third' && <div className="neighborhood-first-hint">WASD para caminhar · Q/E para girar · SHIFT para correr</div>}
    {viewMode !== 'first' && <MiniMap />}
    {viewMode !== 'aerial' && <TouchPad inputRef={inputRef} />}
    <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />

    <div className="neighborhood-legend">
      <span><i className="legend-house" /> Moradias</span>
      <span><i className="legend-energy" /> Energia / ODS 7</span>
      <span><i className="legend-public" /> Espaços públicos</span>
    </div>
    <div className="neighborhood-status"><span className="status-pulse" /> {layout.houses.length} moradias · {layout.places.length + layout.fullBlocks.length} espaços comunitários</div>
  </div>;
}
