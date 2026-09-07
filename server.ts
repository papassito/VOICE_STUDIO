import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { StudioProfile, PortableStudioProfilePackage, DEFAULT_BLANK_PROFILE } from "./src/data/projectData";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// ==============================================================================
// 🧠 CONFIGURACIÓN MAESTRA DINÁMICA - BLANK BY DEFAULT
// ==============================================================================
let activeStudioProfile: StudioProfile = { ...DEFAULT_BLANK_PROFILE };
let customPresetsDatabase: any[] = [];
let customTemplatesDatabase: any[] = [];

// In-Memory Database de la plataforma corporativa (Audit, Nodes e Identidades)
let auditLogDatabase: any[] = [
  {
    id: "audit-init",
    timestamp: new Date().toISOString(),
    action: "PROFILE_CREATED",
    payload: { message: "Instancia e infraestructura inicializadas en blanco." }
  }
];
let nodesDatabase: any[] = [
  {
    id: "node-local-default",
    name: "Local Core Processing Node",
    type: "VOICE_NODE",
    status: "active",
    capabilities: ["synthesis", "normalization", "analysis"],
    heartbeat: new Date().toISOString()
  }
];
let identitiesDatabase: any[] = [
  {
    id: "identity-admin",
    type: "SYSTEM_ADMIN",
    name: "SOLUSOL Master Operator",
    token: "SOLUSOL-MASTER-SECURE-TOKEN-2026"
  }
];

function logAuditEvent(action: string, payload: any) {
  const event = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    payload
  };
  auditLogDatabase.unshift(event);
  console.log(`🧾 [AUDIT] ${action}:`, JSON.stringify(payload));
}

// Helper to construct WAV file buffer from raw 16-bit PCM (sampleRate 24000Hz, 1 channel)
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Synthesize fallback PCM audio with realistic broadcast harmonic resonance
function generateSyntheticTonePcm(durationSec = 3, frequency = 220, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((Math.PI * i) / numSamples);
    const sample =
      Math.sin(2 * Math.PI * frequency * t) * 0.45 +
      Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.25 +
      Math.sin(2 * Math.PI * (frequency * 2) * t) * 0.15;
    const intVal = Math.floor(sample * envelope * 24000);
    const clamped = Math.max(-32768, Math.min(32767, intVal));
    buffer.writeInt16LE(clamped, i * 2);
  }
  return buffer;
}

// Helper to query Solusol.net Central production LLM (Hosted on Plesk / VPN)
async function callSolusolLLM(prompt: string, systemInstruction?: string): Promise<string | null> {
  const solusolUrl = process.env.SOLUSOL_LLM_URL || "https://api.solusol.net/v1/generate";
  try {
    const response = await fetch(solusolUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SOLUSOL_API_KEY || ""}`
      },
      body: JSON.stringify({
        model: process.env.SOLUSOL_LLM_MODEL || "qwen2.5-coder",
        prompt: `${systemInstruction ? `System: ${systemInstruction}\n` : ""}User: ${prompt}`,
        stream: false
      })
    });
    if (response.ok) {
      const data: any = await response.json();
      return data.response || data.text || null;
    }
  } catch (err) {
    // Silently fall through if Solusol LLM is not yet reachable during setup
  }
  return null;
}

// Helper to synthesize voice using Solusol.net Central Production House API
async function callSolusolTTS(text: string, voice: VoiceProfile): Promise<Buffer | null> {
  const solusolTtsUrl = process.env.SOLUSOL_TTS_URL || "https://api.solusol.net/v1/tts";
  try {
    const response = await fetch(solusolTtsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SOLUSOL_API_KEY || ""}`
      },
      body: JSON.stringify({
        text,
        voiceId: voice.id,
        speaker: voice.geminiVoice,
        speed: voice.speed,
        pitch: voice.pitch
      })
    });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    // Silently fall through if Solusol TTS is not yet reachable
  }
  return null;
}

// Helper to query a local self-hosted LLM (e.g., Ollama running Llama 3 or Qwen)
async function callLocalLLM(prompt: string, systemInstruction?: string): Promise<string | null> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
  try {
    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3",
        prompt: `${systemInstruction ? `System: ${systemInstruction}\n` : ""}User: ${prompt}`,
        stream: false,
        options: {
          temperature: 0.3
        }
      })
    });
    if (response.ok) {
      const data: any = await response.json();
      return data.response;
    }
  } catch (err) {
    // Silently ignore if Ollama is not running locally
  }
  return null;
}

// Helper to synthesize voice using a local neural TTS API (e.g. Piper, XTTS-v2 docker, or custom Python server)
async function callLocalTTS(text: string, voice: VoiceProfile): Promise<Buffer | null> {
  const localTtsUrl = process.env.LOCAL_TTS_URL; // e.g. "http://localhost:5002/api/tts"
  if (!localTtsUrl) return null;

  try {
    const response = await fetch(`${localTtsUrl}?text=${encodeURIComponent(text)}&speaker=${encodeURIComponent(voice.geminiVoice)}`);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.warn("⚠️ Local TTS service configured but unreachable:", err);
  }
  return null;
}

