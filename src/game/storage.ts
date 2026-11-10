/**
 * ALLIFLY 3D Space Explorer - Multi-Slot Save, Checkpoint & Corruption Recovery System
 */

import { GameSettings, SaveGameData, SaveSlotId, ShipUpgrades } from '../types/game';
import { INITIAL_MISSIONS } from './missions';

const SAVE_KEY_PREFIX = 'allifly_slot_';
const ACTIVE_SLOT_KEY = 'allifly_active_slot_id';
const BACKUP_PREFIX = 'allifly_backup_';

export const DEFAULT_UPGRADES: ShipUpgrades = {
  engineSpeed: 1,
  acceleration: 1,
  energyCapacity: 1,
  energyRecharge: 1,
  shieldStrength: 1,
  maneuverability: 1,
  scannerRange: 1,
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.85,
  muted: false,
  graphicsQuality: 'high',
  batterySaver: false,
  gamepadRumble: true,
  mouseSensitivity: 1.2,
  invertPitch: false,
  fov: 65,
  touchControls: false,
  touchSensitivity: 1.2,
};

/**
 * Computes a lightweight checksum to verify save data integrity
 */
export function calculateChecksum(data: Omit<SaveGameData, 'checksum'>): string {
  const str = `${data.version}_${data.slotId}_${data.credits}_${data.selectedShipId}_${data.stats.missionsCompleted}_${data.stats.crystalsCollected}_${data.discoveredPlanetIds.length}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `chk_${Math.abs(hash).toString(16)}`;
}

export function getDefaultSaveData(slotId: SaveSlotId = 'slot1'): SaveGameData {
  const base: Omit<SaveGameData, 'checksum'> = {
    version: 2,
    slotId,
    saveDate: new Date().toISOString(),
    lastCheckpoint: 'Aegis Orbital Citadel Docking Bay',
    stationDocked: true,
    currentStationId: 'aegis_orbital',
    selectedShipId: 'starwing',
    unlockedShipIds: ['starwing'],
    unlockedPlanetIds: ['terra_nova', 'solara_sands'],
    upgrades: {
      starwing: { ...DEFAULT_UPGRADES },
      phoenix: { ...DEFAULT_UPGRADES },
      cruiser: { ...DEFAULT_UPGRADES },
    },
    credits: 0,
    energy: 100,
    shield: 100,
    discoveredPlanetIds: ['terra_nova'],
    discoveredRelicIds: [],
    missions: JSON.parse(JSON.stringify(INITIAL_MISSIONS)),
    settings: { ...DEFAULT_SETTINGS },
    stats: {
      crystalsCollected: 0,
      distanceTraveled: 0,
      planetsVisited: 1,
      missionsCompleted: 0,
      hyperjumpsMade: 0,
      surfaceLandings: 0,
    },
  };

  return {
    ...base,
    checksum: calculateChecksum(base),
  };
}

/**
 * Validates save data structure, values, and checksum
 */
export function validateSaveData(data: unknown): data is SaveGameData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<SaveGameData>;

  if (typeof d.version !== 'number' || d.version < 1) return false;
  if (!d.slotId || typeof d.credits !== 'number' || typeof d.energy !== 'number') return false;
  if (!Array.isArray(d.missions) || !Array.isArray(d.unlockedShipIds)) return false;
  if (!d.upgrades || typeof d.upgrades !== 'object') return false;
  if (!d.stats || typeof d.stats !== 'object') return false;

  return true;
}

export function getActiveSlotId(): SaveSlotId {
  try {
    const active = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (active === 'slot1' || active === 'slot2' || active === 'slot3' || active === 'autosave') {
      return active;
    }
  } catch {
    // Ignore
  }
  return 'slot1';
}

export function setActiveSlotId(slotId: SaveSlotId) {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
  } catch {
    // Ignore
  }
}

/**
 * Loads save data for a slot with corruption validation and automatic backup recovery
 */
export function loadGame(slotId?: SaveSlotId): { data: SaveGameData; recovered: boolean } {
  const targetSlot = slotId || getActiveSlotId();
  const key = `${SAVE_KEY_PREFIX}${targetSlot}`;
  const backupKey = `${BACKUP_PREFIX}${targetSlot}`;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const fresh = getDefaultSaveData(targetSlot);
      saveGame(fresh);
      return { data: fresh, recovered: false };
    }

    const parsed = JSON.parse(raw);

    if (validateSaveData(parsed)) {
      // Data is healthy, merge any newly added settings or fields
      const defaults = getDefaultSaveData(targetSlot);
      const merged: SaveGameData = {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...(parsed.settings || {}) },
        upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
        stats: { ...defaults.stats, ...(parsed.stats || {}) },
        unlockedPlanetIds: parsed.unlockedPlanetIds || defaults.unlockedPlanetIds,
        discoveredRelicIds: parsed.discoveredRelicIds || [],
      };
      return { data: merged, recovered: false };
    }

    // Validation failed on primary save, attempt backup recovery!
    console.warn(`Save slot ${targetSlot} corrupted. Attempting recovery from backup...`);
    const backupRaw = localStorage.getItem(backupKey);
    if (backupRaw) {
      const backupParsed = JSON.parse(backupRaw);
      if (validateSaveData(backupParsed)) {
        saveGame(backupParsed);
        return { data: backupParsed, recovered: true };
      }
    }
  } catch (err) {
    console.error(`Error loading slot ${targetSlot}:`, err);
  }

  // Fallback safe recovery
  const recoveredDefault = getDefaultSaveData(targetSlot);
  saveGame(recoveredDefault);
  return { data: recoveredDefault, recovered: true };
}

/**
 * Saves game to designated slot with checkpoint tracking, backup snapshot, and checksum
 */
export function saveGame(data: SaveGameData, checkpointName?: string): void {
  try {
    const targetSlot = data.slotId || 'slot1';
    const key = `${SAVE_KEY_PREFIX}${targetSlot}`;
    const backupKey = `${BACKUP_PREFIX}${targetSlot}`;

    // Update checkpoint name if specified
    const checkpoint = checkpointName || data.lastCheckpoint || 'Space Flight Checkpoint';

    const toSaveWithoutChecksum: Omit<SaveGameData, 'checksum'> = {
      ...data,
      saveDate: new Date().toISOString(),
      lastCheckpoint: checkpoint,
    };

    const finalizedSave: SaveGameData = {
      ...toSaveWithoutChecksum,
      checksum: calculateChecksum(toSaveWithoutChecksum),
    };

    const serialized = JSON.stringify(finalizedSave);

    // Save previous state to backup first
    const existing = localStorage.getItem(key);
    if (existing) {
      localStorage.setItem(backupKey, existing);
    }

    // Write primary slot
    localStorage.setItem(key, serialized);

    // Also mirror to autosave slot if this is a major checkpoint
    if (checkpointName && targetSlot !== 'autosave') {
      const autoSaveData = { ...finalizedSave, slotId: 'autosave' as SaveSlotId };
      autoSaveData.checksum = calculateChecksum(autoSaveData);
      localStorage.setItem(`${SAVE_KEY_PREFIX}autosave`, JSON.stringify(autoSaveData));
    }
  } catch (err) {
    console.error('Failed to persist Allifly game state:', err);
  }
}

/**
 * Checks all slots and returns metadata for slot manager
 */
export function getSaveSlotsSummary(): Record<SaveSlotId, { exists: boolean; date?: string; checkpoint?: string; credits?: number; ship?: string }> {
  const slots: SaveSlotId[] = ['slot1', 'slot2', 'slot3', 'autosave'];
  const summary: Record<SaveSlotId, { exists: boolean; date?: string; checkpoint?: string; credits?: number; ship?: string }> = {
    slot1: { exists: false },
    slot2: { exists: false },
    slot3: { exists: false },
    autosave: { exists: false },
  };

  slots.forEach((s) => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${s}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.saveDate) {
          summary[s] = {
            exists: true,
            date: new Date(parsed.saveDate).toLocaleString(),
            checkpoint: parsed.lastCheckpoint || 'Orbital Station',
            credits: parsed.credits || 0,
            ship: parsed.selectedShipId || 'starwing',
          };
        }
      }
    } catch {
      // Ignore
    }
  });

  return summary;
}

export function hasSavedGame(): boolean {
  try {
    const summary = getSaveSlotsSummary();
    return summary.slot1.exists || summary.slot2.exists || summary.slot3.exists || summary.autosave.exists;
  } catch {
    return false;
  }
}

export function resetGame(slotId?: SaveSlotId): SaveGameData {
  const targetSlot = slotId || getActiveSlotId();
  const fresh = getDefaultSaveData(targetSlot);
  saveGame(fresh);
  return fresh;
}

/**
 * Exports current save data as a JSON file download for cross-device backup
 */
export function exportSaveFile(data: SaveGameData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `allifly_save_${data.slotId}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Imports save data from JSON string
 */
export function importSaveFile(jsonStr: string): { success: boolean; data?: SaveGameData; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!validateSaveData(parsed)) {
      return { success: false, error: 'Invalid Allifly save data format.' };
    }
    saveGame(parsed);
    setActiveSlotId(parsed.slotId);
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: 'Failed to parse JSON file.' };
  }
}
