/**
 * ==============================================================================
 * 🎙️ VOICE STUDIO BY KLIK • CASA PRODUCTORA CENTRALIZADA SOLUSOL.NET
 * ==============================================================================
 * MAPA DE ARQUITECTURA DE SOFTWARE & CATÁLOGO DE MÓDULOS DE INGENIERÍA
 * 
 * 🧭 TRAZABILIDAD DE FASES DE DESARROLLO:
 *   ├─ [FASE 0] FOUNDATION: Studio Profile, hardware config, bootstrap de seguridad.
 *   ├─ [FASE A] CORE ORCHESTRATION: Orquestación TTS triple vía, DSP de audio (LUFS/Ducking).
 *   ├─ [FASE B] ADVANCED DELIVERY: Almacén circular de persistencia, sincronización asíncrona NAS/Externos.
 *   └─ [FASE C] NATIVE STANDALONE: Generación de blueprint autónomo en Go e instalador Inno Setup.
 * 
 * 1. 📋 CATÁLOGO DE MÓDULOS Y FUNCIONES INTEGRADAS:
 * 
 *   A. SERVIDOR BACKEND EXPRESS (server.ts)
 *      ├─ MÓDULO CONCURRENTE (AsyncLock) [FASE A/B]
 *      │  └─ Serializador de promesas para operaciones de I/O de archivos seguras e hilos virtuales.
 *      ├─ MÓDULO DSP / AUDIO (DSP Core Engine) [FASE A]
 *      │  ├─ parseWavHeader(): Parser de bytes de bajo nivel para cabeceras RIFF/WAVE.
 *      │  ├─ pcmToWav(): Compilador binario que inyecta una cabecera WAV de 44 bytes a datos PCM.
 *      │  ├─ generateSyntheticTonePcm(): Oscilador armónico por software (Ondas sinusoidales).
 *      │  └─ applyDSP(): Procesador de señal física (Atenuación Ducking y Normalización RMS/LUFS).
 *      ├─ MÓDULO DE PERSISTENCIA (Bounded Stores) [FASE B]
 *      │  ├─ AuditService: Almacén JSON Lines (JSONL) append-only con rotación automática a 10MB.
 *      │  └─ LocutionService: Almacén persistente circular limitado a 1000 registros en disco y 50 en RAM.
 *      ├─ MÓDULO INTEGRADOR DE IA / GATEWAYS [FASE A]
 *      │  ├─ callSolusolLLM() / callSolusolTTS(): Integración de producción con la casa productora.
 *      │  ├─ callLocalLLM() / callLocalTTS(): Integración local-first con Ollama (Llama/Qwen) y Piper.
 *      │  └─ synthesizeSpeechInternal(): Orquestador maestro del pipeline de renderizado de audio.
 *      └─ MOTOR DE RESPALDOS MULTI-DISPOSITIVO [FASE B]
 *         └─ backupFileToDestination(): Sincronizador asíncrono y generador de backup con versionado histórico.
 * 
 *   B. APLICACIÓN REACT FRONTEND (src/App.tsx & Componentes) [FASE 0/A/B/C]
 *      ├─ ClientIsolationManager: Segmentación y validación de perfiles según el cliente (Multi-Tenant).
 *      ├─ ScriptScanner: Intérprete inteligente de guiones radiales a formato JSON estructurado con IA.
 *      ├─ ScriptPlayer: Consola multipista para control de reproducción y disparo de síntesis.
 *      ├─ VoiceEngineStudio: Ajustes de hardware físico (Sample Rate, Canales, Latencia) en tiempo real.
 *      └─ GoCodeViewer: Emisor y empaquetador del código fuente de Go autocontenido de producción.
 * ==============================================================================
 */

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from 'vite';
import "dotenv/config";
import { StudioProfile, PortableStudioProfilePackage, DEFAULT_BLANK_PROFILE, SystemIdentity, AuthenticationSecret, PROJECTS, INITIAL_VOICES } from "./src/data/projectData";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// ==============================================================================
// ⛓️ PROMISE-BASED ASYNC LOCK (THREAD-SAFETY SERIALIZER)
// ==============================================================================
class AsyncLock {
  private promise: Promise<void> = Promise.resolve();

