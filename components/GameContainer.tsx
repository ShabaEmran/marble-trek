
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { LevelConfig } from '../types';
import { COLORS, PHYSICS, CAMERA, MAZE_CELL_SIZE, BRIDGE_WIDTH } from '../constants';
import { audioService } from '../services/audioService';
import Joystick from './Joystick';

interface GameContainerProps {
  levelConfig: LevelConfig;
  onCoinCollected: () => void;
  onLevelComplete: () => void;
  onFallOff: () => void;
}

const dummy = new THREE.Object3D();
const ballTargetPos = new THREE.Vector3();
const cannonVecGoal = new CANNON.Vec3();

const createWoodTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(0, 0, 1024, 1024);
  const plankCount = 6;
  const pw = 1024 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const x = i * pw;
    ctx.fillStyle = i % 2 === 0 ? '#795548' : '#8D6E63';
    ctx.fillRect(x, 0, pw, 1024);
    ctx.globalAlpha = 0.25;
    for (let j = 0; j < 60; j++) {
      ctx.beginPath();
      ctx.strokeStyle = Math.random() > 0.5 ? '#3E2723' : '#BCAAA4';
      ctx.lineWidth = 1 + Math.random() * 2;
      const gx = x + Math.random() * pw;
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 60, 300, gx - 60, 700, gx + Math.random() * 20, 1024);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = '#1B110F';
  ctx.lineWidth = 12;
  for (let i = 0; i <= plankCount; i++) {
    const x = i * pw;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  return texture;
};

