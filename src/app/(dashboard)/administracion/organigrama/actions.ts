'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';

/**
 * Cambia el líder directo de un colaborador. Los ciclos ya abiertos no se
 * ven afectados: evaluacion_tareas se genera como una foto fija al abrir el
 * ciclo (ver POST /api/evaluaciones), así que este cambio solo se refleja
 * en el próximo ciclo que se abra.
 */
export async function actualizarLiderDirecto(colaboradorId: string, liderId: string | null) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  if (liderId === colaboradorId) {
    return { ok: false as const, error: 'Una persona no puede ser su propio líder' };
  }

  const supabase = createClient();

  if (liderId) {
    // Evitar ciclos: el nuevo líder no puede ser alguien que, directa o
    // indirectamente, ya reporta a este colaborador (si no, ambos
    // desaparecerían del árbol del organigrama).
    const { data: colaboradores } = await supabase
      .from('colaboradores')
      .select('id, lider_id')
      .eq('empresa_id', perfil.empresa_id);

    const liderDe = new Map((colaboradores ?? []).map((c: any) => [c.id as string, c.lider_id as string | null]));
    let actual: string | null = liderId;
    while (actual) {
      if (actual === colaboradorId) {
        return {
          ok: false as const,
          error: 'Ese cambio crearía un ciclo en el organigrama: la persona elegida ya reporta, directa o indirectamente, al colaborador que estás editando.',
        };
      }
      actual = liderDe.get(actual) ?? null;
    }
  }

  const { error } = await supabase
    .from('colaboradores')
    .update({ lider_id: liderId })
    .eq('id', colaboradorId)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/administracion/organigrama');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}

/**
 * Define el EQUIPO A CARGO de un líder de una sola vez (admin_th): las personas
 * marcadas pasan a tener a este líder como líder directo; las que ya estaban a
 * su cargo y se desmarcan quedan sin líder (hay que reubicarlas).
 *
 * Es la vista inversa de actualizarLiderDirecto: allí se elige el líder de una
 * persona; aquí se eligen las personas de un líder. Las dos escriben el mismo
 * dato (colaboradores.lider_id), así que siempre quedan consistentes.
 */
export async function asignarEquipoLider(liderId: string, idsEquipo: string[]) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: todos } = await supabase
    .from('colaboradores')
    .select('id, lider_id, nombre_completo')
    .eq('empresa_id', perfil.empresa_id);

  const porId = new Map((todos ?? []).map((c: any) => [c.id as string, c]));
  if (!porId.has(liderId)) return { ok: false as const, error: 'Líder no encontrado' };

  const nuevos = Array.from(new Set(idsEquipo));
  if (nuevos.some((id) => !porId.has(id))) return { ok: false as const, error: 'Hay personas que no pertenecen a tu empresa' };
  if (nuevos.includes(liderId)) return { ok: false as const, error: 'Una persona no puede ser su propio líder' };

  // Evitar ciclos: nadie de la lista puede ser jefe (directo o indirecto) de este líder.
  const jefes = new Set<string>();
  let actual: string | null = (porId.get(liderId) as any).lider_id ?? null;
  while (actual && !jefes.has(actual)) {
    jefes.add(actual);
    actual = (porId.get(actual) as any)?.lider_id ?? null;
  }
  const cicloCon = nuevos.find((id) => jefes.has(id));
  if (cicloCon) {
    return {
      ok: false as const,
      error: `${(porId.get(cicloCon) as any).nombre_completo} es jefe de este líder (directo o indirecto); no puede quedar a su cargo.`,
    };
  }

  const actuales = (todos ?? []).filter((c: any) => c.lider_id === liderId).map((c: any) => c.id as string);
  const aAgregar = nuevos.filter((id) => !actuales.includes(id));
  const aQuitar = actuales.filter((id) => !nuevos.includes(id));

  if (aAgregar.length > 0) {
    const { error } = await supabase
      .from('colaboradores')
      .update({ lider_id: liderId })
      .in('id', aAgregar)
      .eq('empresa_id', perfil.empresa_id);
    if (error) return { ok: false as const, error: error.message };
  }
  if (aQuitar.length > 0) {
    const { error } = await supabase
      .from('colaboradores')
      .update({ lider_id: null })
      .in('id', aQuitar)
      .eq('empresa_id', perfil.empresa_id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath('/administracion/organigrama');
  revalidatePath('/espiral-crecimiento/organigrama');
  revalidatePath('/espiral-crecimiento/colaboradores');
  return { ok: true as const, agregados: aAgregar.length, quitados: aQuitar.length };
}

/**
 * Agrega un líder funcional o de proyecto a una persona (organigrama matricial). No reemplaza al líder directo: ese sigue
 * mandando en la valoración y los acompañantes.
 */
export async function agregarDependenciaFuncional(input: { colaboradorId: string; liderFuncionalId: string; tipo: 'funcional' | 'proyecto' | 'otro'; detalle?: string }) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  if (!input.colaboradorId || !input.liderFuncionalId) return { ok: false as const, error: 'Elige la persona y su líder funcional' };
  if (input.colaboradorId === input.liderFuncionalId) return { ok: false as const, error: 'Una persona no puede ser su propio líder funcional' };
  if (!['funcional', 'proyecto', 'otro'].includes(input.tipo)) return { ok: false as const, error: 'Tipo inválido' };

  const supabase = createClient() as any;
  const { data: dos } = await supabase.from('colaboradores').select('id, empresa_id, lider_id').in('id', [input.colaboradorId, input.liderFuncionalId]);
  if (!dos || dos.length !== 2 || dos.some((c: any) => c.empresa_id !== perfil.empresa_id)) return { ok: false as const, error: 'Persona no encontrada' };
  const persona = dos.find((c: any) => c.id === input.colaboradorId);
  if (persona?.lider_id === input.liderFuncionalId) return { ok: false as const, error: 'Esa persona ya es su líder directo; el líder funcional debe ser otra' };

  const { error } = await supabase.from('dependencias_funcionales').insert({
    empresa_id: perfil.empresa_id,
    colaborador_id: input.colaboradorId,
    lider_funcional_id: input.liderFuncionalId,
    tipo: input.tipo,
    detalle: input.detalle?.trim() || null,
  });
  if (error) return { ok: false as const, error: error.code === '23505' ? 'Ya está registrada esa dependencia' : error.message };
  revalidatePath('/administracion/organigrama');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}

export async function quitarDependenciaFuncional(id: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('dependencias_funcionales').delete().eq('id', id).eq('empresa_id', perfil.empresa_id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/administracion/organigrama');
  revalidatePath('/espiral-crecimiento/organigrama');
  return { ok: true as const };
}
