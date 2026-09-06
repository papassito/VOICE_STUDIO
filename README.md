# ðŸŽ™ï¸ VOICE STUDIO - Plataforma Central de GeneraciÃ³n de Voz con IA (Go)

VOICE STUDIO es una plataforma de arquitectura limpia implementada en **Go (Golang)** que centraliza la administraciÃ³n y sÃ­ntesis de voz mediante Inteligencia Artificial.

---

## ðŸ“ Diagrama de Arquitectura del Sistema

```
                 VOICE STUDIO
                      â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚                       â”‚
   NUESTRAPARROQUIA        COMUNIDAD DE RADIO
          â”‚                       â”‚
       Padre X                Locutores
          â”‚                       â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                      â”‚
                 VOICE ENGINE
                      â”‚
                  TEXTO â†’ AUDIO
                      â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚           â”‚           â”‚
         MP3         WAV        STREAM
```

---

## ðŸŒŸ CaracterÃ­sticas Principales

1. **Aislamiento Multi-Tenant Estricto:**
   - **NuestraParroquia.online:** Administra perfiles sacerdotales y litÃºrgicos como el **Padre X** para homilÃ­as, avisos parroquiales y salmos.
   - **Comunidad de Radio:** Administra perfiles de **Locutores** profesionales para noticieros, magacines, identificadores de estaciÃ³n y cuÃ±as comerciales.
   - Las voces y los audios generados permanecen completamente separados entre proyectos.

2. **Voice Engine (Motor de IA):**
   - Transforma texto a voz mediante modelos neuronales de Google Gemini TTS.
   - GeneraciÃ³n de tres formatos clave:
     - **MP3:** Comprimido y optimizado para podcasts y distribuciÃ³n web.
     - **WAV:** Formato sin compresiÃ³n a 24kHz / 16-bit PCM para calidad broadcast de estudio.
     - **STREAM:** TransmisiÃ³n en tiempo real (SSE / Chunked Transfer) para automatizaciÃ³n radial.

3. **Perfiles de Voz Autorizados:**
   - Control de autorizaciÃ³n por proyecto (`is_authorized`).
   - Ajuste de tono, velocidad (`speed`) y tono musical (`pitch`).

---

## ðŸš€ Puesta en Marcha en Go

### Requisitos
- Go 1.22 o superior
- Clave de API de Google Gemini (`GEMINI_API_KEY`)

### EjecuciÃ³n Directa
```bash
# 1. Descomprimir el paquete Go descargado (100% AutÃ³nomo / Sin GitHub)
unzip voicestudio_go.zip
cd voicestudio

# 2. Configurar variable de entorno (opcional)
export GEMINI_API_KEY="tu_clave_de_gemini"
export PORT="8080"

# 3. Ejecutar directamente con Go estÃ¡ndar
go run cmd/server/main.go
```

---

## ðŸ“¡ Ejemplos de Peticiones a la API (cURL)

### 1. Generar HomilÃ­a en WAV para NuestraParroquia (Padre X)
```bash
curl -X POST http://localhost:8080/api/v1/voice-engine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "nuestraparroquia",
    "voice_id": "voice-padre-x",
    "title": "HomilÃ­a Dominical: El Buen Pastor",
    "text": "Hermanos y hermanas: El Evangelio de hoy nos invita a reconocer la presencia del SeÃ±or en cada acto de amor al prÃ³jimo.",
    "format": "WAV"
  }'
```

### 2. Generar Identificador Radial en MP3 para Comunidad de Radio (Voz B)
```bash
curl -X POST http://localhost:8080/api/v1/voice-engine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "comunidad-radio",
    "voice_id": "voice-voz-b-master",
    "title": "Identificador de Cadena Central",
    "text": "Transmitiendo para toda la regiÃ³n: esto es Comunidad de Radio, la frecuencia informativa central.",
    "format": "MP3"
  }'
```

### 3. Conectarse a la TransmisiÃ³n en Vivo (STREAM)
```bash
curl -N "http://localhost:8080/api/v1/voice-engine/stream?voice_id=voice-voz-b-master&text=Iniciando+emision+especial+de+noticias"
```
