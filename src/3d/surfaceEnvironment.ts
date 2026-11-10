/**
 * ALLIFLY 3D Space Explorer - Planetary Surface Exploration Environment
 * Procedural surface terrain heightfield, landing pad, surface crystals, alien monoliths & relics.
 */

import * as THREE from 'three';
import { PlanetData } from '../types/game';
import { createEnergyCrystal, EnergyCrystalMeshObject } from './celestialModels';

export interface SurfaceDiscoveryObject {
  id: string;
  name: string;
  position: THREE.Vector3;
  group: THREE.Group;
  scanned: boolean;
  rewardCredits: number;
}

export interface SurfaceEnvironment {
  group: THREE.Group;
  surfaceCrystals: EnergyCrystalMeshObject[];
  surfaceDiscoveries: SurfaceDiscoveryObject[];
  landingPadPos: THREE.Vector3;
  update: (delta: number, time: number) => void;
  dispose: () => void;
}

export function createSurfaceEnvironment(planet: PlanetData): SurfaceEnvironment {
  const group = new THREE.Group();
  group.name = `Surface_${planet.id}`;

  // 1. Terrain Mesh with Procedural Heightfield
  const terrainSize = 700;
  const segments = 100;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    // Keep center flat for landing zone
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 38) {
      posAttr.setY(i, 0);
      continue;
    }

    // Procedural terrain height variations
    let y = 0;
    if (planet.type === 'earth') {
      y = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 18 + Math.sin(x * 0.06 + z * 0.04) * 7;
    } else if (planet.type === 'desert') {
      // Rolling sand dunes
      y = Math.sin(x * 0.035 + z * 0.015) * 14 + Math.cos(z * 0.04) * 5;
    } else if (planet.type === 'ice') {
      // Sharp ice canyons
      y = Math.abs(Math.sin(x * 0.03) * Math.cos(z * 0.03)) * 26;
    } else if (planet.type === 'volcanic') {
      // Craggy basalt ridges
      y = (Math.sin(x * 0.04) + Math.cos(z * 0.04)) * 16 + Math.sin(x * 0.08) * 9;
    } else {
      // Alien spires
      y = Math.sin(x * 0.025) * 22 + Math.cos(z * 0.05) * 12;
    }

    // Blend smoothly outward from pad
    const blend = Math.min(1.0, (distFromCenter - 38) / 45);
    posAttr.setY(i, y * blend);
  }

  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(planet.groundColor),
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Landing Pad Platform & Beacon Runway
  const padGeo = new THREE.CylinderGeometry(20, 21, 1.4, 28);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });
  const landingPad = new THREE.Mesh(padGeo, padMat);
  landingPad.position.set(0, 0.7, 0);
  landingPad.receiveShadow = true;
  group.add(landingPad);

  // Landing Pad Glowing Rings
  const padRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const padRing = new THREE.Mesh(new THREE.RingGeometry(13, 14.5, 32), padRingMat);
  padRing.rotateX(-Math.PI / 2);
  padRing.position.set(0, 1.45, 0);
  group.add(padRing);

  // Perimeter Approach Lights
  for (let l = 0; l < 8; l++) {
    const angle = (Math.PI * 2 / 8) * l;
    const lightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), padRingMat);
    lightMesh.position.set(Math.cos(angle) * 18, 1.6, Math.sin(angle) * 18);
    group.add(lightMesh);
  }

  // 3. Planetary Sky Dome
  const skyGeo = new THREE.SphereGeometry(550, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(planet.skyColor),
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.set(0, 0, 0);
  group.add(skyDome);

  // 4. Surface Crystals tucked into the terrain
  const surfaceCrystals: EnergyCrystalMeshObject[] = [];
  const crystalCoords: [number, number, number, 'quantum' | 'plasma' | 'darkMatter'][] = [
    [50, 5, 35, 'quantum'],
    [-60, 7, 45, 'quantum'],
    [75, 9, -70, 'plasma'],
    [-80, 8, -60, 'plasma'],
    [130, 14, 100, 'darkMatter'],
    [-140, 16, 120, 'darkMatter'],
    [90, 11, 140, 'plasma'],
    [-110, 12, -130, 'quantum'],
  ];

  crystalCoords.forEach((coord, i) => {
    const crystal = createEnergyCrystal(
      `surface_${planet.id}_${i}`,
      coord[3],
      [coord[0], coord[1], coord[2]],
      coord[3] === 'darkMatter' ? 50 : coord[3] === 'plasma' ? 25 : 10,
      coord[3] === 'darkMatter' ? 35 : coord[3] === 'plasma' ? 15 : 5
    );
    group.add(crystal.group);
    surfaceCrystals.push(crystal);
  });

  // 5. Planetary Relic / Ancient Monolith Discovery Site
  const surfaceDiscoveries: SurfaceDiscoveryObject[] = [];
  const monolithGroup = new THREE.Group();
  monolithGroup.position.set(85, 4, -85);

  const monolithMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.95,
    roughness: 0.1,
  });
  const monolithMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 4), monolithMat);
  monolithMesh.position.set(0, 9, 0);
  monolithGroup.add(monolithMesh);

  // Glowing glyph ring around monolith
  const glyphMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const glyphRing = new THREE.Mesh(new THREE.TorusGeometry(5, 0.25, 8, 24), glyphMat);
  glyphRing.rotateX(Math.PI / 2);
  glyphRing.position.set(0, 9, 0);
  monolithGroup.add(glyphRing);

  const monolithLight = new THREE.PointLight(0x38bdf8, 2.5, 25);
  monolithLight.position.set(0, 10, 0);
  monolithGroup.add(monolithLight);

  group.add(monolithGroup);

  surfaceDiscoveries.push({
    id: `relic_${planet.id}`,
    name: `${planet.name} Ancient Monolith`,
    position: new THREE.Vector3(85, 4, -85),
    group: monolithGroup,
    scanned: false,
    rewardCredits: 75,
  });

  // 6. Environmental Surface Props (Rocks, alien spires, crystal geode rocks)
  const propCount = 36;
  const propGeo = planet.type === 'alien' 
    ? new THREE.ConeGeometry(2.8, 14, 6) 
    : new THREE.DodecahedronGeometry(4.0, 1);
  const propMat = new THREE.MeshStandardMaterial({
    color: planet.type === 'alien' ? 0x9333ea : 0x475569,
    roughness: 0.8,
    metalness: 0.2,
  });

  for (let p = 0; p < propCount; p++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 55 + Math.random() * 220;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;
    const propMesh = new THREE.Mesh(propGeo, propMat);
    propMesh.position.set(px, 3.5, pz);
    propMesh.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
    group.add(propMesh);
  }

  // Sunlight for planetary surface
  const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
  sunLight.position.set(120, 200, 90);
  sunLight.castShadow = true;
  group.add(sunLight);

  const ambient = new THREE.AmbientLight(planet.skyColor, 0.75);
  group.add(ambient);

  const landingPadPos = new THREE.Vector3(0, 2.5, 0);

  const update = (_delta: number, time: number) => {
    surfaceCrystals.forEach((c) => {
      if (!c.collected) c.update(time);
    });
    glyphRing.rotation.z = time * 0.8;
  };

  const dispose = () => {
    terrainGeo.dispose();
    terrainMat.dispose();
  };

  return { group, surfaceCrystals, surfaceDiscoveries, landingPadPos, update, dispose };
}
