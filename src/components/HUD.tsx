/**
 * ALLIFLY 3D Space Explorer - Ultra-Minimal Low-Occlusion Flight HUD
 * 98%+ unobstructed screen, zero bulky cards, contextual interaction prompts only when near targets.
 */

import React, { useState } from 'react';
import {
  Compass,
  Eye,
  Wrench,
  Radio,
  Pause,
  Volume2,
  VolumeX,
  Target,
  Zap,
  Shield,
  Sparkles,
  MapPin,
  Rocket,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CameraViewMode, Mission, PlanetData, SpaceStationData, WaypointTarget } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface HUDProps {
  speed: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  maxShield: number;
  credits: number;
  activeMission: Mission | null;
  nearbyPlanet: PlanetData | null;
  planetDistance: number;
  nearbyStation: SpaceStationData | null;
  stationDistance: number;
  nearbyDiscovery: { id: string; name: string; reward: number } | null;
  discoveryDistance: number;
  waypointTarget?: WaypointTarget | null;
  cameraMode: CameraViewMode;
  isSurfaceMode: boolean;
  surfacePlanet: PlanetData | null;
  onToggleCamera: () => void;
  onTriggerScanner: () => void;
  onOpenGalaxyMap: () => void;
  onOpenHangar: () => void;
  onOpenMissions: () => void;
  onOpenPause: () => void;
  onLandOrDock: () => void;
  onBlastOff: () => void;
  onScanDiscovery: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speed,
  energy,
  maxEnergy,
  shield,
  maxShield,
  credits,
  activeMission,
  nearbyPlanet,
  planetDistance,
  nearbyStation,
  stationDistance,
  nearbyDiscovery,
  discoveryDistance,
  waypointTarget,
  cameraMode,
  isSurfaceMode,
  surfacePlanet,
  onToggleCamera,
  onTriggerScanner,
  onOpenGalaxyMap,
  onOpenHangar,
  onOpenMissions,
  onOpenPause,
  onLandOrDock,
  onBlastOff,
  onScanDiscovery,
  muted,
  onToggleMute,
}) => {
  const [hudVisible, setHudVisible] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  const energyPercent = Math.max(0, Math.min(100, Math.round((energy / maxEnergy) * 100)));
  const shieldPercent = Math.max(0, Math.min(100, Math.round((shield / maxShield) * 100)));

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-3 md:p-5 overflow-hidden">
      {/* TOP SLEEK STRIP: Ultra-compact, low-profile, translucent */}
      <div className="flex items-center justify-between w-full">
        {/* TOP LEFT: Sleek Flight Telemetry Pill */}
        {hudVisible ? (
          <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-950/70 border border-cyan-500/30 shadow-lg shadow-black/40">
            {/* Speed readout */}
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">SPD</span>
              <span className="text-sm font-bold text-white tabular-nums">{speed}</span>
              <span className="text-[9px] text-slate-400">KTS</span>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-700/60" />

            {/* Micro Dual Gauges: Energy & Shield */}
            <div className="flex flex-col gap-1 w-20">
              {/* Energy line */}
              <div className="flex items-center gap-1.5">
                <Zap className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${energyPercent}%` }}
                  />
                </div>
              </div>
              {/* Shield line */}
              <div className="flex items-center gap-1.5">
                <Shield className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 transition-all duration-100"
                    style={{ width: `${shieldPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-700/60" />

            {/* Credits / Quantum Crystals */}
            <div className="flex items-center gap-1 font-mono text-xs text-purple-300">
              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="font-bold tabular-nums">{credits}</span>
              <span className="text-[9px] text-purple-400/80">QC</span>
            </div>

            {/* Mode badge */}
            <div className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-[9px] font-mono text-cyan-300 uppercase tracking-widest border border-cyan-800/40">
              {isSurfaceMode ? 'Surface' : cameraMode === 'cockpit' ? 'Cockpit' : 'Orbit'}
            </div>
          </div>
        ) : <div />}

        {/* TOP RIGHT: Minimal 1-Line Mission Tracker & Control Icons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {hudVisible && activeMission && (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenMissions();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-xs text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer shadow-lg"
              title="Click to view Mission Log"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-medium text-xs truncate max-w-[150px] md:max-w-[200px]">
                {activeMission.title}
              </span>
              {activeMission.targetCount && activeMission.targetCount > 1 && (
                <span className="text-[10px] font-mono text-cyan-400 tabular-nums">
                  ({activeMission.currentCount}/{activeMission.targetCount})
                </span>
              )}
            </button>
          )}

          {/* Quick icon actions */}
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-slate-950/70 border border-slate-800 shadow-lg">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-full text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title="Toggle Audio"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setHudVisible(!hudVisible)}
              className="p-1.5 rounded-full text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title="Toggle Cinema / Zen Mode [H]"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenPause();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title="Pause [Esc]"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER VIEWPORT: Reticle & CONTEXTUAL PROMPTS (Rises ONLY when near interactables) */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* Subtle aerospace reticle */}
        <div className="opacity-60 mb-8">
          <svg className="w-20 h-20 text-cyan-400/50" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.6" />
            <circle cx="50" cy="50" r="2.5" fill="#38bdf8" />
            <path d="M 34 45 L 40 45 L 40 48" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 66 45 L 60 45 L 60 48" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="50" y1="12" x2="50" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="50" y1="82" x2="50" y2="88" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Contextual Interaction Pill: Rises only when near a planet, station, or discovery */}
        {nearbyDiscovery && (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/95 border border-purple-400 shadow-2xl shadow-purple-950/80 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-xs font-bold text-white uppercase">{nearbyDiscovery.name}</span>
              <span className="text-[10px] text-purple-300 ml-2">({discoveryDistance}u · +{nearbyDiscovery.reward} QC)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onScanDiscovery();
              }}
              className="px-3.5 py-1 rounded-full bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span>Scan Relic [F]</span>
            </button>
          </div>
        )}

        {isSurfaceMode && surfacePlanet && (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/90 border border-cyan-400/80 shadow-2xl shadow-cyan-950/80">
            <MapPin className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-white font-bold">{surfacePlanet.name} Surface</span>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onBlastOff();
              }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Blast Off [F]</span>
            </button>
          </div>
        )}

        {!isSurfaceMode && nearbyPlanet && nearbyPlanet.canLand && (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/90 border border-amber-400/80 shadow-2xl shadow-black/80">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="text-left font-mono">
              <span className="text-xs font-bold text-white uppercase">{nearbyPlanet.name}</span>
              <span className="text-[10px] text-amber-300 ml-2">({planetDistance}u)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onLandOrDock();
              }}
              className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              Land On Planet [F]
            </button>
          </div>
        )}

        {!isSurfaceMode && nearbyStation && (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/90 border border-emerald-400/80 shadow-2xl shadow-black/80">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-xs font-bold text-white uppercase">{nearbyStation.name}</span>
              <span className="text-[10px] text-emerald-300 ml-2">({stationDistance}u)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onLandOrDock();
              }}
              className="px-3 py-1 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              Dock With Station [F]
            </button>
          </div>
        )}

        {/* Waypoint Guidance Chip if active */}
        {!nearbyPlanet && !nearbyStation && !nearbyDiscovery && waypointTarget && (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 shadow-lg text-[11px] font-mono text-slate-300">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="text-slate-400">WAYPOINT:</span>
            <span className="text-cyan-300 font-bold">{waypointTarget.name}</span>
            <span className="text-slate-400">({waypointTarget.distance}u)</span>
          </div>
        )}
      </div>

      {/* BOTTOM AREA: Completely clear of the ship! Subtle collapsible tool tab at the bottom edge */}
      <div className="pointer-events-auto flex flex-col items-center mx-auto mb-1">
        {/* Tool Drawer (Toggled only if player wants to open quick tools without hotkeys) */}
        {showDrawer && (
          <div className="animate-fade-in mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onToggleCamera();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Camera [C]</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onTriggerScanner();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radar [Shift]</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenGalaxyMap();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map [M]</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenHangar();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Hangar</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playUiClick();
                onOpenMissions();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Missions [L]</span>
            </button>
          </div>
        )}

        {/* Micro Toggle Tab: Barely visible at the bottom edge */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          {showDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          <span>{showDrawer ? 'Hide Tools' : 'Quick Tools'}</span>
        </button>
      </div>
    </div>
  );
};
