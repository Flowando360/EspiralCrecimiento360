import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export type TipoPaqueteAuditoria = 'todos' | 'sst' | 'iso_9001' | 'sarlaft_sagrilaft' | 'ptee';

export interface CertificacionEvidencia {
  colaborador_nombre: string;
  titulo: string;
  fecha_vencimiento: string | null;
  verificado: boolean;
  documento_url: string | null;
}

export interface ChecklistEvidencia {
  marco_normativo: string;
  item: string;
  estado: string;
  evidencia_url: string | null;
}

export interface RiesgoEvidencia {
  marco_normativo: string;
  tipo: string;
  riesgo: string;
  impacto: string | null;
  riesgo_residual: string | null;
  control: string | null;
  frecuencia_revision: string | null;
  fecha_ultima_revision: string | null;
}

export interface ProcesoEvidencia {
  area_proceso: string;
  nombre: string;
  version: string | null;
}

export interface AuditoriaEvidencia {
  codigo: string | null;
  objetivo: string | null;
  marco_normativo: string | null;
  fecha_ejecutada: string | null;
  estado: string;
  hallazgos_abiertos: number;
  hallazgos_cerrados: number;
}

export interface AcpmEvidencia {
  codigo: string | null;
  tipo_accion: string;
  descripcion: string;
  estado: string;
  eficaz: boolean | null;
}

export interface CambioEvidencia {
  codigo: string | null;
  titulo: string;
  tipo_cambio: string;
  estado: string;
  impacto: string | null;
}

export interface EvidenciaAuditoria {
  certificacionesSST: CertificacionEvidencia[];
  checklist: ChecklistEvidencia[];
  riesgos: RiesgoEvidencia[];
  procesos: ProcesoEvidencia[];
  auditorias: AuditoriaEvidencia[];
  acpm: AcpmEvidencia[];
  tasaEficaciaAcpm: number | null;
  cambios: CambioEvidencia[];
}

const ROLES_PERMITIDOS = ['admin_th', 'gerencia', 'auditor_externo'];

/**
 * Reúne los insumos del paquete de evidencia de auditoría (SST, ISO 9001,
 * SARLAFT/SAGRILAFT, PTEE) usando el módulo de procesos y sistemas de
 * gestión completo (0026 + fase 1 + fase 2: mapa de procesos, riesgos con
 * ciclo, auditorías internas, ACPM y gestión de cambio). Visible para
 * admin_th, gerencia y auditor_externo (solo lectura).
 */
