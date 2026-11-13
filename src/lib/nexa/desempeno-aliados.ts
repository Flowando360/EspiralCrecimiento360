/**
 * Desempeño de cada aliado a partir de las actividades del Plan de trabajo anual que ejecuta (informe de Luisa 8.4).
 * Funciones puras: reciben las filas ya leídas.
 */

export interface ActividadAliado {
  aliado_id: string | null;
  estado: string;
  horas: number | null;
  personas_objetivo: number | null;
  personas_alcanzadas: number | null;
  presupuesto_estimado: number | null;
  presupuesto_ejecutado: number | null;
  calificacion: number | null;
}

export interface DesempenoAliado {
  aliadoId: string;
  actividades: number;
  ejecutadas: number;
  horas: number;
  personasAlcanzadas: number;
  coberturaPct: number | null;
  presupuestoEjecutado: number;
  costoPorPersona: number | null;
  calificacionPromedio: number | null;
  cumplimientoPct: number | null;
}

const redondear = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function calcularDesempenoAliados(actividades: ActividadAliado[]): Map<string, DesempenoAliado> {
  const grupos = new Map<string, ActividadAliado[]>();
  for (const a of actividades) {
    if (!a.aliado_id || a.estado === 'cancelada') continue;
    grupos.set(a.aliado_id, [...(grupos.get(a.aliado_id) ?? []), a]);
  }
  const resultado = new Map<string, DesempenoAliado>();
  for (const [aliadoId, filas] of grupos) {
    const ejecutadas = filas.filter((f) => f.estado === 'ejecutada');
    const objetivo = ejecutadas.reduce((s, f) => s + (f.personas_objetivo ?? 0), 0);
    const alcanzadas = ejecutadas.reduce((s, f) => s + (f.personas_alcanzadas ?? 0), 0);
    const gasto = ejecutadas.reduce((s, f) => s + (f.presupuesto_ejecutado ?? 0), 0);
    const notas = ejecutadas.map((f) => f.calificacion).filter((v): v is number => v != null);
    resultado.set(aliadoId, {
      aliadoId,
      actividades: filas.length,
      ejecutadas: ejecutadas.length,
      horas: redondear(ejecutadas.reduce((s, f) => s + (f.horas ?? 0), 0)),
      personasAlcanzadas: alcanzadas,
      coberturaPct: objetivo > 0 ? Math.round((alcanzadas / objetivo) * 100) : null,
      presupuestoEjecutado: gasto,
      costoPorPersona: alcanzadas > 0 && gasto > 0 ? Math.round(gasto / alcanzadas) : null,
      calificacionPromedio: notas.length ? redondear(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
      cumplimientoPct: filas.length ? Math.round((ejecutadas.length / filas.length) * 100) : null,
    });
  }
  return resultado;
}
