'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileVideo, Link2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { guardarContenidoCurso } from '@/app/(dashboard)/nexa/formacion/actions';

const MAX_BYTES = 50 * 1024 * 1024;

/** Contenido de un curso: enlace externo (video, presentación, documento) y/o un archivo propio. Solo admin_th. */
export function EditorContenidoCurso({
  empresaId,
  cursoId,
  enlaceInicial,
  archivoNombreInicial,
}: {
  empresaId: string;
  cursoId: string;
  enlaceInicial: string | null;
  archivoNombreInicial: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlace, setEnlace] = useState(enlaceInicial ?? '');
  const [archivoNombre, setArchivoNombre] = useState(archivoNombreInicial);
  const inputRef = useRef<HTMLInputElement>(null);

  function guardarEnlace() {
    setError(null);
    start(async () => {
      const res = await guardarContenidoCurso({ cursoId, enlace: enlace.trim() || null });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > MAX_BYTES) {
      setError('El archivo supera el máximo de 50 MB. Para videos más pesados usa un enlace (YouTube, Vimeo o Drive).');
      return;
    }
    setError(null);
    setSubiendo(true);
    const limpio = archivo.name.replace(/[^\w.\-]+/g, '_');
    const ruta = `${empresaId}/${cursoId}/${Date.now()}-${limpio}`;
    const supabase = createClient();
    const { error: errSubida } = await supabase.storage.from('cursos-contenido').upload(ruta, archivo, { contentType: archivo.type || undefined });
    if (errSubida) {
      setSubiendo(false);
      setError(`Error subiendo el archivo: ${errSubida.message}`);
      return;
    }
    const res = await guardarContenidoCurso({ cursoId, archivoPath: ruta, archivoNombre: archivo.name });
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = '';
    if (res.ok) {
      setArchivoNombre(archivo.name);
      router.refresh();
    } else setError(res.error);
  }

  function quitarArchivo() {
    setError(null);
    start(async () => {
      const res = await guardarContenidoCurso({ cursoId, archivoPath: null });
      if (res.ok) {
        setArchivoNombre(null);
        router.refresh();
      } else setError(res.error);
    });
  }

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  return (
    <div className="card p-4 space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-marmol-800">Contenido del curso</h2>
      <p className="text-xs text-marmol-500">
        Lo que la persona ve y estudia antes del quiz. Puedes poner un enlace (YouTube, Vimeo, Google Slides o Docs, PDF en la nube) y/o subir un archivo propio
        (video, presentación o documento, hasta 50 MB).
      </p>

      <label className="block text-xs text-marmol-500">
        <span className="inline-flex items-center gap-1"><Link2 size={12} /> Enlace</span>
        <div className="flex gap-2 mt-1">
          <input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" className={campo + ' flex-1'} />
          <button type="button" disabled={pending} onClick={guardarEnlace} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
            Guardar
          </button>
        </div>
      </label>

      <div className="text-xs text-marmol-500">
        <span className="inline-flex items-center gap-1"><FileVideo size={12} /> Archivo propio</span>
        {archivoNombre ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-marmol-800">
            {archivoNombre}
            <button type="button" disabled={pending} onClick={quitarArchivo} className="text-marmol-300 hover:text-bajo" aria-label="Quitar archivo">
              <Trash2 size={14} />
            </button>
          </p>
        ) : null}
        <input ref={inputRef} type="file" accept="video/*,application/pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={subir} disabled={subiendo} className="mt-1 block text-sm" />
        {subiendo && <p className="mt-1 text-flow-700">Subiendo… no cierres la página.</p>}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
