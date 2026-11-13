import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';
import { coincideEquipo, hayFiltrosEquipo, type FiltrosEquipo } from '@/lib/informes/filtros-equipo';

export interface FilaHistorico {
  cicloId: string;
  cicloNombre: string;
  fechaApertura: string;
  personas: number;
  promedioHacer: number | null;
  promedioDeber: number | null;
  /** Hay resultados, pero son menos que el umbral de anonimato: no se muestra el promedio. */
  protegido?: boolean;
}

/**
 * Histórico comparativo: cómo evolucionó el promedio de Hacer y Deber de un
 * ciclo de evaluación al siguiente. admin_th/gerencia ven toda la empresa,
 * líder solo el histórico de su equipo.
 */
export async function obtenerInformeHistorico(filtros: FiltrosEquipo = {}) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) {
    return { perfil: null, filas: [] as FilaHistorico[], umbral: 5 };
  }

  const supabase = createClient();
  const umbral = await obtenerUmbralAnonimato(perfil.empresa_id);

  let colaboradorIds: string[] | null = null;
  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    const { data: equipo } = await supabase.from('colaboradores').select('id').eq('lider_id', perfil.colaborador_id);
    colaboradorIds = (equipo ?? []).map((c) => c.id).concat(perfil.colaborador_id);
  }

  if (hayFiltrosEquipo(filtros)) {
    const { data: todos } = await supabase
      .from('colaboradores')
      .select('id, lider_id, cargo_id, fecha_ingreso, cargo:cargo_id(proceso_area)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('es_externo', false);
    const coinciden = ((todos ?? []) as any[]).filter((c) => coincideEquipo(c, filtros)).map((c) => c.id as string);
    colaboradorIds = colaboradorIds ? coinciden.filter((id) => colaboradorIds!.includes(id)) : coinciden;
  }

  const { data: ciclos } = await supabase
    .from('ciclos_evaluacion')
    .select('id, nombre, fecha_apertura')
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha_apertura', { ascending: true });

  const filas: FilaHistorico[] = [];
  for (const ciclo of ciclos ?? []) {
    let query = supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, evaluacion:evaluaciones!inner(ciclo_id, colaborador_evaluado_id)')
      .eq('evaluacion.ciclo_id', ciclo.id);
    if (colaboradorIds) query = query.in('evaluacion.colaborador_evaluado_id', colaboradorIds);

    const { data: resultados } = await query;
    const hacer = (resultados ?? []).map((r: any) => r.indice_hacer).filter((v): v is number => v != null);
    const deber = (resultados ?? []).map((r: any) => r.indice_deber).filter((v): v is number => v != null);
    const promedio = (valores: number[]) =>
      valores.length === 0 ? null : Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;

    filas.push({
      cicloId: ciclo.id,
      cicloNombre: ciclo.nombre,
      fechaApertura: ciclo.fecha_apertura,
      personas: resultados?.length ?? 0,
      // Anonimato: con menos personas con dato que el umbral no se muestra el promedio.
      promedioHacer: hacer.length >= umbral ? promedio(hacer) : null,
      promedioDeber: deber.length >= umbral ? promedio(deber) : null,
      protegido: (hacer.length > 0 && hacer.length < umbral) || (deber.length > 0 && deber.length < umbral),
    });
  }

  return { perfil, filas, umbral };
}
