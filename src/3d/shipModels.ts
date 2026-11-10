/**
 * ALLIFLY 3D Space Explorer - Procedural 3D Spaceship Models
 * Composite 3-12 part THREE.Group hierarchy with distinct materials,
 * cockpits, wings, glow engines, and exhaust nodes.
 * 
 * ALIGNMENT: Ships are oriented facing forward along -Z (Three.js standard forward),
 * with engine thrusters and exhaust plumes pointing backwards along +Z.
 */

import * as THREE from 'three';
import { createHullPanelTexture } from './proceduralTextures';

export interface ShipMeshInstance {
  group: THREE.Group;
  thrusterNodes: THREE.Mesh[];
  exhaustLights: THREE.PointLight[];
  cockpitInterior: THREE.Group;
  updateExhaust: (intensity: number, isBoosting: boolean) => void;
}

const bumpMap = createHullPanelTexture();

/**
 * Builds the flagship Allifly Starwing 3D model
 */
export function createStarwingShip(): ShipMeshInstance {
  const group = new THREE.Group();
  group.name = 'AlliflyStarwing';

  // Inner body rotated by 180 degrees so Nose points to -Z (forward) and Engines to +Z (rear)
  const shipBody = new THREE.Group();
  shipBody.rotation.y = Math.PI;
  group.add(shipBody);

  // Materials
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Deep dark slate
    roughness: 0.35,
    metalness: 0.85,
    bumpMap: bumpMap,
    bumpScale: 0.04,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant cyan-blue
    roughness: 0.2,
    metalness: 0.9,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });

  const glowEngineMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
  });

  const consoleGlowMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
  });

  // 1. Primary Silhouette: Main Center Fuselage
  const fuselageShape = new THREE.Shape();
  fuselageShape.moveTo(0, 4.4); // Sleek forward Nose
  fuselageShape.lineTo(0.9, 2.0);
  fuselageShape.lineTo(1.1, -1.8);
  fuselageShape.lineTo(0.6, -3.2); // Tail
  fuselageShape.lineTo(-0.6, -3.2);
  fuselageShape.lineTo(-1.1, -1.8);
  fuselageShape.lineTo(-0.9, 2.0);
  fuselageShape.closePath();

  const extrudeSettings = {
    steps: 2,
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.25,
    bevelSegments: 3,
  };
  const fuselageGeo = new THREE.ExtrudeGeometry(fuselageShape, extrudeSettings);
  fuselageGeo.rotateX(Math.PI / 2);

  const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  shipBody.add(fuselage);

  // 2. Cockpit Canopy Glass & Interior
  const cockpitGeo = new THREE.ConeGeometry(0.65, 2.6, 6);
  cockpitGeo.rotateX(Math.PI / 2);
  cockpitGeo.scale(1, 0.55, 1);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(0, 0.45, 0.8);
  shipBody.add(cockpit);

  // Cockpit interior group (visible from outside and inside cockpit camera)
  const cockpitInterior = new THREE.Group();
  const pilotSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.5), interiorMat);
  pilotSeat.position.set(0, 0.2, 0.4);
  cockpitInterior.add(pilotSeat);

  const flightConsole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.3), consoleGlowMat);
  flightConsole.position.set(0, 0.35, 1.1);
  flightConsole.rotation.x = -0.3;
  cockpitInterior.add(flightConsole);
  shipBody.add(cockpitInterior);

  // 3. Main Swept Wings (Left & Right)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4.8, -2.6);
  wingShape.lineTo(4.6, -3.4);
  wingShape.lineTo(2.2, -2.8);
  wingShape.lineTo(0, -1.8);
  wingShape.closePath();

  const wingExtrude = {
    steps: 1,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  };

  const leftWingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
  leftWingGeo.rotateX(Math.PI / 2);
  const leftWing = new THREE.Mesh(leftWingGeo, hullMat);
  leftWing.position.set(0.6, 0.05, 0);
  leftWing.castShadow = true;
  shipBody.add(leftWing);

  // Right wing (mirrored)
  const rightWingGeo = leftWingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  const rightWing = new THREE.Mesh(rightWingGeo, hullMat);
  rightWing.position.set(-0.6, 0.05, 0);
  rightWing.castShadow = true;
  shipBody.add(rightWing);

  // Wing plasma edge glowing strips
  const leftEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.5, 6), glowEngineMat);
  leftEdge.rotation.z = -1.05;
  leftEdge.position.set(2.8, 0.08, -1.3);
  shipBody.add(leftEdge);

  const rightEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.5, 6), glowEngineMat);
  rightEdge.rotation.z = 1.05;
  rightEdge.position.set(-2.8, 0.08, -1.3);
  shipBody.add(rightEdge);

  // Wingtip vertical stabilizers
  const wingtipGeo = new THREE.BoxGeometry(0.12, 1.1, 1.4);
  const leftTip = new THREE.Mesh(wingtipGeo, accentMat);
  leftTip.position.set(4.7, 0.5, -2.8);
  shipBody.add(leftTip);

  const rightTip = new THREE.Mesh(wingtipGeo, accentMat);
  rightTip.position.set(-4.7, 0.5, -2.8);
  shipBody.add(rightTip);

  // 4. Canard Wings (Forward maneuver stabilizers)
  const canardGeo = new THREE.BoxGeometry(1.2, 0.06, 0.7);
  const leftCanard = new THREE.Mesh(canardGeo, accentMat);
  leftCanard.position.set(1.1, 0.1, 2.2);
  leftCanard.rotation.y = -0.3;
  shipBody.add(leftCanard);

  const rightCanard = new THREE.Mesh(canardGeo, accentMat);
  rightCanard.position.set(-1.1, 0.1, 2.2);
  rightCanard.rotation.y = 0.3;
  shipBody.add(rightCanard);

  // 5. Twin Ion Engine Pods & Glowing Exhaust Nozzles
  const enginePodGeo = new THREE.CylinderGeometry(0.42, 0.48, 2.4, 12);
  enginePodGeo.rotateX(Math.PI / 2);

  const leftPod = new THREE.Mesh(enginePodGeo, accentMat);
  leftPod.position.set(1.0, 0.1, -2.2);
  shipBody.add(leftPod);

  const rightPod = new THREE.Mesh(enginePodGeo, accentMat);
  rightPod.position.set(-1.0, 0.1, -2.2);
  shipBody.add(rightPod);

  // Thruster glow cones
  const thrusterGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.3, 12);
  thrusterGeo.rotateX(Math.PI / 2);

  const leftThruster = new THREE.Mesh(thrusterGeo, glowEngineMat);
  leftThruster.position.set(1.0, 0.1, -3.4);
  shipBody.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, glowEngineMat);
  rightThruster.position.set(-1.0, 0.1, -3.4);
  shipBody.add(rightThruster);

  // Point lights for engine glow illumination
  const leftLight = new THREE.PointLight(0x38bdf8, 2.5, 9);
  leftLight.position.set(1.0, 0.1, -3.7);
  shipBody.add(leftLight);

  const rightLight = new THREE.PointLight(0x38bdf8, 2.5, 9);
  rightLight.position.set(-1.0, 0.1, -3.7);
  shipBody.add(rightLight);

  // 6. Realistic Engine Exhaust Flames (Shooting rearwards)
  const flameGeo = new THREE.ConeGeometry(0.38, 2.4, 8);
  flameGeo.rotateX(-Math.PI / 2);
  flameGeo.translate(0, 0, -1.2);

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.85,
  });

  const leftFlame = new THREE.Mesh(flameGeo, flameMat);
  leftFlame.position.set(1.0, 0.1, -3.5);
  shipBody.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeo, flameMat);
  rightFlame.position.set(-1.0, 0.1, -3.5);
  shipBody.add(rightFlame);

  // Ventral sensor ball / antenna
  const sensorGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const sensor = new THREE.Mesh(sensorGeo, consoleGlowMat);
  sensor.position.set(0, -0.4, 1.2);
  shipBody.add(sensor);

  // Dynamic update method for engine flame size and lights
  const updateExhaust = (intensity: number, isBoosting: boolean) => {
    const scale = isBoosting ? 2.5 : 0.8 + intensity * 1.0;
    leftFlame.scale.set(scale * 0.9, scale * 0.9, scale * 1.6);
    rightFlame.scale.set(scale * 0.9, scale * 0.9, scale * 1.6);

    const lightColor = isBoosting ? 0xa855f7 : 0x38bdf8;
    const lightPower = isBoosting ? 5.0 : 1.2 + intensity * 2.2;

    leftLight.color.setHex(lightColor);
    rightLight.color.setHex(lightColor);
    leftLight.intensity = lightPower;
    rightLight.intensity = lightPower;

    flameMat.color.setHex(isBoosting ? 0xc084fc : 0x7dd3fc);
  };

  return {
    group,
    thrusterNodes: [leftThruster, rightThruster],
    exhaustLights: [leftLight, rightLight],
    cockpitInterior,
    updateExhaust,
  };
}

