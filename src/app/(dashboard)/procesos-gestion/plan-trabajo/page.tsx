import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, CalendarCheck, FileSpreadsheet } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/stat-card';
import { GestorPlanTrabajo, type ActividadVista } from '@/components/procesos-gestion/gestor-plan-trabajo';
import type { AdjuntoVista } from '@/components/espiral-crecimiento/adjuntos-simulacro';
import { obtenerActividadesPlan, leerFiltrosPlan } from './data';
import { TIPOS_ACTIVIDAD, SISTEMAS, ESTADOS_ACTIVIDAD, resumirPlan, semaforoCumplimiento, formatoPesos } from '@/lib/plan-trabajo/catalogos';

type Params = { anio?: string; vista?: string; sistema?: string; tipo?: string; estado?: string };

const VISTAS = [
  { value: 'plan', label: 'Plan de trabajo' },
  { value: 'formacion', label: 'Plan de formación' },
  { value: 'sst', label: 'SG-SST' },
] as const;

function enlace(f: ReturnType<typeof leerFiltrosPlan>, cambios: Partial<Record<'anio' | 'vista', string>>) {
  const p = new URLSearchParams();
  p.set('anio', cambios.anio ?? String(f.anio));
  const vista = cambios.vista ?? f.vista;
  if (vista !== 'plan') p.set('vista', vista);
  return `?${p.toString()}`;
}

