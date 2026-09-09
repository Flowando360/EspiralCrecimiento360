import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface FilaCultura {
  colaborador_id: string;
  colaborador_nombre: string;
  reconocimientos_recibidos: number;
  puntos_totales: number;
  reacciones_dadas: number;
  cursos_cultura_completados: number;
}

/**
 * Informe de cultura y engagement: qué tan presente está cada persona en
 * la vida cultural de la empresa dentro de Nexa — reconocimientos
 * recibidos, participación en el feed (reacciones) y formación de cultura
 * completada. No hay una sola "métrica de cultura" en el sistema, así que
 * este informe combina las señales reales que sí existen, en vez de
 * inventar un puntaje único.
 */
export async function obtenerInformeCultura() {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) {
    return { perfil: null, filas: [] as FilaCultura[] };
  }

  const supabase = createClient();

  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select('id, nombre_completo, usuario_id, lider_id')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo')
    .eq('es_externo', false);

  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    colaboradoresQuery = colaboradoresQuery.eq('lider_id', perfil.colaborador_id);
  }

  const { data: colaboradoresRaw } = await colaboradoresQuery;
  const colaboradores = (colaboradoresRaw ?? []) as any[];
  const colaboradorIds = colaboradores.map((c) => c.id);
  const usuarioIds = colaboradores.map((c) => c.usuario_id).filter(Boolean) as string[];

  if (colaboradorIds.length === 0) return { perfil, filas: [] };

  const [{ data: reconocimientos }, { data: reacciones }, { data: rutasCultura }] = await Promise.all([
    supabase.from('nexa_reconocimientos').select('colaborador_id, puntos').in('colaborador_id', colaboradorIds),
    usuarioIds.length
      ? supabase.from('nexa_feed_reacciones').select('usuario_id').in('usuario_id', usuarioIds)
      : Promise.resolve({ data: [] as { usuario_id: string }[] }),
    supabase
      .from('nexa_rutas_formacion')
      .select('colaborador_id, curso:curso_id!inner(categoria)')
      .in('colaborador_id', colaboradorIds)
      .eq('estado', 'completado')
      .eq('curso.categoria', 'cultura'),
  ]);

  const filas: FilaCultura[] = colaboradores
    .map((co) => {
      const misReconocimientos = (reconocimientos ?? []).filter((r: any) => r.colaborador_id === co.id);
      const misReacciones = (reacciones ?? []).filter((r: any) => r.usuario_id === co.usuario_id);
      const misCursosCultura = (rutasCultura ?? []).filter((r: any) => r.colaborador_id === co.id);

      return {
        colaborador_id: co.id,
        colaborador_nombre: co.nombre_completo,
        reconocimientos_recibidos: misReconocimientos.length,
        puntos_totales: misReconocimientos.reduce((sum: number, r: any) => sum + (r.puntos ?? 0), 0),
        reacciones_dadas: misReacciones.length,
        cursos_cultura_completados: misCursosCultura.length,
      };
    })
    .sort((a, b) => b.puntos_totales - a.puntos_totales);

  return { perfil, filas };
}