/**
 * Builds the heavy combat Void Phoenix 3D model
 */
export function createVoidPhoenixShip(): ShipMeshInstance {
  const group = new THREE.Group();
  group.name = 'VoidPhoenix';

  const shipBody = new THREE.Group();
  shipBody.rotation.y = Math.PI;
  group.add(shipBody);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.25,
    metalness: 0.92,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed, // Royal violet
    roughness: 0.3,
    metalness: 0.8,
  });

  const glowMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });

  // Main heavy chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 5.2), hullMat);
  body.castShadow = true;
  shipBody.add(body);

  // Twin angular booms
  const boomGeo = new THREE.BoxGeometry(0.8, 0.7, 6.0);
  const leftBoom = new THREE.Mesh(boomGeo, accentMat);
  leftBoom.position.set(1.8, 0, -0.5);
  shipBody.add(leftBoom);

  const rightBoom = new THREE.Mesh(boomGeo, accentMat);
  rightBoom.position.set(-1.8, 0, -0.5);
  shipBody.add(rightBoom);

  // Angled wing blades
  const bladeGeo = new THREE.BoxGeometry(2.8, 0.15, 2.2);
  const leftBlade = new THREE.Mesh(bladeGeo, hullMat);
  leftBlade.position.set(3.2, 0.2, -1.0);
  leftBlade.rotation.z = 0.2;
  shipBody.add(leftBlade);

  const rightBlade = new THREE.Mesh(bladeGeo, hullMat);
  rightBlade.position.set(-3.2, 0.2, -1.0);
  rightBlade.rotation.z = -0.2;
  shipBody.add(rightBlade);

  // Cockpit
  const cockpit = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 4), glowMat);
  cockpit.rotateX(Math.PI / 2);
  cockpit.position.set(0, 0.5, 1.8);
  shipBody.add(cockpit);

  // Quad Exhausts
  const tGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8);
  tGeo.rotateX(Math.PI / 2);

  const thrusters: THREE.Mesh[] = [];
  const exhaustLights: THREE.PointLight[] = [];

  const offsets = [
    [-1.8, 0, -3.6],
    [-0.6, 0, -2.8],
    [0.6, 0, -2.8],
    [1.8, 0, -3.6],
  ];

  offsets.forEach((pos) => {
    const t = new THREE.Mesh(tGeo, glowMat);
    t.position.set(pos[0], pos[1], pos[2]);
    shipBody.add(t);
    thrusters.push(t);

    const light = new THREE.PointLight(0xc084fc, 1.8, 8);
    light.position.set(pos[0], pos[1], pos[2] - 0.3);
    shipBody.add(light);
    exhaustLights.push(light);
  });

  const cockpitInterior = new THREE.Group();
  shipBody.add(cockpitInterior);

  const updateExhaust = (intensity: number, isBoosting: boolean) => {
    exhaustLights.forEach((light) => {
      light.intensity = isBoosting ? 4.5 : 1.0 + intensity * 2.2;
    });
  };

  return { group, thrusterNodes: thrusters, exhaustLights, cockpitInterior, updateExhaust };
}

