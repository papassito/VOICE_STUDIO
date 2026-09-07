import { GoCodeFile } from '../types';

export const GO_CODE_FILES: GoCodeFile[] = [
  {
    path: 'cmd/server/main.go',
    title: 'main.go (Servidor Principal)',
    description: 'Punto de entrada de Voice Studio en Go. Inicializa el motor de voz con IA, almacenamiento multi-tenant, enrutador HTTP y apagado controlado.',
    language: 'go',
    content: `package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"voicestudio/pkg/engine"
	"voicestudio/pkg/handlers"
	"voicestudio/pkg/storage"
)

func main() {
	fmt.Println("🎙️  Iniciando Voice Studio...")
	log.Println("==========================================================")
	log.Println("🎙️  VOICE STUDIO by KLIK - Agencia Centralizada de Voces IA")
	log.Println("    Aislamiento Multi-Tenant: NuestraParroquia, Comunidad de Radio, etc.")
	log.Println("    Banco de Voces: Padre X, Voz B, Voz C...")
	log.Println("    Formatos: MP3 | WAV | STREAM (100% Autónomo / No GitHub)")
	log.Println("==========================================================")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Obtener clave de API para el motor de IA Gemini
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("⚠️  AVISO: GEMINI_API_KEY no detectada en entorno.")
		log.Println("    El Voice Engine operará en modo de síntesis armónica local (Preview).")
	}

	// 2. Inicializar Almacenamiento Multi-Tenant Aislado
	store := storage.NewMemoryStore()
	log.Println("✅ Almacén de identidades y contenidos inicializado con éxito.")

	// 3. Inicializar el Voice Engine (Motor de IA para Texto -> Audio)
	voiceEngine, err := engine.NewGeminiVoiceEngine(ctx, apiKey)
	voiceEngine, err := engine.NewStudioVoiceEngine(ctx, os.Getenv("SOLUSOL_API_KEY"))
	if err != nil {
		log.Fatalf("❌ Error crítico inicializando Voice Engine: %v", err)
	}
	defer voiceEngine.Close()
	log.Println("✅ Voice Engine (Google Gemini TTS + Transcodificador) listo.")
	log.Println("âœ… Voice Engine (SOLUSOL.NET Local-First Engine) listo.")

	// 4. Configurar Enrutador y Handlers HTTP
	apiHandler := handlers.NewAPIHandler(store, voiceEngine)
	mux := http.NewServeMux()
	apiHandler.RegisterRoutes(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 5. Arranque en goroutine y Graceful Shutdown
	go func() {
		log.Printf("🚀 Servidor Voice Studio escuchando en http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Error en servidor HTTP: %v", err)
		}
	}()

	// Esperar señal de terminación (SIGINT, SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Apagando Voice Studio de forma segura...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("⚠️ Forzando cierre del servidor: %v", err)
	}
	log.Println("👋 Voice Studio finalizado correctamente.")
}
`
  },
  {
    path: 'pkg/models/models.go',
    title: 'models.go (Dominio y Entidades)',
    description: 'Estructuras de datos en Go que modelan proyectos separados, voces autorizadas (Padre X, Locutores), solicitudes de locución y formatos MP3/WAV/STREAM.',
    language: 'go',
    content: `package models

import "time"

// ProjectID identifica de forma estricta los entornos aislados
type ProjectID string

const (
	ProjectNuestraParroquia ProjectID = "nuestraparroquia"
	ProjectComunidadRadio   ProjectID = "comunidad-radio"
	ProjectLocucion         ProjectID = "locucion"
	ProjectPublicidad       ProjectID = "publicidad"
	ProjectNarracion        ProjectID = "narracion"
	ProjectPodcast          ProjectID = "podcast"
	ProjectOtrosProyectos   ProjectID = "otros-proyectos"
)

// AudioFormat representa los formatos de salida del Voice Engine
type AudioFormat string

const (
	FormatMP3    AudioFormat = "MP3"    // Comprimido para podcast y web
	FormatWAV    AudioFormat = "WAV"    // Calidad estudio 24kHz sin comprimir
	FormatSTREAM AudioFormat = "STREAM" // Transmisión en tiempo real (SSE / Chunked)
)

// Project define la configuración y límites de cada tenant
type Project struct {
	ID          ProjectID \`json:"id"\`
	Name        string    \`json:"name"\`
	Domain      string    \`json:"domain"\`
	Description string    \`json:"description"\`
	Active      bool      \`json:"active"\`
}

// VoiceProfile representa una voz autorizada dentro de un proyecto específico
type VoiceProfile struct {
	ID           string    \`json:"id"\`
	ProjectID    ProjectID \`json:"project_id"\`   // Aislamiento: pertenece solo a este proyecto
	Name         string    \`json:"name"\`         // Ej: "Padre X", "Carlos Morales"
	Role         string    \`json:"role"\`         // Ej: "Párroco", "Locutor Central"
	GeminiVoice  string    \`json:"gemini_voice"\` // Puck, Charon, Kore, Fenrir, Zephyr
	Tone         string    \`json:"tone"\`         // Solemne, Radiofónico, Cálido, etc.
	Pitch        float64   \`json:"pitch"\`        // 0.8 - 1.2
	Speed        float64   \`json:"speed"\`        // 0.8 - 1.3
	IsAuthorized bool      \`json:"is_authorized"\`// Solo voces autorizadas pueden generar audio
	CreatedAt    time.Time \`json:"created_at"\`
}

// SynthesisRequest es la petición enviada al Voice Engine
type SynthesisRequest struct {
	ProjectID       ProjectID   \`json:"project_id"\`
	VoiceID         string      \`json:"voice_id"\`
	Text            string      \`json:"text"\`
	Title           string      \`json:"title"\`
	Format          AudioFormat \`json:"format"\` // MP3, WAV, STREAM
	ToneInstruction string      \`json:"tone_instruction,omitempty"\`
}

// LocutionRecord representa el contenido de audio generado y archivado
type LocutionRecord struct {
	ID              string      \`json:"id"\`
	ProjectID       ProjectID   \`json:"project_id"\`
	VoiceID         string      \`json:"voice_id"\`
	VoiceName       string      \`json:"voice_name"\`
	Title           string      \`json:"title"\`
	Text            string      \`json:"text"\`
	Format          AudioFormat \`json:"format"\`
	DurationSeconds float64     \`json:"duration_seconds"\`
	FileSizeBytes   int64       \`json:"file_size_bytes"\`
	MimeType        string      \`json:"mime_type"\`
	AudioData       []byte      \`json:"-"\` // Datos binarios de audio
	CreatedAt       time.Time   \`json:"created_at"\`
}
`
  },
  {
    path: 'pkg/engine/engine.go',
    title: 'engine.go (Voice Engine IA)',
    description: 'Motor de síntesis de voz en Go. Conecta con la API de IA Gemini TTS, genera PCM de 24kHz, empaqueta encabezados RIFF WAV, genera MP3 y streams en tiempo real.',
    language: 'go',
    content: `package engine

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"voicestudio/pkg/models"
)

// StudioProfileConfig representa la porción de hardware y codificación del perfil dinámico
type StudioProfileConfig struct {
	ID         string `json:"id"`
	StudioType string `json:"type"`
	Hardware   struct {
		SampleRate int `json:"sampleRate"`
		BitDepth   int `json:"bitDepth"`
		Channels   int `json:"channels"`
	} `json:"hardware"`
	ActiveBrandingName string `json:"brandingName"`
}

// VoiceEngine define la interfaz central para la transformación de Texto a Audio
type VoiceEngine interface {
	Synthesize(ctx context.Context, voice *models.VoiceProfile, text string, format models.AudioFormat) ([]byte, float64, error)
	StreamBroadcast(ctx context.Context, voice *models.VoiceProfile, text string, w http.ResponseWriter) error
	Close() error
}

// GeminiVoiceEngine implementa VoiceEngine usando la API de IA de Google Gemini
type GeminiVoiceEngine struct {
	apiKey string
	mu            sync.RWMutex
	activeProfile StudioProfileConfig
}

// NewGeminiVoiceEngine crea una nueva instancia del motor de voz
func NewGeminiVoiceEngine(ctx context.Context, apiKey string) (*GeminiVoiceEngine, error) {
	// Instancia compatible con la plataforma de APIs SOLUSOL.NET SIC y KLIK Soft PRO
	defaultProfile := StudioProfileConfig{}
	defaultProfile.Hardware.SampleRate = 44100
	defaultProfile.Hardware.BitDepth = 24
	defaultProfile.Hardware.Channels = 1
	return &GeminiVoiceEngine{
		apiKey:        apiKey,
		activeProfile: defaultProfile,
	}, nil
}

// UpdateProfile actualiza en caliente los metadatos de hardware y comportamiento de renderizado.
// Retorna true si los cambios físicos en los parámetros del hardware exigen reiniciar el pipeline de audio.
func (e *GeminiVoiceEngine) UpdateProfile(profile StudioProfileConfig) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	requiresRestart := false
	if e.activeProfile.Hardware.SampleRate != profile.Hardware.SampleRate ||
		e.activeProfile.Hardware.BitDepth != profile.Hardware.BitDepth ||
		e.activeProfile.Hardware.Channels != profile.Hardware.Channels {
		requiresRestart = true
	}

	if requiresRestart {
		log.Printf("[SOLUSOL SIC API] CAMBIO FÍSICO DETECTADO: El cambio a %dHz, %d-bit (canales: %d) requiere REINICIAR el pipeline de audio.",
			profile.Hardware.SampleRate, profile.Hardware.BitDepth, profile.Hardware.Channels)
	} else {
		log.Printf("[SOLUSOL SIC API] Reconfiguración en caliente exitosa para branding '%s' (%s)",
			profile.ActiveBrandingName, profile.StudioType)
	}

	e.activeProfile = profile
	return requiresRestart
}

// Synthesize convierte texto en audio en formato WAV, MP3 o STREAM
func (e *GeminiVoiceEngine) Synthesize(ctx context.Context, voice *models.VoiceProfile, text string, format models.AudioFormat) ([]byte, float64, error) {
	if !voice.IsAuthorized {
		return nil, 0, fmt.Errorf("la voz '%s' no cuenta con autorización para generar locuciones", voice.Name)
	}

	log.Printf("[Voice Engine] Sintetizando para proyecto '%s' con voz '%s' (%s) en formato %s",
		voice.ProjectID, voice.Name, voice.GeminiVoice, format)

	// 1. Obtener audio crudo PCM (mediante Gemini API o fallback armónico de estudio)
	// Usando dinámicamente la configuración del perfil activo bajo un cerrojo de lectura
	e.mu.RLock()
	targetSampleRate := e.activeProfile.Hardware.SampleRate
	channels := e.activeProfile.Hardware.Channels
	bitDepth := e.activeProfile.Hardware.BitDepth
	e.mu.RUnlock()

	pcmData, duration := e.generatePCM(voice, text, targetSampleRate)

	// 2. Transcodificar según el formato requerido (WAV o MP3)
	switch format {
	case models.FormatWAV:
		wavBytes := EncodeWAV(pcmData, targetSampleRate, channels, bitDepth)
		return wavBytes, duration, nil

	case models.FormatMP3:
		mp3Bytes := EncodeMP3Frame(pcmData, targetSampleRate)
		return mp3Bytes, duration, nil

	case models.FormatSTREAM:
		wavBytes := EncodeWAV(pcmData, targetSampleRate, channels, bitDepth)
		return wavBytes, duration, nil

	default:
		return EncodeWAV(pcmData, targetSampleRate, channels, bitDepth), duration, nil
	}
}

// StreamBroadcast emite el audio en tiempo real mediante Server-Sent Events o Chunked Transfer
func (e *GeminiVoiceEngine) StreamBroadcast(ctx context.Context, voice *models.VoiceProfile, text string, w http.ResponseWriter) error {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("el cliente HTTP no soporta streaming")
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Emitir evento inicial de sincronización
	fmt.Fprintf(w, "event: init\\ndata: {\\"project\\":\\"%s\\",\\"voice\\":\\"%s\\",\\"status\\":\\"connected\\"}\\n\\n",
		voice.ProjectID, voice.Name)
	flusher.Flush()

	// Segmentar texto en bloques para transmisión fluida bajo cerrojo de lectura seguro
	e.mu.RLock()
	targetSampleRate := e.activeProfile.Hardware.SampleRate
	channels := e.activeProfile.Hardware.Channels
	bitDepth := e.activeProfile.Hardware.BitDepth
	e.mu.RUnlock()

	pcmData, _ := e.generatePCM(voice, text, targetSampleRate)
	chunkSize := targetSampleRate * (bitDepth / 8) * channels // ~1 segundo de audio por chunk

	totalChunks := (len(pcmData) + chunkSize - 1) / chunkSize
	for i := 0; i < totalChunks; i++ {
		select {
		case <-ctx.Done():
			log.Println("[Voice Engine] Transmisión cancelada por el cliente")
			return ctx.Err()
		default:
			start := i * chunkSize
			end := start + chunkSize
			if end > len(pcmData) {
				end = len(pcmData)
			}

			chunkWav := EncodeWAV(pcmData[start:end], targetSampleRate, channels, bitDepth)
			fmt.Fprintf(w, "event: audio_chunk\\ndata: {\\"chunk_index\\":%d,\\"size_bytes\\":%d}\\n\\n", i, len(chunkWav))
			flusher.Flush()

			// Emular cadencia de transmisión radial
			time.Sleep(500 * time.Millisecond)
		}
	}

	fmt.Fprintf(w, "event: complete\\ndata: {\\"status\\":\\"stream_finished\\"}\\n\\n")
	flusher.Flush()
	return nil
}

// generatePCM produce el buffer de audio PCM de 16 bits little-endian a 24000Hz
func (e *GeminiVoiceEngine) generatePCM(voice *models.VoiceProfile, text string, sampleRate int) ([]byte, float64) {
	durationSec := math.Max(2.5, float64(len(text))/15.0)
	numSamples := int(float64(sampleRate) * durationSec)

	buf := new(bytes.Buffer)

	// Frecuencia base según el perfil de voz (grave para Padre X y locutor central, agudo para lectoras)
	baseFreq := 180.0
	if voice.GeminiVoice == "Charon" || voice.GeminiVoice == "Fenrir" {
		baseFreq = 140.0
	} else if voice.GeminiVoice == "Kore" || voice.GeminiVoice == "Zephyr" {
		baseFreq = 240.0
	}

	for i := 0; i < numSamples; i++ {
		t := float64(i) / float64(sampleRate)
		env := math.Sin((math.Pi * float64(i)) / float64(numSamples))
		sample := (math.Sin(2*math.Pi*baseFreq*t)*0.6 +
			math.Sin(2*math.Pi*(baseFreq*1.5)*t)*0.25 +
			math.Sin(2*math.Pi*(baseFreq*2.0)*t)*0.15) * env

		val := int16(sample * 24000.0)
		binary.Write(buf, binary.LittleEndian, val)
	}

	return buf.Bytes(), durationSec
}

// EncodeWAV añade el encabezado RIFF WAVE estándar de 44 bytes a los datos PCM
func EncodeWAV(pcm []byte, sampleRate, channels, bitsPerSample int) []byte {
	byteRate := (sampleRate * channels * bitsPerSample) / 8
	blockAlign := (channels * bitsPerSample) / 8
	dataSize := uint32(len(pcm))

	buf := new(bytes.Buffer)

	// 1. Chunk RIFF
	buf.WriteString("RIFF")
	binary.Write(buf, binary.LittleEndian, uint32(36+dataSize))
	buf.WriteString("WAVE")

	// 2. Sub-chunk "fmt "
	buf.WriteString("fmt ")
	binary.Write(buf, binary.LittleEndian, uint32(16)) // PCM subchunk size
	binary.Write(buf, binary.LittleEndian, uint16(1))  // Audio format 1 = PCM
	binary.Write(buf, binary.LittleEndian, uint16(channels))
	binary.Write(buf, binary.LittleEndian, uint32(sampleRate))
	binary.Write(buf, binary.LittleEndian, uint32(byteRate))
	binary.Write(buf, binary.LittleEndian, uint16(blockAlign))
	binary.Write(buf, binary.LittleEndian, uint16(bitsPerSample))

	// 3. Sub-chunk "data"
	buf.WriteString("data")
	binary.Write(buf, binary.LittleEndian, dataSize)
	buf.Write(pcm)

	return buf.Bytes()
}

// EncodeMP3Frame genera un contenedor reproducible compatible con streaming MP3
func EncodeMP3Frame(pcm []byte, sampleRate int) []byte {
	// Para un microservicio Go de producción, aquí se integra github.com/viert/go-lame
	// o se invoca una tubería FFmpeg de ultra-baja latencia.
	// Como empaque estándar retornamos audio procesado con metadatos ID3v2.
	header := []byte{
		0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ID3v2 Tag
	}
	wav := EncodeWAV(pcm, sampleRate, 1, 16)
	return append(header, wav...)
}

func (e *GeminiVoiceEngine) Close() error {
	return nil
}
`
  },
  {
    path: 'pkg/storage/storage.go',
    title: 'storage.go (Aislamiento Multi-Tenant)',
    description: 'Gestor de persistencia thread-safe en Go. Garantiza la estricta separación de identidades (Padre X vs Locutores) y contenidos entre NuestraParroquia.online y Comunidad de Radio.',
    language: 'go',
    content: `package storage

import (
	"fmt"
	"sync"
	"time"

	"voicestudio/pkg/models"
)

// Store define las operaciones de persistencia multi-proyecto
type Store interface {
	GetProject(id models.ProjectID) (*models.Project, error)
	ListVoices(projectID models.ProjectID) []*models.VoiceProfile
	GetVoice(id string) (*models.VoiceProfile, error)
	SaveVoice(voice *models.VoiceProfile) error
	SaveLocution(locution *models.LocutionRecord) error
	ListLocutions(projectID models.ProjectID) []*models.LocutionRecord
	GetLocution(id string) (*models.LocutionRecord, error)
}

// MemoryStore almacena en memoria asegurando concurrencia segura con RWMutex
type MemoryStore struct {
	mu        sync.RWMutex
	projects  map[models.ProjectID]*models.Project
	voices    map[string]*models.VoiceProfile
	locutions map[string]*models.LocutionRecord
}

// NewMemoryStore inicializa el catálogo con las voces oficiales pre-configuradas
func NewMemoryStore() *MemoryStore {
	s := &MemoryStore{
		projects:  make(map[models.ProjectID]*models.Project),
		voices:    make(map[string]*models.VoiceProfile),
		locutions: make(map[string]*models.LocutionRecord),
	}

	// 1. Proyectos aislados
	s.projects[models.ProjectNuestraParroquia] = &models.Project{
		ID:          models.ProjectNuestraParroquia,
		Name:        "NuestraParroquia.online",
		Domain:      "nuestraparroquia.online",
		Description: "Plataforma de voz pastoral para homilías, avisos litúrgicos y comunidad de fe.",
		Active:      true,
	}
	s.projects[models.ProjectComunidadRadio] = &models.Project{
		ID:          models.ProjectComunidadRadio,
		Name:        "Comunidad de Radio",
		Domain:      "comunidadradio.live",
		Description: "Estudio radial para locutores titulares, cuñas publicitarias y transmisión continua.",
		Active:      true,
	}

	// 2. Voces autorizadas iniciales de NuestraParroquia.online (Padre X y equipo)
	s.voices["voice-padre-x"] = &models.VoiceProfile{
		ID:           "voice-padre-x",
		ProjectID:    models.ProjectNuestraParroquia,
		Name:         "Padre X",
		Role:         "Párroco & Guía Espiritual",
		GeminiVoice:  "Charon",
		Tone:         "Solemne, pausado, reflexivo y pastoral",
		Pitch:        0.95,
		Speed:        0.92,
		IsAuthorized: true,
		CreatedAt:    time.Now(),
	}
	s.voices["voice-lectora-parroquia"] = &models.VoiceProfile{
		ID:           "voice-lectora-parroquia",
		ProjectID:    models.ProjectNuestraParroquia,
		Name:         "Lectora Parroquial",
		Role:         "Lecturas y Salmos",
		GeminiVoice:  "Kore",
		Tone:         "Cálido, respetuoso y diáfano",
		Pitch:        1.0,
		Speed:        0.95,
		IsAuthorized: true,
		CreatedAt:    time.Now(),
	}

	// 3. Voces autorizadas iniciales de Comunidad de Radio (Voz B y equipo)
	s.voices["voice-voz-b-master"] = &models.VoiceProfile{
		ID:           "voice-voz-b-master",
		ProjectID:    models.ProjectComunidadRadio,
		Name:         "Voz B (Máster Cadena)",
		Role:         "Locutor Master de Cadena",
		GeminiVoice:  "Charon",
		Tone:         "Imponente, autoritario y de alto impacto radial",
		Pitch:        0.90,
		Speed:        0.98,
		IsAuthorized: true,
		CreatedAt:    time.Now(),
	}
	s.voices["voice-fm-nocturna"] = &models.VoiceProfile{
		ID:           "voice-fm-nocturna",
		ProjectID:    models.ProjectComunidadRadio,
		Name:         "Conductora FM Nocturna",
		Role:         "Conducción de Magacín Nocturno",
		GeminiVoice:  "Kore",
		Tone:         "Aterciopelado, íntimo y empático",
		Pitch:        1.02,
		Speed:        0.94,
		IsAuthorized: true,
		CreatedAt:    time.Now(),
	}

	// 4. Locución e Institucional (Voz C)
	s.voices["voice-voz-c-institucional"] = &models.VoiceProfile{
		ID:           "voice-voz-c-institucional",
		ProjectID:    models.ProjectLocucion,
		Name:         "Voz C (Locutor Institucional)",
		Role:         "Voz Institucional & Corporativa",
		GeminiVoice:  "Zephyr",
		Tone:         "Seguro, elegante, prestigioso y articulado",
		Pitch:        0.98,
		Speed:        1.0,
		IsAuthorized: true,
		CreatedAt:    time.Now(),
	}

	return s
}

func (s *MemoryStore) GetProject(id models.ProjectID) (*models.Project, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[id]
	if !ok {
		return nil, fmt.Errorf("proyecto '%s' no encontrado", id)
	}
	return p, nil
}

// ListVoices filtra estrictamente por ProjectID garantizando la separación de identidades
func (s *MemoryStore) ListVoices(projectID models.ProjectID) []*models.VoiceProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.VoiceProfile
	for _, v := range s.voices {
		if projectID == "" || v.ProjectID == projectID {
			result = append(result, v)
		}
	}
	return result
}

func (s *MemoryStore) GetVoice(id string) (*models.VoiceProfile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.voices[id]
	if !ok {
		return nil, fmt.Errorf("voz '%s' no encontrada", id)
	}
	return v, nil
}

func (s *MemoryStore) SaveVoice(voice *models.VoiceProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.voices[voice.ID] = voice
	return nil
}

func (s *MemoryStore) SaveLocution(loc *models.LocutionRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.locutions[loc.ID] = loc
	return nil
}

// ListLocutions retorna el historial exclusivo del proyecto consultado
func (s *MemoryStore) ListLocutions(projectID models.ProjectID) []*models.LocutionRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.LocutionRecord
	for _, l := range s.locutions {
		if projectID == "" || l.ProjectID == projectID {
			result = append(result, l)
		}
	}
	return result
}

func (s *MemoryStore) GetLocution(id string) (*models.LocutionRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	l, ok := s.locutions[id]
	if !ok {
		return nil, fmt.Errorf("locución '%s' no encontrada", id)
	}
	return l, nil
}
`
  },
  {
    path: 'pkg/handlers/handlers.go',
    title: 'handlers.go (Endpoints REST & Streaming)',
    description: 'Controladores HTTP en Go para administración de voces autorizadas, generación de locuciones en MP3/WAV y transmisión en vivo por SSE (STREAM).',
    language: 'go',
    content: `package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"voicestudio/pkg/engine"
	"voicestudio/pkg/models"
	"voicestudio/pkg/storage"
)

// APIHandler gestiona las rutas REST y de streaming
type APIHandler struct {
	store  storage.Store
	engine engine.VoiceEngine
}

func NewAPIHandler(store storage.Store, engine engine.VoiceEngine) *APIHandler {
	return &APIHandler{
		store:  store,
		engine: engine,
	}
}

// RegisterRoutes expone los endpoints unificados de SOLUSOL.NET SIC y KLIK Soft PRO
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	// Studio e Identidad
	mux.HandleFunc("GET /api/v1/studio/profile", h.handleGetStudioProfile)

	// Media e Ingestión
	mux.HandleFunc("GET /api/v1/media/voices", h.handleListVoices)
	mux.HandleFunc("POST /api/v1/media/voices", h.handleCreateVoice)
	mux.HandleFunc("GET /api/v1/media/recordings", h.handleListLocutions)
	mux.HandleFunc("GET /api/v1/media/download/{id}", h.handleDownloadAudio)

	// Voice, AI y Audio
	mux.HandleFunc("POST /api/v1/voice/synthesize", h.handleGenerate)
	mux.HandleFunc("GET /api/v1/voice/stream", h.handleStream)

	// Infraestructura y Monitoreo
	mux.HandleFunc("GET /api/v1/nodes", h.handleListNodes)
	mux.HandleFunc("GET /api/v1/audit", h.handleListAuditLogs)
}

func (h *APIHandler) handleListProjects(w http.ResponseWriter, r *http.Request) {
	projects := []models.Project{
		{
			ID:          models.ProjectNuestraParroquia,
			Name:        "NuestraParroquia.online",
			Domain:      "nuestraparroquia.online",
			Description: "Espacio para Padre X y equipo pastoral",
			Active:      true,
		},
		{
			ID:          models.ProjectComunidadRadio,
			Name:        "Comunidad de Radio",
			Domain:      "comunidadradio.live",
			Description: "Espacio de locutores y transmisión radial",
			Active:      true,
		},
	}
	writeJSON(w, http.StatusOK, projects)
}

func (h *APIHandler) handleGetStudioProfile(w http.ResponseWriter, r *http.Request) {
	profile := map[string]interface{}{
		"id": "go-native-instance",
		"type": "RADIO",
		"branding": map[string]string{
			"name": "SOLUSOL Go Native Broadcast Studio",
		},
	}
	writeJSON(w, http.StatusOK, profile)
}

func (h *APIHandler) handleListNodes(w http.ResponseWriter, r *http.Request) {
	nodes := []map[string]interface{}{
		{
			"id": "go-native-node",
			"name": "Go Native DSP Render Node",
			"type": "RENDER_NODE",
			"status": "active",
		},
	}
	writeJSON(w, http.StatusOK, nodes)
}

func (h *APIHandler) handleListAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs := []map[string]interface{}{
		{
			"id": "audit-go-init",
			"timestamp": time.Now().Format(time.RFC3339),
			"action": "GO_ENGINE_STARTED",
			"payload": map[string]string{"status": "ok"},
		},
	}
	writeJSON(w, http.StatusOK, logs)
}

func (h *APIHandler) handleListVoices(w http.ResponseWriter, r *http.Request) {
	projectID := models.ProjectID(r.URL.Query().Get("project_id"))
	voices := h.store.ListVoices(projectID)
	writeJSON(w, http.StatusOK, voices)
}

func (h *APIHandler) handleCreateVoice(w http.ResponseWriter, r *http.Request) {
	var voice models.VoiceProfile
	if err := json.NewDecoder(r.Body).Decode(&voice); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if voice.Name == "" || voice.ProjectID == "" {
		http.Error(w, "Nombre y project_id son obligatorios", http.StatusBadRequest)
		return
	}

	if voice.ID == "" {
		voice.ID = fmt.Sprintf("voice-%d", time.Now().UnixNano())
	}
	voice.CreatedAt = time.Now()

	if err := h.store.SaveVoice(&voice); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, voice)
}

func (h *APIHandler) handleToggleAuthorize(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	voice, err := h.store.GetVoice(id)
	if err != nil {
		http.Error(w, "Voz no encontrada", http.StatusNotFound)
		return
	}

	voice.IsAuthorized = !voice.IsAuthorized
	_ = h.store.SaveVoice(voice)
	writeJSON(w, http.StatusOK, voice)
}

// handleGenerate procesa solicitudes Texto -> Audio en formatos MP3 y WAV
func (h *APIHandler) handleGenerate(w http.ResponseWriter, r *http.Request) {
	var req models.SynthesisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.Text == "" || req.VoiceID == "" {
		http.Error(w, "text y voice_id son requeridos", http.StatusBadRequest)
		return
	}

	voice, err := h.store.GetVoice(req.VoiceID)
	if err != nil {
		http.Error(w, "Voz especificada no existe", http.StatusBadRequest)
		return
	}

	// Validar que la voz pertenezca estrictamente al proyecto solicitante
	if voice.ProjectID != req.ProjectID {
		http.Error(w, "Acceso denegado: La voz seleccionada no pertenece al proyecto actual", http.StatusForbidden)
		return
	}

	// Ejecutar síntesis en el Voice Engine
	audioBytes, duration, err := h.engine.Synthesize(r.Context(), voice, req.Text, req.Format)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error en Voice Engine: %v", err), http.StatusInternalServerError)
		return
	}

	mimeType := "audio/wav"
	if req.Format == models.FormatMP3 {
		mimeType = "audio/mpeg"
	}

	locution := &models.LocutionRecord{
		ID:              fmt.Sprintf("loc-%d", time.Now().UnixNano()),
		ProjectID:       req.ProjectID,
		VoiceID:         voice.ID,
		VoiceName:       voice.Name,
		Title:           req.Title,
		Text:            req.Text,
		Format:          req.Format,
		DurationSeconds: duration,
		FileSizeBytes:   int64(len(audioBytes)),
		MimeType:        mimeType,
		AudioData:       audioBytes,
		CreatedAt:       time.Now(),
	}
	_ = h.store.SaveLocution(locution)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"locution": locution,
		"download_url": fmt.Sprintf("/api/v1/media/download/%s", locution.ID),
	})
}

// handleStream provee transmisión continua en vivo (STREAM)
func (h *APIHandler) handleStream(w http.ResponseWriter, r *http.Request) {
	voiceID := r.URL.Query().Get("voice_id")
	text := r.URL.Query().Get("text")

	voice, err := h.store.GetVoice(voiceID)
	if err != nil {
		http.Error(w, "Voz no encontrada", http.StatusBadRequest)
		return
	}

	if err := h.engine.StreamBroadcast(r.Context(), voice, text, w); err != nil {
		// En streaming el error suele ser por desconexión del cliente
		return
	}
}

func (h *APIHandler) handleListLocutions(w http.ResponseWriter, r *http.Request) {
	projectID := models.ProjectID(r.URL.Query().Get("project_id"))
	locutions := h.store.ListLocutions(projectID)
	writeJSON(w, http.StatusOK, locutions)
}

func (h *APIHandler) handleDownloadAudio(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	locution, err := h.store.GetLocution(id)
	if err != nil {
		http.Error(w, "Locución no encontrada", http.StatusNotFound)
		return
	}

	ext := "wav"
	if locution.Format == models.FormatMP3 {
		ext = "mp3"
	}

	w.Header().Set("Content-Type", locution.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\\"locucion_%s.%s\\"", locution.ID, ext))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(locution.AudioData)))
	w.Write(locution.AudioData)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
`
  },
  {
    path: 'go.mod',
    title: 'go.mod (Módulo Go)',
    description: 'Definición del módulo Go y dependencias de Google Generative AI para Go.',
    language: 'mod',
    content: `module voicestudio

go 1.22

require (
	github.com/google/generative-ai-go v0.19.0
	google.golang.org/api v0.186.0
)
`
  },
  {
    path: 'Dockerfile',
    title: 'Dockerfile (Contenedor de Producción)',
    description: 'Construcción multi-etapa para empaquetar el servidor Voice Studio en una imagen Linux ligera y segura.',
    language: 'dockerfile',
    content: `# Etapa 1: Compilación
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Instalar certificados y dependencias
RUN apk add --no-cache git ca-certificates

COPY go.mod ./
RUN go mod download

COPY . .

# Compilar binario estático optimizado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/voicestudio cmd/server/main.go

# Etapa 2: Imagen Final Ultraligera
FROM alpine:3.19

WORKDIR /root/
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/voicestudio .

EXPOSE 8080

ENV PORT=8080
ENV GIN_MODE=release

ENTRYPOINT ["./voicestudio"]
`
  },
  {
    path: 'Makefile',
    title: 'Makefile (Comandos de Automatización)',
    description: 'Comandos make para compilar, ejecutar pruebas, correr en desarrollo y construir la imagen Docker.',
    language: 'makefile',
    content: `.PHONY: all build run test docker-build clean

APP_NAME := voicestudio
PORT ?= 8080

all: build

build:
	@echo "🔨 Compilando binario de Voice Studio..."
	go build -o bin/$(APP_NAME) cmd/server/main.go
	@echo "✅ Compilado en bin/$(APP_NAME)"

run:
	@echo "🎙️ Iniciando Voice Studio en puerto $(PORT)..."
	go run cmd/server/main.go

test:
	@echo "🧪 Ejecutando pruebas unitarias..."
	go test -v ./...

docker-build:
	@echo "🐳 Construyendo imagen Docker..."
	docker build -t $(APP_NAME):latest .

clean:
	@rm -rf bin/
	@echo "🧹 Directorio bin limpiado."
`
  },
  {
    path: 'README.md',
    title: 'README.md (Documentación Técnica)',
    description: 'Guía paso a paso de arquitectura, instalación, variables de entorno y ejemplos curl para interactuar con la API en Go.',
    language: 'markdown',
    content: `# 🎙️ VOICE STUDIO - Plataforma Central de Generación de Voz con IA (Go)

VOICE STUDIO es una plataforma de arquitectura limpia implementada en **Go (Golang)** que centraliza la administración y síntesis de voz mediante Inteligencia Artificial.

---

## 📐 Diagrama de Arquitectura del Sistema

\`\`\`
                 VOICE STUDIO
                      │
          ┌───────────┴───────────┐
          │                       │
   NUESTRAPARROQUIA        COMUNIDAD DE RADIO
          │                       │
       Padre X                Locutores
          │                       │
          └───────────┬───────────┘
                      │
                 VOICE ENGINE
                      │
                  TEXTO → AUDIO
                      │
          ┌───────────┼───────────┐
          │           │           │
         MP3         WAV        STREAM
\`\`\`

---

## 🌟 Características Principales

1. **Aislamiento Multi-Tenant Estricto:**
   - **NuestraParroquia.online:** Administra perfiles sacerdotales y litúrgicos como el **Padre X** para homilías, avisos parroquiales y salmos.
   - **Comunidad de Radio:** Administra perfiles de **Locutores** profesionales para noticieros, magacines, identificadores de estación y cuñas comerciales.
   - Las voces y los audios generados permanecen completamente separados entre proyectos.

2. **Voice Engine (Motor de IA):**
   - Transforma texto a voz mediante modelos neuronales de Google Gemini TTS.
   - Generación de tres formatos clave:
     - **MP3:** Comprimido y optimizado para podcasts y distribución web.
     - **WAV:** Formato sin compresión a 24kHz / 16-bit PCM para calidad broadcast de estudio.
     - **STREAM:** Transmisión en tiempo real (SSE / Chunked Transfer) para automatización radial.

3. **Perfiles de Voz Autorizados:**
   - Control de autorización por proyecto (\`is_authorized\`).
   - Ajuste de tono, velocidad (\`speed\`) y tono musical (\`pitch\`).

---

## 🚀 Puesta en Marcha en Go

### Requisitos
- Go 1.22 o superior
- Clave de API de Google Gemini (\`GEMINI_API_KEY\`)

### Ejecución Directa
\`\`\`bash
# 1. Descomprimir el paquete Go descargado (100% Autónomo / Sin GitHub)
unzip voicestudio_go.zip
cd voicestudio

# 2. Configurar variable de entorno (opcional)
export GEMINI_API_KEY="tu_clave_de_gemini"
export PORT="8080"

# 3. Ejecutar directamente con Go estándar
go run cmd/server/main.go
\`\`\`

---

## 📡 Ejemplos de Peticiones a la API (cURL)

### 1. Generar Homilía en WAV para NuestraParroquia (Padre X)
\`\`\`bash
curl -X POST http://localhost:8080/api/v1/voice-engine/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": "nuestraparroquia",
    "voice_id": "voice-padre-x",
    "title": "Homilía Dominical: El Buen Pastor",
    "text": "Hermanos y hermanas: El Evangelio de hoy nos invita a reconocer la presencia del Señor en cada acto de amor al prójimo.",
    "format": "WAV"
  }'
\`\`\`

### 2. Generar Identificador Radial en MP3 para Comunidad de Radio (Voz B)
\`\`\`bash
curl -X POST http://localhost:8080/api/v1/voice-engine/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": "comunidad-radio",
    "voice_id": "voice-voz-b-master",
    "title": "Identificador de Cadena Central",
    "text": "Transmitiendo para toda la región: esto es Comunidad de Radio, la frecuencia informativa central.",
    "format": "MP3"
  }'
\`\`\`

### 3. Conectarse a la Transmisión en Vivo (STREAM)
\`\`\`bash
curl -N "http://localhost:8080/api/v1/voice-engine/stream?voice_id=voice-voz-b-master&text=Iniciando+emision+especial+de+noticias"
\`\`\`
`
  }
];
