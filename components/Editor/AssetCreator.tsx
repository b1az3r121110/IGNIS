
import React, { useRef, useState, useEffect } from 'react';
import { Asset } from '../../types';

interface AssetCreatorProps {
    assets?: Asset[];
    onSave?: (asset: Asset) => void;
}

const AssetCreator: React.FC<AssetCreatorProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState([{id: 1, name: 'Base Layer', visible: true}]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [tool, setTool] = useState<'BRUSH' | 'PIXEL' | 'ERASER' | 'NOISE'>('BRUSH');
  const [brushColor, setBrushColor] = useState('#ff5e3a');
  const [brushSize, setBrushSize] = useState(5);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);

  const getPos = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return {x:0, y:0};
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
      };
  };

  const draw = (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      const pos = getPos(e);
      
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'ERASER') {
          ctx.globalCompositeOperation = 'destination-out';
      } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = brushColor;
          ctx.strokeStyle = brushColor;
      }

      if (tool === 'PIXEL') {
          // Pixel Art Mode: Draw 1x1 squares snapped to grid
          const pixelSize = brushSize; 
          const px = Math.floor(pos.x / pixelSize) * pixelSize;
          const py = Math.floor(pos.y / pixelSize) * pixelSize;
          ctx.fillRect(px, py, pixelSize, pixelSize);
      } else {
          // Standard Brush
          if (lastPos) {
              ctx.beginPath();
              ctx.moveTo(lastPos.x, lastPos.y);
              ctx.lineTo(pos.x, pos.y);
              ctx.stroke();
          } else {
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
              ctx.fill();
          }
      }
      
      setLastPos(pos);
  };

  const startDrawing = (e: React.MouseEvent) => {
      setIsDrawing(true);
      const pos = getPos(e);
      setLastPos(pos);
      // Trigger a single dot draw for clicks
      if(tool === 'PIXEL') {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if(!ctx) return;
          const pixelSize = brushSize; 
          const px = Math.floor(pos.x / pixelSize) * pixelSize;
          const py = Math.floor(pos.y / pixelSize) * pixelSize;
          
          ctx.fillStyle = brushColor;
          ctx.fillRect(px, py, pixelSize, pixelSize);
      }
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      setLastPos(null);
  };
  
  // Procedural Noise Generator
  const generateNoise = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      // Preserve existing content, just add noise over it? 
      // Or clear and add noise. Let's add over.
      const imgData = ctx.getImageData(0,0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for(let i = 0; i < data.length; i += 4) {
          if (Math.random() > 0.5) continue; // Noise sparsity
          // Only modify alpha if we want noise on transparent
          data[i] = Math.random() * 255;
          data[i+1] = Math.random() * 255;
          data[i+2] = Math.random() * 255;
          data[i+3] = 255; 
      }
      ctx.putImageData(imgData, 0, 0);
  };

  const saveTexture = () => {
      if(!onSave || !canvasRef.current) return;
      // Mock saving logic
      const asset: Asset = {
          id: `tex_${Date.now()}`,
          name: `Texture_${Date.now()}`,
          type: 'TEXTURE',
          icon: 'fa-image',
          size: '512 KB'
      };
      onSave(asset);
      alert("Texture Saved to Browser!");
  };

  return (
    <div className="w-full h-full bg-[#0f0a0a] flex" onMouseUp={stopDrawing}>
       {/* Left Toolbar */}
       <div className="w-16 bg-[#1a0f0f] border-r border-white/5 flex flex-col items-center py-4 gap-4">
           <button onClick={() => setTool('BRUSH')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === 'BRUSH' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`}><i className="fas fa-paint-brush"></i></button>
           <button onClick={() => setTool('PIXEL')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === 'PIXEL' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`} title="Pixel Tool"><i className="fas fa-border-all"></i></button>
           <button onClick={() => setTool('NOISE')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === 'NOISE' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`} title="Noise Gen"><i className="fas fa-cloud"></i></button>
           <button onClick={() => setTool('ERASER')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool === 'ERASER' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`}><i className="fas fa-eraser"></i></button>
           
           <div className="h-px w-8 bg-white/10 my-2"></div>
           <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer" />
           
           <div className="flex flex-col items-center mt-2">
               <span className="text-[8px] text-gray-500 mb-1">SIZE</span>
               <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-12 h-1 bg-white/20 rounded-full accent-[#ff5e3a] -rotate-90 mt-4" />
           </div>
       </div>

       {/* Canvas Area */}
       <div className="flex-1 bg-[#0a0505] flex items-center justify-center relative">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
                <button onClick={generateNoise} className="px-3 py-1 bg-white/5 rounded text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">Gen Noise</button>
                <button onClick={() => { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0,0,canvas.width, canvas.height); }} className="px-3 py-1 bg-white/5 rounded text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">Clear</button>
                <div className="w-px h-4 bg-white/10 my-auto mx-1"></div>
                <button onClick={saveTexture} className="px-3 py-1 bg-[#ff5e3a]/20 text-[#ff5e3a] border border-[#ff5e3a]/50 rounded text-[10px] font-bold uppercase hover:bg-[#ff5e3a]/40 transition-colors">Save Asset</button>
            </div>
            
            <div className="relative shadow-2xl">
                 {/* Checkerboard Background for Transparency */}
                 <div 
                    className="absolute inset-0 pointer-events-none z-0" 
                    style={{
                        backgroundImage: `linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: '#1a1a1a'
                    }}
                 ></div>
                 <div className="absolute inset-0 border border-white/10 pointer-events-none z-10"></div>
                 <canvas 
                    ref={canvasRef} 
                    width={512} 
                    height={512} 
                    className="cursor-crosshair relative z-1" 
                    style={{ imageRendering: 'pixelated' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                />
            </div>
       </div>

       {/* Right Panel: Layers */}
       <div className="w-64 bg-[#1a0f0f] border-l border-white/5 p-4 flex flex-col">
           <h3 className="text-xs font-black uppercase text-[#ff9d5c] mb-4 tracking-widest">Texture Layers</h3>
           <div className="flex-1 space-y-2">
               {layers.map(layer => (
                   <div key={layer.id} className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${activeLayer === layer.id ? 'bg-[#ff5e3a]/10 border border-[#ff5e3a]' : 'bg-white/5 border border-transparent hover:bg-white/10'}`} onClick={() => setActiveLayer(layer.id)}>
                       <i className={`fas fa-eye text-xs ${layer.visible ? 'text-white' : 'text-gray-600'}`}></i>
                       <span className={`text-xs font-bold ${activeLayer === layer.id ? 'text-[#ff9d5c]' : 'text-gray-400'}`}>{layer.name}</span>
                   </div>
               ))}
               <button onClick={() => setLayers([...layers, {id: layers.length+1, name: `Layer ${layers.length+1}`, visible: true}])} className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-colors text-gray-400 hover:text-white mt-4">
                   + Add Layer
               </button>
           </div>
           
           <div className="bg-white/5 p-4 rounded-xl mt-4">
               <h4 className="text-[9px] font-bold text-gray-500 mb-2">TOOL INFO</h4>
               <div className="flex justify-between text-xs text-gray-300">
                   <span>Active Tool:</span>
                   <span className="font-bold text-[#ff5e3a]">{tool}</span>
               </div>
               <div className="flex justify-between text-xs text-gray-300">
                   <span>Brush Size:</span>
                   <span>{brushSize}px</span>
               </div>
           </div>
       </div>
    </div>
  );
};

export default AssetCreator;
