import React, { useState } from 'react';
import { ProjectId, ProjectConfig } from '../types';
import { PROJECTS } from '../data/projectData';
import {
  Radio,
  FileCode2,
  Layers,
  ShieldCheck,
  Library,
  Scan,
  PlayCircle,
  Zap,
  Network,
  Lock,
  PlusCircle,
  ChevronDown,
  Building2
} from 'lucide-react';

export type ActiveAppTab =
  | 'architecture'
  | 'engine'
  | 'voices'
  | 'script-scanner'
  | 'script-player'
  | 'library'
  | 'go-code';

interface Props {
  activeProject: ProjectId;
  onSelectProject: (p: ProjectId) => void;
  activeTab: ActiveAppTab;
  onSelectTab: (t: ActiveAppTab) => void;
  customProjects?: Record<string, ProjectConfig>;
  onOpenNewClientModal?: () => void;
}

export const Header: React.FC<Props> = ({
  activeProject,
  onSelectProject,
  activeTab,
  onSelectTab,
  customProjects = {},
  onOpenNewClientModal
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allProjects: Record<string, ProjectConfig> = { ...PROJECTS, ...customProjects };
  const currentProj: ProjectConfig = allProjects[activeProject] || PROJECTS['nuestraparroquia'];

  const getClientIcon = (id: string) => {
    switch (id) {
      case 'nuestraparroquia':
        return '⛪';
      case 'comunidad-radio':
        return '📻';
      case 'locucion':
        return '🎙️';
      case 'publicidad':
        return '📢';
      case 'narracion':
        return '📖';
      case 'podcast':
        return '🎧';
      default:
        return '🏢';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Master Agency Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Agency Purpose */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg text-white tracking-tight font-sans">
                VOICE STUDIO
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                by KLIK
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • Agencia Centralizada de Voces IA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Banco de Voces autorizadas y Voice Engine (MP3, WAV, STREAM) con aislamiento por cliente y proyecto
            </p>
          </div>
        </div>

        {/* Client & Project Switcher (Dropdown / Tenant Selector) */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tenant-switcher-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-cyan-500 text-xs font-medium text-slate-200 shadow-inner transition-all group"
            >
              <span className="text-base">{getClientIcon(currentProj.id)}</span>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
                  <span>Cliente / Proyecto</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                  {currentProj.name}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-1 transition-transform ${dropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {onOpenNewClientModal && (
              <button
                type="button"
                id="btn-add-client-quick"
                onClick={onOpenNewClientModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all"
                title="Añadir nuevo cliente o marca con aislamiento"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ Cliente</span>
              </button>
            )}
          </div>

          {/* Tenant Switcher Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 text-xs">
                <div className="px-3 py-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Clientes y Proyectos Aislados</span>
                  <span className="text-cyan-400">Total: {Object.keys(allProjects).length}</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-900">
                  {(Object.values(allProjects) as ProjectConfig[]).map((proj) => {
                    const isSelected = proj.id === activeProject;
                    return (
                      <button
                        type="button"
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-slate-800/80 text-cyan-300'
                            : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="text-lg shrink-0">{getClientIcon(proj.id)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                            <span>{proj.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {proj.tagline}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                          {proj.type}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {onOpenNewClientModal && (
                  <div className="p-2 border-t border-slate-800/80 bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewClientModal();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Registrar Nuevo Cliente / Proyecto</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tenant Context & Isolation Status Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-2 bg-slate-950/80 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-bold text-slate-200">Aislamiento Activo:</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
            {currentProj.name}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Token: <span className="text-slate-300 font-mono">{currentProj.isolationToken}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-400 hidden sm:inline">Formato del Cliente:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold">
            {currentProj.defaultFormat} Master
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Voice Engine Operativo
          </span>
        </div>
      </div>

      {/* Main Agency Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 border-t border-slate-800/80 text-xs scrollbar-none">
        {/* Tab 1: Arquitectura & Clientes */}
        <button
          type="button"
          id="tab-architecture"
          onClick={() => onSelectTab('architecture')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'architecture'
              ? 'border-indigo-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold">Arquitectura de la Agencia</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px]">
            Diagrama
          </span>
        </button>

        {/* Tab 2: Voice Engine */}
        <button
          type="button"
          id="tab-engine"
          onClick={() => onSelectTab('engine')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'engine'
              ? 'border-cyan-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">Voice Engine (Texto → Audio)</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px]">
            MP3/WAV/STREAM
          </span>
        </button>

        {/* Tab 3: Banco de Voces */}
        <button
          type="button"
          id="tab-voices"
          onClick={() => onSelectTab('voices')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'voices'
              ? 'border-cyan-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Banco de Voces ({currentProj.name})</span>
        </button>

        {/* Tab 4: Escáner e Intérprete de Guión */}
        <button
          type="button"
          id="tab-script-scanner"
          onClick={() => onSelectTab('script-scanner')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'script-scanner'
              ? 'border-indigo-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scan className="w-3.5 h-3.5 text-indigo-400" />
          <span>Escáner e Intérprete de Guión</span>
        </button>

        {/* Tab 5: Reproductor de Guión */}
        <button
          type="button"
          id="tab-script-player"
          onClick={() => onSelectTab('script-player')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'script-player'
              ? 'border-emerald-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Consola de Cabina (Guión)</span>
        </button>

        {/* Tab 6: Biblioteca de Emisiones */}
        <button
          type="button"
          id="tab-library"
          onClick={() => onSelectTab('library')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'library'
              ? 'border-cyan-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Library className="w-3.5 h-3.5 text-cyan-400" />
          <span>Biblioteca de Emisiones</span>
        </button>

        {/* Tab 7: Código Go */}
        <button
          type="button"
          id="tab-go-code"
          onClick={() => onSelectTab('go-code')}
          className={`px-4 py-3 font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ml-auto ${
            activeTab === 'go-code'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-cyan-400/80 hover:text-cyan-200'
          }`}
        >
          <FileCode2 className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">Código Go (Voice Engine)</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
            Autónomo
          </span>
        </button>
      </div>
    </header>
  );
};
