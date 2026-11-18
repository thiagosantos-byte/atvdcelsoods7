import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { groundHeight, isBlockedPosition } from './terrain.js';

function readKeyboard(inputRef, event, pressed) {
  const codeMap = {
    KeyW: 'forward', ArrowUp: 'forward',
    KeyS: 'backward', ArrowDown: 'backward',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
    KeyQ: 'turnLeft', KeyE: 'turnRight'
  };
  const key = codeMap[event.code];
  if (!key) return;
  inputRef.current[key] = pressed;
  if (['forward', 'backward', 'left', 'right', 'sprint', 'turnLeft', 'turnRight'].includes(key)) event.preventDefault();
}

function useMovementKeys(enabled, inputRef) {
  useEffect(() => {
    if (!enabled) return undefined;
    const down = (event) => readKeyboard(inputRef, event, true);
    const up = (event) => readKeyboard(inputRef, event, false);
    const clear = () => {
      Object.keys(inputRef.current).forEach((key) => { inputRef.current[key] = false; });
    };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      clear();
    };
  }, [enabled, inputRef]);
}

export function FirstPersonController({ inputRef, obstacles, onLockChange }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  useMovementKeys(true, inputRef);

  useEffect(() => {
    camera.position.set(0, groundHeight(0, 51) + 1.72, 51);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    const state = inputRef.current;
    const hasTouchOrKeyboardInput = state.forward || state.backward || state.left || state.right || state.turnLeft || state.turnRight;
    if (!controlsRef.current?.isLocked && !hasTouchOrKeyboardInput) return;
    if (state.turnLeft) camera.rotation.y += delta * 1.45;
    if (state.turnRight) camera.rotation.y -= delta * 1.45;
    const speed = state.sprint ? 10 : 5.4;
    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    movement.current.set(0, 0, 0);
    movement.current.addScaledVector(forward.current, Number(state.forward) - Number(state.backward));
    movement.current.addScaledVector(right.current, Number(state.right) - Number(state.left));
    if (movement.current.lengthSq() > 0) {
      movement.current.normalize().multiplyScalar(speed * Math.min(delta, 0.05));
      const nextX = THREE.MathUtils.clamp(camera.position.x + movement.current.x, -58, 58);
      const nextZ = THREE.MathUtils.clamp(camera.position.z + movement.current.z, -58, 58);
      if (!isBlockedPosition(nextX, camera.position.z, obstacles)) camera.position.x = nextX;
      if (!isBlockedPosition(camera.position.x, nextZ, obstacles)) camera.position.z = nextZ;
    }
    camera.position.y = groundHeight(camera.position.x, camera.position.z) + 1.72;
  });

  return <PointerLockControls
    ref={controlsRef}
    onLock={() => onLockChange(true)}
    onUnlock={() => onLockChange(false)}
  />;
}

function ExplorerModel({ playerRef }) {
  return <group ref={playerRef}>
    <mesh position={[0, 1.0, 0]} castShadow><capsuleGeometry args={[0.31, 0.82, 4, 8]} /><meshStandardMaterial color="#345f68" roughness={0.86} /></mesh>
    <mesh position={[0, 1.78, 0]} castShadow><sphereGeometry args={[0.23, 14, 12]} /><meshStandardMaterial color="#a9785e" roughness={0.92} /></mesh>
    <mesh position={[0, 1.94, -0.035]}><sphereGeometry args={[0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><meshStandardMaterial color="#2c2927" roughness={1} /></mesh>
    <mesh position={[-0.19, 0.26, 0]}><boxGeometry args={[0.16, 0.58, 0.22]} /><meshStandardMaterial color="#3f4747" /></mesh>
    <mesh position={[0.19, 0.26, 0]}><boxGeometry args={[0.16, 0.58, 0.22]} /><meshStandardMaterial color="#3f4747" /></mesh>
  </group>;
}

export function ThirdPersonController({ inputRef, obstacles }) {
  const { camera } = useThree();
  const playerRef = useRef(null);
  const yaw = useRef(Math.PI);
  const playerPosition = useRef(new THREE.Vector3(0, groundHeight(0, 51), 51));
  const desiredCamera = useRef(new THREE.Vector3());
  const move = useRef(new THREE.Vector3());
  useMovementKeys(true, inputRef);

  useEffect(() => {
    playerPosition.current.set(0, groundHeight(0, 51), 51);
    camera.position.set(0, groundHeight(0, 51) + 5, 58);
    camera.lookAt(0, groundHeight(0, 51) + 1, 51);
  }, [camera]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const state = inputRef.current;
    const safeDelta = Math.min(delta, 0.05);
    const turnSpeed = 1.8 * safeDelta;
    if (state.turnLeft) yaw.current += turnSpeed;
    if (state.turnRight) yaw.current -= turnSpeed;

    const forwardX = Math.sin(yaw.current);
    const forwardZ = Math.cos(yaw.current);
    const rightX = Math.cos(yaw.current);
    const rightZ = -Math.sin(yaw.current);
    const forwardAmount = Number(state.forward) - Number(state.backward);
    const rightAmount = Number(state.right) - Number(state.left);
    move.current.set(forwardX * forwardAmount + rightX * rightAmount, 0, forwardZ * forwardAmount + rightZ * rightAmount);

    if (move.current.lengthSq() > 0) {
      move.current.normalize().multiplyScalar((state.sprint ? 8.2 : 4.2) * safeDelta);
      const nextX = THREE.MathUtils.clamp(playerPosition.current.x + move.current.x, -58, 58);
      const nextZ = THREE.MathUtils.clamp(playerPosition.current.z + move.current.z, -58, 58);
      if (!isBlockedPosition(nextX, playerPosition.current.z, obstacles)) playerPosition.current.x = nextX;
      if (!isBlockedPosition(playerPosition.current.x, nextZ, obstacles)) playerPosition.current.z = nextZ;
    }

    playerPosition.current.y = groundHeight(playerPosition.current.x, playerPosition.current.z);
    playerRef.current.position.copy(playerPosition.current);
    playerRef.current.rotation.y = yaw.current;

    desiredCamera.current.set(
      playerPosition.current.x - Math.sin(yaw.current) * 7.2,
      playerPosition.current.y + 4.4,
      playerPosition.current.z - Math.cos(yaw.current) * 7.2
    );
    camera.position.lerp(desiredCamera.current, 1 - Math.exp(-5 * safeDelta));
    camera.lookAt(playerPosition.current.x, playerPosition.current.y + 1.05, playerPosition.current.z);
  });

  return <ExplorerModel playerRef={playerRef} />;
}
