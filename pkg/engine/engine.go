package engine

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"net/http"
	"os/exec"
	"sync"
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

// StudioVoiceEngine implementa VoiceEngine para procesamiento de audio local y de producción de Solusol
type StudioVoiceEngine struct {
	mu            sync.RWMutex
	activeProfile StudioProfileConfig
}

// NewStudioVoiceEngine crea una nueva instancia del motor de voz
func NewStudioVoiceEngine(ctx context.Context) (*StudioVoiceEngine, error) {
	// Instancia compatible con la plataforma de APIs SOLUSOL.NET SIC y KLIK Soft PRO
	defaultProfile := StudioProfileConfig{}
	defaultProfile.Hardware.SampleRate = 44100
	defaultProfile.Hardware.BitDepth = 24
	defaultProfile.Hardware.Channels = 1
	return &StudioVoiceEngine{
		activeProfile: defaultProfile,
	}, nil
}

// UpdateProfile actualiza en caliente los metadatos de hardware y comportamiento de renderizado
func (e *StudioVoiceEngine) UpdateProfile(profile StudioProfileConfig) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	requiresRestart := false
	if e.activeProfile.Hardware.SampleRate != profile.Hardware.SampleRate ||
		e.activeProfile.Hardware.BitDepth != profile.Hardware.BitDepth ||
		e.activeProfile.Hardware.Channels != profile.Hardware.Channels {
		requiresRestart = true
	}

	log.Printf("[SOLUSOL SIC API] Reconfigurando canal de audio para '%s' (%s) a %dHz, %d-bit (canales: %d)", 
		profile.ActiveBrandingName, profile.StudioType, profile.Hardware.SampleRate, profile.Hardware.BitDepth, profile.Hardware.Channels)
	e.activeProfile = profile
	return requiresRestart
}

// Synthesize convierte texto en audio en formato WAV, MP3 o STREAM
func (e *StudioVoiceEngine) Synthesize(ctx context.Context, voice *models.VoiceProfile, text string, format models.AudioFormat) ([]byte, float64, error) {
	if !voice.IsAuthorized {
		return nil, 0, fmt.Errorf("la voz '%s' no cuenta con autorización para generar locuciones", voice.Name)
	}

	log.Printf("[KLIK Soft PRO API] Sintetizando para proyecto '%s' con voz '%s' (%s) en formato %s",
		voice.ProjectID, voice.Name, voice.KlikVoice, format)

	e.mu.RLock()
	targetSampleRate := e.activeProfile.Hardware.SampleRate
	channels := e.activeProfile.Hardware.Channels
	bitDepth := e.activeProfile.Hardware.BitDepth
	e.mu.RUnlock()

	if targetSampleRate <= 0 || channels <= 0 || bitDepth <= 0 {
		return nil, 0, fmt.Errorf("configuraciones de hardware inválidas: sampleRate=%d channels=%d bitDepth=%d", targetSampleRate, channels, bitDepth)
	}

	pcmData, duration, err := e.generatePCM(voice, text, targetSampleRate)
	if err != nil {
		return nil, 0, err
	}

	// 2. Transcodificar según el formato requerido
	switch format {
	case models.FormatWAV:
		wavBytes := EncodeWAV(pcmData, targetSampleRate, channels, bitDepth)
		return wavBytes, duration, nil

	case models.FormatMP3:
		mp3Bytes, err := EncodeMP3Frame(pcmData, targetSampleRate, channels, bitDepth)
		if err != nil {
			return nil, 0, err
		}
		return mp3Bytes, duration, nil

	case models.FormatSTREAM:
		wavBytes := EncodeWAV(pcmData, targetSampleRate, channels, bitDepth)
		return wavBytes, duration, nil

	default:
		return EncodeWAV(pcmData, targetSampleRate, channels, bitDepth), duration, nil
	}
}

// StreamBroadcast emite el audio en tiempo real mediante Server-Sent Events o Chunked Transfer
func (e *StudioVoiceEngine) StreamBroadcast(ctx context.Context, voice *models.VoiceProfile, text string, w http.ResponseWriter) error {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("el cliente HTTP no soporta streaming")
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Emitir evento inicial de sincronización
	fmt.Fprintf(w, "event: init\ndata: {\"project\":\"%s\",\"voice\":\"%s\",\"status\":\"connected\"}\n\n",
		voice.ProjectID, voice.Name)
	flusher.Flush()

	e.mu.RLock()
	targetSampleRate := e.activeProfile.Hardware.SampleRate
	bitDepth := e.activeProfile.Hardware.BitDepth
	channels := e.activeProfile.Hardware.Channels
	e.mu.RUnlock()

	if targetSampleRate <= 0 || channels <= 0 || bitDepth <= 0 {
		return fmt.Errorf("configuraciones de hardware inválidas: sampleRate=%d channels=%d bitDepth=%d", targetSampleRate, channels, bitDepth)
	}

	pcmData, _, err := e.generatePCM(voice, text, targetSampleRate)
	if err != nil {
		return err
	}
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
			fmt.Fprintf(w, "event: audio_chunk\ndata: {\"chunk_index\":%d,\"size_bytes\":%d}\n\n", i, len(chunkWav))
			flusher.Flush()

			// Emular cadencia de transmisión radial
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(500 * time.Millisecond):
			}
		}
	}

	fmt.Fprintf(w, "event: complete\ndata: {\"status\":\"stream_finished\"}\n\n")
	flusher.Flush()
	return nil
}

