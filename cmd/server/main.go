package main

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
	fmt.Println("ðŸŽ™ï¸  Iniciando Voice Studio...")
	log.Println("==========================================================")
	log.Println("ðŸŽ™ï¸  VOICE STUDIO by KLIK - Agencia Centralizada de Voces IA")
	log.Println("    Aislamiento Multi-Tenant: NuestraParroquia, Comunidad de Radio, etc.")
	log.Println("    Banco de Voces: Padre X, Voz B, Voz C...")
	log.Println("    Formatos: MP3 | WAV | STREAM (100% AutÃ³nomo / No GitHub)")
	log.Println("==========================================================")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Obtener clave de API para el motor de IA Gemini
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("âš ï¸  AVISO: GEMINI_API_KEY no detectada en entorno.")
		log.Println("    El Voice Engine operarÃ¡ en modo de sÃ­ntesis armÃ³nica local (Preview).")
	}

	// 2. Inicializar Almacenamiento Multi-Tenant Aislado
	store := storage.NewMemoryStore()
	log.Println("âœ… AlmacÃ©n de identidades y contenidos inicializado con Ã©xito.")

	// 3. Inicializar el Voice Engine (Motor de IA para Texto -> Audio)
	voiceEngine, err := engine.NewGeminiVoiceEngine(ctx, apiKey)
	if err != nil {
		log.Fatalf("âŒ Error crÃ­tico inicializando Voice Engine: %v", err)
	}
	defer voiceEngine.Close()
	log.Println("âœ… Voice Engine (Google Gemini TTS + Transcodificador) listo.")

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
		log.Printf("ðŸš€ Servidor Voice Studio escuchando en http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("âŒ Error en servidor HTTP: %v", err)
		}
	}()

	// Esperar seÃ±al de terminaciÃ³n (SIGINT, SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("ðŸ›‘ Apagando Voice Studio de forma segura...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("âš ï¸ Forzando cierre del servidor: %v", err)
	}
	log.Println("ðŸ‘‹ Voice Studio finalizado correctamente.")
}
