import React, { useState, useEffect } from 'react';
import { ProjectId, ProjectConfig, VoiceProfile, LocutionRecord, ScriptScanResult, ScriptLine } from './types';
import { INITIAL_VOICES, PROJECTS } from './data/projectData';
import { Header, ActiveAppTab } from './components/Header';
import { ClientIsolationManager } from './components/ClientIsolationManager';
import { ScriptScanner } from './components/ScriptScanner';
import { ScriptPlayer } from './components/ScriptPlayer';
import { VoiceEngineStudio } from './components/VoiceEngineStudio';
import { VoiceProfilesManager } from './components/VoiceProfilesManager';
import { LocutionLibrary } from './components/LocutionLibrary';
import { GoCodeViewer } from './components/GoCodeViewer';
import { Radio } from 'lucide-react';

export default function App() {
  const [activeProject, setActiveProject] = useState<ProjectId>('nuestraparroquia');
  const [activeTab, setActiveTab] = useState<ActiveAppTab>('architecture');
  const [customProjects, setCustomProjects] = useState<Record<string, ProjectConfig>>({});
  const [voices, setVoices] = useState<VoiceProfile[]>(INITIAL_VOICES);

  // Initial Radio Locutions (Clean agency branding, NO personal names)
  const [locutions, setLocutions] = useState<LocutionRecord[]>([
    {
      id: 'loc-parroquia-01',
      projectId: 'nuestraparroquia',
      voiceId: 'voice-padre-x',
      voiceName: 'Padre X',
      title: 'Evangelio Dominical y Bendición Pastoral',
      text: 'Hermanos y hermanas, que la paz esté con todos ustedes. En este domingo abrimos el corazón a la escucha de la palabra que renueva nuestra esperanza y fortalece a nuestras familias.',
      format: 'WAV',
      durationSeconds: 12.5,
      fileSizeBytes: 600000,
      mimeType: 'audio/wav',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'completed'
    },
    {
      id: 'loc-radio-02',
      projectId: 'comunidad-radio',
      voiceId: 'voice-voz-b-master',
      voiceName: 'Voz B (Máster Cadena)',
      title: 'Top of the Hour: Identificador Central',
      text: 'Transmitiendo en simultáneo para toda la red de repetidoras y plataforma digital. Señal satelital activa. Son las doce en punto.',
      format: 'STREAM',
      durationSeconds: 9.8,
      fileSizeBytes: 470400,
      mimeType: 'audio/wav',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      status: 'completed'
    },
    {
      id: 'loc-locucion-03',
      projectId: 'locucion',
      voiceId: 'voice-voz-c-institucional',
      voiceName: 'Voz C (Locutor Institucional)',
      title: 'Manifiesto Corporativo de Marca',
      text: 'Creemos en las ideas que transforman realidades. En el poder de innovar con propósito y avanzar con visión hacia el futuro.',
      format: 'WAV',
      durationSeconds: 10.2,
      fileSizeBytes: 489600,
      mimeType: 'audio/wav',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'completed'
    },
    {
      id: 'loc-publicidad-04',
      projectId: 'publicidad',
      voiceId: 'voice-promo-impacto',
      voiceName: 'Voz Comercial de Impacto',
      title: 'Spot Comercial de Fin de Semana',
      text: '¡Solo por este fin de semana! Descuentos irrepetibles en todas las sucursales. ¡Aprovecha ya!',
      format: 'MP3',
      durationSeconds: 7.4,
      fileSizeBytes: 177600,
      mimeType: 'audio/mpeg',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: 'completed'
    }
  ]);

  // Initial Scan Result for the Script Player
  const [currentScanResult, setCurrentScanResult] = useState<ScriptScanResult>({
    title: 'Emisión Especial de Cabina • Cadena Radial y Pastoral',
    genre: 'Magacín Informativo & Diálogo Radial',
    estimatedTotalDurationSec: 36,
    lines: [
      {
        id: 'line-init-1',
        speakerName: 'VOZ B (MÁSTER CADENA)',
        voiceId: 'voice-voz-b-master',
        voiceName: 'Voz B (Máster Cadena)',
        voiceCategory: 'clonada',
        text: 'Atención a la cadena de emisoras asociadas. Iniciamos esta transmisión especial en directo.',
        stageDirection: 'Tono solemne y pausado, proyección de autoridad institucional',
        durationSeconds: 6.5,
        status: 'idle'
      },
      {
        id: 'line-init-2',
        speakerName: 'PADRE X',
        voiceId: 'voice-padre-x',
        voiceName: 'Padre X',
        voiceCategory: 'clonada',
        text: 'Un saludo fraterno a todos nuestros oyentes y comunidades en este encuentro de reflexión y esperanza.',
        stageDirection: 'Solemne, pastoral y cercano con calidez',
        durationSeconds: 8.0,
        status: 'idle'
      },
      {
        id: 'line-init-3',
        speakerName: 'VOZ C (INSTITUCIONAL)',
        voiceId: 'voice-voz-c-institucional',
        voiceName: 'Voz C (Locutor Institucional)',
        voiceCategory: 'nueva',
        text: 'Transmitiendo con la más alta fidelidad técnica y fidelidad vocal en nuestra plataforma.',
        stageDirection: 'Elegante, seguro y perfectamente articulado',
        durationSeconds: 7.0,
        status: 'idle'
      }
    ],
    detectedSpeakers: [
      {
        name: 'VOZ B (MÁSTER CADENA)',
        assignedVoiceId: 'voice-voz-b-master',
        assignedVoiceName: 'Voz B (Máster Cadena)',
        voiceCategory: 'clonada'
      },
      {
        name: 'PADRE X',
        assignedVoiceId: 'voice-padre-x',
        assignedVoiceName: 'Padre X',
        voiceCategory: 'clonada'
      },
      {
        name: 'VOZ C (INSTITUCIONAL)',
        assignedVoiceId: 'voice-voz-c-institucional',
        assignedVoiceName: 'Voz C (Locutor Institucional)',
        voiceCategory: 'nueva'
      }
    ]
  });

  // Load backend voices & locutions on mount and when project changes
  useEffect(() => {
    fetch(`/api/voices?projectId=${encodeURIComponent(activeProject)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVoices((prev) => {
            const others = prev.filter((v) => v.projectId !== activeProject);
            return [...others, ...data];
          });
        }
      })
      .catch((err) => console.log('Backend voices load note:', err));

    fetch(`/api/locutions?projectId=${encodeURIComponent(activeProject)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocutions((prev) => {
            const others = prev.filter((l) => l.projectId !== activeProject);
            return [...data, ...others];
          });
        }
      })
      .catch((err) => console.log('Backend locutions load note:', err));
  }, [activeProject]);

  const handleAddCustomProject = (newProj: ProjectConfig) => {
    setCustomProjects((prev) => ({
      ...prev,
      [newProj.id]: newProj
    }));
    setActiveProject(newProj.id);
  };

  const handleLocutionCreated = (newLoc: LocutionRecord) => {
    setLocutions((prev) => [newLoc, ...prev]);
  };

  const handleUpdateVoice = async (updatedVoice: VoiceProfile) => {
    setVoices((prev) => prev.map((v) => (v.id === updatedVoice.id ? updatedVoice : v)));
    try {
      await fetch('/api/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVoice)
      });
    } catch (err) {
      console.error('Error syncing voice update:', err);
    }
  };

  const handleAddVoice = async (newVoice: VoiceProfile) => {
    setVoices((prev) => [...prev, newVoice]);
    try {
      await fetch('/api/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVoice)
      });
    } catch (err) {
      console.error('Error syncing new voice:', err);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    setVoices((prev) => prev.filter((v) => v.id !== id));
    try {
      await fetch(`/api/voices/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting voice:', err);
    }
  };

  // Called when user finishes scanning in ScriptScanner and clicks "Cargar en Reproductor"
  const handleLoadScanIntoPlayer = (scanResult: ScriptScanResult) => {
    setCurrentScanResult(scanResult);
    setActiveTab('script-player');
  };

  // Update lines when synthesized or assigned in ScriptPlayer
  const handleUpdateScriptLines = (updatedLines: ScriptLine[]) => {
    setCurrentScanResult((prev) => ({
      ...prev,
      lines: updatedLines
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* App Header & Navigation */}
      <Header
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        customProjects={customProjects}
        onOpenNewClientModal={() => setActiveTab('architecture')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Arquitectura de la Agencia y Gestión de Clientes */}
        {activeTab === 'architecture' && (
          <ClientIsolationManager
            activeProject={activeProject}
            onSelectProject={setActiveProject}
            customProjects={customProjects}
            onAddCustomProject={handleAddCustomProject}
            voices={voices}
            onNavigateToEngine={() => setActiveTab('engine')}
            onNavigateToVoices={() => setActiveTab('voices')}
          />
        )}

        {/* Tab 2: Voice Engine Rápido */}
        {activeTab === 'engine' && (
          <VoiceEngineStudio
            activeProject={activeProject}
            voices={voices}
            onLocutionCreated={handleLocutionCreated}
            onNavigateToScanner={() => setActiveTab('script-scanner')}
          />
        )}

        {/* Tab 3: Catálogo de Voces Autorizadas */}
        {activeTab === 'voices' && (
          <VoiceProfilesManager
            activeProject={activeProject}
            voices={voices}
            onUpdateVoice={handleUpdateVoice}
            onAddVoice={handleAddVoice}
            onDeleteVoice={handleDeleteVoice}
          />
        )}

        {/* Tab 4: Escáner e Intérprete de Guiones */}
        {activeTab === 'script-scanner' && (
          <ScriptScanner
            voices={voices}
            onLoadIntoPlayer={handleLoadScanIntoPlayer}
          />
        )}

        {/* Tab 5: Reproductor Basado en Guión (Consola de Emisión) */}
        {activeTab === 'script-player' && (
          <ScriptPlayer
            scanResult={currentScanResult}
            voices={voices}
            onUpdateLines={handleUpdateScriptLines}
            onNavigateToScanner={() => setActiveTab('script-scanner')}
          />
        )}

        {/* Tab 6: Archivo de Locuciones y Emisiones */}
        {activeTab === 'library' && (
          <LocutionLibrary
            activeProject={activeProject}
            locutions={locutions}
          />
        )}

        {/* Tab 7: Código Go Autocontenido (Sin GitHub) */}
        {activeTab === 'go-code' && (
          <GoCodeViewer />
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">VOICE STUDIO by KLIK</span>
            <span className="text-slate-500">•</span>
            <span>Agencia Centralizada de Voces IA • Aislamiento Multi-Tenant</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Voice Engine Operativo</span>
            </span>
            <span>Formatos: MP3 | WAV | STREAM</span>
            <span className="text-cyan-400 font-semibold">100% Autónomo (Sin GitHub)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
