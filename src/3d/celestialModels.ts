/**
 * ALLIFLY 3D Space Explorer - Celestial Bodies & Space Stations
 * Builds planets, moons, atmospheres, rings, space stations, and floating energy crystals
 */

import * as THREE from 'three';
import {
  createEarthLikeTexture,
  createCloudsTexture,
  createDesertTexture,
  createIceTexture,
  createVolcanicTexture,
  createGasGiantTexture,
  createRingsTexture,
} from './proceduralTextures';
import { PlanetData, SpaceStationData } from '../types/game';

export interface PlanetMeshObject {
  data: PlanetData;
  group: THREE.Group;
  planetMesh: THREE.Mesh;
  cloudMesh?: THREE.Mesh;
  ringsMesh?: THREE.Mesh;
  moons: THREE.Mesh[];
  update: (delta: number, time: number) => void;
}

export interface SpaceStationMeshObject {
  data: SpaceStationData;
  group: THREE.Group;
  rotatingRing: THREE.Mesh;
  navLights: THREE.PointLight[];
  update: (delta: number) => void;
}

export interface EnergyCrystalMeshObject {
  id: string;
  type: 'quantum' | 'plasma' | 'darkMatter';
  position: [number, number, number];
  energyValue: number;
  creditValue: number;
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  light: THREE.PointLight;
  collected: boolean;
  baseY: number;
  update: (time: number) => void;
}

/**
 * Creates atmospheric glow outer shell
 */
function createAtmosphereGlow(radius: number, color: string): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius * 1.08, 32, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

/**
 * Creates a planet mesh group with textures, clouds, atmosphere, and moons
 */
export function createPlanetMesh(planet: PlanetData): PlanetMeshObject {
  const group = new THREE.Group();
  group.position.set(...planet.position);
  group.name = `Planet_${planet.id}`;

  let planetTex: THREE.Texture;
  let bumpScale = 0.05;
  let roughness = 0.7;

  switch (planet.type) {
    case 'earth':
      planetTex = createEarthLikeTexture();
      bumpScale = 0.08;
      roughness = 0.6;
      break;
    case 'desert':
      planetTex = createDesertTexture();
      roughness = 0.9;
      break;
    case 'ice':
      planetTex = createIceTexture();
      roughness = 0.2;
      break;
    case 'volcanic':
      planetTex = createVolcanicTexture();
      roughness = 0.8;
      break;
    case 'gasGiant':
      planetTex = createGasGiantTexture();
      roughness = 0.4;
      break;
    case 'alien':
    default:
      planetTex = createIceTexture(); // with alien color tint
      break;
  }

  const planetGeo = new THREE.SphereGeometry(planet.radius, 48, 48);
  const planetMat = new THREE.MeshStandardMaterial({
    map: planetTex,
    roughness: roughness,
    metalness: planet.type === 'ice' ? 0.4 : 0.1,
    bumpScale: bumpScale,
  });

  if (planet.type === 'alien') {
    planetMat.color.setHex(0xa855f7); // Violet alien tint
  }

  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  group.add(planetMesh);

  // Atmosphere Glow
  const glow = createAtmosphereGlow(planet.radius, planet.atmosphereColor);
  group.add(glow);

  // Cloud Layer (for Earth-like & Alien planets)
  let cloudMesh: THREE.Mesh | undefined;
  if (planet.type === 'earth' || planet.type === 'alien') {
    const cloudGeo = new THREE.SphereGeometry(planet.radius * 1.02, 32, 32);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: createCloudsTexture(),
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    group.add(cloudMesh);
  }

  // Planetary Rings (Chronos & Solara Sands)
  let ringsMesh: THREE.Mesh | undefined;
  if (planet.hasRings) {
    const ringGeo = new THREE.RingGeometry(planet.radius * 1.5, planet.radius * 2.8, 64);
    ringGeo.rotateX(Math.PI / 2.2);
    const ringMat = new THREE.MeshStandardMaterial({
      map: createRingsTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    ringsMesh = new THREE.Mesh(ringGeo, ringMat);
    group.add(ringsMesh);
  }

  // Moons orbiting the planet
  const moons: THREE.Mesh[] = [];
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.1,
  });

  for (let m = 0; m < planet.moonsCount; m++) {
    const moonRadius = planet.radius * 0.18;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 16, 16);
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    const dist = planet.radius * 2.2 + m * (planet.radius * 1.1);
    moonMesh.position.set(dist, (m - 0.5) * 8, 0);
    group.add(moonMesh);
    moons.push(moonMesh);
  }

  const update = (delta: number, time: number) => {
    // Planet axis rotation
    planetMesh.rotation.y += delta * 0.08;

    if (cloudMesh) {
      cloudMesh.rotation.y += delta * 0.12;
      cloudMesh.rotation.x = Math.sin(time * 0.05) * 0.02;
    }

    // Moon orbits
    moons.forEach((moon, idx) => {
      const speed = 0.35 / (idx + 1);
      const dist = planet.radius * 2.2 + idx * (planet.radius * 1.1);
      const angle = time * speed + idx * 2.0;
      moon.position.x = Math.cos(angle) * dist;
      moon.position.z = Math.sin(angle) * dist;
      moon.rotation.y += delta * 0.2;
    });
  };

  return { data: planet, group, planetMesh, cloudMesh, ringsMesh, moons, update };
}

