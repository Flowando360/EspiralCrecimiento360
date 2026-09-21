'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import type { TipoPaqueteAuditoria } from './data';

const RUTA = '/informes/evidencia-auditoria';
const ROLES_PERMITIDOS = ['admin_th', 'gerencia'];

async function requerirAdminOGerencia() {
  const perfil = await getPerfilActual();
  if (!perfil || !ROLES_PERMITIDOS.includes(perfil.rol)) return null;
  return perfil;
}

export interface EnlaceEvidenciaAuditoria {
  id: string;
  token: string;
  tipo_paquete: TipoPaqueteAuditoria;
  nota: string | null;
  expira_en: string;
  activo: boolean;
  veces_consultado: number;
  ultima_consulta_en: string | null;
  created_at: string;
}

export async function listarEnlacesEvidenciaAuditoria(): Promise<EnlaceEvidenciaAuditoria[]> {
  const perfil = await requerirAdminOGerencia();
  if (!perfil) return [];

  const supabase = createClient();
  const { data } = await (supabase as any)
    .from('enlaces_evidencia_auditoria')
    .select('id, token, tipo_paquete, nota, expira_en, activo, veces_consultado, ultima_consulta_en, created_at')
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  return (data ?? []) as EnlaceEvidenciaAuditoria[];
}

export async function generarEnlaceEvidenciaAuditoria(input: { tipo: TipoPaqueteAuditoria; diasVigencia: number; nota?: string }) {
  const perfil = await requerirAdminOGerencia();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const dias = Math.min(Math.max(input.diasVigencia, 1), 90);
  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + dias);

  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from('enlaces_evidencia_auditoria')
    .insert({
      empresa_id: perfil.empresa_id,
      tipo_paquete: input.tipo,
      creado_por: perfil.colaborador_id,
      nota: input.nota?.trim() || null,
      expira_en: expiraEn.toISOString(),
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id };
}

export async function revocarEnlaceEvidenciaAuditoria(id: string) {
  const perfil = await requerirAdminOGerencia();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await (supabase as any)
    .from('enlaces_evidencia_auditoria')
    .update({ activo: false })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