const GameContainer: React.FC<GameContainerProps> = ({ 
  levelConfig, onCoinCollected, onLevelComplete, onFallOff 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickVector = useRef({ x: 0, y: 0 });
  const gameRunning = useRef(true);
  const fallStartTime = useRef<number | null>(null);
  const spawnPos = useRef({ x: 0, y: 3.0, z: 0 });

  useEffect(() => {
    if (!containerRef.current || !levelConfig) return;

    audioService.playAmbient();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.SKY);
    scene.fog = new THREE.FogExp2(COLORS.SKY, 0.018);

    const camera = new THREE.PerspectiveCamera(CAMERA.DEFAULT_FOV, window.innerWidth / window.innerHeight, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xFFDAB9, 0.7);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xFFB74D, 1.8);
    sun.position.set(300, 200, -500);
    sun.castShadow = true;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const sunSphereGeo = new THREE.SphereGeometry(60, 32, 32);
    const sunSphereMat = new THREE.MeshBasicMaterial({ color: 0xFFD180, transparent: true, opacity: 0.6 });
    const sunSphere = new THREE.Mesh(sunSphereGeo, sunSphereMat);
    sunSphere.position.set(400, 150, -1200);
    scene.add(sunSphere);

    const createMountainLayer = (count: number, dist: number, scale: number, color: number) => {
      const group = new THREE.Group();
      const geo = new THREE.ConeGeometry(80 * scale, 120 * scale, 4 + Math.floor(Math.random() * 3));
      const mat = new THREE.MeshPhongMaterial({ color, flatShading: true, shininess: 0 });
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random();
        const mtn = new THREE.Mesh(geo, mat);
        mtn.position.set(Math.cos(angle) * dist, -30 * scale, Math.sin(angle) * dist);
        mtn.scale.set(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random());
        mtn.rotation.y = Math.random() * Math.PI;
        group.add(mtn);
      }
      return group;
    };
    scene.add(createMountainLayer(15, 600, 1.5, 0x3E2723));
    scene.add(createMountainLayer(25, 1200, 3.0, 0x2D1B18));

    const waterGeo = new THREE.PlaneGeometry(5000, 5000);
    const waterMat = new THREE.MeshPhongMaterial({ color: COLORS.FLOOR, transparent: true, opacity: 0.9, shininess: 100 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -25; 
    scene.add(water);

    const world = new CANNON.World();
    world.gravity.set(0, PHYSICS.GRAVITY, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 20;

    const groundMat = new CANNON.Material('ground');
    const ballMat = new CANNON.Material('ball');
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: PHYSICS.FRICTION, restitution: PHYSICS.RESTITUTION }));

    const woodTexture = createWoodTexture();
    const pathGeo = new THREE.BoxGeometry(BRIDGE_WIDTH, 0.5, MAZE_CELL_SIZE + 0.5);
    const pathMeshMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.8, metalness: 0.1 });
    
    let pathCount = 0;
    levelConfig.maze.forEach(row => row.forEach(cell => { if (cell === 0 || cell === 2) pathCount++; }));

    const pathInstances = new THREE.InstancedMesh(pathGeo, pathMeshMat, pathCount);
    pathInstances.castShadow = true;
    pathInstances.receiveShadow = true;
    scene.add(pathInstances);

    let pathIdx = 0;
    let goalX = 0, goalZ = 0;

    levelConfig.maze.forEach((row, i) => {
      row.forEach((cell, j) => {
        const x = i * MAZE_CELL_SIZE;
        const z = j * MAZE_CELL_SIZE;
        if (cell === 0 || cell === 2) {
          dummy.position.set(x, 0, z);
          const neighborX = (levelConfig.maze[i+1]?.[j] === 0 || levelConfig.maze[i-1]?.[j] === 0);
          dummy.rotation.y = neighborX ? Math.PI / 2 : 0;
          dummy.updateMatrix();
          pathInstances.setMatrixAt(pathIdx++, dummy.matrix);
          const body = new CANNON.Body({ mass: 0, material: groundMat, shape: new CANNON.Box(new CANNON.Vec3(BRIDGE_WIDTH / 2, 0.25, BRIDGE_WIDTH / 2)) });
          body.position.set(x, 0, z);
          world.addBody(body);
          if (cell === 2) {
            goalX = x; goalZ = z;
            const goalRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 16, 48), new THREE.MeshStandardMaterial({ color: COLORS.GOAL, emissive: COLORS.GOAL, emissiveIntensity: 2 }));
            goalRing.rotation.x = -Math.PI / 2;
            goalRing.position.set(x, 0.6, z);
            scene.add(goalRing);
          }
        }
      });
    });

    const ballBody = new CANNON.Body({ mass: PHYSICS.BALL_MASS, material: ballMat, shape: new CANNON.Sphere(PHYSICS.BALL_RADIUS), linearDamping: PHYSICS.DAMPING, angularDamping: PHYSICS.ANGULAR_DAMPING });

    let spawnFound = false;
    for(let i=0; i<levelConfig.width; i++) {
        for(let j=0; j<levelConfig.height; j++) {
            if(levelConfig.maze[i][j] === 0) {
                spawnPos.current = { x: i * MAZE_CELL_SIZE, y: 3.0, z: j * MAZE_CELL_SIZE };
                ballBody.position.set(spawnPos.current.x, spawnPos.current.y, spawnPos.current.z);
                spawnFound = true;
                break;
            }
        }
        if(spawnFound) break;
    }
    world.addBody(ballBody);

    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(PHYSICS.BALL_RADIUS, 48, 48), new THREE.MeshStandardMaterial({ color: COLORS.BALL, roughness: 0.02, metalness: 0.4 }));
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 24);
    const coinMat = new THREE.MeshStandardMaterial({ color: COLORS.COIN, metalness: 1, roughness: 0.1, emissive: COLORS.COIN, emissiveIntensity: 0.6 });
    const coins = levelConfig.coins.map(c => {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      const pos = new CANNON.Vec3(c.x * MAZE_CELL_SIZE, 1.3, c.z * MAZE_CELL_SIZE);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.x = Math.PI / 2;
      mesh.castShadow = true;
      scene.add(mesh);
      return { mesh, pos, collected: false };
    });

    cannonVecGoal.set(goalX, 0, goalZ);

    const animate = () => {
      if (!gameRunning.current) return;
      requestAnimationFrame(animate);
      
      world.fixedStep(); 

      const jX = joystickVector.current.x;
      const jY = joystickVector.current.y;
      ballBody.applyForce(new CANNON.Vec3(jX * PHYSICS.MOVE_FORCE, 0, -jY * PHYSICS.MOVE_FORCE), ballBody.position);

      const vel = ballBody.velocity;
      const speedSq = vel.x * vel.x + vel.z * vel.z;
      const speed = Math.sqrt(speedSq);

      if (speedSq > PHYSICS.MAX_SPEED * PHYSICS.MAX_SPEED) {
        const factor = PHYSICS.MAX_SPEED / speed;
        vel.x *= factor;
        vel.z *= factor;
      }

      ballMesh.position.copy(ballBody.position as any);
      ballMesh.quaternion.copy(ballBody.quaternion as any);

      coins.forEach(c => {
        if (!c.collected) {
          c.mesh.rotation.y += 0.1;
          if (ballBody.position.distanceTo(c.pos) < 1.5) {
            c.collected = true;
            c.mesh.visible = false;
            audioService.playCoin();
            onCoinCollected();
          }
        }
      });

      const isFalling = ballBody.position.y < -1.5;
      if (isFalling) {
        if (!fallStartTime.current) fallStartTime.current = performance.now();
        camera.fov = THREE.MathUtils.lerp(camera.fov, CAMERA.FALL_FOV, 0.1);
        camera.updateProjectionMatrix();
        ballTargetPos.set(ballBody.position.x, ballBody.position.y + 18, ballBody.position.z + 4);
        camera.position.lerp(ballTargetPos, 0.08);
        camera.lookAt(ballBody.position.x, ballBody.position.y, ballBody.position.z);
      } else {
        fallStartTime.current = null;
        camera.fov = THREE.MathUtils.lerp(camera.fov, CAMERA.DEFAULT_FOV, 0.1);
        camera.updateProjectionMatrix();
        ballTargetPos.set(ballBody.position.x, CAMERA.HEIGHT, ballBody.position.z + CAMERA.OFFSET_Z);
        camera.position.lerp(ballTargetPos, CAMERA.LERP_FACTOR);
        camera.lookAt(ballBody.position.x, 0, ballBody.position.z);
      }

      // Check if the ball fell into the ocean threshold
      if (ballBody.position.y < -25) {
        // Respawn Logic
        ballBody.position.set(spawnPos.current.x, spawnPos.current.y, spawnPos.current.z);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
        
        // Reset camera state
        fallStartTime.current = null;
        camera.fov = CAMERA.DEFAULT_FOV;
        camera.updateProjectionMatrix();
        
        // Notify app (e.g. for audio feedback)
        onFallOff();
      } else if (ballBody.position.distanceTo(cannonVecGoal) < 2.0) {
        gameRunning.current = false;
        audioService.playSuccess();
        onLevelComplete();
      }

      renderer.render(scene, camera);
    };

    requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      gameRunning.current = false;
      audioService.stopAmbient();
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [levelConfig]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#ff9e80] touch-none">
      <Joystick onMove={(v) => (joystickVector.current = v)} />
    </div>
  );
};

export default GameContainer;
