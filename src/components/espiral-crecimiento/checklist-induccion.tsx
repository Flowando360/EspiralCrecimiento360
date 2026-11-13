'use client';

import { useState, useTransition } from 'react';
import { asignarInduccionDelCargo, confirmarItemInduccion, marcarItemInduccion } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/induccion/actions';
import { formatearFecha } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Categoria = 'proposito_organizacional' | 'funciones' | 'riesgos_sst' | 'epp' | 'examenes_medicos' | 'formacion' | 'otro';

const CATEGORIA_LABEL: Record<Categoria, string> = {
  examenes_medicos: 'Exámenes médicos (preingreso)',
  proposito_organizacional: 'Propósito organizacional',
  funciones: 'Funciones',
  riesgos_sst: 'Riesgos SST',
  epp: 'EPP',
  formacion: 'Formación',
  otro: 'Otro',
};

/** Los confirma la propia persona; Talento Humano o el líder los aprueban. */
const AUTODILIGENCIADAS: Categoria[] = ['proposito_organizacional', 'funciones', 'riesgos_sst'];

export interface ItemAsignado {
  id: string;
  completado: boolean;
  completado_en: string | null;
  completado_por_nombre: string | null;
  confirmado_colaborador_en?: string | null;
  pregunta?: string | null;
  opciones?: string[] | null;
  curso_titulo?: string | null;
  categoria: Categoria;
  titulo: string;
  descripcion: string | null;
}

