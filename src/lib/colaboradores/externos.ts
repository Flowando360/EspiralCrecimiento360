export const TIPOS_EXTERNO = [
  { value: 'contratista', label: 'Contratista' },
  { value: 'transportador', label: 'Transportador' },
  { value: 'asesor', label: 'Asesor / firma asesora' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'proveedor', label: 'Proveedor de servicio' },
  { value: 'otro', label: 'Otro' },
] as const;

export type TipoExterno = (typeof TIPOS_EXTERNO)[number]['value'];

export const ETIQUETA_TIPO_EXTERNO: Record<string, string> = Object.fromEntries(
  TIPOS_EXTERNO.map((t) => [t.value, t.label])
);

/** Días que faltan para una fecha (negativo si ya pasó). null si no hay fecha. */
export function diasParaFecha(fecha: string | null | undefined): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}
