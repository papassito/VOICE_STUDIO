# VOICE STUDIO

**Plataforma configurable de generación, procesamiento y distribución de voz mediante Inteligencia Artificial**

**Proyecto:** VOICE STUDIO  
**Tecnología principal:** Go  
**Arquitectura:** Clean Architecture / Modular / Provider-Agnostic  
**Modelo:** Configurable / Multi-Tenant / Node-Aware  
**Estado:** FOUNDATION

---

## 1. Propósito

VOICE STUDIO es una plataforma de software destinada a centralizar la administración, generación, procesamiento, almacenamiento y distribución de contenido de voz mediante servicios de síntesis de voz basados en Inteligencia Artificial.

La plataforma **no presupone un tipo determinado de organización, industria, cliente, estación, canal, número de usuarios o cantidad de recursos**.

Todo aquello que dependa de la instalación concreta debe ser configurable.

VOICE STUDIO debe poder utilizarse para diferentes escenarios de producción de audio sin modificar su arquitectura fundamental.

---

# 2. Principios Arquitectónicos

VOICE STUDIO se construye bajo los siguientes principios:

### 2.1 Configurable

La instalación determina:

- tenants
- proyectos
- usuarios
- roles
- perfiles de voz
- proveedores
- nodos
- capacidades
- formatos
- políticas
- almacenamiento
- límites
- configuraciones de audio
- políticas de generación
- políticas de streaming

No existen cantidades fijas codificadas en la arquitectura.

---

### 2.2 Provider-Agnostic

VOICE STUDIO no depende arquitectónicamente de un proveedor específico de Inteligencia Artificial.

El sistema debe utilizar una abstracción interna de proveedor.

Un proveedor concreto, como Google Gemini TTS, constituye únicamente una implementación.

```text
Voice Engine
      │
      ▼
Provider Interface
      │
      ├── Provider A
      ├── Provider B
      ├── Provider C
      └── Future Provider
```

La sustitución o incorporación de proveedores no debe requerir modificar el dominio principal.

---

### 2.3 Node-Aware

VOICE STUDIO debe contemplar desde su diseño la existencia de nodos.

Un nodo puede proporcionar capacidades como:

- generación
- procesamiento
- almacenamiento
- streaming
- conversión
- administración
- observabilidad

Las capacidades disponibles son configurables.

---

### 2.4 Separación de responsabilidades

La generación de voz, procesamiento de audio, almacenamiento y streaming son componentes diferentes.

No deben convertirse en una única responsabilidad denominada simplemente `Voice Engine`.

---

### 2.5 Auditabilidad

Las operaciones relevantes deben poder registrarse mediante un sistema de auditoría.

Ejemplos:

- creación de perfiles
- modificación de configuración
- autorización de voces
- generación de audio
- descarga
- eliminación
- cambios de proveedor
- cambios de permisos
- operaciones administrativas
- errores relevantes

---

# 3. Arquitectura General

```text
                         VOICE STUDIO
                              │
                              ▼
                     ┌─────────────────┐
                     │   API / HTTP    │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │    Security     │
                     │ Auth / Policies │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Voice Domain   │
                     └────────┬────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
        Voice Profiles   Generation Jobs   Configuration
              │               │                │
              └───────────────┼────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Voice Engine    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Provider Adapter  │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Provider A       Provider B       Provider C
                              │
                              ▼
                    ┌─────────────────┐
                    │  Audio Pipeline │
                    └────────┬────────┘
                             │
                  ┌──────────┼──────────┐
                  │          │          │
                  ▼          ▼          ▼
                 WAV        MP3      Other Format
                  │          │          │
                  └──────────┼──────────┘
                             ▼
                       ┌───────────┐
                       │  Storage  │
                       └─────┬─────┘
                             │
                       ┌─────▼─────┐
                       │ Streaming │
                       └───────────┘
```

---

# 4. Componentes Principales

## 4.1 API

La API constituye la frontera externa de VOICE STUDIO.

Debe proporcionar operaciones para:

- autenticación
- administración
- configuración
- tenants
- proyectos
- usuarios
- roles
- perfiles de voz
- proveedores
- generación
- jobs
- audio
- almacenamiento
- streaming
- auditoría
- health
- capabilities

La API no debe contener lógica de negocio compleja.

---

# 5. Voice Domain

El dominio central administra las entidades relacionadas con la generación de voz.

Entre ellas:

```text
Tenant
Project
User
Role
Permission
VoiceProfile
VoiceProvider
GenerationJob
AudioAsset
Node
Capability
AuditEvent
```

