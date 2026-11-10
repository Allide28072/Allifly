/**
 * ALLIFLY 3D Space Explorer - Main 3D Three.js Engine & Physics Simulation
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CameraViewMode, GameScreen, PlanetData, ShipStats, ShipUpgrades, SpaceStationData } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';
import { createStarwingShip, createVoidPhoenixShip, createChronoCruiserShip, ShipMeshInstance } from './shipModels';
import {
  createPlanetMesh,
  createSpaceStation,
  createEnergyCrystal,
  createAsteroidField,
  createStarfield,
  PlanetMeshObject,
  SpaceStationMeshObject,
  EnergyCrystalMeshObject,
} from './celestialModels';
import { createSurfaceEnvironment, SurfaceEnvironment } from './surfaceEnvironment';
import { SOLAR_PLANETS, SPACE_STATIONS } from '../game/planetsData';

// Reusable math objects (Zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _quat = new THREE.Quaternion();

export interface SpaceSceneCallbacks {
  onTelemetryUpdate: (speed: number, energy: number, maxEnergy: number, shield: number, maxShield: number) => void;
  onNearbyPlanetChanged: (planet: PlanetData | null, distance: number) => void;
  onNearbyStationChanged: (station: SpaceStationData | null, distance: number) => void;
  onNearbyDiscoveryChanged: (discovery: { id: string; name: string; reward: number } | null, distance: number) => void;
  onCrystalCollected: (type: 'quantum' | 'plasma' | 'darkMatter', energyVal: number, creditVal: number) => void;
  onMissionEvent: (type: string, id?: string) => void;
}

export class SpaceScene {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private isSoftwareGl = false;
  private animFrameId: number | null = null;
  private callbacks: SpaceSceneCallbacks;

  // Ships & Models
  private currentShipMesh: ShipMeshInstance | null = null;
  private shipGroup = new THREE.Group();
  private shipStats!: ShipStats;
  private upgrades!: ShipUpgrades;

  // Flight Kinematics
  private shipPosition = new THREE.Vector3(0, 5, 0);
  private shipVelocity = new THREE.Vector3();
  private shipRotation = new THREE.Quaternion();
  private shipAngularVelocity = new THREE.Vector3(); // pitch, yaw, roll

  private currentSpeed = 0;
  private targetSpeed = 0;
  private energy = 100;
  private maxEnergy = 100;
  private shield = 100;
  private maxShield = 100;

  // Boost & Special
  private isBoosting = false;
  private boostAvailable = true;

  // Space World Objects
  private planets: PlanetMeshObject[] = [];
  private stations: SpaceStationMeshObject[] = [];
  private crystals: EnergyCrystalMeshObject[] = [];
  private asteroidField!: THREE.InstancedMesh;
  private starfield!: THREE.Points;
  private spaceDust!: THREE.Points;
  private dustPositions!: Float32Array;

  // Surface exploration mode
  private surfaceMode = false;
  private activeSurface: SurfaceEnvironment | null = null;
  private activeSurfacePlanet: PlanetData | null = null;

  // Camera & View
  private cameraMode: CameraViewMode = 'thirdPerson';
  private currentScreen: GameScreen = 'title';
  private inspectionAngle = 0;

  // Input states
  public inputs = {
    forward: false,
    backward: false,
    yawLeft: false,
    yawRight: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    boost: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    analogStickX: 0,
    analogStickY: 0,
    throttleValue: 0, // -1 to +1 from mobile slider
  };

  constructor(container: HTMLDivElement, callbacks: SpaceSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.detectSoftwareGl();
    this.initRenderer();
    this.initScene();
    this.setupWorld();
    this.setupEventListeners();
    this.startLoop();
  }

  private detectSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = true;
    }
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      65,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      4000
    );
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020409);
    this.scene.fog = new THREE.FogExp2(0x020409, 0.00035);

    // Procedural Studio Environment for PBR Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    sunLight.position.set(400, 300, 500);
    sunLight.castShadow = !this.isSoftwareGl;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
    this.scene.add(hemiLight);
  }

  private setupWorld() {
    // Starfield & Asteroids
    this.starfield = createStarfield(this.isSoftwareGl ? 1500 : 3800);
    this.scene.add(this.starfield);

    this.asteroidField = createAsteroidField(this.isSoftwareGl ? 100 : 220);
    this.scene.add(this.asteroidField);

    // Planets
    SOLAR_PLANETS.forEach((planet) => {
      const pMesh = createPlanetMesh(planet);
      this.planets.push(pMesh);
      this.scene.add(pMesh.group);
    });

    // Space Stations
    SPACE_STATIONS.forEach((station) => {
      const sMesh = createSpaceStation(station);
      this.stations.push(sMesh);
      this.scene.add(sMesh.group);
    });

    // Spawn Space Energy Crystals in belts and clusters
    this.spawnSpaceCrystals();

    // Ship Group
    this.scene.add(this.shipGroup);

    // High-speed Space Dust Streaks for tactile forward motion feedback
    const dustCount = this.isSoftwareGl ? 80 : 220;
    this.dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 80;
      this.dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 1.8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.spaceDust = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.spaceDust);
  }

  private spawnSpaceCrystals() {
    const crystalTypes: ('quantum' | 'plasma' | 'darkMatter')[] = ['quantum', 'quantum', 'plasma', 'darkMatter'];
    const clusterCenters = [
      [0, 10, -50],
      [120, -15, -120],
      [-140, 25, -90],
      [280, 20, -150],
      [-260, -30, 180],
      [150, -35, 320],
      [-100, 30, 480],
      [60, 40, 620],
      [-380, 20, -300],
    ];

    let crystalId = 0;
    clusterCenters.forEach((center) => {
      for (let i = 0; i < 4; i++) {
        crystalId++;
        const type = crystalTypes[(crystalId + i) % crystalTypes.length];
        const offset: [number, number, number] = [
          center[0] + (Math.random() - 0.5) * 60,
          center[1] + (Math.random() - 0.5) * 40,
          center[2] + (Math.random() - 0.5) * 60,
        ];
        const energyVal = type === 'darkMatter' ? 50 : type === 'plasma' ? 25 : 10;
        const creditVal = type === 'darkMatter' ? 35 : type === 'plasma' ? 15 : 5;

        const crystal = createEnergyCrystal(`space_crystal_${crystalId}`, type, offset, energyVal, creditVal);
        this.crystals.push(crystal);
        this.scene.add(crystal.group);
      }
    });
  }

  public setShip(shipStats: ShipStats, upgrades: ShipUpgrades) {
    this.shipStats = shipStats;
    this.upgrades = upgrades;

    // Remove existing ship mesh
    if (this.currentShipMesh) {
      this.shipGroup.remove(this.currentShipMesh.group);
      this.currentShipMesh = null;
    }

    // Build new ship based on ID
    if (shipStats.id === 'phoenix') {
      this.currentShipMesh = createVoidPhoenixShip();
    } else if (shipStats.id === 'cruiser') {
      this.currentShipMesh = createChronoCruiserShip();
    } else {
      this.currentShipMesh = createStarwingShip();
    }

    this.shipGroup.add(this.currentShipMesh.group);

    // Recalculate stats based on upgrades
    this.maxEnergy = shipStats.baseEnergyCapacity + (upgrades.energyCapacity - 1) * 20;
    this.maxShield = shipStats.baseShieldStrength + (upgrades.shieldStrength - 1) * 25;
    this.energy = Math.min(this.energy, this.maxEnergy);
    this.shield = Math.min(this.shield, this.maxShield);
  }

  public setScreen(screen: GameScreen) {
    this.currentScreen = screen;
    if (screen === 'hangar') {
      this.cameraMode = 'inspection';
    } else if (screen === 'flight' && this.cameraMode === 'inspection') {
      this.cameraMode = 'thirdPerson';
    }
  }

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  public getCameraMode(): CameraViewMode {
    return this.cameraMode;
  }

  // --- PLANETARY SURFACE LANDING / BLAST OFF ---
  public enterSurfaceMode(planet: PlanetData) {
    if (this.surfaceMode || !planet.canLand) return;
    this.surfaceMode = true;
    this.activeSurfacePlanet = planet;

    soundEngine.playAtmosphereEntry();
    this.callbacks.onMissionEvent('surface_landing', planet.id);

    // Hide deep space world objects
    this.starfield.visible = false;
    this.asteroidField.visible = false;
    this.planets.forEach((p) => (p.group.visible = false));
    this.stations.forEach((s) => (s.group.visible = false));
    this.crystals.forEach((c) => (c.group.visible = false));

    // Create planetary surface
    this.activeSurface = createSurfaceEnvironment(planet);
    this.scene.add(this.activeSurface.group);

    // Place ship smoothly onto the landing pad
    this.shipPosition.copy(this.activeSurface.landingPadPos);
    this.shipVelocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.shipRotation.set(0, 0, 0, 1);
  }

  public blastOffToOrbit() {
    if (!this.surfaceMode) return;
    soundEngine.playBoostIgnite();

    // Clean up surface
    if (this.activeSurface) {
      this.scene.remove(this.activeSurface.group);
      this.activeSurface.dispose();
      this.activeSurface = null;
    }

    // Restore deep space objects
    this.starfield.visible = true;
    this.asteroidField.visible = true;
    this.planets.forEach((p) => (p.group.visible = true));
    this.stations.forEach((s) => (s.group.visible = true));
    this.crystals.forEach((c) => {
      if (!c.collected) c.group.visible = true;
    });

    // Place ship in orbit around the planet
    if (this.activeSurfacePlanet) {
      const pPos = this.activeSurfacePlanet.position;
      this.shipPosition.set(pPos[0], pPos[1] + 25, pPos[2] + this.activeSurfacePlanet.radius * 2.2);
    }
    this.shipVelocity.set(0, 0, -25);
    this.currentSpeed = 25;

    this.surfaceMode = false;
    this.activeSurfacePlanet = null;
  }

  public isSurfaceMode(): boolean {
    return this.surfaceMode;
  }

  public getActiveSurfacePlanet(): PlanetData | null {
    return this.activeSurfacePlanet;
  }

  // --- HYPERJUMP / WARP DRIVE ---
  public warpJumpTo(targetPos: [number, number, number]) {
    soundEngine.playHyperjump();
    this.shipPosition.set(targetPos[0], targetPos[1] + 15, targetPos[2] + 80);
    this.shipVelocity.set(0, 0, -35);
    this.currentSpeed = 35;
    this.callbacks.onMissionEvent('hyperjump');
  }

  // --- SCANNER RADAR PULSE ---
  public triggerScannerPulse() {
    soundEngine.playScannerPulse();
    this.callbacks.onMissionEvent('scanner_pulse');
  }

  // --- FLIGHT SIMULATION LOOP ---
  private updateFlight(delta: number) {
    if (!this.shipStats) return;

    const baseSpeed = this.shipStats.baseMaxSpeed + (this.upgrades.engineSpeed - 1) * 18;
    const accelRate = this.shipStats.baseAcceleration + (this.upgrades.acceleration - 1) * 12;
    const turnRate = this.shipStats.baseManeuverability + (this.upgrades.maneuverability - 1) * 0.3;

    // Handle Boost
    this.isBoosting = false;
    if (this.inputs.boost && this.energy > 8 && this.boostAvailable) {
      this.isBoosting = true;
      this.energy = Math.max(0, this.energy - delta * 18);
      if (this.energy <= 2) {
        this.boostAvailable = false;
      }
    } else {
      if (this.energy > 20) this.boostAvailable = true;
      // Normal energy recharge
      const rechargeRate = this.shipStats.baseEnergyRecharge + (this.upgrades.energyRecharge - 1) * 2.0;
      this.energy = Math.min(this.maxEnergy, this.energy + delta * rechargeRate);
    }

    // Shield passive regeneration
    this.shield = Math.min(this.maxShield, this.shield + delta * 3.5);

    // Throttle calculation
    let throttle = 0;
    if (this.inputs.forward) throttle += 1;
    if (this.inputs.backward) throttle -= 0.6;
    if (this.inputs.throttleValue !== 0) throttle += this.inputs.throttleValue;
    throttle = Math.max(-0.6, Math.min(1.0, throttle));

    const maxSpeed = this.isBoosting ? baseSpeed * 2.1 : baseSpeed;
    this.targetSpeed = throttle * maxSpeed;

    // Speed interpolation
    this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, this.targetSpeed, accelRate * 0.1, delta);

    // Rotation controls (Pitch, Yaw, Roll)
    let pitchInput = 0;
    let yawInput = 0;
    let rollInput = 0;

    // Standard flight simulation: Pitch Up pulls nose up, Pitch Down pushes nose down
    if (this.inputs.pitchUp) pitchInput += 1;
    if (this.inputs.pitchDown) pitchInput -= 1;
    if (this.inputs.yawLeft) yawInput += 1;
    if (this.inputs.yawRight) yawInput -= 1;
    if (this.inputs.rollLeft) rollInput += 1;
    if (this.inputs.rollRight) rollInput -= 1;

    // Mouse & Analog Stick look
    yawInput -= this.inputs.mouseDeltaX * 0.0028;
    pitchInput += this.inputs.mouseDeltaY * 0.0028;
    this.inputs.mouseDeltaX = 0;
    this.inputs.mouseDeltaY = 0;

    yawInput -= this.inputs.analogStickX * 1.2;
    pitchInput -= this.inputs.analogStickY * 1.2;

    // Apply Angular Velocity with positive auto-banking into turns
    const targetAngularVel = _v1.set(
      pitchInput * turnRate,
      yawInput * turnRate,
      rollInput * turnRate * 1.5 + yawInput * 0.45 // Natural jet bank into turn
    );

    this.shipAngularVelocity.lerp(targetAngularVel, delta * 8.0);

    // Integrate Rotation
    _quat.set(
      this.shipAngularVelocity.x * delta,
      this.shipAngularVelocity.y * delta,
      this.shipAngularVelocity.z * delta,
      1
    ).normalize();
    this.shipRotation.multiply(_quat);

    // Move forward in facing direction (Nose is at -Z)
    _forward.set(0, 0, -1).applyQuaternion(this.shipRotation);
    this.shipVelocity.copy(_forward).multiplyScalar(this.currentSpeed);
    this.shipPosition.addScaledVector(this.shipVelocity, delta);

    // Surface height clamping when landed/exploring surface
    if (this.surfaceMode) {
      this.shipPosition.y = Math.max(1.8, Math.min(120, this.shipPosition.y));
      this.shipPosition.x = Math.max(-280, Math.min(280, this.shipPosition.x));
      this.shipPosition.z = Math.max(-280, Math.min(280, this.shipPosition.z));
    }

    // Apply to ship 3D mesh
    this.shipGroup.position.copy(this.shipPosition);
    this.shipGroup.quaternion.copy(this.shipRotation);

    // Visual exhaust FX
    if (this.currentShipMesh) {
      const speedRatio = Math.abs(this.currentSpeed) / baseSpeed;
      this.currentShipMesh.updateExhaust(speedRatio, this.isBoosting);
      soundEngine.updateEngineSound(speedRatio, this.isBoosting);
    }

    // Dynamic Space Dust stream: wraps around ship to provide tactile forward flight feedback
    if (this.spaceDust && this.dustPositions) {
      const posAttr = this.spaceDust.geometry.attributes.position as THREE.BufferAttribute;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let x = this.dustPositions[i * 3];
        let y = this.dustPositions[i * 3 + 1];
        let z = this.dustPositions[i * 3 + 2];

        while (x - this.shipPosition.x > 45) x -= 90;
        while (x - this.shipPosition.x < -45) x += 90;
        while (y - this.shipPosition.y > 35) y -= 70;
        while (y - this.shipPosition.y < -35) y += 70;
        while (z - this.shipPosition.z > 45) z -= 90;
        while (z - this.shipPosition.z < -45) z += 90;

        this.dustPositions[i * 3] = x;
        this.dustPositions[i * 3 + 1] = y;
        this.dustPositions[i * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
    }

    // Check Proximity to Celestial Bodies and Stations
    this.checkProximities();

    // Check Energy Crystal Collection
    this.checkCrystalCollisions(delta);

    // Send Telemetry to UI
    this.callbacks.onTelemetryUpdate(
      Math.round(this.currentSpeed),
      Math.round(this.energy),
      this.maxEnergy,
      Math.round(this.shield),
      this.maxShield
    );
  }

  private checkProximities() {
    if (this.surfaceMode && this.activeSurface) {
      let nearestDisc: { id: string; name: string; reward: number } | null = null;
      let nearestDist = Infinity;
      for (const disc of this.activeSurface.surfaceDiscoveries) {
        if (!disc.scanned) {
          const d = this.shipPosition.distanceTo(disc.position);
          if (d < 35 && d < nearestDist) {
            nearestDisc = { id: disc.id, name: disc.name, reward: disc.rewardCredits };
            nearestDist = d;
          }
        }
      }
      this.callbacks.onNearbyDiscoveryChanged(nearestDisc, Math.round(nearestDist));
      return;
    }

    this.callbacks.onNearbyDiscoveryChanged(null, 9999);

    let closestPlanet: PlanetData | null = null;
    let closestPlanetDist = Infinity;

    for (const p of this.planets) {
      const dist = this.shipPosition.distanceTo(p.group.position);
      if (dist < p.data.radius * 3.5 && dist < closestPlanetDist) {
        closestPlanet = p.data;
        closestPlanetDist = dist;
      }
    }
    this.callbacks.onNearbyPlanetChanged(closestPlanet, Math.round(closestPlanetDist));

    let closestStation: SpaceStationData | null = null;
    let closestStationDist = Infinity;

    for (const s of this.stations) {
      const dist = this.shipPosition.distanceTo(s.group.position);
      if (dist < 80 && dist < closestStationDist) {
        closestStation = s.data;
        closestStationDist = dist;
      }
    }
    this.callbacks.onNearbyStationChanged(closestStation, Math.round(closestStationDist));
  }

  public dockWithStation(station: SpaceStationData) {
    this.shipPosition.set(station.position[0], station.position[1] + 12, station.position[2] + 28);
    this.shipVelocity.set(0, 0, 0);
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.shipRotation.set(0, 0, 0, 1);
  }

  public launchFromStation(station: SpaceStationData) {
    soundEngine.playBoostIgnite();
    this.shipPosition.set(station.position[0], station.position[1] + 15, station.position[2] + 55);
    this.shipVelocity.set(0, 0, -35);
    this.currentSpeed = 35;
  }

  public scanNearbyRelic(): { success: boolean; relicId?: string; reward?: number } {
    if (!this.surfaceMode || !this.activeSurface) return { success: false };
    for (const disc of this.activeSurface.surfaceDiscoveries) {
      if (!disc.scanned && this.shipPosition.distanceTo(disc.position) < 35) {
        disc.scanned = true;
        soundEngine.playMissionComplete();
        this.callbacks.onMissionEvent('surface_relic_scan', disc.id);
        return { success: true, relicId: disc.id, reward: disc.rewardCredits };
      }
    }
    return { success: false };
  }

  private checkCrystalCollisions(delta: number) {
    const list = this.surfaceMode && this.activeSurface ? this.activeSurface.surfaceCrystals : this.crystals;
    const scannerRange = this.shipStats.baseScannerRange + (this.upgrades.scannerRange - 1) * 80;

    list.forEach((crystal) => {
      if (crystal.collected) return;

      const dist = this.shipPosition.distanceTo(crystal.group.position);

      // Magnetic attraction if within magnetic range
      const magnetRange = scannerRange * 0.25;
      if (dist < magnetRange && dist > 3.0) {
        _v1.subVectors(this.shipPosition, crystal.group.position).normalize();
        crystal.group.position.addScaledVector(_v1, delta * 38.0);
      }

      // Collect if within 4.5 units
      if (dist < 4.5) {
        crystal.collected = true;
        crystal.group.visible = false;
        soundEngine.playCrystalCollect(crystal.type);

        this.energy = Math.min(this.maxEnergy, this.energy + crystal.energyValue);
        this.callbacks.onCrystalCollected(crystal.type, crystal.energyValue, crystal.creditValue);
        this.callbacks.onMissionEvent('collect_crystal');
      }
    });
  }

  private updateCamera(delta: number) {
    if (this.currentScreen === 'title') {
      // Cinematic camera orbiting hero ship centered at (0, 5, 0)
      this.inspectionAngle += delta * 0.35;
      const camDist = 18;
      this.camera.position.set(
        Math.cos(this.inspectionAngle) * camDist,
        6 + Math.sin(this.inspectionAngle * 0.5) * 2,
        Math.sin(this.inspectionAngle) * camDist
      );
      this.camera.lookAt(0, 5, 0);
      return;
    }

    // Dynamic FOV reaction: widens on boost for high-speed warp sensation
    const targetFov = this.isBoosting ? 75 : this.currentSpeed < -5 ? 61 : 65;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8.0, delta);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'inspection') {
      // Hangar Turntable
      this.inspectionAngle += delta * 0.5;
      const camDist = 16;
      this.camera.position.set(
        this.shipPosition.x + Math.cos(this.inspectionAngle) * camDist,
        this.shipPosition.y + 4,
        this.shipPosition.z + Math.sin(this.inspectionAngle) * camDist
      );
      this.camera.lookAt(this.shipPosition);
      return;
    }

    if (this.cameraMode === 'cockpit') {
      // First-person cockpit camera placed inside cockpit looking through front windshield
      _up.set(0, 1, 0).applyQuaternion(this.shipRotation);
      _forward.set(0, 0, -1).applyQuaternion(this.shipRotation);

      const cockpitOffset = _v1.copy(this.shipPosition).addScaledVector(_up, 0.6).addScaledVector(_forward, 0.5);
      this.camera.position.copy(cockpitOffset);

      const lookTarget = _v2.copy(this.shipPosition).addScaledVector(_forward, 60);
      this.camera.lookAt(lookTarget);
      return;
    }

    // Third-person chase camera smoothly trailing behind rear thrusters looking forward
    _forward.set(0, 0, -1).applyQuaternion(this.shipRotation);
    _up.set(0, 1, 0).applyQuaternion(this.shipRotation);

    const chaseDistance = this.isBoosting ? 17 : 12.5 + (this.currentSpeed / 80) * 3.5;
    const chaseHeight = 3.6 + (this.currentSpeed / 80) * 1.0;

    const targetCamPos = _v1
      .copy(this.shipPosition)
      .addScaledVector(_forward, -chaseDistance)
      .addScaledVector(_up, chaseHeight);

    this.camera.position.lerp(targetCamPos, delta * 14.0);

    const lookAheadTarget = _v2.copy(this.shipPosition).addScaledVector(_forward, 30);
    this.camera.lookAt(lookAheadTarget);
  }

  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const time = this.clock.getElapsedTime();

      // Update Celestial bodies
      this.planets.forEach((p) => p.update(delta, time));
      this.stations.forEach((s) => s.update(delta));
      this.crystals.forEach((c) => {
        if (!c.collected) c.update(time);
      });

      if (this.surfaceMode && this.activeSurface) {
        this.activeSurface.update(delta, time);
      }

      // Update Flight & Camera
      if (this.currentScreen === 'flight' || this.currentScreen === 'surface') {
        this.updateFlight(delta);
      }
      this.updateCamera(delta);

      // Render
      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
  }

  public onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
