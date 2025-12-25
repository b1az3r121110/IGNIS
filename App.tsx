
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
        name: 'Main Level',
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
            // --- PLAYER SPAWN ---
            {
              id: 'player_spawn', name: 'Player', tag: 'Player', layer: 'Default',
              isStatic: false, transform: { position: [0, 2, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
              meshType: 'BOX', color: '#ff5e3a',
              material: { roughness: 0.5, metalness: 0.2, opacity: 1, emissive: '#000000', wireframe: false },
              physics: { type: 'RIGID', mass: 1, friction: 0.5, restitution: 0.2, angularDamping: 0.1, linearDamping: 0.1, gravityScale: 1, customEngine: 'FLINT', isTrigger: false, collisionDetection: 'CONTINUOUS' },
              controller: { enabled: true, moveSpeed: 5, jumpForce: 10, lookSensitivity: 2, useGravity: true, groundCheckDistance: 0.1 }
            },
            // --- STRUCTURE ---
            {
                id: 'floor', name: 'Bedroom Floor', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [0, 0, 0, 0], rotation: [0, 0, 0, 0], scale: [20, 0.5, 20, 1] },
                meshType: 'BOX', color: '#5c3a21',
                material: { roughness: 0.8, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.8, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'roof', name: 'Ceiling', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [0, 5.25, 0, 0], rotation: [0, 0, 0, 0], scale: [22, 0.5, 22, 1] },
                meshType: 'BOX', color: '#e5e7eb',
                material: { roughness: 0.9, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'wall_n', name: 'North Wall', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [0, 2.5, -10, 0], rotation: [0, 0, 0, 0], scale: [20, 5, 1, 1] },
                meshType: 'BOX', color: '#d4d4d8',
                material: { roughness: 0.8, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'wall_s', name: 'South Wall', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [0, 2.5, 10, 0], rotation: [0, 0, 0, 0], scale: [20, 5, 1, 1] },
                meshType: 'BOX', color: '#d4d4d8',
                material: { roughness: 0.8, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'wall_e', name: 'East Wall', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [10, 2.5, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 5, 20, 1] },
                meshType: 'BOX', color: '#a1a1aa',
                material: { roughness: 0.8, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            {
                id: 'wall_w', name: 'West Wall', tag: 'Structure', layer: 'Default',
                isStatic: true, transform: { position: [-10, 2.5, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 5, 20, 1] },
                meshType: 'BOX', color: '#a1a1aa',
                material: { roughness: 0.8, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            // --- FURNITURE: BED ---
            {
                id: 'bed_frame', name: 'Bed Frame', tag: 'Furniture', layer: 'Default',
                isStatic: true, transform: { position: [-7, 0.75, -7, 0], rotation: [0, 0, 0, 0], scale: [4, 1, 6, 1] },
                meshType: 'BOX', color: '#451a03',
                material: { roughness: 0.7, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.8, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                interactable: true, interactionText: 'Sleep'
            },
            {
                id: 'mattress', name: 'Mattress', tag: 'Furniture', layer: 'Default',
                isStatic: true, transform: { position: [-7, 1.35, -7, 0], rotation: [0, 0, 0, 0], scale: [3.8, 0.4, 5.8, 1] },
                meshType: 'BOX', color: '#f3f4f6',
                material: { roughness: 0.9, metalness: 0, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.9, restitution: 0.1, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 }
            },
            // --- FURNITURE: DESK & CHAIR ---
            {
                id: 'desk', name: 'Desk', tag: 'Furniture', layer: 'Default',
                isStatic: true, transform: { position: [7, 1.5, 7, 0], rotation: [0, 0, 0, 0], scale: [4, 0.2, 2, 1] },
                meshType: 'BOX', color: '#78350f',
                material: { roughness: 0.6, metalness: 0.1, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 0, friction: 0.5, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                interactable: true, interactionText: 'Inspect Desk'
            },
            {
                id: 'chair', name: 'Office Chair', tag: 'Prop', layer: 'Default',
                isStatic: false, transform: { position: [7, 1, 5.5, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1, 1] },
                meshType: 'BOX', color: '#1f2937',
                material: { roughness: 0.5, metalness: 0.5, opacity: 1, emissive: '#000000', wireframe: false },
                physics: { type: 'RIGID', mass: 5, friction: 0.3, restitution: 0.1, angularDamping: 0.5, linearDamping: 0.5, gravityScale: 1, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                interactable: true, interactionText: 'Sit'
            },
            // --- PROPS ---
            {
                id: 'lamp', name: 'Desk Lamp', tag: 'Light', layer: 'Default',
                isStatic: true, transform: { position: [8, 2, 7, 0], rotation: [0, 0, 0, 0], scale: [0.5, 0.8, 0.5, 1] },
                meshType: 'CONE', color: '#fbbf24',
                material: { roughness: 0.2, metalness: 0.8, opacity: 1, emissive: '#fbbf24', wireframe: false },
                physics: { type: 'NONE', mass: 0, friction: 0, restitution: 0, angularDamping: 0, linearDamping: 0, gravityScale: 0, isTrigger: false, collisionDetection: 'DISCRETE', customEngine: 'FLINT' },
                controller: { enabled: false, moveSpeed: 0, jumpForce: 0, lookSensitivity: 0, useGravity: false, groundCheckDistance: 0 },
                interactable: true, interactionText: 'Toggle Light'
            },
            // --- PORTAL BACK ---
            {
                id: 'door_exit', name: 'Exit Door', tag: 'Portal', layer: 'Default',
                isStatic: true, transform: { position: [0, 2, -9.5, 0], rotation: [0, 0, 0, 0], scale: [2, 4, 0.5, 1] },
                meshType: 'BOX', color: '#00ffcc',
                material: { roughness: 0.1, metalness: 0.1, opacity: 0.5, emissive: '#00ffcc', wireframe: true },
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
    { id: 'lvl_main', name: 'Main Level', type: 'LEVEL', icon: 'fa-map', size: '12 KB' },
    { id: 'lvl_house', name: 'House Interior', type: 'LEVEL', icon: 'fa-map', size: '4 KB' },
    { id: 'a1', name: 'cliff_face_01', type: 'MESH', icon: 'fa-mountain', size: '1.2 MB' },
    { id: 'a2', name: 'fire_shader', type: 'SHADER', icon: 'fa-fire', size: '24 KB' },
    { id: 'a3', name: 'character_controller.tdr', type: 'SCRIPT', icon: 'fa-code', size: '4 KB' },
    { id: 'a4', name: 'grass_texture', type: 'TEXTURE', icon: 'fa-image', size: '512 KB' },
    { id: 'a5', name: 'lookout_tower', type: 'MESH', icon: 'fa-tower-observation', size: '4.8 MB' },
    { id: 'a6', name: 'ambient_birds', type: 'AUDIO', icon: 'fa-music', size: '2.1 MB' }
  ]);

  // --- VIRTUAL FILE SYSTEM STATE (Persistent) ---
  const [files, setFiles] = useState<Record<string, VirtualFile>>({
    'sys_physics.tdr': {
      name: 'sys_physics.tdr',
      language: 'tendr',
      isOpen: true,
      content: `## Tendr Lang v2.6.1.b
module physics::core

import sys::time
import math::vector

# System entry point
proc update_physics :: (dt: f32) -> void
    log("PhysX Bridge: Active")
    
    # Example Logic
    def gravity : Vec3 = vec3(0, -9.81, 0)
    apply_global_force(gravity * dt)
`
    },
    'main.tdr': {
      name: 'main.tdr',
      language: 'tendr',
      isOpen: true,
      content: `module game::main

proc start :: () -> void
    spawn_entity("Player", vec3(0, 10, 0))
    log("Game initialized")
`
    },
    'character_controller.tdr': {
        name: 'character_controller.tdr',
        language: 'tendr',
        isOpen: false,
        content: `module game::char
        
proc move :: (dir: Vec3) -> void
    # Logic here
    pass`
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
    // Simulate finding entities that use this script and refreshing them
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
  
  // Entity State (Loads from active level)
  const [entities, setEntities] = useState<Entity[]>(levels['lvl_main'].entities);

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

  // Handle Level Creation
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
      setAssets(prev => [...prev, {
          id: newLevelId,
          name: name,
          type: 'LEVEL',
          icon: 'fa-map',
          size: '1 KB'
      }]);
      
      setLogs(prev => [...prev, `Level '${name}' created.`]);
  };

  const handleLoadLevel = (levelId: string) => {
      if (levels[levelId]) {
          setCurrentLevelId(levelId);
          setEntities(levels[levelId].entities);
          setHistory([levels[levelId].entities]);
          setHistoryIdx(0);
          setSelectedEntityId(null);
          setLogs(prev => [...prev, `Loaded Level: ${levels[levelId].name}`]);
          if (activeMode === EditorMode.ASSET_BROWSER) setActiveMode(EditorMode.VIEWPORT);
      }
  };

  const [history, setHistory] = useState<Entity[][]>([entities]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const pushToHistory = useCallback((newEntities: Entity[]) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(newEntities);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }, [history, historyIdx]);

  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setEntities(history[historyIdx - 1]);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setEntities(history[historyIdx + 1]);
    }
  };

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wPosition, setWPosition] = useState(0);
  const [wFov, setWFov] = useState(90); // 4D Hyper-Perspective FOV
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Ignis Engine v2.7.0.b (Titan+)', 'Flint Physics v2.1 (Sub-stepping Active)', 'Spatial Hash Grid Loaded']);

  // --- PHYSICS PORTAL SIMULATION CHECK ---
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
    
    // Default config for particles
    if (type === 'PARTICLE_SYSTEM') {
        newEntity.particleConfig = {
            count: 1000, life: 2.0, speed: 2.0, size: 0.1, emissionRate: 100,
            colorStart: '#ff5e3a', colorEnd: '#000000', spread: [1,1,1],
            wSpread: 2.0, wVelocity: 0.1, hyperGravity: 0
        };
        newEntity.physics.type = 'NONE';
    }

    const updated = [...entities, newEntity];
    setEntities(updated);
    pushToHistory(updated);
    setSelectedEntityId(newEntity.id);
    setLogs(prev => [...prev, `Entity Created: ${newEntity.id} (${type})`]);
  };

  const updateEntity = (updated: Entity) => {
    const newEntities = entities.map(e => e.id === updated.id ? updated : e);
    setEntities(newEntities);
    pushToHistory(newEntities);
  };

  const handleDropAssetOnEntity = (asset: Asset, entityId: string) => {
      const targetEntity = entities.find(e => e.id === entityId);
      if(!targetEntity) return;

      if(asset.type === 'TEXTURE') {
          updateEntity({ ...targetEntity, material: { ...targetEntity.material, textureId: asset.id } });
          setLogs(prev => [...prev, `Assigned texture '${asset.name}' to ${targetEntity.name}`]);
      } else if (asset.type === 'SCRIPT') {
          updateEntity({ ...targetEntity, scriptId: asset.name });
          setLogs(prev => [...prev, `Assigned script '${asset.name}' to ${targetEntity.name}`]);
      }
  };

  const handleDropAssetToHierarchy = (asset: Asset) => {
      if (asset.type === 'MESH' || asset.type === 'TEXTURE') {
          const type = asset.type === 'MESH' ? 'CUSTOM_MESH' : 'BOX'; // If texture, default to Box with texture
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
          setEntities(updated);
          pushToHistory(updated);
          setSelectedEntityId(newEntity.id);
          setLogs(prev => [...prev, `Instantiated asset: ${asset.name}`]);
      }
  };

  const handleExportScene = () => {
    const payload = ignitePack({ entities, dimension });
    const blob = new Blob([payload], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project_scene.cmpfire';
    link.click();
    setLogs(prev => [...prev, 'Scene exported successfully.']);
  };

  const handleImportScene = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = igniteUnpack(raw);
        setEntities(data.entities);
        setHistory([data.entities]);
        setHistoryIdx(0);
        setActiveMode(EditorMode.VIEWPORT);
        setLogs(prev => [...prev, 'Scene imported.']);
      } catch (err) {
        alert("Corrupt or invalid .cmpfire file.");
        setLogs(prev => [...prev, 'ERROR: Failed to import scene.']);
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
          onExport={handleExportScene}
          onImport={handleImportScene}
          onDelete={(id) => {
            const updated = entities.filter(e => e.id !== id);
            setEntities(updated);
            pushToHistory(updated);
            setLogs(prev => [...prev, `Deleted entity: ${id}`]);
          }}
          onDropAsset={handleDropAssetOnEntity}
          onDropAssetToHierarchy={handleDropAssetToHierarchy}
        />
      )}

      {activeMode === EditorMode.MAIN_MENU ? (
        <MainMenu 
          onStart={() => setActiveMode(EditorMode.VIEWPORT)} 
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
                setEntities={setEntities}
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
            {activeMode === EditorMode.AUDIO_SUITE && <AudioEditor entities={entities} onUpdateEntity={updateEntity} />}
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
            <span className="text-[#ff9d5c] font-black tracking-widest">IGNIS ENGINE v2.6.2</span>
            <span className="text-green-400">FLINT V2.1 + EMBER</span>
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
