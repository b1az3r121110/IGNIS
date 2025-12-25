
import React, { useRef, useState } from 'react';
import { Asset } from '../../types';

interface AssetBrowserProps {
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    onCreateScript: (name: string, type: 'tendr' | 'javascript') => void;
    onLoadLevel?: (id: string) => void;
    onCreateLevel?: (name: string) => void;
}

const AssetBrowser: React.FC<AssetBrowserProps> = ({ assets, setAssets, onCreateScript, onLoadLevel, onCreateLevel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAssets: Asset[] = Array.from(files).map(file => {
      let type: Asset['type'] = 'MESH';
      let icon = 'fa-file';
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'png', 'tga', 'dds'].includes(ext || '')) {
        type = 'TEXTURE';
        icon = 'fa-image';
      } else if (['obj', 'fbx', 'glb', 'gltf'].includes(ext || '')) {
        type = 'MESH';
        icon = 'fa-cube';
      } else if (['js', 'ts', 'lum', 'cs', 'tdr'].includes(ext || '')) {
        type = 'SCRIPT';
        icon = 'fa-code';
      } else if (['glsl', 'hlsl'].includes(ext || '')) {
        type = 'SHADER';
        icon = 'fa-fire';
      } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext || '')) {
        type = 'AUDIO';
        icon = 'fa-music';
      }

      return {
        id: `imported_${Date.now()}_${Math.random()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type,
        icon,
        size: `${(file.size / 1024).toFixed(1)} KB`
      };
    });

    setAssets(prev => [...prev, ...newAssets]);
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('ignis/asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (asset: Asset) => {
      if (asset.type === 'LEVEL' && onLoadLevel) {
          if (confirm(`Load level '${asset.name}'? Unsaved changes to the current level will be lost.`)) {
            onLoadLevel(asset.id);
          }
      }
  };

  return (
    <div className="w-full h-full bg-[#121212] p-8 flex flex-col relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset Browser</h2>
          <p className="text-sm text-gray-500">Manage your project resources</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowLevelModal(true)}
            className="px-6 py-2 bg-[#ff5e3a]/10 border border-[#ff5e3a]/50 text-[#ff5e3a] rounded-lg text-sm font-bold hover:bg-[#ff5e3a]/30 transition-all"
          >
            + NEW LEVEL
          </button>
          <button 
            onClick={() => setShowScriptModal(true)}
            className="px-6 py-2 bg-[#ff5e3a]/20 border border-[#ff5e3a]/50 text-[#ff5e3a] rounded-lg text-sm font-bold hover:bg-[#ff5e3a]/40 transition-all"
          >
            + NEW SCRIPT
          </button>
          <input 
            type="file" 
            multiple 
            accept=".obj,.fbx,.glb,.gltf,.jpg,.png,.js,.ts,.glsl,.mp3,.wav,.ogg"
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-[#ff5e3a] text-white rounded-lg text-sm font-bold shadow-lg hover:bg-[#ff9d5c] transition-all"
          >
            IMPORT ASSET
          </button>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
            <input 
              placeholder="Search assets..." 
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#ff5e3a] w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 overflow-y-auto pb-20">
        {assets.map((asset, idx) => (
          <div 
            key={`${asset.id}-${idx}`} 
            className="group cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, asset)}
            onDoubleClick={() => handleDoubleClick(asset)}
          >
            <div className="aspect-square bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center mb-3 group-hover:border-[#ff5e3a]/50 transition-all group-hover:bg-white/10 shadow-xl overflow-hidden relative">
              <i className={`fas ${asset.icon} text-4xl text-gray-600 group-hover:text-[#ff9d5c] group-hover:scale-110 transition-all`}></i>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-[8px] font-bold text-gray-400">
                {asset.type}
              </div>
              {asset.type === 'LEVEL' && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-[8px] font-bold uppercase border border-green-500/30">
                      Playable
                  </div>
              )}
            </div>
            <h3 className="text-xs font-bold text-gray-300 truncate">{asset.name}</h3>
            <p className="text-[10px] text-gray-600">{asset.size}</p>
          </div>
        ))}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center hover:border-[#ff5e3a]/50 transition-all group cursor-pointer"
        >
          <i className="fas fa-plus text-gray-800 group-hover:text-[#ff5e3a]"></i>
        </div>
      </div>

      {showScriptModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-[#1c0f0f] border border-white/10 p-8 rounded-3xl w-96 shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-4">Create Script</h3>
                  <input 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="MyScript"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:border-[#ff5e3a] outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                      <button onClick={() => { onCreateScript(newItemName, 'tendr'); setShowScriptModal(false); setNewItemName(''); }} className="flex-1 py-3 bg-[#ff5e3a] text-white rounded-xl font-bold text-xs hover:bg-[#ff9d5c]">Tendr (Native)</button>
                      <button onClick={() => { onCreateScript(newItemName, 'javascript'); setShowScriptModal(false); setNewItemName(''); }} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold text-xs hover:bg-white/10">JavaScript</button>
                  </div>
                  <button onClick={() => setShowScriptModal(false)} className="w-full mt-2 py-2 text-gray-500 text-xs font-bold hover:text-white">Cancel</button>
              </div>
          </div>
      )}

      {showLevelModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-[#1c0f0f] border border-white/10 p-8 rounded-3xl w-96 shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-4">Create New Level</h3>
                  <input 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Level Name (e.g. Dungeon_01)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:border-[#ff5e3a] outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => { if(newItemName && onCreateLevel) { onCreateLevel(newItemName); setShowLevelModal(false); setNewItemName(''); }}} 
                    className="w-full py-3 bg-[#ff5e3a] text-white rounded-xl font-bold text-xs hover:bg-[#ff9d5c] mb-2"
                  >
                      Create Level
                  </button>
                  <button onClick={() => setShowLevelModal(false)} className="w-full py-2 text-gray-500 text-xs font-bold hover:text-white">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default AssetBrowser;