export async function obtenerEvidenciaAuditoria(
  tipo: TipoPaqueteAuditoria,
  /** Solo para el enlace público temporal (ver /auditoria/[token]): salta la sesión y usa el cliente admin, porque quien abre el enlace no tiene cuenta en la plataforma. */
  opts?: { empresaId: string }
): Promise<{
  perfil: Awaited<ReturnType<typeof getPerfilActual>>;
  evidencia: EvidenciaAuditoria | null;
}> {
  let perfil: Awaited<ReturnType<typeof getPerfilActual>> = null;
  let empresaId: string;
  let supabase;

  if (opts?.empresaId) {
    empresaId = opts.empresaId;
    supabase = createAdminClient();
  } else {
    perfil = await getPerfilActual();
    if (!perfil || !ROLES_PERMITIDOS.includes(perfil.rol)) {
      return { perfil: null, evidencia: null };
    }
    empresaId = perfil.empresa_id;
    supabase = createClient();
  }

  const incluyeSST = tipo === 'todos' || tipo === 'sst';
  const marcosChecklist = tipo === 'todos' ? ['iso_9001', 'sst', 'sarlaft_sagrilaft', 'ptee'] : [tipo];

  const [{ data: colaboradoresRaw }, { data: procesosRaw }, { data: auditoriasRaw }, { data: acpmRaw }, { data: cambiosRaw }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', empresaId)
      .eq('estado', 'activo'),
    supabase
      .from('procesos_gestion')
      .select('id, area_proceso, nombre, version')
      .eq('empresa_id', empresaId)
      .order('area_proceso'),
    supabase
      .from('auditorias_internas')
      .select('id, codigo, objetivo, marco_normativo, fecha_ejecutada, estado')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false }),
    supabase
      .from('acpm')
      .select('codigo, tipo_accion, descripcion, estado, eficaz, proceso_id')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false }),
    supabase
      .from('solicitudes_cambio')
      .select('codigo, titulo, tipo_cambio, estado, impacto, proceso:proceso_id(empresa_id)')
      .order('fecha_solicitud', { ascending: false }),
  ]);

  const colaboradores = (colaboradoresRaw ?? []) as any[];
  const colaboradorIds = colaboradores.map((c) => c.id);
  const nombrePorId = new Map(colaboradores.map((c) => [c.id, c.nombre_completo as string]));

  let certificacionesSST: CertificacionEvidencia[] = [];
  if (incluyeSST && colaboradorIds.length > 0) {
    const { data: certRaw } = await supabase
      .from('hoja_vida_formacion')
      .select('colaborador_id, titulo, fecha_vencimiento, verificado, documento_url')
      .eq('tipo', 'certificacion')
      .in('colaborador_id', colaboradorIds);

    certificacionesSST = ((certRaw ?? []) as any[]).map((c) => ({
      colaborador_nombre: nombrePorId.get(c.colaborador_id) ?? '—',
      titulo: c.titulo,
      fecha_vencimiento: c.fecha_vencimiento,
      verificado: c.verificado,
      documento_url: c.documento_url,
    }));
  }

  let checklist: ChecklistEvidencia[] = [];
  let riesgos: RiesgoEvidencia[] = [];
  if (marcosChecklist.length > 0) {
    const [{ data: checklistRaw }, { data: riesgosRaw }] = await Promise.all([
      supabase
        .from('checklist_cumplimiento')
        .select('marco_normativo, item, estado, evidencia_url')
        .eq('empresa_id', empresaId)
        .in('marco_normativo', marcosChecklist),
      supabase
        .from('matriz_riesgos_controles')
        .select('marco_normativo, tipo, riesgo, impacto, riesgo_residual, control, frecuencia_revision, fecha_ultima_revision')
        .eq('empresa_id', empresaId)
        .in('marco_normativo', marcosChecklist),
    ]);
    checklist = (checklistRaw ?? []) as any[];
    riesgos = (riesgosRaw ?? []) as any[];
  }

  const procesos: ProcesoEvidencia[] = tipo !== 'sst' ? ((procesosRaw ?? []) as any[]) : [];

  const auditoriasFiltradas = ((auditoriasRaw ?? []) as any[]).filter((a) => tipo === 'todos' || a.marco_normativo === tipo);
  const auditoriaIds = auditoriasFiltradas.map((a) => a.id);
  const { data: hallazgosRaw } = auditoriaIds.length
    ? await supabase.from('hallazgos_auditoria').select('auditoria_id, estado').in('auditoria_id', auditoriaIds)
    : { data: [] };

  const auditorias: AuditoriaEvidencia[] = auditoriasFiltradas.map((a) => {
    const hallazgosDeEsta = ((hallazgosRaw ?? []) as any[]).filter((h) => h.auditoria_id === a.id);
    return {
      codigo: a.codigo,
      objetivo: a.objetivo,
      marco_normativo: a.marco_normativo,
      fecha_ejecutada: a.fecha_ejecutada,
      estado: a.estado,
      hallazgos_abiertos: hallazgosDeEsta.filter((h) => h.estado !== 'cerrado').length,
      hallazgos_cerrados: hallazgosDeEsta.filter((h) => h.estado === 'cerrado').length,
    };
  });

  const acpm: AcpmEvidencia[] = ((acpmRaw ?? []) as any[]).map((a) => ({
    codigo: a.codigo,
    tipo_accion: a.tipo_accion,
    descripcion: a.descripcion,
    estado: a.estado,
    eficaz: a.eficaz,
  }));
  const resueltasAcpm = acpm.filter((a) => a.estado === 'cerrada_efectiva' || a.estado === 'reabierta');
  const tasaEficaciaAcpm = resueltasAcpm.length > 0 ? Math.round((acpm.filter((a) => a.estado === 'cerrada_efectiva').length / resueltasAcpm.length) * 100) : null;

  const cambios: CambioEvidencia[] = ((cambiosRaw ?? []) as any[])
    .filter((c) => c.proceso?.empresa_id === empresaId)
    .map((c) => ({ codigo: c.codigo, titulo: c.titulo, tipo_cambio: c.tipo_cambio, estado: c.estado, impacto: c.impacto }));

  return { perfil, evidencia: { certificacionesSST, checklist, riesgos, procesos, auditorias, acpm, tasaEficaciaAcpm, cambios } };
}
