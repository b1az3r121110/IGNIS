
import React from 'react';
import { Entity, RenderDimension, LevelData } from '../../types';

interface InspectorProps {
  entity?: Entity;
  onUpdate: (updated: Entity, commit: boolean) => void;
  dimension: RenderDimension;
  scripts?: string[];
  levels?: LevelData[];
}

const Inspector: React.FC<InspectorProps> = ({ entity, onUpdate, scripts, levels }) => {
  if (!entity) return <div className="w-80 firewatch-panel h-full border-l border-[#333] p-12 text-center opacity-30 text-xs font-black uppercase flex items-center justify-center">Select Object</div>;

  const update = (key: keyof Entity, val: any, commit: boolean) => onUpdate({ ...entity, [key]: val }, commit);
  
  const updatePhysics = (key: string, val: any, commit: boolean) => 
    onUpdate({ ...entity, physics: { ...entity.physics, [key]: val } }, commit);
  
  const updateParticles = (key: string, val: any, commit: boolean) => {
      if(!entity.particleConfig) return;
      onUpdate({ ...entity, particleConfig: { ...entity.particleConfig, [key]: val } }, commit);
  };
  
  // Helpers for Inputs to reduce verbosity
  // Text/Number inputs: onChange updates view (no commit), onBlur commits history.
  // Checkboxes/Selects: onChange commits immediately.
  // Range sliders: onChange updates view, onMouseUp commits.

  return (
    <div className="w-80 firewatch-panel h-full border-l border-[#333] flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-white/5 bg-black/40 sticky top-0 z-10">
        <span className="text-[10px] font-black uppercase text-[#ff9d5c] tracking-widest mb-4 block opacity-50"># {entity.id}</span>
        <input 
          value={entity.name} 
          onChange={(e) => update('name', e.target.value, false)} 
          onBlur={(e) => update('name', e.target.value, true)}
          className="w-full bg-transparent border-none text-xl font-black outline-none text-[#fef9f3] focus:text-[#ff9d5c] transition-colors" 
        />
      </div>

      <div className="p-6 space-y-8 pb-20">
        
        {/* PARTICLE SYSTEM CONFIG (EMBER) */}
        {entity.meshType === 'PARTICLE_SYSTEM' && entity.particleConfig && (
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <i className="fas fa-wind text-[#ff9d5c] text-[10px]"></i>
                    <h3 className="text-[9px] font-black uppercase tracking-widest opacity-60">Ember Engine 4D</h3>
                </div>
                
                <div className="bg-white/5 p-4 rounded-xl space-y-3">
                    <h4 className="text-[8px] font-bold text-gray-500 uppercase">Emission & Life</h4>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">Count</label>
                             <input type="number" value={entity.particleConfig.count} 
                                onChange={e => updateParticles('count', parseInt(e.target.value), false)} 
                                onBlur={e => updateParticles('count', parseInt(e.target.value), true)}
                                className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/>
                         </div>
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">Life (sec)</label>
                             <input type="number" step="0.1" value={entity.particleConfig.life} 
                                onChange={e => updateParticles('life', parseFloat(e.target.value), false)}
                                onBlur={e => updateParticles('life', parseFloat(e.target.value), true)}
                                className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/>
                         </div>
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">Speed</label>
                             <input type="number" step="0.1" value={entity.particleConfig.speed} 
                                onChange={e => updateParticles('speed', parseFloat(e.target.value), false)}
                                onBlur={e => updateParticles('speed', parseFloat(e.target.value), true)}
                                className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/>
                         </div>
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">Size</label>
                             <input type="number" step="0.01" value={entity.particleConfig.size} 
                                onChange={e => updateParticles('size', parseFloat(e.target.value), false)}
                                onBlur={e => updateParticles('size', parseFloat(e.target.value), true)}
                                className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/>
                         </div>
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl space-y-3">
                     <h4 className="text-[8px] font-bold text-gray-500 uppercase">4D Hyper-Physics</h4>
                     <div className="space-y-2">
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">W-Spread</label>
                             <input type="range" min="0" max="10" step="0.1" value={entity.particleConfig.wSpread} 
                                onChange={e => updateParticles('wSpread', parseFloat(e.target.value), false)}
                                onMouseUp={e => updateParticles('wSpread', parseFloat((e.target as HTMLInputElement).value), true)}
                                className="accent-[#ff5e3a] h-1 bg-black/40 rounded-full"/>
                         </div>
                         <div className="flex flex-col">
                             <label className="text-[7px] text-gray-400">W-Velocity</label>
                             <input type="range" min="0" max="5" step="0.1" value={entity.particleConfig.wVelocity} 
                                onChange={e => updateParticles('wVelocity', parseFloat(e.target.value), false)}
                                onMouseUp={e => updateParticles('wVelocity', parseFloat((e.target as HTMLInputElement).value), true)}
                                className="accent-[#ff5e3a] h-1 bg-black/40 rounded-full"/>
                         </div>
                     </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl space-y-3">
                     <h4 className="text-[8px] font-bold text-gray-500 uppercase">Color Ramp</h4>
                     <div className="flex gap-2">
                         <input type="color" value={entity.particleConfig.colorStart} onChange={e => updateParticles('colorStart', e.target.value, true)} className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer" />
                         <i className="fas fa-arrow-right text-gray-600 self-center"></i>
                         <input type="color" value={entity.particleConfig.colorEnd} onChange={e => updateParticles('colorEnd', e.target.value, true)} className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer" />
                     </div>
                </div>
            </section>
        )}

        {/* GAME LOGIC / LEVEL PORTAL / INTERACTION */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <i className="fas fa-gamepad text-[#ff9d5c] text-[10px]"></i>
                <h3 className="text-[9px] font-black uppercase tracking-widest opacity-60">Gameplay</h3>
            </div>

            <div className="bg-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Interactable?</span>
                    <input type="checkbox" checked={entity.interactable || false} onChange={e => update('interactable', e.target.checked, true)} className="accent-[#ff5e3a]" />
                </div>
                {entity.interactable && (
                    <div className="space-y-1">
                        <label className="text-[7px] font-bold text-gray-500 uppercase">Prompt Text</label>
                        <input 
                            value={entity.interactionText || ''} 
                            onChange={e => update('interactionText', e.target.value, false)} 
                            onBlur={e => update('interactionText', e.target.value, true)}
                            placeholder="Press E to..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#ff5e3a]"
                        />
                    </div>
                )}
            </div>

            <div className="bg-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Is Level Portal?</span>
                    <input type="checkbox" checked={entity.isPortal || false} onChange={e => update('isPortal', e.target.checked, true)} className="accent-[#ff5e3a]" />
                </div>
                
                {entity.isPortal && (
                    <div className="space-y-1">
                        <label className="text-[7px] font-bold text-gray-500 uppercase">Target Level</label>
                        <select 
                            value={entity.targetLevelId || ''}
                            onChange={e => update('targetLevelId', e.target.value, true)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#ff5e3a]"
                        >
                            <option value="">Select Level...</option>
                            {levels?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <div className="text-[8px] text-gray-500">Player hitting this object will load the target level.</div>
                    </div>
                )}
            </div>

             <div className="bg-white/5 p-4 rounded-xl space-y-2">
                <label className="text-[7px] font-bold text-gray-500 uppercase">Attached Script</label>
                <select 
                    value={entity.scriptId || ''} 
                    onChange={e => update('scriptId', e.target.value, true)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#ff5e3a]"
                >
                    <option value="">None</option>
                    {scripts?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {entity.scriptId && <div className="text-[9px] text-green-500 flex items-center gap-1"><i className="fas fa-check-circle"></i> Active</div>}
            </div>
        </section>

        {/* PHYSICS ENGINE CONFIG */}
        {entity.meshType !== 'PARTICLE_SYSTEM' && (
        <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <i className="fas fa-atom text-[#ff9d5c] text-[10px]"></i>
                <h3 className="text-[9px] font-black uppercase tracking-widest opacity-60">Physics Engine V2.6</h3>
            </div>
            
            <div className="flex gap-2 flex-wrap">
                 {['RIGID', 'SOFT', 'FLUID', 'QUANTUM'].map(t => (
                     <button 
                        key={t}
                        onClick={() => updatePhysics('type', t, true)}
                        className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${entity.physics.type === t ? 'bg-[#ff5e3a] border-[#ff5e3a] text-white' : 'border-white/10 text-gray-500'}`}
                     >{t}</button>
                 ))}
            </div>
             <div className="flex items-center justify-between mt-2">
                 <span className="text-[8px] font-bold text-gray-500 uppercase">Is Trigger?</span>
                 <input type="checkbox" checked={entity.physics.isTrigger} onChange={e => updatePhysics('isTrigger', e.target.checked, true)} className="accent-[#ff5e3a]"/>
             </div>

            {/* CLASSIC PROPS */}
            <div className="bg-white/5 p-4 rounded-xl space-y-3">
                <h4 className="text-[8px] font-bold text-gray-500 uppercase">Classic Dynamics</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Mass</label><input type="number" value={entity.physics.mass} onChange={e => updatePhysics('mass', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('mass', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Friction</label><input type="number" value={entity.physics.friction} onChange={e => updatePhysics('friction', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('friction', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Restitution</label><input type="number" value={entity.physics.restitution} onChange={e => updatePhysics('restitution', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('restitution', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Gravity Scale</label><input type="number" value={entity.physics.gravityScale} onChange={e => updatePhysics('gravityScale', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('gravityScale', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                </div>
            </div>

            {/* ADVANCED PROPS */}
            <div className="bg-white/5 p-4 rounded-xl space-y-3">
                <h4 className="text-[8px] font-bold text-gray-500 uppercase">Advanced Materials</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Elasticity</label><input type="number" value={entity.physics.elasticity || 0} onChange={e => updatePhysics('elasticity', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('elasticity', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Viscosity</label><input type="number" value={entity.physics.viscosity || 0} onChange={e => updatePhysics('viscosity', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('viscosity', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Drag Coeff</label><input type="number" value={entity.physics.dragCoefficient || 0} onChange={e => updatePhysics('dragCoefficient', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('dragCoefficient', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                    <div className="flex flex-col"><label className="text-[7px] text-gray-400">Fracture Force</label><input type="number" value={entity.physics.fractureThreshold || 0} onChange={e => updatePhysics('fractureThreshold', parseFloat(e.target.value), false)} onBlur={e => updatePhysics('fractureThreshold', parseFloat(e.target.value), true)} className="bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px]"/></div>
                </div>
            </div>

            {/* COMMERCIAL (Thermodynamics) */}
            <div className="bg-white/5 p-4 rounded-xl space-y-3">
                <h4 className="text-[8px] font-bold text-gray-500 uppercase">Thermodynamics</h4>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[9px] font-mono text-gray-300">
                        <span>Temp: {entity.physics.temperature || 20}°C</span>
                    </div>
                    <input type="range" min="-100" max="1000" value={entity.physics.temperature || 20} 
                        onChange={e => updatePhysics('temperature', parseFloat(e.target.value), false)} 
                        onMouseUp={e => updatePhysics('temperature', parseFloat((e.target as HTMLInputElement).value), true)} 
                        className="accent-[#ff5e3a] h-1 bg-black/40 rounded-full w-full"/>
                    
                    <div className="flex justify-between text-[9px] font-mono text-gray-300">
                        <span>Conductivity</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={entity.physics.thermalConductivity || 0} 
                        onChange={e => updatePhysics('thermalConductivity', parseFloat(e.target.value), false)} 
                        onMouseUp={e => updatePhysics('thermalConductivity', parseFloat((e.target as HTMLInputElement).value), true)}
                        className="accent-blue-500 h-1 bg-black/40 rounded-full w-full"/>
                </div>
            </div>

            {/* QUANTUM */}
            {entity.physics.type === 'QUANTUM' && (
                <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl space-y-3">
                    <h4 className="text-[8px] font-bold text-purple-400 uppercase">Quantum State</h4>
                    <div className="flex flex-col gap-2">
                        <select 
                            value={entity.physics.quantumState || 'COLLAPSED'}
                            onChange={e => updatePhysics('quantumState', e.target.value, true)}
                            className="bg-black/40 border border-purple-500/30 text-[9px] text-purple-300 rounded p-1 outline-none"
                        >
                            <option value="COLLAPSED">COLLAPSED (Newtonian)</option>
                            <option value="SUPERPOSITION">SUPERPOSITION (Schrödinger)</option>
                            <option value="ENTANGLED">ENTANGLED (Bell State)</option>
                        </select>
                        <div className="flex flex-col">
                            <label className="text-[7px] text-purple-400">Probability Cloud (0-1)</label>
                            <input type="number" step="0.01" value={entity.physics.probabilityCloud || 0} 
                                onChange={e => updatePhysics('probabilityCloud', parseFloat(e.target.value), false)}
                                onBlur={e => updatePhysics('probabilityCloud', parseFloat(e.target.value), true)}
                                className="bg-black/40 border border-purple-500/30 rounded px-2 py-1 text-[10px] text-white"/>
                        </div>
                    </div>
                </div>
            )}

        </section>
        )}

      </div>
    </div>
  );
};

export default Inspector;
