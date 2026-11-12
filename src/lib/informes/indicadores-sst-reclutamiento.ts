import { createClient } from '@/lib/supabase/server';
import { resumirPlan } from '@/lib/plan-trabajo/catalogos';

/**
 * Indicadores de SST y de Reclutamiento para el módulo Indicadores
 * (informe de pruebas, hallazgos 4.17.2 y 4.17.3). Se calculan con los datos que
 * ya existen; lo que la plataforma todavía no registra se declara en `noDisponible`
 * en vez de inventarse.
 */

const CATEGORIAS_SST = ['induccion_sst', 'alturas', 'manejo_cargas', 'epp', 'protocolos_emergencia'];

const ETIQUETA_INCAPACIDAD: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_laboral: 'Accidente laboral',
  enfermedad_laboral: 'Enfermedad laboral',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otra: 'Otra',
};

function hace(meses: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

export interface IndicadoresSst {
  activos: number;
  diasPorOrigen: { origen: string; dias: number; casos: number }[];
  totalDiasIncapacidad: number;
  accidentesLaborales: number;
  /** Accidentes laborales con incapacidad por cada 100 trabajadores en los últimos 12 meses. */
  tasaAccidentalidad: number | null;
  /** % de personas activas sin alerta de examen médico abierta (por vencer o vencido). */
  coberturaExamenes: number | null;
  conAlertaExamen: number;
  formacionSst: { asignadas: number; completadas: number; pct: number | null };
  noDisponible: string[];
}

export async function calcularIndicadoresSst(empresaId: string): Promise<IndicadoresSst> {
  const supabase = createClient();
  const desde = iso(hace(12));

  const [{ data: activosRaw }, { data: incapacidades }, { data: alertasExamen }, { data: rutas }] = await Promise.all([
    supabase.from('colaboradores').select('id').eq('empresa_id', empresaId).eq('es_externo', false).in('estado', ['activo', 'periodo_prueba']),
    supabase
      .from('incapacidades_colaborador')
      .select('tipo, dias, fecha_inicio, colaborador:colaborador_id!inner(empresa_id)')
      .eq('colaborador.empresa_id', empresaId)
      .gte('fecha_inicio', desde),
    supabase
      .from('alertas')
      .select('colaborador_id, colaborador:colaborador_id!inner(empresa_id)')
      .eq('colaborador.empresa_id', empresaId)
      .eq('tipo', 'sst_examen_medico')
      .in('estado', ['pendiente', 'notificada']),
    supabase
      .from('nexa_rutas_formacion')
      .select('estado, colaborador:colaborador_id!inner(empresa_id), curso:curso_id(categoria)')
      .eq('colaborador.empresa_id', empresaId),
  ]);

  const activos = (activosRaw ?? []).length;

  const porOrigen = new Map<string, { dias: number; casos: number }>();
  for (const i of (incapacidades ?? []) as any[]) {
    const k = i.tipo as string;
    const a = porOrigen.get(k) ?? { dias: 0, casos: 0 };
    a.dias += i.dias ?? 0;
    a.casos += 1;
    porOrigen.set(k, a);
  }
  const diasPorOrigen = [...porOrigen.entries()]
    .map(([k, v]) => ({ origen: ETIQUETA_INCAPACIDAD[k] ?? k, ...v }))
    .sort((a, b) => b.dias - a.dias);
  const totalDiasIncapacidad = diasPorOrigen.reduce((s, o) => s + o.dias, 0);
  const accidentesLaborales = porOrigen.get('accidente_laboral')?.casos ?? 0;

  const personasConAlerta = new Set(((alertasExamen ?? []) as any[]).map((a) => a.colaborador_id as string));
  const conAlertaExamen = personasConAlerta.size;

  const sst = ((rutas ?? []) as any[]).filter((r) => CATEGORIAS_SST.includes(r.curso?.categoria));
  const completadas = sst.filter((r) => r.estado === 'completado').length;

  return {
    activos,
    diasPorOrigen,
    totalDiasIncapacidad,
    accidentesLaborales,
    tasaAccidentalidad: pct(accidentesLaborales, activos),
    coberturaExamenes: activos > 0 ? Math.max(0, Math.round(((activos - conAlertaExamen) / activos) * 1000) / 10) : null,
    conAlertaExamen,
    formacionSst: { asignadas: sst.length, completadas, pct: pct(completadas, sst.length) },
    noDisponible: [
      'Estado de investigación de accidentes: la plataforma aún no registra las investigaciones.',
      'Ausentismo por permisos y calamidad: solo se registran incapacidades y licencias.',
    ],
  };
}

export interface IndicadoresReclutamiento {
  vacantesAbiertas: number;
  vacantesCerradas12m: number;
  /** Días promedio entre apertura y cierre de las vacantes cerradas en los últimos 12 meses. */
  diasPromedioCierre: number | null;
  postulaciones: number;
  contratadas: number;
  fuentes: { fuente: string; postulaciones: number; contratadas: number }[];
  /** % de quienes ingresaron hace más de 2 meses (y en los últimos 12) que superaron el período de prueba. */
  efectividadContratacion: { pct: number | null; base: number };
  /** % de quienes ingresaron hace 6-18 meses que salieron dentro de sus primeros 6 meses. */
  rotacionTemprana: { pct: number | null; base: number; salieron: number };
  noDisponible: string[];
}

const ETIQUETA_FUENTE: Record<string, string> = {
  postulacion_publica: 'Formulario público (enlace de la vacante)',
  manual: 'Ingreso manual por Talento Humano',
};

export async function calcularIndicadoresReclutamiento(empresaId: string): Promise<IndicadoresReclutamiento> {
  const supabase = createClient();
  const desde12 = iso(hace(12));

  const [{ data: vacantes }, { data: postulaciones }, { data: ingresos }] = await Promise.all([
    supabase.from('vacantes').select('estado, fecha_apertura, fecha_cierre').eq('empresa_id', empresaId),
    supabase
      .from('postulaciones')
      .select('etapa, candidato:candidato_id(origen), vacante:vacante_id!inner(empresa_id)')
      .eq('vacante.empresa_id', empresaId),
    supabase
      .from('colaboradores')
      .select('fecha_ingreso, fecha_salida')
      .eq('empresa_id', empresaId)
      .eq('es_externo', false)
      .gte('fecha_ingreso', iso(hace(18))),
  ]);

  const vs = (vacantes ?? []) as any[];
  const cerradas = vs.filter((v) => v.estado === 'cerrada' && v.fecha_cierre && v.fecha_cierre >= desde12);
  const dias = cerradas.map((v) => (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_apertura).getTime()) / 86400000).filter((d) => d >= 0);

  const ps = (postulaciones ?? []) as any[];
  const porFuente = new Map<string, { postulaciones: number; contratadas: number }>();
  for (const p of ps) {
    const k = p.candidato?.origen ?? 'manual';
    const a = porFuente.get(k) ?? { postulaciones: 0, contratadas: 0 };
    a.postulaciones += 1;
    if (p.etapa === 'contratado') a.contratadas += 1;
    porFuente.set(k, a);
  }

  const mas = (fecha: string, meses: number) => {
    const d = new Date(fecha + 'T00:00:00');
    d.setMonth(d.getMonth() + meses);
    return d;
  };
  const hoy = new Date();
  const ing = (ingresos ?? []) as any[];

  const cohortePrueba = ing.filter((c) => c.fecha_ingreso >= desde12 && mas(c.fecha_ingreso, 2) <= hoy);
  const superaron = cohortePrueba.filter((c) => !c.fecha_salida || new Date(c.fecha_salida + 'T00:00:00') >= mas(c.fecha_ingreso, 2)).length;

  const cohorteTemprana = ing.filter((c) => mas(c.fecha_ingreso, 6) <= hoy);
  const salieronPronto = cohorteTemprana.filter((c) => c.fecha_salida && new Date(c.fecha_salida + 'T00:00:00') <= mas(c.fecha_ingreso, 6)).length;

  return {
    vacantesAbiertas: vs.filter((v) => v.estado === 'abierta').length,
    vacantesCerradas12m: cerradas.length,
    diasPromedioCierre: dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null,
    postulaciones: ps.length,
    contratadas: ps.filter((p) => p.etapa === 'contratado').length,
    fuentes: [...porFuente.entries()].map(([k, v]) => ({ fuente: ETIQUETA_FUENTE[k] ?? k, ...v })).sort((a, b) => b.postulaciones - a.postulaciones),
    efectividadContratacion: { pct: pct(superaron, cohortePrueba.length), base: cohortePrueba.length },
    rotacionTemprana: { pct: pct(salieronPronto, cohorteTemprana.length), base: cohorteTemprana.length, salieron: salieronPronto },
    noDisponible: [
      'Fuentes de reclutamiento más finas (LinkedIn, referidos, bolsas de empleo): hoy solo se distingue entre formulario público e ingreso manual.',
    ],
  };
}

