'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { subirDocumentoPolitica } from '@/app/(dashboard)/nexa/asistente/documentos/actions';

const CATEGORIAS = [
  { valor: 'sst', etiqueta: 'SST' },
  { valor: 'politicas', etiqueta: 'Políticas' },
  { valor: 'procedimientos', etiqueta: 'Procedimientos' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;

export function FormularioDocumentoPolitica() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]['valor']>('sst');
  const [contenidoManual, setContenidoManual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await subirDocumentoPolitica(formData);
      if (res.ok) {
        setTitulo('');
        setContenidoManual('');
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form ref={formRef} action={enviar} className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario">Cargar documento</h2>

      <input
        name="titulo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título (ej. Reglamento de Higiene y Seguridad Industrial)"
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <select
        name="categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value as typeof categoria)}
        className="w-full sm:w-56 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      >
        {CATEGORIAS.map((c) => (
          <option key={c.valor} value={c.valor}>
            {c.etiqueta}
          </option>
        ))}
      </select>

      <div>
        <label className="text-xs text-marmol-500 mb-1 block">Sube el PDF (se extrae el texto automáticamente)</label>
        <input type="file" name="archivo" accept="application/pdf" className="text-xs text-marmol-500" />
      </div>

      <div>
        <label className="text-xs text-marmol-500 mb-1 block">
          O pega el texto directamente (si no tienes el PDF a mano, o si prefieres solo un fragmento)
        </label>
        <textarea
          name="contenidoManual"
          value={contenidoManual}
          onChange={(e) => setContenidoManual(e.target.value)}
          rows={4}
          placeholder="Pega aquí el texto de la política…"
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}

      <button
        type="submit"
        disabled={pending || !titulo.trim()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-2"
      >
        <Upload size={15} /> {pending ? 'Cargando…' : 'Cargar documento'}
      </button>
    </form>
  );
}
