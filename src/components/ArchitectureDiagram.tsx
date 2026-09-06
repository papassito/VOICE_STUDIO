import React from 'react';
import { ProjectId, AudioFormat, VoiceProfile } from '../types';
import { PROJECTS } from '../data/projectData';
import {
  Radio,
  Cpu,
  FileAudio,
  Disc,
  Waves,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowDownRight,
  Users
} from 'lucide-react';

interface Props {
  activeProject: ProjectId;
  onSelectProject?: (p: ProjectId) => void;
  selectedFormat?: AudioFormat;
  voices: VoiceProfile[];
}

export const ArchitectureDiagram: React.FC<Props> = ({
  activeProject,
  onSelectProject,
  selectedFormat = 'WAV',
  voices
}) => {
  const currentProj = PROJECTS[activeProject] || PROJECTS['nuestraparroquia'];
  const projectVoices = voices.filter((v) => v.projectId === activeProject);

  const clientList = [
    { id: 'nuestraparroquia', name: 'NUESTRAPARROQUIA.ONLINE', subtitle: 'Cliente • Padre X & Lectura Parroquial', tag: 'Cliente' },
    { id: 'comunidad-radio', name: 'COMUNIDAD DE RADIO', subtitle: 'Cliente • Voz B & Transmisión 24/7', tag: 'Cliente' },
    { id: 'locucion', name: 'LOCUCIÓN', subtitle: 'Vertical • Voz C & Institucional', tag: 'Vertical' },
    { id: 'publicidad', name: 'PUBLICIDAD', subtitle: 'Vertical • Cuñas 20s, Promos & Punch', tag: 'Vertical' },
    { id: 'narracion', name: 'NARRACIÓN', subtitle: 'Vertical • Audiolibros & Crónicas', tag: 'Vertical' },
    { id: 'podcast', name: 'PODCAST', subtitle: 'Vertical • Cabina, Intros & Outros', tag: 'Vertical' },
    { id: 'otros-proyectos', name: 'OTROS PROYECTOS', subtitle: 'Arquitectura Abierta • Nuevas Marcas', tag: 'Proyecto' }
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-white font-mono flex items-center gap-2">
            <span>Arquitectura Centralizada</span>
            <span className="text-cyan-400 font-mono text-xs">VOICE STUDIO by KLIK</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Cliente Activo:</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
            {currentProj.name}
          </span>
        </div>
      </div>

      {/* Main Hierarchical Tree Visualizer */}
      <div className="pt-6 flex flex-col items-center">
        {/* ROOT: VOICE STUDIO by KLIK */}
        <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white font-bold text-base tracking-wide shadow-xl shadow-indigo-600/30 border border-indigo-400/40 flex items-center gap-3">
          <Radio className="w-5 h-5 text-cyan-200" />
          <div className="text-center">
            <div className="tracking-tight text-lg">VOICE STUDIO</div>
            <div className="text-[11px] font-mono text-cyan-100 tracking-wider uppercase font-semibold">
              by KLIK • AGENCIA DE VOCES IA
            </div>
          </div>
        </div>

        {/* Stem down from ROOT */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Horizontal T-Bar split to BANCO DE VOCES & VOICE ENGINE */}
        <div className="relative w-full max-w-2xl">
          <div className="h-px bg-slate-700 w-full" />
          <div className="absolute left-1/4 top-0 w-px h-6 bg-slate-700" />
          <div className="absolute right-1/4 top-0 w-px h-6 bg-slate-700" />
        </div>

        {/* TWO PRIMARY PILLARS: BANCO DE VOCES & VOICE ENGINE */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* PILLAR 1: BANCO DE VOCES */}
          <div className="bg-slate-950/70 border border-indigo-900/60 rounded-xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-indigo-300 uppercase tracking-wider font-mono">
                    BANCO DE VOCES
                  </div>
                  <div className="text-[10px] text-slate-400">Perfiles Autorizados & Calibrados</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {voices.filter((v) => v.isAuthorized).length} Autorizadas
              </span>
            </div>

            {/* Showcase sample key voices mentioned in the architecture: Padre X, Voz B, Voz C */}
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-2 rounded-lg bg-slate-900 border border-purple-500/30 text-center">
                <div className="text-[11px] font-bold text-purple-300">Padre X</div>
                <div className="text-[9px] text-slate-400 truncate">Parroquial</div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> 99.4%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-sky-500/30 text-center">
                <div className="text-[11px] font-bold text-sky-300">Voz B</div>
                <div className="text-[9px] text-slate-400 truncate">Máster Cadena</div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> 99.5%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-indigo-500/30 text-center">
                <div className="text-[11px] font-bold text-indigo-300">Voz C</div>
                <div className="text-[9px] text-slate-400 truncate">Institucional</div>
                <div className="text-[9px] font-mono text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> 100%
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mt-auto pt-2 border-t border-slate-900 flex items-center justify-between">
              <span>Voces activas en {currentProj.name}:</span>
              <span className="font-mono text-cyan-300 font-bold">{projectVoices.length} perfiles</span>
            </div>
          </div>

          {/* PILLAR 2: VOICE ENGINE */}
          <div className="bg-slate-950/70 border border-cyan-900/60 rounded-xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-600/50 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-cyan-300 uppercase tracking-wider font-mono">
                    VOICE ENGINE
                  </div>
                  <div className="text-[10px] text-slate-400">TEXTO → AUDIO (Go 1.22 + IA)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                24 kHz Master
              </span>
            </div>

            {/* Three output formats from diagram: MP3, WAV, STREAM */}
            <div className="grid grid-cols-3 gap-2 my-2">
              <div
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedFormat === 'MP3'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Disc className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-xs">MP3</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Podcasts/Cuñas</div>
              </div>

              <div
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedFormat === 'WAV'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <FileAudio className="w-3 h-3 text-cyan-400" />
                  <span className="font-bold text-xs">WAV</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Master Cabina</div>
              </div>

              <div
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedFormat === 'STREAM'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Waves className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs">STREAM</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">SSE en Vivo</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mt-auto pt-2 border-t border-slate-900 flex items-center justify-between">
              <span>Formato preferido:</span>
              <span className="font-mono text-emerald-400 font-bold">{currentProj.defaultFormat}</span>
            </div>
          </div>
        </div>

        {/* Stem down to Clients & Projects Isolation Layer */}
        <div className="w-px h-6 bg-slate-700 mt-4" />

        {/* CLIENTS & VERTICALS ISOLATION LAYER */}
        <div className="w-full max-w-4xl bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="font-bold text-xs tracking-wider uppercase font-mono text-slate-200">
                Aislamiento Multi-Cliente & Proyectos de la Agencia
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              Haz clic en cualquier cliente para activar su entorno aislado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientList.map((c) => {
              const isSelected = activeProject === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => onSelectProject && onSelectProject(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-white tracking-wide font-mono">
                      {c.name}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{c.subtitle}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Aislamiento 100%</span>
                    </span>
                    {isSelected && (
                      <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                        Activo <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Core Isolation Architecture Statement */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Principio de Aislamiento:</strong> NuestraParroquia.online y Comunidad de Radio son clientes de la agencia. Cada cliente mantiene aislamiento total de perfiles de voz, contenidos, permisos y configuraciones.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
