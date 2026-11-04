import type { EstadoColaborador } from '@/types/colaborador';

/**
 * Estados que cuentan como "persona vigente" en la empresa: forman parte del
 * organigrama, pueden ser líderes y se les generan evaluaciones.
 *
 * Antes solo se usaba 'activo' y por eso quien estaba en período de prueba
 * (p. ej. un líder recién ingresado) no aparecía en el organigrama, ni como
 * líder, ni en la generación de Encuentros de Crecimiento.
 * Las vistas SQL v_organigrama_* hacen lo mismo (migración 0110).
 */
export const ESTADOS_VIGENTES: EstadoColaborador[] = ['activo', 'periodo_prueba'];
