/** Bloques de la valoración que responde un cliente interno: solo lo que puede observar de quien le presta un servicio. */
export const BLOQUES_CLIENTE_INTERNO = ['competencias_funcionales', 'roles_y_funciones'] as const;

export function bloquesParaTipo(tipo: string | null | undefined): readonly string[] | null {
  return tipo === 'cliente_interno' ? BLOQUES_CLIENTE_INTERNO : null;
}
