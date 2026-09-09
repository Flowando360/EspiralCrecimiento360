'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearCurso } from '@/app/(dashboard)/nexa/formacion/actions';
import { Plus } from 'lucide-react';

const CATEGORIAS = [
  { valor: 'induccion_sst', etiqueta: 'Inducción SST' },
  { valor: 'alturas', etiqueta: 'Alturas' },
  { valor: 'manejo_cargas', etiqueta: 'Manejo de cargas' },
  { valor: 'epp', etiqueta: 'EPP' },
  { valor: 'protocolos_emergencia', etiqueta: 'Protocolos de emergencia' },
  { valor: 'cultura', etiqueta: 'Cultura' },
  { valor: 'tecnico', etiqueta: 'Técnico' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;

export function FormularioCrearCurso() {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]['valor']>('induccion_sst');
  const [duracion, setDuracion] = useState('');
  const [puntos, setPuntos] = useState('10');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearCurso({
        titulo,
        descripcion: descripcion || undefined,
        categoria,
        duracionMinutos: duracion ? Number(duracion) : undefined,
        puntosOtorgados: Number(puntos) || 0,
      });
      if (res.ok) {
        setTitulo('');
        setDescripcion('');
        setDuracion('');
        setPuntos('10');
        setMostrar(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Nuevo curso
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 max-w-md">
      <input
        type="text"
        placeholder="Título del curso"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <textarea
        placeholder="Descripción (opcional)…"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as typeof categoria)}
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Duración (min)"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
      </div>
      <input
        type="number"
        min={0}
        placeholder="Puntos otorgados"
        value={puntos}
        onChange={(e) => setPuntos(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !titulo}
          onClick={crear}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Creando…' : 'Crear curso'}
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
