# Etapa 1: CompilaciÃ³n
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Instalar certificados y dependencias
RUN apk add --no-cache git ca-certificates

COPY go.mod ./
RUN go mod download

COPY . .

# Compilar binario estÃ¡tico optimizado
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
