
export enum EditorMode {
  VIEWPORT = 'VIEWPORT',
  VISUAL_CODE = 'VISUAL_CODE',
  SCRIPT_CODE = 'SCRIPT_CODE',
  SHADER_EDITOR = 'SHADER_EDITOR',
  ASSET_BROWSER = 'ASSET_BROWSER',
  ASSET_CREATOR = 'ASSET_CREATOR',
  AUDIO_SUITE = 'AUDIO_SUITE',
  AI_ARCHITECT = 'AI_ARCHITECT', // New Mode
  DOCS = 'DOCS',
  EXTENSIONS = 'EXTENSIONS',
  MAIN_MENU = 'MAIN_MENU'
}

export enum RenderDimension {
  D2 = '2D',
  D3 = '3D',
  D4 = '4D'
}

export enum PhysicsEngineType {
  FLINT = 'FLINT_V3_BETA',
  PHYSX = 'PHYSX_BRIDGE',
  WASM = 'CUSTOM_WASM'
}

export interface VirtualFile {
  name: string;
  content: string;
  language: 'tendr' | 'javascript' | 'json';
  isOpen: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  entities: Entity[];
  lastModified: number;
}

export interface Asset {
  id: string;
  name: string;
  type: 'MESH' | 'TEXTURE' | 'SCRIPT' | 'SHADER' | 'AUDIO' | 'SCENE' | 'LEVEL' | 'AI_BRAIN';
  icon: string;
  size: string;
  data?: any; 
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePin: string;
  targetNodeId: string;
  targetPin: string;
}

export interface NodeData {
  id: string;
  type: string;
  category: string;
  title: string;
  pos: { x: number, y: number };
  color: string;
  pins: { input: string[], output: string[] };
  inputs?: Record<string, any>;
}

export interface GraphState {
  nodes: NodeData[];
  connections: Connection[];
}

export interface Extension {
  id: string;
  name: string;
  author: string;
  type: 'LANGUAGE_PLUGIN' | 'NODE_PACK' | 'THEME' | 'JS_RUNTIME';
  enabled: boolean;
}

export interface Transform {
  position: [number, number, number, number?];
  rotation: [number, number, number, number?];
  scale: [number, number, number, number?];
}

export interface MaterialProps {
  roughness: number;
  metalness: number;
  opacity: number;
  emissive: string;
  wireframe: boolean;
  textureId?: string;
  normalMapId?: string;
}

export interface ParticleConfig {
  count: number;
  life: number;
  speed: number;
  size: number;
  emissionRate: number;
  colorStart: string;
  colorEnd: string;
  spread: [number, number, number];
  turbulence: number; 
  drag: number;       
  
  // --- 4D Particle Props ---
  wSpread: number;      
  wVelocity: number;    
  hyperGravity: number; 
}

export interface Constraint {
  targetEntityId: string;
  type: 'DISTANCE' | 'HINGE' | 'FIXED';
  distance?: number;
  stiffness?: number; // 0-1
}

export interface PhysicsProps {
  type: 'RIGID' | 'SOFT' | 'AERO' | 'FLUID' | 'VEHICLE' | 'QUANTUM' | 'RAGDOLL' | 'NONE';
  
  // --- Basic ---
  mass: number;
  friction: number;
  restitution: number; 
  angularDamping: number;
  linearDamping: number;
  gravityScale: number;
  isTrigger: boolean;
  
  // --- Flint v3beta Extensions ---
  staticFriction?: number;
  dynamicFriction?: number;
  bouncinessThreshold?: number; // Velocity threshold for bounce
  sleepThreshold?: number;      // Energy threshold for sleep
  
  // --- Advanced Config ---
  collisionDetection: 'DISCRETE' | 'CONTINUOUS' | 'SPECULATIVE';
  
  // --- Aerodynamics ---
  liftCoefficient?: number; 
  dragCoefficient?: number; 
  wingArea?: number;

  // --- Fluid Dynamics ---
  viscosity?: number;
  buoyancy?: number;
  fluidDensity?: number;

  // --- Ragdoll / Constraints ---
  constraints?: Constraint[];

  // --- Commercial ---
  magnetism?: number; 
  temperature?: number; 
  thermalConductivity?: number;

  // --- Materials ---
  elasticity?: number; 
  fractureThreshold?: number; 
  
  // --- 4D Physics ---
  wMass?: number;
  
  // --- Quantum ---
  quantumState?: 'SUPERPOSITION' | 'ENTANGLED' | 'COLLAPSED';
  probabilityCloud?: number; 
}

export interface PlayerControllerProps {
  enabled: boolean;
  moveSpeed: number;
  jumpForce: number;
  lookSensitivity: number;
  useGravity: boolean;
  groundCheckDistance: number;
}

export interface AudioProps {
  clip: string;
  volume: number;
  pitch: number;
  isSpatial: boolean;
  raytraceOcclusion: boolean;
  loop: boolean;
  dopplerLevel?: number;
  is4DSpatial?: boolean; 
  hyperDopplerScale?: number; 
}

export interface AIBrainProps {
    enabled: boolean;
    treeData?: GraphState; // Behavior Tree Graph
    perceptionRange: number;
    fov: number;
    faction: 'FRIENDLY' | 'NEUTRAL' | 'HOSTILE';
}

export interface Entity {
  id: string;
  name: string;
  tag: string;
  layer: string;
  isStatic: boolean;
  transform: Transform;
  meshType: 'BOX' | 'SPHERE' | 'PLANE' | 'TESSERACT' | 'GLOME' | 'SPRITE' | 'CYLINDER' | 'CONE' | 'TORUS' | 'CUSTOM_MESH' | 'PARTICLE_SYSTEM';
  customGeometry?: { vertices: number[], indices: number[], stride?: number };
  color: string;
  material: MaterialProps;
  physics: PhysicsProps;
  controller: PlayerControllerProps;
  audio?: AudioProps;
  ai?: AIBrainProps; // New AI Component
  velocity?: [number, number, number, number?];
  scriptId?: string; 
  isPortal?: boolean;      
  targetLevelId?: string;  
  particleConfig?: ParticleConfig;
  interactable?: boolean;
  interactionText?: string;
}
