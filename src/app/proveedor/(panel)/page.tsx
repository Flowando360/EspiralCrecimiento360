import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { FilaEmpresa, type EmpresaMetaAdmin } from '@/components/proveedor/empresas/fila-empresa';
import { FormularioNuevaEmpresa } from '@/components/proveedor/empresas/formulario-nueva-empresa';
import { DatabaseBackup } from 'lucide-react';

export default async function EmpresasProveedorPage() {
  const admin = createAdminClient();

  const [{ data: empresas }, { data: perfiles }, { data: colaboradores }] = await Promise.all([
    admin
      .from('empresas')
      .select('id, nombre, activo, plan_membresia, precio_membresia_mensual, estado_facturacion, fecha_proximo_pago')
      .order('nombre'),
    admin.from('perfiles_usuario').select('empresa_id, activo'),
    admin.from('colaboradores').select('empresa_id, estado'),
  ]);

  const usuariosActivos = new Map<string, number>();
  for (const p of (perfiles ?? []) as any[]) {
    if (p.activo) usuariosActivos.set(p.empresa_id, (usuariosActivos.get(p.empresa_id) ?? 0) + 1);
  }
  const colaboradoresActivos = new Map<string, number>();
  for (const c of (colaboradores ?? []) as any[]) {
    if (c.estado === 'activo') colaboradoresActivos.set(c.empresa_id, (colaboradoresActivos.get(c.empresa_id) ?? 0) + 1);
  }

  const filas: EmpresaMetaAdmin[] = ((empresas ?? []) as any[]).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    activo: e.activo,
    usuariosActivos: usuariosActivos.get(e.id) ?? 0,
    colaboradoresActivos: colaboradoresActivos.get(e.id) ?? 0,
    planMembresia: e.plan_membresia,
    precioMembresiaMensual: e.precio_membresia_mensual,
    estadoFacturacion: e.estado_facturacion,
    fechaProximoPago: e.fecha_proximo_pago,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Empresas clientes</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Todas las empresas de la plataforma: estado, membresía y facturación. Haz clic en una empresa para ver y
          editar sus datos, activarla o desactivarla.
        </p>
      </div>

      <div className="flex justify-end">
        <FormularioNuevaEmpresa />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Usuarios activos</th>
              <th className="px-4 py-3 font-medium">Colaboradores</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Precio mensual</th>
              <th className="px-4 py-3 font-medium">Facturación</th>
              <th className="px-4 py-3 font-medium">Próximo pago</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((empresa) => (
              <FilaEmpresa key={empresa.id} empresa={empresa} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-marmol-800 flex items-center gap-2">
          <DatabaseBackup size={18} className="text-flow-600" /> Respaldo por empresa
        </h2>
        <p className="text-xs text-marmol-500">Descarga todos los datos de una empresa en ZIP. Cada descarga queda en la bitácora.</p>
        <ul className="divide-y divide-marmol-100">
          {filas.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <Link href={`/proveedor/empresas/${e.id}`} className="text-sm text-marmol-700 hover:underline">{e.nombre}</Link>
              <a href={`/api/respaldo?empresa_id=${e.id}`} className="text-xs text-flow-700 hover:underline">Descargar respaldo</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