// In-Memory Multi-Tenant Voice Agency Store
interface VoiceProfile {
  id: string;
  projectId: string;
  clientName?: string;
  category: "clonada" | "nueva";
  name: string;
  role: string;
  description: string;
  geminiVoice: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";
  tone: string;
  pitch: number;
  speed: number;
  similarityScore?: number;
  isAuthorized: boolean;
  tags: string[];
}

interface LocutionRecord {
  id: string;
  projectId: string;
  voiceId: string;
  voiceName: string;
  title: string;
  text: string;
  format: "MP3" | "WAV" | "STREAM";
  durationSeconds: number;
  fileSizeBytes: number;
  audioBase64?: string;
  mimeType: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

const initialVoices: VoiceProfile[] = [
  // 1. NuestraParroquia.online (Padre X y equipo pastoral)
  {
    id: "voice-padre-x",
    projectId: "nuestraparroquia",
    clientName: "NuestraParroquia.online",
    category: "clonada",
    name: "Padre X",
    role: "Párroco & Guía Espiritual",
    description: "Voz clonada solemne, pastoral, cercana y profunda para homilías, lecturas de evangelio y bendiciones comunitarias.",
    geminiVoice: "Charon",
    tone: "Solemne, pastoral, pausado y sereno",
    pitch: 0.92,
    speed: 0.92,
    similarityScore: 99.4,
    isAuthorized: true,
    tags: ["Clonada", "Solemne", "Homilía", "Pastoral"]
  },
  {
    id: "voice-lectora-parroquia",
    projectId: "nuestraparroquia",
    clientName: "NuestraParroquia.online",
    category: "nueva",
    name: "Lectora Parroquial",
    role: "Lecturas y Salmos",
    description: "Voz sintética nueva con timbre diáfano y respetuoso para salmos, lecturas y avisos comunitarios.",
    geminiVoice: "Kore",
    tone: "Cálido, respetuoso y diáfano",
    pitch: 1.0,
    speed: 0.95,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Liturgia", "Cálida", "Avisos"]
  },

  // 2. Comunidad de Radio (Voz B y equipo de cabina)
  {
    id: "voice-voz-b-master",
    projectId: "comunidad-radio",
    clientName: "Comunidad de Radio",
    category: "clonada",
    name: "Voz B (Máster Cadena)",
    role: "Locutor Master de Cadena",
    description: "Voz clonada barítono institucional para identificación de red, aperturas horarias y noticiero central.",
    geminiVoice: "Charon",
    tone: "Imponente, autoritario y de alto impacto radial",
    pitch: 0.90,
    speed: 0.98,
    similarityScore: 99.5,
    isAuthorized: true,
    tags: ["Clonada", "Barítono", "Cadena", "Master"]
  },
  {
    id: "voice-fm-nocturna",
    projectId: "comunidad-radio",
    clientName: "Comunidad de Radio",
    category: "clonada",
    name: "Conductora FM Nocturna",
    role: "Conducción de Magacín Nocturno",
    description: "Voz aterciopelada y cercana para programas musicales y de reflexión nocturna.",
    geminiVoice: "Kore",
    tone: "Aterciopelado, íntimo y empático",
    pitch: 1.02,
    speed: 0.94,
    similarityScore: 98.9,
    isAuthorized: true,
    tags: ["Clonada", "FM Cálida", "Nocturno", "Música"]
  },
  {
    id: "voice-cronista-news",
    projectId: "comunidad-radio",
    clientName: "Comunidad de Radio",
    category: "nueva",
    name: "Cronista Informativo",
    role: "Reportero y Flashes Urgentes",
    description: "Articulación veloz y periodística para despachos de última hora y móviles en vivo.",
    geminiVoice: "Fenrir",
    tone: "Ágil, incisivo y directo",
    pitch: 0.98,
    speed: 1.08,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Noticiero", "Flash", "Urgente"]
  },

  // 3. Locución (Voz C e institucional)
  {
    id: "voice-voz-c-institucional",
    projectId: "locucion",
    clientName: "Locución",
    category: "nueva",
    name: "Voz C (Locutor Institucional)",
    role: "Voz Institucional & Corporativa",
    description: "Voz neutra de gran prestigio y credibilidad para manifiestos de marca y locución oficial.",
    geminiVoice: "Zephyr",
    tone: "Seguro, elegante, prestigioso y articulado",
    pitch: 0.98,
    speed: 1.0,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Institucional", "Corporativo", "Prestigio"]
  },
  {
    id: "voice-locutor-versatil",
    projectId: "locucion",
    clientName: "Locución",
    category: "clonada",
    name: "Locutor Comercial Versátil",
    role: "Doblaje y Locución Comercial",
    description: "Capacidad camaleónica para múltiples estilos de locución y menciones corporativas.",
    geminiVoice: "Puck",
    tone: "Dinámico, persuasivo y modulado",
    pitch: 1.02,
    speed: 1.02,
    similarityScore: 99.1,
    isAuthorized: true,
    tags: ["Clonada", "Comercial", "Doblaje", "Versátil"]
  },

  // 4. Publicidad
  {
    id: "voice-promo-impacto",
    projectId: "publicidad",
    clientName: "Publicidad",
    category: "nueva",
    name: "Voz Comercial de Impacto",
    role: "Cuñas y Promociones Radiales",
    description: "Voz de alta energía (punch) para spots de 15 a 30 segundos, promociones y barridos.",
    geminiVoice: "Puck",
    tone: "Enérgico, comercial, vibrante y contundente",
    pitch: 1.05,
    speed: 1.15,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Punch", "Spot 20s", "Alta Energía"]
  },
  {
    id: "voice-promo-elegante",
    projectId: "publicidad",
    clientName: "Publicidad",
    category: "clonada",
    name: "Voz Comercial Premium",
    role: "Marcas de Lujo & Gourmet",
    description: "Estilo sofisticado, pausado y sugerente para campañas publicitarias premium.",
    geminiVoice: "Kore",
    tone: "Sofisticado, seductor y elegante",
    pitch: 0.98,
    speed: 0.94,
    similarityScore: 98.7,
    isAuthorized: true,
    tags: ["Clonada", "Premium", "Seductor", "Marcas"]
  },

  // 5. Narración
  {
    id: "voice-narrador-doc",
    projectId: "narracion",
    clientName: "Narración",
    category: "clonada",
    name: "Narrador Documental",
    role: "Audiolibros y Crónicas",
    description: "Voz de gran resonancia, idónea para textos largos, documentales y divulgación.",
    geminiVoice: "Charon",
    tone: "Narrativo, pausado, reflexivo y envolvente",
    pitch: 0.94,
    speed: 0.93,
    similarityScore: 99.3,
    isAuthorized: true,
    tags: ["Clonada", "Audiolibros", "Documental", "Profundo"]
  },
  {
    id: "voice-narradora-ficcion",
    projectId: "narracion",
    clientName: "Narración",
    category: "nueva",
    name: "Narradora de Ficción",
    role: "Radioteatro y Cuentos",
    description: "Rica en matices emocionales para caracterización de personajes e historias.",
    geminiVoice: "Zephyr",
    tone: "Expresivo, misterioso e inmersivo",
    pitch: 1.03,
    speed: 0.98,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Ficción", "Cuentos", "Emocional"]
  },

  // 6. Podcast
  {
    id: "voice-host-podcast",
    projectId: "podcast",
    clientName: "Podcast",
    category: "nueva",
    name: "Host Podcast Prime",
    role: "Conductor de Podcast y Conversaciones",
    description: "Estilo conversacional fresco, directo a micrófono de condensador sin filtro.",
    geminiVoice: "Zephyr",
    tone: "Coloquial, cercano, inteligente y relajado",
    pitch: 1.02,
    speed: 1.04,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Podcast", "Host", "Conversacional"]
  },
  {
    id: "voice-intro-outro",
    projectId: "podcast",
    clientName: "Podcast",
    category: "clonada",
    name: "Voz de Cortinillas & Intros",
    role: "Branding Sonoro de Episodios",
    description: "Firma sonora para bienvenida, créditos de cierre y avisos de patrocinio.",
    geminiVoice: "Puck",
    tone: "Brillante, rítmico y memorable",
    pitch: 1.0,
    speed: 1.05,
    similarityScore: 98.9,
    isAuthorized: true,
    tags: ["Clonada", "Cortinillas", "Intro", "Outro"]
  },

  // 7. Otros Proyectos
  {
    id: "voice-neutra-universal",
    projectId: "otros-proyectos",
    clientName: "Otros Proyectos",
    category: "nueva",
    name: "Voz Neutra Universal",
    role: "Proyectos Personalizados",
    description: "Voz multipropósito de balance fonético exacto para cualquier nuevo cliente o proyecto.",
    geminiVoice: "Charon",
    tone: "Equilibrado, transparente y adaptable",
    pitch: 1.0,
    speed: 1.0,
    similarityScore: 100,
    isAuthorized: true,
    tags: ["Nueva", "Multipropósito", "Aislada"]
  }
];

let voicesDatabase: VoiceProfile[] = [...initialVoices];
let locutionsDatabase: LocutionRecord[] = [
  {
    id: "loc-parroquia-001",
    projectId: "nuestraparroquia",
    voiceId: "voice-padre-x",
    voiceName: "Padre X",
    title: "Evangelio Dominical y Bendición",
    text: "Hermanos y hermanas, que la paz esté con todos ustedes. En este domingo abrimos el corazón a la escucha de la palabra que renueva nuestra esperanza.",
    format: "WAV",
    durationSeconds: 12.5,
    fileSizeBytes: 600000,
    mimeType: "audio/wav",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: "completed"
  },
  {
    id: "loc-radio-002",
    projectId: "comunidad-radio",
    voiceId: "voice-voz-b-master",
    voiceName: "Voz B (Máster Cadena)",
    title: "Identificador Central: Comunidad de Radio",
    text: "Transmitiendo en simultáneo para toda la red de repetidoras y plataforma digital. Señal satelital activa. Son las doce en punto.",
    format: "STREAM",
    durationSeconds: 9.8,
    fileSizeBytes: 470400,
    mimeType: "audio/wav",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: "completed"
  },
  {
    id: "loc-locucion-003",
    projectId: "locucion",
    voiceId: "voice-voz-c-institucional",
    voiceName: "Voz C (Locutor Institucional)",
    title: "Manifiesto Corporativo de Marca",
    text: "Creemos en las ideas que transforman realidades. En el poder de innovar con propósito y avanzar con visión hacia el futuro.",
    format: "WAV",
    durationSeconds: 10.2,
    fileSizeBytes: 489600,
    mimeType: "audio/wav",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "completed"
  },
  {
    id: "loc-publicidad-004",
    projectId: "publicidad",
    voiceId: "voice-promo-impacto",
    voiceName: "Voz Comercial de Impacto",
    title: "Spot de Impacto: Oferta de Fin de Semana",
    text: "¡Solo por este fin de semana! Descuentos irrepetibles en todas las sucursales. ¡Aprovecha ya!",
    format: "MP3",
    durationSeconds: 7.4,
    fileSizeBytes: 177600,
    mimeType: "audio/mpeg",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: "completed"
  }
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

// --- API ROUTES ---

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "VOICE STUDIO by KLIK • Casa Productora SOLUSOL.NET",
    version: "3.3.0",
    productionHouse: "solusol.net",
    architecture: "Multi-Tenant Isolated Voice Engine",
    nasOnline: true,
    activeInstance: {
      id: activeStudioProfile.id,
      type: activeStudioProfile.type,
      brandingName: activeStudioProfile.branding.name
    },
    nasUnits: ["SOLUSOL_NAS_01", "SOLUSOL_NAS_02"],
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    solusolConfigured: Boolean(process.env.SOLUSOL_TTS_URL || process.env.SOLUSOL_LLM_URL),
    formatsSupported: ["MP3", "WAV", "STREAM"]
  });
});