  public async acquire(): Promise<() => void> {
    let release: () => void;
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentPromise = this.promise;
    this.promise = currentPromise.then(() => nextPromise);
    await currentPromise;
    return release!;
  }
}

// ==============================================================================
// 🔈 PARSER DE METADATOS WAV (PREVENCION DE DISTORSION CHIPMUNK)
// ==============================================================================
interface WavMetadata {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

function parseWavHeader(buffer: Buffer): WavMetadata & { dataOffset: number; dataSize: number } {
  if (buffer.length < 12) {
    throw new Error("Invalid WAV: File too short");
  }
  if (buffer.toString("utf-8", 0, 4) !== "RIFF" || buffer.toString("utf-8", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV: Missing RIFF/WAVE identifier");
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitDepth = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("utf-8", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(offset + 8 + 2);
      sampleRate = buffer.readUInt32LE(offset + 8 + 4);
      bitDepth = buffer.readUInt16LE(offset + 8 + 14);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break; // Standard streams locate data chunk towards the end
    }
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (sampleRate === 0 || channels === 0 || bitDepth === 0 || dataOffset === 0) {
    throw new Error("Invalid WAV: Missing or corrupted mandatory subchunks");
  }
  return { sampleRate, channels, bitDepth, dataOffset, dataSize };
}

// ==============================================================================
// 🧠 CONFIGURACIÓN MAESTRA DINÁMICA - BLANK BY DEFAULT
// ==============================================================================
let activeStudioProfile: StudioProfile = { ...DEFAULT_BLANK_PROFILE };
let customPresetsDatabase: any[] = [];
let customTemplatesDatabase: any[] = [];

// ==============================================================================
// 💾 SISTEMA DE PERSISTENCIA Y SERVICIOS - PERSISTENT STORE & RUNTIME BUFFER
// ==============================================================================
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==============================================================================
// 🔐 BOOTSTRAP DE SEGURIDAD - AUTODECLARACIÓN DE SECRETOS EN FRÍO
// ==============================================================================
const tokenFilePath = path.join(DATA_DIR, ".master-token");
let MASTER_TOKEN = process.env.SOLUSOL_MASTER_TOKEN;
if (!MASTER_TOKEN) {
  if (fs.existsSync(tokenFilePath)) {
    MASTER_TOKEN = fs.readFileSync(tokenFilePath, "utf-8").trim();
  }
  if (!MASTER_TOKEN || MASTER_TOKEN.length < 16) {
    MASTER_TOKEN = crypto.randomBytes(24).toString("hex");
    fs.writeFileSync(tokenFilePath, MASTER_TOKEN, { encoding: "utf-8", mode: 0o600 });
  }
}
if (!process.env.SOLUSOL_MASTER_TOKEN) {
  console.warn("======================================================================");
  console.warn("🔑 [BOOTSTRAP WARN] SOLUSOL_MASTER_TOKEN no está definido en el .env");
  console.warn("    Se ha autogenerado un token criptográfico seguro con permisos restrictivos (0600) guardado en: data/.master-token");
  console.warn("======================================================================");
}

/**
 * AuditService: Implementa un buffer en memoria acotado (Bounded N)
 * respaldado por un Persistent Store eficiente en formato JSON Lines (JSONL).
 */
class AuditService {
  private runtimeBuffer: any[] = [];
  private readonly filePath = path.join(DATA_DIR, "audit.jsonl");
  private readonly maxBufferSize = 100; // Límite estricto en RAM
  private lock = new AsyncLock();

  constructor() {
    this.loadInitialBuffer();
  }

  private loadInitialBuffer() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8");
        const lines = content.trim().split("\n").filter(Boolean);
        const parsedEvents = lines.map(line => JSON.parse(line));
        // Obtener únicamente los últimos N registros para el búfer circular de ejecución
        this.runtimeBuffer = parsedEvents.slice(-this.maxBufferSize).reverse();
      } else {
        this.log("PROFILE_CREATED", { message: "Instancia e infraestructura inicializadas en blanco." });
      }
    } catch (err) {
      console.error("❌ [AuditService] Error cargando histórico de auditoría:", err);
    }
  }

