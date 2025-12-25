
import React, { useState, useRef, useEffect } from 'react';
import { NodeData, Connection } from '../../types';

const AI_NODES = [
    // FLOW
    { type: 'COMPOSITE', category: 'Flow', title: 'Selector', color: 'bg-purple-600', pins: { input: ['In'], output: ['Child 1', 'Child 2', 'Child 3'] } },
    { type: 'COMPOSITE', category: 'Flow', title: 'Sequence', color: 'bg-purple-600', pins: { input: ['In'], output: ['Step 1', 'Step 2', 'Step 3'] } },
    { type: 'COMPOSITE', category: 'Flow', title: 'Parallel', color: 'bg-purple-600', pins: { input: ['In'], output: ['Task A', 'Task B'] } },
    
    // DECORATORS
    { type: 'DECORATOR', category: 'Logic', title: 'Inverter', color: 'bg-blue-600', pins: { input: ['In'], output: ['Out'] } },
    { type: 'DECORATOR', category: 'Logic', title: 'Succeeder', color: 'bg-blue-600', pins: { input: ['In'], output: ['Out'] } },
    { type: 'DECORATOR', category: 'Logic', title: 'Repeater', color: 'bg-blue-600', pins: { input: ['In'], output: ['Out'] }, inputs: { count: 3 } },
    { type: 'DECORATOR', category: 'Logic', title: 'Cooldown', color: 'bg-blue-600', pins: { input: ['In'], output: ['Out'] }, inputs: { time: 5.0 } },
    
    // ACTIONS
    { type: 'TASK', category: 'Action', title: 'Move To', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { target: 'Player' } },
    { type: 'TASK', category: 'Action', title: 'Attack', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { damage: 10 } },
    { type: 'TASK', category: 'Action', title: 'Wait', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { duration: 1.0 } },
    { type: 'TASK', category: 'Action', title: 'Patrol', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { radius: 10 } },
    { type: 'TASK', category: 'Action', title: 'Flee', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { distance: 15 } },
    { type: 'TASK', category: 'Action', title: 'Take Cover', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { strategy: 'Flank' } },
    { type: 'TASK', category: 'Action', title: 'Call Squad', color: 'bg-red-600', pins: { input: ['Exec'], output: [] }, inputs: { range: 50 } },
    
    // ANIMATION
    { type: 'TASK', category: 'Animation', title: 'Play Anim', color: 'bg-orange-600', pins: { input: ['Exec'], output: [] }, inputs: { clip: 'Idle' } },
    { type: 'TASK', category: 'Animation', title: 'Set Stance', color: 'bg-orange-600', pins: { input: ['Exec'], output: [] }, inputs: { stance: 'Crouch' } },
    
    // SENSING
    { type: 'CONDITION', category: 'Sense', title: 'Can See Player?', color: 'bg-green-600', pins: { input: ['Check'], output: ['Yes', 'No'] } },
    { type: 'CONDITION', category: 'Sense', title: 'Health < 50%', color: 'bg-green-600', pins: { input: ['Check'], output: ['True', 'False'] } },
    { type: 'CONDITION', category: 'Sense', title: 'Heard Sound?', color: 'bg-green-600', pins: { input: ['Check'], output: ['Yes', 'No'] } },
    { type: 'CONDITION', category: 'Sense', title: 'Squad Alive?', color: 'bg-green-600', pins: { input: ['Check'], output: ['Yes', 'No'] } },
];

