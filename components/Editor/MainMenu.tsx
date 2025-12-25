
import React from 'react';
import { LevelData } from '../../types';

interface MainMenuProps {
  onStart: () => void;
  onLoadLevel: (id: string) => void;
  levels: LevelData[];
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPlugins: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onLoadLevel, levels, onImport, onOpenPlugins }) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0f0a0a] relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1010_0%,#000000_100%)]"></div>
      <div className="absolute inset-0 firewatch-gradient opacity-10 blur-[100px] animate-pulse"></div>
      
      {/* Interactive Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)] pointer-events-none"></div>

      <div className="z-10 text-center max-w-4xl relative w-full px-8">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ff5e3a] rounded-full blur-[120px] opacity-40"></div>
        
        <div className="mb-12 relative">
          <div className="w-24 h-24 rounded-3xl firewatch-gradient mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(255,94,58,0.5)] transform -rotate-12 mb-6 border border-white/20">
            <i className="fas fa-fire text-white text-5xl"></i>
          </div>
          <h1 className="text-9xl font-black tracking-tighter text-white leading-none mix-blend-overlay">IGNIS</h1>
          <h1 className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 leading-none absolute top-0 left-0 w-full top-[6.5rem]">IGNIS</h1>
          <p className="text-2xl font-black text-[#ff9d5c] uppercase tracking-[0.5em] mt-4 opacity-80">v0.7.5b Build 1</p>
        </div>
        
        <div className="flex gap-12 justify-center items-start">
            
            {/* Quick Actions */}
            <div className="flex flex-col gap-5 w-72">
              <button 
                onClick={onStart}
                className="group w-full py-5 bg-[#ff5e3a] hover:bg-[#ff9d5c] text-white rounded-[2rem] font-black text-xl shadow-[0_10px_40px_rgba(255,94,58,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 border border-white/10"
              >
                <i className="fas fa-plus text-sm"></i>
                NEW PROJECT
              </button>
              
              <div className="flex gap-4">
                <input type="file" onChange={onImport} id="scene-import-main" className="hidden" />
                <label 
                  htmlFor="scene-import-main"
                  className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ff5e3a]/50 text-gray-300 rounded-[1.5rem] font-bold text-xs tracking-widest uppercase cursor-pointer transition-all flex items-center justify-center gap-2 group"
                >
                  <i className="fas fa-folder-open text-[#ff5e3a] group-hover:scale-110 transition-transform"></i> Import
                </label>
                <button 
                  onClick={onOpenPlugins}
                  className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ff5e3a]/50 text-gray-300 rounded-[1.5rem] font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group"
                >
                  <i className="fas fa-plug text-[#ff5e3a] group-hover:scale-110 transition-transform"></i> Plugins
                </button>
              </div>
            </div>

            {/* Scene Selector */}
            <div className="w-96 bg-black/40 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl flex flex-col h-80">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Scene</span>
                    <i className="fas fa-layer-group text-gray-600"></i>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {levels.map(level => (
                        <button 
                            key={level.id}
                            onClick={() => onLoadLevel(level.id)}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#ff5e3a]/50 rounded-2xl flex items-center gap-4 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center text-gray-600 group-hover:text-[#ff5e3a]">
                                <i className="fas fa-cube text-lg"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white group-hover:text-[#ff9d5c] transition-colors">{level.name}</h3>
                                <p className="text-[10px] text-gray-500">{level.entities.length} Entities • {new Date(level.lastModified).toLocaleDateString()}</p>
                            </div>
                            <i className="fas fa-chevron-right text-gray-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"></i>
                        </button>
                    ))}
                    {levels.length === 0 && (
                        <div className="text-center text-gray-600 text-xs py-10">No scenes found. Create a new project.</div>
                    )}
                </div>
            </div>

        </div>

        <div className="mt-16 flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> v0.7.5b (Build 1)</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Flint V3 Active</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> AI Ready</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
