'use client';

import { useState } from 'react';
import { PlayCircle } from 'lucide-react';

type Tipo = 'youtube' | 'vimeo' | 'video' | 'pdf' | 'otro';

function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

function idVimeo(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

export function tipoDeContenido(url: string, nombre?: string | null): Tipo {
  if (idYoutube(url)) return 'youtube';
  if (idVimeo(url)) return 'vimeo';
  const base = (nombre ?? url).split('?')[0]!.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/.test(base)) return 'video';
  if (/\.pdf$/.test(base)) return 'pdf';
  return 'otro';
}

/**
 * Muestra el contenido de un curso: video de YouTube o Vimeo incrustado, video o PDF propios dentro de la página, y para
 * cualquier otro formato (presentaciones, documentos de Office, Google Slides…) un botón que lo abre en otra pestaña.
 */
export function VisorContenidoCurso({
  enlace,
  archivoUrl,
  archivoNombre,
}: {
  enlace: string | null;
  archivoUrl: string | null;
  archivoNombre: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  if (!enlace && !archivoUrl) return null;

  const fuentes: { url: string; nombre: string | null; propio: boolean }[] = [];
  if (archivoUrl) fuentes.push({ url: archivoUrl, nombre: archivoNombre, propio: true });
  if (enlace) fuentes.push({ url: enlace, nombre: null, propio: false });

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline">
        <PlayCircle size={14} /> {abierto ? 'Ocultar contenido' : 'Ver contenido del curso'}
      </button>
      {abierto && (
        <div className="mt-2 space-y-3">
          {fuentes.map((f) => {
            const tipo = tipoDeContenido(f.propio ? (f.nombre ?? f.url) : f.url, f.nombre);
            const yt = tipo === 'youtube' ? idYoutube(f.url) : null;
            const vm = tipo === 'vimeo' ? idVimeo(f.url) : null;
            return (
              <div key={f.url} className="space-y-1">
                {yt && (
                  <iframe
                    src={`https://www.youtube.com/embed/${yt}`}
                    title="Video del curso"
                    className="w-full aspect-video rounded-lg border border-marmol-200"
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {vm && (
                  <iframe src={`https://player.vimeo.com/video/${vm}`} title="Video del curso" className="w-full aspect-video rounded-lg border border-marmol-200" allowFullScreen />
                )}
                {tipo === 'video' && <video src={f.url} controls className="w-full rounded-lg border border-marmol-200" />}
                {tipo === 'pdf' && <iframe src={f.url} title={f.nombre ?? 'Documento del curso'} className="w-full h-96 rounded-lg border border-marmol-200" />}
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-flow-600 hover:underline">
                  {f.propio ? `Abrir ${f.nombre ?? 'el archivo'} en otra pestaña` : 'Abrir el enlace en otra pestaña'}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
