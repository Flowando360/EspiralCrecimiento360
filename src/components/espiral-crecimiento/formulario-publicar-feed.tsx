'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { publicarEnFeed } from '@/app/(dashboard)/nexa/feed/actions';
import { createClient } from '@/lib/supabase/client';
import { formatearTamanoArchivo } from '@/lib/utils';
import { Plus, Paperclip, Link2, Film, X } from 'lucide-react';

const TIPOS = [
  { valor: 'anuncio', etiqueta: 'Anuncio' },
  { valor: 'politica_sst', etiqueta: 'Política SST' },
  { valor: 'logro', etiqueta: 'Logro' },
  { valor: 'general', etiqueta: 'General' },
] as const;

const TIPOS_ADJUNTO = [
  { valor: 'ninguno', etiqueta: 'Sin adjunto' },
  { valor: 'documento', etiqueta: 'Documento' },
  { valor: 'link', etiqueta: 'Link externo' },
  { valor: 'video_imagen', etiqueta: 'Video o imagen' },
] as const;

const MAX_DOCUMENTO_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_IMAGEN_BYTES = 100 * 1024 * 1024;

type TipoAdjunto = (typeof TIPOS_ADJUNTO)[number]['valor'];

export function FormularioPublicarFeed({ esAdminTh, empresaId }: { esAdminTh: boolean; empresaId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrar, setMostrar] = useState(false);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['valor']>('anuncio');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fijado, setFijado] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipoAdjunto, setTipoAdjunto] = useState<TipoAdjunto>('ninguno');

  // Documento / video o imagen: se sube directo desde el navegador a Storage
  // (así no hay límite de tamaño de las Server Actions de Next.js).
  const [subiendo, setSubiendo] = useState(false);
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [archivoTamanoBytes, setArchivoTamanoBytes] = useState<number | null>(null);

  // Link externo: vista previa Open Graph obtenida antes de publicar.
  const [linkUrl, setLinkUrl] = useState('');
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [linkPreview, setLinkPreview] = useState<{
    titulo: string | null;
    imagen: string | null;
    descripcion: string | null;
  } | null>(null);

  function resetAdjuntos() {
    setArchivoUrl(null);
    setArchivoNombre(null);
    setArchivoTamanoBytes(null);
    setLinkUrl('');
    setLinkPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function cambiarTipoAdjunto(t: TipoAdjunto) {
    setTipoAdjunto(t);
    setError(null);
    resetAdjuntos();
  }

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const maxBytes = tipoAdjunto === 'documento' ? MAX_DOCUMENTO_BYTES : MAX_VIDEO_IMAGEN_BYTES;
    if (archivo.size > maxBytes) {
      setError(`El archivo supera el máximo permitido (${formatearTamanoArchivo(maxBytes)})`);
      return;
    }

    setError(null);
    setSubiendo(true);
    const ruta = `${empresaId}/publicacion-${Date.now()}-${Math.random().toString(36).slice(2)}/${archivo.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from('feed-adjuntos').upload(ruta, archivo);
    setSubiendo(false);

    if (uploadError) {
      setError(`Error subiendo el archivo: ${uploadError.message}`);
      return;
    }
    setArchivoUrl(ruta);
    setArchivoNombre(archivo.name);
    setArchivoTamanoBytes(archivo.size);
  }

  async function buscarVistaPreviaLink() {
    if (!linkUrl.trim()) return;
    setCargandoPreview(true);
    setError(null);
    try {
      const res = await fetch(`/api/feed/link-preview?url=${encodeURIComponent(linkUrl.trim())}`);
      const data = await res.json();
      setLinkPreview(data);
    } catch {
      setLinkPreview(null);
    } finally {
      setCargandoPreview(false);
    }
  }

  function publicar() {
    setError(null);
    startTransition(async () => {
      const res = await publicarEnFeed({
        tipo,
        titulo,
        contenido: contenido || undefined,
        fijado,
        tipoAdjunto,
        archivoUrl: archivoUrl ?? undefined,
        archivoNombre: archivoNombre ?? undefined,
        archivoTamanoBytes: archivoTamanoBytes ?? undefined,
        linkUrl: tipoAdjunto === 'link' ? linkUrl.trim() || undefined : undefined,
        linkPreviewTitulo: linkPreview?.titulo ?? undefined,
        linkPreviewImagen: linkPreview?.imagen ?? undefined,
        linkPreviewDescripcion: linkPreview?.descripcion ?? undefined,
      });
      if (res.ok) {
        setTitulo('');
        setContenido('');
        setFijado(false);
        setTipoAdjunto('ninguno');
        resetAdjuntos();
        setMostrar(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const listoParaPublicar =
    !!titulo &&
    (tipoAdjunto === 'ninguno' ||
      (tipoAdjunto === 'link' && !!linkUrl.trim()) ||
      ((tipoAdjunto === 'documento' || tipoAdjunto === 'video_imagen') && !!archivoUrl));

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Publicar
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as typeof tipo)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      >
        {TIPOS.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.etiqueta}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <textarea
        placeholder="Contenido (opcional)…"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {esAdminTh && (
        <label className="flex items-center gap-2 text-xs text-marmol-600">
          <input type="checkbox" checked={fijado} onChange={(e) => setFijado(e.target.checked)} />
          Fijar arriba del feed
        </label>
      )}

      <div className="border-t border-marmol-100 pt-3 space-y-2">
        <div className="flex gap-1.5">
          {TIPOS_ADJUNTO.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => cambiarTipoAdjunto(t.valor)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                tipoAdjunto === t.valor
                  ? 'bg-flow-500 text-white'
                  : 'bg-marmol-100 text-marmol-500 hover:bg-marmol-200'
              }`}
            >
              {t.valor === 'documento' && <Paperclip size={12} />}
              {t.valor === 'link' && <Link2 size={12} />}
              {t.valor === 'video_imagen' && <Film size={12} />}
              {t.etiqueta}
            </button>
          ))}
        </div>

        {(tipoAdjunto === 'documento' || tipoAdjunto === 'video_imagen') && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={tipoAdjunto === 'documento' ? '.pdf,.doc,.docx,image/*' : 'video/*,image/*'}
              onChange={subirArchivo}
              disabled={subiendo}
              className="w-full text-xs text-marmol-500"
            />
            {subiendo && <p className="text-xs text-marmol-400 mt-1">Subiendo…</p>}
            {archivoNombre && archivoTamanoBytes !== null && (
              <div className="flex items-center justify-between text-xs text-marmol-600 bg-marmol-50 rounded-lg px-2.5 py-1.5 mt-1">
                <span className="truncate">
                  {archivoNombre} · {formatearTamanoArchivo(archivoTamanoBytes)}
                </span>
                <button type="button" onClick={resetAdjuntos} className="text-marmol-400 hover:text-bajo shrink-0 ml-2">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {tipoAdjunto === 'link' && (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://…"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkPreview(null);
                }}
                className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={buscarVistaPreviaLink}
                disabled={!linkUrl.trim() || cargandoPreview}
                className="rounded-lg border border-marmol-200 text-marmol-600 text-xs font-medium px-3 disabled:opacity-40"
              >
                {cargandoPreview ? '…' : 'Vista previa'}
              </button>
            </div>
            {linkPreview && (linkPreview.titulo || linkPreview.imagen || linkPreview.descripcion) && (
              <div className="flex gap-2 border border-marmol-200 rounded-lg overflow-hidden">
                {linkPreview.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={linkPreview.imagen} alt="" className="w-16 h-16 object-cover shrink-0" />
                )}
                <div className="py-1.5 pr-2 min-w-0">
                  {linkPreview.titulo && <p className="text-xs font-medium text-marmol-800 truncate">{linkPreview.titulo}</p>}
                  {linkPreview.descripcion && (
                    <p className="text-xs text-marmol-500 line-clamp-2">{linkPreview.descripcion}</p>
                  )}
                </div>
              </div>
            )}
            {linkPreview && !linkPreview.titulo && !linkPreview.imagen && !linkPreview.descripcion && (
              <p className="text-xs text-marmol-400">No se encontró vista previa; se publicará solo el link.</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !listoParaPublicar || subiendo}
          onClick={publicar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Publicando…' : 'Publicar'}
        </button>
        <button
          type="button"
          onClick={() => setMostrar(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
