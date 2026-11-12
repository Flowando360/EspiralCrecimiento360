import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export interface VacanteDifusion {
  id: string;
  titulo: string;
  modalidad: string | null;
  ciudad: string | null;
  horario: string | null;
  tipoContrato: string | null;
  requisitos: string | null;
  empresa: { nombre: string; logoUrl: string | null; colorMarca: string | null };
  cargo: string | null;
}

/** Carga una vacante para difundirla (QR, imagen). Solo Talento Humano y líderes de la misma empresa. */
export async function cargarVacanteParaDifusion(id: string): Promise<VacanteDifusion | null> {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return null;
  const supabase = createClient();
  const { data: v } = await supabase
    .from('vacantes')
    .select('id, empresa_id, titulo, modalidad, ciudad, horario, tipo_contrato, requisitos, cargo:cargos(nombre)')
    .eq('id', id)
    .maybeSingle();
  if (!v || (v as any).empresa_id !== perfil.empresa_id) return null;
  const { data: e } = await supabase.from('empresas').select('nombre, logo_url, color_marca').eq('id', perfil.empresa_id).maybeSingle();
  const cargo = Array.isArray((v as any).cargo) ? (v as any).cargo[0] : (v as any).cargo;
  return {
    id: v.id as string,
    titulo: v.titulo as string,
    modalidad: (v as any).modalidad ?? null,
    ciudad: (v as any).ciudad ?? null,
    horario: (v as any).horario ?? null,
    tipoContrato: (v as any).tipo_contrato ?? null,
    requisitos: (v as any).requisitos ?? null,
    empresa: { nombre: (e as any)?.nombre ?? 'Nuestra empresa', logoUrl: (e as any)?.logo_url ?? null, colorMarca: (e as any)?.color_marca ?? null },
    cargo: cargo?.nombre ?? null,
  };
}

/** Color de marca válido (#rrggbb) o el de la plataforma. */
export function colorSeguro(c: string | null | undefined, porDefecto = '#1F4E79'): string {
  return c && /^#[0-9a-fA-F]{6}$/.test(c.trim()) ? c.trim() : porDefecto;
}

/** Negro o blanco, el que se lea mejor sobre el color dado. */
export function textoSobre(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#1a1a1a' : '#ffffff';
}

export function urlPostulacion(origin: string, vacanteId: string): string {
  return `${origin}/postular/${vacanteId}`;
}
