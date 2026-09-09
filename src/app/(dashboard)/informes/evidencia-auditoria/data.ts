import { createClient } from '@/lib/supabase/server';
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
  riesgo: string;
  impacto: string | null;
  control: string | null;
}

export interface ProcesoEvidencia {
  area_proceso: string;
  nombre: string;
  version: string | null;
}

export interface EvidenciaAuditoria {
  certificacionesSST: CertificacionEvidencia[];
  checklist: ChecklistEvidencia[];
  riesgos: RiesgoEvidencia[];
  procesos: ProcesoEvidencia[];
}

const ROLES_PERMITIDOS = ['admin_th', 'gerencia', 'auditor_externo'];

/**
 * Reúne los insumos del paquete de evidencia de auditoría (SST, ISO 9001,
 * SARLAFT/SAGRILAFT, PTEE) — generalización del punto 5 del plan pendiente
 * (antes solo SST) usando además el módulo de procesos y sistemas de
 * gestión (0026, aporte de V&E). Visible para admin_th, gerencia y
 * auditor_externo (solo lectura).
 */
export async function obtenerEvidenciaAuditoria(tipo: TipoPaqueteAuditoria): Promise<{
  perfil: Awaited<ReturnType<typeof getPerfilActual>>;
  evidencia: EvidenciaAuditoria | null;
}> {
  const perfil = await getPerfilActual();
  if (!perfil || !ROLES_PERMITIDOS.includes(perfil.rol)) {
    return { perfil: null, evidencia: null };
  }

  const supabase = createClient();
  const incluyeSST = tipo === 'todos' || tipo === 'sst';
  const marcosChecklist =
    tipo === 'todos' ? ['iso_9001', 'sarlaft_sagrilaft', 'ptee'] : tipo === 'sst' ? [] : [tipo];

  const [{ data: colaboradoresRaw }, { data: procesosRaw }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo'),
    supabase
      .from('procesos_gestion')
      .select('area_proceso, nombre, version')
      .eq('empresa_id', perfil.empresa_id)
      .order('area_proceso'),
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
        .eq('empresa_id', perfil.empresa_id)
        .in('marco_normativo', marcosChecklist),
      supabase
        .from('matriz_riesgos_controles')
        .select('marco_normativo, riesgo, impacto, control')
        .eq('empresa_id', perfil.empresa_id)
        .in('marco_normativo', marcosChecklist),
    ]);
    checklist = (checklistRaw ?? []) as any[];
    riesgos = (riesgosRaw ?? []) as any[];
  }

  const procesos: ProcesoEvidencia[] = tipo !== 'sst' ? ((procesosRaw ?? []) as any[]) : [];

  return { perfil, evidencia: { certificacionesSST, checklist, riesgos, procesos } };
}
