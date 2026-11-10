/**
 * ALLIFLY 3D Space Explorer - In-Game Pause Menu
 */

import React from 'react';
import { Play, Compass, Wrench, Layers, Sliders, Home, Save } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface PauseMenuProps {
  onResume: () => void;
  onOpenGalaxyMap: () => void;
  onOpenHangar: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
  onSaveGame: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onOpenGalaxyMap,
  onOpenHangar,
  onOpenMissions,
  onOpenSettings,
  onReturnToTitle,
  onSaveGame,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-950 border border-cyan-800/60 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title Lockup */}
        <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mb-3 text-cyan-400">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Simulation Paused</h2>
        <p className="text-xs font-mono text-cyan-400/80 mb-6">Flight telemetry suspended</p>

        {/* Action Buttons Stack */}
        <div className="w-full space-y-2.5 font-mono text-xs">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Flight [Esc]</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onSaveGame();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Save Progress</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenGalaxyMap();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Galaxy Map [M]</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenHangar();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Spaceship Hangar</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenMissions();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Missions Log</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenSettings();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onReturnToTitle();
            }}
            className="w-full py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/60 text-rose-300 flex items-center justify-center gap-2 transition cursor-pointer mt-2"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
