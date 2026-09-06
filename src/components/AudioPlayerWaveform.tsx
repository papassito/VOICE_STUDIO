import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Download, Volume2, Waves, Disc, FileAudio, RotateCcw } from 'lucide-react';
import { AudioFormat } from '../types';

interface Props {
  audioBase64?: string;
  mimeType?: string;
  format: AudioFormat;
  title: string;
  voiceName: string;
  durationSeconds: number;
  isStreaming?: boolean;
}

export const AudioPlayerWaveform: React.FC<Props> = ({
  audioBase64,
  mimeType = 'audio/wav',
  format,
  title,
  voiceName,
  durationSeconds,
  isStreaming = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const audioSrc = audioBase64 ? `data:${mimeType};base64,${audioBase64}` : undefined;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioBase64]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleDownload = () => {
    if (!audioSrc) return;
    const a = document.createElement('a');
    a.href = audioSrc;
    const ext = format === 'MP3' ? 'mp3' : 'wav';
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}_${format}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Canvas Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 48;
      const barWidth = Math.max(3, (width / numBars) - 2);
      const activeProgress = durationSeconds > 0 ? currentTime / durationSeconds : 0;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        const barProgress = i / numBars;
        const isPassed = barProgress <= activeProgress;

        // Base height calculation with sine variations
        let barHeight = 8;
        if (isPlaying || isStreaming) {
          const wave = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const randomFactor = Math.sin(i * 1.7 + phase * 2) * 0.3;
          barHeight = Math.max(6, (wave + randomFactor) * (height * 0.75));
        } else {
          // Static simulated waveform
          const wave = Math.sin(i * 0.4) * 0.3 + 0.4;
          barHeight = Math.max(6, wave * (height * 0.65));
        }

        const y = (height - barHeight) / 2;

        if (isPassed) {
          ctx.fillStyle = format === 'STREAM' ? '#10b981' : format === 'MP3' ? '#f59e0b' : '#06b6d4';
        } else {
          ctx.fillStyle = '#334155';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying || isStreaming) {
        phase += 0.08;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isStreaming, currentTime, durationSeconds, format]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Track info header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              format === 'STREAM'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : format === 'MP3'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {format === 'STREAM' && <Waves className="w-4 h-4 animate-pulse" />}
            {format === 'MP3' && <Disc className="w-4 h-4" />}
            {format === 'WAV' && <FileAudio className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
            <p className="text-xs text-slate-400">
              Voz: <span className="text-slate-200 font-medium">{voiceName}</span> • Formato:{' '}
              <span className="font-mono text-cyan-400">{format}</span>
            </p>
          </div>
        </div>

        {audioSrc && (
          <button
            id="download-audio-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={`Descargar archivo ${format}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .{format === 'MP3' ? 'mp3' : 'wav'}</span>
          </button>
        )}
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 mb-3">
        <canvas
          ref={canvasRef}
          width={460}
          height={50}
          className="w-full h-12 block"
        />
      </div>

      {/* Controls and Seekbar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            id="audio-play-toggle-btn"
            onClick={togglePlay}
            disabled={!audioSrc && !isStreaming}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
              format === 'STREAM'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : format === 'MP3'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <input
              type="range"
              min="0"
              max={durationSeconds || 1}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioSrc}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
