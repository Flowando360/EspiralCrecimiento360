/**
 * Normalización del campo "Área" (cargos.proceso_area).
 *
 * El campo es de texto libre, así que la misma área llegaba escrita como
 * "administrativo", "Administrativo" y "ADMINISTRATIVO" y los informes la
 * contaban como tres áreas distintas (informe de pruebas, hallazgo 6.4).
 * Aquí se define una clave única (sin mayúsculas, tildes ni espacios sobrantes)
 * y una etiqueta canónica para mostrar.
 */

export function claveArea(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Limpia espacios y, si está todo en mayúsculas o todo en minúsculas, deja Mayúscula inicial. */
export function formatearArea(valor: string): string {
  const limpio = valor.replace(/\s+/g, ' ').trim();
  if (!limpio) return limpio;
  const todoMayus = limpio === limpio.toUpperCase();
  const todoMinus = limpio === limpio.toLowerCase();
  if (todoMayus || todoMinus) return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
  return limpio;
}

/**
 * Devuelve una función que mapea cualquier variante de escritura al nombre
 * canónico de esa área dentro de la lista dada (la variante mejor escrita gana).
 */
export function crearNormalizadorAreas(valores: (string | null | undefined)[]): (v: string | null | undefined) => string | null {
  const etiqueta = new Map<string, string>();
  for (const v of valores) {
    if (!v || !v.trim()) continue;
    const k = claveArea(v);
    const limpio = v.replace(/\s+/g, ' ').trim();
    const esMixto = limpio !== limpio.toUpperCase() && limpio !== limpio.toLowerCase();
    // Una variante con mayúsculas/minúsculas mixtas (ya bien escrita) gana sobre las demás.
    if (esMixto && !etiqueta.has(k + '|mixta')) {
      etiqueta.set(k + '|mixta', limpio);
    }
  }
  return (v) => {
    if (!v || !v.trim()) return null;
    const k = claveArea(v);
    return etiqueta.get(k + '|mixta') ?? formatearArea(v);
  };
}

/** Canoniza el área que se va a guardar contra las que ya existen en la empresa. */
export async function canonizarAreaEmpresa(
  supabase: { from: (t: string) => any },
  empresaId: string,
  area: string | null | undefined
): Promise<string | null> {
  if (!area || !area.trim()) return null;
  const { data } = await supabase.from('cargos').select('proceso_area').eq('empresa_id', empresaId).not('proceso_area', 'is', null);
  const existentes = ((data ?? []) as { proceso_area: string }[]).map((r) => r.proceso_area);
  const k = claveArea(area);
  const coincidencia = existentes.find((e) => claveArea(e) === k && e === formatearArea(e));
  return coincidencia ?? formatearArea(area);
}