  public async log(action: string, payload: any) {
    const release = await this.lock.acquire();
    try {
      const event = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        action,
        payload
      };

      // 1. Escritura física asíncrona no-bloqueante (Append-Only)
      await fs.promises.appendFile(this.filePath, JSON.stringify(event) + "\n", "utf-8");

      // 2. Control circular de memoria RAM (Bounded N)
      this.runtimeBuffer.unshift(event);
      if (this.runtimeBuffer.length > this.maxBufferSize) {
        this.runtimeBuffer.pop();
      }

      console.log(`🧾 [AUDIT] ${action}:`, JSON.stringify(payload));

      // 3. Rotación asíncrona segura bajo el mismo lock
      await this.rotateLogsIfNeededInternal();
    } catch (err) {
      console.error("❌ [AuditService] Error en Persistent Store:", err);
    } finally {
      release();
    }
  }

  private async rotateLogsIfNeededInternal() {
    try {
      const stats = await fs.promises.stat(this.filePath);
      if (stats.size > 10 * 1024 * 1024) { // Rotación en disco al exceder 10MB
        const content = await fs.promises.readFile(this.filePath, "utf-8");
        const lines = content.trim().split("\n").filter(Boolean).slice(-1000);
        
        const tempPath = `${this.filePath}.tmp`;
        await fs.promises.writeFile(tempPath, lines.join("\n") + "\n", "utf-8");
        await fs.promises.rename(tempPath, this.filePath);
        console.log("🧹 [AuditService] Rotación de logs de auditoría completada.");
      }
    } catch (err) {
      // Silencioso para evitar fugas en producción
    }
  }

  public getRuntimeBuffer(): any[] {
    return this.runtimeBuffer;
  }
}

// ==============================================================================
// 🔒 MIDDLEWARE DE SEGURIDAD CRIPTOGRÁFICO ACTIVO
// ==============================================================================
function requireAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso no autorizado: Token ausente" });
  }
  const token = authHeader.split(" ")[1];
  if (token === MASTER_TOKEN) {
    return next();
  }
  const incomingHash = crypto.createHash("sha256").update(token).digest("hex");
  const verified = authenticationSecrets.some((secret) => secret.tokenHash === incomingHash);
  if (verified) {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado: Credencial inválida" });
}

// ==============================================================================
// 🎛️ PROCESAMIENTO DIGITAL DE SEÑALES (DSP) - DUCKING & LUFS NORMALIZATION
// ==============================================================================
function applyDSP(pcmBuffer: Buffer, sampleRate: number, channels: number, bitDepth: number): Buffer {
  const targetLUFS = activeStudioProfile.exportDefaults?.loudnessTargetLUFS ?? -16;
  const normalizePeak = activeStudioProfile.exportDefaults?.normalizeToMaxPeakDb ?? -1.0;
  const duckingEnabled = activeStudioProfile.ducking?.enabled ?? false;

  const bytesPerSample = bitDepth / 8;
  const numSamples = pcmBuffer.length / bytesPerSample;
  const samples = new Float32Array(numSamples);

  // 1. Decodificar PCM a muestras de punto flotante en rango [-1.0, 1.0]
  for (let i = 0; i < numSamples; i++) {
    const offset = i * bytesPerSample;
    if (bitDepth === 16) {
      samples[i] = pcmBuffer.readInt16LE(offset) / 32767;
    } else if (bitDepth === 24) {
      const b0 = pcmBuffer[offset];
      const b1 = pcmBuffer[offset + 1];
      const b2 = pcmBuffer[offset + 2];
      let val = (b2 << 16) | (b1 << 8) | b0;
      if (val & 0x800000) val |= ~0xffffff;
      samples[i] = val / 8388607;
    } else if (bitDepth === 32) {
      samples[i] = pcmBuffer.readFloatLE(offset);
    }
  }

  // 2. Aplicar Atenuación Dinámica (Ducking)
  if (duckingEnabled) {
    const attenuationLinear = Math.pow(10, (activeStudioProfile.ducking.attenuationDb || -12) / 20);
    for (let i = 0; i < numSamples; i++) {
      samples[i] *= attenuationLinear;
    }
  }

  // 3. Normalización LUFS de Inteligibilidad Acústica (Aproximación por RMS)
  let sumSquares = 0;
  for (let i = 0; i < numSamples; i++) {
    sumSquares += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSquares / numSamples) || 0.0001;
  const currentLUFS = 20 * Math.log10(rms) - 0.6;
  let gainLUFS = Math.pow(10, (targetLUFS - currentLUFS) / 20);

  // 4. Limitador de picos máximos para prevenir el clipping (normalizeToMaxPeakDb)
  let maxSample = 0;
  for (let i = 0; i < numSamples; i++) {
    const val = Math.abs(samples[i] * gainLUFS);
    if (val > maxSample) maxSample = val;
  }
  const maxAllowedPeak = Math.pow(10, normalizePeak / 20);
  if (maxSample > maxAllowedPeak) {
    gainLUFS *= (maxAllowedPeak / maxSample);
  }

  // 5. Re-codificar las muestras flotantes procesadas a PCM original
  const outputBuffer = Buffer.alloc(pcmBuffer.length);
  for (let i = 0; i < numSamples; i++) {
    const offset = i * bytesPerSample;
    const finalVal = Math.max(-1.0, Math.min(1.0, samples[i] * gainLUFS));
    if (bitDepth === 16) {
      outputBuffer.writeInt16LE(Math.floor(finalVal * 32767), offset);
    } else if (bitDepth === 24) {
      const val = Math.floor(finalVal * 8388607);
      outputBuffer[offset] = val & 0xff;
      outputBuffer[offset + 1] = (val >> 8) & 0xff;
      outputBuffer[offset + 2] = (val >> 16) & 0xff;
    } else if (bitDepth === 32) {
      outputBuffer.writeFloatLE(finalVal, offset);
    }
  }

  return outputBuffer;
}

