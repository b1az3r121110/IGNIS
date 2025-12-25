
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface ShaderNode {
    id: string;
    type: string;
    title: string;
    pos: { x: number, y: number };
    inputs: string[];
    outputs: string[];
    color: string;
    data?: any;
    customCode?: string; 
}

interface ShaderConnection {
    id: string;
    sourceId: string;
    sourceOut: string;
    targetId: string;
    targetIn: string;
}

interface ShaderGraphState {
    nodes: ShaderNode[];
    connections: ShaderConnection[];
}

const ShaderEditor: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<ShaderNode[]>([
    { id: 'master', type: 'Master', title: 'PBR Master', pos: { x: 600, y: 150 }, inputs: ['Albedo', 'Normal', 'Metallic', 'Roughness', 'Emission', 'AO'], outputs: [], color: 'bg-indigo-600' },
    { id: 'uv', type: 'Input', title: 'UV Coordinate', pos: { x: 50, y: 100 }, inputs: [], outputs: ['UV'], color: 'bg-red-600' },
    { id: 'tex1', type: 'Texture', title: 'Sample Texture', pos: { x: 250, y: 100 }, inputs: ['UV'], outputs: ['RGBA', 'R', 'G', 'B', 'A'], color: 'bg-orange-600' },
  ]);
  
  const [connections, setConnections] = useState<ShaderConnection[]>([
      { id: 'c1', sourceId: 'uv', sourceOut: 'UV', targetId: 'tex1', targetIn: 'UV' },
      { id: 'c2', sourceId: 'tex1', sourceOut: 'RGBA', targetId: 'master', targetIn: 'Albedo' }
  ]);

  // --- HISTORY MANAGEMENT ---
  const [history, setHistory] = useState<ShaderGraphState[]>([{ nodes, connections }]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const pushHistory = useCallback((newNodes: ShaderNode[], newConns: ShaderConnection[]) => {
      const nextState = { nodes: [...newNodes], connections: [...newConns] };
      const newHistory = history.slice(0, historyIdx + 1);
      newHistory.push(nextState);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIdx(newHistory.length - 1);
  }, [history, historyIdx]);

  const undo = useCallback(() => {
      if (historyIdx > 0) {
          const prev = history[historyIdx - 1];
          setNodes(prev.nodes);
          setConnections(prev.connections);
          setHistoryIdx(historyIdx - 1);
      }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
      if (historyIdx < history.length - 1) {
          const next = history[historyIdx + 1];
          setNodes(next.nodes);
          setConnections(next.connections);
          setHistoryIdx(historyIdx + 1);
      }
  }, [history, historyIdx]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Canvas State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Drag Node State
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Connection Drag State
  const [dragConnection, setDragConnection] = useState<{ sourceId: string, sourceOut: string, startPos: {x:number, y:number} } | null>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 }); 
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Custom Node Creator State
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customNodeName, setCustomNodeName] = useState('');
  const [customNodeInputs, setCustomNodeInputs] = useState('');
  const [customNodeOutputs, setCustomNodeOutputs] = useState('Result');
  const [customNodeCode, setCustomNodeCode] = useState('void main() {\n  Result = A + B;\n}');
  const [customLibrary, setCustomLibrary] = useState<ShaderNode[]>([]);

  // 3D Preview (Unchanged)
  useEffect(() => {
    if (!previewRef.current) return;
    const width = previewRef.current.clientWidth;
    const height = previewRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    previewRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff5e3a,
      roughness: 0.2,
      metalness: 0.8
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 2, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const animate = () => {
      requestAnimationFrame(animate);
      sphere.rotation.y += 0.005;
      sphere.rotation.x += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (previewRef.current) previewRef.current.innerHTML = '';
    };
  }, []);

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 2) { 
          e.preventDefault();
          setIsPanning(true);
          setLastMousePos({ x: e.clientX, y: e.clientY });
      }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (isPanning) {
          const dx = e.clientX - lastMousePos.x;
          const dy = e.clientY - lastMousePos.y;
          setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          setLastMousePos({ x: e.clientX, y: e.clientY });
      }

      if (dragNodeId && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const relX = (e.clientX - rect.left) - pan.x;
          const relY = (e.clientY - rect.top) - pan.y;
          
          setNodes(prev => prev.map(n => 
              n.id === dragNodeId 
              ? { ...n, pos: { x: relX - dragOffset.x, y: relY - dragOffset.y } } 
              : n
          ));
      }
  };

  const handleGlobalMouseUp = () => {
      if (dragNodeId) {
          // Commit history on drag end
          pushHistory(nodes, connections);
      }
      setIsPanning(false);
      setDragNodeId(null);
      setDragConnection(null);
  };

  useEffect(() => {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
  }, [isPanning, dragNodeId, lastMousePos, pan, dragOffset, nodes, connections, pushHistory]);

  // --- ACTIONS ---
  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) - pan.x;
      const y = (e.clientY - rect.top) - pan.y;
      setContextMenuPos({ x, y });
      setMenuOpen(true);
  };

  const addNode = (def: any) => {
      const newNode: ShaderNode = {
          id: `node_${Date.now()}`,
          ...def,
          pos: { x: contextMenuPos.x, y: contextMenuPos.y }
      };
      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      pushHistory(newNodes, connections);
      setMenuOpen(false);
  };

  const deleteNode = (id: string) => {
      const newNodes = nodes.filter(n => n.id !== id);
      const newConns = connections.filter(c => c.sourceId !== id && c.targetId !== id);
      setNodes(newNodes);
      setConnections(newConns);
      pushHistory(newNodes, newConns);
  };

  const createCustomNode = () => {
      const inputs = customNodeInputs.split(',').map(s => s.trim()).filter(s => s);
      const outputs = customNodeOutputs.split(',').map(s => s.trim()).filter(s => s);
      const newNodeDef = {
          type: 'Custom',
          title: customNodeName || 'Custom Node',
          inputs: inputs.length > 0 ? inputs : ['A'],
          outputs: outputs.length > 0 ? outputs : ['Result'],
          color: 'bg-pink-600',
          customCode: customNodeCode
      };
      setCustomLibrary([...customLibrary, newNodeDef as any]);
      addNode(newNodeDef);
      setShowCustomCreator(false);
      setCustomNodeName(''); setCustomNodeInputs(''); setCustomNodeOutputs('Result');
  };

  // --- CONNECTIONS ---
  const getNodePinPos = (nodeId: string, pinName: string, type: 'in' | 'out') => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      const idx = type === 'in' ? node.inputs.indexOf(pinName) : node.outputs.indexOf(pinName);
      return {
          x: node.pos.x + (type === 'in' ? 0 : 208),
          y: node.pos.y + 44 + (idx * 24)
      };
  };

  const handlePinMouseDown = (e: React.MouseEvent, nodeId: string, pin: string, type: 'out') => {
      e.stopPropagation();
      const rect = containerRef.current!.getBoundingClientRect();
      setDragConnection({
          sourceId: nodeId,
          sourceOut: pin,
          startPos: { 
              x: (e.clientX - rect.left) - pan.x, 
              y: (e.clientY - rect.top) - pan.y 
          }
      });
  };

  const handlePinMouseUp = (e: React.MouseEvent, nodeId: string, pin: string, type: 'in') => {
      e.stopPropagation();
      if (dragConnection) {
          if (dragConnection.sourceId === nodeId) return; 
          let newConns = connections.filter(c => !(c.targetId === nodeId && c.targetIn === pin)); // Remove existing
          newConns.push({
              id: `con_${Date.now()}`,
              sourceId: dragConnection.sourceId,
              sourceOut: dragConnection.sourceOut,
              targetId: nodeId,
              targetIn: pin
          });
          setConnections(newConns);
          pushHistory(nodes, newConns);
          setDragConnection(null);
      }
  };

  const NODE_DEFS = [
      { type: 'Math', title: 'Add', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Math', title: 'Multiply', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Math', title: 'Subtract', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Math', title: 'Divide', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Math', title: 'Sin', inputs: ['In'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Math', title: 'Cos', inputs: ['In'], outputs: ['Out'], color: 'bg-blue-600' },
      { type: 'Vector', title: 'Dot', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-purple-600' },
      { type: 'Vector', title: 'Cross', inputs: ['A', 'B'], outputs: ['Out'], color: 'bg-purple-600' },
      { type: 'Vector', title: 'Normalize', inputs: ['In'], outputs: ['Out'], color: 'bg-purple-600' },
      { type: 'Input', title: 'Time', inputs: [], outputs: ['T'], color: 'bg-red-600' },
      { type: 'Input', title: 'UV', inputs: [], outputs: ['UV'], color: 'bg-red-600' },
      { type: 'Input', title: 'Normal', inputs: [], outputs: ['XYZ'], color: 'bg-red-600' },
      { type: 'Texture', title: 'Sample Tex', inputs: ['UV'], outputs: ['RGBA', 'R', 'G', 'B', 'A'], color: 'bg-orange-600' },
      { type: 'Texture', title: 'Noise', inputs: ['UV', 'Scale'], outputs: ['Out'], color: 'bg-orange-600' },
      { type: 'Utility', title: 'Mix', inputs: ['A', 'B', 'T'], outputs: ['Out'], color: 'bg-gray-600' },
      { type: 'Const', title: 'Float', inputs: [], outputs: ['Out'], color: 'bg-teal-600' },
      { type: 'Const', title: 'Color', inputs: [], outputs: ['RGBA'], color: 'bg-teal-600' },
  ];

  return (
    <div className="w-full h-full flex bg-[#1a1a1a] relative overflow-hidden">
      {/* TOOLBAR */}
      <div className="absolute top-4 left-4 z-50 flex bg-black/40 rounded-xl p-1 border border-white/5 backdrop-blur-md">
           <button onClick={undo} disabled={historyIdx===0} className={`px-3 py-1 rounded text-[9px] font-black uppercase ${historyIdx===0 ? 'opacity-30' : 'text-[#ff5e3a] hover:bg-white/5'}`}>Undo</button>
           <button onClick={redo} disabled={historyIdx===history.length-1} className={`px-3 py-1 rounded text-[9px] font-black uppercase ${historyIdx===history.length-1 ? 'opacity-30' : 'text-[#ff5e3a] hover:bg-white/5'}`}>Redo</button>
      </div>

      {/* Node Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#121212]"
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
      >
        {/* Grid Background with Pan */}
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ 
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
        ></div>
        
        {/* Connection Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            {dragConnection && (
                <path 
                    d={`M ${dragConnection.startPos.x} ${dragConnection.startPos.y} C ${dragConnection.startPos.x + 50} ${dragConnection.startPos.y}, ${mousePos.x - pan.x - 50} ${mousePos.y - pan.y}, ${mousePos.x - pan.x} ${mousePos.y - pan.y}`} 
                    stroke="#ff5e3a" strokeWidth="2" fill="none" strokeDasharray="5,5" 
                />
            )}
            {connections.map(c => {
                const start = getNodePinPos(c.sourceId, c.sourceOut, 'out');
                const end = getNodePinPos(c.targetId, c.targetIn, 'in');
                return <path key={c.id} d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`} stroke="#6366f1" strokeWidth="2" fill="none" className="hover:stroke-white transition-colors cursor-pointer" />;
            })}
        </svg>

        {/* Nodes Layer */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }} className="absolute inset-0 pointer-events-none">
            {nodes.map(node => (
                <div 
                    key={node.id} 
                    style={{ left: node.pos.x, top: node.pos.y }} 
                    className="absolute w-52 bg-[#1e1e1e] rounded-lg border border-white/10 shadow-2xl flex flex-col z-10 pointer-events-auto group"
                >
                    {/* Header / Drag Handle */}
                    <div 
                        className={`h-8 ${node.color} rounded-t-lg flex items-center px-3 justify-between cursor-move`}
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Stop canvas panning
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            // Offset relative to the NODE's top-left
                            setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                            setDragNodeId(node.id);
                        }}
                    >
                        <span className="text-[10px] font-black uppercase text-white tracking-widest truncate max-w-[120px]">{node.title}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} 
                            className="text-white/50 hover:text-white"
                        ><i className="fas fa-times text-[10px]"></i></button>
                    </div>
                    
                    {/* Body */}
                    <div className="p-2 space-y-1 bg-[#1e1e1e]/90 backdrop-blur-sm">
                        <div className="flex justify-between">
                            {/* Inputs */}
                            <div className="space-y-2 py-1">
                                {node.inputs.map(i => (
                                    <div key={i} className="flex items-center gap-2 group/pin">
                                        <div 
                                            className="w-3 h-3 rounded-full border border-gray-500 bg-[#121212] group-hover/pin:border-white transition-colors cursor-pointer"
                                            onMouseUp={(e) => handlePinMouseUp(e, node.id, i, 'in')}
                                        ></div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{i}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Outputs */}
                            <div className="space-y-2 py-1 text-right">
                                {node.outputs.map(o => (
                                    <div key={o} className="flex items-center gap-2 justify-end group/pin">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{o}</span>
                                        <div 
                                            className="w-3 h-3 rounded-full bg-gray-500 group-hover/pin:bg-white transition-colors cursor-pointer"
                                            onMouseDown={(e) => handlePinMouseDown(e, node.id, o, 'out')}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Add Node Menu */}
        {menuOpen && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto" onClick={() => setMenuOpen(false)}>
                <div className="bg-[#1c0f0f] border border-white/10 rounded-2xl w-96 max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Add Node</h3>
                        <button onClick={() => setShowCustomCreator(true)} className="text-[9px] font-black uppercase text-[#ff5e3a] hover:text-white">+ Custom Node</button>
                    </div>
                    
                    {showCustomCreator ? (
                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 uppercase font-bold">Node Name</label>
                                <input value={customNodeName} onChange={e => setCustomNodeName(e.target.value)} placeholder="My Node" className="w-full bg-black/40 border border-white/10 p-2 text-xs text-white rounded outline-none focus:border-[#ff5e3a]"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">Inputs</label>
                                    <input value={customNodeInputs} onChange={e => setCustomNodeInputs(e.target.value)} placeholder="A, B" className="w-full bg-black/40 border border-white/10 p-2 text-xs text-white rounded outline-none focus:border-[#ff5e3a]"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">Outputs</label>
                                    <input value={customNodeOutputs} onChange={e => setCustomNodeOutputs(e.target.value)} placeholder="Result" className="w-full bg-black/40 border border-white/10 p-2 text-xs text-white rounded outline-none focus:border-[#ff5e3a]"/>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 uppercase font-bold">GLSL Code</label>
                                <textarea value={customNodeCode} onChange={e => setCustomNodeCode(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 p-2 text-xs font-mono text-green-400 rounded outline-none resize-none" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowCustomCreator(false)} className="flex-1 text-gray-500 py-2 text-[10px] font-bold uppercase hover:bg-white/5 rounded">Cancel</button>
                                <button onClick={createCustomNode} className="flex-1 bg-[#ff5e3a] text-white py-2 rounded text-xs font-black uppercase hover:bg-[#ff9d5c]">Create</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {customLibrary.length > 0 && (
                                <div className="mb-2">
                                    <div className="text-[9px] font-bold text-[#ff5e3a] px-2 mb-1 uppercase">User Library</div>
                                    {customLibrary.map((n, i) => (
                                        <button key={i} onClick={() => addNode(n)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${n.color}`}></div>
                                            {n.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {['Input', 'Math', 'Vector', 'Texture', 'Utility', 'Const', 'Master'].map(cat => (
                                <div key={cat} className="mb-2">
                                    <div className="text-[9px] font-bold text-gray-500 px-2 mb-1 uppercase">{cat}</div>
                                    {NODE_DEFS.filter(n => n.type === cat).map(n => (
                                        <button 
                                            key={n.title} 
                                            onClick={() => addNode(n)}
                                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg flex items-center gap-2 group"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${n.color}`}></div>
                                            {n.title}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="w-80 border-l border-white/5 bg-[#151515] flex flex-col z-20 shadow-xl">
        <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff9d5c]">Shader Preview</span>
          <button className="text-xs hover:text-white text-gray-500"><i className="fas fa-cube"></i></button>
        </div>
        <div ref={previewRef} className="h-64 bg-black/40 relative border-b border-white/5">
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-500">256x256</div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
            <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-3">Settings</h4>
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Time Scale</label>
                    <input type="range" className="w-full accent-[#ff5e3a] h-1 bg-white/10 rounded-full" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Preview Mesh</label>
                    <div className="grid grid-cols-4 gap-1">
                        {['sphere', 'cube', 'plane', 'torus'].map(s => (
                            <button key={s} className="bg-white/5 hover:bg-[#ff5e3a] text-gray-400 hover:text-white p-2 rounded text-[10px] uppercase">
                                <i className={`fas fa-${s === 'sphere' ? 'circle' : s === 'cube' ? 'cube' : s === 'plane' ? 'square' : 'ring'}`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-6 p-3 bg-black/40 rounded border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono text-green-500">GLSL SOURCE</span>
                    <button className="text-[8px] text-gray-500 hover:text-white uppercase">Copy</button>
                </div>
                <div className="text-[8px] font-mono text-gray-500 whitespace-pre-wrap leading-tight">
                    {`#version 300 es
precision highp float;
uniform float uTime;
in vec2 vUv;
out vec4 FragColor;

void main() {
  vec3 col = vec3(0.0);
  // Node Graph Compilation...
  // ${nodes.length} Active Nodes
  FragColor = vec4(col, 1.0);
}`}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShaderEditor;
