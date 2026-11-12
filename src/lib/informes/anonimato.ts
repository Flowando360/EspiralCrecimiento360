import { createClient } from '@/lib/supabase/server';

/** Mínimo por defecto de personas con dato para mostrar el promedio de un grupo. */
export const UMBRAL_ANONIMATO_POR_DEFECTO = 5;

/** Umbral de anonimato de resultados agregados de la empresa (Administración → Configuración). */
export async function obtenerUmbralAnonimato(empresaId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('empresas').select('umbral_anonimato_agregados').eq('id', empresaId).maybeSingle();
    const n = Number((data as any)?.umbral_anonimato_agregados);
    return Number.isFinite(n) && n >= 2 ? n : UMBRAL_ANONIMATO_POR_DEFECTO;
  } catch {
    return UMBRAL_ANONIMATO_POR_DEFECTO;
  }
}

/** ¿El grupo tiene suficientes personas con dato para mostrar su promedio sin exponer a nadie? */
export function suficientePrivacidad(personasConDato: number, umbral: number): boolean {
  return personasConDato >= umbral;
}

/** Promedio de un grupo, o null si no alcanza el umbral. */
export function promedioProtegido(valores: number[], umbral: number): number | null {
  if (valores.length < umbral) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;
}