La existencia y relación entre estas entidades debe estar determinada por la configuración y las políticas del sistema.

---

# 6. Tenancy

VOICE STUDIO soporta aislamiento multi-tenant.

Un tenant representa un contexto lógico independiente.

Cada tenant puede contener una cantidad configurable de:

- proyectos
- usuarios
- perfiles
- voces
- trabajos
- recursos
- configuraciones

No se establece ninguna cantidad predeterminada como requisito arquitectónico.

---

# 7. Projects

Un proyecto representa un espacio lógico dentro de un tenant.

Un proyecto puede utilizar:

- uno o varios perfiles de voz
- uno o varios proveedores
- determinadas capacidades
- determinadas políticas
- determinados formatos
- determinados recursos de almacenamiento

La configuración determina qué recursos están disponibles.

---

# 8. Voice Profiles

Un `VoiceProfile` representa la configuración lógica de una voz.

Ejemplo conceptual:

```text
VoiceProfile
├── ID
├── Name
├── Provider
├── ProviderVoiceID
├── Language
├── Locale
├── AuthorizationPolicy
├── Capabilities
├── DefaultSettings
└── Status
```

La plataforma no debe asumir que una voz pertenece a una profesión, organización, medio de comunicación o persona determinada.

---

# 9. Voice Authorization

La autorización de una voz debe gestionarse mediante políticas.

No debe depender exclusivamente de un campo booleano como:

```text
is_authorized
```

El sistema puede contemplar:

- propietario lógico
- tenant
- proyecto
- usuario
- rol
- permisos
- alcance
- estado
- fecha de autorización
- expiración
- restricciones de uso

La implementación exacta debe quedar definida por las políticas configuradas.

---

# 10. Voice Engine

El Voice Engine coordina las operaciones de generación.

Su responsabilidad es:

1. recibir una solicitud válida
2. validar políticas
3. resolver el perfil de voz
4. resolver el proveedor
5. comprobar capacidades
6. crear o ejecutar el generation job
7. solicitar la síntesis
8. entregar el resultado al pipeline de audio
9. registrar el resultado
10. almacenar el artefacto cuando corresponda

El Voice Engine **no debe estar acoplado a un proveedor concreto**.

---

# 11. Provider Interface

Los proveedores de TTS deben implementar una interfaz interna.

Conceptualmente:

```text
VoiceProvider

Generate()
Stream()
Capabilities()
Health()
```

La interfaz puede evolucionar conforme se definan los contratos definitivos.

Un proveedor puede ofrecer:

- generación síncrona
- generación asíncrona
- streaming
- diferentes idiomas
- diferentes voces
- diferentes formatos
- diferentes parámetros

VOICE STUDIO debe consultar sus capacidades antes de solicitar una operación no soportada.

---

# 12. Proveedores de IA

Google Gemini TTS puede ser uno de los proveedores soportados.

Su integración debe permanecer dentro de un adapter específico:

```text
providers/
    gemini/
        client
        tts
        mapper
        capabilities
        health
```

El resto del sistema no debe depender directamente de:

```text
GEMINI_API_KEY
```

La credencial del proveedor pertenece a la configuración del adapter correspondiente.

---

# 13. Generation Jobs

Las generaciones deben modelarse como trabajos.

Ejemplo:

```text
GenerationJob
├── ID
├── TenantID
├── ProjectID
├── VoiceProfileID
├── Provider
├── Input
├── RequestedFormat
├── Status
├── CreatedAt
├── StartedAt
├── CompletedAt
├── Error
└── Result
```

Estados posibles:

```text
REQUESTED
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

Los estados definitivos forman parte del contrato del sistema.

---

# 14. Audio Pipeline

La síntesis y el formato final no deben considerarse la misma operación.

El pipeline puede realizar:

```text
TTS
 │
 ▼
Raw Audio
 │
 ▼
Normalization
 │
 ▼
Processing
 │
 ├── WAV
 ├── MP3
 ├── Other
 └── Stream
