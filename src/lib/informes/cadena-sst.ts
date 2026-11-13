import { createClient } from '@/lib/supabase/server';
import { calcularValoracionInherente, calcularValoracionResidual, evaluarNivel, type TipoRiesgo } from '@/lib/calculos/matriz-riesgos';
import { calcularIndicadoresPlan, calcularIndicadoresSst } from '@/lib/informes/indicadores-sst-reclutamiento';

/**
 * Cadena de evidencias del SG-SST (informe de Luisa 10.3): peligros y controles → capacitación → ejecución
 * (simulacros, inspecciones) → hallazgos → ACPM → indicadores. Lo que la norma audita es el encadenamiento,
 * no cada módulo por separado. Todo son conteos agregados.
 */
export interface CadenaSst {
  riesgos: { total: number; conControl: number; residualAlto: number };
  capacitacion: { asignadas: number; completadas: number; pct: number | null };
  ejecucion: { programadas: number; ejecutadas: number; atrasadas: number; cumplimientoPct: number | null };
  simulacros: { total: number; hallazgos: number; criticos: number; sinAcpm: number };
  acpm: { total: number; abiertas: number; cerradasEfectivas: number; vencidas: number };
  indicadores: { tasaAccidentalidad: number | null; coberturaExamenes: number | null; diasIncapacidad: number };
}

export async function calcularCadenaSst(empresaId: string): Promise<CadenaSst> {
  const supabase = createClient() as any;
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: riesgosRaw }, { data: simulacros }, { data: acpmRaw }, plan, sst] = await Promise.all([
    supabase.from('matriz_riesgos_controles').select('tipo, grado_impacto, grado_probabilidad, grado_efectividad_control').eq('empresa_id', empresaId),
    supabase.from('nexa_simulacros').select('id, fecha').eq('empresa_id', empresaId),
    supabase.from('acpm').select('estado, fecha_compromiso, origen_tipo').eq('empresa_id', empresaId),
    calcularIndicadoresPlan(empresaId),
    calcularIndicadoresSst(empresaId),
  ]);

  const riesgos = ((riesgosRaw ?? []) as any[]).filter((r) => r.tipo === 'riesgo');
  const residualAlto = riesgos.filter((r) => {
    const inherente = calcularValoracionInherente(r.grado_impacto, r.grado_probabilidad);
    const residual = calcularValoracionResidual(inherente, r.grado_efectividad_control);
    return evaluarNivel(residual, 'riesgo' as TipoRiesgo) === 'alto';
  }).length;

  const idsSimulacros = ((simulacros ?? []) as any[]).map((s) => s.id as string);
  const { data: hallazgosRaw } = idsSimulacros.length
    ? await supabase.from('nexa_simulacro_hallazgos').select('categoria, severidad, acpm_id').in('simulacro_id', idsSimulacros)
    : { data: [] };
  const hallazgos = (hallazgosRaw ?? []) as any[];

  const acpm = ((acpmRaw ?? []) as any[]).filter((a) => ['simulacro', 'plan_trabajo', 'riesgo'].includes(a.origen_tipo));

  return {
    riesgos: { total: riesgos.length, conControl: riesgos.filter((r) => r.grado_efectividad_control != null).length, residualAlto },
    capacitacion: sst.formacionSst,
    ejecucion: {
      programadas: plan.sst.programadas,
      ejecutadas: plan.sst.ejecutadas,
      atrasadas: plan.sst.atrasadas,
      cumplimientoPct: plan.sst.cumplimientoPct ?? null,
    },
    simulacros: {
      total: idsSimulacros.length,
      hallazgos: hallazgos.length,
      criticos: hallazgos.filter((h) => h.severidad === 'critica' || h.severidad === 'alta').length,
      sinAcpm: hallazgos.filter((h) => h.categoria === 'no_conformidad' && !h.acpm_id).length,
    },
    acpm: {
      total: acpm.length,
      abiertas: acpm.filter((a) => a.estado !== 'cerrada_efectiva').length,
      cerradasEfectivas: acpm.filter((a) => a.estado === 'cerrada_efectiva').length,
      vencidas: acpm.filter((a) => a.fecha_compromiso && a.fecha_compromiso < hoy && a.estado !== 'cerrada_efectiva').length,
    },
    indicadores: {
      tasaAccidentalidad: sst.tasaAccidentalidad,
      coberturaExamenes: sst.coberturaExamenes,
      diasIncapacidad: sst.totalDiasIncapacidad,
    },
  };
}
