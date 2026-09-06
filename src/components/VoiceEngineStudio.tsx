import React, { useState, useEffect } from 'react';
import { ProjectId, AudioFormat, VoiceProfile, LocutionRecord } from '../types';
import { PROJECTS } from '../data/projectData';
import { AudioPlayerWaveform } from './AudioPlayerWaveform';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import {
  Sparkles,
  Play,
  Waves,
  Disc,
  FileAudio,
  Radio,
  Copy,
  ShieldCheck,
  Zap,
  Sliders,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wand2,
  Scan
} from 'lucide-react';

interface Props {
  activeProject: ProjectId;
  voices: VoiceProfile[];
  onLocutionCreated: (record: LocutionRecord) => void;
  onNavigateToScanner?: () => void;
}

export const VoiceEngineStudio: React.FC<Props> = ({
  activeProject,
  voices,
  onLocutionCreated,
  onNavigateToScanner
}) => {
  const currentProj = PROJECTS[activeProject];
  const projectVoices = voices.filter((v) => v.projectId === activeProject);

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(projectVoices[0]?.id || '');
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>(currentProj?.defaultFormat || 'WAV');
  const [text, setText] = useState<string>(currentProj?.presets[0]?.text || '');
  const [title, setTitle] = useState<string>(currentProj?.presets[0]?.title || '');
  const [toneInstruction, setToneInstruction] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Active generated audio result
  const [currentResult, setCurrentResult] = useState<LocutionRecord | null>(null);

  // Streaming state for STREAM mode
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(false);
  const [streamChunksCount, setStreamChunksCount] = useState<number>(0);
  const [streamStatus, setStreamStatus] = useState<string>('');

  // Keep selected voice in sync when changing category
  useEffect(() => {
    if (projectVoices.length > 0) {
      setSelectedVoiceId(projectVoices[0].id);
      setText(currentProj?.presets[0]?.text || '');
      setTitle(currentProj?.presets[0]?.title || '');
      setSelectedFormat(currentProj?.defaultFormat || 'WAV');
      setCurrentResult(null);
      setErrorMsg(null);
      setSuccessNotice(null);
    }
  }, [activeProject]);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || projectVoices[0];

  const estimatedWords = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round(estimatedWords / 2.3));

  const handleApplyPreset = (preset: typeof currentProj.presets[0]) => {
    setText(preset.text);
    setTitle(preset.title);
    const matchingVoice = projectVoices.find((v) => v.name.includes(preset.suggestedVoice));
    if (matchingVoice) {
      setSelectedVoiceId(matchingVoice.id);
    }
  };

  const handlePolishWithAI = async () => {
    if (!text.trim()) return;
    setIsPolishing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/script/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          projectId: activeProject,
          mode: 'radio'
        })
      });
      const data = await res.json();
      if (data.enhancedText) {
        setText(data.enhancedText);
        setSuccessNotice('¡Texto pulido con cadencia de radiofonía profesional!');
      }
    } catch (err: any) {
      console.error('Error enhancing script:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  // Generate Voice via Voice Engine API
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMsg('Por favor introduce el texto a transformar en audio.');
      return;
    }

    if (!selectedVoice?.isAuthorized) {
      setErrorMsg(`La voz '${selectedVoice?.name}' no está autorizada para generar contenidos.`);
      return;
    }

    setErrorMsg(null);
    setSuccessNotice(null);

    // If STREAM format selected, initiate live stream mode
    if (selectedFormat === 'STREAM') {
      handleStartStream();
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject,
          voiceId: selectedVoiceId,
          text,
          title: title || (text.slice(0, 35) + '...'),
          format: selectedFormat,
          toneInstruction
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en la síntesis de voz');
      }

      setCurrentResult(data.record);
      onLocutionCreated(data.record);
      setSuccessNotice(data.notice || '¡Locución generada con éxito por el Voice Engine!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al comunicarse con el servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  // SSE Live Stream handler
  const handleStartStream = () => {
    setIsStreamingActive(true);
    setStreamChunksCount(0);
    setStreamStatus('Iniciando flujo de transmisión continua...');
    setErrorMsg(null);

    const url = `/api/tts/stream?text=${encodeURIComponent(text)}&voiceId=${encodeURIComponent(
      selectedVoiceId
    )}&projectId=${encodeURIComponent(activeProject)}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener('init', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setStreamStatus(`Transmitiendo en vivo: ${payload.voice} (${payload.sampleRate}Hz)`);
      } catch (err) {}
    });

    eventSource.addEventListener('chunk', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setStreamChunksCount((prev) => prev + 1);
        setStreamStatus(`Transmitiendo bloque #${payload.chunkIndex + 1}: "${payload.segmentText}"`);

        if (payload.chunkIndex === 0 && payload.audioBase64) {
          const fakeRec: LocutionRecord = {
            id: `stream-${Date.now()}`,
            projectId: activeProject,
            voiceId: selectedVoice.id,
            voiceName: selectedVoice.name,
            title: title || 'Transmisión en Vivo (STREAM)',
            text,
            format: 'STREAM',
            durationSeconds: estimatedSeconds,
            fileSizeBytes: 24000 * 2 * estimatedSeconds,
            audioBase64: payload.audioBase64,
            mimeType: 'audio/wav',
            createdAt: new Date().toISOString(),
            status: 'completed'
          };
          setCurrentResult(fakeRec);
          onLocutionCreated(fakeRec);
        }
      } catch (err) {}
    });

    eventSource.addEventListener('complete', () => {
      setStreamStatus('Transmisión finalizada con éxito.');
      setIsStreamingActive(false);
      eventSource.close();
      setSuccessNotice('Transmisión continua completada.');
    });

    eventSource.onerror = () => {
      setStreamStatus('Flujo de transmisión finalizado.');
      setIsStreamingActive(false);
      eventSource.close();
    };
  };

  const isClone = activeProject === 'voces-clonadas';

  return (
    <div className="space-y-6">
      {/* Top Architecture visual reference */}
      <ArchitectureDiagram
        activeProject={activeProject}
        selectedFormat={selectedFormat}
        selectedVoiceName={selectedVoice?.name || ''}
      />

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Voice Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isClone ? (
                  <Copy className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-sky-400" />
                )}
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {isClone ? 'Voces Clonadas (Fidelidad Espectral)' : 'Voces Nuevas (Generativas)'}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Catálogo Activo
              </span>
            </div>

            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Seleccionar perfil de voz de la agencia:
            </label>
            <div className="space-y-2">
              {projectVoices.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    selectedVoiceId === v.id
                      ? isClone
                        ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                        : 'bg-sky-950/50 border-sky-500 text-white ring-1 ring-sky-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{v.name}</span>
                      {v.similarityScore && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          {v.similarityScore}% fidelidad
                        </span>
                      )}
                      {v.isAuthorized ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Autorizada</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                          No Autorizada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{v.role}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Tono: {v.tone}</span>
                      <span>•</span>
                      <span>Cadencia: {v.speed}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Output Format Selector: MP3 | WAV | STREAM */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Formato de Salida (Voice Engine)</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* MP3 */}
              <button
                type="button"
                id="format-mp3-btn"
                onClick={() => setSelectedFormat('MP3')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'MP3'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Disc className="w-4 h-4 text-amber-400" />
                  <span>MP3</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Podcast & Cuña</p>
              </button>

              {/* WAV */}
              <button
                type="button"
                id="format-wav-btn"
                onClick={() => setSelectedFormat('WAV')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'WAV'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  <span>WAV</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">24kHz Master</p>
              </button>

              {/* STREAM */}
              <button
                type="button"
                id="format-stream-btn"
                onClick={() => setSelectedFormat('STREAM')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'STREAM'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Waves className="w-4 h-4 text-emerald-400" />
                  <span>STREAM</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">En Vivo (SSE)</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Script Input & Engine Execution */}
        <div className="lg:col-span-7 space-y-5">
          {/* Presets & Script Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Editor de Locución Rápida
                </h3>
              </div>

              {onNavigateToScanner && (
                <button
                  type="button"
                  onClick={onNavigateToScanner}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>¿Tienes un guión completo? Usa el Escáner ➔</span>
                </button>
              )}
            </div>

            {/* Presets Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Pautas y Plantillas:</span>
              <div className="flex flex-wrap gap-2">
                {currentProj?.presets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Title field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Título de la Mención / Emisión
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Identificador Top of the Hour"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            {/* Script Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Texto a Transformar en Audio
                </label>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>{estimatedWords} palabras</span>
                  <span>•</span>
                  <span>~{estimatedSeconds}s aire</span>
                </div>
              </div>

              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Introduce el texto aquí..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-sans leading-relaxed focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            {/* Tone Instruction */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Instrucción de Tono de Cabina (Opcional)
                </label>
                <button
                  type="button"
                  onClick={handlePolishWithAI}
                  disabled={isPolishing || !text.trim()}
                  className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  <Wand2 className={`w-3 h-3 ${isPolishing ? 'animate-spin' : ''}`} />
                  <span>{isPolishing ? 'Adaptando...' : 'Pulir para Radio'}</span>
                </button>
              </div>

              <input
                type="text"
                value={toneInstruction}
                onChange={(e) => setToneInstruction(e.target.value)}
                placeholder="Ej: Tono firme con pausa de suspenso y cierre contundente"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            {/* Error / Success feedback */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Action Button: Transform Texto -> Audio */}
            <button
              type="button"
              id="generate-voice-engine-btn"
              onClick={handleGenerate}
              disabled={isGenerating || isStreamingActive}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedFormat === 'STREAM'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-700/20'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-indigo-700/20'
              } disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sintetizando audio en Voice Engine...</span>
                </>
              ) : isStreamingActive ? (
                <>
                  <Waves className="w-4 h-4 animate-pulse text-emerald-300" />
                  <span>{streamStatus || 'Transmitiendo en Vivo...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>
                    Transformar Texto en Audio ({selectedFormat}) con {selectedVoice?.name}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Player */}
          {currentResult && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Audio Generado ({currentResult.format})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentResult.durationSeconds}s • {selectedVoice?.name}
                </span>
              </div>

              <AudioPlayerWaveform
                audioBase64={currentResult.audioBase64}
                mimeType={currentResult.mimeType}
                duration={currentResult.durationSeconds}
                title={currentResult.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
