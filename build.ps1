# ==============================================================================
# 🎙️ SCRIPT DE COMPILACIÓN E INSTALADOR INNO SETUP - VOICE STUDIO BY KLIK
# ==============================================================================
# Este script automatiza el ciclo de build completo del frontend (Vite/React),
# del backend Express, extrae y compila el backend nativo de Go, y genera el
# instalador definitivo de Windows (.exe) a través de Inno Setup.
# ==============================================================================

$ErrorActionPreference = "Stop"
Clear-Host

# Definir de forma robusta la raíz del proyecto para evitar fallos si $PSScriptRoot está vacío
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($scriptRoot)) {
    $scriptRoot = $pwd.Path
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🏗️  BUILD MASTER & GENERADOR DE INSTALADOR DE PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "   CREADO POR: KLIK SOFT PRO" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. COMPILAR FRONTEND Y SERVIDOR EXPRESS (VITE / REACT / NODE)
# ------------------------------------------------------------------------------
Write-Host "[1/4] Compilando Frontend React y Servidor Node (Vite + Esbuild)..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    Write-Error "❌ No se encuentra el archivo package.json. Ejecuta este script desde la raíz del proyecto."
}

Write-Host "  📦 Restaurando dependencias de Node..." -ForegroundColor Gray
npm install --no-audit --no-fund

Write-Host "  ⚡ Ejecutando npm run build..." -ForegroundColor Gray
npm run build

if (Test-Path "dist") {
    Write-Host "  ✅ Frontend y Servidor empaquetados en /dist correctamente." -ForegroundColor Green
} else {
    Write-Error "❌ Error: No se pudo generar la carpeta /dist de producción."
}
Write-Host ""

# ------------------------------------------------------------------------------
# 2. EXTRACCIÓN Y COMPILACIÓN DEL BACKEND NATIVO DE GO (BLUEPRINT)
# ------------------------------------------------------------------------------
Write-Host "[2/4] Extrayendo y Compilando Backend Nativo Go de Producción..." -ForegroundColor Yellow

