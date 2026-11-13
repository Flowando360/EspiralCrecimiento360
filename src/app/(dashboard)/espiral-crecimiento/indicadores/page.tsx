import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/stat-card';
import { IndicadoresEquipoChart } from '@/components/espiral-crecimiento/indicadores-equipo-chart';
import { RotacionTendenciaChart } from '@/components/espiral-crecimiento/rotacion-tendencia-chart';
import { TrendingUp, Users, ShieldAlert, GraduationCap, UserMinus, HardHat, UserPlus, CalendarCheck } from 'lucide-react';
import { leerFiltrosEquipo, opcionesFiltroEquipo, coincideEquipo, hayFiltrosEquipo, describirFiltrosEquipo } from '@/lib/informes/filtros-equipo';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';
import { calcularCumplimientoObjetivos } from '@/lib/desempeno/objetivos';
import { calcularIndicadoresSst, calcularIndicadoresReclutamiento, calcularIndicadoresPlan } from '@/lib/informes/indicadores-sst-reclutamiento';

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export default async function IndicadoresPage({ searchParams }: { searchParams?: { area?: string; liderId?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const umbralAnonimato = await obtenerUmbralAnonimato(perfil.empresa_id);

  const [{ data: empresa }, { data: equipos }, { data: rotacionMensual }] = await Promise.all([
    supabase.from('v_indicadores_empresa').select('*').eq('empresa_id', perfil.empresa_id).maybeSingle(),
    supabase.from('v_indicadores_equipo').select('*').eq('empresa_id', perfil.empresa_id),
    supabase.from('v_rotacion_mensual').select('*').eq('empresa_id', perfil.empresa_id),
  ]);

  // Filtro por área y líder directo (informe de Luisa 4.17.1): recalcula Hacer y Deber de ese grupo, con el mínimo de anonimato.
  const filtros = leerFiltrosEquipo(searchParams ?? {});
  const filtrado = hayFiltrosEquipo(filtros);
  const opcionesEquipo = await opcionesFiltroEquipo(perfil);
  let hacerGrupo: number | null = null;
  let deberGrupo: number | null = null;
  let personasGrupo = 0;
  let idsLideresGrupo: Set<string> | null = null;
  if (filtrado) {
    const { data: todos } = await supabase
      .from('colaboradores')
      .select('id, lider_id, cargo_id, fecha_ingreso, cargo:cargo_id(proceso_area)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('es_externo', false)
      .in('estado', ['activo', 'periodo_prueba']);
    const grupo = ((todos ?? []) as any[]).filter((c) => coincideEquipo(c, filtros));
    personasGrupo = grupo.length;
    idsLideresGrupo = new Set(grupo.map((c) => c.lider_id).filter(Boolean) as string[]);
    const ids = new Set(grupo.map((c) => c.id as string));
    const { data: resultados } = await supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
      .order('actualizado_en', { ascending: false });
    const ultimo = new Map<string, { h: number | null; d: number | null }>();
    for (const r of (resultados ?? []) as any[]) {
      const cid = r.evaluacion?.colaborador_evaluado_id;
      if (cid && ids.has(cid) && !ultimo.has(cid)) ultimo.set(cid, { h: r.indice_hacer, d: r.indice_deber });
    }
    const hs = Array.from(ultimo.values()).map((v) => v.h).filter((v): v is number => v != null);
    const ds = Array.from(ultimo.values()).map((v) => v.d).filter((v): v is number => v != null);
    const prom = (v: number[]) => (v.length >= umbralAnonimato ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null);
    hacerGrupo = prom(hs);
    deberGrupo = prom(ds);
  }
  const equiposVisibles = (equipos ?? []).filter((e: any) => !idsLideresGrupo || idsLideresGrupo.has(e.lider_id));

  // Cumplimiento de objetivos concertados: solo objetivos ya cerrados; con anonimato (mínimo de personas con objetivos cerrados).
  const { data: objetivosCerrados } = await supabase.from('objetivos_ciclo').select('colaborador_id, resultado').not('resultado', 'is', null);
  const personasConObjetivos = new Set((objetivosCerrados ?? []).map((o: any) => o.colaborador_id)).size;
  const cumplimientoObjetivos = personasConObjetivos >= umbralAnonimato ? calcularCumplimientoObjetivos((objetivosCerrados ?? []) as any[]).porcentaje : null;

  // SST y Reclutamiento usan datos de acceso restringido (incapacidades, vacantes): solo Talento Humano.
  const verSstYReclutamiento = perfil.rol === 'admin_th';
  const [sst, rec] = verSstYReclutamiento
    ? await Promise.all([calcularIndicadoresSst(perfil.empresa_id), calcularIndicadoresReclutamiento(perfil.empresa_id)])
    : [null, null];

  const verPlan = ['admin_th', 'lider', 'gerencia'].includes(perfil.rol);
  const plan = verPlan ? await calcularIndicadoresPlan(perfil.empresa_id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Indicadores</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Con Guía y desempeño sin alerta, brechas de formación, cumplimiento y coherencia cultural — por
          organización y por equipo.
        </p>
      </div>

      <FiltroEquipo
        rutaBase="/espiral-crecimiento/indicadores"
        areas={opcionesEquipo.areas}
        lideres={opcionesEquipo.lideres}
        cargos={opcionesEquipo.cargos}
        actuales={filtros}
        conservar={{}}
        mostrarLider={perfil.rol !== 'lider'}
      />
      {filtrado && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Mostrando Hacer y Deber de: {describirFiltrosEquipo(filtros, null)} ({personasGrupo} personas). Saber, alertas, rotación y los demás
          indicadores de esta pantalla son de toda la empresa. Con menos de {umbralAnonimato} personas con resultado el promedio no se muestra.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Índice de Hacer" value={filtrado ? hacerGrupo ?? '—' : empresa?.promedio_hacer_empresa ?? '—'} icon={TrendingUp} tono="flow" />
        <StatCard label="Índice de Deber" value={filtrado ? deberGrupo ?? '—' : empresa?.promedio_deber_empresa ?? '—'} icon={TrendingUp} tono="flow" />
        <StatCard
          label="Cumplimiento Saber"
          value={empresa?.promedio_saber_empresa ? `${empresa.promedio_saber_empresa}%` : '—'}
          icon={GraduationCap}
        />
        <StatCard
          label="Con Guía y desempeño sin alerta"
          value={empresa?.pct_alineacion_talento_rol ? `${empresa.pct_alineacion_talento_rol}%` : '—'}
          icon={Users}
        />
      </div>

      <StatCard
        label="Cumplimiento de objetivos concertados"
        value={cumplimientoObjetivos != null ? `${cumplimientoObjetivos}%` : '—'}
        icon={TrendingUp}
        hint={personasConObjetivos > 0 && cumplimientoObjetivos == null ? `Menos de ${umbralAnonimato} personas con objetivos cerrados` : 'Objetivos ya cerrados: cumplido 100, parcial 50, no cumplido 0'}
      />

      <StatCard
        label="Alertas críticas abiertas"
        value={empresa?.alertas_criticas ?? 0}
        icon={ShieldAlert}
        tono={((empresa?.alertas_criticas as number) ?? 0) > 0 ? 'bajo' : 'alto'}
      />

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-4">
          Mapa de equipos: Hacer vs. Deber promedio
        </h2>
        <IndicadoresEquipoChart
          datos={equiposVisibles.filter((e: any) => Number(e.tamano_equipo ?? 0) >= umbralAnonimato).map((e: any) => ({
            equipo: e.lider_nombre,
            hacer: e.promedio_hacer ?? 0,
            deber: e.promedio_deber ?? 0,
            saber: e.promedio_saber ?? 0,
          }))}
        />
      </div>

      {(equipos ?? []).some((e: any) => Number(e.tamano_equipo ?? 0) < umbralAnonimato) && (
        <p className="text-xs text-marmol-500">
          Por privacidad, el mapa solo incluye equipos de {umbralAnonimato} personas o más ({(equipos ?? []).filter((e: any) => Number(e.tamano_equipo ?? 0) < umbralAnonimato).length} equipo(s) más pequeño(s) no se muestran).
        </p>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold text-secundario mb-3">Rotación de personal</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Tasa de rotación anual"
            value={empresa?.tasa_rotacion_anual != null ? `${empresa.tasa_rotacion_anual}%` : '—'}
            icon={UserMinus}
            hint="Últimos 12 meses"
          />
          <StatCard
            label="Rotación voluntaria"
            value={empresa?.tasa_rotacion_voluntaria != null ? `${empresa.tasa_rotacion_voluntaria}%` : '—'}
            icon={UserMinus}
            hint="Solo renuncias"
          />
          <StatCard
            label="Salidas último año"
            value={empresa?.salidas_ultimo_anio ?? 0}
            icon={UserMinus}
          />
          <StatCard
            label="Salidas voluntarias"
            value={empresa?.salidas_voluntarias_ultimo_anio ?? 0}
            icon={UserMinus}
          />
        </div>
        <div className="card p-5">
          <h3 className="font-display font-semibold text-secundario mb-4">Tendencia de salidas (12 meses)</h3>
          <RotacionTendenciaChart
            datos={(rotacionMensual ?? []).map((r: any) => {
              const [anio, mes] = String(r.mes).split('-');
              return {
                mes: `${MESES[Number(mes) - 1]} ${String(anio).slice(2)}`,
                salidas: r.salidas ?? 0,
                salidasVoluntarias: r.salidas_voluntarias ?? 0,
              };
            })}
          />
        </div>
      </div>

      {sst && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3 flex items-center gap-2">
            <HardHat size={18} /> Seguridad y Salud en el Trabajo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Accidentes laborales (12 m)"
              value={sst.accidentesLaborales}
              icon={ShieldAlert}
              tono={sst.accidentesLaborales > 0 ? 'bajo' : 'alto'}
              hint={sst.tasaAccidentalidad != null ? `${sst.tasaAccidentalidad} por cada 100 trabajadores` : undefined}
              info="Accidentes de trabajo que generaron incapacidad en los últimos 12 meses, tomados de las incapacidades registradas. La tasa los compara con la planta actual. Lo ideal es 0."
            />
            <StatCard
              label="Días de incapacidad (12 m)"
              value={sst.totalDiasIncapacidad}
              icon={ShieldAlert}
              info="Suma de días de incapacidades y licencias registradas en los últimos 12 meses. El detalle por origen está en la tabla de abajo."
            />
            <StatCard
              label="Exámenes médicos al día"
              value={sst.coberturaExamenes != null ? `${sst.coberturaExamenes}%` : '—'}
              icon={Users}
              tono={sst.coberturaExamenes != null && sst.coberturaExamenes < 90 ? 'medio' : 'alto'}
              hint={sst.conAlertaExamen > 0 ? `${sst.conAlertaExamen} con examen por vencer o vencido` : 'Nadie con alerta abierta'}
              info="Porcentaje de personas activas que no tienen una alerta de examen médico abierta (por vencer o vencida). Es un cálculo a partir de las alertas, no de un registro de resultados."
            />
            <StatCard
              label="Plan de formación SST"
              value={sst.formacionSst.pct != null ? `${sst.formacionSst.pct}%` : '—'}
              icon={GraduationCap}
              hint={`${sst.formacionSst.completadas} de ${sst.formacionSst.asignadas} cursos completados`}
              info="Avance de los cursos de SST asignados en Nexa (inducción SST, alturas, manejo de cargas, EPP, emergencias). 100% significa que todo lo asignado está completado."
            />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-marmol-200">
              <h3 className="font-display font-semibold text-secundario text-sm">Días de incapacidad por origen (últimos 12 meses)</h3>
            </div>
            {sst.diasPorOrigen.length === 0 ? (
              <p className="px-4 py-3 text-sm text-marmol-400">No hay incapacidades registradas en el período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                    <th className="px-4 py-2 font-medium">Origen</th>
                    <th className="px-4 py-2 font-medium">Casos</th>
                    <th className="px-4 py-2 font-medium">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {sst.diasPorOrigen.map((o) => (
                    <tr key={o.origen} className="border-b border-marmol-100 last:border-0">
                      <td className="px-4 py-2 text-marmol-800">{o.origen}</td>
                      <td className="px-4 py-2 text-marmol-600">{o.casos}</td>
                      <td className="px-4 py-2 text-marmol-600">{o.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ul className="mt-3 text-xs text-marmol-400 list-disc pl-5 space-y-0.5">
            {sst.noDisponible.map((t) => (
              <li key={t}>No disponible todavía — {t}</li>
            ))}
          </ul>
        </div>
      )}

      {rec && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3 flex items-center gap-2">
            <UserPlus size={18} /> Reclutamiento y selección
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Tiempo promedio de cierre"
              value={rec.diasPromedioCierre != null ? `${rec.diasPromedioCierre} días` : '—'}
              icon={UserPlus}
              hint={`${rec.vacantesCerradas12m} vacantes cerradas en 12 m · ${rec.vacantesAbiertas} abiertas`}
              info="Días promedio entre la apertura y el cierre de las vacantes cerradas en los últimos 12 meses. Menos días significa un proceso de selección más ágil."
            />
            <StatCard
              label="Efectividad de la contratación"
              value={rec.efectividadContratacion.pct != null ? `${rec.efectividadContratacion.pct}%` : '—'}
              icon={Users}
              hint={`Base: ${rec.efectividadContratacion.base} ingresos`}
              info="De quienes ingresaron en los últimos 12 meses y ya cumplieron 2 meses, el porcentaje que superó el período de prueba (no salió antes). Alto es mejor."
            />
            <StatCard
              label="Rotación temprana (6 meses)"
              value={rec.rotacionTemprana.pct != null ? `${rec.rotacionTemprana.pct}%` : '—'}
              icon={UserMinus}
              tono={rec.rotacionTemprana.pct != null && rec.rotacionTemprana.pct > 20 ? 'bajo' : 'neutral'}
              hint={`${rec.rotacionTemprana.salieron} de ${rec.rotacionTemprana.base} salieron pronto`}
              info="De quienes ingresaron hace entre 6 y 18 meses, el porcentaje que se fue dentro de sus primeros 6 meses. Un valor alto sugiere problemas de selección o de inducción."
            />
            <StatCard
              label="Postulaciones → contratadas"
              value={`${rec.contratadas} / ${rec.postulaciones}`}
              icon={UserPlus}
              info="Cuántas de todas las postulaciones registradas terminaron en contratación."
            />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-marmol-200">
              <h3 className="font-display font-semibold text-secundario text-sm">Fuentes de candidatos</h3>
            </div>
            {rec.fuentes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-marmol-400">Aún no hay postulaciones registradas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                    <th className="px-4 py-2 font-medium">Fuente</th>
                    <th className="px-4 py-2 font-medium">Postulaciones</th>
                    <th className="px-4 py-2 font-medium">Contratadas</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.fuentes.map((f) => (
                    <tr key={f.fuente} className="border-b border-marmol-100 last:border-0">
                      <td className="px-4 py-2 text-marmol-800">{f.fuente}</td>
                      <td className="px-4 py-2 text-marmol-600">{f.postulaciones}</td>
                      <td className="px-4 py-2 text-marmol-600">{f.contratadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ul className="mt-3 text-xs text-marmol-400 list-disc pl-5 space-y-0.5">
            {rec.noDisponible.map((t) => (
              <li key={t}>No disponible todavía — {t}</li>
            ))}
          </ul>
        </div>
      )}

      {plan && plan.general.programadas > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3 flex items-center gap-2">
            <CalendarCheck size={18} /> Plan de trabajo anual {plan.anio}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Cumplimiento del plan"
              value={plan.general.cumplimientoPct != null ? `${plan.general.cumplimientoPct}%` : '—'}
              icon={CalendarCheck}
              tono={plan.general.cumplimientoPct == null ? 'neutral' : plan.general.cumplimientoPct >= 90 ? 'alto' : plan.general.cumplimientoPct >= 70 ? 'medio' : 'bajo'}
              hint={`${plan.general.ejecutadas} ejecutadas · ${plan.general.atrasadas} atrasadas`}
              info="Porcentaje de las actividades del plan de trabajo cuya fecha ya llegó que se ejecutaron. Se actualiza solo a medida que se marcan ejecutadas en Procesos → Plan de trabajo anual."
            />
            <StatCard
              label="Cumplimiento del plan de formación"
              value={plan.formacion.cumplimientoPct != null ? `${plan.formacion.cumplimientoPct}%` : '—'}
              icon={GraduationCap}
              hint={`${plan.formacion.horasEjecutadas} de ${plan.formacion.horasProgramadas} h`}
              info="Lo mismo, solo para las capacitaciones, inducciones y actividades de formación del plan, con las horas ejecutadas frente a las programadas."
            />
            <StatCard
              label="Actividades SST ejecutadas"
              value={`${plan.sst.ejecutadas} / ${plan.sst.programadas}`}
              icon={HardHat}
              hint={`${plan.sst.horasEjecutadas} h de SST ejecutadas`}
              info="Actividades del SG-SST (simulacros, inspecciones, pausas activas, capacitaciones…) ejecutadas frente a las programadas en el año."
            />
            <StatCard
              label="Cobertura de las actividades"
              value={plan.general.coberturaPct != null ? `${plan.general.coberturaPct}%` : '—'}
              icon={Users}
              info="De las personas que debían participar en las actividades ejecutadas, el porcentaje que realmente participó."
            />
          </div>
        </div>
      )}
    </div>
  );
}