```

Las características técnicas del audio deben ser configurables cuando el proveedor y el pipeline lo permitan.

No se debe imponer globalmente una frecuencia de muestreo o profundidad de bits sin que exista una decisión contractual explícita.

---

# 15. Audio Formats

VOICE STUDIO puede soportar diferentes formatos.

Entre ellos:

- WAV
- MP3
- otros formatos configurados

La disponibilidad de cada formato depende de las capacidades instaladas.

El formato solicitado debe validarse contra las capacidades disponibles antes de iniciar la generación.

---

# 16. Streaming

El streaming constituye una capacidad independiente de la generación de archivos.

Puede utilizar mecanismos como:

- HTTP streaming
- chunked transfer
- SSE cuando sea apropiado para eventos
- protocolos específicos de audio cuando sean necesarios

El protocolo definitivo debe definirse según el tipo de contenido transportado.

SSE no debe utilizarse simplemente como sinónimo de "audio en tiempo real".

---

# 17. Storage

Los artefactos generados pueden almacenarse mediante un sistema de almacenamiento configurable.

El sistema debe abstraer el backend.

Conceptualmente:

```text
Storage
├── Save()
├── Read()
├── Delete()
├── Exists()
└── Metadata()
```

El backend puede ser local o remoto dependiendo de la instalación.

VOICE STUDIO no debe asumir un proveedor de almacenamiento específico.

---

# 18. Nodes

Un Node representa una instancia participante del sistema.

Ejemplo:

```text
Node
├── ID
├── Identity
├── Status
├── Capabilities
├── Version
├── Configuration
└── Health
```

Las capacidades pueden incluir:

```text
VOICE_GENERATION
AUDIO_PROCESSING
AUDIO_STORAGE
STREAMING
API
WORKER
```

La lista definitiva debe ser configurable/evolucionable.

---

# 19. Node Registry

El Node Registry mantiene información sobre los nodos conocidos.

Debe permitir:

- registrar
- identificar
- autenticar
- habilitar
- deshabilitar
- consultar capacidades
- comprobar salud
- registrar actividad

No se presupone una cantidad determinada de nodos.

---

# 20. Configuration

La configuración es una parte fundamental de VOICE STUDIO.

Debe permitir definir, entre otros:

```text
System
├── Tenants
├── Projects
├── Users
├── Roles
├── Permissions
├── Providers
├── Voice Profiles
├── Nodes
├── Capabilities
├── Storage
├── Audio
├── Streaming
├── Limits
├── Security
└── Policies
```

No deben existir cantidades fijas codificadas en el sistema.

Por ejemplo, la arquitectura no debe asumir:

```text
5 radios
10 televisiones
20 usuarios
3 proyectos
50 voces
```

Esos valores, si existen, pertenecen exclusivamente a la configuración de una instalación.

---

# 21. Security

VOICE STUDIO debe contemplar:

- autenticación
- autorización
- aislamiento tenant
- control de permisos
- validación de entradas
- protección de credenciales
- protección de endpoints
- rate limiting cuando corresponda
- auditoría
- gestión segura de secretos

Las credenciales de proveedores no deben almacenarse directamente en código fuente.

---

# 22. Audit

Las operaciones críticas deben generar eventos auditables.

Ejemplo:

```text
AuditEvent
├── ID
├── Timestamp
├── Actor
├── Tenant
├── Project
├── Action
├── Resource
├── ResourceID
├── Result
└── Metadata
```

La auditoría debe permitir reconstruir las operaciones relevantes realizadas sobre el sistema.

---

# 23. Health & Capabilities

VOICE STUDIO debe diferenciar:

### Health

Indica si un componente está operativo.

### Readiness

Indica si puede aceptar trabajo.

### Capabilities

Indica qué puede hacer.

Ejemplo:

```text
Health
    OK

Readiness
    READY

Capabilities
    TTS
    WAV
    MP3
    STREAM
```

Una capacidad no debe considerarse disponible únicamente porque el servicio esté vivo.

---

# 24. API Conceptual

La API puede organizarse conceptualmente como:

```text
/api/v1/

    /auth
    /tenants
    /projects
    /users
    /roles
    /permissions

    /voices
    /voice-profiles
    /providers

    /generations
    /jobs
    /audio
    /stream

    /nodes
    /capabilities

    /storage
    /audit

    /health
    /ready
```

Los endpoints definitivos deben establecerse mediante contratos independientes.

---

# 25. Ejemplo de generación

Solicitud conceptual:

```http
POST /api/v1/generations
Content-Type: application/json
```

```json
{
  "project_id": "project-id",
  "voice_profile_id": "voice-profile-id",
  "text": "Texto que será convertido en voz.",
  "format": "wav"
}
```

La respuesta puede devolver un `generation_id`:

```json
{
  "generation_id": "generation-id",
  "status": "queued"
}
```

La generación posterior se consulta mediante el recurso correspondiente.

---

# 26. Ejemplo de configuración

Una instalación puede definir:

```yaml
voice_studio:
  providers:
    - id: provider-a
      type: configured-provider

  projects:
    - id: project-a

  voice_profiles:
    - id: voice-a
      provider: provider-a

  nodes:
    - id: node-a
      capabilities:
        - voice_generation
        - audio_storage
