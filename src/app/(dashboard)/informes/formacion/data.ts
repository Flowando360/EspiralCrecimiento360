import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface FilaFormacion {
  id: string;
  colaborador_id: string;
  colaborador_nombre: string;
  curso_titulo: string;
  categoria: string;
  estado: string;
  progreso_pct: number;
  fecha_limite: string | null;
  completado_en: string | null;
}

/**
 * Informe de formación: qué cursos tiene asignados cada colaborador, su
 * estado y avance. admin_th/gerencia ven toda la empresa, líder su equipo,
 * colaborador solo lo propio.
 */
export async function obtenerInformeFormacion(colaboradorIdFiltro?: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { perfil: null, filas: [] as FilaFormacion[] };

  const supabase = createClient();
  const { data } = await supabase
    .from('nexa_rutas_formacion')
    .select(
      `id, estado, progreso_pct, fecha_limite, completado_en,
       colaborador:colaborador_id(id, nombre_completo, empresa_id, lider_id),
       curso:curso_id(titulo, categoria)`
    )
    .order('asignado_en', { ascending: false });

  const filas: FilaFormacion[] = ((data ?? []) as any[])
    .filter((r) => {
      const co = r.colaborador;
      if (!co || co.empresa_id !== perfil.empresa_id) return false;
      if (perfil.rol === 'colaborador') return co.id === perfil.colaborador_id;
      if (perfil.rol === 'lider') return co.lider_id === perfil.colaborador_id || co.id === perfil.colaborador_id;
      return true;
    })
    .filter((r) => !colaboradorIdFiltro || r.colaborador.id === colaboradorIdFiltro)
    .map((r) => ({
      id: r.id,
      colaborador_id: r.colaborador.id,
      colaborador_nombre: r.colaborador.nombre_completo,
      curso_titulo: r.curso?.titulo ?? '—',
      categoria: r.curso?.categoria ?? 'otro',
      estado: r.estado,
      progreso_pct: r.progreso_pct,
      fecha_limite: r.fecha_limite,
      completado_en: r.completado_en,
    }));

  return { perfil, filas };
}
