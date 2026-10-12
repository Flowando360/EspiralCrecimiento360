/**
 * Cortes obligatorios de entrega de dotación (Código Sustantivo del Trabajo, art. 230).
 *
 * Espejo de las funciones de la migración 0098 (fn_fecha_corte_dotacion,
 * fn_periodo_dotacion_de_fecha, fn_proximo_corte_dotacion). La base de datos es
 * la fuente de verdad: este archivo solo sirve para mostrar el periodo y el
 * vencimiento en el formulario antes de guardar. Las fechas van como
 * 'YYYY-MM-DD', así que se comparan como texto y no hay desfase de zona horaria.
 */

export type CorteDotacion = 'abril' | 'agosto' | 'diciembre';

export const CORTES: { valor: CorteDotacion; etiqueta: string; mes: number; dia: number }[] = [
  { valor: 'abril', etiqueta: 'Abril', mes: 4, dia: 30 },
  { valor: 'agosto', etiqueta: 'Agosto', mes: 8, dia: 31 },
  { valor: 'diciembre', etiqueta: 'Diciembre', mes: 12, dia: 20 },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function fechaCorte(anio: number, corte: CorteDotacion): string {
  const c = CORTES.find((x) => x.valor === corte)!;
  return `${anio}-${pad(c.mes)}-${pad(c.dia)}`;
}

/** Periodo al que pertenece una fecha: hasta el corte inclusive; después del último corte, abril del año siguiente. */
export function periodoDeFecha(fecha: string): { anio: number; corte: CorteDotacion } {
  const anio = Number(fecha.slice(0, 4));
  if (fecha <= fechaCorte(anio, 'abril')) return { anio, corte: 'abril' };
  if (fecha <= fechaCorte(anio, 'agosto')) return { anio, corte: 'agosto' };
  if (fecha <= fechaCorte(anio, 'diciembre')) return { anio, corte: 'diciembre' };
  return { anio: anio + 1, corte: 'abril' };
}

/** Próximo corte estrictamente posterior a la fecha: es el vencimiento de la dotación entregada. */
export function proximoCorte(fecha: string): string {
  const anio = Number(fecha.slice(0, 4));
  const candidatos = [fechaCorte(anio, 'abril'), fechaCorte(anio, 'agosto'), fechaCorte(anio, 'diciembre'), fechaCorte(anio + 1, 'abril')];
  return candidatos.find((f) => f > fecha)!;
}

export function etiquetaPeriodo(anio: number, corte: CorteDotacion): string {
  return `${CORTES.find((c) => c.valor === corte)!.etiqueta} ${anio}`;
}
