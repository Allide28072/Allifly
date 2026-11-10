/**
 * ALLIFLY 3D Space Explorer - Dedicated Mobile Touch Controls
 * Left virtual joystick for pitch/yaw steering, right throttle slider & boost/scan/interact buttons
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Zap, Eye, Compass, Rocket, Radio } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface MobileControlsProps {
  onAnalogMove: (x: number, y: number) => void;
  onThrottleChange: (throttle: number) => void; // -1 to +1
  onBoostChange: (boosting: boolean) => void;
  onInteract: () => void;
  onTriggerScanner: () => void;
  onToggleCamera: () => void;
  onOpenGalaxyMap: () => void;
  canInteract: boolean;
  interactLabel: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onAnalogMove,
  onThrottleChange,
  onBoostChange,
  onInteract,
  onTriggerScanner,
  onToggleCamera,
  onOpenGalaxyMap,
  canInteract,
  interactLabel,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const [throttleVal, setThrottleVal] = useState(0);

  const handleJoystickTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickRef.current) return;
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const maxRadius = rect.width / 2;

      const dist = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const clampedDist = Math.min(dist, maxRadius);
      const posX = Math.cos(angle) * clampedDist;
      const posY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: posX, y: posY });
      onAnalogMove(posX / maxRadius, posY / maxRadius);
    },
    [onAnalogMove]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    handleJoystickTouch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleJoystickTouch(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onAnalogMove(0, 0);
  };

  const handleThrottleClick = (val: number) => {
    setThrottleVal(val);
    onThrottleChange(val);
  };

  useEffect(() => {
    return () => {
      onAnalogMove(0, 0);
      onThrottleChange(0);
      onBoostChange(false);
    };
  }, [onAnalogMove, onThrottleChange, onBoostChange]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex justify-between items-end p-4 pb-16">
      {/* Left Virtual Joystick */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div
          ref={joystickRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative w-36 h-36 rounded-full bg-slate-950/70 border-2 border-cyan-500/40 shadow-xl flex items-center justify-center touch-none"
        >
          {/* Outer ring ticks */}
          <div className="absolute inset-2 rounded-full border border-slate-700/50" />
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />

          {/* Interactive Thumb Knob */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border border-white/60 shadow-lg shadow-cyan-500/50 flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/70" />
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">Flight Stick</span>
      </div>

      {/* Right Controls: Throttle + Action Buttons */}
      <div className="pointer-events-auto flex items-end gap-3">
        {/* Quick Action Column */}
        <div className="flex flex-col gap-2">
          {canInteract && (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onInteract();
              }}
              className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase flex flex-col items-center justify-center shadow-lg active:scale-95 transition"
            >
              <Rocket className="w-4 h-4" />
              <span className="text-[9px] font-mono">{interactLabel}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onTriggerScanner();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center active:scale-95 transition shadow-lg"
          >
            <Radio className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onToggleCamera();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition shadow-lg"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenGalaxyMap();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition shadow-lg"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Throttle Column */}
        <div className="flex flex-col items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
          <button
            onClick={() => handleThrottleClick(1.0)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition ${
              throttleVal === 1.0 ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-900 text-cyan-300'
            }`}
          >
            MAX
          </button>

          <button
            onClick={() => handleThrottleClick(0.5)}
            className={`w-12 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition ${
              throttleVal === 0.5 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            CRZ
          </button>

          <button
            onClick={() => handleThrottleClick(0.0)}
            className={`w-12 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition ${
              throttleVal === 0.0 ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            CUT
          </button>

          <button
            onClick={() => handleThrottleClick(-0.6)}
            className={`w-12 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition ${
              throttleVal === -0.6 ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            REV
          </button>

          {/* Boost Button */}
          <button
            onTouchStart={() => onBoostChange(true)}
            onTouchEnd={() => onBoostChange(false)}
            onMouseDown={() => onBoostChange(true)}
            onMouseUp={() => onBoostChange(false)}
            className="w-12 h-14 rounded-xl bg-gradient-to-t from-purple-600 to-indigo-500 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-600/40 active:brightness-125 transition mt-1"
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span className="text-[9px] font-mono font-bold tracking-tighter">BOOST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
