
import React, { useState } from 'react';
import { Extension } from '../../types';

interface ExtensionManagerProps {
  onToggleJs: () => void;
  jsEnabled: boolean;
}

const ExtensionManager: React.FC<ExtensionManagerProps> = ({ onToggleJs, jsEnabled }) => {
  const [activeTab, setActiveTab] = useState<'INSTALLED' | 'CREATOR'>('INSTALLED');
  
  // Extension Creator State
  const [extName, setExtName] = useState('');
  const [extType, setExtType] = useState('NODE_PACK');
  const [extDesc, setExtDesc] = useState('');
  const [nodes, setNodes] = useState<Array<{name: string, inputs: string, code: string}>>([]);
  
  // Simple form for adding a node to the pack
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeCode, setNewNodeCode] = useState('return A + B;');

  const addNodeToPack = () => {
      if(!newNodeName) return;
      setNodes([...nodes, { name: newNodeName, inputs: "A, B", code: newNodeCode }]);
      setNewNodeName('');
  };

  const extensions: Extension[] = [
    { id: 'js_rt', name: 'JavaScript Runtime Bridge', author: 'IgnisCore', type: 'JS_RUNTIME', enabled: jsEnabled },
    { id: 'lumina_lsp', name: 'Lumina Language Server', author: 'IgnisCore', type: 'LANGUAGE_PLUGIN', enabled: true },
    { id: 'flint_v3', name: 'Flint Physics v3 (Alpha)', author: 'FlintLabs', type: 'NODE_PACK', enabled: true },
    { id: 'tendr_ext', name: 'Tendr Standard Lib Plus', author: 'IgnisCore', type: 'LANGUAGE_PLUGIN', enabled: true },
  ];

  const handleExport = () => {
      const payload = {
          nodes: nodes.map(n => ({
              id: n.name.toLowerCase().replace(/\s/g, '_'),
              title: n.name,
              category: "Custom",
              inputs: n.inputs.split(',').map(s => ({ name: s.trim(), type: 'float' })),
              outputs: [{ name: "Result", type: "float" }],
              code: n.code
          }))
      };

      const data = {
          meta: {
              name: extName || "Untitled Pack",
              type: extType,
              description: extDesc,
              version: "1.0.0",
              engine_target: "v2.6.1.c"
          },
          payload
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(extName || "extension").toLowerCase().replace(/\s/g, '_')}.dryfuel`;
      link.click();
  };

  const generateFourDryfuel = () => {
      const fourData = {
          meta: {
              name: "four.dryfuel",
              type: "RENDER_PLUGIN",
              description: "Official 4D Rendering Pipeline Extension for Ignis Engine. Enables tesseract projection and hyper-volume slicing.",
              version: "1.0.0-rc1",
              engine_target: "v2.6.1.c"
          },
          payload: {
              shaders: {
                  vertex: "attribute vec4 position4D; void main() { ... projection logic ... }",
                  fragment: "uniform float wSlice; void main() { ... slicing logic ... }"
              },
              nodes: [
                  { id: "vec4_construct", title: "Vec4", category: "HyperMath", inputs: [{name:"x"},{name:"y"},{name:"z"},{name:"w"}], outputs: [{name:"v4"}] },
                  { id: "project_4d", title: "Project 4D", category: "HyperMath", inputs: [{name:"v4"},{name:"camW"}], outputs: [{name:"v3"}] }
              ]
          }
      };
      const blob = new Blob([JSON.stringify(fourData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "four.dryfuel";
      link.click();
  };

  return (
    <div className="w-full h-full bg-[#0f0a0a] flex flex-col">
       {/* Tabs */}
       <div className="flex border-b border-white/5 bg-[#1a0f0f] px-8">
           <button 
              onClick={() => setActiveTab('INSTALLED')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'INSTALLED' ? 'border-[#ff5e3a] text-[#ff5e3a]' : 'border-transparent text-gray-500 hover:text-white'}`}
           >
               Installed Plugins
           </button>
           <button 
              onClick={() => setActiveTab('CREATOR')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'CREATOR' ? 'border-[#ff5e3a] text-[#ff5e3a]' : 'border-transparent text-gray-500 hover:text-white'}`}
           >
               Visual Extension Builder
           </button>
       </div>

       {activeTab === 'INSTALLED' ? (
        <div className="flex-1 p-12 overflow-y-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                <h1 className="text-3xl font-black text-[#ff9d5c]">Plugin Registry</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Inject low-level runtimes and node packs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {extensions.map(ext => (
                <div key={ext.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i className={`fas ${ext.type === 'JS_RUNTIME' ? 'fa-terminal' : 'fa-cubes'} text-[#ff9d5c]`}></i>
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-widest bg-[#ff5e3a]/20 text-[#ff5e3a] px-2 py-1 rounded-full">{ext.type}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{ext.name}</h3>
                    <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-tighter">by {ext.author}</p>
                    
                    <button 
                    onClick={() => ext.id === 'js_rt' && onToggleJs()}
                    className={`w-full py-3 rounded-xl text-[10px] font-black transition-all uppercase border ${
                        ext.enabled ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                    >
                    {ext.enabled ? 'Plugin Enabled' : 'Enable Plugin'}
                    </button>
                </div>
                ))}
            </div>
        </div>
       ) : (
        <div className="flex-1 p-8 flex gap-8 overflow-hidden">
            {/* Visual Builder Form */}
            <div className="w-1/2 bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                <div className="flex items-center gap-3 text-[#ff5e3a] mb-2">
                    <i className="fas fa-hammer text-2xl"></i>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Visual Builder</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Extension Name</label>
                        <input value={extName} onChange={e => setExtName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#ff5e3a] outline-none" placeholder="My Awesome Pack" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Type</label>
                        <select value={extType} onChange={e => setExtType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#ff5e3a] outline-none">
                            <option value="NODE_PACK">Node Pack</option>
                            <option value="LANGUAGE_PLUGIN">Language Plugin</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Description</label>
                    <textarea value={extDesc} onChange={e => setExtDesc(e.target.value)} className="w-full h-16 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#ff5e3a] outline-none resize-none" placeholder="What does it do?" />
                </div>

                <div className="border-t border-white/5 pt-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4">Add Custom Node</h3>
                    <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
                        <input value={newNodeName} onChange={e => setNewNodeName(e.target.value)} placeholder="Node Name (e.g. Super Math)" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"/>
                        <textarea value={newNodeCode} onChange={e => setNewNodeCode(e.target.value)} placeholder="JS/Tendr Implementation code..." className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-green-400"/>
                        <button onClick={addNodeToPack} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase">+ Add Node to Pack</button>
                    </div>
                    
                    <div className="mt-4 space-y-1">
                        {nodes.map((n, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-black/40 rounded border border-white/5">
                                <span className="text-xs font-bold">{n.name}</span>
                                <span className="text-[9px] text-gray-500">custom node</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1"></div>

                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex-1 py-4 bg-[#ff5e3a] hover:bg-[#ff9d5c] text-white rounded-xl font-black text-sm uppercase transition-all shadow-lg">
                        Build .dryfuel
                    </button>
                    <button onClick={generateFourDryfuel} className="px-4 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase transition-all shadow-lg" title="Generate 4D Render Plugin">
                        Gen 4D Plugin
                    </button>
                </div>
            </div>

            {/* Docs Panel */}
            <div className="flex-1 bg-[#1a1a1a] rounded-3xl border border-white/5 p-8 overflow-y-auto custom-scrollbar">
                 <h2 className="text-2xl font-black text-white mb-6">.dryfuel Documentation</h2>
                 <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                     The <strong>.dryfuel</strong> format is a JSON-based container for distributing Ignis Engine extensions. It allows developers to bundle custom visual nodes, syntax definitions, and themes into a single file.
                 </p>

                 <div className="space-y-8">
                     <div>
                         <h3 className="text-[#ff9d5c] font-bold uppercase text-xs tracking-widest mb-3">File Structure</h3>
                         <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                            <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`{
  "meta": {
    "name": "My Pack",
    "type": "NODE_PACK",
    "version": "1.0.0",
    "engine_target": "v2.6.x"
  },
  "payload": {
    "nodes": [ ... ],
    "themes": { ... }
  }
}`}
                            </pre>
                         </div>
                     </div>

                     <div>
                         <h3 className="text-[#ff9d5c] font-bold uppercase text-xs tracking-widest mb-3">Node Definition</h3>
                         <p className="text-gray-500 text-xs mb-3">Nodes are the building blocks of Visual Scripting. Each node requires a unique ID, input/output pins, and execution code.</p>
                         <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`{
  "id": "math_fast_sin",
  "title": "Fast Sin",
  "category": "Math",
  "inputs": [
    { "name": "In", "type": "float" }
  ],
  "outputs": [
    { "name": "Out", "type": "float" }
  ],
  "code": "return Math.sin(In);" 
}`}
                            </pre>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
       )}
    </div>
  );
};

export default ExtensionManager;
