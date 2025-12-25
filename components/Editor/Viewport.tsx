
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Entity, RenderDimension, Asset, ParticleConfig } from '../../types';

interface ViewportProps {
  entities: Entity[];
  selectedId: string | null;
  dimension: RenderDimension;
  isSimulating: boolean;
  wPosition: number;
  wFov: number;
  onEntitiesChange: (entities: Entity[], commit?: boolean) => void;
}

const GRAVITY = -9.81;
const PHYSICS_SUBSTEPS = 8;
const FLUID_PARTICLE_COUNT = 500;

type Axis = 'X' | 'Y' | 'Z' | 'W' | 'NONE';
type TransformMode = 'TRANSLATE' | 'SCALE';

// Spatial Hash for Optimization
class SpatialHash {
    cells: Map<string, string[]>;
    cellSize: number;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    key(x: number, y: number, z: number) {
        return `${Math.floor(x/this.cellSize)}:${Math.floor(y/this.cellSize)}:${Math.floor(z/this.cellSize)}`;
    }

    insert(entityId: string, pos: [number, number, number, number?]) {
        const k = this.key(pos[0], pos[1], pos[2]);
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k)!.push(entityId);
    }

    clear() {
        this.cells.clear();
    }

    getNearby(pos: [number, number, number, number?]): string[] {
        const k = this.key(pos[0], pos[1], pos[2]);
        let found: string[] = [];
        const cx = Math.floor(pos[0]/this.cellSize);
        const cy = Math.floor(pos[1]/this.cellSize);
        const cz = Math.floor(pos[2]/this.cellSize);
        
        for(let x = -1; x<=1; x++) {
            for(let y = -1; y<=1; y++) {
                for(let z = -1; z<=1; z++) {
                    const nk = `${cx+x}:${cy+y}:${cz+z}`;
                    if(this.cells.has(nk)) found = found.concat(this.cells.get(nk)!);
                }
            }
        }
        return found; 
    }
}

// Helper for random Range
const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

