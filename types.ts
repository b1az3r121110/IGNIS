
export enum EditorMode {
  VIEWPORT = 'VIEWPORT',
  VISUAL_CODE = 'VISUAL_CODE',
  SCRIPT_CODE = 'SCRIPT_CODE',
  SHADER_EDITOR = 'SHADER_EDITOR',
  ASSET_BROWSER = 'ASSET_BROWSER',
  ASSET_CREATOR = 'ASSET_CREATOR',
  AUDIO_SUITE = 'AUDIO_SUITE',
  DOCS = 'DOCS',
  EXTENSIONS = 'EXTENSIONS',
  MAIN_MENU = 'MAIN_MENU'
}

export enum RenderDimension {
  D2 = '2D',
  D3 = '3D',
  D4 = '4D'
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
  type: 'MESH' | 'TEXTURE' | 'SCRIPT' | 'SHADER' | 'AUDIO' | 'SCENE' | 'LEVEL';
  icon: string;
  size: string;
  data?: any; // For storing raw content or blob URLs
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
  inputs?: Record<string, any>; // Store values for input fields (numbers, vectors)
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
  
  // --- 4D Particle Props ---
  wSpread: number;      // How much they spread in 4th dimension
  wVelocity: number;    // Speed in W direction
  hyperGravity: number; // Gravity in W direction
}

export interface PhysicsProps {
  type: 'RIGID' | 'SOFT' | 'AERO' | 'FLUID' | 'VEHICLE' | 'QUANTUM' | 'NONE';
  
  // --- Legacy (Classic Engine Options) ---
  mass: number;
  friction: number;
  restitution: number; // Bounciness
  angularDamping: number;
  linearDamping: number;
  gravityScale: number;
  isTrigger: boolean;
  
  // --- V1.5 Standard ---
  collisionDetection: 'DISCRETE' | 'CONTINUOUS' | 'SPECULATIVE';
  customEngine: 'FLINT' | 'PHYSX_BRIDGE' | 'NATIVE_C';

  // --- V2.0 Fluids & Aero ---
  liftCoefficient?: number;
  dragCoefficient?: number;
  viscosity?: number;
  buoyancy?: number;
  surfaceTension?: number;
  fluidDensity?: number;

  // --- V2.6 Commercial (Thermodynamics & Electromagnetism) ---
  magnetism?: number; // Tesla
  electrostaticCharge?: number; // Coulombs
  temperature?: number; // Celsius
  thermalConductivity?: number;
  thermalExpansion?: number;
  meltingPoint?: number;

  // --- V2.6.1 Advanced Material Physics ---
  staticFriction?: number;
  dynamicFriction?: number;
  elasticity?: number; // Young's Modulus
  plasticity?: number; // Deformation retention
  fractureThreshold?: number; // Force needed to break
  porosity?: number; // For fluid absorption
  roughnessMap?: number; // Micro-collision
  
  // --- 4D Physics ---
  wMass?: number; // Inertia in W dimension
  hyperFriction?: number; // Friction in W
  
  // --- Quantum ---
  quantumState?: 'SUPERPOSITION' | 'ENTANGLED' | 'COLLAPSED';
  probabilityCloud?: number; // 0-1
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
  
  // --- 4D Audio ---
  is4DSpatial?: boolean; // Attenuate based on W-distance
  hyperDopplerScale?: number; // Frequency shift based on W-velocity
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
  velocity?: [number, number, number, number?];
  scriptId?: string; // ID of the assigned script asset
  
  // --- Level Management ---
  isPortal?: boolean;      // If true, hitting this loads a level
  targetLevelId?: string;  // The ID of the level to load

  // --- Particle System ---
  particleConfig?: ParticleConfig;

  // --- Interaction ---
  interactable?: boolean;
  interactionText?: string; // e.g., "Press E to Open"
}
