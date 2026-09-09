import { createAdminClient } from '@/lib/supabase/server';

/**
 * Punto de integración funcional Espiral de Crecimiento → Nexa (ver
 * ARQUITECTURA.md). Cuando una alerta de tipo SST o de vencimiento de
 * formación se notifica, asigna automáticamente los cursos de esa
 * categoría que tenga configurados el cargo de la persona.
 *
 * Antes esto vivía solo en /api/nexa/disparadores, sin que nada lo
 * invocara — quedaba como asignación 100% manual. Ahora también se llama
 * desde /api/alertas/check (el cron diario), que es lo que lo hace
 * automático de verdad.
 */
const TIPOS_QUE_DISPARAN_FORMACION = ['sst_certificacion', 'sst_examen_medico', 'sst_induccion', 'sst_epp', 'formacion_vencimiento'];

const CATEGORIA_POR_TIPO_ALERTA: Record<string, string> = {
  sst_certificacion: 'alturas',
  sst_examen_medico: 'induccion_sst',
  sst_induccion: 'induccion_sst',
  sst_epp: 'epp',
  formacion_vencimiento: 'induccion_sst',
};

export async function asignarFormacionPorAlerta(alertaId: string) {
  const supabase = createAdminClient();

  const { data: alerta } = await supabase.from('alertas').select('id, colaborador_id, tipo').eq('id', alertaId).maybeSingle();
  if (!alerta) return { ok: false as const, accion: 'ninguna', motivo: 'alerta no encontrada' };
  if (!alerta.colaborador_id) return { ok: false as const, accion: 'ninguna', motivo: 'alerta sin colaborador asociado' };

  if (!TIPOS_QUE_DISPARAN_FORMACION.includes(alerta.tipo)) {
    return { ok: true as const, accion: 'ninguna', motivo: 'tipo de alerta no dispara formación' };
  }

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, cargo_id')
    .eq('id', alerta.colaborador_id)
    .maybeSingle();
  if (!colaborador) return { ok: false as const, accion: 'ninguna', motivo: 'colaborador no encontrado' };

  const categoria = CATEGORIA_POR_TIPO_ALERTA[alerta.tipo];
  if (!categoria) return { ok: true as const, accion: 'ninguna', motivo: 'sin categoría configurada para este tipo de alerta' };

  // Antes esto tomaba "el primer curso del cargo, sin importar cuál" —
  // calculaba la categoría pero nunca la usaba para filtrar. Ahora sí se
  // filtra por la categoría del curso, y se asignan TODOS los que apliquen
  // (no solo uno), sin duplicar los que la persona ya tenga.
  const { data: rutasCargo } = await supabase
    .from('nexa_rutas_por_cargo')
    .select('curso_id, curso:nexa_cursos!inner(categoria)')
    .eq('cargo_id', colaborador.cargo_id)
    .eq('curso.categoria', categoria);

  if (!rutasCargo || rutasCargo.length === 0) {
    return { ok: true as const, accion: 'ninguna', motivo: 'sin curso configurado para este cargo y categoría' };
  }

  const { data: yaAsignados } = await supabase
    .from('nexa_rutas_formacion')
    .select('curso_id')
    .eq('colaborador_id', colaborador.id);
  const yaAsignadosIds = new Set((yaAsignados ?? []).map((r) => r.curso_id as string));

  const nuevos = rutasCargo.filter((r) => !yaAsignadosIds.has(r.curso_id as string));
  if (nuevos.length === 0) {
    return { ok: true as const, accion: 'ninguna', motivo: 'ya tenía asignados todos los cursos de esta categoría' };
  }

  const { data: rutasCreadas, error } = await supabase
    .from('nexa_rutas_formacion')
    .insert(
      nuevos.map((r) => ({
        colaborador_id: colaborador.id,
        curso_id: r.curso_id,
        alerta_origen_id: alerta.id,
        estado: 'asignado',
      }))
    )
    .select('id');

  if (error) return { ok: false as const, accion: 'ninguna', motivo: error.message };

  await supabase
    .from('alertas')
    .update({ nexa_ruta_formacion_disparada_id: rutasCreadas![0]!.id })
    .eq('id', alerta.id);

  return { ok: true as const, accion: 'curso_asignado' as const, cursosAsignados: rutasCreadas!.length };
}
