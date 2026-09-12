'use client';

import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { actualizarCurso } from '@/app/(dashboard)/nexa/formacion/actions';

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

export function EditarCurso({
  cursoId,
  datosIniciales,
}: {
  cursoId: string;
  datosIniciales: { titulo: string; descripcion: string; categoria: string; duracionMinutos: string; puntosOtorgados: string };
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(datosIniciales.titulo);
  const [descripcion, setDescripcion] = useState(datosIniciales.descripcion);
  const [categoria, setCategoria] = useState(datosIniciales.categoria);
  const [duracionMinutos, setDuracionMinutos] = useState(datosIniciales.duracionMinutos);
  const [puntosOtorgados, setPuntosOtorgados] = useState(datosIniciales.puntosOtorgados);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarCurso({
        cursoId,
        titulo,
        descripcion,
        categoria: categoria as any,
        duracionMinutos: duracionMinutos.trim() ? Number(duracionMinutos) : undefined,
        puntosOtorgados: Number(puntosOtorgados) || 0,
      });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setTitulo(datosIniciales.titulo);
    setDescripcion(datosIniciales.descripcion);
    setCategoria(datosIniciales.categoria);
    setDuracionMinutos(datosIniciales.duracionMinutos);
    setPuntosOtorgados(datosIniciales.puntosOtorgados);
    setError(null);
    setEditando(false);
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  if (!editando) {
    return (
      <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600">
        <Pencil size={12} /> Editar curso
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-2 max-w-lg">
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className={campo} />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" rows={2} className={campo} />
      <div className="grid grid-cols-3 gap-2">
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        <input type="number" min={0} value={duracionMinutos} onChange={(e) => setDuracionMinutos(e.target.value)} placeholder="Duración (min)" className={campo} />
        <input type="number" min={0} value={puntosOtorgados} onChange={(e) => setPuntosOtorgados(e.target.value)} placeholder="Puntos" className={campo} />
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !titulo.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}