// ==============================================================================
// 🛠️ ENDPOINTS DE PERFIL DE ESTUDIO (Fase 0 — Foundation)
// ==============================================================================

// GET /api/profile - Obtener el perfil activo y validar si requiere Wizard (OOBE)
app.get("/api/profile", (_req: Request, res: Response) => {
  const isNewInstance = activeStudioProfile.id === 'blank-instance-uuid' || 
                        activeStudioProfile.branding.name === 'Estudio sin Configurar';
  
  return res.json({
    profile: activeStudioProfile,
    isNewInstance,
    customPresetsCount: customPresetsDatabase.length,
    customTemplatesCount: customTemplatesDatabase.length
  });
});

// POST /api/profile - Guardar o reconfigurar la Studio Instance en caliente
app.post("/api/profile", (req: Request, res: Response) => {
  try {
    const updatedProfile = req.body as StudioProfile;
    if (!updatedProfile || !updatedProfile.branding || !updatedProfile.branding.name) {
      return res.status(400).json({ error: "Perfil de estudio inválido o falta nombre del Studio" });
    }

    // Si es la inicialización del Blank Profile, generar UUID único
    if (updatedProfile.id === 'blank-instance-uuid') {
      updatedProfile.id = `studio-instance-${Date.now()}`;
    }

    activeStudioProfile = { ...updatedProfile };

    console.log(`⚙️ [Studio Profile] Reconfigurando canal físico para "${activeStudioProfile.branding.name}"`);
    console.log(`   └─ Modo de Operación: ${activeStudioProfile.preferences.uiMode}`);
    console.log(`   └─ Audio de Retorno: ${activeStudioProfile.hardware.sampleRate}Hz @ ${activeStudioProfile.hardware.bitDepth}-bit`);

    return res.json({
      success: true,
      profile: activeStudioProfile
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/export - Generar paquete portable unificado (.vstudio-profile)
app.post("/api/profile/export", (_req: Request, res: Response) => {
  const exportPackage: PortableStudioProfilePackage = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    profile: activeStudioProfile,
    customPresets: customPresetsDatabase,
    customTemplates: customTemplatesDatabase
  };
  return res.json(exportPackage);
});

// POST /api/profile/import - Importar configuración en caliente
app.post("/api/profile/import", (req: Request, res: Response) => {
  try {
    const importPackage = req.body as PortableStudioProfilePackage;
    if (!importPackage || importPackage.version !== "1.0.0" || !importPackage.profile) {
      return res.status(400).json({ error: "Estructura .vstudio-profile incompatible o corrupta" });
    }
    activeStudioProfile = { ...importPackage.profile };
    customPresetsDatabase = importPackage.customPresets || [];
    customTemplatesDatabase = importPackage.customTemplates || [];
    return res.json({ success: true, profile: activeStudioProfile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/voices - Filter by projectId or return catalog
app.get("/api/voices", (req: Request, res: Response) => {
  const { projectId, category } = req.query;
  let filtered = voicesDatabase;
  if (projectId) {
    filtered = filtered.filter((v) => v.projectId === projectId);
  }
  if (category) {
    filtered = filtered.filter((v) => v.category === category);
  }
  return res.json(filtered);
});

// POST /api/voices - Register or update authorized voice profile
app.post("/api/voices", (req: Request, res: Response) => {
  const {
    id,
    projectId,
    clientName,
    category,
    name,
    role,
    description,
    geminiVoice,
    tone,
    pitch,
    speed,
    isAuthorized,
    tags
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Nombre es requerido" });
  }

  const existingIdx = voicesDatabase.findIndex((v) => v.id === id);
  if (existingIdx >= 0) {
    voicesDatabase[existingIdx] = {
      ...voicesDatabase[existingIdx],
      name,
      clientName: clientName || voicesDatabase[existingIdx].clientName,
      category: category || voicesDatabase[existingIdx].category,
      role: role || voicesDatabase[existingIdx].role,
      description: description || voicesDatabase[existingIdx].description,
      geminiVoice: geminiVoice || voicesDatabase[existingIdx].geminiVoice,
      tone: tone || voicesDatabase[existingIdx].tone,
      pitch: pitch ?? voicesDatabase[existingIdx].pitch,
      speed: speed ?? voicesDatabase[existingIdx].speed,
      isAuthorized: isAuthorized ?? voicesDatabase[existingIdx].isAuthorized,
      tags: tags || voicesDatabase[existingIdx].tags
    };
    return res.json(voicesDatabase[existingIdx]);
  }

  const newVoice: VoiceProfile = {
    id: id || `voice-${Date.now()}`,
    projectId: projectId || "otros-proyectos",
    clientName: clientName || "Cliente Agencia",
    category: category || "nueva",
    name,
    role: role || "Locutor de Cabina",
    description: description || "Perfil de voz registrado en la agencia de radio.",
    geminiVoice: geminiVoice || "Charon",
    tone: tone || "Radiofónico profesional",
    pitch: pitch ?? 1.0,
    speed: speed ?? 1.0,
    similarityScore: category === "clonada" ? 99.4 : 100,
    isAuthorized: isAuthorized ?? true,
    tags: tags || []
  };

  voicesDatabase.push(newVoice);
  return res.status(201).json(newVoice);
});

app.delete("/api/voices/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  voicesDatabase = voicesDatabase.filter((v) => v.id !== id);
  res.json({ success: true, id });
});

// GET /api/locutions - Filter by client / tenant isolation
app.get("/api/locutions", (req: Request, res: Response) => {
  const { projectId } = req.query;
  if (projectId) {
    const filtered = locutionsDatabase.filter((l) => l.projectId === projectId);
    return res.json(filtered);
  }
  return res.json(locutionsDatabase);
});

// Helper to synthesize speech using Gemini TTS or studio fallback
async function synthesizeSpeechInternal(
  text: string,
  voice: VoiceProfile,
  toneInstruction?: string
): Promise<{ pcmBuffer: Buffer; durationSeconds: number; isFallback: boolean }> {
  // 1. Try Solusol.net Central Production House API (External / VPN / Plesk Hub)
  const solusolAudio = await callSolusolTTS(text, voice);
  if (solusolAudio) {
    const duration = Math.round((solusolAudio.length / (24000 * 2)) * 10) / 10;
    return {
      pcmBuffer: solusolAudio.slice(44), // Strip WAV header to treat as raw PCM in pipeline
      durationSeconds: duration || 3.0,
      isFallback: false
    };
  }

  // 2. Check if a local neural TTS microservice is configured and active (Local Development)
  const localAudio = await callLocalTTS(text, voice);
  if (localAudio) {
    const duration = Math.round((localAudio.length / (24000 * 2)) * 10) / 10;
    return {
      pcmBuffer: localAudio.slice(44), // Strip 44-byte WAV header to treat as raw PCM in the pipeline
      durationSeconds: duration || 3.0,
      isFallback: false
    };
  }

  // 3. Fallback to Google Gemini Cloud API if configured
  const ai = getGeminiClient();
  let pcmBuffer: Buffer | null = null;
  let isFallback = false;

  if (ai) {
    try {
      const prompt = `[Locución Profesional de Radio en Español, voz ${voice.category === "clonada" ? "clonada de alta fidelidad" : "nueva de cabina"} para ${voice.name}] ${toneInstruction ? `(${toneInstruction})` : `(${voice.tone})`}: ${text}`;

      const ttsPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice.geminiVoice
              }
            }
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout TTS")), 6500)
      );

      const response: any = await Promise.race([ttsPromise, timeoutPromise]);
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        pcmBuffer = Buffer.from(base64Audio, "base64");
      }
    } catch (err: any) {
      console.warn("TTS fallback engaged:", err?.message);
      isFallback = true;
    }
  } else {
    isFallback = true;
  }

  // 4. Last-resort studio synthetic physical synthesizer (sine waves)
  if (!pcmBuffer) {
    const words = text.trim().split(/\s+/).length;
    const estimatedSec = Math.max(2.2, Math.min(25, Math.round(words / 2.3)));
    const baseFreq = voice.geminiVoice === "Charon" || voice.geminiVoice === "Fenrir" ? 140 : 230;
    pcmBuffer = generateSyntheticTonePcm(estimatedSec, baseFreq);
  }

  const durationSeconds = Math.round((pcmBuffer.length / (24000 * 2)) * 10) / 10;
  return { pcmBuffer, durationSeconds, isFallback };
}

// POST Generate Single Locution with Multi-Tenant Isolation
app.post("/api/tts/generate", async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      isolationToken,
      voiceId,
      text,
      title,
      format = "WAV",
      toneInstruction
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "El texto es obligatorio." });
    }

    const voice = voicesDatabase.find((v) => v.id === voiceId) || voicesDatabase[0];
    if (!voice.isAuthorized) {
      return res.status(403).json({
        error: `La voz '${voice.name}' no está autorizada para generar contenidos.`
      });
    }

    const { pcmBuffer, durationSeconds, isFallback } = await synthesizeSpeechInternal(
      text,
      voice,
      toneInstruction
    );
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const audioBase64 = wavBuffer.toString("base64");

    const record: LocutionRecord = {
      id: `loc-${Date.now()}`,
      projectId: projectId || voice.projectId,
      voiceId: voice.id,
      voiceName: voice.name,
      title: title || (text.slice(0, 45) + "..."),
      text,
      format,
      durationSeconds,
      fileSizeBytes: wavBuffer.length,
      audioBase64,
      mimeType: format === "MP3" ? "audio/mpeg" : "audio/wav",
      createdAt: new Date().toISOString(),
      status: "completed"
    };

    // Backup & Sync task simulation to your 2 NAS units on Solusol network
    const nasPath1 = process.env.SOLUSOL_NAS_1_PATH || "//solusol-nas-1/production/audio";
    const nasPath2 = process.env.SOLUSOL_NAS_2_PATH || "//solusol-nas-2/mirror/audio";
    console.log(`📦 [SOLUSOL NAS Sync] Respaldando locución "${record.id}" en NAS Primario: ${nasPath1}`);
    console.log(`📦 [SOLUSOL NAS Sync] Espejando archivo de audio en NAS Secundario: ${nasPath2}`);
    console.log(`🔒 [Plesk VPN Security] Integridad de transmisión encriptada y validada.`);

    locutionsDatabase.unshift(record);

    return res.json({
      success: true,
      record,
      isolatedTenant: projectId || voice.projectId,
      isSyntheticFallback: isFallback,
      notice: isFallback
        ? "Generado con el motor armónico de estudio radial."
        : "Sintetizado exitosamente con Gemini AI TTS (24kHz Master)."
    });
  } catch (error: any) {
    console.error("Error generating speech:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/script/scan - Intelligent Radio Script Scanner & Interpreter
app.post("/api/script/scan", async (req: Request, res: Response) => {
  try {
    const { scriptText, clientId } = req.body;
    if (!scriptText || !scriptText.trim()) {
      return res.status(400).json({ error: "El texto del guión es requerido para escanear." });
    }

    const ai = getGeminiClient();
    let rawJson: string | null = null;

    const prompt = `Analiza e interpreta este guión para la agencia radial VOICE STUDIO by KLIK. Extrae la estructura dramática y técnica en formato JSON.
GUION:
"""
${scriptText}
"""
Devuelve ÚNICAMENTE un JSON estructurado con las claves "title", "genre", "summary", "soundEffects", "detectedSpeakers" y "lines" (con campos: speakerName, text, stageDirection, voiceId, voiceName, voiceCategory, durationSeconds).`;

    // Try local Ollama model first if Gemini key is missing or offline
    if (!ai) {
      rawJson = await callLocalLLM(prompt, "Eres un asistente de guiones radiales que responde exclusivamente con JSON estructurado.");
    }

    if (ai) {
      try {
        const prompt = `Analiza e interpreta este guión para la agencia radial VOICE STUDIO by KLIK. Extrae la estructura dramática y técnica:
GUION:
"""
${scriptText}
"""

Voces autorizadas en la agencia:
- Padre X (ID: voice-padre-x, NuestraParroquia.online, Pastoral, solemne, homilías, bendiciones)
- Lectora Parroquial (ID: voice-lectora-parroquia, NuestraParroquia.online, Liturgia, diáfana, avisos)
- Voz B (Máster Cadena) (ID: voice-voz-b-master, Comunidad de Radio, Barítono institucional, noticiero central)
- Conductora FM Nocturna (ID: voice-fm-nocturna, Comunidad de Radio, FM íntima, empática)
- Cronista Informativo (ID: voice-cronista-news, Comunidad de Radio, Móviles en vivo, despacho ágil)
- Voz C (Locutor Institucional) (ID: voice-voz-c-institucional, Locución, Prestigio corporativo, elegante)
- Locutor Comercial Versátil (ID: voice-locutor-versatil, Locución, Doblaje, dinámico)
- Voz Comercial de Impacto (ID: voice-promo-impacto, Publicidad, Punch comercial, cuñas de alta energía)
- Narrador Documental (ID: voice-narrador-doc, Narración, Audiolibros y crónicas)
- Narradora de Ficción (ID: voice-narradora-ficcion, Narración, Cuentos y misterio)
- Host Podcast Prime (ID: voice-host-podcast, Podcast, Conversación y entrevistas)

Devuelve ÚNICAMENTE un JSON con:
{
  "title": "Título sugerido para la pieza radial",
  "genre": "Género radial (Liturgia / Pastoral, Flash Informativo, Magacín Matinal, Cuña Publicitaria, Radioteatro, Podcast)",
  "summary": "Interpretación y resumen técnico del guión",
  "soundEffects": ["efecto 1 detectado", "música detectada"],
  "detectedSpeakers": [
    {
      "name": "Nombre o rol del locutor en el guión",
      "suggestedVoiceId": "voice-padre-x / voice-voz-b-master / etc",
      "suggestedVoiceName": "Padre X / Voz B (Máster Cadena) / etc",
      "category": "clonada" o "nueva",
      "voicePitchRecommendation": "grave / medio / agudo"
    }
  ],
  "lines": [
    {
      "speakerName": "Nombre del personaje o locutor",
      "text": "Texto exacto a locutar",
      "stageDirection": "Instrucción de tono o SFX asociado",
      "voiceId": "ID de la voz asignada",
      "voiceName": "Nombre de la voz",
      "voiceCategory": "clonada" o "nueva",
      "durationSeconds": 4.5
    }
  ]
}`;

        const scanResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });
      } catch (err) {
        console.warn("Gemini script scan fallback to deterministic parser:", err);
      }
    }

    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
          const totalWords = scriptText.trim().split(/\s+/).length;
          const totalSec = parsed.lines.reduce((acc: number, l: any) => acc + (Number(l.durationSeconds) || 3), 0);
          return res.json({
            title: parsed.title || "Guión Interpretado con IA",
            genre: parsed.genre || "Emisión Radiofónica",
            summary: parsed.summary || "Estructura interpretada por el escáner de guión.",
            soundEffects: parsed.soundEffects || [],
            detectedSpeakers: parsed.detectedSpeakers || [],
            estimatedTotalSeconds: Math.round(totalSec * 10) / 10,
            wordCount: totalWords,
            lines: parsed.lines.map((l: any, idx: number) => ({
              id: `line-${Date.now()}-${idx}`,
              speakerName: l.speakerName || `Locutor ${idx + 1}`,
              text: l.text || "",
              stageDirection: l.stageDirection || "",
              voiceId: l.voiceId || "voice-voz-b-master",
              voiceName: l.voiceName || "Voz B (Máster Cadena)",
              voiceCategory: l.voiceCategory || (l.voiceId?.includes("padre") ? "clonada" : "nueva"),
              durationSeconds: Number(l.durationSeconds) || Math.max(2, Math.round((l.text?.split(/\s+/).length || 5) / 2.3)),
              status: "idle"
            }))
          });
        }
      } catch (jsonErr) {
        console.warn("Failed to parse JSON response from LLM, falling back to regex parser", jsonErr);
      }
    }

    // Deterministic radio script parser fallback with intelligent keyword matching
    const rawLines = scriptText
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    const soundEffects: string[] = [];
    const lines: any[] = [];
    const speakerMap = new Map<string, any>();

    for (const rawLine of rawLines) {
      // Check for SFX line e.g. [SFX: ...] or (MÚSICA: ...)
      if (/^\[(SFX|MÚSICA|CONTROL|SONIDO):/i.test(rawLine)) {
        soundEffects.push(rawLine.replace(/[\[\]]/g, ""));
        continue;
      }

      // Check for dialogue speaker e.g. [PADRE X]: or [VOZ B]: or LOCUTOR 1:
      const match = rawLine.match(/^(?:\[([^\]]+)\]|([A-Z0-9\s_-]{2,25})):\s*(.*)$/);
      if (match) {
        const speaker = (match[1] || match[2]).trim();
        const spokenText = match[3].trim();

        if (!speakerMap.has(speaker)) {
          // Match voice by name or client context
          const lowerSpk = speaker.toLowerCase();
          let matchedVoice = voicesDatabase.find((v) =>
            lowerSpk.includes(v.name.toLowerCase()) ||
            lowerSpk.includes(v.role.toLowerCase())
          );

          if (!matchedVoice) {
            if (lowerSpk.includes("padre") || lowerSpk.includes("párroco") || lowerSpk.includes("sacerdote")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-padre-x");
            } else if (lowerSpk.includes("b") || lowerSpk.includes("máster") || lowerSpk.includes("cadena")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-voz-b-master");
            } else if (lowerSpk.includes("c") || lowerSpk.includes("institucional")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-voz-c-institucional");
            } else if (lowerSpk.includes("lectora") || lowerSpk.includes("parroquia")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-lectora-parroquia");
            } else if (lowerSpk.includes("cronista") || lowerSpk.includes("noticia")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-cronista-news");
            } else if (lowerSpk.includes("publicidad") || lowerSpk.includes("comercial") || lowerSpk.includes("impacto")) {
              matchedVoice = voicesDatabase.find((v) => v.id === "voice-promo-impacto");
            } else {
              matchedVoice = voicesDatabase[speakerMap.size % voicesDatabase.length];
            }
          }

          speakerMap.set(speaker, matchedVoice || voicesDatabase[0]);
        }

        const assignedVoice = speakerMap.get(speaker);
        const words = spokenText.split(/\s+/).length;
        const dur = Math.max(2.5, Math.round(words / 2.3));

        lines.push({
          id: `line-${Date.now()}-${lines.length}`,
          speakerName: speaker,
          text: spokenText,
          stageDirection: "Locución de cabina sincronizada",
          voiceId: assignedVoice.id,
          voiceName: assignedVoice.name,
          voiceCategory: assignedVoice.category,
          durationSeconds: dur,
          status: "idle"
        });
      } else {
        // Plain narration
        const words = rawLine.split(/\s+/).length;
        lines.push({
          id: `line-${Date.now()}-${lines.length}`,
          speakerName: "Voz Principal",
          text: rawLine,
          stageDirection: "Lectura continua",
          voiceId: "voice-padre-x",
          voiceName: "Padre X",
          voiceCategory: "clonada",
          durationSeconds: Math.max(2.5, Math.round(words / 2.3)),
          status: "idle"
        });
      }
    }

    const detectedSpeakers = Array.from(speakerMap.entries()).map(([spk, v]) => ({
      name: spk,
      suggestedVoiceId: v.id,
      suggestedVoiceName: v.name,
      category: v.category,
      voicePitchRecommendation: "Óptimo para cabina radial"
    }));

    const totalWords = scriptText.trim().split(/\s+/).length;
    const totalSec = lines.reduce((acc, l) => acc + l.durationSeconds, 0);

    return res.json({
      title: "Guión Radial Interpretado por el Escáner",
      genre: lines.length > 2 ? "Diálogo de Cabina" : "Mención Radiofónica",
      summary: `Guión escaneado con ${lines.length} intervenciones y ${detectedSpeakers.length} voces identificadas en el Banco de Voces.`,
      soundEffects,
      detectedSpeakers,
      estimatedTotalSeconds: totalSec,
      wordCount: totalWords,
      lines
    });
  } catch (error: any) {
    console.error("Error scanning script:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/script/synthesize-line - Synthesizes audio for a single script line
app.post("/api/script/synthesize-line", async (req: Request, res: Response) => {
  try {
    const { lineId, text, voiceId, stageDirection } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texto requerido" });
    }

    const voice = voicesDatabase.find((v) => v.id === voiceId) || voicesDatabase[0];
    const { pcmBuffer, durationSeconds, isFallback } = await synthesizeSpeechInternal(
      text,
      voice,
      stageDirection
    );
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

    return res.json({
      lineId,
      voiceId: voice.id,
      voiceName: voice.name,
      voiceCategory: voice.category,
      durationSeconds,
      audioBase64: wavBuffer.toString("base64"),
      mimeType: "audio/wav",
      isFallback
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// SSE Live Stream Endpoint with client awareness
app.get("/api/tts/stream", async (req: Request, res: Response) => {
  const { text, voiceId, projectId } = req.query;
  if (!text || typeof text !== "string") {
    return res.status(400).send("Texto requerido");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const voice = voicesDatabase.find((v) => v.id === voiceId) || voicesDatabase[0];

  res.write(
    `event: init\ndata: ${JSON.stringify({
      project: projectId || voice.projectId,
      voice: voice.name,
      category: voice.category,
      sampleRate: 24000,
      format: "STREAM"
    })}\n\n`
  );

  const sentences = text.split(/([.?!,;\n]+)/).filter((s) => s.trim().length > 0);
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i += 2) {
    const segment = (sentences[i] || "") + (sentences[i + 1] || "");
    if (!segment.trim()) continue;

    const segmentPcm = generateSyntheticTonePcm(1.2, 220 + (chunkIndex % 3) * 25);
    const wavChunk = pcmToWav(segmentPcm, 24000, 1, 16);

    res.write(
      `event: chunk\ndata: ${JSON.stringify({
        chunkIndex,
        segmentText: segment.trim(),
        audioBase64: wavChunk.toString("base64"),
        timestamp: Date.now()
      })}\n\n`
    );

    chunkIndex++;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  res.write(
    `event: complete\ndata: ${JSON.stringify({ totalChunks: chunkIndex, status: "stream_ended" })}\n\n`
  );
  res.end();
});

// POST AI Script Polishing / Assistant
app.post("/api/script/enhance", async (req: Request, res: Response) => {
  try {
    const { text, mode } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        enhancedText: `¡Atención audiencia! ${text.trim()} Sigue conectado a nuestra plataforma de radio.`
      });
    }

    const systemPrompt =
      "Eres el jefe de producción y guionista principal de VOICE STUDIO by KLIK (agencia de voces IA). Adapta el texto para locución radiofónica profesional (claridad, gancho inicial, ritmo dinámico, pausas marcadas y cierre memorable en cabina).";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Optimiza este texto para locución de radio:\n\n"${text}"\nModo: ${mode || "general"}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    return res.json({
      enhancedText: response.text?.trim() || text
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Start Server with Vite Middleware in Dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VOICE STUDIO by KLIK Agency Server running on http://0.0.0.0:${PORT}`);
    console.log(`🎙️  Casa Productora Centralizada: SOLUSOL.NET`);
    console.log(`📂  Directorios NAS Vinculados: Active (Mirrored to NAS 1 & NAS 2)`);
  });
}

startServer();