const AIArchitect: React.FC = () => {
    const [nodes, setNodes] = useState<NodeData[]>([
        { id: 'root', type: 'ROOT', category: 'Root', title: 'AI Root', pos: { x: 50, y: 300 }, color: 'bg-gray-700', pins: { input: [], output: ['Start'] } }
    ]);
    const [connections, setConnections] = useState<Connection[]>([]);
    
    // Canvas State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragNodeId, setDragNodeId] = useState<string | null>(null);
    
    // Connection Drag
    const [dragStart, setDragStart] = useState<{ x: number, y: number, nodeId: string, pinName: string, type: 'in' | 'out' } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
        // Close menu if clicking elsewhere
        if (isMenuOpen) setIsMenuOpen(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setMousePos({ x: mx, y: my });

        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
        if (dragNodeId) {
            const x = mx - pan.x - 100; 
            const y = my - pan.y - 20;
            setNodes(prev => prev.map(n => n.id === dragNodeId ? { ...n, pos: { x, y } } : n));
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setDragNodeId(null);
        setDragStart(null);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = containerRef.current!.getBoundingClientRect();
        setMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setIsMenuOpen(true);
    };

    const addNode = (def: typeof AI_NODES[0]) => {
        const newNode: NodeData = {
            id: `ai_${Date.now()}`,
            ...def,
            pos: { x: menuPos.x - pan.x, y: menuPos.y - pan.y }
        };
        setNodes([...nodes, newNode]);
        setIsMenuOpen(false);
    };

    const deleteNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
        setConnections(connections.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id));
    };

    const onPinMouseDown = (e: React.MouseEvent, nodeId: string, pinName: string, type: 'in' | 'out') => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const crect = containerRef.current!.getBoundingClientRect();
        setDragStart({ 
          x: (rect.left + rect.width / 2) - crect.left, 
          y: (rect.top + rect.height / 2) - crect.top, 
          nodeId, 
          pinName, 
          type 
        });
    };
    
    const onPinMouseUp = (e: React.MouseEvent, nodeId: string, pinName: string, type: 'in' | 'out') => {
        e.stopPropagation();
        if (!dragStart) return;
        if (dragStart.nodeId === nodeId) return; // Self connection check
        if (dragStart.type === type) return; // Input to Input check

        const source = dragStart.type === 'out' ? { nodeId: dragStart.nodeId, pinName: dragStart.pinName } : { nodeId, pinName };
        const target = dragStart.type === 'in' ? { nodeId: dragStart.nodeId, pinName: dragStart.pinName } : { nodeId, pinName };

        const newConns = [...connections, {
          id: Math.random().toString(36).substr(2, 9),
          sourceNodeId: source.nodeId,
          sourcePin: source.pinName,
          targetNodeId: target.nodeId,
          targetPin: target.pinName
        }];
        setConnections(newConns);
        setDragStart(null);
    };

    const getPinPos = (nodeId: string, pinName: string, type: 'in' | 'out') => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const pinIdx = type === 'in' ? node.pins.input.indexOf(pinName) : node.pins.output.indexOf(pinName);
        return { 
          x: node.pos.x + (type === 'in' ? 12 : 180), 
          y: node.pos.y + 45 + (pinIdx * 20)
        };
    };

    // --- RENDER ---
    return (
        <div className="w-full h-full flex bg-[#111]">
            {/* Sidebar / Properties */}
            <div className="w-64 bg-[#1a1a1a] border-r border-white/5 flex flex-col p-4">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-[#ff5e3a] uppercase tracking-tighter">AI Architect</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Behavior Tree Designer</p>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Brain Stats</h3>
                        <div className="text-xs text-gray-300 space-y-1">
                            <div className="flex justify-between"><span>Nodes:</span> <span>{nodes.length}</span></div>
                            <div className="flex justify-between"><span>Connections:</span> <span>{connections.length}</span></div>
                            <div className="flex justify-between"><span>Complexity:</span> <span className="text-green-500">Medium</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-[#161616] cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                {/* Background Grid */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none" 
                    style={{ 
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                        backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }}
                ></div>

                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
                    {dragStart && (
                        <path 
                        d={`M ${dragStart.x - pan.x} ${dragStart.y - pan.y} C ${dragStart.x - pan.x + 50} ${dragStart.y - pan.y}, ${mousePos.x - pan.x - 50} ${mousePos.y - pan.y}, ${mousePos.x - pan.x} ${mousePos.y - pan.y}`} 
                        stroke="#ff5e3a" strokeWidth="2" fill="none" strokeDasharray="5,5" 
                        />
                    )}
                    {connections.map(c => {
                        const start = getPinPos(c.sourceNodeId, c.sourcePin, 'out');
                        const end = getPinPos(c.targetNodeId, c.targetPin, 'in');
                        return (
                            <path key={c.id} d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`} stroke="#6366f1" strokeWidth="2" fill="none" />
                        );
                    })}
                </svg>

                {/* Nodes */}
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }} className="absolute inset-0 pointer-events-none">
                    {nodes.map(node => (
                        <div 
                            key={node.id}
                            style={{ left: node.pos.x, top: node.pos.y }}
                            className="absolute w-48 bg-[#222] rounded-lg border border-white/10 shadow-xl pointer-events-auto flex flex-col group"
                        >
                            <div 
                                className={`h-6 ${node.color} rounded-t-lg flex items-center justify-between px-2 cursor-grab active:cursor-grabbing`}
                                onMouseDown={(e) => { e.stopPropagation(); setDragNodeId(node.id); }}
                            >
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">{node.type}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="text-white/50 hover:text-white"><i className="fas fa-times text-[10px]"></i></button>
                            </div>
                            <div className="p-2 space-y-2">
                                <div className="text-xs font-bold text-gray-200">{node.title}</div>
                                {node.inputs && Object.entries(node.inputs).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center bg-black/30 p-1 rounded">
                                        <span className="text-[9px] text-gray-500 uppercase">{k}</span>
                                        <span className="text-[9px] text-[#ff9d5c]">{v}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-1">
                                    <div className="flex flex-col gap-1">
                                        {node.pins.input.map(p => (
                                            <div key={p} className="flex items-center gap-1">
                                                <div 
                                                    className="w-3 h-3 rounded-full bg-gray-600 hover:bg-white border border-black cursor-pointer"
                                                    onMouseDown={(e) => onPinMouseDown(e, node.id, p, 'in')}
                                                    onMouseUp={(e) => onPinMouseUp(e, node.id, p, 'in')}
                                                ></div>
                                                <span className="text-[8px] text-gray-400">{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        {node.pins.output.map(p => (
                                            <div key={p} className="flex items-center gap-1">
                                                <span className="text-[8px] text-gray-400">{p}</span>
                                                <div 
                                                    className="w-3 h-3 rounded-full bg-white hover:bg-[#ff5e3a] border border-black cursor-pointer"
                                                    onMouseDown={(e) => onPinMouseDown(e, node.id, p, 'out')}
                                                    onMouseUp={(e) => onPinMouseUp(e, node.id, p, 'out')}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Context Menu */}
                {isMenuOpen && (
                    <div 
                        className="absolute bg-[#1c0f0f] border border-white/10 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 w-48 animate-in zoom-in-95 duration-75 max-h-96 overflow-y-auto custom-scrollbar"
                        style={{ left: menuPos.x, top: menuPos.y }}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking menu
                    >
                        <div className="text-[9px] font-black text-gray-500 px-2 py-1 uppercase sticky top-0 bg-[#1c0f0f]">Add Node</div>
                        {AI_NODES.map((n, i) => (
                            <button 
                                key={i} 
                                onClick={() => addNode(n)}
                                className="text-left px-2 py-1.5 text-[10px] text-gray-300 hover:bg-white/10 rounded font-bold flex items-center gap-2"
                            >
                                <div className={`w-2 h-2 rounded-full ${n.color}`}></div>
                                <span><span className="opacity-50 mr-1">[{n.category}]</span> {n.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIArchitect;
