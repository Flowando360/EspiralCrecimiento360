'use client';

import { useState, useTransition } from 'react';
import { crearProcesoCompleto, actualizarProcesoCompleto } from '@/app/(dashboard)/procesos-gestion/actions';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { ETIQUETA_MARCO, type Proceso, type Interaccion, type TipoProceso, type MarcoNormativo } from '@/components/procesos-gestion/mapa-procesos';

interface Colaborador {
  id: string;
  nombre_completo: string;
}

interface FilaInteraccion {
  procesoId: string;
  descripcion: string;
  tipo: 'entrada' | 'apoyo';
  direccion: 'entra' | 'sale';
}

const TIPO_OPCIONES: { valor: TipoProceso; etiqueta: string }[] = [
  { valor: 'estrategico', etiqueta: 'Estratégico' },
  { valor: 'misional', etiqueta: 'Misional' },
  { valor: 'apoyo', etiqueta: 'Apoyo' },
  { valor: 'evaluacion', etiqueta: 'Evaluación' },
];

const PASOS = ['Identidad', 'Marcos normativos', 'Interacciones', 'Confirmación'];

export function FormularioProceso({
  proceso,
  procesos,
  colaboradores,
  interaccionesDelProceso,
  onCerrar,
  onGuardado,
}: {
  proceso: Proceso | null;
  procesos: Proceso[];
  colaboradores: Colaborador[];
  interaccionesDelProceso: Interaccion[];
  onCerrar: () => void;
  onGuardado: (proceso: Proceso, esNuevo: boolean) => void;
}) {
  const [paso, setPaso] = useState(0);
  const [areaProceso, setAreaProceso] = useState(proceso?.area_proceso ?? '');
  const [nombre, setNombre] = useState(proceso?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoProceso>(proceso?.tipo ?? 'misional');
  const [responsableId, setResponsableId] = useState(proceso?.responsable_id ?? '');
  const [objetivo, setObjetivo] = useState(proceso?.objetivo ?? '');
  const [version, setVersion] = useState(proceso?.version ?? '');
  const [marcos, setMarcos] = useState<MarcoNormativo[]>(proceso?.marcos ?? []);

  const [interacciones, setInteracciones] = useState<FilaInteraccion[]>(
    interaccionesDelProceso.map((i) => ({
      procesoId: i.proceso_origen_id === proceso?.id ? i.proceso_destino_id : i.proceso_origen_id,
      descripcion: i.descripcion ?? '',
      tipo: i.tipo,
      direccion: i.proceso_destino_id === proceso?.id ? 'entra' : 'sale',
    }))
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const otrosProcesos = procesos.filter((p) => p.id !== proceso?.id);
  const esNuevo = !proceso;

  function toggleMarco(m: MarcoNormativo) {
    setMarcos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function agregarInteraccion(direccion: 'entra' | 'sale') {
    if (otrosProcesos.length === 0) return;
    setInteracciones((prev) => [...prev, { procesoId: otrosProcesos[0]!.id, descripcion: '', tipo: 'entrada', direccion }]);
  }

  function quitarInteraccion(idx: number) {
    setInteracciones((prev) => prev.filter((_, i) => i !== idx));
  }

  function actualizarInteraccion(idx: number, cambios: Partial<FilaInteraccion>) {
    setInteracciones((prev) => prev.map((f, i) => (i === idx ? { ...f, ...cambios } : f)));
  }

  function validarPaso(): string | null {
    if (paso === 0) {
      if (!nombre.trim()) return 'El nombre es requerido';
      if (!areaProceso.trim()) return 'El área/proceso es requerida';
    }
    return null;
  }

  function siguiente() {
    const err = validarPaso();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function anterior() {
    setError(null);
    setPaso((p) => Math.max(p - 1, 0));
  }

  function guardar() {
    setError(null);
    const payload = {
      areaProceso,
      nombre,
      tipo,
      responsableId: responsableId || undefined,
      objetivo,
      version,
      marcosNormativos: marcos,
      interacciones: interacciones
        .filter((f) => f.procesoId)
        .map((f) => ({ procesoId: f.procesoId, descripcion: f.descripcion, tipo: f.tipo, direccion: f.direccion })),
    };

    startTransition(async () => {
      if (esNuevo) {
        const res = await crearProcesoCompleto(payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onGuardado(
          {
            id: res.id,
            area_proceso: areaProceso,
            nombre,
            descripcion: null,
            tipo,
            codigo: res.codigo,
            objetivo: objetivo || null,
            estado: 'vigente',
            responsable_id: responsableId || null,
            version: version || null,
            fecha_actualizacion: new Date().toISOString().slice(0, 10),
            marcos,
            indice_madurez: 0,
          },
          true
        );
      } else {
        const res = await actualizarProcesoCompleto({ id: proceso!.id, ...payload });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onGuardado(
          {
            ...proceso!,
            area_proceso: areaProceso,
            nombre,
            tipo,
            objetivo: objetivo || null,
            responsable_id: responsableId || null,
            version: version || null,
            fecha_actualizacion: new Date().toISOString().slice(0, 10),
            marcos,
          },
          false
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
          <div>
            <h2 className="font-display font-semibold text-secundario">{esNuevo ? 'Nuevo proceso' : `Editar ${proceso?.nombre}`}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {PASOS.map((p, i) => (
                <span
                  key={p}
                  className={cn(
                    'text-[10px] rounded-full px-2 py-0.5 font-medium',
                    i === paso ? 'bg-flow-500 text-white' : i < paso ? 'bg-flow-100 text-flow-700' : 'bg-marmol-100 text-marmol-400'
                  )}
                >
                  {i + 1}. {p}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onCerrar} className="text-marmol-400 hover:text-marmol-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {paso === 0 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del proceso" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" autoFocus />
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoProceso)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
                  {TIPO_OPCIONES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
              <input value={areaProceso} onChange={(e) => setAreaProceso(e.target.value)} placeholder="Área / proceso" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
                  <option value="">Sin responsable</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo}
                    </option>
                  ))}
                </select>
                <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Versión (ej. v001)" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              </div>
              <textarea
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Objetivo del proceso (opcional)"
                rows={2}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              {esNuevo && <p className="text-[11px] text-marmol-400">El código (ej. {TIPO_OPCIONES.find((o) => o.valor === tipo)?.etiqueta === 'Estratégico' ? 'PE-1' : tipo === 'misional' ? 'PM-1' : tipo === 'apoyo' ? 'PA-1' : 'EV-1'}) se genera automáticamente al guardar.</p>}
            </>
          )}

          {paso === 1 && (
            <div>
              <p className="text-xs text-marmol-500 mb-2">¿A qué marcos normativos aplica este proceso? Puedes marcar varios.</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(ETIQUETA_MARCO) as [MarcoNormativo, string][]).map(([v, l]) => (
                  <label key={v} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer', marcos.includes(v) ? 'border-flow-500 bg-flow-50 text-flow-700' : 'border-marmol-200 text-marmol-600')}>
                    <input type="checkbox" checked={marcos.includes(v)} onChange={() => toggleMarco(v)} className="accent-flow-600" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-marmol-600">Procesos que me entregan algo (entradas)</p>
                  <button onClick={() => agregarInteraccion('entra')} className="text-flow-600 hover:text-flow-700 text-xs inline-flex items-center gap-1">
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {interacciones
                  .map((f, idx) => ({ f, idx }))
                  .filter(({ f }) => f.direccion === 'entra')
                  .map(({ f, idx }) => (
                    <FilaInteraccionEditable key={idx} fila={f} otrosProcesos={otrosProcesos} onCambiar={(c) => actualizarInteraccion(idx, c)} onQuitar={() => quitarInteraccion(idx)} />
                  ))}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-marmol-600">Procesos a los que les entrego algo (salidas)</p>
                  <button onClick={() => agregarInteraccion('sale')} className="text-flow-600 hover:text-flow-700 text-xs inline-flex items-center gap-1">
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {interacciones
                  .map((f, idx) => ({ f, idx }))
                  .filter(({ f }) => f.direccion === 'sale')
                  .map(({ f, idx }) => (
                    <FilaInteraccionEditable key={idx} fila={f} otrosProcesos={otrosProcesos} onCambiar={(c) => actualizarInteraccion(idx, c)} onQuitar={() => quitarInteraccion(idx)} />
                  ))}
              </div>
              {otrosProcesos.length === 0 && <p className="text-xs text-marmol-400">Crea al menos otro proceso para poder declarar interacciones.</p>}
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-marmol-500">Nombre:</span> <span className="font-medium">{nombre || '—'}</span>
              </p>
              <p>
                <span className="text-marmol-500">Tipo:</span> {TIPO_OPCIONES.find((o) => o.valor === tipo)?.etiqueta}
              </p>
              <p>
                <span className="text-marmol-500">Área:</span> {areaProceso || '—'}
              </p>
              <p>
                <span className="text-marmol-500">Responsable:</span> {colaboradores.find((c) => c.id === responsableId)?.nombre_completo ?? 'Sin asignar'}
              </p>
              <p>
                <span className="text-marmol-500">Marcos normativos:</span> {marcos.length > 0 ? marcos.map((m) => ETIQUETA_MARCO[m]).join(', ') : 'Ninguno'}
              </p>
              <p>
                <span className="text-marmol-500">Interacciones declaradas:</span> {interacciones.filter((f) => f.procesoId).length}
              </p>
              <p className="text-xs text-marmol-400 pt-1">La caracterización completa (entradas, actividades y salidas detalladas) se registra después, en la ficha del proceso.</p>
            </div>
          )}

          {error && <p className="text-sm text-bajo">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-marmol-100">
          <button onClick={paso === 0 ? onCerrar : anterior} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-marmol-600 hover:bg-marmol-50">
            {paso === 0 ? 'Cancelar' : (<><ChevronLeft size={14} /> Atrás</>)}
          </button>
          {paso < PASOS.length - 1 ? (
            <button onClick={siguiente} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-1.5">
              Siguiente <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={guardar}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5"
            >
              <Check size={14} /> {pending ? 'Guardando…' : 'Guardar proceso'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilaInteraccionEditable({
  fila,
  otrosProcesos,
  onCambiar,
  onQuitar,
}: {
  fila: FilaInteraccion;
  otrosProcesos: Proceso[];
  onCambiar: (cambios: Partial<FilaInteraccion>) => void;
  onQuitar: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <select value={fila.procesoId} onChange={(e) => onCambiar({ procesoId: e.target.value })} className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-xs">
        {otrosProcesos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.codigo ? `${p.codigo} · ` : ''}
            {p.nombre}
          </option>
        ))}
      </select>
      <input
        value={fila.descripcion}
        onChange={(e) => onCambiar({ descripcion: e.target.value })}
        placeholder="Qué se entrega"
        className="flex-[1.5] rounded-lg border border-marmol-200 px-2 py-1 text-xs"
      />
      <select value={fila.tipo} onChange={(e) => onCambiar({ tipo: e.target.value as 'entrada' | 'apoyo' })} className="rounded-lg border border-marmol-200 px-1.5 py-1 text-xs">
        <option value="entrada">Valor</option>
        <option value="apoyo">Apoyo</option>
      </select>
      <button onClick={onQuitar} className="text-marmol-300 hover:text-bajo shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}
