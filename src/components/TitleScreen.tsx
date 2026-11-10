/**
 * ALLIFLY 3D Space Explorer - Title Screen & Cinematic Launch
 */

import React from 'react';
import { Volume2, VolumeX, Download, Wrench, Play, RotateCcw, Compass } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface TitleScreenProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  hasSave: boolean;
  onOpenHangar: () => void;
  onOpenGalaxyMap: () => void;
  onOpenInstallGuide: () => void;
  onOpenSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onContinueGame,
  hasSave,
  onOpenHangar,
  onOpenGalaxyMap,
  onOpenInstallGuide,
  onOpenSettings,
  muted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
            </svg>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono">Deep Space Simulation</div>
            <div className="text-xs text-slate-400 font-mono">Sector 7-Alpha · Version 2.4.0</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition cursor-pointer"
            title="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenInstallGuide();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs font-mono text-cyan-300 hover:bg-sky-900/80 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* Hero Title Lockup & Bespoke Logo */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-2xl mx-auto">
        <div className="relative mb-3">
          {/* Futuristic Title SVG Lockup */}
          <svg className="w-72 md:w-96 h-24 overflow-visible" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="alliflyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="45%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#a855f7" />
              </linearGradient>
            </defs>
            <text
              x="200"
              y="68"
              textAnchor="middle"
              className="font-black tracking-widest text-5xl"
              fill="url(#alliflyGrad)"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.22em',
                fontWeight: 900,
                filter: 'drop-shadow(0 4px 18px rgba(56, 189, 248, 0.45))',
              }}
            >
              ALLIFLY
            </text>
            {/* Sleek winglet accents */}
            <path d="M 30 75 L 110 75 L 125 80" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.8" />
            <path d="M 370 75 L 290 75 L 275 80" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.8" />
          </svg>

          <div className="text-sm md:text-base font-mono tracking-widest text-cyan-300 uppercase mt-[-10px]">
            3D Space Explorer Odyssey
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-300/90 max-w-md mx-auto mb-8 font-sans leading-relaxed">
          Pilot the Allifly Starwing across alien planetary systems, harvest quantum crystals, complete deep-space missions, and upgrade your spacecraft.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {hasSave && (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onContinueGame();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Continue Odyssey</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onStartGame();
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold transition cursor-pointer ${
              hasSave
                ? 'bg-slate-900/90 border border-slate-700/80 text-cyan-300 hover:border-cyan-500/60 hover:bg-slate-800'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{hasSave ? 'New Game' : 'Launch Flight'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenHangar();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/60 transition cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Hangar</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenGalaxyMap();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/60 transition cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Galaxy Map</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Footer Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-slate-400/90 border-t border-slate-800/80 pt-4 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-2 md:mb-0">
          <span className="text-slate-300 font-medium">Flight Controls:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">W</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">S</kbd> Throttle</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">A</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">D</kbd> Turn</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Space</kbd> Boost</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">F</kbd> Land / Interact</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">M</kbd> Galaxy Map</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">L</kbd> Missions</span>
        </div>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onOpenSettings();
          }}
          className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          Options & Controls →
        </button>
      </div>
    </div>
  );
};