const Viewport: React.FC<ViewportProps> = ({ entities, selectedId, dimension, isSimulating, wPosition, wFov, onEntitiesChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // State Refs
  const meshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const velocitiesRef = useRef<Map<string, THREE.Vector4>>(new Map());
  const angularVelocitiesRef = useRef<Map<string, THREE.Vector3>>(new Map()); // New Angular Physics
  
  const emberSystemsRef = useRef<Map<string, {
      pos: Float32Array;
      vel: Float32Array;
      life: Float32Array;
      age: Float32Array;
      config: ParticleConfig;
  }>>(new Map());

  const gizmoGroupRef = useRef<THREE.Group | null>(null);
  const physicsDebugGroupRef = useRef<THREE.Group | null>(null);
  const spatialHashRef = useRef(new SpatialHash(2.0));
  const mesh4DCacheRef = useRef<Map<string, Float32Array>>(new Map());

  // Input State
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Interaction State
  const [transformMode, setTransformMode] = useState<TransformMode>('TRANSLATE');
  const [dragAxis, setDragAxis] = useState<Axis>('NONE');
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Refs for syncing state inside event listeners/animation loop
  const entitiesRef = useRef(entities);
  const dimensionRef = useRef(dimension);
  const isSimulatingRef = useRef(isSimulating);
  const wPositionRef = useRef(wPosition);
  const wFovRef = useRef(wFov);
  const selectedIdRef = useRef(selectedId);
  const transformModeRef = useRef(transformMode);
  const dragAxisRef = useRef<Axis>('NONE');
  const dragStartPosRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => { entitiesRef.current = entities; }, [entities]);
  useEffect(() => { dimensionRef.current = dimension; }, [dimension]);
  useEffect(() => { isSimulatingRef.current = isSimulating; }, [isSimulating]);
  useEffect(() => { wPositionRef.current = wPosition; }, [wPosition]);
  useEffect(() => { wFovRef.current = wFov; }, [wFov]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { transformModeRef.current = transformMode; }, [transformMode]);
  useEffect(() => { dragAxisRef.current = dragAxis; }, [dragAxis]);
  useEffect(() => { dragStartPosRef.current = dragStartPos; }, [dragStartPos]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- INITIALIZATION ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0a0a);
    sceneRef.current = scene;

    const grid = new THREE.GridHelper(50, 50, 0x333333, 0x111111);
    scene.add(grid);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // GIZMOS
    const gizmoGroup = new THREE.Group();
    gizmoGroupRef.current = gizmoGroup;
    scene.add(gizmoGroup);

    // Gizmo Central Sphere (Mode Toggle)
    const centerGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, transparent: true, opacity: 0.9 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.userData = { isGizmoCenter: true };
    gizmoGroup.add(centerMesh); // child 0

    // PHYSICS DEBUG
    const physicsDebugGroup = new THREE.Group();
    physicsDebugGroupRef.current = physicsDebugGroup;
    scene.add(physicsDebugGroup);

    const createArrow = (color: number, axis: 'x'|'y'|'z'|'w') => {
        const group = new THREE.Group();
        const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
        const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
        const line = new THREE.Mesh(lineGeo, mat);
        line.userData = { axis }; 
        line.position.y = 1;

        // Translate Tip (Cone)
        const coneGeo = new THREE.ConeGeometry(0.15, 0.4, 16);
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.position.y = 2;
        cone.userData = { axis, type: 'TIP_TRANSLATE' };

        // Scale Tip (Box)
        const boxGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const box = new THREE.Mesh(boxGeo, mat);
        box.position.y = 2;
        box.userData = { axis, type: 'TIP_SCALE' };
        
        group.add(line);
        group.add(cone);
        group.add(box);

        if(axis === 'x') group.rotation.z = -Math.PI / 2;
        if(axis === 'z') group.rotation.x = Math.PI / 2;
        if(axis === 'w') { group.rotation.z = -Math.PI / 4; group.rotation.y = Math.PI / 4; }
        
        group.userData = { isGizmo: true, axis };
        return group;
    };

    gizmoGroup.add(createArrow(0xff0000, 'x')); // child 1
    gizmoGroup.add(createArrow(0x00ff00, 'y')); // child 2
    gizmoGroup.add(createArrow(0x0000ff, 'z')); // child 3
    gizmoGroup.add(createArrow(0xff00ff, 'w')); // child 4

    // --- PHYSICS ENGINE FLINT V3.0 (Updated) ---
    const solveFlintV2 = (dt: number, activeBodies: Entity[]) => {
        const subStepDt = dt / PHYSICS_SUBSTEPS;
        const sh = spatialHashRef.current;
        sh.clear();
        activeBodies.forEach(e => sh.insert(e.id, e.transform.position));

        // Get Camera Forward for Movement
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();
        const camRight = new THREE.Vector3();
        camRight.crossVectors(camForward, new THREE.Vector3(0,1,0)).normalize();

        for (let step = 0; step < PHYSICS_SUBSTEPS; step++) {
            activeBodies.forEach(entity => {
                if (entity.meshType === 'PARTICLE_SYSTEM') return; 
                if (entity.physics.type === 'FLUID') return;

                let vel = velocitiesRef.current.get(entity.id) || new THREE.Vector4(0,0,0,0);
                let angVel = angularVelocitiesRef.current.get(entity.id) || new THREE.Vector3(0,0,0);
                
                // PLAYER CONTROLLER INPUT
                if (entity.controller && entity.controller.enabled) {
                    const speed = entity.controller.moveSpeed * 20; // Force multiplier
                    if (keysRef.current['w']) {
                        vel.x += camForward.x * speed * subStepDt;
                        vel.z += camForward.z * speed * subStepDt;
                    }
                    if (keysRef.current['s']) {
                        vel.x -= camForward.x * speed * subStepDt;
                        vel.z -= camForward.z * speed * subStepDt;
                    }
                    if (keysRef.current['a']) {
                        vel.x -= camRight.x * speed * subStepDt;
                        vel.z -= camRight.z * speed * subStepDt;
                    }
                    if (keysRef.current['d']) {
                        vel.x += camRight.x * speed * subStepDt;
                        vel.z += camRight.z * speed * subStepDt;
                    }
                    if (keysRef.current[' '] && Math.abs(vel.y) < 0.1) {
                        vel.y = entity.controller.jumpForce;
                    }
                }

                if (!entity.isStatic) {
                    // Linear Dynamics
                    vel.y += GRAVITY * entity.physics.gravityScale * subStepDt;
                    vel.multiplyScalar(1 - (entity.physics.linearDamping * subStepDt));
                    
                    entity.transform.position[0] += vel.x * subStepDt;
                    entity.transform.position[1] += vel.y * subStepDt;
                    entity.transform.position[2] += vel.z * subStepDt;
                    if(entity.transform.position[3] !== undefined) entity.transform.position[3] += (vel.w || 0) * subStepDt;

                    // Angular Dynamics (Simple Euler integration)
                    angVel.multiplyScalar(1 - (entity.physics.angularDamping * subStepDt));
                    entity.transform.rotation[0] += angVel.x * subStepDt;
                    entity.transform.rotation[1] += angVel.y * subStepDt;
                    entity.transform.rotation[2] += angVel.z * subStepDt;

                    // Simple Ground Collision
                    if (entity.transform.position[1] < 0) {
                        entity.transform.position[1] = 0;
                        vel.y *= -entity.physics.restitution;
                        // Apply friction
                        vel.x *= (1 - entity.physics.friction);
                        vel.z *= (1 - entity.physics.friction);
                        
                        // Fake angular impulse on impact
                        if(Math.abs(vel.y) > 2) {
                            angVel.x += (Math.random() - 0.5) * vel.y;
                            angVel.z += (Math.random() - 0.5) * vel.y;
                        }

                        if(Math.abs(vel.y) < 0.1) vel.y = 0;
                    }
                }
                velocitiesRef.current.set(entity.id, vel);
                angularVelocitiesRef.current.set(entity.id, angVel);
            });
        }
    };

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.1);
        const currentEntities = entitiesRef.current;
        const currentDim = dimensionRef.current;
        const currentSimulating = isSimulatingRef.current;
        const currentW = wPositionRef.current;
        const currentFov = wFovRef.current;
        const currentSelectedId = selectedIdRef.current;
        const currentTransformMode = transformModeRef.current;

        // PHYSICS STEP
        if (currentSimulating) {
            const activeBodies = currentEntities.filter(e => e.physics.type !== 'NONE' || (e.controller && e.controller.enabled));
            solveFlintV2(dt, activeBodies);
        }

        // Cleanup
        const activeIds = new Set(currentEntities.map(e => e.id));
        meshesRef.current.forEach((obj, id) => {
            if (!activeIds.has(id)) {
                sceneRef.current?.remove(obj);
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                meshesRef.current.delete(id);
                emberSystemsRef.current.delete(id);
            }
        });

        // UPDATE GIZMO & PHYSICS VISUALIZATION
        if (physicsDebugGroupRef.current) physicsDebugGroupRef.current.clear();
        
        const selectedEntity = currentEntities.find(e => e.id === currentSelectedId);
        if (selectedEntity && gizmoGroupRef.current && physicsDebugGroupRef.current) {
            gizmoGroupRef.current.visible = true;
            gizmoGroupRef.current.position.set(
                selectedEntity.transform.position[0],
                selectedEntity.transform.position[1],
                selectedEntity.transform.position[2]
            );

            // Toggle Gizmo Tips based on Mode
            for(let i=1; i<=4; i++) {
                const arrowGroup = gizmoGroupRef.current.children[i];
                if(arrowGroup) {
                    const cone = arrowGroup.children.find(c => c.userData.type === 'TIP_TRANSLATE');
                    const box = arrowGroup.children.find(c => c.userData.type === 'TIP_SCALE');
                    if(cone) cone.visible = currentTransformMode === 'TRANSLATE';
                    if(box) box.visible = currentTransformMode === 'SCALE';
                }
            }
            gizmoGroupRef.current.children[4].visible = currentDim === RenderDimension.D4;

            // DRAW PHYSICS WIREFRAME
            if (selectedEntity.physics.type !== 'NONE') {
                let physGeom: THREE.BufferGeometry | null = null;
                const s = selectedEntity.transform.scale;
                
                // Approximate physics shape based on mesh type
                if (selectedEntity.meshType === 'SPHERE') physGeom = new THREE.SphereGeometry(0.5, 16, 16);
                else if (selectedEntity.meshType === 'CYLINDER') physGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
                else physGeom = new THREE.BoxGeometry(1, 1, 1); // Default Box
                
                const wireframe = new THREE.WireframeGeometry(physGeom);
                const line = new THREE.LineSegments(wireframe);
                // Color Code: Green = Trigger, Orange = Collider
                const color = selectedEntity.physics.isTrigger ? 0x00ff00 : 0xff9d5c;
                (line.material as THREE.LineBasicMaterial).color.setHex(color);
                (line.material as THREE.LineBasicMaterial).depthTest = false;
                (line.material as THREE.LineBasicMaterial).opacity = 0.5;
                (line.material as THREE.LineBasicMaterial).transparent = true;
                
                line.position.copy(gizmoGroupRef.current.position);
                line.rotation.set(selectedEntity.transform.rotation[0], selectedEntity.transform.rotation[1], selectedEntity.transform.rotation[2]);
                line.scale.set(s[0], s[1], s[2]);
                
                physicsDebugGroupRef.current.add(line);
            }

        } else if (gizmoGroupRef.current) {
            gizmoGroupRef.current.visible = false;
        }

        currentEntities.forEach(ent => {
            let obj = meshesRef.current.get(ent.id);
            const isParticle = ent.meshType === 'PARTICLE_SYSTEM';
            
            if (obj && obj.userData.meshType !== ent.meshType) {
                sceneRef.current?.remove(obj);
                meshesRef.current.delete(ent.id);
                obj = undefined;
            }

            if (!obj) {
                // ... (Mesh Creation - Re-using logic) ...
                let geom: THREE.BufferGeometry;
                if (isParticle) {
                    const cfg = ent.particleConfig || { count: 1000, life: 2.0, speed: 1.0, size: 0.1, emissionRate: 50, colorStart: "#ff5e3a", colorEnd: "#000000", spread: [1,1,1], wSpread: 2.0, wVelocity: 0.1, hyperGravity: 0 };
                    const pGeom = new THREE.BufferGeometry();
                    const positions = new Float32Array(cfg.count * 3);
                    const colors = new Float32Array(cfg.count * 3);
                    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    pGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                    const pMat = new THREE.PointsMaterial({ size: cfg.size, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
                    obj = new THREE.Points(pGeom, pMat);
                    obj.frustumCulled = false;
                    const pos = new Float32Array(cfg.count * 4); 
                    const vel = new Float32Array(cfg.count * 4); 
                    const life = new Float32Array(cfg.count);
                    const age = new Float32Array(cfg.count);
                    for(let i=0; i<cfg.count; i++) { age[i] = Math.random() * cfg.life; life[i] = cfg.life; }
                    emberSystemsRef.current.set(ent.id, { pos, vel, life, age, config: cfg });
                } else {
                    const mat = new THREE.MeshStandardMaterial({ color: ent.color, roughness: ent.material.roughness, metalness: ent.material.metalness, side: THREE.DoubleSide });
                    switch(ent.meshType) {
                        case 'SPHERE': geom = new THREE.SphereGeometry(0.5, 32, 32); break;
                        case 'CYLINDER': geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
                        case 'CONE': geom = new THREE.ConeGeometry(0.5, 1, 32); break;
                        case 'TORUS': geom = new THREE.TorusGeometry(0.4, 0.15, 16, 32); break;
                        case 'PLANE': geom = new THREE.PlaneGeometry(1, 1); break;
                        case 'CUSTOM_MESH': 
                            geom = new THREE.BufferGeometry();
                            if(ent.customGeometry) {
                                const v = new Float32Array(ent.customGeometry.vertices);
                                if(ent.customGeometry.stride === 4) {
                                    mesh4DCacheRef.current.set(ent.id, v);
                                    const v3 = []; for(let i=0;i<v.length;i+=4)v3.push(v[i],v[i+1],v[i+2]);
                                    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v3),3));
                                } else geom.setAttribute('position', new THREE.BufferAttribute(v,3));
                                if(ent.customGeometry.indices) geom.setIndex(ent.customGeometry.indices);
                                geom.computeVertexNormals();
                            }
                            break;
                        default: geom = new THREE.BoxGeometry(1, 1, 1);
                    }
                    obj = new THREE.Mesh(geom, mat);
                    obj.castShadow = true; obj.receiveShadow = true;
                    if(ent.meshType === 'PLANE') obj.rotation.x = -Math.PI / 2;
                }
                obj.userData.meshType = ent.meshType;
                sceneRef.current?.add(obj);
                meshesRef.current.set(ent.id, obj);
            }

            // Updates
            if (isParticle && obj instanceof THREE.Points) {
                const system = emberSystemsRef.current.get(ent.id);
                if (system) {
                    const { pos, vel, life, age, config } = system;
                    const pointsPos = obj.geometry.attributes.position;
                    const pointsCol = obj.geometry.attributes.color;
                    const center = ent.transform.position;
                    const c1 = new THREE.Color(config.colorStart);
                    const c2 = new THREE.Color(config.colorEnd);
                    const fovScale = currentFov / 45.0; 

                    for (let i = 0; i < config.count; i++) {
                        age[i] += dt;
                        if (age[i] >= life[i]) {
                             age[i] = 0;
                             pos[i*4] = center[0] + randRange(-config.spread[0], config.spread[0]);
                             pos[i*4+1] = center[1] + randRange(-config.spread[1], config.spread[1]);
                             pos[i*4+2] = center[2] + randRange(-config.spread[2], config.spread[2]);
                             pos[i*4+3] = (center[3] || 0) + randRange(-config.wSpread, config.wSpread);
                             vel[i*4] = randRange(-1, 1) * config.speed;
                             vel[i*4+1] = randRange(0, 2) * config.speed;
                             vel[i*4+2] = randRange(-1, 1) * config.speed;
                             vel[i*4+3] = randRange(-1, 1) * config.wVelocity;
                        } else {
                             pos[i*4] += vel[i*4] * dt;
                             pos[i*4+1] += vel[i*4+1] * dt;
                             pos[i*4+2] += vel[i*4+2] * dt;
                             pos[i*4+3] += vel[i*4+3] * dt;
                        }
                        const w = pos[i*4+3];
                        const wDelta = 4.0 - (w - currentW);
                        const scale = currentDim === RenderDimension.D4 
                            ? (wDelta > 0.1 ? (4.0 * fovScale) / wDelta : 0.001) 
                            : 1;
                            
                        pointsPos.setXYZ(i, pos[i*4] * scale, pos[i*4+1] * scale, pos[i*4+2] * scale);
                        const t = age[i] / life[i];
                        pointsCol.setXYZ(i, c1.r * (1-t) + c2.r * t, c1.g * (1-t) + c2.g * t, c1.b * (1-t) + c2.b * t);
                    }
                    pointsPos.needsUpdate = true;
                    pointsCol.needsUpdate = true;
                    obj.position.set(0,0,0); obj.scale.set(1,1,1); obj.rotation.set(0,0,0);
                }
            } else if (obj) {
                // Apply Transform
                obj.position.set(ent.transform.position[0], ent.transform.position[1], ent.transform.position[2]);
                obj.rotation.set(ent.transform.rotation[0], ent.transform.rotation[1], ent.transform.rotation[2]);
                obj.scale.set(ent.transform.scale[0], ent.transform.scale[1], ent.transform.scale[2]);
                
                if (currentDim === RenderDimension.D4 && mesh4DCacheRef.current.has(ent.id) && obj instanceof THREE.Mesh) {
                     const raw4D = mesh4DCacheRef.current.get(ent.id)!;
                     const posAttr = obj.geometry.attributes.position;
                     const fovScale = currentFov / 45.0;

                     for(let i=0, j=0; i<raw4D.length; i+=4, j+=3) {
                         const x = raw4D[i], y = raw4D[i+1], z = raw4D[i+2], w = raw4D[i+3];
                         const wDelta = 4.0 - (w - currentW);
                         const scale = wDelta > 0.1 ? (4.0 * fovScale) / wDelta : 0.001;
                         posAttr.setXYZ(j/3, x * scale, y * scale, z * scale);
                     }
                     posAttr.needsUpdate = true;
                }
                
                if (currentDim === RenderDimension.D4 && !isParticle) {
                     const wObj = ent.transform.position[3] || 0;
                     const wDist = Math.abs(wObj - currentW);
                     const opacity = Math.exp(-Math.pow(wDist, 2) * (200 / currentFov)); 
                     
                     const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
                     if(mat) { 
                         mat.transparent = true; 
                         mat.opacity = opacity; 
                         mat.depthWrite = opacity > 0.8; 
                     }
                     obj.visible = opacity > 0.05;
                } else if(!isParticle) {
                     const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
                     if(mat) { mat.opacity = 1; mat.transparent = false; }
                     obj.visible = true;
                }
            }
        });

        if (controlsRef.current) controlsRef.current.update();
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };

    animate();

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        rendererRef.current?.domElement.removeEventListener('mousedown', handleCanvasMouseDown);
        rendererRef.current?.dispose();
        if(containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); 

  // Event Handlers
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
      const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      }
  }, []);

  const handleCanvasMouseDown = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(gizmoGroupRef.current!.children, true);

      if (intersects.length > 0) {
            let obj = intersects[0].object;
            if (obj.userData.isGizmoCenter) {
                setTransformMode(prev => prev === 'TRANSLATE' ? 'SCALE' : 'TRANSLATE');
                return; 
            }
            let axis: string | null = obj.userData.axis;
            if(!axis && obj.parent) axis = obj.parent.userData.axis;
            if (axis) {
                if(controlsRef.current) controlsRef.current.enabled = false;
                setDragAxis(axis.toUpperCase() as Axis);
                setDragStartPos({ x: e.clientX, y: e.clientY });
            }
      }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragAxisRef.current === 'NONE' || !dragStartPosRef.current || !selectedIdRef.current) return;
      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;
      const moveSpeed = 0.02;
      const entities = entitiesRef.current;
      const entity = entities.find(ent => ent.id === selectedIdRef.current);
      const isScale = transformModeRef.current === 'SCALE';

      if(entity) {
          // Create new object for immutability during update
          const newEntity = { ...entity, transform: { ...entity.transform, position: [...entity.transform.position] as any, scale: [...entity.transform.scale] as any } };
          
          if (dragAxisRef.current === 'X') {
              if (isScale) newEntity.transform.scale[0] += deltaX * moveSpeed;
              else newEntity.transform.position[0] += deltaX * moveSpeed;
          }
          if (dragAxisRef.current === 'Y') {
              if (isScale) newEntity.transform.scale[1] -= deltaY * moveSpeed;
              else newEntity.transform.position[1] -= deltaY * moveSpeed;
          }
          if (dragAxisRef.current === 'Z') {
              if (isScale) newEntity.transform.scale[2] += deltaX * moveSpeed;
              else newEntity.transform.position[2] += deltaX * moveSpeed;
          }
          if (dragAxisRef.current === 'W') {
              if (isScale) {
                  if(newEntity.transform.scale[3] === undefined) newEntity.transform.scale[3] = 1;
                  newEntity.transform.scale[3] -= deltaY * moveSpeed;
              } else {
                  if(newEntity.transform.position[3] === undefined) newEntity.transform.position[3] = 0;
                  newEntity.transform.position[3] += deltaY * moveSpeed;
              }
          }
          
          setDragStartPos({ x: e.clientX, y: e.clientY });
          // Live update, no commit to history yet
          const updatedEntities = entities.map(e => e.id === newEntity.id ? newEntity : e);
          onEntitiesChange(updatedEntities, false);
      }
  };

  const handleGlobalMouseUp = () => {
      if (dragAxisRef.current !== 'NONE') {
          // Commit the final state to history
          onEntitiesChange(entitiesRef.current, true);

          setDragAxis('NONE');
          if(controlsRef.current) controlsRef.current.enabled = true;
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const hierarchyId = e.dataTransfer.getData('ignis/hierarchy-id');
      if (hierarchyId && containerRef.current && cameraRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const target = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, target);
          if (target) {
             const updated = entities.map(ent => 
                 ent.id === hierarchyId 
                 ? { ...ent, transform: { ...ent.transform, position: [target.x, target.y + 1, target.z, ent.transform.position[3]] as any } }
                 : ent
             );
             onEntitiesChange(updated, true);
          }
      }
  };

  useEffect(() => {
      if(!rendererRef.current) return;
      const canvas = rendererRef.current.domElement;
      canvas.addEventListener('mousedown', handleCanvasMouseDown);
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
          canvas.removeEventListener('mousedown', handleCanvasMouseDown);
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      }
  }, []);

  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full transition-all ${isDragOver ? 'ring-2 ring-[#ff5e3a] bg-white/5' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
    />
  );
};

export default Viewport;
