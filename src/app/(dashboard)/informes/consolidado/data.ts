import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

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
  alertasAbiertas: number;
  alertasCriticas: number;
  porArea: FilaArea[];
}

/**
 * Vista consolidada para Gerencia/Talento Humano: mismos indicadores que ya
 * muestra el dashboard de inicio (v_indicadores_empresa), más un desglose
 * por área — pensado para imprimir/exportar como reporte de junta, no para
 * navegar el día a día.
 */
export async function obtenerInformeConsolidado(): Promise<{ perfil: any; informe: InformeConsolidado | null }> {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'gerencia'].includes(perfil.rol)) return { perfil: null, informe: null };

  const supabase = createClient();

  const [{ data: indicadores }, { data: colaboradoresRaw }, { data: resultadosRaw }] = await Promise.all([
    supabase.from('v_indicadores_empresa').select('*').eq('empresa_id', perfil.empresa_id).maybeSingle(),
    supabase
      .from('colaboradores')
      .select('id, cargo:cargo_id(proceso_area)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .eq('es_externo', false),
    supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
      .order('actualizado_en', { ascending: false }),
  ]);

  const colaboradores = (colaboradoresRaw ?? []) as any[];
  const resultadoPorColaborador = new Map<string, { indice_hacer: number | null; indice_deber: number | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const cid = r.evaluacion?.colaborador_evaluado_id;
    if (!cid || resultadoPorColaborador.has(cid)) continue;
    resultadoPorColaborador.set(cid, { indice_hacer: r.indice_hacer, indice_deber: r.indice_deber });
  }

  const grupos = new Map<string, string[]>();
  for (const co of colaboradores) {
    const area = co.cargo?.proceso_area ?? 'Sin área asignada';
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

  return {
    perfil,
    informe: {
      totalActivos: indicadores?.total_activos ?? 0,
      enProcesoSalida: indicadores?.en_proceso_salida ?? 0,
      promedioHacerEmpresa: indicadores?.promedio_hacer_empresa ?? null,
      promedioDeberEmpresa: indicadores?.promedio_deber_empresa ?? null,
      promedioSaberEmpresa: indicadores?.promedio_saber_empresa ?? null,
      pctAlineacionTalentoRol: indicadores?.pct_alineacion_talento_rol ?? null,
      alertasAbiertas: indicadores?.alertas_abiertas ?? 0,
      alertasCriticas: indicadores?.alertas_criticas ?? 0,
      porArea,
    },
  };
}
