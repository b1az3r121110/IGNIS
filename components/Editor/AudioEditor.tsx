
import React, { useRef, useEffect, useState } from 'react';
import { Entity, Asset } from '../../types';

interface AudioEditorProps {
  entities: Entity[];
  onUpdateEntity: (e: Entity) => void;
  assets?: Asset[];
  setAssets?: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const AudioEditor: React.FC<AudioEditorProps> = ({ entities, onUpdateEntity, assets, setAssets }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'SOURCES' | 'MIXER'>('SOURCES');

  // Audio Engine State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null); 
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  
  // EQ Nodes
  const eqLowRef = useRef<BiquadFilterNode | null>(null);
  const eqMidRef = useRef<BiquadFilterNode | null>(null);
  const eqHighRef = useRef<BiquadFilterNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedBuffer, setImportedBuffer] = useState<AudioBuffer | null>(null);

  // Mixer State
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [eqLow, setEqLow] = useState(0.0);
  const [eqMid, setEqMid] = useState(0.0);
  const [eqHigh, setEqHigh] = useState(0.0);

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const handleImportAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const ctx = initAudio();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setImportedBuffer(audioBuffer);
      
      if (selectedEntity) {
          onUpdateEntity({
              ...selectedEntity,
              audio: { ...selectedEntity.audio!, clip: file.name }
          });
          alert(`Loaded ${file.name} to selected entity.`);
      } else {
          alert(`Loaded ${file.name} into buffer. Select an entity to assign.`);
      }
  };

  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              const chunks: BlobPart[] = [];
              
              recorder.ondataavailable = e => chunks.push(e.data);
              
              recorder.onstop = async () => {
                  const blob = new Blob(chunks, { type: 'audio/webm' });
                  
                  // Convert to Base64 to store in Asset logic (simplified for persistent storage demo)
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = () => {
                      const base64data = reader.result;
                      
                      // Create New Asset
                      if (setAssets) {
                          const assetName = `Recording_${Date.now()}.webm`;
                          const newAsset: Asset = {
                              id: `rec_${Date.now()}`,
                              name: assetName,
                              type: 'AUDIO',
                              icon: 'fa-microphone',
                              size: `${(blob.size / 1024).toFixed(1)} KB`,
                              data: base64data // Storing dataUrl here for easy playback later
                          };
                          setAssets(prev => [...prev, newAsset]);
                          
                          // Assign to current entity if selected
                          if(selectedEntity) {
                              onUpdateEntity({
                                  ...selectedEntity,
                                  audio: { ...selectedEntity.audio!, clip: assetName }
                              });
                          }
                          
                          alert(`Recording saved as asset: ${assetName}`);
                      }
                  };
              };
              
              recorder.start();
              mediaRecorderRef.current = recorder;
              setIsRecording(true);
          } catch (e) {
              console.error(e);
              alert("Microphone access denied.");
          }
      }
  };

  const togglePlayback = () => {
    const ctx = initAudio();

    if (isPlaying) {
      if (oscillatorRef.current) { try { oscillatorRef.current.stop(); } catch(e) {} oscillatorRef.current.disconnect(); oscillatorRef.current = null; }
      if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} audioSourceRef.current.disconnect(); audioSourceRef.current = null; }
      setIsPlaying(false);
    } else {
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();
      
      const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 320; low.gain.value = eqLow; eqLowRef.current = low;
      const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.gain.value = eqMid; eqMidRef.current = mid;
      const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 3200; high.gain.value = eqHigh; eqHighRef.current = high;

      let sourceNode: AudioNode;

      // Check if clip matches an asset with data
      const clipAsset = assets?.find(a => a.name === selectedEntity?.audio?.clip);

      if (clipAsset && clipAsset.data) {
          // Play from Asset Data (Base64)
           const fetchAudio = async () => {
              const res = await fetch(clipAsset.data);
              const buf = await res.arrayBuffer();
              const audioBuf = await ctx.decodeAudioData(buf);
              const source = ctx.createBufferSource();
              source.buffer = audioBuf;
              source.start();
              source.onended = () => setIsPlaying(false);
              audioSourceRef.current = source;
              
              source.connect(filter);
              filter.connect(low); low.connect(mid); mid.connect(high); high.connect(gain); gain.connect(panner); panner.connect(analyser); analyser.connect(ctx.destination);
           };
           fetchAudio();
           sourceNode = ctx.createOscillator(); // Dummy return to satisfy flow, actual connect happens async
      } else if (importedBuffer && selectedEntity?.audio?.clip?.includes('.')) {
          const source = ctx.createBufferSource();
          source.buffer = importedBuffer;
          source.start();
          audioSourceRef.current = source;
          sourceNode = source;
          sourceNode.connect(filter);
          filter.connect(low); low.connect(mid); mid.connect(high); high.connect(gain); gain.connect(panner); panner.connect(analyser); analyser.connect(ctx.destination);
      } else {
          const osc = ctx.createOscillator();
          osc.type = selectedEntity?.audio?.clip?.includes('engine') ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(440 * (selectedEntity?.audio?.pitch || 1), ctx.currentTime);
          osc.start();
          oscillatorRef.current = osc;
          sourceNode = osc;
          sourceNode.connect(filter);
          filter.connect(low); low.connect(mid); mid.connect(high); high.connect(gain); gain.connect(panner); panner.connect(analyser); analyser.connect(ctx.destination);
      }

      gain.gain.value = (selectedEntity?.audio?.volume || 1) * masterVolume;
      analyser.fftSize = 256;
      
      gainNodeRef.current = gain;
      analyserRef.current = analyser;
      filterRef.current = filter;
      pannerRef.current = panner;
      setIsPlaying(true);
    }
  };

  useEffect(() => {
      if (eqLowRef.current) eqLowRef.current.gain.setTargetAtTime(eqLow, audioCtxRef.current!.currentTime, 0.1);
      if (eqMidRef.current) eqMidRef.current.gain.setTargetAtTime(eqMid, audioCtxRef.current!.currentTime, 0.1);
      if (eqHighRef.current) eqHighRef.current.gain.setTargetAtTime(eqHigh, audioCtxRef.current!.currentTime, 0.1);
      if (gainNodeRef.current && selectedEntity?.audio) {
          gainNodeRef.current.gain.setTargetAtTime(selectedEntity.audio.volume * masterVolume, audioCtxRef.current!.currentTime, 0.1);
      }
  }, [eqLow, eqMid, eqHigh, masterVolume, selectedEntity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const draw = () => {
      frameId = requestAnimationFrame(draw);
      ctx.fillStyle = '#1a0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      if (analyserRef.current && isPlaying) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(dataArray);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ff5e3a';
          ctx.beginPath();
          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = v * height / 2;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              x += sliceWidth;
          }
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
      } else {
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, height/2);
          ctx.lineTo(width, height/2);
          ctx.stroke();
      }
    };
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  const updateAudio = (key: string, val: any) => {
    if (selectedEntity && selectedEntity.audio) {
      onUpdateEntity({ ...selectedEntity, audio: { ...selectedEntity.audio, [key]: val } });
    }
  };

  return (
    <div className="w-full h-full bg-[#0f0a0a] flex flex-col p-8">
      <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-[#ff9d5c] leading-none mb-2">AUDIO SUITE</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ray-Traced & 4D Sound Engine</p>
        </div>
        
        <div className="flex gap-4">
             <input type="file" ref={fileInputRef} onChange={handleImportAudio} accept="audio/*" className="hidden" />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase bg-white/5 text-gray-400 hover:text-white border border-white/5"
             >
                 <i className="fas fa-file-import mr-2"></i> Import Audio
             </button>
             <button 
                onClick={toggleRecording}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border border-white/5 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
             >
                 <i className={`fas fa-circle mr-2 ${isRecording ? 'text-white' : 'text-red-500'}`}></i> {isRecording ? 'Recording...' : 'Rec Mic'}
             </button>
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button onClick={() => setViewMode('SOURCES')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'SOURCES' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`}>Sources</button>
                <button onClick={() => setViewMode('MIXER')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'MIXER' ? 'bg-[#ff5e3a] text-white' : 'text-gray-500 hover:text-white'}`}>Master Mixer</button>
            </div>
        </div>
      </div>

      <div className="flex flex-1 gap-8">
        {viewMode === 'SOURCES' ? (
        <>
            <div className="w-64 bg-white/5 rounded-3xl border border-white/5 p-4 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2">
                {entities.filter(e => e.audio).map(e => (
                <button 
                    key={e.id}
                    onClick={() => { setSelectedEntityId(e.id); if(isPlaying) togglePlayback(); }}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedEntityId === e.id ? 'bg-[#ff5e3a] text-white' : 'hover:bg-white/5 text-gray-400'}`}
                >
                    <i className="fas fa-music"></i>
                    <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{e.name}</div>
                    <div className="text-[8px] text-gray-400 truncate">{e.audio?.clip}</div>
                    </div>
                </button>
                ))}
            </div>
            </div>

            {selectedEntity ? (
            <div className="flex-1 flex flex-col gap-6">
                <div className="h-48 bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-inner group">
                <canvas ref={canvasRef} width={800} height={200} className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={togglePlayback} className="w-16 h-16 rounded-full bg-[#ff5e3a] text-white flex items-center justify-center">
                        <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} text-xl`}></i>
                    </button>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase">Properties</h3>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-400"><span>Volume</span><span>{(selectedEntity.audio?.volume || 0).toFixed(2)}</span></div>
                        <input type="range" min="0" max="1" step="0.01" value={selectedEntity.audio?.volume} onChange={e => updateAudio('volume', parseFloat(e.target.value))} className="w-full accent-[#ff5e3a] h-1 bg-white/10 rounded-full"/>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-400"><span>Pitch</span><span>{(selectedEntity.audio?.pitch || 1).toFixed(2)}</span></div>
                        <input type="range" min="0.1" max="3" step="0.1" value={selectedEntity.audio?.pitch} onChange={e => updateAudio('pitch', parseFloat(e.target.value))} className="w-full accent-[#ff5e3a] h-1 bg-white/10 rounded-full"/>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            ) : <div className="flex-1 flex items-center justify-center text-gray-600">Select source</div>}
        </>
        ) : (
             <div className="flex-1 bg-black/40 rounded-3xl p-8 border border-white/5 flex items-center justify-center">
                 <div className="text-gray-500 text-xs font-bold uppercase">Master Mixer Visualization</div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;