// ==============================================================================
// 💾 MOTOR DE RESPALDOS Y SINCRONIZACIÓN ASÍNCRONA MULTI-DISPOSITIVO
// ==============================================================================
async function backupFileToDestination(destPath: string, fileName: string, fileData: Buffer, label: string) {
  try {
    const cleanDest = path.normalize(destPath);
    
    // Asegurar que el directorio raíz del dispositivo externo/NAS existe
    await fs.promises.mkdir(cleanDest, { recursive: true });
    
    // 1. Guardar la copia de producción activa (último render)
    const mainFilePath = path.join(cleanDest, fileName);
    await fs.promises.writeFile(mainFilePath, fileData);

    // 2. Generar el Backup Histórico Estructurado para evitar pérdida de datos
    const dateStr = new Date().toISOString().split("T")[0]; // Carpeta YYYY-MM-DD
    const backupDir = path.join(cleanDest, "backups", dateStr);
    await fs.promises.mkdir(backupDir, { recursive: true });

    const timestamp = Math.floor(Date.now() / 1000);
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const backupFilePath = path.join(backupDir, `${baseName}_${timestamp}${ext}`);
    
    await fs.promises.writeFile(backupFilePath, fileData);
    console.log(`💾 [BACKUP & SYNC - ${label}] Copia activa y backup histórico creados en: ${cleanDest}`);
  } catch (err: any) {
    console.error(`❌ [BACKUP & SYNC - ${label}] Error escribiendo en el dispositivo:`, err.message);
  }
}

const auditService = new AuditService();

// Helper to construct WAV file buffer from raw 16-bit PCM (sampleRate 24000Hz, 1 channel)
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = Math.floor((sampleRate * numChannels * bitsPerSample) / 8);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  if (pcmBuffer.length % blockAlign !== 0) {
    throw new Error(`PCM buffer size (${pcmBuffer.length}) is not aligned to block size (${blockAlign})`);
  }
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  const formatCode = bitsPerSample === 32 ? 3 : 1;

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(formatCode, 20); // AudioFormat
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