export function ChecklistInduccion({
  colaboradorId,
  itemsIniciales,
  puedeEditar,
  esPropia = false,
  puedeAsignar = false,
}: {
  colaboradorId: string;
  itemsIniciales: ItemAsignado[];
  puedeEditar: boolean;
  esPropia?: boolean;
  /** Solo Talento Humano: asignar los puntos de inducción del cargo a quien no los tiene. */
  puedeAsignar?: boolean;
}) {
  const router = useRouter();
  const [asignando, setAsignando] = useState(false);
  const [avisoAsignar, setAvisoAsignar] = useState<string | null>(null);
  const [items, setItems] = useState(itemsIniciales);
  const [, startTransition] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [elegidas, setElegidas] = useState<Record<string, number>>({});

  function asignar() {
    setAvisoAsignar(null);
    setAsignando(true);
    startTransition(async () => {
      const res = await asignarInduccionDelCargo(colaboradorId);
      setAsignando(false);
      if (!res.ok) return setAvisoAsignar(res.error);
      setAvisoAsignar(res.nuevos > 0 ? `Se asignaron ${res.nuevos} puntos de inducción.` : 'No hay puntos nuevos por asignar: la persona ya tiene los de su cargo y los comunes.');
      router.refresh();
    });
  }

  function toggle(item: ItemAsignado) {
    const nuevoEstado = !item.completado;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completado: nuevoEstado } : i)));
    startTransition(async () => {
      await marcarItemInduccion(colaboradorId, item.id, nuevoEstado);
    });
  }

  function confirmar(item: ItemAsignado) {
    setErrores((e) => ({ ...e, [item.id]: '' }));
    startTransition(async () => {
      const res = await confirmarItemInduccion(colaboradorId, item.id, elegidas[item.id]);
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, confirmado_colaborador_en: new Date().toISOString() } : i)));
      } else {
        setErrores((e) => ({ ...e, [item.id]: res.error }));
      }
    });
  }

  const total = items.length;
  const completados = items.filter((i) => i.completado).length;
  const pct = total > 0 ? Math.round((completados / total) * 100) : 0;

  const grupos = (Object.keys(CATEGORIA_LABEL) as Categoria[])
    .map((cat) => ({ cat, items: items.filter((i) => i.categoria === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-marmol-700">Avance de inducción</p>
          <p className="text-sm font-semibold text-secundario">{pct}%</p>
        </div>
        <div className="h-2 rounded-full bg-marmol-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-flow-500 to-acento rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-marmol-400 mt-1.5">
          {completados} de {total} puntos cumplidos
        </p>
      </div>

      {total === 0 ? (
        <div className="card p-4 space-y-2">
          <p className="text-sm text-marmol-400">Sin plan de inducción asignado todavía.</p>
          {puedeAsignar && (
            <button type="button" onClick={asignar} disabled={asignando} className="btn-primary text-xs">
              {asignando ? 'Asignando…' : 'Asignar la inducción de su cargo'}
            </button>
          )}
          {avisoAsignar && <p className="text-xs text-marmol-500">{avisoAsignar}</p>}
        </div>
      ) : (
        grupos.map(({ cat, items: itemsGrupo }) => (
          <div key={cat} className="card p-4">
            <p className="text-xs font-medium text-marmol-500 mb-1">{CATEGORIA_LABEL[cat]}</p>
            {cat === 'examenes_medicos' && (
              <p className="text-xs text-marmol-400 mb-2">
                Los exámenes de preingreso se hacen antes de la vinculación formal; aquí queda la constancia. Los periódicos y de egreso se siguen en la ficha.
              </p>
            )}
            {AUTODILIGENCIADAS.includes(cat) && (
              <p className="text-xs text-marmol-400 mb-2">Los confirma la propia persona; Talento Humano o el líder los aprueban.</p>
            )}
            <div className="space-y-2">
              {itemsGrupo.map((item) => {
                const auto = AUTODILIGENCIADAS.includes(item.categoria);
                const confirmado = !!item.confirmado_colaborador_en;
                return (
                  <div key={item.id} className="flex items-start gap-2.5 border-b border-marmol-100 pb-2 last:border-0">
                    <button
                      type="button"
                      disabled={!puedeEditar}
                      onClick={() => toggle(item)}
                      title={auto ? 'Aprobar (Talento Humano o líder)' : 'Marcar como cumplido'}
                      className={`mt-0.5 h-4 w-4 rounded shrink-0 flex items-center justify-center border transition ${
                        item.completado ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-300 bg-white'
                      } ${!puedeEditar ? 'opacity-60' : 'hover:border-flow-400'}`}
                    >
                      {item.completado && <Check size={12} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${item.completado ? 'text-marmol-500 line-through' : 'text-marmol-800'}`}>{item.titulo}</p>
                      {item.descripcion && <p className="text-xs text-marmol-400">{item.descripcion}</p>}
                      {item.completado && item.completado_en && (
                        <p className="text-xs text-alto mt-0.5">
                          {auto ? 'Aprobado' : 'Cumplido'} por {item.completado_por_nombre ?? '—'} el {formatearFecha(item.completado_en)}
                        </p>
                      )}
                      {auto && confirmado && (
                        <p className="text-xs text-alto mt-0.5">
                          La persona lo confirmó el {formatearFecha(item.confirmado_colaborador_en!)}
                          {!item.completado && ' · por aprobar'}
                        </p>
                      )}
                      {auto && !confirmado && (
                        <p className="text-xs text-medio mt-0.5">Pendiente de confirmación de la persona</p>
                      )}
                      {item.curso_titulo && (
                        <p className="text-xs text-flow-700 mt-0.5">
                          Se cumple completando el curso «{item.curso_titulo}»{esPropia && !confirmado ? ' — búscalo en Mi formación.' : '.'}
                        </p>
                      )}
                      {auto && !confirmado && esPropia && !item.curso_titulo && (
                        <div className="mt-2 space-y-2">
                          {item.pregunta && (
                            <div className="rounded-lg bg-marmol-50 border border-marmol-100 p-2.5 space-y-1.5">
                              <p className="text-xs font-medium text-marmol-700">{item.pregunta}</p>
                              {(item.opciones ?? []).map((o, idx) => (
                                <label key={idx} className="flex items-start gap-2 text-xs text-marmol-700">
                                  <input
                                    type="radio"
                                    name={`q-${item.id}`}
                                    checked={elegidas[item.id] === idx}
                                    onChange={() => setElegidas((e) => ({ ...e, [item.id]: idx }))}
                                  />
                                  {o}
                                </label>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={!!item.pregunta && elegidas[item.id] === undefined}
                            onClick={() => confirmar(item)}
                            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5"
                          >
                            {item.pregunta ? 'Responder y confirmar' : 'Confirmo que lo conozco y lo entiendo'}
                          </button>
                          {errores[item.id] && <p className="text-xs text-bajo">{errores[item.id]}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
