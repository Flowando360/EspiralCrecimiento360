/**
 * Índice de Madurez de un proceso (0-100%): 5 criterios de 20 puntos cada
 * uno, diseñados con Nexus para el Bloque 1 del módulo de Procesos. Se
 * activó cuando los 5 insumos ya existían en la plataforma (caracterización,
 * indicadores, riesgos con ciclo, documentos, ACPM).
 */
export interface DatosMadurezProceso {
  caracterizacionCompleta: boolean; // tiene al menos 1 entrada + 1 actividad + 1 salida
  indicadorConMedicionReciente: boolean; // algún indicador con medición en los últimos 6 meses
  riesgoActualizadoReciente: boolean; // algún riesgo del proceso revisado en los últimos 6 meses
  documentosVigentes: number; // cuántos documentos vigentes tiene el proceso
  acpmVencidas: number; // ACPM con fecha de compromiso vencida y no cerradas
}

export interface ResultadoMadurez {
  puntaje: number;
  criterios: { etiqueta: string; cumple: boolean }[];
}

export function calcularIndiceMadurez(d: DatosMadurezProceso): ResultadoMadurez {
  const criterios = [
    { etiqueta: 'Caracterización completa', cumple: d.caracterizacionCompleta },
    { etiqueta: 'Indicador con medición reciente', cumple: d.indicadorConMedicionReciente },
    { etiqueta: 'Riesgos actualizados (<6 meses)', cumple: d.riesgoActualizadoReciente },
    { etiqueta: 'Documentos vigentes', cumple: d.documentosVigentes > 0 },
    { etiqueta: 'Sin ACPM vencidas', cumple: d.acpmVencidas === 0 },
  ];
  return { puntaje: criterios.filter((c) => c.cumple).length * 20, criterios };
}

export function fechaDentroDeMeses(fecha: string | null, meses: number): boolean {
  if (!fecha) return false;
  const limite = new Date();
  limite.setMonth(limite.getMonth() - meses);
  return new Date(fecha) >= limite;
}
