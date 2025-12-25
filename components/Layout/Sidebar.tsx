
import React, { useState } from 'react';
import { EditorMode, Entity, Asset } from '../../types';
import { GoogleGenAI } from "@google/genai";

interface SidebarProps {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: Entity['meshType'], customData?: any) => void;
  activeMode: EditorMode;
  setActiveMode: (mode: EditorMode) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => void;
  onDropAsset: (asset: Asset, entityId: string) => void;
  onDropAssetToHierarchy?: (asset: Asset) => void; // New prop for generic drop
}

const Sidebar: React.FC<SidebarProps> = ({ entities, selectedId, onSelect, onAdd, activeMode, setActiveMode, onExport, onImport, onDelete, onDropAsset, onDropAssetToHierarchy }) => {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const modes = [
    { mode: EditorMode.VIEWPORT, icon: 'fa-cube', label: 'Design' },
    { mode: EditorMode.VISUAL_CODE, icon: 'fa-project-diagram', label: 'Logic' },
    { mode: EditorMode.SCRIPT_CODE, icon: 'fa-code', label: 'Script' },
    { mode: EditorMode.SHADER_EDITOR, icon: 'fa-fire', label: 'Shaders' },
    { mode: EditorMode.AUDIO_SUITE, icon: 'fa-music', label: 'Audio' },
    { mode: EditorMode.ASSET_BROWSER, icon: 'fa-folder-open', label: 'Assets' },
    { mode: EditorMode.ASSET_CREATOR, icon: 'fa-paint-brush', label: 'Creator' },
    { mode: EditorMode.EXTENSIONS, icon: 'fa-puzzle-piece', label: 'Plugins' },
    { mode: EditorMode.DOCS, icon: 'fa-book-open', label: 'Docs' },
  ];

  const shapes: Array<{type: Entity['meshType'], label: string, icon: string}> = [
    { type: 'BOX', label: 'Cube', icon: 'fa-cube' },
    { type: 'SPHERE', label: 'Sphere', icon: 'fa-circle' },
    { type: 'PLANE', label: 'Plane', icon: 'fa-square' },
    { type: 'CYLINDER', label: 'Cylinder', icon: 'fa-capsules' },
    { type: 'TESSERACT', label: '4D Tesseract', icon: 'fa-vector-square' },
    { type: 'GLOME', label: '4D Glome', icon: 'fa-globe' },
    { type: 'PARTICLE_SYSTEM', label: 'Ember Particles', icon: 'fa-wind' },
    { type: 'SPRITE', label: 'Sprite', icon: 'fa-image' }
  ];

  const handleAiGenerate = async () => {
    if(!aiPrompt) {
        alert("Please enter a prompt.");
        return;
    }
    
    setIsGenerating(true);
    
    try {
        if(!process.env.API_KEY) {
             alert(`API_KEY not found. Cannot connect to Gemini.`);
             setIsGenerating(false);
             return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemPrompt = `
        You are an expert 3D/4D geometry generator for the Ignis Engine.
        The engine uses a specific JSON format for procedural meshes.
        
        Your task is to generate a JSON object representing a mesh based on the user's description.
        
        Format:
        {
            "vertices": [x, y, z, w, ...], // Flat array of numbers. Stride is 4. W is the 4th dimension.
            "indices": [0, 1, 2, ...],     // Flat array of indices for triangles.
            "stride": 4
        }
        
        Constraints:
        - Keep vertex count under 1200 for performance.
        - Center the object at origin (0,0,0,0).
        - Use W-coordinate for 4D depth (usually 0 to 1, or -1 to 1).
        - If the user asks for a standard 3D object, set W to 0 for all vertices.
        - DO NOT wrap in markdown code blocks. Return raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `${systemPrompt}\n\nRequest: ${aiPrompt}`,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        const data = JSON.parse(text);

        if (data.vertices && data.indices) {
            onAdd('CUSTOM_MESH', { ...data, stride: 4 });
            setShowAiModal(false);
            setAiPrompt('');
        } else {
            alert("Model generated invalid geometry structure.");
        }

    } catch (e) {
        console.error(e);
        alert(`Generation failed. ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleHierarchyDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('ignis/hierarchy-id', id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleHierarchyDrop = (e: React.DragEvent, targetId?: string) => {
      e.preventDefault();
      setIsDragOver(false);
      const assetData = e.dataTransfer.getData('ignis/asset');
      if (assetData) {
          const asset: Asset = JSON.parse(assetData);
          if (targetId) {
            onDropAsset(asset, targetId);
          } else if (onDropAssetToHierarchy) {
            // Dropped on empty space in hierarchy
            onDropAssetToHierarchy(asset);
          }
      }
  };

  return (
    <div className="w-72 bg-transparent h-full flex flex-col p-4 gap-4 z-20 overflow-hidden relative">
      {/* HEADER */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1.5 opacity-30">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <button onClick={() => setActiveMode(EditorMode.MAIN_MENU)} className="text-[10px] font-black uppercase text-gray-500 hover:text-[#ff5e3a]">Exit</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl firewatch-gradient flex items-center justify-center shadow-lg transform -rotate-3">
            <i className="fas fa-fire text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter text-[#ff9d5c]">IGNIS</h1>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">v2.6.2 Ember</p>
          </div>
        </div>
      </div>

      {/* MODES */}
      <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-2 shadow-2xl grid grid-cols-4 gap-1">
        {modes.map(m => (
          <button
            key={m.mode}
            onClick={() => setActiveMode(m.mode)}
            title={m.label}
            className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all ${
              activeMode === m.mode 
                ? 'bg-[#ff5e3a] text-white shadow-xl' 
                : 'hover:bg-white/5 text-gray-500'
            }`}
          >
            <i className={`fas ${m.icon} text-xs`}></i>
          </button>
        ))}
      </div>

      {/* HIERARCHY */}
      <div 
        className={`bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 flex-1 flex flex-col min-h-0 shadow-2xl transition-all ${isDragOver ? 'bg-white/10 border-[#ff5e3a] border-dashed' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => handleHierarchyDrop(e)}
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 relative">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hierarchy</span>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowAiModal(true)}
                className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-lg border border-indigo-500/30"
                title="AI 4D Generator"
            >
                <i className="fas fa-magic text-[10px]"></i>
            </button>
            <button 
              onClick={() => setAddMenuOpen(!addMenuOpen)} 
              className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center transition-colors ${addMenuOpen ? 'text-[#ff5e3a]' : 'hover:text-[#ff9d5c]'}`}
            >
                <i className="fas fa-plus text-[10px]"></i>
            </button>
          </div>
          
          {/* Add Menu */}
          {addMenuOpen && (
              <div className="absolute top-12 right-6 w-48 bg-[#1c0f0f] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="block text-[8px] font-black text-gray-500 uppercase px-3 mb-1">Primitive Shapes</span>
                {shapes.map(s => (
                    <button 
                        key={s.type}
                        onClick={() => { onAdd(s.type); setAddMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-white/5 rounded-xl uppercase flex items-center gap-2"
                    >
                        <i className={`fas ${s.icon} opacity-50`}></i>
                        {s.label}
                    </button>
                ))}
              </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
          {entities.map(entity => (
            <div 
                key={entity.id} 
                className="relative group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.stopPropagation(); handleHierarchyDrop(e, entity.id); }}
            >
              <button
                draggable
                onDragStart={(e) => handleHierarchyDragStart(e, entity.id)}
                onClick={() => onSelect(entity.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-xs flex items-center gap-4 transition-all cursor-grab active:cursor-grabbing ${
                  selectedId === entity.id 
                    ? 'bg-white/10 text-[#ff9d5c] border border-white/10 shadow-lg' 
                    : 'hover:bg-white/5 text-gray-500'
                }`}
              >
                <i className={`fas ${
                  entity.meshType === 'BOX' ? 'fa-cube' : 
                  entity.meshType === 'SPHERE' ? 'fa-circle' : 
                  entity.meshType === 'PARTICLE_SYSTEM' ? 'fa-wind' :
                  entity.meshType === 'CUSTOM_MESH' ? 'fa-draw-polygon' :
                  'fa-vector-square'
                } opacity-40 text-[10px]`}></i>
                <span className="truncate font-bold flex-1">{entity.name}</span>
                {entity.material.textureId && <i className="fas fa-image text-[8px] text-green-500" title="Has Texture"></i>}
                {entity.scriptId && <i className="fas fa-code text-[8px] text-blue-500" title="Has Script"></i>}
                <div onClick={(e) => { e.stopPropagation(); setMenuId(menuId === entity.id ? null : entity.id); }} className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg">
                  <i className="fas fa-ellipsis-v text-[10px]"></i>
                </div>
              </button>
              
              {menuId === entity.id && (
                <div className="absolute right-2 top-10 w-40 bg-[#1c0f0f] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-3xl">
                  <button onClick={() => { onDelete(entity.id); setMenuId(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-xl uppercase">Delete</button>
                </div>
              )}
            </div>
          ))}
          {entities.length === 0 && (
              <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center px-8 opacity-50 border-2 border-dashed border-white/5 rounded-2xl m-4">
                  Drag assets here to instantiate
              </div>
          )}
        </div>

        <div className="p-4 grid grid-cols-2 gap-2 border-t border-white/5">
          <button onClick={onExport} className="py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-all">Export</button>
          <input type="file" onChange={onImport} id="sidebar-import" className="hidden" />
          <label htmlFor="sidebar-import" className="py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase text-center cursor-pointer hover:bg-white/10 transition-all">Import</label>
        </div>
      </div>

      {/* AI GENERATION MODAL */}
      {showAiModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="w-full bg-[#1c0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><i className="fas fa-times"></i></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <i className="fas fa-magic"></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter">GenAI Asset Creator</h2>
                        <div className="text-[9px] text-gray-400 font-mono">
                            Powered by Gemini 2.5 Flash
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Prompt</label>
                        <textarea 
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder="e.g. A hyper-dimensional cube shifting through time..."
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
                        {isGenerating ? 'Generating Geometry...' : 'Generate 4D Mesh'}
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Sidebar;
