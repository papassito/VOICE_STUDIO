package models

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
	FormatSTREAM AudioFormat = "STREAM" // TransmisiÃ³n en tiempo real (SSE / Chunked)
)

// Project define la configuraciÃ³n y lÃ­mites de cada tenant
type Project struct {
	ID          ProjectID `json:"id"`
	Name        string    `json:"name"`
	Domain      string    `json:"domain"`
	Description string    `json:"description"`
	Active      bool      `json:"active"`
}

// VoiceProfile representa una voz autorizada dentro de un proyecto especÃ­fico
type VoiceProfile struct {
	ID           string    `json:"id"`
	ProjectID    ProjectID `json:"project_id"`   // Aislamiento: pertenece solo a este proyecto
	Name         string    `json:"name"`         // Ej: "Padre X", "Carlos Morales"
	Role         string    `json:"role"`         // Ej: "PÃ¡rroco", "Locutor Central"
	GeminiVoice  string    `json:"gemini_voice"` // Puck, Charon, Kore, Fenrir, Zephyr
	Tone         string    `json:"tone"`         // Solemne, RadiofÃ³nico, CÃ¡lido, etc.
	Pitch        float64   `json:"pitch"`        // 0.8 - 1.2
	Speed        float64   `json:"speed"`        // 0.8 - 1.3
	IsAuthorized bool      `json:"is_authorized"`// Solo voces autorizadas pueden generar audio
	CreatedAt    time.Time `json:"created_at"`
}

// SynthesisRequest es la peticiÃ³n enviada al Voice Engine
type SynthesisRequest struct {
	ProjectID       ProjectID   `json:"project_id"`
	VoiceID         string      `json:"voice_id"`
	Text            string      `json:"text"`
	Title           string      `json:"title"`
	Format          AudioFormat `json:"format"` // MP3, WAV, STREAM
	ToneInstruction string      `json:"tone_instruction,omitempty"`
}

// LocutionRecord representa el contenido de audio generado y archivado
type LocutionRecord struct {
	ID              string      `json:"id"`
	ProjectID       ProjectID   `json:"project_id"`
	VoiceID         string      `json:"voice_id"`
	VoiceName       string      `json:"voice_name"`
	Title           string      `json:"title"`
	Text            string      `json:"text"`
	Format          AudioFormat `json:"format"`
	DurationSeconds float64     `json:"duration_seconds"`
	FileSizeBytes   int64       `json:"file_size_bytes"`
	MimeType        string      `json:"mime_type"`
	AudioData       []byte      `json:"-"` // Datos binarios de audio
	CreatedAt       time.Time   `json:"created_at"`
}
