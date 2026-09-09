import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface PlanInforme {
  id: string;
  colaborador_nombre: string;
  origen: string;
  brecha_detectada: string;
  accion: string;
  estado: string;
  fecha_compromiso: string | null;
  fecha_cumplimiento: string | null;
  notas: string | null;
}

/**
 * Trae los planes de desarrollo que le corresponde ver al usuario actual,
 * con el mismo alcance por rol que ya usa el resto del sistema: admin_th
 * toda la empresa, líder su equipo directo, colaborador solo lo propio.
 * La comparten la pantalla del informe y los dos endpoints de descarga,
 * para no repetir la regla de permisos en tres lugares distintos.
 */
export async function obtenerPlanesInforme(colaboradorIdFiltro?: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol === 'gerencia') return { perfil: null, planes: [] as PlanInforme[] };

  const supabase = createClient();
  const { data } = await supabase
    .from('planes_desarrollo')
    .select(
      `id, colaborador_id, origen, brecha_detectada, accion, estado, fecha_compromiso,
       fecha_cumplimiento, notas,
       colaborador:colaborador_id(nombre_completo, empresa_id, lider_id)`
    )
    .order('fecha_compromiso', { ascending: true });

  const planes: PlanInforme[] = ((data ?? []) as any[])
    .filter((p) => {
      const co = p.colaborador;
      if (!co || co.empresa_id !== perfil.empresa_id) return false;
      if (perfil.rol === 'colaborador') return p.colaborador_id === perfil.colaborador_id;
      if (perfil.rol === 'lider') return co.lider_id === perfil.colaborador_id;
      return true; // admin_th: toda la empresa
    })
    .filter((p) => !colaboradorIdFiltro || p.colaborador_id === colaboradorIdFiltro)
    .map((p) => ({
      id: p.id,
      colaborador_nombre: p.colaborador.nombre_completo,
      origen: p.origen,
      brecha_detectada: p.brecha_detectada,
      accion: p.accion,
      estado: p.estado,
      fecha_compromiso: p.fecha_compromiso,
      fecha_cumplimiento: p.fecha_cumplimiento,
      notas: p.notas,
    }));

  return { perfil, planes };
}
