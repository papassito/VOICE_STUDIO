# 📚 Documentación Técnica y Contratos de Arquitectura

**Proyecto:** VOICE STUDIO  
**Documento:** Índice de Documentación Técnica  
**Estado:** FOUNDATION

---

## 1. Propósito

Este directorio centraliza todos los "contratos" técnicos y los documentos de arquitectura de VOICE STUDIO. Siguiendo el principio de **Contract First**, cada subdirectorio contiene la documentación normativa para un área específica del sistema.

Un contrato es la fuente de verdad sobre cómo debe comportarse un componente. La implementación y las pruebas deben adherirse a lo aquí definido.

---

## 2. Mapa de Contratos

*   `./architecture/`  
    Decisiones de alto nivel, diagramas, principios y restricciones arquitectónicas.

*   `./api/`  
    Contratos de la API pública (v1, v2...). Endpoints, payloads, códigos de estado y estrategias de versionado.

*   `./configuration/`  
    Esquemas de configuración, variables de entorno y valores por defecto.

*   `./security/`  
    Políticas de autenticación, autorización, gestión de secretos y aislamiento de tenants.

*   `./providers/`  
    Interfaces y contratos para la integración de proveedores de TTS, almacenamiento, etc.

*   `./nodes/`  
    Arquitectura de nodos, registro, capacidades y protocolos de comunicación interna.

*   `./audio/`  
    Definiciones del pipeline de audio, formatos soportados, normalización y procesamiento.

*   `./deployment/`  
    Guías de despliegue, scripts, contenedores (Dockerfile) y configuración de infraestructura.

*   `./operations/`  
    Guías operativas para el mantenimiento, monitorización (health, readiness), logging y troubleshooting.