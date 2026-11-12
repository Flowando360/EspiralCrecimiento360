import { createClient } from '@/lib/supabase/server';
import { nivelEfectivo, type NivelCargo } from '@/lib/competencias/nivel-cargo';
import {
  PESOS_POR_DEFECTO,
  calcularIndiceIntegral,
  criteriosBajoUmbral,
  notaConsolidada,
  type CriterioConUmbral,
  type IndiceIntegral,
  type PesosDimensiones,
} from '@/lib/desempeno/indice-integral';

export interface DesempenoIntegral {
  nivelCargo: NivelCargo;
  pesos: PesosDimensiones;
  pesosPersonalizados: boolean;
  saberPct: number | null;
  hacer: number | null;
  deber: number | null;
  integral: IndiceIntegral;
  criteriosCriticos: CriterioConUmbral[];
}

/** Pesos del nivel de cargo de la empresa (o los de por defecto si Talento Humano aún no los ha definido). */
export async function obtenerPesosNivel(supabase: ReturnType<typeof createClient>, empresaId: string, nivel: NivelCargo) {
  const { data } = await supabase.from('ponderacion_dimensiones_nivel').select('peso_saber, peso_hacer, peso_deber').eq('empresa_id', empresaId).eq('nivel_cargo', nivel).maybeSingle();
  if (!data) return { pesos: PESOS_POR_DEFECTO, personalizados: false };
  return { pesos: { saber: Number(data.peso_saber), hacer: Number(data.peso_hacer), deber: Number(data.peso_deber) }, personalizados: true };
}

/**
 * Reúne lo que necesita el índice integral de una persona en un Encuentro de Crecimiento: Hacer y Deber del resultado,
 * Saber vigente, pesos del nivel de su cargo y los criterios que quedaron por debajo de su mínimo crítico.
 */
export async function cargarDesempenoIntegral(params: {
  evaluacionId: string;
  empresaId: string;
  colaboradorId: string;
  cargo: { nivel_cargo?: string | null; tiene_personal_a_cargo?: boolean | null } | null;
  indiceHacer: number | null;
  indiceDeber: number | null;
}): Promise<DesempenoIntegral> {
  const supabase = createClient();
  const nivel = nivelEfectivo(params.cargo?.nivel_cargo, Boolean(params.cargo?.tiene_personal_a_cargo));
  const [{ pesos, personalizados }, { data: saber }, { data: evaluacion }, { data: tareas }] = await Promise.all([
    obtenerPesosNivel(supabase, params.empresaId, nivel),
    supabase.from('v_saber_cumplimiento').select('porcentaje_cumplimiento').eq('colaborador_id', params.colaboradorId).maybeSingle(),
    supabase
      .from('evaluaciones')
      .select('tenia_personal_a_cargo, ciclo:ciclo_id(peso_lider_con_equipo, peso_pares_con_equipo, peso_colaboradores_con_equipo, peso_lider_sin_equipo, peso_pares_sin_equipo)')
      .eq('id', params.evaluacionId)
      .maybeSingle(),
    supabase
      .from('evaluacion_tareas')
      .select('tipo_evaluador, respuestas:respuestas_evaluacion(nota, no_aplica, item:evaluacion_item_id(id, titulo, activo, competencia:competencia_id(umbral_critico, umbral_justificacion)))')
      .eq('evaluacion_id', params.evaluacionId)
      .eq('completada', true),
  ]);

  const saberPct = saber?.porcentaje_cumplimiento != null ? Number(saber.porcentaje_cumplimiento) : null;
  const integral = calcularIndiceIntegral({ saberPct, hacer: params.indiceHacer, deber: params.indiceDeber }, pesos);

  // Pesos de las fuentes del ciclo (mismos que usa el cálculo de Hacer y Deber).
  const ciclo = (Array.isArray((evaluacion as any)?.ciclo) ? (evaluacion as any).ciclo[0] : (evaluacion as any)?.ciclo) ?? {};
  const conEquipo = Boolean((evaluacion as any)?.tenia_personal_a_cargo);
  const pesosFuentes = {
    lider: Number(conEquipo ? ciclo.peso_lider_con_equipo : ciclo.peso_lider_sin_equipo) || 0,
    par: Number(conEquipo ? ciclo.peso_pares_con_equipo : ciclo.peso_pares_sin_equipo) || 0,
    colaborador_a_cargo: conEquipo ? Number(ciclo.peso_colaboradores_con_equipo) || 0 : 0,
  };

  // Notas por criterio (ítem) y fuente, sin contar los «No aplica».
  type AcumItem = { titulo: string; umbral: number | null; justificacion: string | null; notas: { tipoEvaluador: string; nota: number }[] };
  const porItem = new Map<string, AcumItem>();
  for (const t of (tareas ?? []) as any[]) {
    for (const r of t.respuestas ?? []) {
      const item = Array.isArray(r.item) ? r.item[0] : r.item;
      if (!item || item.activo === false || r.no_aplica || r.nota == null) continue;
      const comp = Array.isArray(item.competencia) ? item.competencia[0] : item.competencia;
      const actual: AcumItem = porItem.get(item.id) ?? { titulo: item.titulo, umbral: comp?.umbral_critico ?? null, justificacion: comp?.umbral_justificacion ?? null, notas: [] };
      actual.notas.push({ tipoEvaluador: t.tipo_evaluador, nota: r.nota });
      porItem.set(item.id, actual);
    }
  }
  const conUmbral: CriterioConUmbral[] = Array.from(porItem.values())
    .filter((i) => i.umbral != null)
    .map((i) => ({ titulo: i.titulo, umbral: i.umbral as number, justificacion: i.justificacion, consolidada: notaConsolidada(i.notas, pesosFuentes) }));

  return {
    nivelCargo: nivel,
    pesos,
    pesosPersonalizados: personalizados,
    saberPct,
    hacer: params.indiceHacer,
    deber: params.indiceDeber,
    integral,
    criteriosCriticos: criteriosBajoUmbral(conUmbral),
  };
}
