
import React, { useState } from 'react';

interface DocItem {
  name: string;
  desc: string;
  category: string;
}

const TendrDocs: React.FC = () => {
  const [selected, setSelected] = useState<DocItem | null>(null);

  const library = [
    // --- PHYSICS V3 ---
    { category: 'Physics', name: 'add_torque(vec3)', desc: 'Applies rotational force (torque) to a rigid body.' },
    { category: 'Physics', name: 'get_angular_velocity()', desc: 'Returns the current angular velocity as Vec3.' },
    { category: 'Physics', name: 'set_angular_damping(float)', desc: 'Sets the resistance to rotation.' },
    
    // --- QUANTUM PHYSICS ---
    { category: 'Quantum', name: 'q_entangle(A, B)', desc: 'Links state of two entities. If A collapses, B collapses to complement.' },
    { category: 'Quantum', name: 'q_superpose(val1, val2)', desc: 'Creates a superposition. Returns a Schrödinger value.' },
    { category: 'Quantum', name: 'q_tunnel(entity, wall)', desc: 'Calculates probability of entity passing through solid collider.' },
    { category: 'Quantum', name: 'q_observe(state)', desc: 'Forces a quantum state to collapse to a definitive value.' },
    { category: 'Quantum', name: 'q_probability_cloud(pos, radius)', desc: 'Generates potential positions for next frame.' },
    
    // --- TEMPORAL (TIME) ---
    { category: 'Temporal', name: 'retro_causality(t)', desc: 'Fetches variable value from t seconds ago.' },
    { category: 'Temporal', name: 'future_sight(t)', desc: 'Predicts physics state t seconds ahead using deterministic simulation.' },
    { category: 'Temporal', name: 'time_dilate(zone, factor)', desc: 'Slows down delta_time within a spatial bounds.' },
    { category: 'Temporal', name: 'chronolock(entity)', desc: 'Freezes an entity in time while allowing external forces to accumulate.' },
    { category: 'Temporal', name: 'reverse_entropy(region)', desc: 'Reverses physics simulation in a specific area.' },

    // --- HYPER MATH (4D+) ---
    { category: 'HyperMath', name: 'vec4_cross_ternary(a,b,c)', desc: 'Cross product for 4D vectors.' },
    { category: 'HyperMath', name: 'rotor_from_planes(p1, p2)', desc: 'Generates a 4D rotation rotor.' },
    { category: 'HyperMath', name: 'tesseract_projection(v4, w_cam)', desc: 'Projects 4D point to 3D space.' },
    { category: 'HyperMath', name: 'ana_kata_vector()', desc: 'Returns the Unit Vector for the 4th dimension.' },
    { category: 'HyperMath', name: 'hyper_distance(p1, p2)', desc: 'Distance calculation including W-axis.' },

    // --- THERMODYNAMICS ---
    { category: 'Thermodynamics', name: 'thermal_transfer(a, b)', desc: 'Calculates heat exchange based on surface area/conductivity.' },
    { category: 'Thermodynamics', name: 'phase_change_check(mat)', desc: 'Checks if material should melt, freeze, or sublimate.' },
    { category: 'Thermodynamics', name: 'combustion_rate(fuel, o2)', desc: 'Returns energy output of burning reaction.' },
    { category: 'Thermodynamics', name: 'apply_convection(fluid)', desc: 'Simulates heat rising in fluid volumes.' },

    // --- FLUID DYNAMICS ---
    { category: 'Fluids', name: 'navier_stokes_step(grid)', desc: 'One step of incompressible fluid solver.' },
    { category: 'Fluids', name: 'vorticity_confinement(vel)', desc: 'Adds small scale details to fluid swirls.' },
    { category: 'Fluids', name: 'surface_tension_force(surf)', desc: 'Calculates minimizing force for droplets.' },
    { category: 'Fluids', name: 'buoyancy_calc(density, vol)', desc: 'Returns upward force vector.' },

    // --- LOGIC / AI ---
    { category: 'Logic', name: 'fuzzy_and(a, b)', desc: 'Fuzzy logic AND gate (returns min).' },
    { category: 'Logic', name: 'fuzzy_or(a, b)', desc: 'Fuzzy logic OR gate (returns max).' },
    { category: 'Logic', name: 'neural_predict(model, inputs)', desc: 'Runs inference on embedded ONNX model.' },
    { category: 'Logic', name: 'wave_function_collapse(grid)', desc: 'Proc-gen constraint solver.' },
    
    // --- AUDIO ---
    { category: 'Audio', name: 'doppler_shift(src, list)', desc: 'Calculates frequency shift based on velocity.' },
    { category: 'Audio', name: 'raytrace_reverb(room)', desc: 'Calculates impulse response of geometry.' },
    { category: 'Audio', name: 'granular_synth(sample)', desc: 'Generates texture from audio grains.' },

    // --- SYSTEM ---
    { category: 'System', name: 'alloc_arena(size)', desc: 'Creates a linear memory arena.' },
    { category: 'System', name: 'simd_batch_process(arr)', desc: 'Processes array using AVX-512.' },
    { category: 'System', name: 'hot_reload_module(name)', desc: 'Reloads logic without stopping engine.' },
    { category: 'System', name: 'garbage_collect_region(id)', desc: 'Manually clears a memory region.' },

    // --- RENDER ---
    { category: 'Render', name: 'raymarch_step(sdf)', desc: 'Steps ray for volumetric rendering.' },
    { category: 'Render', name: 'compute_caustics(light)', desc: 'Generates light patterns from transparent surfaces.' },
    { category: 'Render', name: 'temporal_denoise(curr, prev)', desc: 'Cleans up raytracing noise.' },
  ];

  return (
    <div className="w-full h-full bg-[#120a0a] p-8 overflow-hidden flex flex-col">
       <div className="mb-6">
           <h1 className="text-4xl font-black text-[#ff9d5c]">Tendra API v0.7.5b (Build 1)</h1>
           <p className="text-xs text-gray-500 font-mono">60+ New Functions Added (Physics V3)</p>
       </div>
       
       <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
           {library.map((item, i) => (
               <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                   <div className="flex justify-between mb-2">
                       <span className="text-[9px] font-black uppercase text-[#ff5e3a] bg-[#ff5e3a]/10 px-2 rounded">{item.category}</span>
                   </div>
                   <h3 className="text-xs font-bold text-white font-mono mb-1">{item.name}</h3>
                   <p className="text-[10px] text-gray-400">{item.desc}</p>
               </div>
           ))}
       </div>
    </div>
  );
};

export default TendrDocs;
