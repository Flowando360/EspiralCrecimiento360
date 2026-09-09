import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

/**
 * Abre un ciclo de evaluación y genera las evaluaciones de las personas
 * dentro del alcance pedido:
 *   - scope: 'todos'         -> todos los colaboradores activos de la empresa
 *   - scope: 'equipo'        -> todos los colaboradores cuyo lider_id = liderId
 *   - scope: 'colaborador'   -> un único colaboradorId
 *
 * Para cada persona:
 *   1. Genera evaluacion_tareas (autoevaluación/líder/pares/colab. a cargo)
 *      leyendo v_organigrama_evaluadores (igual que antes).
 *   2. Genera evaluacion_items: un ítem por cada competencia aplicable de
 *      los bloques Organizacionales, Funcionales, Liderazgo y Cultura, MÁS
 *      un ítem por cada función principal de su cargo (bloque Roles y
 *      Funciones) — así el bloque 4 sale directo del perfil de cargo, tal
 *      como se pidió ("la evaluación de desempeño se genera a partir del
 *      perfil del cargo").
 *
 * Los evaluacion_items quedan editables después (agregar/quitar) sin tocar
 * el catálogo general ni otras evaluaciones — ver PATCH más abajo.
 */
export async function POST(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') {
    return NextResponse.json({ error: 'Solo Talento Humano puede generar Encuentros de Crecimiento' }, { status: 403 });
  }

  const { cicloId, scope, liderId, colaboradorId } = await req.json();
  if (!cicloId || !scope) {
    return NextResponse.json({ error: 'cicloId y scope son requeridos' }, { status: 400 });
  }

  const supabase = createClient();

  // ── 1. Resolver el conjunto de colaboradores dentro del alcance pedido ──
  let query = supabase
    .from('colaboradores')
    .select('id, cargo_id, cargo:cargos(tiene_personal_a_cargo)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo')
    .eq('es_externo', false);

  if (scope === 'equipo') {
    if (!liderId) return NextResponse.json({ error: 'liderId requerido para scope=equipo' }, { status: 400 });
    query = query.eq('lider_id', liderId);
  } else if (scope === 'colaborador') {
    if (!colaboradorId) return NextResponse.json({ error: 'colaboradorId requerido para scope=colaborador' }, { status: 400 });
    query = query.eq('id', colaboradorId);
  } else if (scope !== 'todos') {
    return NextResponse.json({ error: "scope debe ser 'todos', 'equipo' o 'colaborador'" }, { status: 400 });
  }

  const { data: colaboradores } = await query;
  const { data: evaluadores } = await supabase.from('v_organigrama_evaluadores').select('*');

  let evaluacionesCreadas = 0;
  let tareasCreadas = 0;
  let itemsCreados = 0;

  for (const colaborador of colaboradores ?? []) {
    const tenePersonalACargo = Boolean((colaborador.cargo as any)?.tiene_personal_a_cargo);

    // Ítems que TH decidió NO incluir para el cargo de esta persona (ver
    // /administracion/cargos/[id]/items-evaluacion). Vacío = se incluye todo.
    const { data: excluidos } = await supabase
      .from('cargo_items_evaluacion_excluidos')
      .select('competencia_id, cargo_funcion_id')
      .eq('cargo_id', colaborador.cargo_id);
    const competenciasExcluidas = new Set((excluidos ?? []).map((e) => e.competencia_id).filter(Boolean));
    const funcionesExcluidas = new Set((excluidos ?? []).map((e) => e.cargo_funcion_id).filter(Boolean));

    // ── evaluación + tareas (igual que antes) ──
    const { data: evaluacion, error: errEval } = await supabase
      .from('evaluaciones')
      .upsert(
        { ciclo_id: cicloId, colaborador_evaluado_id: colaborador.id, tenia_personal_a_cargo: tenePersonalACargo },
        { onConflict: 'ciclo_id,colaborador_evaluado_id' }
      )
      .select('id')
      .single();

    if (errEval || !evaluacion) continue;
    evaluacionesCreadas++;

    const asignaciones = (evaluadores ?? []).filter((e: any) => e.colaborador_id === colaborador.id);
    for (const asignacion of asignaciones) {
      const { error: errTarea } = await supabase.from('evaluacion_tareas').upsert(
        {
          evaluacion_id: evaluacion.id,
          evaluador_colaborador_id: (asignacion as any).evaluador_id,
          tipo_evaluador: (asignacion as any).tipo_evaluador,
        },
        { onConflict: 'evaluacion_id,evaluador_colaborador_id' }
      );
      if (!errTarea) tareasCreadas++;
    }

    // ── 2. Ítems de evaluación: catálogo de competencias aplicables ──
    const { data: competencias } = await supabase
      .from('competencias')
      .select('id, nombre, descripcion_que_evalua, bloque, solo_con_personal_a_cargo, orden')
      .eq('empresa_id', perfil.empresa_id)
      .eq('activo', true)
      .not('bloque', 'is', null);

    const competenciasAplicables = (competencias ?? []).filter(
      (c: any) => (!c.solo_con_personal_a_cargo || tenePersonalACargo) && !competenciasExcluidas.has(c.id)
    );

    for (const comp of competenciasAplicables) {
      const { error } = await supabase.from('evaluacion_items').upsert(
        {
          evaluacion_id: evaluacion.id,
          bloque: (comp as any).bloque,
          origen: 'competencia',
          competencia_id: comp.id,
          titulo: comp.nombre,
          descripcion: comp.descripcion_que_evalua,
          orden: comp.orden ?? 0,
        },
        { onConflict: 'evaluacion_id,competencia_id' }
      );
      if (!error) itemsCreados++;
    }

    // ── 3. Ítems del bloque "Roles y Funciones": desde el perfil de cargo ──
    const { data: funciones } = await supabase
      .from('cargo_funciones_principales')
      .select('id, funcion, resultado_esperado, orden')
      .eq('cargo_id', colaborador.cargo_id)
      .order('orden');

    for (const fn of (funciones ?? []).filter((f) => !funcionesExcluidas.has(f.id))) {
      const { error } = await supabase.from('evaluacion_items').upsert(
        {
          evaluacion_id: evaluacion.id,
          bloque: 'roles_y_funciones',
          origen: 'funcion_cargo',
          cargo_funcion_id: fn.id,
          titulo: fn.funcion,
          descripcion: fn.resultado_esperado,
          orden: fn.orden ?? 0,
        },
        { onConflict: 'evaluacion_id,cargo_funcion_id' }
      );
      if (!error) itemsCreados++;
    }

    // Si TH excluyó un ítem DESPUÉS de que esta evaluación ya se había
    // generado (re-generar un ciclo abierto), desactivarlo ahora — nunca
    // toca los agregados a mano (agregado_manualmente), esos son decisión
    // puntual de TH sobre esta evaluación específica, no del catálogo.
    if (competenciasExcluidas.size > 0) {
      await supabase
        .from('evaluacion_items')
        .update({ activo: false })
        .eq('evaluacion_id', evaluacion.id)
        .in('competencia_id', Array.from(competenciasExcluidas))
        .eq('agregado_manualmente', false);
    }
    if (funcionesExcluidas.size > 0) {
      await supabase
        .from('evaluacion_items')
        .update({ activo: false })
        .eq('evaluacion_id', evaluacion.id)
        .in('cargo_funcion_id', Array.from(funcionesExcluidas))
        .eq('agregado_manualmente', false);
    }
  }

  await supabase.from('ciclos_evaluacion').update({ estado: 'abierto' }).eq('id', cicloId);

  return NextResponse.json({ ok: true, evaluacionesCreadas, tareasCreadas, itemsCreados });
}

