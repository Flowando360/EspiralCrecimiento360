import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export type EstadoCertificacion = 'vigente' | 'por_vencer' | 'vencido' | 'sin_vencimiento';

export interface CertificacionSST {
  id: string;
  colaborador_nombre: string;
  cargo_nombre: string | null;
  titulo: string;
  institucion: string | null;
  fecha_vencimiento: string | null;
  verificado: boolean;
  documento_url: string | null;
  estado: EstadoCertificacion;
}

export interface AlertaSST {
  id: string;
  colaborador_nombre: string;
  tipo: string;
  severidad: string;
  titulo: string;
  fecha_objetivo: string;
  estado: string;
}

export interface RequisitoSinDato {
  colaborador_nombre: string;
  cargo_nombre: string;
  tipo: 'Examen médico' | 'EPP';
  requisito: string;
  detalle: string;
}

export interface InformeSST {
  certificaciones: CertificacionSST[];
  alertas: AlertaSST[];
  requisitosSinDato: RequisitoSinDato[];
}

const ETIQUETA_MOMENTO: Record<string, string> = {
  ingreso: 'Ingreso',
  periodico: 'Periódico',
  retiro: 'Retiro',
};

function calcularEstado(fechaVencimiento: string | null): EstadoCertificacion {
  if (!fechaVencimiento) return 'sin_vencimiento';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  const diasRestantes = Math.round((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= 30) return 'por_vencer';
  return 'vigente';
}

/**
 * Informe de cumplimiento SST. Visible para admin_th, líder (solo su
 * equipo) y gerencia (toda la empresa) — todavía no existe un rol
 * "Líder SST" separado en el sistema, así que por ahora se apoya en los
 * roles existentes. Cubre únicamente lo que hoy tiene dato real por
 * persona: certificaciones (hoja_vida_formacion) y alertas SST abiertas.
 * Exámenes médicos y EPP solo existen como catálogo de lo que exige cada
 * cargo (cargo_examenes_medicos / cargo_epp) — no hay ninguna tabla que
 * registre si a una persona ya se le hizo/entregó, así que se listan por
 * persona con estado fijo "Sin dato registrado", en vez de asumir
 * cumplimiento.
 */
export async function obtenerInformeSST(colaboradorIdFiltro?: string) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) {
    return { perfil: null, informe: null as InformeSST | null };
  }

  const supabase = createClient();

  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select('id, nombre_completo, cargo_id, cargo:cargo_id(nombre)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo');

  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    colaboradoresQuery = colaboradoresQuery.eq('lider_id', perfil.colaborador_id);
  }
  if (colaboradorIdFiltro) {
    colaboradoresQuery = colaboradoresQuery.eq('id', colaboradorIdFiltro);
  }

  const { data: colaboradoresRaw } = await colaboradoresQuery;
  const colaboradores = (colaboradoresRaw ?? []) as any[];
  const colaboradorIds = colaboradores.map((c) => c.id);
  const cargoIds = [...new Set(colaboradores.map((c) => c.cargo_id).filter(Boolean))];

  if (colaboradorIds.length === 0) {
    return { perfil, informe: { certificaciones: [], alertas: [], requisitosSinDato: [] } };
  }

  const [{ data: certRaw }, { data: alertasRaw }, { data: cargosRaw }] = await Promise.all([
    supabase
      .from('hoja_vida_formacion')
      .select('id, colaborador_id, titulo, institucion, fecha_vencimiento, verificado, documento_url')
      .eq('tipo', 'certificacion')
      .in('colaborador_id', colaboradorIds),
    supabase
      .from('alertas')
      .select('id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, estado')
      .in('tipo', ['sst_certificacion', 'sst_examen_medico', 'sst_induccion', 'sst_epp'])
      .in('estado', ['pendiente', 'notificada', 'vencida'])
      .in('colaborador_id', colaboradorIds)
      .order('fecha_objetivo', { ascending: true }),
    supabase
      .from('cargos')
      .select('id, examenes:cargo_examenes_medicos(momento, nombre_examen, orden), epp:cargo_epp(item, orden)')
      .in('id', cargoIds),
  ]);

  const colaboradorPorId = new Map(colaboradores.map((c) => [c.id, c]));
  const cargoPorId = new Map(((cargosRaw ?? []) as any[]).map((c) => [c.id, c]));

  const certificaciones: CertificacionSST[] = ((certRaw ?? []) as any[])
    .map((c) => {
      const co = colaboradorPorId.get(c.colaborador_id);
      return {
        id: c.id,
        colaborador_nombre: co?.nombre_completo ?? '—',
        cargo_nombre: co?.cargo?.nombre ?? null,
        titulo: c.titulo,
        institucion: c.institucion,
        fecha_vencimiento: c.fecha_vencimiento,
        verificado: c.verificado,
        documento_url: c.documento_url,
        estado: calcularEstado(c.fecha_vencimiento),
      };
    })
    .sort((a, b) => (a.fecha_vencimiento ?? '9999').localeCompare(b.fecha_vencimiento ?? '9999'));

  const alertas: AlertaSST[] = ((alertasRaw ?? []) as any[]).map((a) => ({
    id: a.id,
    colaborador_nombre: colaboradorPorId.get(a.colaborador_id)?.nombre_completo ?? '—',
    tipo: a.tipo,
    severidad: a.severidad,
    titulo: a.titulo,
    fecha_objetivo: a.fecha_objetivo,
    estado: a.estado,
  }));

  const requisitosSinDato: RequisitoSinDato[] = [];
  for (const co of colaboradores) {
    const cargo = cargoPorId.get(co.cargo_id);
    if (!cargo) continue;

    for (const ex of ((cargo.examenes ?? []) as any[]).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))) {
      requisitosSinDato.push({
        colaborador_nombre: co.nombre_completo,
        cargo_nombre: co.cargo?.nombre ?? '—',
        tipo: 'Examen médico',
        requisito: ex.nombre_examen,
        detalle: ETIQUETA_MOMENTO[ex.momento] ?? ex.momento,
      });
    }
    for (const item of ((cargo.epp ?? []) as any[]).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))) {
      requisitosSinDato.push({
        colaborador_nombre: co.nombre_completo,
        cargo_nombre: co.cargo?.nombre ?? '—',
        tipo: 'EPP',
        requisito: item.item,
        detalle: '',
      });
    }
  }

  return { perfil, informe: { certificaciones, alertas, requisitosSinDato } };
}
