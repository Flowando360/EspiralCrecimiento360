'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { crearAnalisisContexto, eliminarAnalisisContexto } from '@/app/(dashboard)/procesos-gestion/contexto/actions';
import { Plus, Trash2, ChevronRight, Compass } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';

interface Analisis {
  id: string;
  fecha: string;
  notas: string | null;
  responsable_id: string | null;
  conteo: { debilidad: number; oportunidad: number; fortaleza: number; amenaza: number };
}

interface Colaborador {
  id: string;
  nombre_completo: string;
}

export function ListaAnalisisContexto({
  analisisIniciales,
  colaboradores,
  puedeEditar,
}: {
  analisisIniciales: Analisis[];
  colaboradores: Colaborador[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [analisis, setAnalisis] = useState(analisisIniciales);
  const [responsableId, setResponsableId] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nombreResponsable = (id: string | null) => colaboradores.find((c) => c.id === id)?.nombre_completo ?? null;

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearAnalisisContexto({ responsableId: responsableId || undefined, notas: notas || undefined });
      if (res.ok) {
        router.push(`/procesos-gestion/contexto/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este análisis y todos sus ítems? Esta acción no se puede deshacer.')) return;
    startTransition(async () => {
      const res = await eliminarAnalisisContexto(id);
      if (res.ok) setAnalisis((prev) => prev.filter((a) => a.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div className="card p-4 space-y-3">
          <h2 className="font-display font-semibold text-secundario">Nuevo análisis de contexto</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex flex-col gap-1 text-xs text-marmol-500">
              Responsable
              <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
                <option value="">Sin asignar</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-marmol-500 flex-1 min-w-[220px]">
              Notas (opcional)
              <input value={notas} onChange={(e) => setNotas(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" placeholder="Ej. Análisis anual 2026" />
            </label>
            <button
              onClick={crear}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-2 transition"
            >
              <Plus size={15} /> Crear
            </button>
          </div>
          {error && <p className="text-xs text-bajo">{error}</p>}
        </div>
      )}

      {analisis.length === 0 ? (
        <div className="card p-8 text-center text-sm text-marmol-400">
          <Compass size={28} className="mx-auto mb-2 text-marmol-300" />
          Todavía no hay ningún análisis de contexto registrado.
        </div>
      ) : (
        <div className="space-y-2">
          {analisis.map((a) => (
            <div key={a.id} className="card p-4 flex items-center justify-between gap-3 hover:border-flow-300 transition-colors">
              <Link href={`/procesos-gestion/contexto/${a.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-marmol-800">
                  Análisis del {formatearFecha(a.fecha)}
                  {nombreResponsable(a.responsable_id) && <span className="text-marmol-400 font-normal"> · {nombreResponsable(a.responsable_id)}</span>}
                </p>
                {a.notas && <p className="text-xs text-marmol-500 mt-0.5">{a.notas}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-bajo">{a.conteo.debilidad} debilidades</span>
                  <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-alto">{a.conteo.oportunidad} oportunidades</span>
                  <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-alto">{a.conteo.fortaleza} fortalezas</span>
                  <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-bajo">{a.conteo.amenaza} amenazas</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                {puedeEditar && (
                  <button onClick={() => eliminar(a.id)} className="text-marmol-300 hover:text-bajo">
                    <Trash2 size={14} />
                  </button>
                )}
                <Link href={`/procesos-gestion/contexto/${a.id}`} className="text-marmol-300 hover:text-flow-600">
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
