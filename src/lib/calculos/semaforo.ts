import type { SemaforoNivel } from '@/types/colaborador';

/**
 * Semáforo de síntesis (sección 10.3 del documento):
 *   Alto  >= 4.0
 *   Medio >= 3.5 y < 4.0
 *   Bajo  < 3.5
 * Se aplica de forma idéntica e independiente a Hacer y a Deber.
 */
export function calcularSemaforo(indice: number | null | undefined): SemaforoNivel | null {
  if (indice === null || indice === undefined) return null;
  if (indice >= 4.0) return 'alto';
  if (indice >= 3.5) return 'medio';
  return 'bajo';
}