/**
 * Creates Space Stations (Aegis Orbital & Hyperion Haven)
 */
export function createSpaceStation(station: SpaceStationData): SpaceStationMeshObject {
  const group = new THREE.Group();
  group.position.set(...station.position);
  group.name = `Station_${station.id}`;

  const stationMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
  });

  const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Central Hub Cylinder
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 28, 16), stationMat);
  group.add(hub);

  // Rotating Toroidal Habitat Ring
  const ringGeo = new THREE.TorusGeometry(18, 2.2, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const rotatingRing = new THREE.Mesh(ringGeo, stationMat);
  group.add(rotatingRing);

  // 4 Connecting Spokes
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 8), stationMat);
    spoke.rotation.z = (Math.PI / 2) * i;
    spoke.position.y = 0;
    rotatingRing.add(spoke);
  }

  // Solar Array Wings
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.9,
    roughness: 0.1,
  });
  const solarWingGeo = new THREE.BoxGeometry(22, 0.3, 5);

  const solarWing1 = new THREE.Mesh(solarWingGeo, solarMat);
  solarWing1.position.set(0, 12, 0);
  group.add(solarWing1);

  const solarWing2 = new THREE.Mesh(solarWingGeo, solarMat);
  solarWing2.position.set(0, -12, 0);
  group.add(solarWing2);

  // Docking Beacon Lights
  const navLights: THREE.PointLight[] = [];
  const lightColors = [0x38bdf8, 0x10b981, 0x38bdf8, 0xf59e0b];
  for (let j = 0; j < 4; j++) {
    const light = new THREE.PointLight(lightColors[j], 2, 25);
    const angle = (Math.PI / 2) * j;
    light.position.set(Math.cos(angle) * 19, 0, Math.sin(angle) * 19);
    rotatingRing.add(light);
    navLights.push(light);

    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), neonMat);
    marker.position.copy(light.position);
    rotatingRing.add(marker);
  }

  const update = (delta: number) => {
    rotatingRing.rotation.y += delta * 0.15;
  };

  return { data: station, group, rotatingRing, navLights, update };
}

/**
 * Creates a glowing Energy Crystal mesh with bobbing & rotating animation
 */
export function createEnergyCrystal(
  id: string,
  type: 'quantum' | 'plasma' | 'darkMatter',
  position: [number, number, number],
  energyValue: number,
  creditValue: number
): EnergyCrystalMeshObject {
  const group = new THREE.Group();
  group.position.set(...position);

  let color = 0x38bdf8; // Quantum Cyan
  if (type === 'plasma') color = 0xa855f7; // Plasma Violet
  if (type === 'darkMatter') color = 0xf59e0b; // Amber

  const crystalGeo = new THREE.OctahedronGeometry(1.6, 0);
  crystalGeo.scale(0.8, 1.4, 0.8);

  const crystalMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.1,
    metalness: 0.9,
    emissive: color,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  group.add(crystalMesh);

  // Inner bright glowing core
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), coreMat);
  group.add(coreMesh);

  // Point light for illumination
  const light = new THREE.PointLight(color, 2.5, 12);
  group.add(light);

  const baseY = position[1];

  const update = (time: number) => {
    crystalMesh.rotation.y = time * 1.4;
    crystalMesh.rotation.x = Math.sin(time * 0.8) * 0.2;
    coreMesh.rotation.y = -time * 1.8;
    group.position.y = baseY + Math.sin(time * 2.2 + position[0]) * 0.8;
  };

  return {
    id,
    type,
    position,
    energyValue,
    creditValue,
    group,
    crystalMesh,
    light,
    collected: false,
    baseY,
    update,
  };
}

/**
 * Creates Asteroid Field Instanced Mesh with tumbled rocks
 */
export function createAsteroidField(count = 250, radiusMin = 350, radiusMax = 700): THREE.InstancedMesh {
  const geo = new THREE.DodecahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.25,
  });

  const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = radiusMin + Math.random() * (radiusMax - radiusMin);
    const height = (Math.random() - 0.5) * 120;

    dummy.position.set(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    );

    const scale = 2.0 + Math.random() * 8.0;
    dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);

    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.computeBoundingSphere();
  return instancedMesh;
}

/**
 * Creates deep space starfield with thousands of colored stars
 */
export function createStarfield(count = 4000, bounds = 2500): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const starColors = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#38bdf8'), // Cyan
    new THREE.Color('#818cf8'), // Blue-violet
    new THREE.Color('#fbbf24'), // Warm yellow
  ];

  for (let i = 0; i < count; i++) {
    const radius = 1000 + Math.random() * (bounds - 1000);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const c = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}