/**
 * Builds the Chrono Cruiser (Explorer with warp ring)
 */
export function createChronoCruiserShip(): ShipMeshInstance {
  const group = new THREE.Group();
  group.name = 'ChronoCruiser';

  const shipBody = new THREE.Group();
  shipBody.rotation.y = Math.PI;
  group.add(shipBody);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.85,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    metalness: 0.9,
    roughness: 0.15,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Central needle hull
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 7.5, 8), hullMat);
  needle.rotateX(Math.PI / 2);
  shipBody.add(needle);

  // Massive Quantum Warp Ring
  const torus = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 12, 32), ringMat);
  torus.position.set(0, 0, -0.6);
  shipBody.add(torus);

  // Glow ring inside warp ring
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 8, 32), glowMat);
  glowRing.position.set(0, 0, -0.6);
  shipBody.add(glowRing);

  // Twin radar radomes
  const dishGeo = new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const leftDish = new THREE.Mesh(dishGeo, hullMat);
  leftDish.position.set(1.5, 0.8, 1.2);
  leftDish.rotation.x = -0.5;
  shipBody.add(leftDish);

  const rightDish = new THREE.Mesh(dishGeo, hullMat);
  rightDish.position.set(-1.5, 0.8, 1.2);
  rightDish.rotation.x = -0.5;
  shipBody.add(rightDish);

  // Thruster
  const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.6, 12), glowMat);
  thruster.rotateX(Math.PI / 2);
  thruster.position.set(0, 0, -3.8);
  shipBody.add(thruster);

  const exhaustLight = new THREE.PointLight(0x38bdf8, 2.5, 11);
  exhaustLight.position.set(0, 0, -4.2);
  shipBody.add(exhaustLight);

  const cockpitInterior = new THREE.Group();
  shipBody.add(cockpitInterior);

  const updateExhaust = (intensity: number, isBoosting: boolean) => {
    exhaustLight.intensity = isBoosting ? 5.0 : 1.2 + intensity * 2.2;
  };

  return { group, thrusterNodes: [thruster], exhaustLights: [exhaustLight], cockpitInterior, updateExhaust };
}