/** Indicadores del plan de trabajo anual del año en curso (se alimentan solos de las actividades ejecutadas). */
export async function calcularIndicadoresPlan(empresaId: string) {
  const supabase = createClient();
  const anio = new Date().getFullYear();
  const { data } = await supabase
    .from('plan_trabajo_actividades')
    .select('tipo, sistema, estado, fecha_programada, horas, personas_objetivo, personas_alcanzadas, presupuesto_estimado, presupuesto_ejecutado')
    .eq('empresa_id', empresaId)
    .gte('fecha_programada', `${anio}-01-01`)
    .lte('fecha_programada', `${anio}-12-31`);
  const filas = ((data ?? []) as any[]).map((a) => ({
    ...a,
    horas: a.horas != null ? Number(a.horas) : null,
    presupuesto_estimado: a.presupuesto_estimado != null ? Number(a.presupuesto_estimado) : null,
    presupuesto_ejecutado: a.presupuesto_ejecutado != null ? Number(a.presupuesto_ejecutado) : null,
  }));
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    anio,
    general: resumirPlan(filas, hoy),
    formacion: resumirPlan(filas.filter((a) => a.sistema === 'formacion' || ['capacitacion', 'induccion_reinduccion'].includes(a.tipo)), hoy),
    sst: resumirPlan(filas.filter((a) => a.sistema === 'sg_sst'), hoy),
  };
}
