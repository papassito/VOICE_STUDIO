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
	ID          ProjectID \