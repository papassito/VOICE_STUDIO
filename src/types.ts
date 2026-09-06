export type AudioFormat = 'MP3' | 'WAV' | 'STREAM';

export type TenantType = 'cliente' | 'vertical' | 'proyecto';

export type ProjectId = string;

export interface ProjectConfig {
  id: string;
  name: string;
  type: TenantType;
  domain: string;
  tagline: string;
  description: string;
  themeColor: string;
  accentColor: string;
  iconName: string;
  isolationToken: string;
  allowedRoles: string[];
  defaultFormat: AudioFormat;
  presets: {
    title: string;
    text: string;
    suggestedVoice: string;
    category: string;
  }[];
}

export interface VoiceProfile {
  id: string;
  projectId: string; // Tenant isolation key
  clientName?: string;
  category: 'clonada' | 'nueva';
  name: string; // e.g. "Padre X", "Voz B", "Voz C", etc.
  role: string;
  description: string;
  geminiVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  tone: string;
  pitch: number;
  speed: number;
  similarityScore?: number; // For cloned voices (e.g. 99.4% fidelidad espectral)
  isAuthorized: boolean;
  tags: string[];
}

export interface ScriptLine {
  id: string;
  speakerName: string; // e.g. "Padre X", "Voz B", "Locutor Central", "Comercial"
  text: string;
  stageDirection?: string; // [SFX: ...], [Tono: ...]
  voiceId: string;
  voiceName: string;
  voiceCategory: 'clonada' | 'nueva';
  durationSeconds: number;
  audioBase64?: string;
  mimeType?: string;
  status: 'idle' | 'synthesizing' | 'ready' | 'error';
}

export interface ScriptScanResult {
  title: string;
  summary: string;
  genre: string; // e.g. "Liturgia Radial", "Flash Informativo", "Cuña Comercial", "Audiolibro"
  detectedSpeakers: {
    name: string;
    suggestedVoiceId: string;
    suggestedVoiceName: string;
    category: 'clonada' | 'nueva';
    voicePitchRecommendation: string;
  }[];
  soundEffects: string[];
  estimatedTotalSeconds: number;
  wordCount: number;
  lines: ScriptLine[];
}

export interface LocutionRecord {
  id: string;
  projectId: string; // Isolated per client
  voiceId: string;
  voiceName: string;
  title: string;
  text: string;
  format: AudioFormat;
  durationSeconds: number;
  fileSizeBytes: number;
  audioBase64?: string;
  mimeType: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface GoCodeFile {
  path: string;
  title: string;
  description: string;
  language: 'go' | 'dockerfile' | 'makefile' | 'markdown' | 'mod';
  content: string;
}

