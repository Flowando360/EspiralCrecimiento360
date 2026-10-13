import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { GestorRoles, type PermisoRol, type RolEmpresa } from '@/components/roles/gestor-roles';

export default async function RolesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const [{ data: roles }, { data: permisos }, { data: usuarios }] = await Promise.all([
    supabase
      .from('roles_empresa')
      .select('id, nombre, descripcion')
      .eq('empresa_id', perfil.empresa_id)
      .order('nombre'),
    supabase.from('permisos_rol').select('rol_id, modulo, leer, escribir, borrar'),
    supabase
      .from('perfiles_usuario')
      .select('rol_personalizado_id')
      .eq('empresa_id', perfil.empresa_id)
      .not('rol_personalizado_id', 'is', null),
  ]);

  const usuariosPorRol = new Map<string, number>();
  for (const u of usuarios ?? []) {
    const id = u.rol_personalizado_id as string;
    usuariosPorRol.set(id, (usuariosPorRol.get(id) ?? 0) + 1);
  }

  // permisos_rol ya viene filtrado por las policies: solo llegan los de roles de esta empresa.
  const filasPorRol = new Map<string, RolEmpresa['permisos']>();
  for (const p of permisos ?? []) {
    const lista = filasPorRol.get(p.rol_id) ?? [];
    lista.push({ modulo: p.modulo as PermisoRol['modulo'], leer: p.leer, escribir: p.escribir, borrar: p.borrar });
    filasPorRol.set(p.rol_id, lista);
  }

  const rolesEmpresa: RolEmpresa[] = (roles ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    usuarios: usuariosPorRol.get(r.id) ?? 0,
    permisos: filasPorRol.get(r.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <ShieldCheck size={22} className="text-flow-600" /> Roles y permisos
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-3xl">
          Crea roles para tu empresa y decide, módulo por módulo, si pueden ver, escribir o borrar. Luego asígnalos
          desde <strong>Usuarios y roles</strong>. Un rol personalizado trabaja dentro del alcance de datos de su rol de
          sistema: puede quitar módulos, pero no dar acceso a datos que el rol de sistema no ve.
        </p>
      </div>

      <GestorRoles roles={rolesEmpresa} />
    </div>
  );
}
