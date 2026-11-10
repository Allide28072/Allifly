/**
 * ALLIFLY 3D Space Explorer - Orbital Space Station Citadel Hub
 * Starting location, mission briefing board, refuel depot, shipyard, and launch departure sequence.
 */

import React, { useState } from 'react';
import {
  Rocket,
  Target,
  Wrench,
  Compass,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Award,
  Radio,
  Lock,
} from 'lucide-react';
import { Mission, PlanetData, SaveGameData, ShipStats, ShipUpgrades, SpaceStationData } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';
import { INITIAL_SHIPS } from '../game/shipsData';
import { SOLAR_PLANETS } from '../game/planetsData';

interface StationHubModalProps {
  station: SpaceStationData;
  saveData: SaveGameData;
  activeMission: Mission | null;
  onLaunchShip: () => void;
  onAcceptMission: (missionId: string) => void;
  onTurnInMission: (missionId: string) => void;
  onSelectShip: (shipId: string) => void;
  onUnlockShip: (shipId: string, price: number) => void;
  onPurchaseUpgrade: (shipId: string, upgradeType: keyof ShipUpgrades, cost: number) => void;
  onRefuelShip: () => void;
}

export const StationHubModal: React.FC<StationHubModalProps> = ({
  station,
  saveData,
  activeMission,
  onLaunchShip,
  onAcceptMission,
  onTurnInMission,
  onSelectShip,
  onUnlockShip,
  onPurchaseUpgrade,
  onRefuelShip,
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'missions' | 'engineering' | 'starmap'>('briefing');
  const [rewardToast, setRewardToast] = useState<{ credits: number; energy: number; title: string } | null>(null);

  const completedMissionReadyForTurnIn = saveData.missions.find(
    (m) => m.status === 'completed' && m.currentCount >= (m.targetCount || 1)
  );

  const currentShip = INITIAL_SHIPS.find((s) => s.id === saveData.selectedShipId) || INITIAL_SHIPS[0];
  const shipUpgrades = saveData.upgrades[currentShip.id] || {
    engineSpeed: 1,
    acceleration: 1,
    energyCapacity: 1,
    energyRecharge: 1,
    shieldStrength: 1,
    maneuverability: 1,
    scannerRange: 1,
  };

  const getUpgradeCost = (currentLvl: number) => currentLvl * 25;

  const handleTurnIn = (mission: Mission) => {
    soundEngine.playMissionComplete();
    setRewardToast({
      credits: mission.rewardCredits,
      energy: mission.rewardEnergy,
      title: mission.title,
    });
    onTurnInMission(mission.id);
    setTimeout(() => setRewardToast(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-black/85 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col overflow-hidden">
        {/* Top Station Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  ● DOCKED AT STATION
                </span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                  {station.faction}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{station.name}</h2>
            </div>
          </div>

          {/* Credits & Refuel */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{saveData.credits} QC</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onRefuelShip();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono transition cursor-pointer"
              title="Fully recharge energy capacitor and shields"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Full Refuel</span>
            </button>

            {/* LAUNCH UNDOCK BUTTON */}
            <button
              onClick={() => {
                soundEngine.playBoostIgnite();
                onLaunchShip();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Spaceship</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-2 overflow-x-auto">
          {[
            { id: 'briefing', label: 'Command Briefing', icon: <Radio className="w-4 h-4" /> },
            { id: 'missions', label: 'Mission Board', icon: <Target className="w-4 h-4" /> },
            { id: 'engineering', label: 'Shipyard & Upgrades', icon: <Wrench className="w-4 h-4" /> },
            { id: 'starmap', label: 'Sector Chart & Unlocks', icon: <Compass className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playUiClick();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono transition cursor-pointer border-t border-x ${
                activeTab === tab.id
                  ? 'bg-slate-900 border-cyan-500/60 text-cyan-300 font-bold'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'missions' && completedMissionReadyForTurnIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Reward Celebratory Toast Banner */}
        {rewardToast && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-950 to-cyan-950 border-b border-emerald-500/40 flex items-center justify-between text-xs font-mono text-emerald-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Mission Accomplished: <strong>{rewardToast.title}</strong></span>
            </div>
            <div className="flex items-center gap-3 font-bold text-white">
              <span>+{rewardToast.credits} QC Crystals</span>
              <span>+{rewardToast.energy} Capacitor Energy</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: COMMAND BRIEFING */}
          {activeTab === 'briefing' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  Station Commander Transmission
                </div>
                <h3 className="text-lg font-bold text-white">Welcome back, Pilot.</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are docked in Hangar Bay 4 of the Aegis Orbital Citadel. The Allifly Starwing has undergone primary telemetry diagnostic checks and all atmospheric thrusters are calibrated.
                  Select a contract from the <strong>Mission Board</strong>, inspect your ship in the <strong>Engineering Bay</strong>, or launch into orbit to explore uncharted planetary biomes.
                </p>
              </div>

              {/* Active Mission Card */}
              {activeMission ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> Current Active Contract
                    </span>
                    <span className="text-xs font-mono text-purple-300">
                      Reward: +{activeMission.rewardCredits} QC · +{activeMission.rewardEnergy} En
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{activeMission.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{activeMission.description}</p>
                    <div className="text-xs font-mono text-cyan-300 mt-2">
                      Objective: <span className="text-white font-medium">{activeMission.objective}</span>
                    </div>
                  </div>

                  {activeMission.targetCount && activeMission.targetCount > 1 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>Progress</span>
                        <span>
                          {activeMission.currentCount} / {activeMission.targetCount}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400"
                          style={{
                            width: `${Math.min(100, (activeMission.currentCount / activeMission.targetCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTab('missions')}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      View All Contracts →
                    </button>

                    <button
                      onClick={() => {
                        soundEngine.playBoostIgnite();
                        onLaunchShip();
                      }}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Deploy to Mission</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-950 mx-auto flex items-center justify-center text-cyan-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Active Contract Selected</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Open the Mission Board to accept a space exploration contract and earn crystal credits for ship upgrades.
                  </p>
                  <button
                    onClick={() => setActiveTab('missions')}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition cursor-pointer"
                  >
                    Open Mission Board
                  </button>
                </div>
              )}

              {/* Quick Launch Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Ship Assigned</div>
                  <div className="text-white font-bold">{currentShip.name}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Energy Capacitor</div>
                  <div className="text-cyan-300 font-bold">100% Fully Charged</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Deflector Shield</div>
                  <div className="text-blue-300 font-bold">100% Operational</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MISSION BOARD */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    Galactic Exploration Contracts
                  </h3>
                  <p className="text-xs text-slate-400">Select missions to activate objectives and unlock new planetary systems.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {saveData.missions.map((mission) => {
                  const isCompleted = mission.status === 'completed';
                  const isActive = mission.status === 'active';
                  const readyForTurnIn = isCompleted && mission.currentCount >= (mission.targetCount || 1);

                  return (
                    <div
                      key={mission.id}
                      className={`p-4 rounded-xl border transition ${
                        readyForTurnIn
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                          : isActive
                          ? 'bg-sky-950/30 border-cyan-500/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                isCompleted
                                  ? 'bg-emerald-900/80 text-emerald-300'
                                  : isActive
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {mission.status}
                            </span>
                            <h4 className="text-sm font-bold text-white">{mission.title}</h4>
                          </div>

                          <p className="text-xs text-slate-300">{mission.description}</p>
                          <div className="text-xs font-mono text-cyan-300">
                            Objective: <span className="text-white">{mission.objective}</span>
                          </div>

                          {mission.targetCount && mission.targetCount > 1 && (
                            <div className="pt-1 flex items-center gap-2 text-xs font-mono text-slate-400">
                              <span>Progress:</span>
                              <span className="text-white tabular-nums">
                                {mission.currentCount} / {mission.targetCount}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <div className="text-xs font-mono text-right">
                            <div className="text-purple-300 font-bold">+{mission.rewardCredits} QC</div>
                            <div className="text-cyan-400">+{mission.rewardEnergy} En</div>
                          </div>

                          {isCompleted ? (
                            <button
                              onClick={() => handleTurnIn(mission)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Claim Reward</span>
                            </button>
                          ) : isActive ? (
                            <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                              Active Contract
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                soundEngine.playUiClick();
                                onAcceptMission(mission.id);
                              }}
                              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-mono transition cursor-pointer"
                            >
                              Accept Mission
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ENGINEERING BAY */}
          {activeTab === 'engineering' && (
            <div className="space-y-6">
              {/* Ship Fleet Selection */}
              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">
                  Spaceship Fleet Inspection
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {INITIAL_SHIPS.map((ship) => {
                    const isUnlocked = saveData.unlockedShipIds.includes(ship.id);
                    const isEquipped = saveData.selectedShipId === ship.id;

                    return (
                      <div
                        key={ship.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                            : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{ship.name}</span>
                            {isEquipped && (
                              <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-mono font-bold">
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{ship.designation}</div>
                          <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">{ship.description}</p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-800">
                          {isEquipped ? (
                            <div className="text-center text-xs font-mono text-cyan-400 font-bold py-1">
                              Current Vessel
                            </div>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => {
                                soundEngine.playUiClick();
                                onSelectShip(ship.id);
                              }}
                              className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-mono transition cursor-pointer"
                            >
                              Pilot Ship
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (saveData.credits >= ship.price) {
                                  soundEngine.playMissionComplete();
                                  onUnlockShip(ship.id, ship.price);
                                }
                              }}
                              disabled={saveData.credits < ship.price}
                              className={`w-full py-1.5 rounded-lg font-bold text-xs uppercase font-mono transition cursor-pointer ${
                                saveData.credits >= ship.price
                                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              Unlock ({ship.price} QC)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subsystems Upgrades */}
              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">
                  {currentShip.name} Subsystem Upgrades (Level 1–5)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'engineSpeed', name: 'Thruster Velocitor', desc: 'Cruise and Boost Speed' },
                    { key: 'acceleration', name: 'Inertial Coil', desc: 'Thrust Response' },
                    { key: 'energyCapacity', name: 'Battery Matrix', desc: 'Energy Storage' },
                    { key: 'energyRecharge', name: 'Solar Converter', desc: 'Recharge Rate' },
                    { key: 'shieldStrength', name: 'Shield Deflector', desc: 'Damage Absorber' },
                    { key: 'scannerRange', name: 'Deep Space Radar', desc: 'Detection & Magnet Radius' },
                  ].map((sub) => {
                    const lvl = shipUpgrades[sub.key as keyof ShipUpgrades];
                    const cost = getUpgradeCost(lvl);
                    const isMax = lvl >= 5;
                    const canAfford = saveData.credits >= cost;

                    return (
                      <div key={sub.key} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{sub.name}</span>
                            <span className="font-mono text-cyan-400 font-bold">LVL {lvl}/5</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{sub.desc}</div>

                          <div className="flex gap-1 my-2">
                            {[1, 2, 3, 4, 5].map((p) => (
                              <div
                                key={p}
                                className={`flex-1 h-1 rounded-full ${p <= lvl ? 'bg-cyan-400' : 'bg-slate-800'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!isMax && canAfford) {
                              soundEngine.playUiClick();
                              onPurchaseUpgrade(currentShip.id, sub.key as keyof ShipUpgrades, cost);
                            }
                          }}
                          disabled={isMax || !canAfford}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase transition cursor-pointer ${
                            isMax
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : canAfford
                              ? 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? 'MAX' : `Upgrade (${cost} QC)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECTOR CHART & UNLOCKS */}
          {activeTab === 'starmap' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                  Solar Sector Unlock Progression
                </h3>
                <p className="text-xs text-slate-400">
                  Complete planetary reconnaissance missions to unlock access to new worlds and surface landing permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SOLAR_PLANETS.map((planet) => {
                  const isUnlocked = saveData.unlockedPlanetIds.includes(planet.id);
                  const isDiscovered = saveData.discoveredPlanetIds.includes(planet.id);

                  return (
                    <div
                      key={planet.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-slate-950/60 border-slate-900 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{planet.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                              isUnlocked ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">Class: {planet.type}</div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{planet.description}</p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>{planet.canLand ? 'Surface Landable' : 'Gas Giant'}</span>
                        <span className="text-cyan-300">{isDiscovered ? 'Discovered' : 'Uncharted'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
