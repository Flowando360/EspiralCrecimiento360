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
  let query = supabase.from('induccion_items').select('id').eq('empresa_id', empresaId).eq('activo', true);
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
  return nuevos.length;
}
