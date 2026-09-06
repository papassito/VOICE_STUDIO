import React, { useState, useEffect, useRef } from 'react';
import { ScriptScanResult, ScriptLine, VoiceProfile } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Radio,
  Clock,
  Mic2,
  CheckCircle2,
  Wand2,
  AlertCircle,
  ChevronRight,
  Layers,
  Settings2,
  Share2
} from 'lucide-react';

interface Props {
  scanResult: ScriptScanResult;
  voices: VoiceProfile[];
  onUpdateLines: (updatedLines: ScriptLine[]) => void;
  onNavigateToScanner: () => void;
}

export const ScriptPlayer: React.FC<Props> = ({
  scanResult,
  voices,
  onUpdateLines,
  onNavigateToScanner
}) => {
  const [lines, setLines] = useState<ScriptLine[]>(scanResult.lines);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [isLinePlaying, setIsLinePlaying] = useState<boolean>(false);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState<boolean>(false);
  const [synthesizingLineId, setSynthesizingLineId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [vuMeterLevel, setVuMeterLevel] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vuIntervalRef = useRef<any>(null);

  // Sync lines if scanResult changes
  useEffect(() => {
    setLines(scanResult.lines);
    setCurrentLineIndex(0);
    setIsPlayingAll(false);
    setIsLinePlaying(false);
  }, [scanResult]);

  // Simulated VU meter oscillation during playback
  useEffect(() => {
    if (isLinePlaying) {
      vuIntervalRef.current = setInterval(() => {
        setVuMeterLevel(Math.floor(Math.random() * 55) + 40);
      }, 100);
    } else {
      clearInterval(vuIntervalRef.current);
      setVuMeterLevel(0);
    }
    return () => clearInterval(vuIntervalRef.current);
  }, [isLinePlaying]);

  // Helper to get audio data URI from base64
  const getAudioSrc = (line: ScriptLine): string => {
    if (line.audioBase64) {
      return `data:${line.mimeType || 'audio/wav'};base64,${line.audioBase64}`;
    }
    return '';
  };

  // Synthesize single line
  const handleSynthesizeLine = async (line: ScriptLine): Promise<ScriptLine> => {
    setSynthesizingLineId(line.id);
    try {
      const res = await fetch('/api/script/synthesize-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: line.id,
          text: line.text,
          voiceId: line.voiceId,
          stageDirection: line.stageDirection,
          format: 'WAV'
        })
      });

      if (!res.ok) throw new Error('Error al sintetizar línea');
      const data = await res.json();

      const updated: ScriptLine = {
        ...line,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        durationSeconds: data.durationSeconds,
        status: 'ready'
      };

      setLines((prev) => {
        const next = prev.map((l) => (l.id === line.id ? updated : l));
        onUpdateLines(next);
        return next;
      });

      return updated;
    } catch (err) {
      console.error('Error synthesizing line:', err);
      const updated: ScriptLine = { ...line, status: 'error' };
      setLines((prev) => prev.map((l) => (l.id === line.id ? updated : l)));
      return updated;
    } finally {
      setSynthesizingLineId(null);
    }
  };

  // Synthesize all lines in sequence
  const handleSynthesizeAll = async () => {
    setIsSynthesizingAll(true);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.audioBase64) {
        await handleSynthesizeLine(line);
      }
    }
    setIsSynthesizingAll(false);
  };

  // Play a specific line
  const playLineAtIndex = async (index: number, shouldContinue = false) => {
    if (index < 0 || index >= lines.length) {
      setIsPlayingAll(false);
      setIsLinePlaying(false);
      return;
    }

    let line = lines[index];
    setCurrentLineIndex(index);

    // If audio not synthesized yet, synthesize on the fly!
    if (!line.audioBase64) {
      line = await handleSynthesizeLine(line);
      if (!line.audioBase64) {
        if (shouldContinue && index + 1 < lines.length) {
          playLineAtIndex(index + 1, true);
        }
        return;
      }
    }

    const src = getAudioSrc(line);
    if (!src) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else {
      audioRef.current.src = src;
    }

    audioRef.current.playbackRate = playbackSpeed;

    audioRef.current.onended = () => {
      setIsLinePlaying(false);
      if (shouldContinue && index + 1 < lines.length) {
        // Pause briefly (350ms) between radio interventions for realistic cadence
        setTimeout(() => {
          playLineAtIndex(index + 1, true);
        }, 350);
      } else {
        setIsPlayingAll(false);
      }
    };

    audioRef.current.onerror = () => {
      setIsLinePlaying(false);
      setIsPlayingAll(false);
    };

    try {
      await audioRef.current.play();
      setIsLinePlaying(true);
      if (shouldContinue) setIsPlayingAll(true);
    } catch (e) {
      console.error('Audio play error:', e);
      setIsLinePlaying(false);
      setIsPlayingAll(false);
    }
  };

  const handleTogglePlayAll = () => {
    if (isPlayingAll) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
      setIsLinePlaying(false);
    } else {
      playLineAtIndex(currentLineIndex, true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsLinePlaying(false);
    setIsPlayingAll(false);
  };

  const handleStopAndReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsLinePlaying(false);
    setIsPlayingAll(false);
    setCurrentLineIndex(0);
  };

  const handleNextLine = () => {
    const nextIdx = Math.min(lines.length - 1, currentLineIndex + 1);
    playLineAtIndex(nextIdx, isPlayingAll);
  };

  const handlePrevLine = () => {
    const prevIdx = Math.max(0, currentLineIndex - 1);
    playLineAtIndex(prevIdx, isPlayingAll);
  };

  // Change voice assignment for a specific line
  const handleChangeLineVoice = (lineId: string, newVoiceId: string) => {
    const selectedVoice = voices.find((v) => v.id === newVoiceId);
    if (!selectedVoice) return;

    setLines((prev) => {
      const next = prev.map((l) => {
        if (l.id === lineId) {
          return {
            ...l,
            voiceId: selectedVoice.id,
            voiceName: selectedVoice.name,
            voiceCategory: selectedVoice.category,
            audioBase64: undefined, // Invalidate audio so it re-synthesizes with the new voice
            status: 'idle'
          };
        }
        return l;
      });
      onUpdateLines(next);
      return next;
    });
  };

  // Download active line audio
  const handleDownloadLine = (line: ScriptLine) => {
    const src = getAudioSrc(line);
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `guion-${line.speakerName.replace(/\s+/g, '_')}-${line.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const synthesizedCount = lines.filter((l) => Boolean(l.audioBase64)).length;
  const readyPercent = Math.round((synthesizedCount / Math.max(1, lines.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header & Console Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Consola de Emisión y Reproducción de Guión
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  En el Aire
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pieza: <span className="text-slate-200 font-semibold">{scanResult.title}</span> ({scanResult.genre})
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToScanner}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Modificar Guión en Escáner
          </button>

          <button
            type="button"
            id="synthesize-all-script-btn"
            onClick={handleSynthesizeAll}
            disabled={isSynthesizingAll || readyPercent === 100}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isSynthesizingAll ? 'animate-spin' : ''}`} />
            <span>
              {isSynthesizingAll
                ? 'Sintetizando Guión...'
                : readyPercent === 100
                ? 'Todas las Voces Listas'
                : `Sintetizar Voces (${synthesizedCount}/${lines.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Broadcast Master Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="script-prev-line-btn"
              onClick={handlePrevLine}
              disabled={currentLineIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Línea anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="script-play-all-btn"
              onClick={handleTogglePlayAll}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
                isPlayingAll || isLinePlaying
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isPlayingAll || isLinePlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pausar Emisión</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Reproducir Todo el Guión</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="script-next-line-btn"
              onClick={handleNextLine}
              disabled={currentLineIndex === lines.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Siguiente línea"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="script-stop-btn"
              onClick={handleStopAndReset}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Detener y volver al inicio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Active Speaking Indicator & VU Meter */}
          <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Locución Activa</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{lines[currentLineIndex]?.speakerName || 'En espera'}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  ({lines[currentLineIndex]?.voiceName})
                </span>
              </div>
            </div>

            {/* Stereo VU Meter Simulation */}
            <div className="flex items-end gap-1 h-6 w-16 bg-slate-900 p-1 rounded border border-slate-800">
              <div
                className="w-1/2 bg-gradient-to-t from-emerald-500 via-amber-500 to-rose-500 rounded-t transition-all duration-75"
                style={{ height: `${vuMeterLevel}%` }}
              />
              <div
                className="w-1/2 bg-gradient-to-t from-emerald-500 via-amber-500 to-rose-500 rounded-t transition-all duration-75"
                style={{ height: `${Math.max(0, vuMeterLevel - 5)}%` }}
              />
            </div>
          </div>

          {/* Speed selector & Progress bar */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Velocidad:</span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {[0.9, 1.0, 1.15].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(spd);
                    if (audioRef.current) audioRef.current.playbackRate = spd;
                  }}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>
              Intervención {currentLineIndex + 1} de {lines.length}
            </span>
            <span>{readyPercent}% del guión sintetizado</span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${((currentLineIndex + 1) / lines.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Teleprompter / Interactive Script Line Listing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Libreto de Cabina / Teleprompter Secuencial
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Haz clic en cualquier línea para reproducirla de forma individual
          </span>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => {
            const isCurrent = currentLineIndex === idx;
            const isPlayingThis = isCurrent && isLinePlaying;
            const isLineSynthesizing = synthesizingLineId === line.id;
            const hasAudio = Boolean(line.audioBase64);

            return (
              <div
                key={line.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-950 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 text-slate-300'
                }`}
              >
                {/* Line Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-white uppercase tracking-wide">
                      {line.speakerName}
                    </span>

                    {/* Badge Clonada vs Nueva */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                        line.voiceCategory === 'clonada'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {line.voiceCategory === 'clonada' ? 'Voz Clonada' : 'Voz Nueva'}
                    </span>
                  </div>

                  {/* Voice Selector & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Voice Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      <Mic2 className="w-3 h-3 text-slate-400" />
                      <select
                        value={line.voiceId}
                        onChange={(e) => handleChangeLineVoice(line.id, e.target.value)}
                        className="bg-transparent text-[11px] font-mono text-cyan-300 outline-none cursor-pointer"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                            {v.name} ({v.category === 'clonada' ? 'Clon' : 'Nueva'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      ~{line.durationSeconds}s
                    </span>

                    {/* Single Play / Synthesize Button */}
                    <button
                      type="button"
                      onClick={() => playLineAtIndex(idx, false)}
                      disabled={isLineSynthesizing}
                      className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                        isPlayingThis
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : hasAudio
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                          : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300'
                      }`}
                      title={hasAudio ? 'Reproducir esta línea' : 'Sintetizar y reproducir'}
                    >
                      {isLineSynthesizing ? (
                        <Wand2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      ) : isPlayingThis ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>

                    {/* Download Line Audio */}
                    {hasAudio && (
                      <button
                        type="button"
                        onClick={() => handleDownloadLine(line)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Descargar audio de esta intervención"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Dialogue Text (Prompter Display) */}
                <div className="pl-8 space-y-1">
                  <p
                    className={`text-sm leading-relaxed font-sans ${
                      isCurrent ? 'text-white font-medium' : 'text-slate-300'
                    }`}
                  >
                    "{line.text}"
                  </p>

                  {line.stageDirection && (
                    <span className="text-[11px] font-mono text-amber-400/90 italic block">
                      [Dirección: {line.stageDirection}]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
