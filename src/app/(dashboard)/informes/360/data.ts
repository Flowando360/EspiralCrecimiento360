import { createClient } from '@/lib/supabase/server';
import { getPerfilActual, type PerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface DetalleEvaluador {
  dimension: 'hacer' | 'deber';
  tipo_evaluador: string;
  promedio: number;
  total_respuestas: number;
}

export interface Informe360 {
  colaborador: {
    id: string;
    nombre_completo: string;
    cargo_nombre: string | null;
    area: string | null;
    lider_nombre: string | null;
    fecha_ingreso: string;
  };
  ciclo_nombre: string | null;
  resultado: {
    indice_hacer: number | null;
    indice_deber: number | null;
    semaforo_hacer: string | null;
    semaforo_deber: string | null;
    brecha_hacer: number | null;
    brecha_deber: number | null;
  } | null;
  detallePorEvaluador: DetalleEvaluador[];
  saber: {
    porcentaje_cumplimiento: number | null;
    total_items: number;
    items_cumple: number;
    items_parcial: number;
    items_pendiente: number;
  } | null;
  ser: {
    talentos_naturales: string | null;
    proposito: string | null;
    etapa_evolucion_personal: string | null;
    temperamento: string | null;
    motivaciones_profundas: string | null;
    manejo_emocional: string | null;
    fecha_aplicacion: string;
  } | null;
}

/**
 * Trae el Informe 360° de UNA persona, con el mismo alcance por rol que ya
 * usa el resto del sistema: admin_th cualquiera de su empresa, líder solo
 * sus reportes directos, colaborador solo el propio. Se comparte entre la
 * pantalla y los dos endpoints de descarga.
 */
export async function obtenerInforme360(colaboradorId: string) {
  const perfil = await getPerfilActual();
  if (!perfil) return { perfil: null as PerfilActual | null, informe: null as Informe360 | null };

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select(
      `id, nombre_completo, fecha_ingreso, empresa_id, lider_id,
       cargo:cargo_id(nombre, proceso_area),
       lider:lider_id(nombre_completo)`
    )
    .eq('id', colaboradorId)
    .maybeSingle();

  const co = colaborador as any;
  if (!co || co.empresa_id !== perfil.empresa_id) {
    return { perfil, informe: null };
  }

  const autorizado =
    perfil.rol === 'admin_th' ||
    (perfil.rol === 'lider' && co.lider_id === perfil.colaborador_id) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === co.id);

  if (!autorizado) return { perfil, informe: null };

  const [{ data: evaluacion }, { data: saber }, { data: ser }] = await Promise.all([
    supabase
      .from('evaluaciones')
      .select(
        `id, ciclo:ciclo_id(nombre),
         resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber, actualizado_en)`
      )
      .eq('colaborador_evaluado_id', colaboradorId)
      .order('created_at', { ascending: false }),
    supabase.from('v_saber_cumplimiento').select('*').eq('colaborador_id', colaboradorId).maybeSingle(),
    supabase
      .from('guia_del_flow')
      .select('*')
      .eq('colaborador_id', colaboradorId)
      .order('fecha_aplicacion', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // La más reciente con resultado calculado (no necesariamente la primera del arreglo).
  const evalConResultado = ((evaluacion ?? []) as any[])
    .filter((e) => e.resultado?.[0])
    .sort(
      (a, b) =>
        new Date(b.resultado[0].actualizado_en).getTime() - new Date(a.resultado[0].actualizado_en).getTime()
    )[0];

  let detallePorEvaluador: DetalleEvaluador[] = [];
  if (evalConResultado) {
    const { data } = await supabase
      .from('v_360_detalle_evaluador')
      .select('*')
      .eq('evaluacion_id', evalConResultado.id);
    detallePorEvaluador = (data ?? []) as DetalleEvaluador[];
  }

  const informe: Informe360 = {
    colaborador: {
      id: co.id,
      nombre_completo: co.nombre_completo,
      cargo_nombre: co.cargo?.nombre ?? null,
      area: co.cargo?.proceso_area ?? null,
      lider_nombre: co.lider?.nombre_completo ?? null,
      fecha_ingreso: co.fecha_ingreso,
    },
    ciclo_nombre: evalConResultado?.ciclo?.nombre ?? null,
    resultado: evalConResultado?.resultado?.[0] ?? null,
    detallePorEvaluador,
    saber: saber
      ? {
          porcentaje_cumplimiento: saber.porcentaje_cumplimiento,
          total_items: saber.total_items ?? 0,
          items_cumple: saber.items_cumple ?? 0,
          items_parcial: saber.items_parcial ?? 0,
          items_pendiente: saber.items_pendiente ?? 0,
        }
      : null,
    ser: ser ?? null,
  };

  return { perfil, informe };
}
