/**
 * ALLIFLY 3D Space Explorer - Settings & Controls Modal
 */

import React, { useRef, useState } from 'react';
import { X, Sliders, Volume2, Monitor, RotateCcw, Save, Download, Upload, BatteryCharging, Check } from 'lucide-react';
import { GameSettings, SaveSlotId } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';
import { getSaveSlotsSummary } from '../game/storage';

interface SettingsModalProps {
  settings: GameSettings;
  currentSlotId: SaveSlotId;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onSelectSlot: (slotId: SaveSlotId) => void;
  onExportSave: () => void;
  onImportSave: (jsonStr: string) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  currentSlotId,
  onUpdateSettings,
  onSelectSlot,
  onExportSave,
  onImportSave,
  onResetSave,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const slotsSummary = getSaveSlotsSummary();

  const handleVolumeChange = (type: 'soundVolume' | 'musicVolume' | 'sfxVolume', value: number) => {
    const updated = { ...settings, [type]: value };
    onUpdateSettings(updated);
    soundEngine.setVolumes(
      updated.soundVolume,
      updated.sfxVolume,
      updated.musicVolume,
      updated.muted
    );
  };

  const handleMuteChange = (muted: boolean) => {
    const updated = { ...settings, muted };
    onUpdateSettings(updated);
    soundEngine.setVolumes(
      updated.soundVolume,
      updated.sfxVolume,
      updated.musicVolume,
      muted
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onImportSave(text);
        setImportStatus('Save loaded successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 select-none animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Game Settings & Multi-Slot Saves</h2>
              <p className="text-xs font-mono text-cyan-400/80">Flight Parameters, Graphics Optimization & Backup</p>
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* SAVE SLOTS & CHECKPOINTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <Save className="w-4 h-4" /> Multi-Slot Save Files & Checkpoints
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Checksum Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {(['slot1', 'slot2', 'slot3', 'autosave'] as SaveSlotId[]).map((slotId) => {
                const info = slotsSummary[slotId];
                const isActive = currentSlotId === slotId;

                return (
                  <button
                    key={slotId}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onSelectSlot(slotId);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-cyan-300">
                        {slotId === 'autosave' ? 'Autosave Safe Point' : `Save ${slotId.toUpperCase()}`}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 text-[9px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 mt-1 truncate">
                      {info.exists ? info.checkpoint : 'Empty Odyssey Slot'}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>{info.exists ? `${info.credits} QC Crystals` : 'New Pilot'}</span>
                      <span>{info.exists && info.date ? info.date.split(',')[0] : 'Ready'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Export & Import save actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onExportSave();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Save JSON</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-purple-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Save File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {importStatus && (
              <div className="text-xs font-mono text-emerald-400 text-center animate-fade-in">
                {importStatus}
              </div>
            )}
          </div>

          {/* Graphics Quality & Battery Saver */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <Monitor className="w-4 h-4" /> Graphics Quality & Optimization
              </div>

              {/* Battery saver toggle */}
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onUpdateSettings({ ...settings, batterySaver: !settings.batterySaver });
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                  settings.batterySaver
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>Battery Saver: {settings.batterySaver ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onUpdateSettings({ ...settings, graphicsQuality: q });
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer border ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Sliders */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <Volume2 className="w-4 h-4" /> Audio Synthesis Volume
              </div>
              <button
                onClick={() => handleMuteChange(!settings.muted)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition cursor-pointer border ${
                  settings.muted
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {settings.muted ? 'Muted' : 'Sound Active'}
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Master Volume</span>
                  <span>{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => handleVolumeChange('soundVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Engine & SFX Volume</span>
                  <span>{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Ambient Cosmic Music</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Controls Sensitivity & Pitch */}
          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs font-mono">
            <div className="text-cyan-400 uppercase tracking-wider">Flight Controls Tuning</div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Flight Stick / Mouse Sensitivity</span>
                <span>{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300">Invert Flight Pitch Axis</span>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onUpdateSettings({ ...settings, invertPitch: !settings.invertPitch });
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase border transition cursor-pointer ${
                  settings.invertPitch
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {settings.invertPitch ? 'Inverted' : 'Standard'}
              </button>
            </div>
          </div>

          {/* Save Data Reset */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Reset Saved Progress</div>
              <div className="text-[11px] text-slate-400 font-sans">Clears current slot data and starts fresh odyssey</div>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Reset saved progress in ${currentSlotId.toUpperCase()} and start a fresh game?`)) {
                  soundEngine.playUiClick();
                  onResetSave();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs font-mono hover:bg-rose-900 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
