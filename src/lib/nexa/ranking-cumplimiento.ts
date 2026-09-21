import { createClient } from '@/lib/supabase/server';

const DIAS_FRECUENCIA: Record<string, number> = { trimestral: 90, semestral: 182, anual: 365 };

// Misma regla que usa la matriz de riesgos (ver estaVencido en
// lista-riesgos.tsx) — se duplica acá en vez de importarla porque esa vive
// en un componente cliente.
function riesgoVencido(frecuencia: string | null, fechaUltimaRevision: string | null): boolean {
  if (!frecuencia || !fechaUltimaRevision) return false;
  const dias = DIAS_FRECUENCIA[frecuencia] ?? 365;
  const limite = new Date(fechaUltimaRevision);
  limite.setDate(limite.getDate() + dias);
  return limite < new Date();
}

export interface FilaCumplimiento {
  colaboradorId: string;
  nombre: string;
  asignados: number;
  cumplidos: number;
  tasa: number;
}

/**
 * Ranking normalizado por tasa de cumplimiento (% de lo asignado que está al
 * día), como alternativa al ranking de puntos brutos — para que un proceso
 * de 1-2 personas no quede en desventaja frente a un equipo grande (diseño
 * discutido con Nexus el 2026-09-20, ver memoria de sesión).
 *
 * Solo cuenta lo que ya "debió" resolverse: riesgos con frecuencia de
 * revisión definida (vencidos o no) y ACPM ya cerradas o con fecha de
 * compromiso vencida. Una ACPM en curso dentro de su plazo no cuenta
 * todavía en ningún sentido, para no premiar ni castigar antes de tiempo.
 * Es una fotografía del estado actual, no un cálculo por período (igual
 * que el Índice de Madurez).
 */
export async function calcularRankingCumplimiento(empresaId: string): Promise<FilaCumplimiento[]> {
  const supabase = createClient();

  const [{ data: riesgos }, { data: acpms }] = await Promise.all([
    supabase
      .from('matriz_riesgos_controles')
      .select('responsable_id, frecuencia_revision, fecha_ultima_revision, colaborador:responsable_id(id, nombre_completo)')
      .eq('empresa_id', empresaId)
      .not('responsable_id', 'is', null)
      .not('frecuencia_revision', 'is', null),
    supabase
      .from('acpm')
      .select('responsable_id, estado, eficaz, fecha_compromiso, colaborador:responsable_id(id, nombre_completo)')
      .eq('empresa_id', empresaId)
      .not('responsable_id', 'is', null),
  ]);

  const acumulado = new Map<string, { nombre: string; asignados: number; cumplidos: number }>();

  function fila(id: string, nombre: string) {
    let f = acumulado.get(id);
    if (!f) {
      f = { nombre, asignados: 0, cumplidos: 0 };
      acumulado.set(id, f);
    }
    return f;
  }

  for (const r of (riesgos ?? []) as any[]) {
    if (!r.responsable_id || !r.colaborador) continue;
    const f = fila(r.responsable_id, r.colaborador.nombre_completo);
    f.asignados += 1;
    if (!riesgoVencido(r.frecuencia_revision, r.fecha_ultima_revision)) f.cumplidos += 1;
  }

  const hoy = new Date();
  for (const a of (acpms ?? []) as any[]) {
    if (!a.responsable_id || !a.colaborador) continue;
    const vencida = a.fecha_compromiso ? new Date(a.fecha_compromiso) < hoy : false;
    const yaEvaluable = a.estado === 'cerrada_efectiva' || a.estado === 'reabierta' || vencida;
    if (!yaEvaluable) continue;
    const f = fila(a.responsable_id, a.colaborador.nombre_completo);
    f.asignados += 1;
    if (a.estado === 'cerrada_efectiva' && a.eficaz) f.cumplidos += 1;
  }

  return [...acumulado.entries()]
    .map(([colaboradorId, v]) => ({
      colaboradorId,
      nombre: v.nombre,
      asignados: v.asignados,
      cumplidos: v.cumplidos,
      tasa: Math.round((v.cumplidos / v.asignados) * 100),
    }))
    .sort((a, b) => b.tasa - a.tasa || b.asignados - a.asignados);
}
