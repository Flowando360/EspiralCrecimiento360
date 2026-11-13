/**
 * Copia al checklist de un colaborador (colaborador_induccion_items) los
 * puntos de induccion_items que le aplican, sin duplicar los que ya tenga
 * asignados. Se usa al dar de alta a alguien (comunes + específicos de su
 * cargo) y al cambiarle el cargo internamente (solo los específicos del
 * cargo nuevo — ya pasó por la parte común la primera vez).
 */
export async function asignarItemsInduccion(
  supabase: any,
  colaboradorId: string,
  empresaId: string,
  cargoId: string,
  incluirComunes: boolean
) {
  let query = supabase.from('induccion_items').select('id, curso_id').eq('empresa_id', empresaId).eq('activo', true);
  query = incluirComunes ? query.or(`cargo_id.eq.${cargoId},cargo_id.is.null`) : query.eq('cargo_id', cargoId);
  const { data: itemsAplicables } = await query;
  if (!itemsAplicables || itemsAplicables.length === 0) return 0;

  const { data: yaAsignados } = await supabase
    .from('colaborador_induccion_items')
    .select('item_id')
    .eq('colaborador_id', colaboradorId);
  const yaAsignadosIds = new Set((yaAsignados ?? []).map((i: { item_id: string }) => i.item_id));

  const nuevos = itemsAplicables
    .filter((it: { id: string }) => !yaAsignadosIds.has(it.id))
    .map((it: { id: string }) => ({ colaborador_id: colaboradorId, item_id: it.id }));

  if (nuevos.length === 0) return 0;

  const { error } = await supabase.from('colaborador_induccion_items').insert(nuevos);
  if (error) throw new Error(error.message);

  // Los puntos que se cumplen con un curso le asignan ese curso a la persona (si aún no lo tiene).
  // Un fallo aquí no debe impedir el alta: la inducción ya quedó asignada.
  try {
    const nuevosIds = new Set(nuevos.map((n: { item_id: string }) => n.item_id));
    const cursosIds = Array.from(
      new Set(
        itemsAplicables
          .filter((it: { id: string; curso_id: string | null }) => nuevosIds.has(it.id) && it.curso_id)
          .map((it: { curso_id: string }) => it.curso_id)
      )
    ) as string[];
    if (cursosIds.length > 0) {
      const { data: yaTiene } = await supabase.from('nexa_rutas_formacion').select('curso_id').eq('colaborador_id', colaboradorId).in('curso_id', cursosIds);
      const tiene = new Set((yaTiene ?? []).map((r: { curso_id: string }) => r.curso_id));
      const faltan = cursosIds.filter((c) => !tiene.has(c)).map((c) => ({ colaborador_id: colaboradorId, curso_id: c }));
      if (faltan.length > 0) await supabase.from('nexa_rutas_formacion').insert(faltan);
    }
  } catch {
    /* se puede asignar el curso a mano desde Formación */
  }
  return nuevos.length;
}
