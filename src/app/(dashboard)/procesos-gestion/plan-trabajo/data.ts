import { createClient } from '@/lib/supabase/server';

export interface FiltrosPlan {
  anio: number;
  vista: 'plan' | 'formacion' | 'sst';
  sistema?: string;
  tipo?: string;
  estado?: string;
}

export function leerFiltrosPlan(sp: Record<string, string | string[] | undefined> | URLSearchParams): FiltrosPlan {
  const g = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    const t = Array.isArray(v) ? v[0] : v;
    return t && t.trim() ? t.trim() : undefined;
  };
  const anioNum = Number(g('anio'));
  const vista = g('vista');
  return {
    anio: anioNum >= 2000 && anioNum <= 2100 ? anioNum : new Date().getFullYear(),
    vista: vista === 'formacion' || vista === 'sst' ? vista : 'plan',
    sistema: g('sistema'),
    tipo: g('tipo'),
    estado: g('estado'),
  };
}

/** Actividades del año con sus relaciones; la vista «formación» o «SST» es un recorte del mismo registro. */
export async function obtenerActividadesPlan(empresaId: string, f: FiltrosPlan): Promise<any[]> {
  const supabase = createClient();
  let q = supabase
    .from('plan_trabajo_actividades')
    .select(
      `id, nombre, tipo, sistema, fecha_programada, fecha_ejecutada, responsable_id, poblacion_tipo, poblacion_detalle,
       personas_objetivo, personas_alcanzadas, horas, presupuesto_estimado, presupuesto_ejecutado, aliado_id, estado,
       calificacion, notas, adjuntos, acpm_id,
       responsable:responsable_id(nombre_completo), aliado:aliado_id(nombre), acpm:acpm_id(codigo)`
    )
    .eq('empresa_id', empresaId)
    .gte('fecha_programada', `${f.anio}-01-01`)
    .lte('fecha_programada', `${f.anio}-12-31`)
    .order('fecha_programada');

  if (f.vista === 'formacion') q = q.or('sistema.eq.formacion,tipo.in.(capacitacion,induccion_reinduccion)');
  if (f.vista === 'sst') q = q.eq('sistema', 'sg_sst');
  if (f.sistema) q = q.eq('sistema', f.sistema);
  if (f.tipo) q = q.eq('tipo', f.tipo);
  if (f.estado) q = q.eq('estado', f.estado);

  const { data } = await q;
  return (data ?? []) as any[];
}
