import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FormularioCrearUsuario } from '@/components/espiral-crecimiento/formulario-crear-usuario';
import { FilaUsuario, type UsuarioFila } from '@/components/espiral-crecimiento/fila-usuario';

export default async function AdminUsuariosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const [{ data: usuarios }, { data: sinCuentaRaw }] = await Promise.all([
    supabase
      .from('perfiles_usuario')
      .select('id, nombre_completo, nombre_preferido, usuario, email, rol, activo')
      .eq('empresa_id', perfil.empresa_id)
      .order('nombre_completo'),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo, email')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .is('usuario_id', null)
      .order('nombre_completo'),
  ]);

  // Los 10 colaboradores de demostración (correo demo.*@ejemplo.com) no
  // necesitan cuenta real — se excluyen de la lista para invitar.
  const colaboradoresSinCuenta = (sinCuentaRaw ?? [])
    .filter((c) => !c.email?.startsWith('demo.'))
    .map((c) => ({ id: c.id, nombre_completo: c.nombre_completo }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Usuarios y roles</h1>
          <p className="text-sm text-marmol-500 mt-1">
            admin_th ve y edita todo · lider ve su equipo y su propia info · colaborador se ve a sí
            mismo · gerencia ve reportes agregados.
          </p>
        </div>
        <FormularioCrearUsuario colaboradoresSinCuenta={colaboradoresSinCuenta} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(usuarios ?? []).map((u) => (
              <FilaUsuario
                key={u.id}
                usuario={{
                  id: u.id,
                  nombre_completo: u.nombre_completo,
                  nombre_preferido: u.nombre_preferido,
                  usuario: u.usuario,
                  email: u.email,
                  rol: u.rol as UsuarioFila['rol'],
                  activo: u.activo,
                }}
                esUsuarioActual={u.id === perfil.usuario_id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
