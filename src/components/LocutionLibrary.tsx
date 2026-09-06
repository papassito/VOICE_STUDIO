import React, { useState } from 'react';
import { ProjectId, LocutionRecord, AudioFormat } from '../types';
import { PROJECTS } from '../data/projectData';
import { AudioPlayerWaveform } from './AudioPlayerWaveform';
import {
  Library,
  Disc,
  FileAudio,
  Waves,
  Clock,
  HardDrive,
  Calendar,
  Filter,
  Lock,
  Radio,
  Download
} from 'lucide-react';

interface Props {
  activeProject: ProjectId;
  locutions: LocutionRecord[];
}

export const LocutionLibrary: React.FC<Props> = ({ activeProject, locutions }) => {
  const currentProj = PROJECTS[activeProject] || PROJECTS['nuestraparroquia'];
  const [filterFormat, setFilterFormat] = useState<AudioFormat | 'ALL'>('ALL');
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current');

  // Filter locutions strictly by active project / tenant or all
  const filteredLocutions = locutions.filter((l) => {
    if (filterScope === 'current' && l.projectId && l.projectId !== activeProject) {
      return false;
    }
    if (filterFormat !== 'ALL' && l.format !== filterFormat) {
      return false;
    }
    return true;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header and format filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">
              Biblioteca de Emisiones • {currentProj?.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              Aislamiento Activo
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Contenidos y audios radiales generados por el Voice Engine (MP3, WAV, STREAM) aislados para este cliente.
          </p>
        </div>

        {/* Scope and format buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterScope('current')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterScope === 'current'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo {currentProj?.name}
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterScope === 'all'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toda la Agencia ({locutions.length})
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['ALL', 'WAV', 'MP3', 'STREAM'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFilterFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterFormat === fmt
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'MP3' && <Disc className="w-3 h-3 text-amber-400" />}
                {fmt === 'WAV' && <FileAudio className="w-3 h-3 text-cyan-400" />}
                {fmt === 'STREAM' && <Waves className="w-3 h-3 text-emerald-400" />}
                <span>{fmt === 'ALL' ? 'Todos' : fmt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Locutions List */}
      {filteredLocutions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <Library className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            No hay emisiones registradas con este filtro.
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Utiliza el Voice Engine o la Consola de Guión para sintetizar locuciones en MP3, WAV o STREAM para {currentProj?.name}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLocutions.map((loc) => {
            const locProj = PROJECTS[loc.projectId || ''] || currentProj;

            return (
              <div
                key={loc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {locProj.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          loc.format === 'WAV'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : loc.format === 'MP3'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {loc.format === 'WAV' && <FileAudio className="w-3 h-3" />}
                        {loc.format === 'MP3' && <Disc className="w-3 h-3" />}
                        {loc.format === 'STREAM' && <Waves className="w-3 h-3 animate-pulse" />}
                        <span>{loc.format} Master</span>
                      </span>

                      <span className="text-xs font-bold text-slate-200">
                        Voz: {loc.voiceName}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {loc.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{loc.durationSeconds.toFixed(1)}s</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatBytes(loc.fileSizeBytes)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(loc.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  "{loc.text}"
                </p>

                {/* Waveform Player */}
                <div className="pt-2 border-t border-slate-800/60">
                  <AudioPlayerWaveform
                    audioUrl={loc.audioUrl}
                    format={loc.format}
                    title={loc.title}
                    durationSeconds={loc.durationSeconds}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
