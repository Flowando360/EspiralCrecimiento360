'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Paperclip, ListChecks, X, Check } from 'lucide-react';
import {
  crearActividadPlan,
  actualizarActividadPlan,
  eliminarActividadPlan,
  crearAcpmDesdeActividad,
  subirAdjuntoActividad,
  eliminarAdjuntoActividad,
} from '@/app/(dashboard)/procesos-gestion/plan-trabajo/actions';
import { AdjuntosSimulacro, type AdjuntoVista } from '@/components/espiral-crecimiento/adjuntos-simulacro';
import {
  TIPOS_ACTIVIDAD,
  SISTEMAS,
  ESTADOS_ACTIVIDAD,
  POBLACIONES,
  MESES,
  etiqueta,
  estaAtrasada,
  formatoPesos,
} from '@/lib/plan-trabajo/catalogos';

export interface ActividadVista {
  id: string;
  nombre: string;
  tipo: string;
  sistema: string;
  fecha_programada: string;
  fecha_ejecutada: string | null;
  responsable_id: string | null;
  responsable: string | null;
  poblacion_tipo: string;
  poblacion_detalle: string | null;
  personas_objetivo: number | null;
  personas_alcanzadas: number | null;
  horas: number | null;
  presupuesto_estimado: number | null;
  presupuesto_ejecutado: number | null;
  aliado_id: string | null;
  aliado: string | null;
  estado: string;
  calificacion: number | null;
  notas: string | null;
  acpm_id: string | null;
  acpm_codigo: string | null;
  adjuntos: AdjuntoVista[];
}

interface Opcion {
  id: string;
  nombre: string;
}

const CLASE_ESTADO: Record<string, string> = {
  programada: 'bg-marmol-100 text-marmol-600',
  en_curso: 'bg-flow-50 text-flow-700',
  ejecutada: 'bg-green-100 text-alto',
  reprogramada: 'bg-medio/10 text-medio',
  cancelada: 'bg-marmol-100 text-marmol-400 line-through',
};

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
const rotulo = 'block text-xs text-marmol-500 mb-1';

const num = (v: string) => (v.trim() === '' ? null : Number(v));
const txt = (v: number | null | undefined) => (v == null ? '' : String(v));