$goCodePath = Join-Path $scriptRoot "src/data/goCodeFiles.ts"
if (Test-Path $goCodePath) {
    Write-Host "  🔍 Detectado goCodeFiles.ts. Extrayendo archivos fuentes de Go a disco..." -ForegroundColor Gray
    $tsContent = Get-Content $goCodePath -Raw
    
    # Instanciar codificación UTF-8 sin BOM para evitar errores de caracteres ilegales en compilador Go
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    # Extraer pares de path y contenido embebido usando expresiones regulares
    $matches = [regex]::Matches($tsContent, 'path:\s*[''"]([^''"]+)[''"][\s\S]*?content:\s*`([\s\S]*?)`')
    $matches = [regex]::Matches($tsContent, 'path:\s*[''"]([^''"]+)[''"][\s\S]*?content:\s*`((?:[^`\\]|\\.)*)`')
    foreach ($match in $matches) {
        $path = $match.Groups[1].Value
        $content = $match.Groups[2].Value
        
        # Resolver ruta física
        $targetPath = Join-Path $scriptRoot $path
        $targetDir = Split-Path $targetPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        # Limpiar secuencias de escape del string de TypeScript
        $cleanContent = $content -replace '\\`', '`' -replace '\\\$', '$'
        $cleanContent = $content -replace '\\`', '`'
        
        # Escribir forzando codificación UTF-8 sin BOM
        [System.IO.File]::WriteAllText($targetPath, $cleanContent, $utf8NoBom)
    }
    Write-Host "  📂 Estructura del proyecto Go extraída con éxito." -ForegroundColor Green
    
    # Comprobar compilador de Go para crear ejecutable nativo de Windows
    $goVersion = go version 2>$null
    if ($goVersion) {
        Write-Host "  🔨 Compilando ejecutable nativo de Go (voicestudio.exe)..." -ForegroundColor Gray
        if (-not (Test-Path "bin")) { New-Item -ItemType Directory -Path "bin" -Force | Out-Null }
        
        # Compilación estática de producción optimizada libre de depuradores
        go build -ldflags="-w -s" -o bin/voicestudio.exe cmd/server/main.go
        Write-Host "  ✅ Binario Go compilado en /bin/voicestudio.exe con éxito." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Compilador de Go no detectado en PATH. Se omitirá la compilación del binario." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  No se encontró src/data/goCodeFiles.ts para la compilación de Go." -ForegroundColor Yellow
}
Write-Host ""

# ------------------------------------------------------------------------------
# 3. GENERAR SCRIPT DE INNO SETUP (.ISS) DINÁMICAMENTE
# ------------------------------------------------------------------------------
Write-Host "[3/4] Generando especificación del instalador (.iss) para Solusol.net..." -ForegroundColor Yellow

$filesGoSection = ""
$iconsGoSection = ""
if (Test-Path (Join-Path $scriptRoot "bin/voicestudio.exe")) {
    $filesGoSection = 'Source: "bin\voicestudio.exe"; DestDir: "{app}\bin"; Flags: ignoreversion'
    $iconsGoSection = 'Name: "{autoprograms}\Voice Studio Go Engine"; Filename: "{app}\bin\voicestudio.exe"; WorkingDir: "{app}\bin"; Comment: "Arrancar Voice Engine Autónomo en Go"'
}

$setupIconLine = ""
if (Test-Path (Join-Path $scriptRoot "dist/favicon.ico")) {
    $setupIconLine = "SetupIconFile=dist\favicon.ico"
$iconPath = Join-Path $scriptRoot "dist\favicon.ico"
if (Test-Path $iconPath -PathType Leaf) {
    $setupIconLine = "SetupIconFile=$iconPath"
}

$issPath = Join-Path $scriptRoot "voice_studio.iss"
$issContent = @"
; ==============================================================================
; 🎙️ INNO SETUP SCRIPT - VOICE STUDIO BY KLIK SOFT PRO
; ==============================================================================

[Setup]
AppId={{F0A3D211-125E-4B0D-B05F-0B90EA1A59DF}
AppName=Voice Studio by KLIK
AppVersion=3.3.0
AppPublisher=KLIK SOFT PRO
AppPublisherURL=https://solusol.net
AppSupportURL=https://solusol.net
AppUpdatesURL=https://solusol.net
DefaultDirName={autopf}\VoiceStudio_Solusol
DisableProgramGroupPage=yes
OutputDir=installer_output
OutputBaseFilename=VoiceStudio_Solusol_Setup
$setupIconLine
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Servidor Node empaquetado y activos del Frontend React
Source: "dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: ".env"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist
$filesGoSection

[Icons]
; Acceso directo principal a la Consola de Cabina
Name: "{autoprograms}\Voice Studio by KLIK"; Filename: "{app}\dist\server.cjs"; WorkingDir: "{app}"; Comment: "Arrancar consola Express de Voice Studio"
$iconsGoSection
Name: "{userdesktop}\Voice Studio by KLIK"; Filename: "{app}\dist\server.cjs"; WorkingDir: "{app}"; Tasks: desktopicon

[Registry]
; Registrar variables de entorno de producción para Solusol.net
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: string; ValueName: "SOLUSOL_TTS_URL"; ValueData: "https://api.solusol.net/v1/tts"; Flags: preservestringtype
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: string; ValueName: "SOLUSOL_LLM_URL"; ValueData: "https://api.solusol.net/v1/generate"; Flags: preservestringtype
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: string; ValueName: "SOLUSOL_NAS_1_PATH"; ValueData: "//solusol-nas-1/audio/voicestudio"; Flags: preservestringtype
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: string; ValueName: "SOLUSOL_NAS_2_PATH"; ValueData: "//solusol-nas-2/mirror/voicestudio"; Flags: preservestringtype

[Run]
; Levantar el servidor de forma inmediata tras completar la instalación
Filename: "node.exe"; Parameters: "{app}\dist\server.cjs"; Description: "Iniciar Consola Express de Voice Studio (Solusol Hub)"; Flags: nowait postinstall skipifsilent
"@

Set-Content -Path $issPath -Value $issContent -Encoding UTF8 -Force
Write-Host "  ✅ Archivo voice_studio.iss generado correctamente." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# 4. LOCALIZAR INNO SETUP Y COMPILAR INSTALADOR (.EXE)
# ------------------------------------------------------------------------------
Write-Host "[4/4] Buscando Inno Setup Compiler para compilar instalador Windows..." -ForegroundColor Yellow

$isccPaths = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 5\ISCC.exe",
    "C:\Program Files\Inno Setup 5\ISCC.exe",
    (Get-Command ISCC.exe -ErrorAction SilentlyContinue).Source
)

$isccPath = $isccPaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($isccPath) {
    Write-Host "  ⚙️  Inno Setup detectado en: $isccPath" -ForegroundColor Gray
    Write-Host "  🚀 Compilando instalador ejecutable de producción..." -ForegroundColor Gray
    
    # Asegurar que el directorio de salida del instalador exista
    $outputInstallerDir = Join-Path $scriptRoot "installer_output"
    if (-not (Test-Path $outputInstallerDir)) {
        New-Item -ItemType Directory -Path $outputInstallerDir -Force | Out-Null
    }
    
    # Crear un .env temporal de distribución si no existe para evitar fallos en la instalación
    $envFilePath = Join-Path $scriptRoot ".env"
    if (-not (Test-Path $envFilePath)) {
        Set-Content -Path $envFilePath -Value "PORT=3000`nNODE_ENV=production" -Encoding UTF8
    }
    
    # Invocar compilador ISCC
    & $isccPath $issPath | Out-Host
    
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "🎉 PROCESO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "   El instalador ejecutable se encuentra listo en:" -ForegroundColor Gray
    Write-Host "   -> $outputInstallerDir\VoiceStudio_Solusol_Setup.exe" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Yellow
    Write-Host "⚠️  INNO SETUP NO DETECTADO" -ForegroundColor Yellow
    Write-Host "   Todos los archivos del frontend y backend compilados con éxito." -ForegroundColor Gray
    Write-Host "   Se ha generado el archivo de configuración 'voice_studio.iss' en la raíz." -ForegroundColor Gray
    Write-Host "   Para compilar el instalador (.exe):" -ForegroundColor Gray
    Write-Host "   1. Descarga e instala Inno Setup 6 (https://jrsoftware.org/isdl.php)" -ForegroundColor Gray
    Write-Host "   2. Abre 'voice_studio.iss' y presiona F9 (Compile)." -ForegroundColor Gray
    Write-Host "======================================================================" -ForegroundColor Yellow
}
Write-Host ""

# Limpieza de artefactos temporales del root
if (Test-Path $issPath) { Remove-Item $issPath -Force }