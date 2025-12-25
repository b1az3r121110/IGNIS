
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Connection, NodeData, GraphState } from '../../types';

const ignitePack = (data: any): string => btoa(encodeURIComponent(JSON.stringify(data)));

const NODE_LIBRARY = [
  // Events
  { type: 'EVENT', category: 'Events', title: 'On Start', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec'] } },
  { type: 'EVENT', category: 'Events', title: 'On Update', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec', 'DeltaTime'] } },
  { type: 'EVENT', category: 'Events', title: 'On Collision', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec', 'OtherActor'] } },
  { type: 'EVENT', category: 'Events', title: 'On Trigger Enter', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec', 'OtherActor'] } },
  { type: 'EVENT', category: 'Events', title: 'On Trigger Exit', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec', 'OtherActor'] } },
  { type: 'EVENT', category: 'Events', title: 'On Destroy', color: 'bg-[#ff5e3a]', pins: { input: [], output: ['Exec'] } },
  { type: 'EVENT', category: 'Interaction', title: 'On Interact', color: 'bg-orange-500', pins: { input: [], output: ['Exec', 'Interactor'] } },
  { type: 'EVENT', category: 'Input', title: 'On Key Press', color: 'bg-red-500', pins: { input: ['Key'], output: ['Exec'] } },
  { type: 'EVENT', category: 'Input', title: 'On Key Release', color: 'bg-red-500', pins: { input: ['Key'], output: ['Exec'] } },
  
  // Logic
  { type: 'LOGIC', category: 'Logic', title: 'Branch', color: 'bg-indigo-600', pins: { input: ['Exec', 'Condition'], output: ['True', 'False'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Sequence', color: 'bg-indigo-600', pins: { input: ['Exec'], output: ['Then 0', 'Then 1', 'Then 2'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Delay', color: 'bg-indigo-600', pins: { input: ['Exec', 'Duration'], output: ['Completed'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Equals', color: 'bg-indigo-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Not', color: 'bg-indigo-600', pins: { input: ['In'], output: ['Out'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Greater Than', color: 'bg-indigo-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Less Than', color: 'bg-indigo-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'LOGIC', category: 'Logic', title: 'AND', color: 'bg-indigo-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'LOGIC', category: 'Logic', title: 'OR', color: 'bg-indigo-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Flip Flop', color: 'bg-indigo-600', pins: { input: ['Exec'], output: ['A', 'B'] } },
  { type: 'LOGIC', category: 'Logic', title: 'Do N', color: 'bg-indigo-600', pins: { input: ['Exec', 'N', 'Reset'], output: ['Exit'] } },
  { type: 'LOGIC', category: 'Logic', title: 'For Loop', color: 'bg-indigo-600', pins: { input: ['Exec', 'Start', 'End'], output: ['Loop', 'Completed', 'Index'] } },
  { type: 'LOGIC', category: 'Logic', title: 'While Loop', color: 'bg-indigo-600', pins: { input: ['Exec', 'Condition'], output: ['Loop', 'Completed'] } },
  
  // Inputs (Interactive)
  { type: 'INPUT_NUM', category: 'Input', title: 'Number', color: 'bg-gray-700', pins: { input: [], output: ['Value'] } },
  { type: 'INPUT_VEC3', category: 'Input', title: 'Vector3', color: 'bg-gray-700', pins: { input: [], output: ['Vec'] } },
  { type: 'INPUT_KEY', category: 'Input', title: 'Keyboard Event', color: 'bg-gray-700', pins: { input: [], output: ['Pressed', 'Released'] } },
  { type: 'INPUT_MOUSE', category: 'Input', title: 'Mouse Pos', color: 'bg-gray-700', pins: { input: [], output: ['X', 'Y'] } },
  { type: 'INPUT_AXIS', category: 'Input', title: 'Input Axis', color: 'bg-gray-700', pins: { input: ['AxisName'], output: ['Value'] } },

  // Variables & Values
  { type: 'VAR', category: 'Variables', title: 'Get Variable', color: 'bg-pink-600', pins: { input: ['Name'], output: ['Value'] } },
  { type: 'VAR', category: 'Variables', title: 'Set Variable', color: 'bg-pink-600', pins: { input: ['Exec', 'Name', 'Value'], output: ['Then'] } },
  { type: 'VAR', category: 'Variables', title: 'Random Float', color: 'bg-pink-600', pins: { input: ['Min', 'Max'], output: ['Result'] } },
  { type: 'VAR', category: 'Variables', title: 'Random Bool', color: 'bg-pink-600', pins: { input: [], output: ['Result'] } },
  { type: 'VAR', category: 'Variables', title: 'String', color: 'bg-pink-600', pins: { input: [], output: ['Value'] } },

  // Level Management
  { type: 'LEVEL', category: 'Game', title: 'Load Level', color: 'bg-purple-600', pins: { input: ['Exec', 'LevelName'], output: ['Then'] } },
  { type: 'LEVEL', category: 'Game', title: 'Get Current Level', color: 'bg-purple-600', pins: { input: [], output: ['Name'] } },
  { type: 'LEVEL', category: 'Game', title: 'Spawn Entity', color: 'bg-purple-600', pins: { input: ['Exec', 'Class', 'Transform'], output: ['Then', 'Entity'] } },
  { type: 'LEVEL', category: 'Game', title: 'Destroy Entity', color: 'bg-purple-600', pins: { input: ['Exec', 'Entity'], output: ['Then'] } },
  { type: 'LEVEL', category: 'Game', title: 'Get Player', color: 'bg-purple-600', pins: { input: [], output: ['Entity'] } },

  // Math
  { type: 'MATH', category: 'Math', title: 'Add', color: 'bg-emerald-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Subtract', color: 'bg-emerald-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Multiply', color: 'bg-emerald-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Divide', color: 'bg-emerald-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Sin', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Cos', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Tan', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Abs', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Floor', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Ceil', color: 'bg-emerald-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Lerp', color: 'bg-emerald-600', pins: { input: ['A', 'B', 'Alpha'], output: ['Result'] } },
  { type: 'MATH', category: 'Math', title: 'Clamp', color: 'bg-emerald-600', pins: { input: ['Val', 'Min', 'Max'], output: ['Result'] } },
  
  // Vector Math
  { type: 'MATH_VEC', category: 'Vector', title: 'Vector Add', color: 'bg-teal-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Vector Mult', color: 'bg-teal-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Dot Product', color: 'bg-teal-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Cross Product', color: 'bg-teal-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Normalize', color: 'bg-teal-600', pins: { input: ['In'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Distance', color: 'bg-teal-600', pins: { input: ['A', 'B'], output: ['Result'] } },
  { type: 'MATH_VEC', category: 'Vector', title: 'Look At', color: 'bg-teal-600', pins: { input: ['From', 'To'], output: ['Rotation'] } },
  
  // Physics
  { type: 'FLINT', category: 'Physics', title: 'Add Force', color: 'bg-amber-600', pins: { input: ['Exec', 'Vector', 'Local'], output: ['Then'] } },
  { type: 'FLINT', category: 'Physics', title: 'Add Torque', color: 'bg-amber-600', pins: { input: ['Exec', 'Vector'], output: ['Then'] } },
  { type: 'FLINT', category: 'Physics', title: 'Apply Impulse', color: 'bg-amber-600', pins: { input: ['Exec', 'Vector'], output: ['Then'] } },
  { type: 'FLINT', category: 'Physics', title: 'Set Velocity', color: 'bg-amber-600', pins: { input: ['Exec', 'Vector'], output: ['Then'] } },
  { type: 'FLINT', category: 'Physics', title: 'Get Velocity', color: 'bg-amber-600', pins: { input: ['Entity'], output: ['Vector'] } },
  { type: 'FLINT', category: 'Physics', title: 'Raycast', color: 'bg-amber-600', pins: { input: ['Exec', 'Start', 'Dir', 'Dist'], output: ['Hit', 'Entity', 'Pos'] } },
  { type: 'FLINT', category: 'Physics', title: 'Sphere Cast', color: 'bg-amber-600', pins: { input: ['Exec', 'Start', 'Dir', 'Radius'], output: ['Hit', 'Entity'] } },

  // Time
  { type: 'TIME', category: 'Time', title: 'Get Time', color: 'bg-cyan-600', pins: { input: [], output: ['Seconds'] } },
  { type: 'TIME', category: 'Time', title: 'Get Delta Time', color: 'bg-cyan-600', pins: { input: [], output: ['Seconds'] } },
  { type: 'TIME', category: 'Time', title: 'Time Scale', color: 'bg-cyan-600', pins: { input: ['Exec', 'Scale'], output: ['Then'] } },
  
  // Audio
  { type: 'AUDIO', category: 'Audio', title: 'Play Sound', color: 'bg-rose-500', pins: { input: ['Exec', 'Clip', 'Pos'], output: ['Then'] } },
  { type: 'AUDIO', category: 'Audio', title: 'Stop Sound', color: 'bg-rose-500', pins: { input: ['Exec', 'SoundID'], output: ['Then'] } },
  { type: 'AUDIO', category: 'Audio', title: 'Set Volume', color: 'bg-rose-500', pins: { input: ['Exec', 'Level'], output: ['Then'] } },

  // GUI
  { type: 'GUI', category: 'User Interface', title: 'Create Canvas', color: 'bg-blue-500', pins: { input: ['Exec', 'ID'], output: ['Then'] } },
  { type: 'GUI', category: 'User Interface', title: 'Add Button', color: 'bg-blue-500', pins: { input: ['Exec', 'CanvasID', 'Text', 'Pos'], output: ['Then', 'OnClicked'] } },
  { type: 'GUI', category: 'User Interface', title: 'Add Text', color: 'bg-blue-500', pins: { input: ['Exec', 'CanvasID', 'Text', 'Pos'], output: ['Then'] } },
  { type: 'GUI', category: 'User Interface', title: 'Show/Hide Mouse', color: 'bg-blue-500', pins: { input: ['Exec', 'Visible'], output: ['Then'] } },
  { type: 'GUI', category: 'User Interface', title: 'Set Cursor', color: 'bg-blue-500', pins: { input: ['Exec', 'IconName'], output: ['Then'] } },
];

const VisualScripting: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'n1', ...NODE_LIBRARY[0], pos: { x: 100, y: 100 } },
    { id: 'n2', ...NODE_LIBRARY[10], pos: { x: 400, y: 100 } }, 
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const [history, setHistory] = useState<GraphState[]>([{ nodes, connections }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const pushHistory = useCallback((newNodes: NodeData[], newConns: Connection[]) => {
    const nextState = { nodes: [...newNodes], connections: [...newConns] };
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(nextState);
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

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const [dragStart, setDragStart] = useState<{ x: number, y: number, nodeId: string, pinName: string, type: 'in' | 'out' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeNodeDrag, setActiveNodeDrag] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync Code Preview
  useEffect(() => {
      if (!showCodePreview) return;
      let code = "// Auto-generated Tendr Script\nmodule visual_script::auto\n\n";
      
      nodes.forEach(n => {
          if (n.category === 'Events') {
              code += `event ${n.title.replace(/\s/g, '_')} {\n`;
              const nextConn = connections.find(c => c.sourceNodeId === n.id && c.sourcePin === 'Exec');
              if (nextConn) {
                  const nextNode = nodes.find(no => no.id === nextConn.targetNodeId);
                  code += `    call ${nextNode?.title}(...);\n`;
              }
              code += "}\n\n";
          } else if (n.category === 'Interaction') {
              code += `event OnInteract {\n    // Interaction logic\n}\n\n`;
          }
      });
      setGeneratedCode(code);
  }, [nodes, connections, showCodePreview]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setMousePos({ x: mx, y: my });

        if (activeNodeDrag) {
          const gridSize = 20;
          let snapX = Math.round((mx - activeNodeDrag.offset.x) / gridSize) * gridSize;
          let snapY = Math.round((my - activeNodeDrag.offset.y) / gridSize) * gridSize;
          setNodes(prev => prev.map(n => n.id === activeNodeDrag.id ? { ...n, pos: { x: snapX, y: snapY } } : n));
        }
      }
    };
    const handleGlobalUp = () => {
      if (activeNodeDrag) {
        pushHistory(nodes, connections);
        setActiveNodeDrag(null);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [activeNodeDrag, nodes, connections, pushHistory]);

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
    if (!dragStart) return;
    if (dragStart.nodeId === nodeId) return;
    if (dragStart.type === type) return;

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
    pushHistory(nodes, newConns);
    setDragStart(null);
  };

  const updateNodeInput = (nodeId: string, key: string, value: any) => {
      setNodes(prev => prev.map(n => 
          n.id === nodeId 
          ? { ...n, inputs: { ...n.inputs, [key]: value } }
          : n
      ));
  };

  const addNodeToGraph = (nodeDef: typeof NODE_LIBRARY[0]) => {
    const startX = Math.round((mousePos.x - 100) / 20) * 20;
    const startY = Math.round((mousePos.y - 50) / 20) * 20;
    
    // Initialize default inputs based on type
    let defaultInputs = {};
    if (nodeDef.type === 'INPUT_NUM') defaultInputs = { value: 0 };
    if (nodeDef.type === 'INPUT_VEC3') defaultInputs = { x: 0, y: 0, z: 0 };
    if (nodeDef.type === 'INPUT_KEY') defaultInputs = { key: 'Space' };
    if (nodeDef.type === 'LEVEL') defaultInputs = { levelName: 'lvl_main' };

    const newNode: NodeData = {
      id: `n${Date.now()}`,
      ...nodeDef,
      pos: { x: startX, y: startY },
      inputs: defaultInputs
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushHistory(newNodes, connections);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const getPinPos = (nodeId: string, pinName: string, type: 'in' | 'out') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const pinIdx = type === 'in' ? node.pins.input.indexOf(pinName) : node.pins.output.indexOf(pinName);
    
    // Vertical offset calculation needs to account for input fields size in header/body
    let headerOffset = 70;
    if (node.type === 'INPUT_NUM' || node.type === 'INPUT_KEY') headerOffset += 30;
    if (node.type === 'INPUT_VEC3') headerOffset += 90;

    return { 
      x: node.pos.x + (type === 'in' ? 12 : 196), 
      y: node.pos.y + headerOffset + (pinIdx * 25) 
    };
  };

  const filteredNodes = NODE_LIBRARY.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full">
        <div 
        ref={containerRef} 
        className="flex-1 h-full bg-[#120a0a] relative overflow-hidden flex flex-col"
        onContextMenu={(e) => { e.preventDefault(); setIsSearchOpen(true); }}
        onMouseUp={() => setDragStart(null)}
        >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#4d1b1b_1.5px,transparent_1.5px)] bg-[size:20px_20px]"></div>
        
        {/* Header Toolbar */}
        <div className="h-12 border-b border-white/5 bg-black/40 flex items-center px-6 z-10 justify-between backdrop-blur-md">
            <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase text-[#ff9d5c] tracking-[0.2em]">Visual Blueprint v0.7.5</span>
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                <button disabled={historyIdx === 0} onClick={undo} className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${historyIdx === 0 ? 'opacity-20' : 'hover:bg-white/5 text-[#ff5e3a]'}`}>Undo</button>
                <button disabled={historyIdx === history.length - 1} onClick={redo} className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${historyIdx === history.length - 1 ? 'opacity-20' : 'hover:bg-white/5 text-[#ff5e3a]'}`}>Redo</button>
            </div>
            <button onClick={() => setIsSearchOpen(true)} className="px-3 py-1 bg-[#ff5e3a]/10 text-[#ff5e3a] text-[9px] font-black rounded-lg border border-[#ff5e3a]/30 uppercase hover:bg-[#ff5e3a]/20 transition-all">+ Add Node</button>
            </div>
            <div className="flex gap-2">
            <button onClick={() => setShowCodePreview(!showCodePreview)} className={`px-3 py-1 text-[9px] font-black rounded-lg border uppercase transition-all ${showCodePreview ? 'bg-[#ff5e3a] text-white border-[#ff5e3a]' : 'bg-white/5 text-gray-400 border-white/10'}`}>{showCodePreview ? 'Hide Code' : 'Show Code'}</button>
            </div>
        </div>

        {/* Node Canvas */}
        <div className="flex-1 relative overflow-auto custom-scrollbar cursor-grab active:cursor-grabbing">
            <svg className="absolute inset-0 w-full h-full pointer-events-none min-w-[5000px] min-h-[5000px]">
            {dragStart && (
                <path 
                d={`M ${dragStart.x} ${dragStart.y} C ${dragStart.x + (dragStart.type === 'out' ? 100 : -100)} ${dragStart.y}, ${mousePos.x + (dragStart.type === 'in' ? 100 : -100)} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`} 
                stroke="#ff5e3a" strokeWidth="3" fill="none" strokeDasharray="6,4" 
                />
            )}
            {connections.map(c => {
                const start = getPinPos(c.sourceNodeId, c.sourcePin, 'out');
                const end = getPinPos(c.targetNodeId, c.targetPin, 'in');
                return (
                <path key={c.id} d={`M ${start.x} ${start.y} C ${start.x + 100} ${start.y}, ${end.x - 100} ${end.y}, ${end.x} ${end.y}`} stroke="#ff5e3a" strokeWidth="2.5" fill="none" opacity="0.7" className="hover:opacity-100 transition-opacity"/>
                );
            })}
            </svg>

            {nodes.map(node => (
            <div 
                key={node.id} 
                style={{ left: node.pos.x, top: node.pos.y }} 
                className="absolute w-56 bg-[#1c0f0f] rounded-2xl shadow-2xl border border-white/5 overflow-hidden group select-none transition-shadow hover:shadow-[#ff5e3a]/20 hover:border-[#ff5e3a]/40"
            >
                <div 
                className={`h-2 ${node.color} cursor-move relative`} 
                onMouseDown={(e) => {
                    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                    setActiveNodeDrag({ id: node.id, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
                }}
                ></div>
                <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{node.category}</span>
                    <button onClick={() => {
                        const newNodes = nodes.filter(n => n.id !== node.id);
                        const newConns = connections.filter(c => c.sourceNodeId !== node.id && c.targetNodeId !== node.id);
                        setNodes(newNodes);
                        setConnections(newConns);
                        pushHistory(newNodes, newConns);
                    }} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-times text-[10px]"></i></button>
                </div>
                <h4 className="text-[11px] font-black text-white mb-4 uppercase tracking-tight cursor-move" onMouseDown={(e) => {
                        const rect = e.currentTarget.closest('.absolute')!.getBoundingClientRect();
                        setActiveNodeDrag({ id: node.id, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
                    }}>{node.title}</h4>

                {/* --- INTERACTIVE INPUTS --- */}
                {node.type === 'INPUT_NUM' && (
                    <div className="mb-4">
                        <input type="number" value={node.inputs?.value || 0} onChange={(e) => updateNodeInput(node.id, 'value', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#ff5e3a]"/>
                    </div>
                )}
                {node.type === 'INPUT_KEY' && (
                    <div className="mb-4">
                        <select value={node.inputs?.key || 'Space'} onChange={(e) => updateNodeInput(node.id, 'key', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#ff5e3a]">
                            {['Space', 'Enter', 'Escape', 'W', 'A', 'S', 'D', 'Shift'].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                )}
                 {node.type === 'INPUT_VEC3' && (
                    <div className="mb-4 space-y-1">
                        <div className="flex items-center gap-1"><span className="text-[9px] text-red-500 w-3">X</span><input type="number" value={node.inputs?.x || 0} onChange={(e) => updateNodeInput(node.id, 'x', parseFloat(e.target.value))} className="flex-1 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"/></div>
                        <div className="flex items-center gap-1"><span className="text-[9px] text-green-500 w-3">Y</span><input type="number" value={node.inputs?.y || 0} onChange={(e) => updateNodeInput(node.id, 'y', parseFloat(e.target.value))} className="flex-1 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"/></div>
                        <div className="flex items-center gap-1"><span className="text-[9px] text-blue-500 w-3">Z</span><input type="number" value={node.inputs?.z || 0} onChange={(e) => updateNodeInput(node.id, 'z', parseFloat(e.target.value))} className="flex-1 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"/></div>
                    </div>
                )}
                {node.type === 'LEVEL' && (
                     <div className="mb-4">
                        <input type="text" placeholder="Level ID" value={node.inputs?.levelName || ''} onChange={(e) => updateNodeInput(node.id, 'levelName', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#ff5e3a]"/>
                    </div>
                )}

                <div className="flex justify-between gap-6">
                    <div className="flex flex-col gap-4">
                    {node.pins.input.map(pin => (
                        <div key={pin} className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase relative group/pin">
                        <div onMouseDown={(e) => onPinMouseDown(e, node.id, pin, 'in')} onMouseUp={(e) => onPinMouseUp(e, node.id, pin, 'in')} className="w-4 h-4 rounded-full border-2 border-white/10 hover:bg-white/30 cursor-pointer"></div>
                        <span>{pin}</span>
                        </div>
                    ))}
                    </div>
                    <div className="flex flex-col gap-4 items-end text-right">
                    {node.pins.output.map(pin => (
                        <div key={pin} className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase relative group/pin">
                        <span>{pin}</span>
                        <div onMouseDown={(e) => onPinMouseDown(e, node.id, pin, 'out')} onMouseUp={(e) => onPinMouseUp(e, node.id, pin, 'out')} className="w-4 h-4 rounded-full bg-white/10 hover:bg-[#ff5e3a] cursor-pointer"></div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>

        {/* Node Search */}
        {isSearchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8" onClick={() => setIsSearchOpen(false)}>
            <div className="w-full max-w-xl bg-[#1c0f0f] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <input autoFocus placeholder="Search nodes..." className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#ff5e3a] outline-none mb-6" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 gap-2">
                {filteredNodes.map((n, idx) => (
                    <button key={`${n.title}-${idx}`} onClick={() => addNodeToGraph(n)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff5e3a]/50 hover:bg-white/10 transition-all text-left">
                    <div className={`w-8 h-8 rounded-lg ${n.color} flex items-center justify-center`}><i className="fas fa-microchip text-white text-[10px]"></i></div>
                    <div><span className="block text-[7px] font-black text-white/30 uppercase">{n.category}</span><span className="block text-[10px] font-bold text-gray-300 uppercase">{n.title}</span></div>
                    </button>
                ))}
                </div>
            </div>
            </div>
        )}
        </div>
        
        {showCodePreview && (
            <div className="w-96 border-l border-white/5 bg-[#0f0a0a] flex flex-col animate-in slide-in-from-right-10 duration-200">
                <div className="h-12 border-b border-white/5 flex items-center px-4 bg-black/20"><span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Live Code Sync</span></div>
                <div className="flex-1 relative"><textarea readOnly value={generatedCode} className="absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-xs text-blue-400 resize-none outline-none"/></div>
            </div>
        )}
    </div>
  );
};

export default VisualScripting;