```

Esta configuración es solamente ilustrativa.

No representa una cantidad mínima, máxima ni recomendada de recursos.

---

# 27. Variables de Entorno

Las variables de entorno deben utilizarse para valores sensibles o específicos del entorno.

Ejemplo:

```text
PORT
DATABASE_URL
STORAGE_PATH
PROVIDER_API_KEY
```

Los nombres definitivos de las variables pertenecen al contrato de configuración.

Las credenciales específicas de cada proveedor deben mantenerse aisladas de la lógica de negocio.

---

# 28. Ejecución

VOICE STUDIO debe poder ejecutarse como una aplicación Go independiente.

Ejemplo:

```bash
go run ./cmd/server
```

Para producción:

```bash
go build ./...
```

La configuración de producción debe proporcionarse mediante el mecanismo de configuración establecido por la instalación.

---

# 29. Estructura Conceptual del Proyecto

```text
voice-studio/
│
├── cmd/
│   └── server/
│
├── internal/
│   ├── domain/
│   │   ├── voice/
│   │   ├── generation/
│   │   ├── tenant/
│   │   ├── project/
│   │   ├── node/
│   │   ├── audio/
│   │   └── audit/
│   │
│   ├── application/
│   │   ├── voice/
│   │   ├── generation/
│   │   ├── audio/
│   │   ├── streaming/
│   │   └── configuration/
│   │
│   ├── infrastructure/
│   │   ├── providers/
│   │   │   └── gemini/
│   │   ├── storage/
│   │   ├── database/
│   │   ├── streaming/
│   │   └── nodes/
│   │
│   └── interfaces/
│       ├── http/
│       └── middleware/
│
├── configs/
├── migrations/
├── docs/
├── go.mod
└── README.md
```

Esta estructura es conceptual y puede evolucionar durante la definición de los contratos técnicos.

---

# 30. Restricciones Arquitectónicas

VOICE STUDIO **NO DEBE**:

- asumir un tipo específico de cliente
- asumir una industria específica
- asumir una cantidad fija de usuarios
- asumir una cantidad fija de proyectos
- asumir una cantidad fija de radios
- asumir una cantidad fija de televisiones
- asumir una cantidad fija de canales
- asumir una cantidad fija de nodos
- asumir una cantidad fija de voces
- asumir un proveedor único
- acoplar el dominio a Gemini
- almacenar credenciales en código
- mezclar generación con almacenamiento
- mezclar generación con streaming
- convertir SSE en requisito universal de audio
- fijar parámetros de audio sin contrato
- utilizar ejemplos comerciales como reglas arquitectónicas

---

# 31. Configurabilidad

Todo recurso dependiente de la instalación debe ser configurable.

La plataforma debe poder crecer de:

```text
0 → N
```

en todos los recursos donde el dominio lo permita.

El número concreto de:

- tenants
- proyectos
- usuarios
- perfiles
- voces
- proveedores
- nodos
- canales
- recursos
- trabajos

no forma parte del contrato arquitectónico salvo que una restricción técnica específica lo establezca.

---

# 32. Neutralidad del Sistema

VOICE STUDIO no debe incorporar nombres, organizaciones, profesiones, medios de comunicación o escenarios comerciales concretos como parte del núcleo arquitectónico.

Los ejemplos utilizados en documentación deben considerarse exclusivamente ejemplos.

La configuración de cada instalación determina su realidad operativa.

---

# 33. Objetivo Final

VOICE STUDIO debe proporcionar una plataforma:

- configurable
- extensible
- multi-tenant
- segura
- auditable
- independiente de proveedor
- preparada para múltiples nodos
- preparada para múltiples capacidades
- orientada a jobs
- preparada para procesamiento de audio
- preparada para streaming
- preparada para diferentes instalaciones

sin imponer al sistema una estructura comercial, operativa o de capacidad que no haya sido definida explícitamente mediante configuración o contrato.

---

# 34. Estado del Documento

**Documento:** VOICE STUDIO  
**Tipo:** Architectural Foundation  
**Tecnología:** Go  
**Arquitectura:** Clean / Modular / Provider-Agnostic  
**Configuración:** Required  
**Multi-Tenant:** Supported  
**Node-Aware:** Required  
**Provider-Agnostic:** Required  
**Audit:** Required  
**Fixed Capacity Assumptions:** Prohibited

---

## Principio fundamental

> **VOICE STUDIO define capacidades, contratos y mecanismos. La instalación define quién, qué, cuánto y cómo se utilizan.**