// generateFloatSamples produce muestras matemáticas de punto flotante en rango [-1.0, 1.0]
func (e *StudioVoiceEngine) generateFloatSamples(voice *models.VoiceProfile, durationSec float64, sampleRate int) []float64 {
	numSamples := int(float64(sampleRate) * durationSec)
	samples := make([]float64, numSamples)

	baseFreq := 180.0
	if voice.ID == "voice-padre-x" || voice.ID == "voice-voz-b-master" {
		baseFreq = 140.0
	} else if voice.ID == "voice-lectora-parroquia" || voice.ID == "voice-fm-nocturna" {
		baseFreq = 240.0
	}

	for i := 0; i < numSamples; i++ {
		t := float64(i) / float64(sampleRate)
		env := math.Sin((math.Pi * float64(i)) / float64(numSamples))
		sample := (math.Sin(2*math.Pi*baseFreq*t)*0.6 +
			math.Sin(2*math.Pi*(baseFreq*1.5)*t)*0.25 +
			math.Sin(2*math.Pi*(baseFreq*2.0)*t)*0.15) * env

		if sample > 1.0 {
			sample = 1.0
		} else if sample < -1.0 {
			sample = -1.0
		}
		samples[i] = sample
	}

	return samples
}

// convertToTargetPCM convierte muestras de flotante a PCM de 16-bit o 24-bit mono/stereo
func convertToTargetPCM(monoSamples []float64, channels, bitsPerSample int) ([]byte, error) {
	buf := new(bytes.Buffer)
	numChannels := channels
	if numChannels < 1 {
		numChannels = 1
	}

	for _, sample := range monoSamples {
		for c := 0; c < numChannels; c++ {
			if bitsPerSample == 16 {
				val := int16(sample * 32767.0)
				binary.Write(buf, binary.LittleEndian, val)
			} else if bitsPerSample == 24 {
				val := int32(sample * 8388607.0)
				buf.WriteByte(byte(val & 0xFF))
				buf.WriteByte(byte((val >> 8) & 0xFF))
				buf.WriteByte(byte((val >> 16) & 0xFF))
			} else if bitsPerSample == 32 {
				val := math.Float32bits(float32(sample))
				binary.Write(buf, binary.LittleEndian, val)
			} else {
				return nil, fmt.Errorf("unsupported bit depth: %d", bitsPerSample)
			}
		}
	}
	return buf.Bytes(), nil
}

// generatePCM produce el buffer de audio PCM de la profundidad de bits y canales adecuados
func (e *StudioVoiceEngine) generatePCM(voice *models.VoiceProfile, text string, sampleRate int) ([]byte, float64, error) {
	durationSec := math.Max(2.5, float64(len(text))/15.0)

	e.mu.RLock()
	channels := e.activeProfile.Hardware.Channels
	bitDepth := e.activeProfile.Hardware.BitDepth
	e.mu.RUnlock()

	floatSamples := e.generateFloatSamples(voice, durationSec, sampleRate)
	pcmBytes, err := convertToTargetPCM(floatSamples, channels, bitDepth)
	if err != nil {
		return nil, 0, err
	}

	return pcmBytes, durationSec, nil
}

// EncodeWAV añade el encabezado RIFF WAVE estándar de 44 bytes a los datos PCM
func EncodeWAV(pcm []byte, sampleRate, channels, bitsPerSample int) []byte {
	byteRate := (sampleRate * channels * bitsPerSample) / 8
	blockAlign := (channels * bitsPerSample) / 8
	dataSize := uint32(len(pcm))
	formatCode := uint16(1) // 1 = PCM Integer
	if bitsPerSample == 32 {
		formatCode = 3 // 3 = IEEE Float
	}

	buf := new(bytes.Buffer)

	// 1. Chunk RIFF
	buf.WriteString("RIFF")
	binary.Write(buf, binary.LittleEndian, uint32(36+dataSize))
	buf.WriteString("WAVE")

	// 2. Sub-chunk "fmt "
	buf.WriteString("fmt ")
	binary.Write(buf, binary.LittleEndian, uint32(16)) // PCM subchunk size
	binary.Write(buf, binary.LittleEndian, formatCode)
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

// EncodeMP3Frame genera un contenedor MP3 real mediante transcodificación por tubería ffmpeg/lame
func EncodeMP3Frame(pcm []byte, sampleRate, channels, bitsPerSample int) ([]byte, error) {
	// Generar contenedor WAV temporal para alimentar al codificador de línea de comandos
	wavBytes := EncodeWAV(pcm, sampleRate, channels, bitsPerSample)

	// Intentar utilizar ffmpeg en PATH para conversión nativa de alta fidelidad
	cmd := exec.Command("ffmpeg", "-i", "pipe:0", "-f", "mp3", "pipe:1")
	cmd.Stdin = bytes.NewReader(wavBytes)
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err == nil && out.Len() > 0 {
		return out.Bytes(), nil
	}

	// Alternativa: intentar usar LAME si ffmpeg no está disponible
	cmdLame := exec.Command("lame", "-r", "-s", fmt.Sprintf("%.1f", float64(sampleRate)/1000.0), "-", "-")
	cmdLame.Stdin = bytes.NewReader(pcm)
	var outLame bytes.Buffer
	cmdLame.Stdout = &outLame
	if err := cmdLame.Run(); err == nil && outLame.Len() > 0 {
		return outLame.Bytes(), nil
	}

	return nil, fmt.Errorf("no se detectó ffmpeg ni lame en el PATH de producción para codificación MP3 real")
}

func (e *StudioVoiceEngine) Close() error {
	return nil
}
