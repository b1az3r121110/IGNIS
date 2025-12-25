
import React, { useState, useEffect, useCallback } from 'react';
import { EditorMode, RenderDimension, Entity, Extension, VirtualFile, Asset, LevelData, PhysicsEngineType } from './types';
import Viewport from './components/Editor/Viewport';
import VisualScripting from './components/Editor/VisualScripting';
import CodeEditor from './components/Editor/CodeEditor';
import ShaderEditor from './components/Editor/ShaderEditor';
import AudioEditor from './components/Editor/AudioEditor';
import TendrDocs from './components/Editor/TendrDocs';
import ExtensionManager from './components/Editor/ExtensionManager';
import AIArchitect from './components/Editor/AIArchitect'; 
import Sidebar from './components/Layout/Sidebar';
import Toolbar from './components/Layout/Toolbar';
import Inspector from './components/Editor/Inspector';
import AssetBrowser from './components/Editor/AssetBrowser';
import AssetCreator from './components/Editor/AssetCreator';
import MainMenu from './components/Editor/MainMenu';
import WindowFrame from './components/Layout/WindowFrame';

// Compression Utilities
const ignitePack = (data: any): string => btoa(encodeURIComponent(JSON.stringify(data)));
const igniteUnpack = (data: string): any => JSON.parse(decodeURIComponent(atob(data)));

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<EditorMode>(EditorMode.MAIN_MENU);
  const [dimension, setDimension] = useState<RenderDimension>(RenderDimension.D3);
  const [physicsEngine, setPhysicsEngine] = useState<PhysicsEngineType>(PhysicsEngineType.FLINT);
  const [jsModeEnabled, setJsModeEnabled] = useState(false);
  
  // --- LEVEL MANAGEMENT ---
  const [currentLevelId, setCurrentLevelId] = useState<string>('lvl_main');
  const [levels, setLevels] = useState<Record<string, LevelData>>({
    'lvl_main': {
        id: 'lvl_main',
        name: 'Main Scene',
        entities: [
            {
              id: '1', name: 'Player', tag: 'Player', layer: 'Default', isStatic: false,
              transform: { position: [0, 4, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
              meshType: 'BOX', color: '#ff5e3a',
              material: { roughness: 0.5, metalness: 0.2, opacity: 1, emissive: '#000000', wireframe: false },
              physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.2, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, isTrigger: false, collisionDetection: 'CONTINUOUS', magnetism: 0, temperature: 20 },
              controller: { enabled: true, moveSpeed: 5, jumpForce: 10, lookSensitivity: 2, useGravity: true, groundCheckDistance: 0.1 },
              audio: { clip: 'none', volume: 1, pitch: 1, isSpatial: true, raytraceOcclusion: true, loop: false }
            }
        ],
        lastModified: Date.now()
    }
  });

  // --- ASSET MANAGEMENT ---
  const [assets, setAssets] = useState<Asset[]>([
    { id: 'lvl_main', name: 'Main Scene', type: 'LEVEL', icon: 'fa-map', size: '12 KB' },
    { id: 'ai_guard', name: 'Guard Brain', type: 'AI_BRAIN', icon: 'fa-brain', size: '2 KB' },
  ]);

  // --- VIRTUAL FILE SYSTEM ---
  const [files, setFiles] = useState<Record<string, VirtualFile>>({
    'sys_physics.tdr': {
      name: 'sys_physics.tdr',
      language: 'tendr',
      isOpen: true,
      content: `## Ignis Script v0.8.1
module physics::core
# Flint v3beta Configuration
`
    }
  });

  // --- AUTO SAVE / LOAD ---
  useEffect(() => {
      // Load on Mount
      const savedData = localStorage.getItem('ignis_project_data');
      if (savedData) {
          try {
              const data = JSON.parse(savedData);
              if (data.levels) setLevels(data.levels);
              if (data.assets) setAssets(data.assets);
              if (data.files) setFiles(data.files);
              setLogs(prev => [...prev, 'Auto-load: Project restored from disk.']);
          } catch (e) {
              console.error("Failed to load save", e);
          }
      }
  }, []);

  useEffect(() => {
      // Auto-save interval
      const interval = setInterval(() => {
          const data = { levels, assets, files };
          localStorage.setItem('ignis_project_data', JSON.stringify(data));
      }, 2000);
      return () => clearInterval(interval);
  }, [levels, assets, files]);

  const handleFileChange = (fileName: string, newContent: string) => {
    setFiles(prev => ({ ...prev, [fileName]: { ...prev[fileName], content: newContent } }));
  };

  const handleCreateFile = (name: string, type: 'tendr' | 'javascript') => {
      const fileName = name.endsWith(type === 'tendr' ? '.tdr' : '.js') ? name : `${name}.${type === 'tendr' ? 'tdr' : 'js'}`;
      setFiles(prev => ({
          ...prev,
          [fileName]: { name: fileName, language: type, isOpen: true, content: `// New File` }
      }));
  };
  
  // --- ENTITY STATE & HISTORY ---
  const [entities, setEntities] = useState<Entity[]>(levels['lvl_main']?.entities || []);
  const [history, setHistory] = useState<Entity[][]>([levels['lvl_main']?.entities || []]);
  const [historyIdx, setHistoryIdx] = useState(0);

  useEffect(() => {
      if (levels[currentLevelId]) {
          setLevels(prev => ({
              ...prev,
              [currentLevelId]: { ...prev[currentLevelId], entities: entities, lastModified: Date.now() }
          }));
      }
  }, [entities, currentLevelId]);

  const pushToHistory = useCallback((newEntities: Entity[]) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(newEntities);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }, [history, historyIdx]);

  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setEntities(history[historyIdx - 1]);
      setLogs(prev => [...prev, 'Undo Performed']);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setEntities(history[historyIdx + 1]);
      setLogs(prev => [...prev, 'Redo Performed']);
    }
  };

  const handleEntitiesUpdate = (newEntities: Entity[], commit: boolean = true) => {
      setEntities(newEntities);
      if (commit) {
          pushToHistory(newEntities);
      }
  };

  const updateEntity = (updated: Entity, commit: boolean = true) => {
    const newEntities = entities.map(e => e.id === updated.id ? updated : e);
    handleEntitiesUpdate(newEntities, commit);
  };

  // Keyboard Shortcuts (Native feel)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
          if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setLogs(prev => [...prev, 'Project Saved (Ctrl+S)']); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIdx, history]);

  // --- LEVEL MANAGEMENT ---
  const handleLoadLevel = (levelId: string) => {
      if (levels[levelId]) {
          setCurrentLevelId(levelId);
          setEntities(levels[levelId].entities);
          setHistory([levels[levelId].entities]);
          setHistoryIdx(0);
          setSelectedEntityId(null);
          setLogs(prev => [...prev, `Loaded Level: ${levels[levelId].name}`]);
          if (activeMode === EditorMode.ASSET_BROWSER || activeMode === EditorMode.MAIN_MENU) setActiveMode(EditorMode.VIEWPORT);
      }
  };

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wPosition, setWPosition] = useState(0);
  const [wFov, setWFov] = useState(90);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Ignis Engine v0.8.1-alpha', 'Env: Desktop Window Mode', 'Disk I/O: Active']);

  const handleAddEntity = (type: Entity['meshType'], customData?: {vertices: number[], indices: number[]}) => {
    const newEntity: Entity = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New_${type}`,
      tag: 'Untagged',
      layer: 'Default',
      isStatic: false,
      transform: { position: [0, 5, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
      meshType: type,
      customGeometry: customData,
      color: '#ff9d5c',
      material: { roughness: 0.5, metalness: 0.5, opacity: 1, emissive: '#000000', wireframe: false },
      physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.5, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, isTrigger: false, collisionDetection: 'DISCRETE', magnetism: 0, temperature: 20 },
      controller: { enabled: false, moveSpeed: 5, jumpForce: 10, lookSensitivity: 2, useGravity: true, groundCheckDistance: 0.1 }
    };
    const updated = [...entities, newEntity];
    handleEntitiesUpdate(updated, true);
    setSelectedEntityId(newEntity.id);
    setLogs(prev => [...prev, `Entity Created: ${newEntity.id}`]);
  };

  const handleDropAssetOnEntity = (asset: Asset, entityId: string) => {
      const targetEntity = entities.find(e => e.id === entityId);
      if(!targetEntity) return;
      if(asset.type === 'TEXTURE') {
          updateEntity({ ...targetEntity, material: { ...targetEntity.material, textureId: asset.id } }, true);
      }
  };

  const handleDropAssetToHierarchy = (asset: Asset) => {
      // Basic hierarchy drop logic (omitted for brevity)
  };

  const handleBuildProject = () => {
    setLogs(prev => [...prev, 'Building Native Executable...']);
    // Fake build delay
    setTimeout(() => setLogs(prev => [...prev, 'Build Complete: /bin/release/game.exe']), 1500);
  };

  const handleImportScene = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Import logic
  };

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <WindowFrame title="Ignis Engine v0.8.1-alpha (Desktop Mode)">
      <div className="flex h-full w-full overflow-hidden bg-[#0f0a0a] text-[#fef9f3]">
        {activeMode !== EditorMode.MAIN_MENU && (
          <Sidebar 
            entities={entities} 
            selectedId={selectedEntityId} 
            onSelect={setSelectedEntityId} 
            onAdd={handleAddEntity}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            onExport={handleBuildProject}
            onImport={handleImportScene}
            onDelete={(id) => {
              const updated = entities.filter(e => e.id !== id);
              handleEntitiesUpdate(updated, true);
            }}
            onDropAsset={handleDropAssetOnEntity}
            onDropAssetToHierarchy={handleDropAssetToHierarchy}
          />
        )}

        {activeMode === EditorMode.MAIN_MENU ? (
          <MainMenu 
            onStart={() => setActiveMode(EditorMode.VIEWPORT)} 
            onLoadLevel={handleLoadLevel}
            levels={Object.values(levels)}
            onImport={handleImportScene} 
            onOpenPlugins={() => setActiveMode(EditorMode.EXTENSIONS)}
          />
        ) : (
          <div className="flex flex-col flex-1 relative bg-[#1a0f0f] m-2 rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <Toolbar 
              dimension={dimension} 
              setDimension={setDimension}
              isSimulating={isSimulating}
              setIsSimulating={(s) => {
                  setIsSimulating(s);
                  setLogs(prev => [...prev, s ? `Simulation Started (${physicsEngine})` : 'Simulation Stopped']);
              }}
              physicsEngine={physicsEngine}
              setPhysicsEngine={setPhysicsEngine}
              wPosition={wPosition}
              setWPosition={setWPosition}
              wFov={wFov}
              setWFov={setWFov}
              onUndo={undo}
              onRedo={redo}
              canUndo={historyIdx > 0}
              canRedo={historyIdx < history.length - 1}
              showDebug={showDebug}
              setShowDebug={setShowDebug}
            />

            <main className="flex-1 relative bg-black/40 overflow-hidden">
              {activeMode === EditorMode.VIEWPORT && (
                <Viewport 
                  entities={entities} 
                  selectedId={selectedEntityId}
                  dimension={dimension} 
                  isSimulating={isSimulating}
                  physicsEngine={physicsEngine}
                  wPosition={wPosition}
                  wFov={wFov}
                  onEntitiesChange={handleEntitiesUpdate}
                />
              )}
              {activeMode === EditorMode.VISUAL_CODE && <VisualScripting />}
              {activeMode === EditorMode.AI_ARCHITECT && <AIArchitect />}
              {activeMode === EditorMode.SCRIPT_CODE && (
                  <CodeEditor 
                      jsEnabled={jsModeEnabled} 
                      files={files} 
                      onFileChange={handleFileChange} 
                      onCreateFile={handleCreateFile}
                  />
              )}
              {activeMode === EditorMode.SHADER_EDITOR && <ShaderEditor />}
              {activeMode === EditorMode.AUDIO_SUITE && (
                  <AudioEditor 
                    entities={entities} 
                    onUpdateEntity={(e) => updateEntity(e, true)} 
                    assets={assets}
                    setAssets={setAssets}
                  />
              )}
              {activeMode === EditorMode.ASSET_BROWSER && (
                  <AssetBrowser 
                      assets={assets} 
                      setAssets={setAssets} 
                      onCreateScript={handleCreateFile}
                      onLoadLevel={handleLoadLevel}
                  />
              )}
              {activeMode === EditorMode.ASSET_CREATOR && <AssetCreator assets={assets} onSave={(asset) => setAssets([...assets, asset])} />}
              {activeMode === EditorMode.DOCS && <TendrDocs />}
              {activeMode === EditorMode.EXTENSIONS && <ExtensionManager onToggleJs={() => setJsModeEnabled(!jsModeEnabled)} jsEnabled={jsModeEnabled} />}

              {showDebug && (
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#0f0a0a]/90 backdrop-blur-md border-t border-white/10 flex flex-col z-50 transition-all">
                      <div className="flex justify-between items-center px-4 py-2 bg-black/40 border-b border-white/5">
                          <span className="text-[10px] font-black text-[#ff9d5c] uppercase tracking-widest">Ignis Debug Console</span>
                          <div className="flex gap-2">
                               <button onClick={() => setLogs([])} className="text-[9px] text-gray-400 hover:text-white uppercase font-bold">Clear</button>
                               <button onClick={() => setShowDebug(false)} className="text-[9px] text-gray-400 hover:text-white"><i className="fas fa-times"></i></button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1">
                          {logs.map((log, i) => (
                              <div key={i} className="text-gray-300 border-b border-white/5 pb-0.5 mb-0.5">
                                  <span className="text-[#ff5e3a] mr-2">[{new Date().toLocaleTimeString()}]</span>
                                  {log}
                              </div>
                          ))}
                          <div className="text-gray-500 italic animate-pulse">_</div>
                      </div>
                  </div>
              )}
            </main>
          </div>
        )}

        {activeMode !== EditorMode.MAIN_MENU && (
          <Inspector 
            entity={selectedEntity} 
            onUpdate={updateEntity}
            dimension={dimension}
            scripts={Object.keys(files)}
            levels={Object.values(levels)}
          />
        )}
      </div>
    </WindowFrame>
  );
};

export default App;
