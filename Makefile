.PHONY: all build run test docker-build clean

APP_NAME := voicestudio
PORT ?= 8080

all: build

build:
	@echo "ðŸ”¨ Compilando binario de Voice Studio..."
	go build -o bin/$(APP_NAME) cmd/server/main.go
	@echo "âœ… Compilado en bin/$(APP_NAME)"

run:
	@echo "ðŸŽ™ï¸ Iniciando Voice Studio en puerto $(PORT)..."
	go run cmd/server/main.go

test:
	@echo "ðŸ§ª Ejecutando pruebas unitarias..."
	go test -v ./...

docker-build:
	@echo "ðŸ³ Construyendo imagen Docker..."
	docker build -t $(APP_NAME):latest .

clean:
	@rm -rf bin/
	@echo "ðŸ§¹ Directorio bin limpiado."
