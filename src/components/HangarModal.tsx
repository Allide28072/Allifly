/**
 * ALLIFLY 3D Space Explorer - Spaceship Hangar & Upgrade Terminal
 */

import React, { useState } from 'react';
import { X, Wrench, Shield, Zap, Gauge, Radio, Sparkles, Check, Lock, ChevronRight } from 'lucide-react';
import { ShipStats, ShipUpgrades } from '../types/game';
import { INITIAL_SHIPS } from '../game/shipsData';
import { soundEngine } from '../audio/SoundEngine';

interface HangarModalProps {
  selectedShipId: string;
  unlockedShipIds: string[];
  upgrades: Record<string, ShipUpgrades>;
  credits: number;
  onSelectShip: (shipId: string) => void;
  onUnlockShip: (shipId: string, price: number) => void;
  onPurchaseUpgrade: (shipId: string, upgradeType: keyof ShipUpgrades, cost: number) => void;
  onClose: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  selectedShipId,
  unlockedShipIds,
  upgrades,
  credits,
  onSelectShip,
  onUnlockShip,
  onPurchaseUpgrade,
  onClose,
}) => {
  const [activeShipId, setActiveShipId] = useState(selectedShipId);

  const activeShip = INITIAL_SHIPS.find((s) => s.id === activeShipId) || INITIAL_SHIPS[0];
  const isUnlocked = unlockedShipIds.includes(activeShip.id);
  const isEquipped = selectedShipId === activeShip.id;
  const shipUpgrades = upgrades[activeShip.id] || {
    engineSpeed: 1,
    acceleration: 1,
    energyCapacity: 1,
    energyRecharge: 1,
    shieldStrength: 1,
    maneuverability: 1,
    scannerRange: 1,
  };

  const getUpgradeCost = (currentLvl: number) => currentLvl * 25;

  const upgradeModules: {
    key: keyof ShipUpgrades;
    name: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'engineSpeed',
      name: 'Ion Thruster Velocitor',
      desc: 'Increases top sub-light and boost cruise speed',
      icon: <Gauge className="w-4 h-4 text-cyan-400" />,
    },
    {
      key: 'acceleration',
      name: 'Inertial Accelerator Coil',
      desc: 'Shortens time to reach maximum velocity',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      key: 'energyCapacity',
      name: 'Quantum Battery Matrix',
      desc: 'Expands total energy capacitor storage',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
    },
    {
      key: 'energyRecharge',
      name: 'Photonic Solar Converter',
      desc: 'Accelerates passive energy replenishment rate',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    },
    {
      key: 'shieldStrength',
      name: 'Deflector Shield Hardener',
      desc: 'Fortifies maximum shield durability against impacts',
      icon: <Shield className="w-4 h-4 text-blue-400" />,
    },
    {
      key: 'maneuverability',
      name: 'Vector Thruster Gimbal',
      desc: 'Sharpens pitch, yaw, and banking agility',
      icon: <ChevronRight className="w-4 h-4 text-emerald-400" />,
    },
    {
      key: 'scannerRange',
      name: 'Deep Radar Sensor Array',
      desc: 'Broadens range for detecting crystals and planets',
      icon: <Radio className="w-4 h-4 text-cyan-300" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Spaceship Hangar & Upgrades</h2>
              <p className="text-xs font-mono text-cyan-400/80">Refit Yard · Allifly Engineering Dock</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{credits} QC Available</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ship Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-2 overflow-x-auto">
          {INITIAL_SHIPS.map((ship) => {
            const unlocked = unlockedShipIds.includes(ship.id);
            const selected = activeShipId === ship.id;

            return (
              <button
                key={ship.id}
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveShipId(ship.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono transition cursor-pointer border-t border-x ${
                  selected
                    ? 'bg-slate-900 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                <span>{ship.name}</span>
                {selectedShipId === ship.id && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Hangar Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Ship Specs & Equipping */}
          <div className="w-full lg:w-80 bg-slate-900/40 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  {activeShip.designation}
                </span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{activeShip.name}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeShip.description}</p>
              </div>

              {/* Performance Characteristics Radar */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Engine Velocity</span>
                    <span className="text-cyan-400 font-bold">{activeShip.baseMaxSpeed + (shipUpgrades.engineSpeed - 1) * 18} KTS</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (activeShip.baseMaxSpeed / 120) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Deflector Shield</span>
                    <span className="text-blue-400 font-bold">{activeShip.baseShieldStrength + (shipUpgrades.shieldStrength - 1) * 25} HP</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${Math.min(100, (activeShip.baseShieldStrength / 220) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Capacitor Battery</span>
                    <span className="text-amber-400 font-bold">{activeShip.baseEnergyCapacity + (shipUpgrades.energyCapacity - 1) * 20} J</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (activeShip.baseEnergyCapacity / 220) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Scanner Radar Array</span>
                    <span className="text-purple-400 font-bold">{activeShip.baseScannerRange + (shipUpgrades.scannerRange - 1) * 80} U</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-400"
                      style={{ width: `${Math.min(100, (activeShip.baseScannerRange / 600) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Equip or Unlock Button */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              {isEquipped ? (
                <div className="w-full py-3 rounded-xl bg-slate-800 text-cyan-300 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Currently Equipped</span>
                </div>
              ) : isUnlocked ? (
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectShip(activeShip.id);
                  }}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Equip Spaceship
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (credits >= activeShip.price) {
                      soundEngine.playMissionComplete();
                      onUnlockShip(activeShip.id, activeShip.price);
                    }
                  }}
                  disabled={credits < activeShip.price}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                    credits >= activeShip.price
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Unlock ({activeShip.price} QC)
                </button>
              )}
            </div>
          </div>

          {/* Right: Upgrade Modules Terminal */}
          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">
              Ship Upgrade Subsystems (Level 1 - 5)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upgradeModules.map((mod) => {
                const currentLvl = shipUpgrades[mod.key];
                const cost = getUpgradeCost(currentLvl);
                const isMax = currentLvl >= 5;
                const canAfford = credits >= cost;

                return (
                  <div
                    key={mod.key}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-800">{mod.icon}</div>
                          <span className="text-xs font-bold text-white">{mod.name}</span>
                        </div>
                        <span className="text-xs font-mono text-cyan-400 font-bold">
                          LVL {currentLvl}/5
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{mod.desc}</p>

                      {/* Level Pips */}
                      <div className="flex gap-1.5 my-3">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`flex-1 h-1.5 rounded-full ${
                              lvl <= currentLvl ? 'bg-cyan-400' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!isMax && canAfford) {
                          soundEngine.playUiClick();
                          onPurchaseUpgrade(activeShip.id, mod.key, cost);
                        }
                      }}
                      disabled={isMax || !canAfford}
                      className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                        isMax
                          ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'Maximum Level Reached' : `Upgrade (${cost} QC)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
