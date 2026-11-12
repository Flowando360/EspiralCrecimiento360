import { createClient } from '@/lib/supabase/server';

export const MODULOS_AUDITORIA = [
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'roles', label: 'Roles y permisos' },
  { value: 'empresa', label: 'Datos de la empresa' },
  { value: 'ponderaciones', label: 'Ponderaciones' },
  { value: 'parametros_legales', label: 'Parámetros legales' },
  { value: 'competencias', label: 'Competencias' },
  { value: 'cargos', label: 'Cargos' },
] as const;

export interface FiltrosAuditoria {
  modulo?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
}

const esFecha = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export function leerFiltrosAuditoria(sp: Record<string, string | undefined> | URLSearchParams): FiltrosAuditoria {
  const g = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) ?? undefined : sp[k]) || undefined;
  const modulo = g('modulo');
  const usuario = g('usuario');
  return {
    modulo: modulo && MODULOS_AUDITORIA.some((m) => m.value === modulo) ? modulo : undefined,
    usuario: usuario && /^[0-9a-f-]{36}$/i.test(usuario) ? usuario : undefined,
    desde: esFecha(g('desde')),
    hasta: esFecha(g('hasta')),
  };
}

export const LIMITE_PANTALLA = 300;

export async function obtenerAuditoria(empresaId: string, f: FiltrosAuditoria, limite = LIMITE_PANTALLA) {
  const supabase = createClient();
  let q = supabase
    .from('auditoria_cambios')
    .select('id, creado_en, usuario_id, usuario_nombre, usuario_rol, modulo, accion, resumen, detalle')
    .eq('empresa_id', empresaId)
    .order('creado_en', { ascending: false })
    .limit(limite + 1);
  if (f.modulo) q = q.eq('modulo', f.modulo);
  if (f.usuario) q = q.eq('usuario_id', f.usuario);
  // Las fechas se interpretan en hora de Colombia (UTC-5).
  if (f.desde) q = q.gte('creado_en', `${f.desde}T00:00:00-05:00`);
  if (f.hasta) q = q.lte('creado_en', `${f.hasta}T23:59:59-05:00`);

  const [{ data }, { data: quienes }] = await Promise.all([
    q,
    supabase.from('auditoria_cambios').select('usuario_id, usuario_nombre').eq('empresa_id', empresaId).not('usuario_id', 'is', null).limit(1000),
  ]);

  const filas = ((data ?? []) as any[]).slice(0, limite);
  const mapa = new Map<string, string>();
  for (const u of (quienes ?? []) as any[]) if (u.usuario_id && !mapa.has(u.usuario_id)) mapa.set(u.usuario_id, u.usuario_nombre ?? 'Sin nombre');
  const usuarios = [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return { filas, truncado: (data ?? []).length > limite, usuarios };
}
