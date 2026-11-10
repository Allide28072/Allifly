/**
 * ALLIFLY 3D Space Explorer - Core Game Type Definitions
 */

export type CameraViewMode = 'thirdPerson' | 'cockpit' | 'inspection';

export type GameScreen = 
  | 'title' 
  | 'flight' 
  | 'surface' 
  | 'station'
  | 'hangar' 
  | 'galaxyMap' 
  | 'missionLog' 
  | 'settings' 
  | 'pause' 
  | 'installGuide'
  | 'victory';

export type SaveSlotId = 'slot1' | 'slot2' | 'slot3' | 'autosave';

export interface ShipStats {
  id: string;
  name: string;
  designation: string;
  description: string;
  unlocked: boolean;
  price: number;
  baseMaxSpeed: number;
  baseAcceleration: number;
  baseManeuverability: number;
  baseEnergyCapacity: number;
  baseEnergyRecharge: number;
  baseShieldStrength: number;
  baseScannerRange: number;
  hullColor: string;
  accentColor: string;
  glowColor: string;
}

export interface ShipUpgrades {
  engineSpeed: number; // 1-5
  acceleration: number; // 1-5
  energyCapacity: number; // 1-5
  energyRecharge: number; // 1-5
  shieldStrength: number; // 1-5
  maneuverability: number; // 1-5
  scannerRange: number; // 1-5
}

export interface EnergyCrystal {
  id: string;
  type: 'quantum' | 'plasma' | 'darkMatter';
  position: [number, number, number];
  energyValue: number;
  creditValue: number;
  collected: boolean;
  surfacePlanetId?: string;
}

export type PlanetType = 'earth' | 'desert' | 'ice' | 'volcanic' | 'alien' | 'gasGiant';

export interface PlanetData {
  id: string;
  name: string;
  type: PlanetType;
  title: string;
  description: string;
  radius: number;
  position: [number, number, number];
  atmosphereColor: string;
  skyColor: string;
  groundColor: string;
  discovered: boolean;
  canLand: boolean;
  landedCount: number;
  orbitRadius: number;
  orbitSpeed: number;
  hasRings?: boolean;
  moonsCount: number;
  requiredMissionsToUnlock?: number;
}

export interface SpaceStationData {
  id: string;
  name: string;
  faction: string;
  description: string;
  position: [number, number, number];
  docked: boolean;
  services: string[];
}

export type MissionType = 
  | 'collect_crystals' 
  | 'scan_planet' 
  | 'deliver_energy' 
  | 'surface_landing' 
  | 'recover_tech' 
  | 'scan_asteroid' 
  | 'beacon_repair'
  | 'surface_relic_scan';

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  description: string;
  objective: string;
  targetId?: string;
  targetCount?: number;
  currentCount: number;
  rewardCredits: number;
  rewardEnergy: number;
  status: 'available' | 'active' | 'completed';
  requiredLevel?: number;
  unlocksPlanetId?: string;
  unlocksShipId?: string;
}

export interface PlanetDiscovery {
  id: string;
  planetId: string;
  name: string;
  type: 'relic' | 'crystal_geode' | 'alien_monolith' | 'thermal_core' | 'glacial_vault';
  position: [number, number, number];
  discovered: boolean;
  rewardCredits: number;
  description: string;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  batterySaver: boolean;
  gamepadRumble: boolean;
  mouseSensitivity: number;
  invertPitch: boolean;
  fov: number;
  touchControls: boolean;
  touchSensitivity: number;
}

export interface WaypointTarget {
  id: string;
  name: string;
  type: 'planet' | 'station' | 'mission' | 'crystal' | 'relic';
  position: [number, number, number];
  distance: number;
  angleToShip?: number;
}

export interface SaveGameData {
  version: number;
  slotId: SaveSlotId;
  saveDate: string;
  checksum: string;
  lastCheckpoint: string;
  stationDocked: boolean;
  currentStationId: string | null;
  selectedShipId: string;
  unlockedShipIds: string[];
  unlockedPlanetIds: string[];
  upgrades: Record<string, ShipUpgrades>;
  credits: number;
  energy: number;
  shield: number;
  discoveredPlanetIds: string[];
  discoveredRelicIds: string[];
  missions: Mission[];
  settings: GameSettings;
  stats: {
    crystalsCollected: number;
    distanceTraveled: number;
    planetsVisited: number;
    missionsCompleted: number;
    hyperjumpsMade: number;
    surfaceLandings: number;
  };
}
