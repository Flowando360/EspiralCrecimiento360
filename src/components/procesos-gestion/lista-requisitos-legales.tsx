'use client';

import { useState, useTransition } from 'react';
import { crearRequisitoLegal, actualizarRequisitoLegal, marcarRequisitoLegalRevisado, eliminarRequisitoLegal } from '@/app/(dashboard)/procesos-gestion/legal/actions';
import { Trash2, Plus, Pencil, Check, X, RefreshCw, Scale } from 'lucide-react';
import { cn, formatearFecha } from '@/lib/utils';

interface RequisitoLegal {
  id: string;
  norma: string;
  anio: number | null;
  entidad_emisora: string | null;
  asunto: string | null;
  articulo: string | null;
  nombre_articulo: string | null;
  descripcion_articulo: string | null;
  cumple: boolean | null;
  soporte_cumplimiento: string | null;
  acciones_a_seguir: string | null;
  observaciones: string | null;
  proceso_id: string | null;
  fecha_ultima_revision: string | null;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

function BadgeCumple({ cumple }: { cumple: boolean | null }) {
  if (cumple === null) return <span className="text-xs rounded-full px-2 py-0.5 font-medium badge-marmol">Sin evaluar</span>;
  return <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', cumple ? 'badge-alto' : 'badge-bajo')}>{cumple ? 'Cumple' : 'No cumple'}</span>;
}

const ESTADO_VACIO = {
  norma: '',
  anio: '',
  entidadEmisora: '',
  asunto: '',
  articulo: '',
  nombreArticulo: '',
  descripcionArticulo: '',
  cumple: '' as '' | 'si' | 'no',
  soporteCumplimiento: '',
  accionesASeguir: '',
  observaciones: '',
  procesoId: '',
};

export function ListaRequisitosLegales({ requisitosIniciales, procesos, puedeEditar }: { requisitosIniciales: RequisitoLegal[]; procesos: ProcesoOpcion[]; puedeEditar: boolean }) {
  const [requisitos, setRequisitos] = useState(requisitosIniciales);
  const [form, setForm] = useState(ESTADO_VACIO);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edForm, setEdForm] = useState(ESTADO_VACIO);

  const nombreProceso = (id: string | null) => {
    if (!id) return null;
    const p = procesos.find((p) => p.id === id);
    return p ? `${p.codigo ? p.codigo + ' · ' : ''}${p.nombre}` : null;
  };

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearRequisitoLegal({
        norma: form.norma,
        anio: form.anio ? Number(form.anio) : undefined,
        entidadEmisora: form.entidadEmisora || undefined,
        asunto: form.asunto || undefined,
        articulo: form.articulo || undefined,
        nombreArticulo: form.nombreArticulo || undefined,
        descripcionArticulo: form.descripcionArticulo || undefined,
        cumple: form.cumple === '' ? undefined : form.cumple === 'si',
        soporteCumplimiento: form.soporteCumplimiento || undefined,
        accionesASeguir: form.accionesASeguir || undefined,
        observaciones: form.observaciones || undefined,
        procesoId: form.procesoId || undefined,
      });
      if (res.ok) {
        setRequisitos((prev) => [
          {
            id: res.id,
            norma: form.norma,
            anio: form.anio ? Number(form.anio) : null,
            entidad_emisora: form.entidadEmisora || null,
            asunto: form.asunto || null,
            articulo: form.articulo || null,
            nombre_articulo: form.nombreArticulo || null,
            descripcion_articulo: form.descripcionArticulo || null,
            cumple: form.cumple === '' ? null : form.cumple === 'si',
            soporte_cumplimiento: form.soporteCumplimiento || null,
            acciones_a_seguir: form.accionesASeguir || null,
            observaciones: form.observaciones || null,
            proceso_id: form.procesoId || null,
            fecha_ultima_revision: new Date().toISOString().slice(0, 10),
          },
          ...prev,
        ]);
        setForm(ESTADO_VACIO);
        setAbierto(false);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    setRequisitos((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await eliminarRequisitoLegal(id);
    });
  }

  function revisar(id: string) {
    setRequisitos((prev) => prev.map((r) => (r.id === id ? { ...r, fecha_ultima_revision: new Date().toISOString().slice(0, 10) } : r)));
    startTransition(async () => {
      await marcarRequisitoLegalRevisado(id);
    });
  }

  function iniciarEdicion(r: RequisitoLegal) {
    setEditandoId(r.id);
    setEdForm({
      norma: r.norma,
      anio: r.anio ? String(r.anio) : '',
      entidadEmisora: r.entidad_emisora ?? '',
      asunto: r.asunto ?? '',
      articulo: r.articulo ?? '',
      nombreArticulo: r.nombre_articulo ?? '',
      descripcionArticulo: r.descripcion_articulo ?? '',
      cumple: r.cumple === null ? '' : r.cumple ? 'si' : 'no',
      soporteCumplimiento: r.soporte_cumplimiento ?? '',
      accionesASeguir: r.acciones_a_seguir ?? '',
      observaciones: r.observaciones ?? '',
      procesoId: r.proceso_id ?? '',
    });
  }

