import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

const ROLES_PERMITIDOS = ['admin_th', 'gerencia'] as const;

export interface RevisionDireccion {
  periodoInicio: string;
  periodoFin: string;
  auditorias: { total: number; cerradas: number; hallazgosMayores: number; hallazgosMenores: number; observaciones: number; oportunidades: number };
  riesgos: { total: number; oportunidades: number; vencidos: number; residualAlto: number };
  acpm: { registradasEnPeriodo: number; cerradasEfectivasEnPeriodo: number; reabiertasEnPeriodo: number; tasaEficaciaGlobal: number | null; abiertasVencidas: number };
  indicadores: { total: number; conMedicionEnPeriodo: number; fueraDeMeta: { nombre: string; procesoNombre: string; valor: number; meta: number }[] };
  documentos: { solicitudesResueltasEnPeriodo: number; aprobadas: number; rechazadas: number; difusionIncompleta: number };
  cambios: { total: number; aprobados: number; implementados: number; rechazados: number };
  formacion: { cursosCompletadosEnPeriodo: number };
  pdi: { cerradosEnPeriodo: number };
  cambiosContexto: string | null;
  decisiones: string | null;
}

export async function obtenerRevisionDireccion(periodoInicio: string, periodoFin: string): Promise<{
  perfil: Awaited<ReturnType<typeof getPerfilActual>>;
  revision: RevisionDireccion | null;
}> {
  const perfil = await getPerfilActual();
  if (!perfil || !(ROLES_PERMITIDOS as readonly string[]).includes(perfil.rol)) return { perfil: null, revision: null };

  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    { data: auditoriasRaw },
    { data: riesgosRaw },
    { data: acpmRaw },
    { data: indicadoresRaw },
    { data: solicitudesDocRaw },
    { data: documentosRaw },
    { data: cambiosRaw },
    { data: guardado },
  ] = await Promise.all([
    supabase.from('auditorias_internas').select('id, estado, fecha_ejecutada').eq('empresa_id', perfil.empresa_id),
    supabase.from('matriz_riesgos_controles').select('tipo, riesgo_residual, frecuencia_revision, fecha_ultima_revision').eq('empresa_id', perfil.empresa_id),
    supabase.from('acpm').select('estado, eficaz, fecha_registro, fecha_cierre, fecha_compromiso').eq('empresa_id', perfil.empresa_id),
    supabase.from('indicadores_proceso').select('id, nombre, meta, sentido, unidad, proceso:proceso_id(nombre)').eq('activo', true),
    supabase
      .from('solicitudes_documento')
      .select('estado, fecha_resolucion, proceso:proceso_id(empresa_id)')
      .not('fecha_resolucion', 'is', null),
    supabase.from('documentos_proceso').select('id, requiere_confirmacion, estado, proceso:proceso_id(empresa_id)').eq('estado', 'vigente'),
    supabase.from('solicitudes_cambio').select('estado, proceso:proceso_id(empresa_id)'),
    supabase
      .from('informes_revision_direccion')
      .select('cambios_contexto, decisiones')
      .eq('empresa_id', perfil.empresa_id)
      .eq('periodo_inicio', periodoInicio)
      .eq('periodo_fin', periodoFin)
      .maybeSingle(),
  ]);

  // Auditorías
  const auditorias = (auditoriasRaw ?? []) as any[];
  const auditoriaIds = auditorias.map((a) => a.id);
  const { data: hallazgosRaw } = auditoriaIds.length
    ? await supabase.from('hallazgos_auditoria').select('tipo, auditoria_id').in('auditoria_id', auditoriaIds)
    : { data: [] };
  const hallazgos = (hallazgosRaw ?? []) as any[];

  // Indicadores fuera de meta: última medición de cada indicador
  const indicadores = (indicadoresRaw ?? []) as any[];
  const indicadorIds = indicadores.map((i) => i.id);
  const { data: medicionesRaw } = indicadorIds.length
    ? await supabase.from('mediciones_indicador').select('indicador_id, valor, fecha_medicion').in('indicador_id', indicadorIds).order('fecha_medicion', { ascending: false })
    : { data: [] };
  const mediciones = (medicionesRaw ?? []) as any[];
  const ultimaMedicionPorIndicador = new Map<string, any>();
  for (const m of mediciones) {
    if (!ultimaMedicionPorIndicador.has(m.indicador_id)) ultimaMedicionPorIndicador.set(m.indicador_id, m);
  }
  const conMedicionEnPeriodo = new Set(mediciones.filter((m) => m.fecha_medicion >= periodoInicio && m.fecha_medicion <= periodoFin).map((m) => m.indicador_id)).size;
  const fueraDeMeta = indicadores
    .filter((i) => i.meta != null && ultimaMedicionPorIndicador.has(i.id))
    .filter((i) => {
      const ultima = ultimaMedicionPorIndicador.get(i.id);
      return i.sentido === 'mayor_mejor' ? ultima.valor < i.meta : ultima.valor > i.meta;
    })
    .map((i) => ({ nombre: i.nombre, procesoNombre: i.proceso?.nombre ?? '—', valor: ultimaMedicionPorIndicador.get(i.id).valor, meta: i.meta }));

  // Documentos: solicitudes de la empresa resueltas en el período
  const solicitudesDoc = ((solicitudesDocRaw ?? []) as any[]).filter(
    (s) => s.proceso?.empresa_id === perfil.empresa_id && s.fecha_resolucion >= periodoInicio && s.fecha_resolucion <= periodoFin
  );
  const documentosVigentes = ((documentosRaw ?? []) as any[]).filter((d) => d.proceso?.empresa_id === perfil.empresa_id);
  const { data: confirmacionesRaw } = documentosVigentes.length
    ? await supabase.from('confirmaciones_lectura').select('documento_id').in(
        'documento_id',
        documentosVigentes.map((d) => d.id)
      )
    : { data: [] };
  const confirmacionesPorDoc = new Map<string, number>();
  for (const c of confirmacionesRaw ?? []) confirmacionesPorDoc.set((c as any).documento_id, (confirmacionesPorDoc.get((c as any).documento_id) ?? 0) + 1);
  const difusionIncompleta = documentosVigentes.filter((d) => d.requiere_confirmacion && !(confirmacionesPorDoc.get(d.id) ?? 0)).length;

  // Gestión de cambio
  const cambios = ((cambiosRaw ?? []) as any[]).filter((c) => c.proceso?.empresa_id === perfil.empresa_id);

  // ACPM
  const acpm = (acpmRaw ?? []) as any[];
  const resueltasGlobal = acpm.filter((a) => a.estado === 'cerrada_efectiva' || a.estado === 'reabierta');
  const tasaEficaciaGlobal = resueltasGlobal.length > 0 ? Math.round((acpm.filter((a) => a.estado === 'cerrada_efectiva').length / resueltasGlobal.length) * 100) : null;

  // Riesgos
  const riesgos = (riesgosRaw ?? []) as any[];
  const DIAS_FRECUENCIA: Record<string, number> = { trimestral: 90, semestral: 182, anual: 365 };
  const vencidos = riesgos.filter((r) => {
    if (!r.frecuencia_revision || !r.fecha_ultima_revision) return false;
    const limite = new Date(r.fecha_ultima_revision);
    limite.setDate(limite.getDate() + (DIAS_FRECUENCIA[r.frecuencia_revision] ?? 365));
    return limite < new Date();
  }).length;

  // Formación (Nexa) y PDI, cruzando con colaboradores de esta empresa
  const { data: formacionRaw } = await supabase
    .from('nexa_rutas_formacion')
    .select('completado_en, colaborador:colaborador_id(empresa_id)')
    .eq('estado', 'completado')
    .gte('completado_en', periodoInicio)
    .lte('completado_en', periodoFin + 'T23:59:59');
  const cursosCompletadosEnPeriodo = ((formacionRaw ?? []) as any[]).filter((f) => f.colaborador?.empresa_id === perfil.empresa_id).length;

  const { data: pdiRaw } = await supabase
    .from('planes_desarrollo')
    .select('fecha_cumplimiento, colaborador:colaborador_id(empresa_id)')
    .eq('estado', 'cumplido')
    .gte('fecha_cumplimiento', periodoInicio)
    .lte('fecha_cumplimiento', periodoFin);
  const pdiCerradosEnPeriodo = ((pdiRaw ?? []) as any[]).filter((p) => p.colaborador?.empresa_id === perfil.empresa_id).length;

  return {
    perfil,
    revision: {
      periodoInicio,
      periodoFin,
      auditorias: {
        total: auditorias.length,
        cerradas: auditorias.filter((a) => a.estado === 'cerrada').length,
        hallazgosMayores: hallazgos.filter((h) => h.tipo === 'no_conformidad_mayor').length,
        hallazgosMenores: hallazgos.filter((h) => h.tipo === 'no_conformidad_menor').length,
        observaciones: hallazgos.filter((h) => h.tipo === 'observacion').length,
        oportunidades: hallazgos.filter((h) => h.tipo === 'oportunidad_mejora').length,
      },
      riesgos: {
        total: riesgos.filter((r) => r.tipo === 'riesgo').length,
        oportunidades: riesgos.filter((r) => r.tipo === 'oportunidad').length,
        vencidos,
        residualAlto: riesgos.filter((r) => r.riesgo_residual === 'alto').length,
      },
      acpm: {
        registradasEnPeriodo: acpm.filter((a) => a.fecha_registro >= periodoInicio && a.fecha_registro <= periodoFin).length,
        cerradasEfectivasEnPeriodo: acpm.filter((a) => a.fecha_cierre && a.fecha_cierre >= periodoInicio && a.fecha_cierre <= periodoFin && a.estado === 'cerrada_efectiva').length,
        reabiertasEnPeriodo: acpm.filter((a) => a.estado === 'reabierta').length,
        tasaEficaciaGlobal,
        abiertasVencidas: acpm.filter((a) => a.fecha_compromiso && a.fecha_compromiso < hoy && a.estado !== 'cerrada_efectiva').length,
      },
      indicadores: { total: indicadores.length, conMedicionEnPeriodo, fueraDeMeta },
      documentos: {
        solicitudesResueltasEnPeriodo: solicitudesDoc.length,
        aprobadas: solicitudesDoc.filter((s) => s.estado === 'aprobado').length,
        rechazadas: solicitudesDoc.filter((s) => s.estado === 'rechazado').length,
        difusionIncompleta,
      },
      cambios: {
        total: cambios.length,
        aprobados: cambios.filter((c) => c.estado === 'aprobado').length,
        implementados: cambios.filter((c) => c.estado === 'implementado').length,
        rechazados: cambios.filter((c) => c.estado === 'rechazado').length,
      },
      formacion: { cursosCompletadosEnPeriodo },
      pdi: { cerradosEnPeriodo: pdiCerradosEnPeriodo },
      cambiosContexto: (guardado as any)?.cambios_contexto ?? null,
      decisiones: (guardado as any)?.decisiones ?? null,
    },
  };
}
