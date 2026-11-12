import { crearNormalizadorAreas } from '@/lib/areas';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { coincideEquipo, hayFiltrosEquipo, describirFiltrosEquipo, type FiltrosEquipo } from '@/lib/informes/filtros-equipo';

export interface FilaArea {
  area: string;
  tamano: number;
  promedioHacer: number | null;
  promedioDeber: number | null;
}

export interface InformeConsolidado {
  totalActivos: number;
  enProcesoSalida: number;
  promedioHacerEmpresa: number | null;
  promedioDeberEmpresa: number | null;
  promedioSaberEmpresa: number | null;
  pctAlineacionTalentoRol: number | null;
  alertasAbiertas: number | null;
  alertasCriticas: number | null;
  /** Texto del filtro activo (área / equipo), o null si el informe es de toda la empresa. */
  filtroDescripcion: string | null;
  porArea: FilaArea[];
}

/**
 * Vista consolidada para Gerencia/Talento Humano: mismos indicadores que ya
 * muestra el dashboard de inicio (v_indicadores_empresa), más un desglose
 * por área — pensado para imprimir/exportar como reporte de junta, no para
 * navegar el día a día.
 */
export async function obtenerInformeConsolidado(filtros: FiltrosEquipo = {}): Promise<{ perfil: any; informe: InformeConsolidado | null }> {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'gerencia'].includes(perfil.rol)) return { perfil: null, informe: null };

  const supabase = createClient();

  const [{ data: indicadores }, { data: colaboradoresRaw }, { data: resultadosRaw }] = await Promise.all([
    supabase.from('v_indicadores_empresa').select('*').eq('empresa_id', perfil.empresa_id).maybeSingle(),
    supabase
      .from('colaboradores')
      .select('id, estado, lider_id, lider:lider_id(nombre_completo), cargo:cargo_id(proceso_area)')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ['activo', 'en_proceso_salida'])
      .eq('es_externo', false),
    supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
      .order('actualizado_en', { ascending: false }),
  ]);

  const filtrado = hayFiltrosEquipo(filtros);
  const todosLosVigentes = ((colaboradoresRaw ?? []) as any[]).filter((c) => coincideEquipo(c, filtros));
  const colaboradores = todosLosVigentes.filter((c) => c.estado === 'activo');
  const nombreLider = filtros.liderId ? ((colaboradoresRaw ?? []) as any[]).find((c) => c.lider_id === filtros.liderId)?.lider?.nombre_completo : null;
  const resultadoPorColaborador = new Map<string, { indice_hacer: number | null; indice_deber: number | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const cid = r.evaluacion?.colaborador_evaluado_id;
    if (!cid || resultadoPorColaborador.has(cid)) continue;
    resultadoPorColaborador.set(cid, { indice_hacer: r.indice_hacer, indice_deber: r.indice_deber });
  }

  const normalizarArea = crearNormalizadorAreas(colaboradores.map((c: any) => c.cargo?.proceso_area));
  const grupos = new Map<string, string[]>();
  for (const co of colaboradores) {
    const area = normalizarArea(co.cargo?.proceso_area) ?? 'Sin área asignada';
    if (!grupos.has(area)) grupos.set(area, []);
    grupos.get(area)!.push(co.id);
  }

  function promedio(valores: number[]): number | null {
    if (valores.length === 0) return null;
    return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;
  }

  const porArea: FilaArea[] = [...grupos.entries()]
    .map(([area, ids]) => {
      const hacer = ids.map((id) => resultadoPorColaborador.get(id)?.indice_hacer).filter((v): v is number => v != null);
      const deber = ids.map((id) => resultadoPorColaborador.get(id)?.indice_deber).filter((v): v is number => v != null);
      return { area, tamano: ids.length, promedioHacer: promedio(hacer), promedioDeber: promedio(deber) };
    })
    .sort((a, b) => a.area.localeCompare(b.area));

  const idsFiltrados = colaboradores.map((c) => c.id as string);
  const hacerFiltrado = promedio(idsFiltrados.map((id) => resultadoPorColaborador.get(id)?.indice_hacer).filter((v): v is number => v != null));
  const deberFiltrado = promedio(idsFiltrados.map((id) => resultadoPorColaborador.get(id)?.indice_deber).filter((v): v is number => v != null));

  return {
    perfil,
    informe: {
      filtroDescripcion: describirFiltrosEquipo(filtros, nombreLider),
      totalActivos: filtrado ? colaboradores.length : indicadores?.total_activos ?? 0,
      enProcesoSalida: filtrado ? todosLosVigentes.filter((c) => c.estado === 'en_proceso_salida').length : indicadores?.en_proceso_salida ?? 0,
      promedioHacerEmpresa: filtrado ? hacerFiltrado : indicadores?.promedio_hacer_empresa ?? null,
      promedioDeberEmpresa: filtrado ? deberFiltrado : indicadores?.promedio_deber_empresa ?? null,
      // Estos tres solo existen a nivel empresa: con un filtro activo no se muestran.
      promedioSaberEmpresa: filtrado ? null : indicadores?.promedio_saber_empresa ?? null,
      pctAlineacionTalentoRol: filtrado ? null : indicadores?.pct_alineacion_talento_rol ?? null,
      alertasAbiertas: filtrado ? null : indicadores?.alertas_abiertas ?? 0,
      alertasCriticas: filtrado ? null : indicadores?.alertas_criticas ?? 0,
      porArea,
    },
  };
}
