
import React, { useState, useEffect, useCallback } from 'react';
import { EditorMode, RenderDimension, Entity, Extension, VirtualFile, Asset, LevelData } from './types';
import Viewport from './components/Editor/Viewport';
import VisualScripting from './components/Editor/VisualScripting';
import CodeEditor from './components/Editor/CodeEditor';
import ShaderEditor from './components/Editor/ShaderEditor';
import AudioEditor from './components/Editor/AudioEditor';
import TendrDocs from './components/Editor/TendrDocs';
import ExtensionManager from './components/Editor/ExtensionManager';
import Sidebar from './components/Layout/Sidebar';
import Toolbar from './components/Layout/Toolbar';
import Inspector from './components/Editor/Inspector';
import AssetBrowser from './components/Editor/AssetBrowser';
import AssetCreator from './components/Editor/AssetCreator';
import MainMenu from './components/Editor/MainMenu';

// Compression Utilities for custom extensions
const ignitePack = (data: any): string => btoa(encodeURIComponent(JSON.stringify(data)));
const igniteUnpack = (data: string): any => JSON.parse(decodeURIComponent(atob(data)));

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<EditorMode>(EditorMode.MAIN_MENU);
  const [dimension, setDimension] = useState<RenderDimension>(RenderDimension.D3);
  const [jsModeEnabled, setJsModeEnabled] = useState(false);
  
  // --- LEVEL MANAGEMENT ---
  const [currentLevelId, setCurrentLevelId] = useState<string>('lvl_main');
  const [levels, setLevels] = useState<Record<string, LevelData>>({
    'lvl_main': {
        id: 'lvl_main',
        name: 'Main Scene',
        entities: [
            {
              id: '1',
              name: 'Player',
              tag: 'Player',
              layer: 'Default',
              isStatic: false,
              transform: { position: [0, 4, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
              meshType: 'BOX',
              color: '#ff5e3a',
              material: { roughness: 0.5, metalness: 0.2, opacity: 1, emissive: '#000000', wireframe: false },
              physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.2, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, customEngine: 'FLINT', isTrigger: false, collisionDetection: 'CONTINUOUS', magnetism: 0, temperature: 20 },
              controller: { enabled: true, moveSpeed: 5, jumpForce: 10, lookSensitivity: 2, useGravity: true, groundCheckDistance: 0.1 },
              audio: { clip: 'none', volume: 1, pitch: 1, isSpatial: true, raytraceOcclusion: true, loop: false }
            },
            {
                id: 'door_to_house',
                name: 'House Portal',
                tag: 'Untagged',
                layer: 'Default',
                isStatic: true,
                transform: { position: [5, 2, 0, 0], rotation: [0, 0, 0, 0], scale: [2, 4, 0.5, 1] },
                meshType: 'BOX',
                color: '#00ffcc',
                material: { roughness: 0.1, metalness: 0.1, opacity: 0.8, emissive: '#00ffcc', wireframe: true },
                physics: { type: 'NONE', mass: 1, friction: 0.5, restitution: 0.2, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, customEngine: 'FLINT', isTrigger: true, collisionDetection: 'DISCRETE', magnetism: 0, temperature: 20 },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                isPortal: true,
                targetLevelId: 'lvl_house'
            }
        ],
        lastModified: Date.now()
    },
    'lvl_house': {
        id: 'lvl_house',
        name: 'House Interior',
        entities: [
             {
              id: 'house_floor',
              name: 'Floor',
              tag: 'Static',
              layer: 'Default',
              isStatic: true,
              transform: { position: [0, 0, 0, 0], rotation: [0, 0, 0, 0], scale: [20, 0.2, 20, 1] },
              meshType: 'BOX',
              color: '#444444',
              material: { roughness: 0.8, metalness: 0.1, opacity: 1, emissive: '#000000', wireframe: false },
              physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, customEngine: 'FLINT', isTrigger: false, collisionDetection: 'DISCRETE' },
              controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'door_exit',
                name: 'Exit Door',
                tag: 'Portal',
                layer: 'Default',
                isStatic: true,
                transform: { position: [0, 2, -9, 0], rotation: [0, 0, 0, 0], scale: [2, 4, 0.5, 1] },
                meshType: 'BOX',
                color: '#ff0055',
                material: { roughness: 0.1, metalness: 0.1, opacity: 0.5, emissive: '#ff0055', wireframe: true },
                physics: { type: 'NONE', mass: 0, friction: 0, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: true, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                isPortal: true, targetLevelId: 'lvl_main'
            }
        ],
        lastModified: Date.now()
    }
  });

  // --- ASSET MANAGEMENT ---
  const [assets, setAssets] = useState<Asset[]>([
    { id: 'lvl_main', name: 'Main Scene', type: 'LEVEL', icon: 'fa-map', size: '12 KB' },
    { id: 'lvl_house', name: 'House Interior', type: 'LEVEL', icon: 'fa-map', size: '4 KB' },
    { id: 'a1', name: 'cliff_face_01', type: 'MESH', icon: 'fa-mountain', size: '1.2 MB' },
    { id: 'a2', name: 'fire_shader', type: 'SHADER', icon: 'fa-fire', size: '24 KB' },
    { id: 'a3', name: 'character_controller.tdr', type: 'SCRIPT', icon: 'fa-code', size: '4 KB' },
    { id: 'a4', name: 'grass_texture', type: 'TEXTURE', icon: 'fa-image', size: '512 KB' },
    { id: 'a5', name: 'lookout_tower', type: 'MESH', icon: 'fa-tower-observation', size: '4.8 MB' },
    { id: 'a6', name: 'ambient_birds', type: 'AUDIO', icon: 'fa-music', size: '2.1 MB' }
  ]);

  // --- VIRTUAL FILE SYSTEM ---
  const [files, setFiles] = useState<Record<string, VirtualFile>>({
    'sys_physics.tdr': {
      name: 'sys_physics.tdr',
      language: 'tendr',
      isOpen: true,
      content: `## Ignis Script v0.7.5
module physics::core

import sys::time
import math::vector

# System entry point
proc update_physics :: (dt: f32) -> void
    log("Flint PhysX: v0.7.5 Active")
    
    # Angular Drag Calc
    def drag : f32 = 0.05
    apply_angular_drag(drag * dt)
`
    },
    'player_controller.tdr': {
      name: 'player_controller.tdr',
      language: 'tendr',
      isOpen: false,
      content: `module game::player

proc move :: (dir: Vec3) -> void
    if (input.is_pressed("Shift")) {
        speed *= 1.5
    }
    transform.translate(dir * speed * dt)
`
    },
    'level_manager.tdr': {
      name: 'level_manager.tdr',
      language: 'tendr',
      isOpen: false,
      content: `module game::levels

proc load_scene :: (name: string) -> void
    log("Switching scene to: " + name)
    engine.load_level(name)
`
    },
    'main.tdr': {
      name: 'main.tdr',
      language: 'tendr',
      isOpen: true,
      content: `module game::main

proc start :: () -> void
    spawn_entity("Player", vec3(0, 10, 0))
    log("Game initialized - v0.7.5b Build 1")
`
    }
  });

  const handleFileChange = (fileName: string, newContent: string) => {
    setFiles(prev => ({
      ...prev,
      [fileName]: { ...prev[fileName], content: newContent }
    }));
  };

  const handleScriptHotReload = (fileName: string) => {
    setLogs(prev => [...prev, `HOT RELOAD: Recompiling ${fileName}...`]);
    const affectedEntities = entities.filter(e => e.scriptId === fileName);
    if(affectedEntities.length > 0) {
        setLogs(prev => [...prev, ` > Applied new logic to ${affectedEntities.length} entities.`]);
    }
    setLogs(prev => [...prev, ` > Hot Reload Complete.`]);
  };

  const handleCreateFile = (name: string, type: 'tendr' | 'javascript') => {
      const fileName = name.endsWith(type === 'tendr' ? '.tdr' : '.js') ? name : `${name}.${type === 'tendr' ? 'tdr' : 'js'}`;
      setFiles(prev => ({
          ...prev,
          [fileName]: {
              name: fileName,
              language: type,
              isOpen: true,
              content: type === 'tendr' ? `module ${name.replace('.','_')}\n\nproc start :: () -> void\n    pass` : `// JS Script`
          }
      }));
      setAssets(prev => [...prev, {
          id: `script_${Date.now()}`,
          name: fileName,
          type: 'SCRIPT',
          icon: 'fa-code',
          size: '1 KB'
      }]);
  };
  
  // --- ENTITY STATE & HISTORY ---
  const [entities, setEntities] = useState<Entity[]>(levels['lvl_main'].entities);
  const [history, setHistory] = useState<Entity[][]>([levels['lvl_main'].entities]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Sync entities back to level state on change
  useEffect(() => {
      setLevels(prev => ({
          ...prev,
          [currentLevelId]: {
              ...prev[currentLevelId],
              entities: entities,
              lastModified: Date.now()
          }
      }));
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

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              undo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              redo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIdx, history]);

  // --- LEVEL MANAGEMENT ---
  const handleCreateLevel = (name: string) => {
      const newLevelId = `lvl_${Date.now()}`;
      const newLevel: LevelData = {
          id: newLevelId,
          name: name,
          entities: [{
              id: '1',
              name: 'Directional Light',
              tag: 'Light',
              layer: 'Default',
              isStatic: true,
              transform: { position: [0, 10, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
              meshType: 'SPHERE',
              color: '#ffffff',
              material: { roughness: 0, metalness: 0, opacity: 1, emissive: '#ffffff', wireframe: false },
              physics: { type: 'NONE', mass: 0, friction: 0, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
              controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
          }],
          lastModified: Date.now()
      };
      
      setLevels(prev => ({ ...prev, [newLevelId]: newLevel }));
      setAssets(prev => [...prev, { id: newLevelId, name: name, type: 'LEVEL', icon: 'fa-map', size: '1 KB' }]);
      setLogs(prev => [...prev, `Level '${name}' created.`]);
      // Optional: Auto switch
      // handleLoadLevel(newLevelId);
  };

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
  const [logs, setLogs] = useState<string[]>(['Ignis Engine v0.7.5b (Build 1)', 'Flint Physics v3.0 (Angular Dynamics)', 'Spatial Hash Grid Loaded']);

  useEffect(() => {
      if (!isSimulating) return;

      const physicsTick = setInterval(() => {
          const player = entities.find(e => e.tag === 'Player');
          if (!player) return;

          const portals = entities.filter(e => e.isPortal && e.targetLevelId);
          portals.forEach(portal => {
              const dx = Math.abs(player.transform.position[0] - portal.transform.position[0]);
              const dy = Math.abs(player.transform.position[1] - portal.transform.position[1]);
              const dz = Math.abs(player.transform.position[2] - portal.transform.position[2]);
              const combinedScaleX = (player.transform.scale[0] + portal.transform.scale[0]) / 2;
              const combinedScaleY = (player.transform.scale[1] + portal.transform.scale[1]) / 2;
              const combinedScaleZ = (player.transform.scale[2] + portal.transform.scale[2]) / 2;

              if (dx < combinedScaleX && dy < combinedScaleY && dz < combinedScaleZ) {
                  if (portal.targetLevelId && levels[portal.targetLevelId]) {
                      setLogs(prev => [...prev, `PORTAL TRIGGERED: Loading ${levels[portal.targetLevelId].name}...`]);
                      handleLoadLevel(portal.targetLevelId);
                      setIsSimulating(false); 
                      setTimeout(() => setIsSimulating(true), 100);
                  }
              }
          });
      }, 100);

      return () => clearInterval(physicsTick);
  }, [isSimulating, entities, levels]);

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
      physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.5, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, customEngine: 'FLINT', isTrigger: false, collisionDetection: 'DISCRETE', magnetism: 0, temperature: 20 },
      controller: { enabled: false, moveSpeed: 5, jumpForce: 10, lookSensitivity: 2, useGravity: true, groundCheckDistance: 0.1 }
    };
    
    if (type === 'PARTICLE_SYSTEM') {
        newEntity.particleConfig = {
            count: 1000, life: 2.0, speed: 2.0, size: 0.1, emissionRate: 100,
            colorStart: '#ff5e3a', colorEnd: '#000000', spread: [1,1,1],
            wSpread: 2.0, wVelocity: 0.1, hyperGravity: 0
        };
        newEntity.physics.type = 'NONE';
    }

    const updated = [...entities, newEntity];
    handleEntitiesUpdate(updated, true);
    setSelectedEntityId(newEntity.id);
    setLogs(prev => [...prev, `Entity Created: ${newEntity.id} (${type})`]);
  };

  const handleDropAssetOnEntity = (asset: Asset, entityId: string) => {
      const targetEntity = entities.find(e => e.id === entityId);
      if(!targetEntity) return;

      if(asset.type === 'TEXTURE') {
          updateEntity({ ...targetEntity, material: { ...targetEntity.material, textureId: asset.id } }, true);
          setLogs(prev => [...prev, `Assigned texture '${asset.name}' to ${targetEntity.name}`]);
      } else if (asset.type === 'SCRIPT') {
          updateEntity({ ...targetEntity, scriptId: asset.name }, true);
          setLogs(prev => [...prev, `Assigned script '${asset.name}' to ${targetEntity.name}`]);
      }
  };

  const handleDropAssetToHierarchy = (asset: Asset) => {
      if (asset.type === 'MESH' || asset.type === 'TEXTURE') {
          const type = asset.type === 'MESH' ? 'CUSTOM_MESH' : 'BOX';
          const newEntity: Entity = {
            id: Math.random().toString(36).substr(2, 9),
            name: asset.name,
            tag: 'Imported',
            layer: 'Default',
            isStatic: false,
            transform: { position: [0, 5, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
            meshType: type as Entity['meshType'],
            color: '#ffffff',
            material: { roughness: 0.5, metalness: 0.5, opacity: 1, emissive: '#000000', wireframe: false, textureId: asset.type === 'TEXTURE' ? asset.id : undefined },
            physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.5, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, customEngine: 'FLINT', isTrigger: false, collisionDetection: 'DISCRETE', magnetism: 0, temperature: 20 },
            controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: true, groundCheckDistance: 0.1 }
          };
          
          if(asset.type === 'MESH' && asset.data) {
              if(asset.data.vertices) newEntity.customGeometry = asset.data;
          }

          const updated = [...entities, newEntity];
          handleEntitiesUpdate(updated, true);
          setSelectedEntityId(newEntity.id);
          setLogs(prev => [...prev, `Instantiated asset: ${asset.name}`]);
      }
  };

  const handleBuildProject = () => {
    // Engine-style export
    const projectData = {
        meta: {
            engineVersion: "0.7.5b",
            buildNumber: 1,
            projectName: "Untitled Ignis Project",
            exportDate: new Date().toISOString()
        },
        scenes: levels,
        assets: assets,
        scripts: files,
        settings: {
            renderDimension: dimension,
            physicsEngine: "Flint V3"
        }
    };

    const payload = JSON.stringify(projectData, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project_build.ignis'; // Custom extension
    link.click();
    setLogs(prev => [...prev, 'Project Build Complete: project_build.ignis']);
  };

  const handleImportScene = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        
        // Handle both old export (ignisPack) and new build format
        if (data.scenes) {
            // New Format
            setLevels(data.scenes);
            setFiles(data.scripts || files);
            setAssets(data.assets || assets);
            setLogs(prev => [...prev, 'Full Project Imported successfully.']);
            const firstLevel = Object.keys(data.scenes)[0];
            if(firstLevel) handleLoadLevel(firstLevel);
        } else if (data.entities) {
            // Old format fallback
            setEntities(data.entities);
            setHistory([data.entities]);
            setHistoryIdx(0);
            setActiveMode(EditorMode.VIEWPORT);
            setLogs(prev => [...prev, 'Legacy Scene imported.']);
        } else {
             // Compressed fallback
             try {
                 const unpacked = igniteUnpack(raw);
                 setEntities(unpacked.entities);
                 setLogs(prev => [...prev, 'Legacy Compressed Scene imported.']);
             } catch(e) { throw new Error('Unknown format'); }
        }
      } catch (err) {
        alert("Corrupt or invalid file format.");
        setLogs(prev => [...prev, 'ERROR: Failed to import project/scene.']);
      }
    };
    reader.readAsText(file);
  };

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0a0a] text-[#fef9f3]">
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
            setLogs(prev => [...prev, `Deleted entity: ${id}`]);
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
                setLogs(prev => [...prev, s ? 'Simulation Started [Hybrid Engine: Flint + PhysX]' : 'Simulation Stopped']);
            }}
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
                wPosition={wPosition}
                wFov={wFov}
                onEntitiesChange={handleEntitiesUpdate}
              />
            )}
            {activeMode === EditorMode.VISUAL_CODE && <VisualScripting />}
            {activeMode === EditorMode.SCRIPT_CODE && (
                <CodeEditor 
                    jsEnabled={jsModeEnabled} 
                    files={files} 
                    onFileChange={handleFileChange} 
                    onCreateFile={handleCreateFile}
                    onHotReload={handleScriptHotReload}
                />
            )}
            {activeMode === EditorMode.SHADER_EDITOR && <ShaderEditor />}
            {activeMode === EditorMode.AUDIO_SUITE && <AudioEditor entities={entities} onUpdateEntity={(e) => updateEntity(e, true)} />}
            {activeMode === EditorMode.ASSET_BROWSER && (
                <AssetBrowser 
                    assets={assets} 
                    setAssets={setAssets} 
                    onCreateScript={handleCreateFile}
                    onLoadLevel={handleLoadLevel}
                    onCreateLevel={handleCreateLevel}
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

          <div className="h-10 bg-black/20 backdrop-blur-md border-t border-white/5 flex items-center px-4 gap-4 text-[10px] font-mono tracking-tighter uppercase opacity-60">
            <span className="text-[#ff9d5c] font-black tracking-widest">IGNIS ENGINE v0.7.5b (Build 1)</span>
            <span className="text-green-400">FLINT V3.0 + EMBER</span>
            <span className="text-blue-400">PHYSX BRIDGE ACTIVE</span>
            <div className="flex-1" />
            <span className="text-[#ff5e3a]">LEVEL: {levels[currentLevelId]?.name || 'Unknown'}</span>
            <div className="w-px h-3 bg-white/20"></div>
            <span>Mode: {activeMode}</span>
            <span>JS_EXT: {jsModeEnabled ? 'ACTIVE' : 'OFF'}</span>
          </div>
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
  );
};

export default App;
