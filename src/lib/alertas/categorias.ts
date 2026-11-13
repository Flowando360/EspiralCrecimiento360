/** Agrupa los tipos de alerta en categorías para filtrarlas (informe de Luisa 2.4). */
export const CATEGORIAS_ALERTA = [
  { clave: 'contractual', label: 'Contractual', tipos: ['contrato_vencimiento', 'periodo_prueba_fin'] },
  { clave: 'sst', label: 'SST', tipos: ['sst_examen_medico', 'sst_certificacion', 'sst_induccion', 'sst_epp'] },
  { clave: 'desempeno', label: 'Desempeño', tipos: ['ciclo_evaluacion'] },
  { clave: 'formacion', label: 'Formación', tipos: ['formacion_vencimiento'] },
  { clave: 'dotacion', label: 'Dotación', tipos: ['dotacion_vencimiento', 'dotacion_corte'] },
  { clave: 'bienestar', label: 'Bienestar y cultura', tipos: ['cumpleanos', 'aniversario_ingreso', 'aniversario_bodas', 'baby_shower', 'fecha_especial'] },
] as const;

export function categoriaDeTipo(tipo: string): string {
  return CATEGORIAS_ALERTA.find((c) => (c.tipos as readonly string[]).includes(tipo))?.clave ?? 'otras';
}