/**
 * Agregar o quitar un ítem puntual de UNA evaluación ya generada, sin tocar
 * el catálogo general de competencias ni otras evaluaciones (pedido
 * explícito: "el líder de talento humano debe tener la potestad de agregar
 * o quitar ítems que desee sean evaluados").
 *
 * action: 'agregar' | 'desactivar' | 'reactivar'
 */
export async function PATCH(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') {
    return NextResponse.json({ error: 'Solo Talento Humano puede editar ítems del Encuentro de Crecimiento' }, { status: 403 });
  }

  const { action, evaluacionId, itemId, bloque, titulo, descripcion } = await req.json();
  const supabase = createClient();

  if (action === 'agregar') {
    if (!evaluacionId || !bloque || !titulo) {
      return NextResponse.json({ error: 'evaluacionId, bloque y titulo son requeridos' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('evaluacion_items')
      .insert({ evaluacion_id: evaluacionId, bloque, titulo, descripcion, agregado_manualmente: true })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, itemId: data.id });
  }

  if (action === 'desactivar' || action === 'reactivar') {
    if (!itemId) return NextResponse.json({ error: 'itemId requerido' }, { status: 400 });
    const { error } = await supabase
      .from('evaluacion_items')
      .update({ activo: action === 'reactivar' })
      .eq('id', itemId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action debe ser 'agregar', 'desactivar' o 'reactivar'" }, { status: 400 });
}