function Formulario({
  inicial,
  responsables,
  aliados,
  anio,
  onCancelar,
  onGuardado,
  id,
}: {
  inicial?: ActividadVista;
  responsables: Opcion[];
  aliados: Opcion[];
  anio: number;
  onCancelar: () => void;
  onGuardado: () => void;
  id?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    nombre: inicial?.nombre ?? '',
    tipo: inicial?.tipo ?? 'capacitacion',
    sistema: inicial?.sistema ?? 'sg_sst',
    fechaProgramada: inicial?.fecha_programada ?? `${anio}-01-15`,
    fechaEjecutada: inicial?.fecha_ejecutada ?? '',
    responsableId: inicial?.responsable_id ?? '',
    poblacionTipo: inicial?.poblacion_tipo ?? 'todos',
    poblacionDetalle: inicial?.poblacion_detalle ?? '',
    personasObjetivo: txt(inicial?.personas_objetivo),
    personasAlcanzadas: txt(inicial?.personas_alcanzadas),
    horas: txt(inicial?.horas),
    presupuestoEstimado: txt(inicial?.presupuesto_estimado),
    presupuestoEjecutado: txt(inicial?.presupuesto_ejecutado),
    aliadoId: inicial?.aliado_id ?? '',
    estado: inicial?.estado ?? 'programada',
    calificacion: txt(inicial?.calificacion),
    notas: inicial?.notas ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  function guardar() {
    setError(null);
    const entrada = {
      nombre: f.nombre,
      tipo: f.tipo as any,
      sistema: f.sistema as any,
      fechaProgramada: f.fechaProgramada,
      fechaEjecutada: f.fechaEjecutada || null,
      responsableId: f.responsableId || null,
      poblacionTipo: f.poblacionTipo as any,
      poblacionDetalle: f.poblacionDetalle,
      personasObjetivo: num(f.personasObjetivo),
      personasAlcanzadas: num(f.personasAlcanzadas),
      horas: num(f.horas),
      presupuestoEstimado: num(f.presupuestoEstimado),
      presupuestoEjecutado: num(f.presupuestoEjecutado),
      aliadoId: f.aliadoId || null,
      estado: f.estado as any,
      calificacion: num(f.calificacion),
      notas: f.notas,
    };
    startTransition(async () => {
      const res = id ? await actualizarActividadPlan(id, entrada) : await crearActividadPlan(entrada);
      if (!res.ok) setError(res.error);
      else onGuardado();
    });
  }

  return (
    <div className="card p-4 space-y-3 border-flow-200">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label className={rotulo}>Actividad *</label>
          <input value={f.nombre} onChange={set('nombre')} placeholder="Ej.: Simulacro de evacuación, Capacitación en trabajo seguro en alturas…" className={campo} />
        </div>
        <div>
          <label className={rotulo}>Tipo</label>
          <select value={f.tipo} onChange={set('tipo')} className={campo}>
            {TIPOS_ACTIVIDAD.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Sistema al que aporta</label>
          <select value={f.sistema} onChange={set('sistema')} className={campo}>
            {SISTEMAS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Estado</label>
          <select value={f.estado} onChange={set('estado')} className={campo}>
            {ESTADOS_ACTIVIDAD.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Fecha programada *</label>
          <input type="date" value={f.fechaProgramada} onChange={set('fechaProgramada')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Fecha de ejecución</label>
          <input type="date" value={f.fechaEjecutada} onChange={set('fechaEjecutada')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Responsable</label>
          <select value={f.responsableId} onChange={set('responsableId')} className={campo}>
            <option value="">Sin asignar</option>
            {responsables.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Población objetivo</label>
          <select value={f.poblacionTipo} onChange={set('poblacionTipo')} className={campo}>
            {POBLACIONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {f.poblacionTipo !== 'todos' && (
          <div>
            <label className={rotulo}>{f.poblacionTipo === 'area' ? 'Área' : 'Cargo'}</label>
            <input value={f.poblacionDetalle} onChange={set('poblacionDetalle')} className={campo} />
          </div>
        )}
        <div>
          <label className={rotulo}>Personas objetivo</label>
          <input type="number" min={0} value={f.personasObjetivo} onChange={set('personasObjetivo')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Personas alcanzadas</label>
          <input type="number" min={0} value={f.personasAlcanzadas} onChange={set('personasAlcanzadas')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Horas</label>
          <input type="number" min={0} step="0.5" value={f.horas} onChange={set('horas')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Presupuesto estimado (COP)</label>
          <input type="number" min={0} value={f.presupuestoEstimado} onChange={set('presupuestoEstimado')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Presupuesto ejecutado (COP)</label>
          <input type="number" min={0} value={f.presupuestoEjecutado} onChange={set('presupuestoEjecutado')} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Aliado o proveedor</label>
          <select value={f.aliadoId} onChange={set('aliadoId')} className={campo}>
            <option value="">Ninguno</option>
            {aliados.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Calificación / NPS del evento (0-10)</label>
          <input type="number" min={0} max={10} step="0.1" value={f.calificacion} onChange={set('calificacion')} className={campo} />
        </div>
        <div className="sm:col-span-3">
          <label className={rotulo}>Notas</label>
          <textarea rows={2} value={f.notas} onChange={set('notas')} className={campo} />
        </div>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !f.nombre.trim() || !f.fechaProgramada}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5"
        >
          <Check size={14} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-sm font-medium px-3.5 py-1.5">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  );
}

function PanelAcpm({ id, onListo }: { id: string; onListo: () => void }) {
  const [pending, startTransition] = useTransition();
  const [hallazgo, setHallazgo] = useState('');
  const [tipo, setTipo] = useState<'correctiva' | 'preventiva' | 'mejora'>('correctiva');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'critica'>('media');
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearAcpmDesdeActividad(id, hallazgo, tipo, prioridad);
      if (!res.ok) setError(res.error);
      else onListo();
    });
  }

  return (
    <div className="mt-3 space-y-2 border-t border-marmol-100 pt-3">
      <p className="text-xs text-marmol-500">Si la actividad reveló un hallazgo, conviértelo en una acción de mejora (ACPM) vinculada a esta actividad.</p>
      <textarea rows={2} value={hallazgo} onChange={(e) => setHallazgo(e.target.value)} placeholder="Describe el hallazgo" className={campo} />
      <div className="flex items-center gap-2 flex-wrap">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} aria-label="Tipo de acción" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="correctiva">Correctiva</option>
          <option value="preventiva">Preventiva</option>
          <option value="mejora">Mejora</option>
        </select>
        <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as any)} aria-label="Prioridad" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="baja">Prioridad baja</option>
          <option value="media">Prioridad media</option>
          <option value="alta">Prioridad alta</option>
          <option value="critica">Prioridad crítica</option>
        </select>
        <button type="button" onClick={crear} disabled={pending || !hallazgo.trim()} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5">
          {pending ? 'Creando…' : 'Crear acción en ACPM'}
        </button>
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}

function FilaActividad({ a, puedeEditar, responsables, aliados, anio, hoy }: { a: ActividadVista; puedeEditar: boolean; responsables: Opcion[]; aliados: Opcion[]; anio: number; hoy: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<null | 'editar' | 'evidencias' | 'acpm'>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const atrasada = estaAtrasada(a, hoy);

  function eliminar() {
    if (!confirm(`¿Eliminar la actividad «${a.nombre}»? También se borran sus evidencias.`)) return;
    startTransition(async () => {
      const res = await eliminarActividadPlan(a.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  if (modo === 'editar') {
    return (
      <Formulario
        inicial={a}
        id={a.id}
        responsables={responsables}
        aliados={aliados}
        anio={anio}
        onCancelar={() => setModo(null)}
        onGuardado={() => {
          setModo(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[16rem] space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-marmol-900">{a.nombre}</p>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${CLASE_ESTADO[a.estado] ?? ''}`}>{etiqueta(ESTADOS_ACTIVIDAD, a.estado)}</span>
            {atrasada && <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-red-100 text-bajo">Atrasada</span>}
          </div>
          <p className="text-xs text-marmol-500">
            {etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · {etiqueta(SISTEMAS, a.sistema)} · Programada {a.fecha_programada}
            {a.fecha_ejecutada ? ` · Ejecutada ${a.fecha_ejecutada}` : ''}
          </p>
          <p className="text-xs text-marmol-400">
            {a.responsable ? `Responsable: ${a.responsable}` : 'Sin responsable'}
            {a.aliado ? ` · Aliado: ${a.aliado}` : ''}
            {a.poblacion_tipo !== 'todos' && a.poblacion_detalle ? ` · ${a.poblacion_tipo === 'area' ? 'Área' : 'Cargo'}: ${a.poblacion_detalle}` : ''}
          </p>
          <p className="text-xs text-marmol-500 flex flex-wrap gap-x-4">
            {a.personas_objetivo != null && (
              <span>
                Cobertura: {a.personas_alcanzadas ?? 0}/{a.personas_objetivo}
              </span>
            )}
            {a.horas != null && <span>{a.horas} h</span>}
            {a.presupuesto_estimado != null && (
              <span>
                Presupuesto: {a.presupuesto_ejecutado != null ? `${formatoPesos(a.presupuesto_ejecutado)} de ` : ''}
                {formatoPesos(a.presupuesto_estimado)}
              </span>
            )}
            {a.calificacion != null && <span>Calificación: {a.calificacion}</span>}
          </p>
          {a.notas && <p className="text-xs text-marmol-400">{a.notas}</p>}
          {a.acpm_id && (
            <Link href="/procesos-gestion/acpm" className="text-xs text-flow-600 hover:underline">
              Acción ACPM {a.acpm_codigo ?? ''} →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setModo(modo === 'evidencias' ? null : 'evidencias')} className="inline-flex items-center gap-1 text-marmol-500 hover:text-flow-600">
            <Paperclip size={13} /> Evidencias ({a.adjuntos.length})
          </button>
          {puedeEditar && !a.acpm_id && (
            <button type="button" onClick={() => setModo(modo === 'acpm' ? null : 'acpm')} className="inline-flex items-center gap-1 text-marmol-500 hover:text-flow-600">
              <ListChecks size={13} /> ACPM
            </button>
          )}
          {puedeEditar && (
            <>
              <button type="button" onClick={() => setModo('editar')} className="inline-flex items-center gap-1 text-marmol-500 hover:text-flow-600">
                <Pencil size={13} /> Editar
              </button>
              <button type="button" onClick={eliminar} disabled={pending} className="inline-flex items-center gap-1 text-marmol-400 hover:text-bajo disabled:opacity-40">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-bajo mt-2">{error}</p>}
      {modo === 'evidencias' && (
        <div className="mt-3 border-t border-marmol-100 pt-3">
          <AdjuntosSimulacro
            simulacroId={a.id}
            adjuntos={a.adjuntos}
            editable={puedeEditar}
            acciones={{ subir: subirAdjuntoActividad, eliminar: eliminarAdjuntoActividad }}
            sinTarjeta
          />
        </div>
      )}
      {modo === 'acpm' && (
        <PanelAcpm
          id={a.id}
          onListo={() => {
            setModo(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Plan de trabajo anual: lista de actividades agrupadas por mes, con alta, edición, evidencias y ACPM. */
export function GestorPlanTrabajo({
  actividades,
  responsables,
  aliados,
  puedeEditar,
  anio,
  hoy,
}: {
  actividades: ActividadVista[];
  responsables: Opcion[];
  aliados: Opcion[];
  puedeEditar: boolean;
  anio: number;
  hoy: string;
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);

  const porMes = new Map<number, ActividadVista[]>();
  for (const a of actividades) {
    const mes = Number(a.fecha_programada.slice(5, 7)) - 1;
    porMes.set(mes, [...(porMes.get(mes) ?? []), a]);
  }
  const meses = [...porMes.keys()].sort((x, y) => x - y);

  return (
    <div className="space-y-4">
      {puedeEditar &&
        (creando ? (
          <Formulario
            responsables={responsables}
            aliados={aliados}
            anio={anio}
            onCancelar={() => setCreando(false)}
            onGuardado={() => {
              setCreando(false);
              router.refresh();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
          >
            <Plus size={16} /> Nueva actividad
          </button>
        ))}

      {actividades.length === 0 ? (
        <div className="card p-6 text-center text-sm text-marmol-400">No hay actividades para este año y estos filtros.</div>
      ) : (
        meses.map((m) => (
          <section key={m} className="space-y-2">
            <h2 className="font-display font-semibold text-secundario text-sm uppercase tracking-wide">
              {MESES[m]} {anio} <span className="text-marmol-400 font-normal normal-case">· {porMes.get(m)!.length} {porMes.get(m)!.length === 1 ? 'actividad' : 'actividades'}</span>
            </h2>
            {porMes.get(m)!.map((a) => (
              <FilaActividad key={a.id} a={a} puedeEditar={puedeEditar} responsables={responsables} aliados={aliados} anio={anio} hoy={hoy} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
