import type { TipoContrato } from '@/types/colaborador';

/** Tipos de contrato vigentes en Colombia, en el orden en que se ofrecen en los formularios. */
export const TIPOS_CONTRATO: { value: TipoContrato; label: string }[] = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'fijo', label: 'Término fijo' },
  { value: 'obra_labor', label: 'Obra o labor' },
  { value: 'prestacion_servicios', label: 'Prestación de servicios' },
  { value: 'empleado_mision', label: 'Empleado en misión (temporal / in house)' },
  { value: 'aprendizaje', label: 'Contrato de aprendizaje (término fijo)' },
  { value: 'aprendizaje_lectiva', label: 'Aprendizaje — etapa lectiva' },
  { value: 'aprendizaje_productiva', label: 'Aprendizaje — etapa productiva' },
  { value: 'pasantia', label: 'Pasantía' },
  { value: 'externo', label: 'Externo (no es empleado directo)' },
];

export const VALORES_TIPO_CONTRATO = TIPOS_CONTRATO.map((t) => t.value) as [TipoContrato, ...TipoContrato[]];

/** Texto para el certificado laboral ("contrato de trabajo ..."). */
export const TIPO_CONTRATO_TEXTO: Record<string, string> = {
  indefinido: 'a término indefinido',
  fijo: 'a término fijo',
  obra_labor: 'por obra o labor',
  prestacion_servicios: 'de prestación de servicios',
  empleado_mision: 'como trabajador en misión (empresa de servicios temporales)',
  aprendizaje: 'de aprendizaje',
  aprendizaje_lectiva: 'de aprendizaje (etapa lectiva)',
  aprendizaje_productiva: 'de aprendizaje (etapa productiva)',
  pasantia: 'de pasantía',
  externo: 'externo',
};

/** Tipos de contrato que cuentan con período de prueba legal (Art. 76-80 CST). */
const CON_PRUEBA: TipoContrato[] = ['indefinido', 'fijo', 'obra_labor'];

function sumarMeses(fechaISO: string, meses: number): Date {
  const [a = 0, m = 1, d = 1] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1 + meses, d));
}

/**
 * Fecha en que termina el período de prueba.
 * - Indefinido: 2 meses.
 * - Término fijo: la quinta parte de la duración pactada (días de 360), sin pasar de 2 meses.
 *   Requiere la fecha de terminación; sin ella no se puede calcular.
 * Devuelve null si el contrato no tiene período de prueba o falta algún dato.
 */
export function calcularFinPrueba(
  tipo: TipoContrato,
  fechaIngreso: string,
  fechaFinContrato?: string | null
): { fecha: string; descripcion: string } | null {
  if (!fechaIngreso || !CON_PRUEBA.includes(tipo)) return null;
  const ingreso = new Date(fechaIngreso + 'T00:00:00Z');

  if (tipo === 'fijo') {
    if (!fechaFinContrato) return null;
    const fin = new Date(fechaFinContrato + 'T00:00:00Z');
    const dias = Math.round((fin.getTime() - ingreso.getTime()) / 86400000) + 1;
    if (dias <= 0) return null;
    const diasPrueba = Math.min(Math.floor(dias / 5), 60);
    const fecha = new Date(ingreso.getTime() + (diasPrueba - 1) * 86400000);
    return {
      fecha: fecha.toISOString().slice(0, 10),
      descripcion: `${diasPrueba} días (la quinta parte de ${dias} días, máximo 2 meses)`,
    };
  }

  const fecha = sumarMeses(fechaIngreso, 2);
  return { fecha: fecha.toISOString().slice(0, 10), descripcion: '2 meses desde el ingreso' };
}
