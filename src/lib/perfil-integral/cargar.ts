import { createClient } from '@/lib/supabase/server';
import type { PerfilActual } from '@/lib/supabase/get-perfil-actual';
import { recopilarContextoBrief, type ContextoBrief } from '@/lib/brief/contexto';
import { cargarDesempenoIntegral, type DesempenoIntegral } from '@/lib/desempeno/cargar-integral';
import { calcularCumplimientoObjetivos } from '@/lib/desempeno/objetivos';
import { borradorPerfilIntegral, type CamposPerfilIntegral } from './borrador';
import { primero } from '@/lib/utils';

export interface DatosCargadosPerfil {
  ctx: ContextoBrief;
  integral: DesempenoIntegral;
  colaboradorId: string;
  borrador: CamposPerfilIntegral;
}

/**
 * Reúne todo lo que necesita el perfil integral de una evaluación. Solo Talento Humano y el líder directo de la persona
 * (igual que el Brief). Devuelve null si no existe o no tiene permiso.
 */
export async function cargarDatosPerfilIntegral(perfil: Pick<PerfilActual, 'rol' | 'empresa_id' | 'colaborador_id'>, evaluacionId: string): Promise<DatosCargadosPerfil | null> {
  const supabase = createClient();
  const { data: ev } = await supabase
    .from('evaluaciones')
    .select('id, colaborador:colaborador_evaluado_id(id, empresa_id, lider_id, cargo:cargos(nivel_cargo, tiene_personal_a_cargo))')
    .eq('id', evaluacionId)
    .maybeSingle();
  const col = primero(ev?.colaborador as any) as any;
  if (!ev || !col || col.empresa_id !== perfil.empresa_id) return null;
  const permitido = perfil.rol === 'admin_th' || (perfil.rol === 'lider' && col.lider_id === perfil.colaborador_id);
  if (!permitido) return null;

  const ctx = await recopilarContextoBrief(supabase, evaluacionId);
  if (!ctx) return null;
  const cargo = primero(col.cargo as any) as any;
  const integral = await cargarDesempenoIntegral({
    evaluacionId,
    empresaId: perfil.empresa_id,
    colaboradorId: col.id,
    cargo,
    indiceHacer: ctx.desempeno.indiceHacer,
    indiceDeber: ctx.desempeno.indiceDeber,
  });
  const { data: objetivos } = await supabase.from('objetivos_ciclo').select('resultado, aceptado_en').eq('evaluacion_id', evaluacionId);
  const cumplimiento = calcularCumplimientoObjetivos((objetivos ?? []) as any[]);

  return {
    ctx,
    integral,
    colaboradorId: col.id,
    borrador: borradorPerfilIntegral({ ctx, integral: integral.integral.indice ?? null, objetivos: { total: cumplimiento.total, cerrados: cumplimiento.cerrados, porcentaje: cumplimiento.porcentaje } }),
  };
}
