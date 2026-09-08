package storage

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
		KlikVoice:    "solusol-deep",
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
		KlikVoice:    "solusol-bright",
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
		KlikVoice:    "solusol-deep",
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
		KlikVoice:    "solusol-bright",
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
		KlikVoice:    "klik-master",
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
