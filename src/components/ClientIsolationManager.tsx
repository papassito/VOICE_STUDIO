import React, { useState } from 'react';
import { ProjectId, ProjectConfig, AudioFormat, VoiceProfile } from '../types';
import { PROJECTS } from '../data/projectData';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import {
  ShieldCheck,
  PlusCircle,
  Building2,
  Lock,
  Layers,
  FileAudio,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FolderPlus,
  Info
} from 'lucide-react';

interface Props {
  activeProject: ProjectId;
  onSelectProject: (p: ProjectId) => void;
  customProjects: Record<string, ProjectConfig>;
  onAddCustomProject: (p: ProjectConfig) => void;
  voices: VoiceProfile[];
  onNavigateToEngine: () => void;
  onNavigateToVoices: () => void;
}

export const ClientIsolationManager: React.FC<Props> = ({
  activeProject,
  onSelectProject,
  customProjects,
  onAddCustomProject,
  voices,
  onNavigateToEngine,
  onNavigateToVoices
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state for creating a new client/project
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'cliente' | 'vertical' | 'proyecto'>('cliente');
  const [newClientDomain, setNewClientDomain] = useState('');
  const [newClientTagline, setNewClientTagline] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientFormat, setNewClientFormat] = useState<AudioFormat>('WAV');
  const [newClientThemeColor, setNewClientThemeColor] = useState('#0284c7');

  const allProjects: Record<string, ProjectConfig> = { ...PROJECTS, ...customProjects };
  const currentProj: ProjectConfig = allProjects[activeProject] || PROJECTS['nuestraparroquia'];

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const id = newClientName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `proj-${Date.now()}`;

    const token = `TENANT-${id.toUpperCase()}-SEC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProject: ProjectConfig = {
      id,
      name: newClientName.trim(),
      type: newClientType,
      domain: newClientDomain.trim() || `${id}.agency.klik`,
      tagline: newClientTagline.trim() || `Proyecto Aislado en VOICE STUDIO by KLIK`,
      description: newClientDesc.trim() || `Espacio de voz aislado para ${newClientName}.`,
      themeColor: newClientThemeColor,
      accentColor: '#38bdf8',
      iconName: 'Building2',
      isolationToken: token,
      allowedRoles: ['Locutor Principal', 'Conducción', 'Voz Comercial'],
      defaultFormat: newClientFormat,
      presets: [
        {
          title: `Mención de Apertura para ${newClientName}`,
          text: `Bienvenidos a la emisión oficial de ${newClientName}. Transmitiendo con la más alta calidad y fidelidad de voz mediante VOICE STUDIO.`,
          suggestedVoice: 'Voz Neutra Universal',
          category: 'Apertura'
        }
      ]
    };

    onAddCustomProject(newProject);
    onSelectProject(id);
    setIsModalOpen(false);

    // Reset form
    setNewClientName('');
    setNewClientDomain('');
    setNewClientTagline('');
    setNewClientDesc('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Agency Architecture Statement */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Aislamiento Multi-Inquilino (Multi-Tenant)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Núcleo Go 1.22 Inalterable
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              VOICE STUDIO by KLIK • Arquitectura Centralizada de Voces IA
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              <strong>NuestraParroquia.online</strong> y <strong>Comunidad de Radio</strong> son clientes de la agencia, no la identidad ni el propósito exclusivo del sistema. Cada cliente mantiene aislamiento estricto de sus perfiles de voz, contenidos generados, permisos y configuraciones de salida (MP3, WAV, STREAM).
            </p>
          </div>

          <button
            type="button"
            id="btn-open-new-client-modal"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Agregar Nuevo Cliente / Proyecto</span>
          </button>
        </div>
      </div>

      {/* Interactive Visual Architecture Diagram */}
      <ArchitectureDiagram
        activeProject={activeProject}
        onSelectProject={onSelectProject}
        selectedFormat={currentProj.defaultFormat}
        voices={voices}
      />

      {/* Grid of All Registered Agency Clients & Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Directorio de Clientes y Verticales ({Object.keys(allProjects).length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Aislamiento de perfiles, contenidos y configuraciones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.values(allProjects) as ProjectConfig[]).map((proj) => {
            const isCurrent = proj.id === activeProject;
            const clientVoices = voices.filter((v) => v.projectId === proj.id);

            return (
              <div
                key={proj.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {proj.type}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5 font-mono">
                        {proj.name}
                      </h4>
                    </div>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectProject(proj.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                      >
                        Conectar
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="space-y-2 py-3 border-y border-slate-800/80 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Voces Autorizadas:</span>
                      <span className="text-slate-200 font-bold">{clientVoices.length} perfiles</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Salida Predeterminada:</span>
                      <span className="text-cyan-300 font-bold">{proj.defaultFormat} Master</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Dominio Aislado:</span>
                      <span className="text-slate-300 truncate max-w-[170px]">{proj.domain}</span>
                    </div>
                  </div>
                </div>

                {/* Token and Actions */}
                <div className="pt-3 mt-3 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span className="truncate max-w-[130px]">{proj.isolationToken}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyToken(proj.isolationToken)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    title="Copiar token de aislamiento"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedToken === proj.isolationToken ? '¡Copiado!' : 'Token'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Operando en <strong>{currentProj.name}</strong>. Puedes generar locuciones o administrar sus voces autorizadas inmediatamente.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToVoices}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Banco de Voces</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToEngine}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
          >
            <FileAudio className="w-3.5 h-3.5 text-slate-950" />
            <span>Voice Engine ({currentProj.defaultFormat})</span>
          </button>
        </div>
      </div>

      {/* Modal: Registrar Nuevo Cliente / Proyecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">
                  Registrar Nuevo Cliente o Marca
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Crea un nuevo espacio aislado con sus propios perfiles de voz, cuñas de emisión, configuraciones y token de seguridad sin modificar el núcleo del sistema.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Cliente o Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Radio Horizonte FM, Editorial Voces, Marca Z"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Registro
                  </label>
                  <select
                    value={newClientType}
                    onChange={(e: any) => setNewClientType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="cliente">Cliente Externo</option>
                    <option value="vertical">Vertical de Agencia</option>
                    <option value="proyecto">Proyecto Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Formato de Salida Preferido
                  </label>
                  <select
                    value={newClientFormat}
                    onChange={(e: any) => setNewClientFormat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="WAV">WAV (Master 24kHz)</option>
                    <option value="MP3">MP3 (Ligero)</option>
                    <option value="STREAM">STREAM (SSE En Vivo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dominio o Identificador Web
                </label>
                <input
                  type="text"
                  placeholder="Ej: radiohorizonte.online o marca.agency.klik"
                  value={newClientDomain}
                  onChange={(e) => setNewClientDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lema o Propósito Radial
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cadena informativa regional de 24 horas"
                  value={newClientTagline}
                  onChange={(e) => setNewClientTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción del Proyecto
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el aislamiento de perfiles de voz y requerimientos acústicos."
                  value={newClientDesc}
                  onChange={(e) => setNewClientDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aprovisionar Espacio Aislado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
