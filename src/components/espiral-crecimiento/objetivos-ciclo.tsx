'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check } from 'lucide-react';
import { crearObjetivo, eliminarObjetivo, responderObjetivo, cerrarObjetivo, reabrirObjetivo } from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/objetivos/actions';
import { ETIQUETA_RESULTADO_OBJETIVO, type ResultadoObjetivo } from '@/lib/desempeno/objetivos';
import { cn } from '@/lib/utils';

export interface ObjetivoVista {
  id: string;
  titulo: string;
  descripcion: string | null;
  criterio_exito: string;
  fecha_meta: string | null;
  creado_por_nombre: string | null;
  aceptado_en: string | null;
  comentario_colaborador: string | null;
  resultado: string | null;
  cierre_comentario: string | null;
  cerrado_por_nombre: string | null;
}

const CLASE_RESULTADO: Record<ResultadoObjetivo, string> = { cumplido: 'badge-alto', parcial: 'badge-medio', no_cumplido: 'badge-bajo' };

export function ObjetivosCiclo({
  evaluacionId,
  objetivos,
  gestiona,
  esLaPersona,
}: {
  evaluacionId: string;
  objetivos: ObjetivoVista[];
  gestiona: boolean;
  esLaPersona: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [criterio, setCriterio] = useState('');
  const [fechaMeta, setFechaMeta] = useState('');
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  function correr(fn: () => Promise<{ ok: boolean; error?: string }>, alTerminar?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'No se pudo guardar');
      alTerminar?.();
      router.refresh();
    });
  }

  function guardarNuevo() {
    correr(() => crearObjetivo({ evaluacionId, titulo, descripcion, criterioExito: criterio, fechaMeta }), () => {
      setNuevo(false);
      setTitulo('');
      setDescripcion('');
      setCriterio('');
      setFechaMeta('');
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {objetivos.length === 0 && <p className="text-sm text-marmol-500">Aún no se han concertado objetivos para este ciclo.</p>}

      {objetivos.map((o) => {
        const res = o.resultado as ResultadoObjetivo | null;
        return (
          <div key={o.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-marmol-900">{o.titulo}</p>
                {o.descripcion && <p className="text-sm text-marmol-600 mt-0.5">{o.descripcion}</p>}
                <p className="text-xs text-marmol-500 mt-1">
                  <span className="font-medium">Se cumple cuando:</span> {o.criterio_exito}
                </p>
                <p className="text-xs text-marmol-400 mt-0.5">
                  {o.fecha_meta ? `Meta: ${o.fecha_meta} · ` : ''}
                  {o.creado_por_nombre ? `Propuesto por ${o.creado_por_nombre}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {res && <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', CLASE_RESULTADO[res])}>{ETIQUETA_RESULTADO_OBJETIVO[res]}</span>}
                {gestiona && (
                  <button type="button" aria-label="Eliminar objetivo" className="text-marmol-300 hover:text-bajo" onClick={() => window.confirm('¿Eliminar este objetivo?') && correr(() => eliminarObjetivo({ evaluacionId, id: o.id }))}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Concertación */}
            <p className={cn('text-xs', o.aceptado_en ? 'text-alto' : 'text-medio')}>
              {o.aceptado_en ? (
                <span className="inline-flex items-center gap-1"><Check size={12} /> Acordado: la persona lo aceptó</span>
              ) : (
                'Pendiente de aceptación de la persona'
              )}
            </p>
            {o.comentario_colaborador && <p className="text-xs text-marmol-600 bg-marmol-50 rounded-lg px-3 py-2"><span className="font-medium">Comentario de la persona:</span> {o.comentario_colaborador}</p>}

            {esLaPersona && !res && (
              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  placeholder="Comentario (obligatorio si quieres conversarlo antes de aceptar)…"
                  value={comentarios[o.id] ?? o.comentario_colaborador ?? ''}
                  onChange={(e) => setComentarios((c) => ({ ...c, [o.id]: e.target.value }))}
                  className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button type="button" disabled={pending} className="btn-primary text-xs" onClick={() => correr(() => responderObjetivo({ evaluacionId, id: o.id, acepta: true, comentario: comentarios[o.id] ?? o.comentario_colaborador ?? '' }))}>
                    Aceptar objetivo
                  </button>
                  <button type="button" disabled={pending} className="rounded-lg border border-marmol-200 px-3 py-1.5 text-xs text-marmol-600" onClick={() => correr(() => responderObjetivo({ evaluacionId, id: o.id, acepta: false, comentario: comentarios[o.id] ?? '' }))}>
                    Quiero conversarlo
                  </button>
                </div>
              </div>
            )}

            {/* Cierre */}
            {res && (o.cierre_comentario || o.cerrado_por_nombre) && (
              <p className="text-xs text-marmol-500">
                {o.cierre_comentario}
                {o.cerrado_por_nombre ? ` — registrado por ${o.cerrado_por_nombre}` : ''}
              </p>
            )}
            {gestiona && !res && o.aceptado_en && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-marmol-500">Al cierre del ciclo:</span>
                {(['cumplido', 'parcial', 'no_cumplido'] as ResultadoObjetivo[]).map((r) => (
                  <button key={r} type="button" disabled={pending} className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', 'border-marmol-200 text-marmol-600 hover:border-flow-300')} onClick={() => correr(() => cerrarObjetivo({ evaluacionId, id: o.id, resultado: r }))}>
                    {ETIQUETA_RESULTADO_OBJETIVO[r]}
                  </button>
                ))}
              </div>
            )}
            {gestiona && res && (
              <button type="button" className="text-xs text-marmol-400 hover:text-marmol-600" onClick={() => correr(() => reabrirObjetivo({ evaluacionId, id: o.id }))}>
                Reabrir para corregir
              </button>
            )}
          </div>
        );
      })}

      {gestiona && (
        <div>
          {!nuevo ? (
            <button type="button" onClick={() => setNuevo(true)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600">
              <Plus size={12} /> Proponer objetivo
            </button>
          ) : (
            <div className="card p-4 space-y-2">
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Objetivo (qué se espera lograr)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Detalle (opcional)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              <textarea value={criterio} onChange={(e) => setCriterio(e.target.value)} rows={2} placeholder="Criterio de éxito: ¿cómo sabremos que se cumplió? (medible u observable)" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              <label className="block text-xs text-marmol-500">
                Fecha meta (opcional)
                <input type="date" value={fechaMeta} onChange={(e) => setFechaMeta(e.target.value)} className="mt-0.5 block rounded-lg border border-marmol-200 px-2 py-1.5 text-sm" />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={guardarNuevo} disabled={pending} className="btn-primary text-xs">{pending ? 'Guardando…' : 'Proponer'}</button>
                <button type="button" onClick={() => setNuevo(false)} className="text-xs text-marmol-500">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
