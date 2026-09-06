import React, { useState } from 'react';
import { GO_CODE_FILES } from '../data/goCodeFiles';
import { downloadGoProjectZip } from '../utils/zipExport';
import {
  FileCode2,
  FolderTree,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';

export const GoCodeViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile = GO_CODE_FILES[selectedFileIndex] || GO_CODE_FILES[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying code:', err);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadGoProjectZip();
    } catch (err) {
      console.error('Error downloading zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Go highlights & Download button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm">
              GO
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Código Fuente de VOICE STUDIO en Go (Golang)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Go 1.22+
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Arquitectura de agencia de voces clonadas y nuevas para plataforma de radio con Voice Engine, escáner de guión, empaquetado WAV/MP3 y streaming SSE en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Sin GitHub / 100% Autónomo
          </span>
          <button
            type="button"
            id="download-go-zip-btn"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-700/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Generando ZIP...' : 'Descargar Proyecto Go (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Code Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Tree Explorer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>Estructura de Archivos Go</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {GO_CODE_FILES.length} archivos
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {GO_CODE_FILES.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                    selectedFileIndex === idx
                      ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className={`w-4 h-4 flex-shrink-0 ${selectedFileIndex === idx ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] uppercase text-slate-500 px-1.5 py-0.5 rounded bg-slate-950">
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Start Run Command */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Ejecución Inmediata en Go</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
              <div className="text-slate-500"># Descomprimir el paquete local (.zip) y ejecutar (Sin GitHub):</div>
              <div>go mod tidy</div>
              <div>export GEMINI_API_KEY="..."</div>
              <div>go run cmd/server/main.go</div>
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Active file metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-sm text-cyan-300">
                    {currentFile.path}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {currentFile.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentFile.description}</p>
              </div>

              <button
                type="button"
                id="copy-go-code-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            {/* Code Body with line numbering */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                <code>
                  {currentFile.content.split('\n').map((line, i) => (
                    <div key={i} className="table-row">
                      <span className="table-cell pr-4 text-slate-600 select-none text-right font-mono text-[11px] w-8">
                        {i + 1}
                      </span>
                      <span className="table-cell whitespace-pre">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
