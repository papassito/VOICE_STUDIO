import React, { useState } from 'react';
import { ProjectId, VoiceProfile } from '../types';
import { PROJECTS } from '../data/projectData';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Mic,
  Sliders,
  Volume2,
  Trash2,
  Check,
  Sparkles,
  Copy,
  Radio,
  UserCheck,
  Layers,
  Lock,
  Filter
} from 'lucide-react';

interface Props {
  activeProject: ProjectId;
  voices: VoiceProfile[];
  onUpdateVoice: (voice: VoiceProfile) => void;
  onAddVoice: (voice: VoiceProfile) => void;
  onDeleteVoice: (id: string) => void;
}

export const VoiceProfilesManager: React.FC<Props> = ({
  activeProject,
  voices,
  onUpdateVoice,
  onAddVoice,
  onDeleteVoice
}) => {
  const currentProj = PROJECTS[activeProject] || PROJECTS['nuestraparroquia'];

  const [viewScope, setViewScope] = useState<'current' | 'all'>('current');
  const [filterCategory, setFilterCategory] = useState<'all' | 'clonada' | 'nueva'>('all');
  const [filterAuth, setFilterAuth] = useState<'all' | 'authorized' | 'unauthorized'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'clonada' | 'nueva'>('clonada');
  const [newRole, setNewRole] = useState(currentProj?.allowedRoles[0] || 'Locutor Institucional');
  const [newDescription, setNewDescription] = useState('');
  const [newGeminiVoice, setNewGeminiVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Charon');
  const [newTone, setNewTone] = useState('Radiofónico profesional de alta fidelidad');
  const [newSimilarity, setNewSimilarity] = useState(99.4);

  // Filter voices based on scope and active filters
  const displayedVoices = voices.filter((v) => {
    if (viewScope === 'current' && v.projectId !== activeProject) return false;
    if (filterCategory !== 'all' && v.category !== filterCategory) return false;
    if (filterAuth === 'authorized' && !v.isAuthorized) return false;
    if (filterAuth === 'unauthorized' && v.isAuthorized) return false;
    return true;
  });

  const handleToggleAuthorization = (voice: VoiceProfile) => {
    onUpdateVoice({
      ...voice,
      isAuthorized: !voice.isAuthorized
    });
  };

  const handleSpeedChange = (voice: VoiceProfile, speed: number) => {
    onUpdateVoice({
      ...voice,
      speed
    });
  };

  const handlePitchChange = (voice: VoiceProfile, pitch: number) => {
    onUpdateVoice({
      ...voice,
      pitch
    });
  };

  const handleCreateVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newVoice: VoiceProfile = {
      id: `voice-${Date.now()}`,
      projectId: activeProject,
      clientName: currentProj?.name,
      category: newCategory,
      name: newName.trim(),
      role: newRole,
      description: newDescription.trim() || `Perfil de voz registrado para ${currentProj?.name}.`,
      geminiVoice: newGeminiVoice,
      tone: newTone,
      pitch: 1.0,
      speed: 1.0,
      similarityScore: newCategory === 'clonada' ? newSimilarity : 100,
      isAuthorized: true,
      tags: [newRole, newCategory === 'clonada' ? 'Clonada' : 'Generativa', currentProj?.name || 'Agencia']
    };

    onAddVoice(newVoice);
    setIsModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">
              Banco de Voces • {currentProj?.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              Aislamiento Activo
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Administra los perfiles de voz autorizados para <strong>{currentProj?.name}</strong>. Calibra tono, afinación espectral y permisos de síntesis en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-add-voice-modal"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Registrar Perfil de Voz</span>
          </button>
        </div>
      </div>

      {/* Filter and Scope Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Ámbito de Catálogo:</span>
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewScope('current')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewScope === 'current'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo {currentProj?.name}
            </button>
            <button
              type="button"
              onClick={() => setViewScope('all')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewScope === 'all'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toda la Agencia ({voices.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Tipo:</span>
            <select
              value={filterCategory}
              onChange={(e: any) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            >
              <option value="all">Todas</option>
              <option value="clonada">Clonadas</option>
              <option value="nueva">Nuevas (Sintéticas)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Estado:</span>
            <select
              value={filterAuth}
              onChange={(e: any) => setFilterAuth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            >
              <option value="all">Todos</option>
              <option value="authorized">Solo Autorizadas</option>
              <option value="unauthorized">Sin Autorización</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedVoices.map((voice) => {
          const isClone = voice.category === 'clonada';
          const projName = PROJECTS[voice.projectId]?.name || voice.clientName || voice.projectId;

          return (
            <div
              key={voice.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                voice.isAuthorized
                  ? 'bg-slate-900/90 border-slate-800 shadow-md hover:border-slate-700'
                  : 'bg-slate-950/60 border-rose-950/60 opacity-75'
              }`}
            >
              <div>
                {/* Top Badge: Client & Type */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {projName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isClone
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                          : 'bg-sky-950 text-sky-300 border border-sky-700/50'
                      }`}
                    >
                      {isClone ? 'Clonada' : 'Nueva'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAuthorization(voice)}
                    className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border transition-all ${
                      voice.isAuthorized
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                        : 'bg-rose-950/50 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
                    }`}
                  >
                    {voice.isAuthorized ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Autorizada</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        <span>No Autorizada</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Voice Name & Role */}
                <div className="mt-2">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{voice.name}</span>
                    {isClone && (
                      <span className="text-[10px] text-emerald-400 font-mono font-normal">
                        ({voice.similarityScore || 99.2}% fidelidad)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs font-semibold text-cyan-400 mt-0.5">{voice.role}</p>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                  {voice.description}
                </p>

                {/* Tone Description */}
                <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono">Tono: </span>
                  <span className="text-slate-200 italic">{voice.tone}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {voice.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sliders: Pitch and Speed */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Tono (Pitch):</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{voice.pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.20"
                  step="0.02"
                  value={voice.pitch}
                  onChange={(e) => handlePitchChange(voice, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Velocidad (Cadencia):</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{voice.speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.25"
                  step="0.02"
                  value={voice.speed}
                  onChange={(e) => handleSpeedChange(voice, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-slate-400">
                  <span>Gemini Voice: <strong className="text-slate-300">{voice.geminiVoice}</strong></span>
                  <button
                    type="button"
                    onClick={() => onDeleteVoice(voice.id)}
                    className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                    title="Eliminar perfil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Voice Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">
                  Registrar Perfil en {currentProj?.name}
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

            <form onSubmit={handleCreateVoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Voz *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Padre X, Voz B, Locutor Master, etc."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Voz
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="clonada">Clonada (Fidelidad Espectral)</option>
                    <option value="nueva">Nueva (Síntesis Generativa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motor Base (Gemini TTS)
                  </label>
                  <select
                    value={newGeminiVoice}
                    onChange={(e: any) => setNewGeminiVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Charon">Charon (Barítono Solemne/Profundo)</option>
                    <option value="Kore">Kore (Cálido/FM Nocturna/Empático)</option>
                    <option value="Fenrir">Fenrir (Crónica Ágil/Periodístico)</option>
                    <option value="Zephyr">Zephyr (Matinal/Dinámico/Fresco)</option>
                    <option value="Puck">Puck (Comercial/Punch/Enérgico)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rol en la Emisión
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Ej: Párroco & Guía Espiritual, Conductora FM, Locutor Institucional"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción Acústica y Estilo
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ej: Voz solemne y pausada para homilías dominicales y lecturas sagradas."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tono e Indicación Fonética
                </label>
                <input
                  type="text"
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  placeholder="Ej: Solemne, pastoral, pausado y con resonancia natural"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {newCategory === 'clonada' && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Fidelidad Espectral Calibrada:</span>
                    <span className="font-mono text-emerald-400 font-bold">{newSimilarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="96.0"
                    max="99.9"
                    step="0.1"
                    value={newSimilarity}
                    onChange={(e) => setNewSimilarity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              )}

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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                >
                  Autorizar y Guardar Voz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
