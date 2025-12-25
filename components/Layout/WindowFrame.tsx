
import React from 'react';

interface WindowFrameProps {
    children: React.ReactNode;
    title: string;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ children, title }) => {
    return (
        <div className="w-screen h-screen flex flex-col bg-[#0f0a0a] border border-[#333] overflow-hidden select-none">
            {/* Custom Title Bar */}
            <div className="h-8 bg-[#1a0f0f] border-b border-[#333] flex items-center justify-between px-3 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="flex items-center gap-2 opacity-70">
                    <div className="w-3 h-3 rounded bg-[#ff5e3a] flex items-center justify-center">
                        <i className="fas fa-fire text-[6px] text-white"></i>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">{title}</span>
                </div>
                
                <div className="flex items-center gap-1 no-drag">
                    <button className="w-8 h-6 flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <i className="fas fa-minus text-[8px]"></i>
                    </button>
                    <button className="w-8 h-6 flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <i className="far fa-square text-[8px]"></i>
                    </button>
                    <button className="w-8 h-6 flex items-center justify-center hover:bg-red-500 text-gray-500 hover:text-white transition-colors">
                        <i className="fas fa-times text-[10px]"></i>
                    </button>
                </div>
            </div>
            
            {/* App Content */}
            <div className="flex-1 relative overflow-hidden">
                {children}
            </div>
            
            {/* Status Bar */}
            <div className="h-5 bg-[#120a0a] border-t border-[#333] flex items-center px-2 justify-between">
                <div className="flex gap-4 text-[9px] text-gray-600 font-mono">
                    <span className="flex items-center gap-1"><i className="fab fa-windows"></i> Win64</span>
                    <span className="flex items-center gap-1"><i className="fas fa-memory"></i> Mem: 240MB</span>
                    <span className="flex items-center gap-1"><i className="fas fa-tachometer-alt"></i> FPS: 144</span>
                </div>
                <div className="text-[9px] text-gray-700 font-mono">
                    Ignis Engine Native Wrapper
                </div>
            </div>
        </div>
    );
};

export default WindowFrame;
