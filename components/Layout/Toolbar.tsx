
import React from 'react';
import { RenderDimension } from '../../types';

interface ToolbarProps {
  dimension: RenderDimension;
  setDimension: (d: RenderDimension) => void;
  isSimulating: boolean;
  setIsSimulating: (s: boolean) => void;
  wPosition: number;
  setWPosition: (w: number) => void;
  wFov: number; // New Prop
  setWFov: (f: number) => void; // New Prop
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showDebug: boolean;
  setShowDebug: (s: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  dimension, setDimension, isSimulating, setIsSimulating, wPosition, setWPosition, wFov, setWFov,
  onUndo, onRedo, canUndo, canRedo, showDebug, setShowDebug 
}) => {
  return (
    <div className="h-16 bg-transparent flex items-center px-8 gap-6 z-10">
      {/* Simulation Controls */}
      <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-5 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isSimulating ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'hover:bg-white/10 text-gray-400'
          }`}
        >
          <i className={`fas ${isSimulating ? 'fa-stop' : 'fa-play'} text-[10px]`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{isSimulating ? 'Stop' : 'Run'}</span>
        </button>
        {isSimulating && (
             <button className="px-3 py-2 rounded-xl hover:bg-white/10 text-gray-400 transition-all" title="Step Frame">
                <i className="fas fa-step-forward text-[10px]"></i>
             </button>
        )}
      </div>

      <div className="h-8 w-px bg-white/10"></div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-xl">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-all ${canUndo ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 opacity-20 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >
          <i className="fas fa-undo-alt text-xs"></i>
        </button>
        <button 
          onClick={onRedo} 
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-all ${canRedo ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 opacity-20 cursor-not-allowed'}`}
          title="Redo (Ctrl+Y)"
        >
          <i className="fas fa-redo-alt text-xs"></i>
        </button>
      </div>

      <div className="h-8 w-px bg-white/10"></div>

      {/* Dimension Switcher */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-xl">
        {(Object.values(RenderDimension)).map(d => (
          <button
            key={d}
            onClick={() => setDimension(d)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              dimension === d 
                ? 'bg-[#ff9d5c] text-black shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* 4D Controls */}
      {dimension === RenderDimension.D4 && (
        <div className="flex items-center gap-4 flex-1 px-4 bg-black/40 rounded-2xl border border-white/5 h-full">
          <div className="flex items-center gap-2 flex-1">
             <span className="text-[9px] font-black text-[#ff9d5c] uppercase tracking-widest whitespace-nowrap">W-Offset</span>
             <input 
                type="range" 
                min="-10" 
                max="10" 
                step="0.01" 
                value={wPosition}
                onChange={(e) => setWPosition(parseFloat(e.target.value))}
                className="flex-1 accent-[#ff5e3a] h-1 bg-white/10 rounded-full cursor-pointer"
             />
             <span className="text-[8px] font-mono text-gray-400 w-8">{wPosition.toFixed(1)}</span>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex items-center gap-2 flex-1">
             <span className="text-[9px] font-black text-[#ff9d5c] uppercase tracking-widest whitespace-nowrap">Hyper FOV</span>
             <input 
                type="range" 
                min="45" 
                max="179" 
                step="1" 
                value={wFov}
                onChange={(e) => setWFov(parseFloat(e.target.value))}
                className="flex-1 accent-[#ff5e3a] h-1 bg-white/10 rounded-full cursor-pointer"
             />
             <span className="text-[8px] font-mono text-gray-400 w-8">{wFov}°</span>
          </div>
        </div>
      )}

      {!isSimulating && dimension !== RenderDimension.D4 && <div className="flex-1" />}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
         <button 
            onClick={() => setShowDebug(!showDebug)}
            className={`h-10 px-4 rounded-2xl border border-white/5 flex items-center justify-center transition-all ${showDebug ? 'bg-[#ff5e3a] text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            title="Debug Terminal"
         >
           <i className="fas fa-terminal text-xs mr-2"></i>
           <span className="text-[9px] font-black uppercase">Console</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
