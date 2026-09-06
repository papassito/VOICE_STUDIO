import React, { useState } from 'react';
import { ScriptScanResult, VoiceProfile, ScriptLine } from '../types';
import { DEFAULT_RADIO_SCRIPTS } from '../data/projectData';
import {
  Scan,
  Sparkles,
  Radio,
  Clock,
  FileText,
  Volume2,
  Users,
  Music,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Wand2,
  PlayCircle
} from 'lucide-react';

interface Props {
  voices: VoiceProfile[];
  onLoadIntoPlayer: (scanResult: ScriptScanResult) => void;
}

export const ScriptScanner: React.FC<Props> = ({ voices, onLoadIntoPlayer }) => {
  const [scriptText, setScriptText] = useState<string>(DEFAULT_RADIO_SCRIPTS[0].text);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_RADIO_SCRIPTS[0].id);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScriptScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof DEFAULT_RADIO_SCRIPTS[0]) => {
    setSelectedPresetId(preset.id);
    setScriptText(preset.text);
    setScanResult(null);
    setErrorMsg(null);
  };

  const handleScanScript = async () => {
    if (!scriptText.trim()) {
      setErrorMsg('Por favor introduce un guión radial para interpretar.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/script/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al escanear el guión.');
      }

      const result: ScriptScanResult = await res.json();
      setScanResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el escáner.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Escáner e Intérprete de Guiones Radiales
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  IA Parser + Asignador de Voces
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interpreta automáticamente personajes, acotaciones técnicas, efectos de sonido (SFX/Música) y asigna voces clonadas o nuevas de la agencia.
              </p>
            </div>
          </div>
        </div>

        {/* Action button if result exists */}
        {scanResult && (
          <button
            type="button"
            id="open-in-player-top-btn"
            onClick={() => onLoadIntoPlayer(scanResult)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Pasar a Cabina de Reproducción</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Grid: Left Editor & Presets / Right Scan Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Guión Input */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preset Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Formatos de Guión de Ejemplo</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">Radio Broadcast</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_RADIO_SCRIPTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-950/60 border-indigo-500/60 text-white ring-1 ring-indigo-500/30'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{preset.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-indigo-300 border border-indigo-500/20">
                      {preset.genre}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea for Script */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Texto del Guión Radial</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {scriptText.trim().split(/\s+/).filter(Boolean).length} palabras
              </span>
            </div>

            <textarea
              rows={12}
              id="script-input-textarea"
              value={scriptText}
              onChange={(e) => {
                setScriptText(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="Escribe o pega el guión aquí. Ej: [SFX: Tensión]\n[LOCUTOR 1]: Noticias de última hora...\n[REPORTERO]: Transmitiendo en directo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all leading-relaxed"
            />

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Scan Action Button */}
            <button
              type="button"
              id="start-script-scan-btn"
              onClick={handleScanScript}
              disabled={isScanning}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Escaneando e interpretando guión...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 text-cyan-200" />
                  <span>Escanear e Interpretar Guión</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Scan Interpretation Results */}
        <div className="lg:col-span-7 space-y-4">
          {!scanResult && !isScanning && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Scan className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-bold text-white">Escáner Listo</h3>
                <p className="text-xs text-slate-400">
                  Presiona el botón de escanear para que el motor interprete el libreto, detecte personajes, efectos sonoros y asigne las voces autorizadas de la agencia.
                </p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin flex items-center justify-center" />
                <Sparkles className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Escaneando semántica y roles de radio...</p>
                <p className="text-xs text-slate-400">
                  Extrayendo acotaciones, calculando tiempos de aire y mapeando con voces clonadas y nuevas.
                </p>
              </div>
            </div>
          )}

          {scanResult && !isScanning && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Executive Overview Cards */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guión Interpretado con Éxito</span>
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{scanResult.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {scanResult.genre}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-indigo-400 font-semibold">Resumen de Dirección: </span>
                  {scanResult.summary}
                </p>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Tiempo Estimado</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ~{scanResult.estimatedTotalSeconds}s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Palabras</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">
                      {scanResult.wordCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Personajes / Roles</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">
                      {scanResult.detectedSpeakers.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Intervenciones</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {scanResult.lines.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Speakers and Voice Assignment */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Voces de la Agencia Asignadas</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mapeo automático
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scanResult.detectedSpeakers.map((spk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-white block">{spk.name}</span>
                        <span className="text-[11px] text-indigo-300 font-mono">
                          {spk.suggestedVoiceName}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {spk.voicePitchRecommendation}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          spk.category === 'clonada'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {spk.category === 'clonada' ? 'Voz Clonada' : 'Voz Nueva'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sound Effects (SFX / Music) */}
              {scanResult.soundEffects.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Efectos Sonoros y Musicalización Identificados</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.soundEffects.map((sfx, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25"
                      >
                        {sfx}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialogue breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Desglose Secuencial de Parlamentos</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {scanResult.lines.length} líneas
                  </span>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {scanResult.lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-200">{line.speakerName}</span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            ({line.voiceName})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          ~{line.durationSeconds}s
                        </span>
                      </div>

                      <p className="text-slate-300 font-mono pl-7 leading-relaxed">
                        "{line.text}"
                      </p>

                      {line.stageDirection && (
                        <span className="text-[10px] text-amber-400/90 italic pl-7 block">
                          [Acotación: {line.stageDirection}]
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Primary CTA to trigger reproduction */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="load-to-reproduction-btn"
                    onClick={() => onLoadIntoPlayer(scanResult)}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Cargar en Reproductor de Guión (Emisión en Cabina)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
