import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, DatabaseBackup } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { EditarDatosEmpresa } from '@/components/proveedor/empresas/editar-datos-empresa';
import { CambiarEstadoEmpresa } from '@/components/proveedor/empresas/cambiar-estado-empresa';
import { CrearAdministrador } from '@/components/proveedor/empresas/crear-administrador';

export default async function EmpresaSuperadminPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data: empresa } = await admin
    .from('empresas')
    .select('id, nombre, slug, activo, logo_url, color_marca, color_secundario, color_acento, plan_membresia, estado_facturacion')
    .eq('id', params.id)
    .maybeSingle();
  if (!empresa) notFound();

  const [usuarios, colaboradores, cargos, vacantes] = await Promise.all([
    admin.from('perfiles_usuario').select('id, nombre_completo, usuario, email, rol, activo').eq('empresa_id', params.id).order('nombre_completo'),
    admin.from('colaboradores').select('id', { count: 'exact', head: true }).eq('empresa_id', params.id).eq('estado', 'activo'),
    admin.from('cargos').select('id', { count: 'exact', head: true }).eq('empresa_id', params.id),
    admin.from('vacantes').select('id', { count: 'exact', head: true }).eq('empresa_id', params.id),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/proveedor" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600">
        <ArrowLeft size={12} /> Todas las empresas
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">{empresa.nombre}</h1>
          <p className="text-sm text-marmol-500 mt-1 font-mono">{empresa.slug}</p>
        </div>
        <div className="flex items-center gap-2">
        <CambiarEstadoEmpresa empresaId={empresa.id} activo={empresa.activo} />
        <a
          href={`/api/respaldo?empresa_id=${empresa.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition"
        >
          <DatabaseBackup size={15} /> Descargar respaldo
        </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Usuarios', valor: (usuarios.data ?? []).length },
          { label: 'Colaboradores activos', valor: colaboradores.count ?? 0 },
          { label: 'Cargos', valor: cargos.count ?? 0 },
          { label: 'Vacantes', valor: vacantes.count ?? 0 },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-marmol-500">{k.label}</p>
            <p className="text-2xl font-semibold text-marmol-900">{k.valor}</p>
          </div>
        ))}
      </div>

      <EditarDatosEmpresa empresa={empresa} />

      <CrearAdministrador empresaId={empresa.id} />

      <div className="card overflow-hidden">
        <h2 className="font-semibold text-marmol-800 px-5 pt-5 pb-3">Usuarios de esta empresa</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(usuarios.data ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-marmol-100 last:border-0">
                <td className="px-4 py-2.5 text-marmol-900">
                  {u.nombre_completo}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-marmol-600">{u.usuario}</td>
                <td className="px-4 py-2.5 text-marmol-600">{u.rol}</td>
                <td className="px-4 py-2.5 text-marmol-500">{u.activo ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
            {(usuarios.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-marmol-500">Esta empresa no tiene usuarios todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
