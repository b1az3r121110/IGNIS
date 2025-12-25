
import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPlugins: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onImport, onOpenPlugins }) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0f0a0a] relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1010_0%,#000000_100%)]"></div>
      <div className="absolute inset-0 firewatch-gradient opacity-10 blur-[100px] animate-pulse"></div>
      
      {/* Interactive Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)] pointer-events-none"></div>

      <div className="z-10 text-center max-w-2xl relative">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ff5e3a] rounded-full blur-[120px] opacity-40"></div>
        
        <div className="mb-12 relative">
          <div className="w-24 h-24 rounded-3xl firewatch-gradient mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(255,94,58,0.5)] transform -rotate-12 mb-6 border border-white/20">
            <i className="fas fa-fire text-white text-5xl"></i>
          </div>
          <h1 className="text-9xl font-black tracking-tighter text-white leading-none mix-blend-overlay">IGNIS</h1>
          <h1 className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 leading-none absolute top-0 left-0 w-full top-[6.5rem]">IGNIS</h1>
          <p className="text-2xl font-black text-[#ff9d5c] uppercase tracking-[0.5em] mt-4 opacity-80">Now with 4D support</p>
        </div>
        
        <div className="flex flex-col gap-5 max-w-md mx-auto">
          <button 
            onClick={onStart}
            className="group w-full py-5 bg-[#ff5e3a] hover:bg-[#ff9d5c] text-white rounded-[2rem] font-black text-xl shadow-[0_10px_40px_rgba(255,94,58,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 border border-white/10"
          >
            <i className="fas fa-play text-sm"></i>
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

        <div className="mt-16 flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Stable v2.5.0</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Flint Phys Active</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> AI Ready</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
