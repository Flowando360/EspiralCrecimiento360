/** Catálogos y cálculos del Plan de trabajo anual de Gestión Humana (informe de pruebas, 9.2). */

export const TIPOS_ACTIVIDAD = [
  { value: 'simulacro', label: 'Simulacro' },
  { value: 'pausa_activa', label: 'Pausa activa' },
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'capacitacion', label: 'Capacitación / formación' },
  { value: 'bienestar', label: 'Bienestar (celebración, torneo, integración)' },
  { value: 'induccion_reinduccion', label: 'Inducción / reinducción' },
  { value: 'auditoria_interna', label: 'Auditoría interna' },
  { value: 'reunion_revision', label: 'Revisión por la dirección' },
  { value: 'comite', label: 'Comité (COPASST, convivencia…)' },
  { value: 'medicion', label: 'Medición (clima, desempeño…)' },
  { value: 'otra', label: 'Otra' },
] as const;

export const SISTEMAS = [
  { value: 'sg_sst', label: 'SG-SST' },
  { value: 'iso_9001', label: 'ISO 9001' },
  { value: 'bienestar_clima', label: 'Bienestar y clima' },
  { value: 'formacion', label: 'Formación' },
  { value: 'otro', label: 'Otro' },
] as const;

export const ESTADOS_ACTIVIDAD = [
  { value: 'programada', label: 'Programada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'ejecutada', label: 'Ejecutada' },
  { value: 'reprogramada', label: 'Reprogramada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const;

export const POBLACIONES = [
  { value: 'todos', label: 'Todos los colaboradores' },
  { value: 'area', label: 'Un área' },
  { value: 'cargo', label: 'Un cargo' },
] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number]['value'];
export type SistemaActividad = (typeof SISTEMAS)[number]['value'];
export type EstadoActividad = (typeof ESTADOS_ACTIVIDAD)[number]['value'];
export type PoblacionTipo = (typeof POBLACIONES)[number]['value'];

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const etiqueta = <T extends readonly { value: string; label: string }[]>(lista: T, valor: string | null | undefined) =>
  lista.find((x) => x.value === valor)?.label ?? valor ?? '—';

export interface ActividadResumible {
  tipo: string;
  sistema: string;
  estado: string;
  fecha_programada: string;
  horas: number | null;
  personas_objetivo: number | null;
  personas_alcanzadas: number | null;
  presupuesto_estimado: number | null;
  presupuesto_ejecutado: number | null;
}

/** Una actividad programada cuya fecha ya pasó y que sigue sin ejecutarse está atrasada. */
export function estaAtrasada(a: Pick<ActividadResumible, 'estado' | 'fecha_programada'>, hoy: string): boolean {
  return (a.estado === 'programada' || a.estado === 'en_curso' || a.estado === 'reprogramada') && a.fecha_programada < hoy;
}

/** Semáforo de cumplimiento: verde ≥ 90 %, amarillo ≥ 70 %, rojo por debajo. */
export function semaforoCumplimiento(pct: number | null): 'alto' | 'medio' | 'bajo' | null {
  if (pct == null) return null;
  return pct >= 90 ? 'alto' : pct >= 70 ? 'medio' : 'bajo';
}

const suma = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);

/** Indicadores del plan a la fecha `hoy`. Las canceladas no cuentan en el cumplimiento. */
export function resumirPlan(actividades: ActividadResumible[], hoy: string) {
  const vigentes = actividades.filter((a) => a.estado !== 'cancelada');
  const debidas = vigentes.filter((a) => a.fecha_programada <= hoy || a.estado === 'ejecutada');
  const ejecutadas = vigentes.filter((a) => a.estado === 'ejecutada');
  const atrasadas = vigentes.filter((a) => estaAtrasada(a, hoy));
  const conCobertura = ejecutadas.filter((a) => (a.personas_objetivo ?? 0) > 0);
  const objetivo = suma(conCobertura.map((a) => a.personas_objetivo));
  const alcanzadas = suma(conCobertura.map((a) => Math.min(a.personas_alcanzadas ?? 0, a.personas_objetivo ?? 0)));

  return {
    total: actividades.length,
    programadas: vigentes.length,
    ejecutadas: ejecutadas.length,
    atrasadas: atrasadas.length,
    cumplimientoPct: debidas.length > 0 ? Math.round((ejecutadas.length / debidas.length) * 1000) / 10 : null,
    coberturaPct: objetivo > 0 ? Math.round((alcanzadas / objetivo) * 1000) / 10 : null,
    horasProgramadas: suma(vigentes.map((a) => a.horas)),
    horasEjecutadas: suma(ejecutadas.map((a) => a.horas)),
    presupuestoEstimado: suma(vigentes.map((a) => a.presupuesto_estimado)),
    presupuestoEjecutado: suma(ejecutadas.map((a) => a.presupuesto_ejecutado)),
  };
}

export const formatoPesos = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