export default async function PlanTrabajoPage({ searchParams }: { searchParams: Params }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const filtros = leerFiltrosPlan(searchParams as Record<string, string | undefined>);
  const supabase = createClient();
  const puedeEditar = perfil.rol === 'admin_th';
  const hoy = new Date().toISOString().slice(0, 10);

  const [filas, { data: colabs }, { data: aliadosRaw }] = await Promise.all([
    obtenerActividadesPlan(perfil.empresa_id, filtros),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('es_externo', false).in('estado', ['activo', 'periodo_prueba']).order('nombre_completo'),
    supabase.from('nexa_directorio_aliados').select('id, nombre').eq('empresa_id', perfil.empresa_id).order('nombre'),
  ]);

  const actividades: ActividadVista[] = await Promise.all(
    filas.map(async (r: any) => {
      const crudos = (Array.isArray(r.adjuntos) ? r.adjuntos : []) as { nombre: string; ruta: string; tipo: string; tamano: number }[];
      const adjuntos: AdjuntoVista[] = await Promise.all(
        crudos.map(async (a) => {
          const { data } = await supabase.storage.from('plan-trabajo').createSignedUrl(a.ruta, 3600);
          return { ...a, url: data?.signedUrl ?? null };
        })
      );
      return {
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        sistema: r.sistema,
        fecha_programada: r.fecha_programada,
        fecha_ejecutada: r.fecha_ejecutada,
        responsable_id: r.responsable_id,
        responsable: r.responsable?.nombre_completo ?? null,
        poblacion_tipo: r.poblacion_tipo,
        poblacion_detalle: r.poblacion_detalle,
        personas_objetivo: r.personas_objetivo,
        personas_alcanzadas: r.personas_alcanzadas,
        horas: r.horas != null ? Number(r.horas) : null,
        presupuesto_estimado: r.presupuesto_estimado != null ? Number(r.presupuesto_estimado) : null,
        presupuesto_ejecutado: r.presupuesto_ejecutado != null ? Number(r.presupuesto_ejecutado) : null,
        aliado_id: r.aliado_id,
        aliado: r.aliado?.nombre ?? null,
        estado: r.estado,
        calificacion: r.calificacion != null ? Number(r.calificacion) : null,
        notas: r.notas,
        acpm_id: r.acpm_id,
        acpm_codigo: r.acpm?.codigo ?? null,
        adjuntos,
      };
    })
  );

  const resumen = resumirPlan(actividades, hoy);
  const semaforo = semaforoCumplimiento(resumen.cumplimientoPct);
  const hayFiltro = Boolean(filtros.sistema || filtros.tipo || filtros.estado);
  const qsExcel = new URLSearchParams({ anio: String(filtros.anio), vista: filtros.vista, ...(filtros.sistema ? { sistema: filtros.sistema } : {}), ...(filtros.tipo ? { tipo: filtros.tipo } : {}), ...(filtros.estado ? { estado: filtros.estado } : {}) }).toString();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
              <CalendarCheck size={22} className="text-flow-600" /> Plan de trabajo anual
            </h1>
            <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
              Todas las actividades de Gestión Humana en un solo registro: SST, bienestar, formación y sistemas de gestión, con su ejecución, cobertura, presupuesto y evidencias.
              De aquí salen el plan de trabajo, el plan de formación y sus indicadores.
            </p>
          </div>
          <a
            href={`/api/procesos-gestion/plan-trabajo/excel?${qsExcel}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Exportar a Excel
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="card p-1.5 flex items-center gap-1">
          {VISTAS.map((v) => (
            <Link
              key={v.value}
              href={enlace(filtros, { vista: v.value })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filtros.vista === v.value ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'}`}
            >
              {v.label}
            </Link>
          ))}
        </div>
        <div className="card p-1.5 flex items-center gap-1 text-sm">
          <Link href={enlace(filtros, { anio: String(filtros.anio - 1) })} className="px-2.5 py-1.5 rounded-lg text-marmol-600 hover:bg-marmol-100" aria-label="Año anterior">
            ‹
          </Link>
          <span className="px-2 font-medium text-marmol-800">{filtros.anio}</span>
          <Link href={enlace(filtros, { anio: String(filtros.anio + 1) })} className="px-2.5 py-1.5 rounded-lg text-marmol-600 hover:bg-marmol-100" aria-label="Año siguiente">
            ›
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Cumplimiento a la fecha"
          value={resumen.cumplimientoPct != null ? `${resumen.cumplimientoPct}%` : '—'}
          tono={semaforo ?? 'neutral'}
          hint={`${resumen.ejecutadas} ejecutadas de las que ya tocaban`}
          info="De las actividades cuya fecha ya llegó (más las ya ejecutadas), el porcentaje que se ejecutó. Verde desde 90 %, amarillo desde 70 %. Las canceladas no cuentan."
        />
        <StatCard
          label="Atrasadas"
          value={resumen.atrasadas}
          tono={resumen.atrasadas > 0 ? 'bajo' : 'alto'}
          hint="Programadas con fecha vencida"
          info="Actividades cuya fecha programada ya pasó y siguen sin ejecutarse (programada, en curso o reprogramada)."
        />
        <StatCard
          label="Cobertura"
          value={resumen.coberturaPct != null ? `${resumen.coberturaPct}%` : '—'}
          hint="Personas alcanzadas / objetivo"
          info="En las actividades ejecutadas que tienen población objetivo, el porcentaje de personas realmente alcanzadas."
        />
        <StatCard
          label="Horas ejecutadas"
          value={`${resumen.horasEjecutadas} h`}
          hint={`de ${resumen.horasProgramadas} h programadas`}
          info="Suma de las horas de las actividades ejecutadas frente a las programadas (útil para el plan de formación y las horas de SST)."
        />
      </div>
      {(resumen.presupuestoEstimado > 0 || resumen.presupuestoEjecutado > 0) && (
        <p className="text-xs text-marmol-500">
          Presupuesto del plan: {formatoPesos(resumen.presupuestoEjecutado)} ejecutado de {formatoPesos(resumen.presupuestoEstimado)} estimado.
        </p>
      )}

      <form method="get" className="card p-3 flex flex-wrap items-end gap-3">
        <input type="hidden" name="anio" value={filtros.anio} />
        {filtros.vista !== 'plan' && <input type="hidden" name="vista" value={filtros.vista} />}
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Sistema
          <select name="sistema" defaultValue={filtros.sistema ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todos</option>
            {SISTEMAS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Tipo de actividad
          <select name="tipo" defaultValue={filtros.tipo ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todos</option>
            {TIPOS_ACTIVIDAD.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Estado
          <select name="estado" defaultValue={filtros.estado ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todos</option>
            {ESTADOS_ACTIVIDAD.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition">
          Aplicar
        </button>
        {hayFiltro && (
          <Link href={enlace(filtros, {})} className="text-xs text-flow-600 hover:underline pb-2">
            Quitar filtros
          </Link>
        )}
      </form>

      <GestorPlanTrabajo
        actividades={actividades}
        responsables={(colabs ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre_completo }))}
        aliados={(aliadosRaw ?? []).map((a: any) => ({ id: a.id, nombre: a.nombre }))}
        puedeEditar={puedeEditar}
        anio={filtros.anio}
        hoy={hoy}
      />
    </div>
  );
}