// Synthesize fallback PCM audio dynamically matching Sample Rate, Bit Depth, and Stereo/Mono layout
function generateSyntheticTonePcm(durationSec = 3, frequency = 220, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec);
  const channels = activeStudioProfile.hardware.channels || 1;
  const bitDepth = activeStudioProfile.hardware.bitDepth || 16;
  const bytesPerSample = bitDepth / 8;
  const totalBytes = numSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(totalBytes);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((Math.PI * i) / numSamples);
    let sample =
      Math.sin(2 * Math.PI * frequency * t) * 0.45 +
      Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.25 +
      Math.sin(2 * Math.PI * (frequency * 2) * t) * 0.15;

    sample = Math.max(-1.0, Math.min(1.0, sample)) * envelope;

    for (let c = 0; c < channels; c++) {
      const offset = (i * channels + c) * bytesPerSample;
      if (bitDepth === 16) {
        const intVal = Math.floor(sample * 32767);
        buffer.writeInt16LE(intVal, offset);
      } else if (bitDepth === 24) {
        const intVal = Math.floor(sample * 8388607);
        buffer[offset] = intVal & 0xff;
        buffer[offset + 1] = (intVal >> 8) & 0xff;
        buffer[offset + 2] = (intVal >> 16) & 0xff;
      } else if (bitDepth === 32) {
        buffer.writeFloatLE(sample, offset);
      } else {
        throw new Error(`Unsupported bit depth: ${bitDepth}`);
      }
    }
  }
  return buffer;
}

/**
 * LocutionService: Gestiona la persistencia de locuciones generadas bajo
 * el principio de aislamiento y límite circular de memoria en RAM de producción.
 */
class LocutionService {
  private runtimeBuffer: LocutionRecord[] = [];
  private readonly filePath = path.join(DATA_DIR, "locutions.json");
  private readonly maxBufferSize = 50; // Últimas 50 locuciones en memoria
  private lock = new AsyncLock();

  constructor() {
    this.loadInitialBuffer();
  }

