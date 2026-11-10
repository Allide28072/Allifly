/**
 * ALLIFLY 3D Space Explorer - Interactive Galaxy Star Map & Warp Navigation
 */

import React, { useState } from 'react';
import { X, Navigation, Compass, ShieldAlert, Sparkles, MapPin, Zap } from 'lucide-react';
import { PlanetData, SpaceStationData } from '../types/game';
import { SOLAR_PLANETS, SPACE_STATIONS } from '../game/planetsData';
import { soundEngine } from '../audio/SoundEngine';

interface GalaxyMapModalProps {
  discoveredPlanetIds: string[];
  currentPlanetNearby: PlanetData | null;
  onWarpTo: (targetPos: [number, number, number]) => void;
  onClose: () => void;
}

export const GalaxyMapModal: React.FC<GalaxyMapModalProps> = ({
  discoveredPlanetIds,
  currentPlanetNearby,
  onWarpTo,
  onClose,
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData>(
    currentPlanetNearby || SOLAR_PLANETS[0]
  );
  const [selectedStation, setSelectedStation] = useState<SpaceStationData | null>(null);

  const isDiscovered = (id: string) => discoveredPlanetIds.includes(id);

  const handleSelectPlanet = (planet: PlanetData) => {
    soundEngine.playUiClick();
    setSelectedPlanet(planet);
    setSelectedStation(null);
  };

  const handleSelectStation = (station: SpaceStationData) => {
    soundEngine.playUiClick();
    setSelectedStation(station);
  };

  const handleWarp = () => {
    if (selectedStation) {
      onWarpTo(selectedStation.position);
    } else if (selectedPlanet) {
      onWarpTo(selectedPlanet.position);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Tactical Galaxy Map</h2>
              <p className="text-xs font-mono text-cyan-400/80">Sector 7-Alpha · Quantum Navigation Chart</p>
            </div>
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

        {/* Map Body: 2D Radar Canvas (Left) + Planet Intelligence Dossier (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Radar Starmap Display */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Grid concentric rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[120px] h-[120px] rounded-full border border-cyan-500/20" />
              <div className="absolute w-[220px] h-[220px] rounded-full border border-cyan-500/15 border-dashed" />
              <div className="absolute w-[320px] h-[320px] rounded-full border border-cyan-500/15" />
              <div className="absolute w-[440px] h-[440px] rounded-full border border-cyan-500/10 border-dashed" />
              <div className="absolute w-[560px] h-[560px] rounded-full border border-cyan-500/10" />

              {/* Crosshair axes */}
              <div className="absolute w-full h-[1px] bg-cyan-500/10" />
              <div className="absolute h-full w-[1px] bg-cyan-500/10" />
            </div>

            {/* Central Star: Helios Alpha */}
            <div className="absolute flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 shadow-lg shadow-amber-400/50" />
              <span className="text-[9px] font-mono text-amber-300/80 mt-1 uppercase">Helios Core</span>
            </div>

            {/* Celestial Bodies Plotted on Radar */}
            {SOLAR_PLANETS.map((planet) => {
              const rad = (planet.orbitRadius / 950) * 260;
              // Angle from position coordinates
              const angle = Math.atan2(planet.position[2], planet.position[0]);
              const x = Math.cos(angle) * rad;
              const y = Math.sin(angle) * rad;
              const selected = selectedPlanet?.id === planet.id && !selectedStation;
              const discovered = isDiscovered(planet.id);

              return (
                <button
                  key={planet.id}
                  onClick={() => handleSelectPlanet(planet)}
                  className="absolute flex flex-col items-center group transition cursor-pointer"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                      selected
                        ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-125'
                        : 'group-hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: discovered ? planet.groundColor : '#475569',
                      border: `2px solid ${planet.atmosphereColor}`,
                    }}
                  >
                    {planet.hasRings && (
                      <div className="w-10 h-2 border border-amber-300/50 rounded-full rotate-12 pointer-events-none" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 group-hover:text-cyan-300 whitespace-nowrap mt-1">
                    {planet.name}
                  </span>
                </button>
              );
            })}

            {/* Space Stations Plotted */}
            {SPACE_STATIONS.map((station) => {
              const rad = (Math.hypot(station.position[0], station.position[2]) / 950) * 260;
              const angle = Math.atan2(station.position[2], station.position[0]);
              const x = Math.cos(angle) * rad;
              const y = Math.sin(angle) * rad;
              const selected = selectedStation?.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => handleSelectStation(station)}
                  className="absolute flex flex-col items-center group transition cursor-pointer"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-sm bg-cyan-900 border border-cyan-400 flex items-center justify-center rotate-45 transition ${
                      selected ? 'ring-2 ring-emerald-400 scale-125' : 'group-hover:scale-110'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-300 group-hover:text-white whitespace-nowrap mt-1">
                    {station.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dossier Information Panel */}
          <div className="w-full lg:w-96 bg-slate-900/60 p-6 flex flex-col justify-between overflow-y-auto">
            {selectedStation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
                  <MapPin className="w-4 h-4" /> Orbital Space Station
                </div>
                <h3 className="text-xl font-bold text-white">{selectedStation.name}</h3>
                <div className="text-xs font-mono text-slate-400">Faction: {selectedStation.faction}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedStation.description}</p>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-mono uppercase text-slate-400">Station Facilities:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStation.services.map((svc) => (
                      <span key={svc} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-300">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs font-mono text-slate-300 space-y-1">
                  <div>Coords: [{selectedStation.position.join(', ')}]</div>
                  <div>Status: Docking Beacon Active</div>
                </div>
              </div>
            ) : selectedPlanet ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" /> {selectedPlanet.title}
                </div>
                <h3 className="text-2xl font-bold text-white">{selectedPlanet.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono uppercase">
                    Class: {selectedPlanet.type}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {selectedPlanet.canLand ? 'Surface Landable' : 'Atmosphere Only'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedPlanet.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Radius</span>
                    <span className="text-white font-semibold">{selectedPlanet.radius * 100} KM</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Orbital Moons</span>
                    <span className="text-white font-semibold">{selectedPlanet.moonsCount} Natural Satellites</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Atmosphere</span>
                    <span className="text-cyan-300 font-semibold">{selectedPlanet.atmosphereColor}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Rings</span>
                    <span className="text-white font-semibold">{selectedPlanet.hasRings ? 'Majestic System' : 'None'}</span>
                  </div>
                </div>

                {!selectedPlanet.canLand && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs font-mono">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Extreme gravity sheer prevents surface landing. Orbital scans only.</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Hyperjump Action CTA */}
            <button
              onClick={handleWarp}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Engage Quantum Hyperjump</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
