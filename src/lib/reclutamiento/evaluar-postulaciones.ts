import type { Cliente } from './registrar-hoja-vida';
import { aniosDesdeMeses, mesesFusionados, type PeriodoLaboral } from './experiencia';
import { calcularMatch, VERSION_REGLAS_MATCH, type CriterioMatch, type DatosMatchCandidato } from './match';

// Glue entre la base de datos y el motor de match. El motor es puro (match.ts);
// aquí solo se leen y guardan datos. Las evaluaciones anteriores no se borran:
// pasan a vigente = false y quedan como historial (requerimiento §16.2).

/** Ficha activa del candidato, en la forma que espera el motor. */
export async function cargarDatosMatch(cliente: Cliente, candidatoId: string): Promise<DatosMatchCandidato> {
  const [educacion, experiencia, competencias, idiomas, certificaciones, candidato, ultimoResultado, trabajosPendientes] = await Promise.all([
    cliente.from('candidato_educacion').select('titulo, area, nivel, estado').eq('candidato_id', candidatoId).eq('activo', true),
    cliente
      .from('candidato_experiencia')
      .select('cargo, organizacion, sector, funciones, logros, herramientas, competencias, fecha_inicio, fecha_fin, en_curso')
      .eq('candidato_id', candidatoId)
      .eq('activo', true),
    cliente.from('candidato_competencias').select('tipo, nombre, nivel').eq('candidato_id', candidatoId).eq('activo', true),
    cliente.from('candidato_idiomas').select('idioma, nivel').eq('candidato_id', candidatoId).eq('activo', true),
    cliente.from('candidato_certificaciones').select('nombre, vigente_hasta').eq('candidato_id', candidatoId).eq('activo', true),
    cliente.from('candidatos').select('resumen_profesional').eq('id', candidatoId).single(),
    cliente.from('ai_extraction_results').select('revision_requerida').eq('candidato_id', candidatoId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    cliente.from('ai_processing_jobs').select('id').eq('candidato_id', candidatoId).in('estado', ['pendiente', 'procesando', 'requiere_revision', 'error']).limit(1),
  ]);

  // Hay revisión pendiente si la última extracción la pide o si el procesamiento no ha terminado.
  const revisionPendiente = !!ultimoResultado.data?.revision_requerida || (trabajosPendientes.data?.length ?? 0) > 0;

  return {
    educacion: educacion.data ?? [],
    experiencia: (experiencia.data ?? []).map((x) => ({
      cargo: x.cargo,
      organizacion: x.organizacion,
      sector: x.sector,
      funciones: x.funciones,
      logros: x.logros,
      herramientas: x.herramientas,
      competencias: x.competencias,
      fecha_inicio: x.fecha_inicio,
      fecha_fin: x.fecha_fin,
      en_curso: x.en_curso,
    })),
    competencias: competencias.data ?? [],
    idiomas: idiomas.data ?? [],
    certificaciones: certificaciones.data ?? [],
    resumen: candidato.data?.resumen_profesional ?? null,
    revision_pendiente: revisionPendiente,
  };
}

/** Recalcula los años de experiencia y deja sin vigencia las evaluaciones del candidato: un dato cambió. */
export async function recalcularFichaCandidato(cliente: Cliente, candidatoId: string): Promise<void> {
  const { data: experiencia } = await cliente
    .from('candidato_experiencia')
    .select('fecha_inicio, fecha_fin, en_curso')
    .eq('candidato_id', candidatoId)
    .eq('activo', true);

  const hoy = new Date();
  const periodos: PeriodoLaboral[] = [];
  for (const x of experiencia ?? []) {
    if (!x.fecha_inicio) continue;
    const inicio = new Date(`${x.fecha_inicio}T00:00:00`);
    const fin = x.en_curso || !x.fecha_fin ? hoy : new Date(`${x.fecha_fin}T00:00:00`);
    periodos.push({ inicio, fin });
  }
  const anios = periodos.length > 0 ? aniosDesdeMeses(mesesFusionados(periodos)) : null;
  await cliente.from('candidatos').update({ anios_experiencia_total: anios }).eq('id', candidatoId);

  const { data: postulaciones } = await cliente.from('postulaciones').select('id').eq('candidato_id', candidatoId);
  const ids = (postulaciones ?? []).map((p) => p.id);
  if (ids.length > 0) {
    await cliente.from('match_evaluaciones').update({ vigente: false }).in('postulacion_id', ids).eq('vigente', true);
  }
}

/**
 * Calcula y guarda el match de las postulaciones de una vacante (todas, o solo las indicadas).
 * Devuelve cuántas evaluaciones se generaron.
 */
export async function calcularMatchPostulaciones(
  cliente: Cliente,
  vacanteId: string,
  opciones: { usuarioId: string | null; postulacionIds?: string[] }
): Promise<number> {
  const { data: vacante } = await cliente.from('vacantes').select('id, empresa_id, perfil_version').eq('id', vacanteId).single();
  if (!vacante) throw new Error('Vacante no encontrada.');

  const { data: criteriosBd } = await cliente
    .from('criterios_evaluacion')
    .select('id, descripcion, categoria, tipo, peso, valor_requerido, nivel_requerido, meses_requeridos, activo')
    .eq('vacante_id', vacanteId);
  const criterios: CriterioMatch[] = (criteriosBd ?? []).map((c) => ({ ...c, peso: Number(c.peso), meses_requeridos: c.meses_requeridos }));

  let consulta = cliente.from('postulaciones').select('id, candidato_id').eq('vacante_id', vacanteId);
  if (opciones.postulacionIds) consulta = consulta.in('id', opciones.postulacionIds);
  const { data: postulaciones } = await consulta;

  let generadas = 0;
  for (const p of postulaciones ?? []) {
    const datos = await cargarDatosMatch(cliente, p.candidato_id);
    const resultado = calcularMatch(criterios, datos);

    await cliente.from('match_evaluaciones').update({ vigente: false }).eq('postulacion_id', p.id).eq('vigente', true);
    const { data: evaluacion, error } = await cliente
      .from('match_evaluaciones')
      .insert({
        empresa_id: vacante.empresa_id,
        postulacion_id: p.id,
        vacante_id: vacanteId,
        puntaje: resultado.puntaje,
        cobertura: resultado.cobertura,
        clasificacion: resultado.clasificacion,
        provisional: resultado.provisional,
        obligatorios_estado: resultado.obligatorios_estado,
        fortalezas: resultado.fortalezas,
        brechas: resultado.brechas,
        version_reglas: VERSION_REGLAS_MATCH,
        version_perfil: vacante.perfil_version,
        calculada_por: opciones.usuarioId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    const { error: errorDetalles } = await cliente.from('match_evaluacion_detalles').insert(
      resultado.detalles.map((d) => ({
        evaluacion_id: evaluacion.id,
        criterio_id: d.criterio_id,
        descripcion_criterio: d.descripcion,
        categoria: d.categoria,
        tipo: d.tipo,
        peso: d.peso,
        resultado: d.resultado,
        puntaje: d.puntaje,
        evidencia: d.evidencia,
        motivo: d.motivo,
      }))
    );
    if (errorDetalles) throw new Error(errorDetalles.message);
    generadas++;
  }
  return generadas;
}