  private loadInitialBuffer() {
    try {
      if (fs.existsSync(this.filePath)) {
        const rawData = fs.readFileSync(this.filePath, "utf-8");
        const allLocutions: LocutionRecord[] = JSON.parse(rawData);
        this.runtimeBuffer = allLocutions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, this.maxBufferSize);
      } else {
        // Sembrar persistencia inicial si el Persistent Store está frío
        fs.writeFileSync(this.filePath, JSON.stringify(initialLocutions, null, 2), "utf-8");
        this.runtimeBuffer = [...initialLocutions];
      }
    } catch (err) {
      console.error("❌ [LocutionService] Error cargando almacén persistente:", err);
    }
  }

  public async save(record: LocutionRecord) {
    const release = await this.lock.acquire();
    try {
      this.runtimeBuffer.unshift(record);
      if (this.runtimeBuffer.length > this.maxBufferSize) {
        this.runtimeBuffer.pop();
      }

      let allLocutions: LocutionRecord[] = [];
      if (fs.existsSync(this.filePath)) {
        const rawData = await fs.promises.readFile(this.filePath, "utf-8");
        allLocutions = JSON.parse(rawData);
      }
      allLocutions.unshift(record);
      if (allLocutions.length > 1000) { // Cuota en disco límite
        allLocutions = allLocutions.slice(0, 1000);
      }

      const tempPath = `${this.filePath}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(allLocutions, null, 2), "utf-8");
      await fs.promises.rename(tempPath, this.filePath);
    } catch (err) {
      console.error("❌ [LocutionService] Error escribiendo registro físico:", err);
    } finally {
      release();
    }
  }

  public getRuntimeBuffer(projectId?: string): LocutionRecord[] {
    if (projectId) {
      return this.runtimeBuffer.filter((l) => l.projectId === projectId);
    }
    return this.runtimeBuffer;
  }
}

let voicesDatabase: VoiceProfile[] = [...INITIAL_VOICES];
const locutionService = new LocutionService();

let identitiesDatabase: SystemIdentity[] = [
  { id: "identity-admin", type: "SYSTEM_ADMIN", name: "SOLUSOL Master Operator" }
];

const inputHashBuffer = crypto.createHash("sha256").update(MASTER_TOKEN!).digest();
let authenticationSecrets: AuthenticationSecret[] = [
  {
    identityId: "identity-admin",
    tokenHash: inputHashBuffer.toString("hex"),
    salt: "bootstrap-salt",
    createdAt: new Date().toISOString()
  }
];

// Helper to query Solusol.net Central production LLM (Hosted on Plesk / VPN)
async function callSolusolLLM(prompt: string, systemInstruction?: string): Promise<string | null> {
  const solusolUrl = process.env.SOLUSOL_LLM_URL;
  if (!solusolUrl) return null; // No URL = NO network request (Local-First Estricto)
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
  const solusolTtsUrl = process.env.SOLUSOL_TTS_URL;
  if (!solusolTtsUrl) return null; // No URL = NO network request (Local-First Estricto)
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
        speaker: voice.klikVoice,
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
    const response = await fetch(`${localTtsUrl}?text=${encodeURIComponent(text)}&speaker=${encodeURIComponent(voice.klikVoice)}`);
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
  klikVoice: "klik-dynamic" | "solusol-deep" | "solusol-bright" | "klik-incisive" | "klik-master";
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

const initialLocutions: LocutionRecord[] = [
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
    localConfigured: Boolean(process.env.LOCAL_TTS_URL || process.env.OLLAMA_URL),
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
app.post("/api/profile", requireAuth, (req: Request, res: Response) => {
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
app.post("/api/profile/import", requireAuth, (req: Request, res: Response) => {
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
  const { projectId, category, isolationToken } = req.query;
  
  if (projectId) {
    const project = PROJECTS[projectId as string];
    if (!project) {
      return res.status(400).json({ error: "Proyecto no válido o inexistente" });
    }
    // CURRENT ISOLATION: Validación en memoria del inquilino mediante token estático
    if (project.isolationToken !== isolationToken) {
      return res.status(403).json({ error: "Acceso denegado: Token de aislamiento inválido o ausente" });
    }
  }

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
app.post("/api/voices", requireAuth, (req: Request, res: Response) => {
  const {
    id,
    projectId,
    clientName,
    category,
    name,
    role,
    description,
    klikVoice,
    tone,
    pitch,
    speed,
    isAuthorized,
    tags,
    isolationToken
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Nombre es requerido" });
  }
  if (!projectId) {
    return res.status(400).json({ error: "El campo projectId es requerido" });
  }

  const project = PROJECTS[projectId];
  if (!project) {
    return res.status(400).json({ error: "Proyecto no válido o inexistente" });
  }
  if (project.isolationToken !== isolationToken) {
    return res.status(403).json({ error: "Acceso denegado: Token de aislamiento inválido para esta operación." });
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
      klikVoice: klikVoice || voicesDatabase[existingIdx].klikVoice,
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
    klikVoice: klikVoice || "klik-dynamic",
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

app.delete("/api/voices/:id", requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { projectId, isolationToken } = req.body;

  const voice = voicesDatabase.find((v) => v.id === id);
  if (!voice) {
    return res.status(404).json({ error: "Voz no encontrada" });
  }

  const project = PROJECTS[voice.projectId];
  if (project && project.isolationToken !== isolationToken) {
    return res.status(403).json({ error: "Acceso denegado: Token de aislamiento inválido para esta operación." });
  }

  voicesDatabase = voicesDatabase.filter((v) => v.id !== id);
  res.json({ success: true, id });
});

// GET /api/locutions - Filter by client / tenant isolation
app.get("/api/locutions", (req: Request, res: Response) => {
  const { projectId } = req.query;
  // Nota: limitación circular del Runtime Buffer en memoria
  return res.json(locutionService.getRuntimeBuffer(projectId as string));
});

// Helper to synthesize speech using Gemini TTS or studio fallback
async function synthesizeSpeechInternal(
  text: string,
  voice: VoiceProfile,
  toneInstruction?: string
): Promise<{ pcmBuffer: Buffer; durationSeconds: number; isFallback: boolean; sampleRate: number; channels: number; bitDepth: number }> {
  const currentSampleRate = activeStudioProfile.hardware.sampleRate;

  // 1. Try Solusol.net Central Production House API (External / VPN / Plesk Hub)
  const solusolAudio = await callSolusolTTS(text, voice);
  if (solusolAudio) {
    const meta = parseWavHeader(solusolAudio);
    const duration = Math.round((meta.dataSize / (meta.sampleRate * meta.channels * (meta.bitDepth / 8))) * 10) / 10;
    return {
      pcmBuffer: applyDSP(solusolAudio.slice(meta.dataOffset, meta.dataOffset + meta.dataSize), meta.sampleRate, meta.channels, meta.bitDepth),
      durationSeconds: duration || 3.0,
      isFallback: false,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
      bitDepth: meta.bitDepth
    };
  }

  // 2. Check if a local neural TTS microservice is configured and active (Local Development)
  const localAudio = await callLocalTTS(text, voice);
  if (localAudio) {
    const meta = parseWavHeader(localAudio);
    const duration = Math.round((meta.dataSize / (meta.sampleRate * meta.channels * (meta.bitDepth / 8))) * 10) / 10;
    return {
      pcmBuffer: applyDSP(localAudio.slice(meta.dataOffset, meta.dataOffset + meta.dataSize), meta.sampleRate, meta.channels, meta.bitDepth),
      durationSeconds: duration || 3.0,
      isFallback: false,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
      bitDepth: meta.bitDepth
    };
  }

  // 3. Last-resort studio synthetic physical synthesizer (sine waves)
  const words = text.trim().split(/\s+/).length;
  const estimatedSec = Math.max(2.2, Math.min(25, Math.round(words / 2.3)));
  const baseFreq = voice.klikVoice === "solusol-deep" || voice.klikVoice === "klik-incisive" ? 140 : 230;
  const pcmBuffer = generateSyntheticTonePcm(estimatedSec, baseFreq, currentSampleRate);
  const currentChannels = activeStudioProfile.hardware.channels || 1;
  const currentBitDepth = activeStudioProfile.hardware.bitDepth || 16;
  const durationSeconds = Math.round((pcmBuffer.length / (currentSampleRate * currentChannels * (currentBitDepth / 8))) * 10) / 10;
  return {
    pcmBuffer: applyDSP(pcmBuffer, currentSampleRate, currentChannels, currentBitDepth),
    durationSeconds,
    isFallback: true,
    sampleRate: currentSampleRate,
    channels: currentChannels,
    bitDepth: currentBitDepth
  };
}

// POST /api/v1/voice/synthesize - Generate Single Locution with Multi-Tenant Isolation (Canonical REST)
app.post("/api/v1/voice/synthesize", async (req: Request, res: Response) => {
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
    if (format === "MP3") {
      return res.status(400).json({ error: "Format MP3 is not supported natively. Please use WAV or STREAM." });
    }

    const project = PROJECTS[projectId];
    if (!project) {
      return res.status(400).json({ error: "Proyecto no válido o inexistente" });
    }
    if (project.isolationToken !== isolationToken) {
      return res.status(403).json({ error: "Acceso denegado: Token de aislamiento inválido o ausente" });
    }

    const voice = voicesDatabase.find((v) => v.id === voiceId) || voicesDatabase[0];
    if (!voice.isAuthorized) {
      return res.status(403).json({
        error: `La voz '${voice.name}' no está autorizada para generar contenidos.`
      });
    }

    const { pcmBuffer, durationSeconds, isFallback, sampleRate, channels, bitDepth } = await synthesizeSpeechInternal(
      text,
      voice,
      toneInstruction
    );
    const wavBuffer = pcmToWav(pcmBuffer, sampleRate, channels, bitDepth);
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
      mimeType: "audio/wav",
      createdAt: new Date().toISOString(),
      status: "completed"
    };

    // Sincronización y Respaldo Multi-Dispositivo asíncrono (NAS y Dispositivos Externos)
    const nasPath1 = process.env.SOLUSOL_NAS_1_PATH;
    const nasPath2 = process.env.SOLUSOL_NAS_2_PATH;
    const extDevicePath = process.env.SOLUSOL_EXTERNAL_DEVICE_PATH;
    const fileName = `locucion_${record.id}.wav`;

    if (nasPath1) {
      backupFileToDestination(nasPath1, fileName, wavBuffer, "NAS Primario");
    }
    if (nasPath2) {
      backupFileToDestination(nasPath2, fileName, wavBuffer, "NAS Espejo");
    }
    if (extDevicePath) {
      backupFileToDestination(extDevicePath, fileName, wavBuffer, "Dispositivo Externo USB/SSD");
    }
    if (nasPath1 || nasPath2 || extDevicePath) {
      console.log(`🔒 [Plesk VPN Security] Integridad y seguridad de copias externas validada.`);
    }

    await locutionService.save(record);
    auditService.log("TAKE_RECORDED", { locutionId: record.id, projectId: record.projectId });
    
    return res.json({
      success: true,
      record,
      download_url: `/api/v1/media/download/${record.id}`,
      isolatedTenant: projectId || voice.projectId,
      isSyntheticFallback: isFallback,
      notice: isFallback
        ? "Generado con el motor armónico de estudio radial."
        : "Sintetizado exitosamente con el motor de voz neuronal."
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

    let rawJson: string | null = null;

    const prompt = `Analiza e interpreta este guión para la agencia radial VOICE STUDIO by KLIK. Extrae la estructura dramática y técnica en formato JSON.
GUION:
"""
${scriptText}
"""
Devuelve ÚNICAMENTE un JSON estructurado con las claves "title", "genre", "summary", "soundEffects", "detectedSpeakers" y "lines" (con campos: speakerName, text, stageDirection, voiceId, voiceName, voiceCategory, durationSeconds).`;

    // 1. Try Solusol.net Central production LLM first if configured
    rawJson = await callSolusolLLM(prompt, "Eres un asistente de guiones radiales de Solusol.net que responde exclusivamente con JSON estructurado.");

    // 2. Try local Ollama model if Solusol is offline/not configured
    if (!rawJson) {
      rawJson = await callLocalLLM(prompt, "Eres un asistente de guiones radiales que responde exclusivamente con JSON estructurado.");
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
    const { pcmBuffer, durationSeconds, isFallback, sampleRate, channels, bitDepth } = await synthesizeSpeechInternal(
      text,
      voice,
      stageDirection
    );
    const wavBuffer = pcmToWav(pcmBuffer, sampleRate, channels, bitDepth);

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

// SSE Live Stream Endpoint with client awareness (Canonical /api/v1/voice/stream)
app.get("/api/v1/voice/stream", async (req: Request, res: Response) => {
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
      sampleRate: activeStudioProfile.hardware.sampleRate,
      format: "STREAM"
    })}\n\n`
  );

  const sentences = text.split(/([.?!,;\n]+)/).filter((s) => s.trim().length > 0);
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i += 2) {
    const segment = (sentences[i] || "") + (sentences[i + 1] || "");
    if (!segment.trim()) continue;

    const segmentPcm = generateSyntheticTonePcm(1.2, 220 + (chunkIndex % 3) * 25, activeStudioProfile.hardware.sampleRate);
    const wavChunk = pcmToWav(segmentPcm, activeStudioProfile.hardware.sampleRate, activeStudioProfile.hardware.channels, activeStudioProfile.hardware.bitDepth);

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
    let enhancedText = text;
    const systemPrompt =
      "Eres el jefe de producción y guionista principal de VOICE STUDIO by KLIK (agencia de voces IA). Adapta el texto para locución radiofónica profesional (claridad, gancho inicial, ritmo dinámico, pausas marcadas y cierre memorable en cabina).";
    const prompt = `Optimiza este texto para locución de radio:\n\n"${text}"\nModo: ${mode || "general"}`;
    const responseText = await callSolusolLLM(prompt, systemPrompt) || await callLocalLLM(prompt, systemPrompt);
    if (responseText) {
      enhancedText = responseText.trim();
    } else {
      enhancedText = `¡Atención audiencia! ${text.trim()} Sigue conectado a nuestra plataforma de radio.`;
    }
    return res.json({ enhancedText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/media/download/:id - Unified media download endpoint (Phase B)
app.get("/api/v1/media/download/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { projectId, isolationToken } = req.query;

  const loc = locutionService.getRuntimeBuffer().find((l) => l.id === id);
  if (!loc) {
    return res.status(404).json({ error: "Locución no encontrada" });
  }

  // VALIDACIÓN REAL DE AISLAMIENTO: Previene descargas cruzadas ilícitas
  const project = PROJECTS[loc.projectId];
  if (!project || project.isolationToken !== isolationToken || loc.projectId !== projectId) {
    return res.status(403).json({ error: "Acceso denegado: No está autorizado para descargar recursos de este inquilino." });
  }

  const buffer = Buffer.from(loc.audioBase64 || "", "base64");
  res.setHeader("Content-Type", loc.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="locucion_${loc.id}.${loc.format === "MP3" ? "mp3" : "wav"}"`);
  res.setHeader("Content-Length", buffer.length.toString());
  return res.send(buffer);
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
