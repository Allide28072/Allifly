/**
 * ALLIFLY 3D Space Explorer - Missions Log & Objectives Terminal
 */

import React, { useState } from 'react';
import { X, Target, CheckCircle2, Clock, Sparkles, Zap, Award } from 'lucide-react';
import { Mission } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface MissionLogModalProps {
  missions: Mission[];
  onSelectMission: (missionId: string) => void;
  onClose: () => void;
}

export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  missions,
  onSelectMission,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'available'>('all');

  const filteredMissions = missions.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const completedCount = missions.filter((m) => m.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 select-none animate-fade-in">
      <div className="relative w-full max-w-4xl h-[82vh] bg-slate-950 border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Mission Command Terminal</h2>
              <p className="text-xs font-mono text-cyan-400/80">
                Objectives Log · {completedCount}/{missions.length} Missions Accomplished
              </p>
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

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/30 text-xs font-mono">
          {(['all', 'active', 'available', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                soundEngine.playUiClick();
                setFilter(tab);
              }}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer ${
                filter === tab
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mission List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {filteredMissions.map((mission) => {
            const isCompleted = mission.status === 'completed';
            const isActive = mission.status === 'active';

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-xl border transition ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isActive
                    ? 'bg-slate-900/80 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
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
                      <h3 className="text-base font-bold text-white">{mission.title}</h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{mission.description}</p>
                    <div className="text-xs font-mono text-cyan-300 pt-1">
                      Objective: <span className="text-white font-medium">{mission.objective}</span>
                    </div>

                    {mission.targetCount && mission.targetCount > 1 && (
                      <div className="w-full max-w-md pt-2 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Status</span>
                          <span className="tabular-nums">
                            {mission.currentCount} / {mission.targetCount}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                            style={{
                              width: `${Math.min(100, (mission.currentCount / mission.targetCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="flex items-center gap-1 text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>+{mission.rewardCredits} QC</span>
                      </span>
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+{mission.rewardEnergy} En</span>
                      </span>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    ) : isActive ? (
                      <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                        Tracking Active
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          soundEngine.playUiClick();
                          onSelectMission(mission.id);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase transition cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
