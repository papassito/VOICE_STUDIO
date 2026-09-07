package handlers

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

// RegisterRoutes expone los endpoints requeridos por la arquitectura de Voice Studio
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	// Proyectos e Identidades
	mux.HandleFunc("GET /api/v1/projects", h.handleListProjects)
	mux.HandleFunc("GET /api/v1/voices", h.handleListVoices)
	mux.HandleFunc("POST /api/v1/voices", h.handleCreateVoice)
	mux.HandleFunc("PUT /api/v1/voices/{id}/authorize", h.handleToggleAuthorize)

	// Voice Engine: TransformaciÃ³n Texto -> Audio
	mux.HandleFunc("POST /api/v1/voice-engine/generate", h.handleGenerate)
	mux.HandleFunc("GET /api/v1/voice-engine/stream", h.handleStream)

	// Historial y Descargas
	mux.HandleFunc("GET /api/v1/locutions", h.handleListLocutions)
	mux.HandleFunc("GET /api/v1/locutions/{id}/download", h.handleDownloadAudio)
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
			Description: "Espacio de locutores y transmisiÃ³n radial",
			Active:      true,
		},
	}
	writeJSON(w, http.StatusOK, projects)
}

func (h *APIHandler) handleListVoices(w http.ResponseWriter, r *http.Request) {
	projectID := models.ProjectID(r.URL.Query().Get("project_id"))
	voices := h.store.ListVoices(projectID)
	writeJSON(w, http.StatusOK, voices)
}

func (h *APIHandler) handleCreateVoice(w http.ResponseWriter, r *http.Request) {
	var voice models.VoiceProfile
	if err := json.NewDecoder(r.Body).Decode(&voice); err != nil {
		http.Error(w, "JSON invÃ¡lido", http.StatusBadRequest)
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
		http.Error(w, "JSON invÃ¡lido", http.StatusBadRequest)
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

	// Ejecutar sÃ­ntesis en el Voice Engine
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

// handleStream provee transmisiÃ³n continua en vivo (STREAM)
func (h *APIHandler) handleStream(w http.ResponseWriter, r *http.Request) {
	voiceID := r.URL.Query().Get("voice_id")
	text := r.URL.Query().Get("text")

	voice, err := h.store.GetVoice(voiceID)
	if err != nil {
		http.Error(w, "Voz no encontrada", http.StatusBadRequest)
		return
	}

	if err := h.engine.StreamBroadcast(r.Context(), voice, text, w); err != nil {
		// En streaming el error suele ser por desconexiÃ³n del cliente
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
		http.Error(w, "LocuciÃ³n no encontrada", http.StatusNotFound)
		return
	}

	ext := "wav"
	if locution.Format == models.FormatMP3 {
		ext = "mp3"
	}

	w.Header().Set("Content-Type", locution.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"locucion_%s.%s\"", locution.ID, ext))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(locution.AudioData)))
	w.Write(locution.AudioData)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