  function guardarEdicion(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await actualizarRequisitoLegal({
        id,
        norma: edForm.norma,
        anio: edForm.anio ? Number(edForm.anio) : undefined,
        entidadEmisora: edForm.entidadEmisora || undefined,
        asunto: edForm.asunto || undefined,
        articulo: edForm.articulo || undefined,
        nombreArticulo: edForm.nombreArticulo || undefined,
        descripcionArticulo: edForm.descripcionArticulo || undefined,
        cumple: edForm.cumple === '' ? undefined : edForm.cumple === 'si',
        soporteCumplimiento: edForm.soporteCumplimiento || undefined,
        accionesASeguir: edForm.accionesASeguir || undefined,
        observaciones: edForm.observaciones || undefined,
        procesoId: edForm.procesoId || undefined,
      });
      if (res.ok) {
        setRequisitos((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  norma: edForm.norma,
                  anio: edForm.anio ? Number(edForm.anio) : null,
                  entidad_emisora: edForm.entidadEmisora || null,
                  asunto: edForm.asunto || null,
                  articulo: edForm.articulo || null,
                  nombre_articulo: edForm.nombreArticulo || null,
                  descripcion_articulo: edForm.descripcionArticulo || null,
                  cumple: edForm.cumple === '' ? null : edForm.cumple === 'si',
                  soporte_cumplimiento: edForm.soporteCumplimiento || null,
                  acciones_a_seguir: edForm.accionesASeguir || null,
                  observaciones: edForm.observaciones || null,
                  proceso_id: edForm.procesoId || null,
                }
              : r
          )
        );
        setEditandoId(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div>
          {!abierto ? (
            <button onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition">
              <Plus size={16} /> Nuevo requisito legal
            </button>
          ) : (
            <div className="card p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.norma} onChange={(e) => setForm({ ...form, norma: e.target.value })} placeholder="Norma, ley o reglamento" className={campo} />
                <input value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} placeholder="Año" type="number" className={campo} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.entidadEmisora} onChange={(e) => setForm({ ...form, entidadEmisora: e.target.value })} placeholder="Entidad emisora" className={campo} />
                <input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Asunto de la norma" className={campo} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.articulo} onChange={(e) => setForm({ ...form, articulo: e.target.value })} placeholder="Artículo" className={campo} />
                <input value={form.nombreArticulo} onChange={(e) => setForm({ ...form, nombreArticulo: e.target.value })} placeholder="Nombre del artículo" className={campo} />
              </div>
              <textarea value={form.descripcionArticulo} onChange={(e) => setForm({ ...form, descripcionArticulo: e.target.value })} placeholder="Descripción del artículo" rows={2} className={cn('w-full', campo)} />
              <select value={form.procesoId} onChange={(e) => setForm({ ...form, procesoId: e.target.value })} className={cn('w-full', campo)}>
                <option value="">Sin proceso asociado</option>
                {procesos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} · ` : ''}
                    {p.nombre}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.cumple} onChange={(e) => setForm({ ...form, cumple: e.target.value as typeof form.cumple })} className={campo}>
                  <option value="">Sin evaluar</option>
                  <option value="si">Cumple</option>
                  <option value="no">No cumple</option>
                </select>
                <input value={form.soporteCumplimiento} onChange={(e) => setForm({ ...form, soporteCumplimiento: e.target.value })} placeholder="Soporte de cumplimiento" className={campo} />
              </div>
              {form.cumple === 'no' && (
                <textarea value={form.accionesASeguir} onChange={(e) => setForm({ ...form, accionesASeguir: e.target.value })} placeholder="Si no cumple, acciones a seguir" rows={2} className={cn('w-full', campo)} />
              )}
              <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Observaciones y/o seguimiento (opcional)" rows={2} className={cn('w-full', campo)} />
              <div className="flex items-center gap-2">
                <button onClick={agregar} disabled={pending || !form.norma.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
                  <Check size={14} /> Guardar
                </button>
                <button
                  onClick={() => {
                    setAbierto(false);
                    setForm(ESTADO_VACIO);
                  }}
                  className="text-sm text-marmol-400 hover:text-marmol-600"
                >
                  Cancelar
                </button>
              </div>
              {error && <p className="text-sm text-bajo">{error}</p>}
            </div>
          )}
        </div>
      )}

      {requisitos.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500 flex items-center gap-2">
          <Scale size={16} className="text-marmol-300" /> Todavía no hay requisitos legales registrados.
        </div>
      ) : (
        <div className="space-y-2">
          {requisitos.map((r) =>
            editandoId === r.id ? (
              <div key={r.id} className="card p-4 space-y-2 bg-flow-50/40">
                <div className="grid grid-cols-2 gap-2">
                  <input value={edForm.norma} onChange={(e) => setEdForm({ ...edForm, norma: e.target.value })} className={campo} />
                  <input value={edForm.anio} onChange={(e) => setEdForm({ ...edForm, anio: e.target.value })} type="number" className={campo} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={edForm.entidadEmisora} onChange={(e) => setEdForm({ ...edForm, entidadEmisora: e.target.value })} placeholder="Entidad emisora" className={campo} />
                  <input value={edForm.asunto} onChange={(e) => setEdForm({ ...edForm, asunto: e.target.value })} placeholder="Asunto" className={campo} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={edForm.articulo} onChange={(e) => setEdForm({ ...edForm, articulo: e.target.value })} placeholder="Artículo" className={campo} />
                  <input value={edForm.nombreArticulo} onChange={(e) => setEdForm({ ...edForm, nombreArticulo: e.target.value })} placeholder="Nombre del artículo" className={campo} />
                </div>
                <textarea value={edForm.descripcionArticulo} onChange={(e) => setEdForm({ ...edForm, descripcionArticulo: e.target.value })} rows={2} className={cn('w-full', campo)} />
                <select value={edForm.procesoId} onChange={(e) => setEdForm({ ...edForm, procesoId: e.target.value })} className={cn('w-full', campo)}>
                  <option value="">Sin proceso asociado</option>
                  {procesos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} · ` : ''}
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={edForm.cumple} onChange={(e) => setEdForm({ ...edForm, cumple: e.target.value as typeof edForm.cumple })} className={campo}>
                    <option value="">Sin evaluar</option>
                    <option value="si">Cumple</option>
                    <option value="no">No cumple</option>
                  </select>
                  <input value={edForm.soporteCumplimiento} onChange={(e) => setEdForm({ ...edForm, soporteCumplimiento: e.target.value })} placeholder="Soporte de cumplimiento" className={campo} />
                </div>
                {edForm.cumple === 'no' && (
                  <textarea value={edForm.accionesASeguir} onChange={(e) => setEdForm({ ...edForm, accionesASeguir: e.target.value })} placeholder="Acciones a seguir" rows={2} className={cn('w-full', campo)} />
                )}
                <textarea value={edForm.observaciones} onChange={(e) => setEdForm({ ...edForm, observaciones: e.target.value })} placeholder="Observaciones" rows={2} className={cn('w-full', campo)} />
                <div className="flex items-center gap-2">
                  <button onClick={() => guardarEdicion(r.id)} disabled={pending || !edForm.norma.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
                    <Check size={12} /> Guardar
                  </button>
                  <button onClick={() => setEditandoId(null)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
                    <X size={12} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div key={r.id} className="card p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <BadgeCumple cumple={r.cumple} />
                    {r.anio && <span className="text-xs text-marmol-400">{r.anio}</span>}
                  </div>
                  <p className="text-sm font-medium text-marmol-800 mt-1">
                    {r.norma}
                    {r.articulo ? ` — Art. ${r.articulo}${r.nombre_articulo ? `: ${r.nombre_articulo}` : ''}` : ''}
                  </p>
                  {r.asunto && <p className="text-xs text-marmol-500">{r.asunto}</p>}
                  {r.descripcion_articulo && <p className="text-xs text-marmol-500 mt-0.5">{r.descripcion_articulo}</p>}
                  {r.cumple === false && r.acciones_a_seguir && <p className="text-xs text-bajo mt-1">Acciones a seguir: {r.acciones_a_seguir}</p>}
                  {r.soporte_cumplimiento && <p className="text-xs text-marmol-500 mt-0.5">Soporte: {r.soporte_cumplimiento}</p>}
                  <p className="text-xs text-marmol-400 mt-0.5">
                    {r.entidad_emisora && <>{r.entidad_emisora} · </>}
                    {nombreProceso(r.proceso_id) && <>{nombreProceso(r.proceso_id)} · </>}
                    {r.fecha_ultima_revision ? `Última revisión ${formatearFecha(r.fecha_ultima_revision)}` : 'Sin revisar'}
                  </p>
                </div>
                {puedeEditar && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => revisar(r.id)} title="Marcar revisado hoy" className="text-marmol-300 hover:text-alto">
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={() => iniciarEdicion(r)} className="text-marmol-300 hover:text-flow-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => eliminar(r.id)} className="text-marmol-300 hover:text-bajo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
