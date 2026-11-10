/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SpaceScene } from './3d/SpaceScene';
import { soundEngine } from './audio/SoundEngine';
import {
  CameraViewMode,
  GameScreen,
  GameSettings,
  Mission,
  PlanetData,
  SaveGameData,
  SaveSlotId,
  ShipUpgrades,
  SpaceStationData,
  WaypointTarget,
} from './types/game';
import { INITIAL_SHIPS } from './game/shipsData';
import { SOLAR_PLANETS, SPACE_STATIONS } from './game/planetsData';
import {
  loadGame,
  saveGame,
  resetGame,
  hasSavedGame,
  exportSaveFile,
  importSaveFile,
  setActiveSlotId,
} from './game/storage';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { GalaxyMapModal } from './components/GalaxyMapModal';
import { HangarModal } from './components/HangarModal';
import { MissionLogModal } from './components/MissionLogModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseMenu } from './components/PauseMenu';
import { InstallGuideModal } from './components/InstallGuideModal';
import { StationHubModal } from './components/StationHubModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SpaceScene | null>(null);

  // Save Game State
  const [saveData, setSaveData] = useState<SaveGameData>(() => loadGame().data);
  const saveDataRef = useRef<SaveGameData>(saveData);
  saveDataRef.current = saveData;

  // Active Screen
  const [screen, setScreen] = useState<GameScreen>('title');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('thirdPerson');

  // Realtime Telemetry
  const [speed, setSpeed] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [maxEnergy, setMaxEnergy] = useState(100);
  const [shield, setShield] = useState(100);
  const [maxShield, setMaxShield] = useState(100);

  // Proximities
  const [nearbyPlanet, setNearbyPlanet] = useState<PlanetData | null>(null);
  const [planetDistance, setPlanetDistance] = useState(9999);
  const [nearbyStation, setNearbyStation] = useState<SpaceStationData | null>(null);
  const [stationDistance, setStationDistance] = useState(9999);
  const [nearbyDiscovery, setNearbyDiscovery] = useState<{ id: string; name: string; reward: number } | null>(null);
  const [discoveryDistance, setDiscoveryDistance] = useState(9999);

  // Surface mode state
  const [isSurfaceMode, setIsSurfaceMode] = useState(false);
  const [surfacePlanet, setSurfacePlanet] = useState<PlanetData | null>(null);

  // Active Mission
  const activeMission = saveData.missions.find((m) => m.status === 'active') || null;

  // Current Docked Station
  const currentStation = useMemo(() => {
    return SPACE_STATIONS.find((s) => s.id === (saveData.currentStationId || 'aegis_orbital')) || SPACE_STATIONS[0];
  }, [saveData.currentStationId]);

  // Waypoint Guidance Target
  const waypointTarget = useMemo<WaypointTarget | null>(() => {
    if (activeMission && activeMission.targetId) {
      const pl = SOLAR_PLANETS.find((p) => p.id === activeMission.targetId);
      if (pl) {
        return {
          id: pl.id,
          name: pl.name,
          type: 'planet',
          position: pl.position,
          distance: planetDistance,
        };
      }
      const st = SPACE_STATIONS.find((s) => s.id === activeMission.targetId);
      if (st) {
        return {
          id: st.id,
          name: st.name,
          type: 'station',
          position: st.position,
          distance: stationDistance,
        };
      }
    }
    if (nearbyStation) {
      return {
        id: nearbyStation.id,
        name: nearbyStation.name,
        type: 'station',
        position: nearbyStation.position,
        distance: stationDistance,
      };
    }
    return null;
  }, [activeMission, nearbyStation, stationDistance, planetDistance]);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  // Save current progress helper
  const persistState = useCallback(() => {
    saveGame(saveDataRef.current);
  }, []);

  // Initialize Three.js SpaceScene
  useEffect(() => {
    if (!mountRef.current) return;

    const initialShip =
      INITIAL_SHIPS.find((s) => s.id === saveDataRef.current.selectedShipId) || INITIAL_SHIPS[0];
    const initialUpgrades =
      saveDataRef.current.upgrades[initialShip.id] || {
        engineSpeed: 1,
        acceleration: 1,
        energyCapacity: 1,
        energyRecharge: 1,
        shieldStrength: 1,
        maneuverability: 1,
        scannerRange: 1,
      };

    const scene = new SpaceScene(mountRef.current, {
      onTelemetryUpdate: (spd, nrg, maxNrg, shd, maxShd) => {
        setSpeed(spd);
        setEnergy(nrg);
        setMaxEnergy(maxNrg);
        setShield(shd);
        setMaxShield(maxShd);
      },
      onNearbyPlanetChanged: (planet, dist) => {
        setNearbyPlanet(planet);
        setPlanetDistance(dist);
        if (planet && !saveDataRef.current.discoveredPlanetIds.includes(planet.id)) {
          setSaveData((prev) => {
            const next = {
              ...prev,
              discoveredPlanetIds: [...prev.discoveredPlanetIds, planet.id],
              stats: {
                ...prev.stats,
                planetsVisited: prev.stats.planetsVisited + 1,
              },
            };
            saveGame(next, `Discovered ${planet.name}`);
            return next;
          });
        }
      },
      onNearbyStationChanged: (station, dist) => {
        setNearbyStation(station);
        setStationDistance(dist);
      },
      onNearbyDiscoveryChanged: (discovery, dist) => {
        setNearbyDiscovery(discovery);
        setDiscoveryDistance(dist);
      },
      onCrystalCollected: (_type, _nrgVal, creditVal) => {
        setSaveData((prev) => {
          const updatedMissions = prev.missions.map((m) => {
            if (m.type === 'collect_crystals' && m.status === 'active' && m.targetCount) {
              const newCount = m.currentCount + 1;
              const isDone = newCount >= m.targetCount;
              if (isDone) soundEngine.playMissionComplete();
              return {
                ...m,
                currentCount: newCount,
                status: isDone ? ('completed' as const) : ('active' as const),
              };
            }
            return m;
          });

          const next: SaveGameData = {
            ...prev,
            credits: prev.credits + creditVal,
            missions: updatedMissions,
            stats: {
              ...prev.stats,
              crystalsCollected: prev.stats.crystalsCollected + 1,
            },
          };
          saveGame(next);
          return next;
        });
      },
      onMissionEvent: (type, targetId) => {
        setSaveData((prev) => {
          const updatedMissions = prev.missions.map((m) => {
            if (m.status !== 'active') return m;
            if (type === 'surface_landing' && m.type === 'surface_landing' && m.targetId === targetId) {
              soundEngine.playMissionComplete();
              return { ...m, currentCount: 1, status: 'completed' as const };
            }
            if (type === 'hyperjump' && m.type === 'deliver_energy' && m.targetId === targetId) {
              soundEngine.playMissionComplete();
              return { ...m, currentCount: 1, status: 'completed' as const };
            }
            return m;
          });

          const next: SaveGameData = {
            ...prev,
            missions: updatedMissions,
          };
          saveGame(next);
          return next;
        });
      },
    });

    scene.setShip(initialShip, initialUpgrades);
    scene.setScreen('title');
    sceneRef.current = scene;

    // Periodic Autosave every 20 seconds
    const autoSaveInterval = setInterval(() => {
      persistState();
    }, 20000);

    return () => {
      clearInterval(autoSaveInterval);
      scene.destroy();
      sceneRef.current = null;
    };
  }, [persistState]);

  // Audio calibration on volume/mute change
  useEffect(() => {
    soundEngine.setVolumes(
      saveData.settings.soundVolume,
      saveData.settings.sfxVolume,
      saveData.settings.musicVolume,
      saveData.settings.muted
    );
  }, [saveData.settings]);

  // --- Keyboard & Mouse Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.ensureContext();

      if (e.repeat) return;
      const key = e.key.toLowerCase();

      // Modal Shortcuts
      if (key === 'escape' || key === 'p') {
        if (screen === 'flight' || screen === 'surface') {
          setScreen('pause');
          soundEngine.playUiClick();
        } else if (screen === 'pause') {
          setScreen(isSurfaceMode ? 'surface' : 'flight');
          soundEngine.playUiClick();
        }
        return;
      }

      if (key === 'm') {
        if (screen === 'flight' || screen === 'surface') {
          setScreen('galaxyMap');
          soundEngine.playUiClick();
        } else if (screen === 'galaxyMap') {
          setScreen(isSurfaceMode ? 'surface' : 'flight');
          soundEngine.playUiClick();
        }
        return;
      }

      if (key === 'l' || key === 'tab') {
        e.preventDefault();
        if (screen === 'flight' || screen === 'surface') {
          setScreen('missionLog');
          soundEngine.playUiClick();
        } else if (screen === 'missionLog') {
          setScreen(isSurfaceMode ? 'surface' : 'flight');
          soundEngine.playUiClick();
        }
        return;
      }

      if (key === 'c') {
        handleToggleCamera();
        return;
      }

      if (key === 'f') {
        handleInteract();
        return;
      }

      if (key === 'shift') {
        handleTriggerScanner();
        return;
      }

      // Flight keyboard inputs
      if (sceneRef.current) {
        if (key === 'w') sceneRef.current.inputs.forward = true;
        if (key === 's') sceneRef.current.inputs.backward = true;
        if (key === 'a') sceneRef.current.inputs.yawLeft = true;
        if (key === 'd') sceneRef.current.inputs.yawRight = true;
        if (key === 'arrowup') sceneRef.current.inputs.pitchDown = true;
        if (key === 'arrowdown') sceneRef.current.inputs.pitchUp = true;
        if (key === 'arrowleft') sceneRef.current.inputs.yawLeft = true;
        if (key === 'arrowright') sceneRef.current.inputs.yawRight = true;
        if (key === 'q') sceneRef.current.inputs.rollLeft = true;
        if (key === 'e') sceneRef.current.inputs.rollRight = true;
        if (key === ' ') {
          sceneRef.current.inputs.boost = true;
          soundEngine.playBoostIgnite();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (sceneRef.current) {
        if (key === 'w') sceneRef.current.inputs.forward = false;
        if (key === 's') sceneRef.current.inputs.backward = false;
        if (key === 'a') sceneRef.current.inputs.yawLeft = false;
        if (key === 'd') sceneRef.current.inputs.yawRight = false;
        if (key === 'arrowup') sceneRef.current.inputs.pitchDown = false;
        if (key === 'arrowdown') sceneRef.current.inputs.pitchUp = false;
        if (key === 'arrowleft') sceneRef.current.inputs.yawLeft = false;
        if (key === 'arrowright') sceneRef.current.inputs.yawRight = false;
        if (key === 'q') sceneRef.current.inputs.rollLeft = false;
        if (key === 'e') sceneRef.current.inputs.rollRight = false;
        if (key === ' ') sceneRef.current.inputs.boost = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if ((screen === 'flight' || screen === 'surface') && sceneRef.current) {
        // Active when mouse dragging or pointer locked
        if (e.buttons === 1 || document.pointerLockElement) {
          const sens = saveDataRef.current.settings.mouseSensitivity;
          const invert = saveDataRef.current.settings.invertPitch ? -1 : 1;
          sceneRef.current.inputs.mouseDeltaX = e.movementX * sens;
          sceneRef.current.inputs.mouseDeltaY = e.movementY * sens * invert;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [screen, isSurfaceMode]);

  // Gamepad API support loop
  useEffect(() => {
    let gamepadFrameId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp && sceneRef.current && (screen === 'flight' || screen === 'surface')) {
        const deadzone = 0.15;
        const axisX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
        const axisY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
        const axisYaw = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0;

        sceneRef.current.inputs.analogStickX = axisYaw || axisX;
        sceneRef.current.inputs.analogStickY = axisY;

        // Triggers / Buttons
        const rTrigger = gp.buttons[7] ? gp.buttons[7].value : 0;
        const lTrigger = gp.buttons[6] ? gp.buttons[6].value : 0;
        sceneRef.current.inputs.throttleValue = rTrigger - lTrigger * 0.6;

        // Button A (Boost)
        sceneRef.current.inputs.boost = Boolean(gp.buttons[0] && gp.buttons[0].pressed);
      }
      gamepadFrameId = requestAnimationFrame(pollGamepad);
    };

    gamepadFrameId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(gamepadFrameId);
  }, [screen]);

  // --- Action Handlers ---
  const handleStartGame = () => {
    soundEngine.ensureContext();
    soundEngine.playUiClick();
    if (saveData.stationDocked) {
      if (sceneRef.current) {
        sceneRef.current.dockWithStation(currentStation);
        sceneRef.current.setScreen('title');
      }
      setScreen('station');
    } else {
      setScreen('flight');
      if (sceneRef.current) {
        sceneRef.current.setScreen('flight');
      }
    }
  };

  const handleContinueGame = () => {
    soundEngine.ensureContext();
    soundEngine.playUiClick();
    if (saveData.stationDocked) {
      if (sceneRef.current) {
        sceneRef.current.dockWithStation(currentStation);
        sceneRef.current.setScreen('title');
      }
      setScreen('station');
    } else {
      setScreen('flight');
      if (sceneRef.current) {
        sceneRef.current.setScreen('flight');
      }
    }
  };

  const handleLaunchShip = () => {
    soundEngine.playBoostIgnite();
    if (sceneRef.current) {
      sceneRef.current.launchFromStation(currentStation);
      sceneRef.current.setScreen('flight');
    }
    setSaveData((prev) => {
      const next = {
        ...prev,
        stationDocked: false,
      };
      saveGame(next, `Departed ${currentStation.name}`);
      return next;
    });
    setScreen('flight');
  };

  const handleToggleCamera = () => {
    if (!sceneRef.current) return;
    soundEngine.playUiClick();
    const nextMode = cameraMode === 'thirdPerson' ? 'cockpit' : 'thirdPerson';
    setCameraMode(nextMode);
    sceneRef.current.setCameraMode(nextMode);
  };

  const handleTriggerScanner = () => {
    if (!sceneRef.current) return;
    sceneRef.current.triggerScannerPulse();
  };

  const handleScanDiscovery = () => {
    if (!sceneRef.current) return;
    const res = sceneRef.current.scanNearbyRelic();
    if (res.success && res.reward) {
      const relicId = res.relicId || 'ancient_monolith';
      setSaveData((prev) => {
        const updatedMissions = prev.missions.map((m) => {
          if (m.type === 'surface_relic_scan' && m.status === 'active') {
            soundEngine.playMissionComplete();
            return { ...m, currentCount: (m.currentCount || 0) + 1, status: 'completed' as const };
          }
          return m;
        });

        const next: SaveGameData = {
          ...prev,
          credits: prev.credits + (res.reward || 100),
          discoveredRelicIds: prev.discoveredRelicIds.includes(relicId)
            ? prev.discoveredRelicIds
            : [...prev.discoveredRelicIds, relicId],
          missions: updatedMissions,
        };
        saveGame(next, 'Scanned Ancient Relic');
        return next;
      });
      setNearbyDiscovery(null);
    }
  };

  const handleInteract = () => {
    if (!sceneRef.current) return;

    if (nearbyDiscovery) {
      handleScanDiscovery();
      return;
    }

    if (isSurfaceMode) {
      // Blast off back to orbit
      sceneRef.current.blastOffToOrbit();
      setIsSurfaceMode(false);
      setSurfacePlanet(null);
      setScreen('flight');
      saveGame(saveDataRef.current, 'Orbit Departure');
      return;
    }

    if (nearbyPlanet && nearbyPlanet.canLand) {
      // Enter atmosphere & land on planet surface
      sceneRef.current.enterSurfaceMode(nearbyPlanet);
      setIsSurfaceMode(true);
      setSurfacePlanet(nearbyPlanet);
      setScreen('surface');
      setSaveData((prev) => {
        const next = {
          ...prev,
          stats: {
            ...prev.stats,
            surfaceLandings: prev.stats.surfaceLandings + 1,
          },
        };
        saveGame(next, `Landed on ${nearbyPlanet.name}`);
        return next;
      });
      return;
    }

    if (nearbyStation) {
      // Dock with station -> Enter Citadel
      soundEngine.playMissionComplete();
      setEnergy(maxEnergy);
      setShield(maxShield);
      sceneRef.current.dockWithStation(nearbyStation);
      setSaveData((prev) => {
        const updatedMissions = prev.missions.map((m) =>
          m.type === 'deliver_energy' && m.targetId === nearbyStation.id && m.status === 'active'
            ? { ...m, currentCount: 1, status: 'completed' as const }
            : m
        );
        const next = {
          ...prev,
          stationDocked: true,
          currentStationId: nearbyStation.id,
          missions: updatedMissions,
        };
        saveGame(next, `Docked at ${nearbyStation.name}`);
        return next;
      });
      setScreen('station');
    }
  };

  const handleWarpTo = (targetPos: [number, number, number]) => {
    if (!sceneRef.current) return;
    if (isSurfaceMode) {
      sceneRef.current.blastOffToOrbit();
      setIsSurfaceMode(false);
      setSurfacePlanet(null);
    }
    sceneRef.current.warpJumpTo(targetPos);
    setScreen('flight');
    sceneRef.current.setScreen('flight');
  };

  const handleSelectShip = (shipId: string) => {
    const ship = INITIAL_SHIPS.find((s) => s.id === shipId);
    if (!ship) return;

    const upgrades = saveData.upgrades[shipId] || {
      engineSpeed: 1,
      acceleration: 1,
      energyCapacity: 1,
      energyRecharge: 1,
      shieldStrength: 1,
      maneuverability: 1,
      scannerRange: 1,
    };

    setSaveData((prev) => {
      const next = { ...prev, selectedShipId: shipId };
      saveGame(next);
      return next;
    });

    if (sceneRef.current) {
      sceneRef.current.setShip(ship, upgrades);
    }
  };

  const handleUnlockShip = (shipId: string, price: number) => {
    if (saveData.credits < price) return;
    setSaveData((prev) => {
      const next = {
        ...prev,
        credits: prev.credits - price,
        unlockedShipIds: [...prev.unlockedShipIds, shipId],
        selectedShipId: shipId,
      };
      saveGame(next, 'Unlocked Ship');
      return next;
    });

    const ship = INITIAL_SHIPS.find((s) => s.id === shipId);
    if (ship && sceneRef.current) {
      const upgrades = saveData.upgrades[shipId] || {
        engineSpeed: 1,
        acceleration: 1,
        energyCapacity: 1,
        energyRecharge: 1,
        shieldStrength: 1,
        maneuverability: 1,
        scannerRange: 1,
      };
      sceneRef.current.setShip(ship, upgrades);
    }
  };

  const handlePurchaseUpgrade = (shipId: string, upgradeType: keyof ShipUpgrades, cost: number) => {
    if (saveData.credits < cost) return;

    setSaveData((prev) => {
      const currentShipUpgrades = prev.upgrades[shipId] || {
        engineSpeed: 1,
        acceleration: 1,
        energyCapacity: 1,
        energyRecharge: 1,
        shieldStrength: 1,
        maneuverability: 1,
        scannerRange: 1,
      };

      const updatedUpgrades: ShipUpgrades = {
        ...currentShipUpgrades,
        [upgradeType]: Math.min(5, currentShipUpgrades[upgradeType] + 1),
      };

      const next = {
        ...prev,
        credits: prev.credits - cost,
        upgrades: {
          ...prev.upgrades,
          [shipId]: updatedUpgrades,
        },
      };
      saveGame(next, 'Subsystem Upgraded');

      if (sceneRef.current && prev.selectedShipId === shipId) {
        const ship = INITIAL_SHIPS.find((s) => s.id === shipId);
        if (ship) sceneRef.current.setShip(ship, updatedUpgrades);
      }

      return next;
    });
  };

  const handleSelectMission = (missionId: string) => {
    setSaveData((prev) => {
      const updatedMissions = prev.missions.map((m) => {
        if (m.id === missionId) return { ...m, status: 'active' as const };
        if (m.status === 'active') return { ...m, status: 'available' as const };
        return m;
      });
      const next = { ...prev, missions: updatedMissions };
      saveGame(next);
      return next;
    });
  };

  const handleTurnInMission = (missionId: string) => {
    setSaveData((prev) => {
      const mission = prev.missions.find((m) => m.id === missionId);
      if (!mission) return prev;

      // Unlock new planet if specified
      const newUnlockedPlanets =
        mission.unlocksPlanetId && !prev.unlockedPlanetIds.includes(mission.unlocksPlanetId)
          ? [...prev.unlockedPlanetIds, mission.unlocksPlanetId]
          : prev.unlockedPlanetIds;

      // Unlock new ship if specified
      const newUnlockedShips =
        mission.unlocksShipId && !prev.unlockedShipIds.includes(mission.unlocksShipId)
          ? [...prev.unlockedShipIds, mission.unlocksShipId]
          : prev.unlockedShipIds;

      const updatedMissions = prev.missions.map((m) =>
        m.id === missionId ? { ...m, status: 'completed' as const } : m
      );

      const next: SaveGameData = {
        ...prev,
        credits: prev.credits + mission.rewardCredits,
        unlockedPlanetIds: newUnlockedPlanets,
        unlockedShipIds: newUnlockedShips,
        missions: updatedMissions,
        stats: {
          ...prev.stats,
          missionsCompleted: prev.stats.missionsCompleted + 1,
        },
      };
      saveGame(next, `Completed ${mission.title}`);
      return next;
    });
  };

  const handleRefuelShip = () => {
    soundEngine.playMissionComplete();
    setEnergy(maxEnergy);
    setShield(maxShield);
    setSaveData((prev) => {
      const next = { ...prev, energy: maxEnergy, shield: maxShield };
      saveGame(next, 'Full Refuel');
      return next;
    });
  };

  const handleSelectSlot = (slotId: SaveSlotId) => {
    setActiveSlotId(slotId);
    const { data } = loadGame(slotId);
    setSaveData(data);
    const ship = INITIAL_SHIPS.find((s) => s.id === data.selectedShipId) || INITIAL_SHIPS[0];
    if (sceneRef.current) {
      sceneRef.current.setShip(ship, data.upgrades[ship.id]);
    }
  };

  const handleExportSave = () => {
    exportSaveFile(saveDataRef.current);
  };

  const handleImportSave = (jsonStr: string) => {
    const res = importSaveFile(jsonStr);
    if (res.success && res.data) {
      const importedData = res.data;
      setSaveData(importedData);
      const ship = INITIAL_SHIPS.find((s) => s.id === importedData.selectedShipId) || INITIAL_SHIPS[0];
      if (sceneRef.current) {
        sceneRef.current.setShip(ship, importedData.upgrades[ship.id]);
      }
      soundEngine.playMissionComplete();
    }
  };

  const handleResetSave = () => {
    const fresh = resetGame(saveData.slotId);
    setSaveData(fresh);
    const initialShip = INITIAL_SHIPS[0];
    if (sceneRef.current) {
      sceneRef.current.setShip(initialShip, fresh.upgrades[initialShip.id]);
    }
  };

  const handleToggleMute = () => {
    soundEngine.ensureContext();
    const nextMuted = !saveData.settings.muted;
    setSaveData((prev) => {
      const next = {
        ...prev,
        settings: { ...prev.settings, muted: nextMuted },
      };
      saveGame(next);
      return next;
    });
    soundEngine.setVolumes(
      saveData.settings.soundVolume,
      saveData.settings.sfxVolume,
      saveData.settings.musicVolume,
      nextMuted
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* Three.js Isolated Canvas Mount (Never re-mounted on React state changes) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-crosshair" />

      {/* Title Screen Overlay */}
      {screen === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onContinueGame={handleContinueGame}
          hasSave={hasSavedGame()}
          onOpenHangar={() => setScreen('hangar')}
          onOpenGalaxyMap={() => setScreen('galaxyMap')}
          onOpenInstallGuide={() => setScreen('installGuide')}
          onOpenSettings={() => setScreen('settings')}
          muted={saveData.settings.muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Flight & Surface Gameplay HUD */}
      {(screen === 'flight' || screen === 'surface') && (
        <>
          <HUD
            speed={speed}
            energy={energy}
            maxEnergy={maxEnergy}
            shield={shield}
            maxShield={maxShield}
            credits={saveData.credits}
            activeMission={activeMission}
            nearbyPlanet={nearbyPlanet}
            planetDistance={planetDistance}
            nearbyStation={nearbyStation}
            stationDistance={stationDistance}
            nearbyDiscovery={nearbyDiscovery}
            discoveryDistance={discoveryDistance}
            waypointTarget={waypointTarget}
            cameraMode={cameraMode}
            isSurfaceMode={isSurfaceMode}
            surfacePlanet={surfacePlanet}
            onToggleCamera={handleToggleCamera}
            onTriggerScanner={handleTriggerScanner}
            onOpenGalaxyMap={() => setScreen('galaxyMap')}
            onOpenHangar={() => setScreen('hangar')}
            onOpenMissions={() => setScreen('missionLog')}
            onOpenPause={() => setScreen('pause')}
            onLandOrDock={handleInteract}
            onBlastOff={handleInteract}
            onScanDiscovery={handleScanDiscovery}
            muted={saveData.settings.muted}
            onToggleMute={handleToggleMute}
          />

          {/* Onscreen touch controls on touchscreens / mobile */}
          {isTouchDevice && (
            <MobileControls
              onAnalogMove={(x, y) => {
                if (sceneRef.current) {
                  sceneRef.current.inputs.analogStickX = x;
                  sceneRef.current.inputs.analogStickY = y;
                }
              }}
              onThrottleChange={(val) => {
                if (sceneRef.current) {
                  sceneRef.current.inputs.throttleValue = val;
                }
              }}
              onBoostChange={(boosting) => {
                if (sceneRef.current) {
                  sceneRef.current.inputs.boost = boosting;
                  if (boosting) soundEngine.playBoostIgnite();
                }
              }}
              onInteract={handleInteract}
              onTriggerScanner={handleTriggerScanner}
              onToggleCamera={handleToggleCamera}
              onOpenGalaxyMap={() => setScreen('galaxyMap')}
              canInteract={Boolean(
                nearbyDiscovery || isSurfaceMode || nearbyPlanet?.canLand || nearbyStation
              )}
              interactLabel={
                nearbyDiscovery ? 'SCAN' : isSurfaceMode ? 'BLAST' : nearbyPlanet ? 'LAND' : 'DOCK'
              }
            />
          )}
        </>
      )}

      {/* Station Citadel Modal */}
      {screen === 'station' && (
        <StationHubModal
          station={currentStation}
          saveData={saveData}
          activeMission={activeMission}
          onLaunchShip={handleLaunchShip}
          onAcceptMission={handleSelectMission}
          onTurnInMission={handleTurnInMission}
          onSelectShip={handleSelectShip}
          onUnlockShip={handleUnlockShip}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onRefuelShip={handleRefuelShip}
        />
      )}

      {/* Modals */}
      {screen === 'galaxyMap' && (
        <GalaxyMapModal
          discoveredPlanetIds={saveData.discoveredPlanetIds}
          currentPlanetNearby={nearbyPlanet}
          onWarpTo={handleWarpTo}
          onClose={() => setScreen(saveData.stationDocked ? 'station' : isSurfaceMode ? 'surface' : 'flight')}
        />
      )}

      {screen === 'hangar' && (
        <HangarModal
          selectedShipId={saveData.selectedShipId}
          unlockedShipIds={saveData.unlockedShipIds}
          upgrades={saveData.upgrades}
          credits={saveData.credits}
          onSelectShip={handleSelectShip}
          onUnlockShip={handleUnlockShip}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onClose={() => setScreen(saveData.stationDocked ? 'station' : isSurfaceMode ? 'surface' : 'flight')}
        />
      )}

      {screen === 'missionLog' && (
        <MissionLogModal
          missions={saveData.missions}
          onSelectMission={handleSelectMission}
          onClose={() => setScreen(saveData.stationDocked ? 'station' : isSurfaceMode ? 'surface' : 'flight')}
        />
      )}

      {screen === 'settings' && (
        <SettingsModal
          settings={saveData.settings}
          currentSlotId={saveData.slotId}
          onUpdateSettings={(newSettings) => {
            setSaveData((prev) => {
              const next = { ...prev, settings: newSettings };
              saveGame(next);
              return next;
            });
          }}
          onSelectSlot={handleSelectSlot}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
          onResetSave={handleResetSave}
          onClose={() => setScreen(saveData.stationDocked ? 'station' : isSurfaceMode ? 'surface' : 'flight')}
        />
      )}

      {screen === 'pause' && (
        <PauseMenu
          onResume={() => setScreen(isSurfaceMode ? 'surface' : 'flight')}
          onOpenGalaxyMap={() => setScreen('galaxyMap')}
          onOpenHangar={() => setScreen('hangar')}
          onOpenMissions={() => setScreen('missionLog')}
          onOpenSettings={() => setScreen('settings')}
          onReturnToTitle={() => {
            setScreen('title');
            if (sceneRef.current) {
              if (isSurfaceMode) {
                sceneRef.current.blastOffToOrbit();
                setIsSurfaceMode(false);
                setSurfacePlanet(null);
              }
              sceneRef.current.setScreen('title');
            }
          }}
          onSaveGame={() => {
            persistState();
            soundEngine.playMissionComplete();
          }}
        />
      )}

      {screen === 'installGuide' && (
        <InstallGuideModal onClose={() => setScreen('title')} />
      )}
    </div>
  );
}
