import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FilaEmpresa, type EmpresaMetaAdmin } from '@/components/meta-admin/fila-empresa';

export default async function MetaAdminPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!perfil.es_superadmin) redirect('/inicio');

  const admin = createAdminClient();

  const [{ data: empresas }, { data: perfiles }, { data: colaboradores }] = await Promise.all([
    admin
      .from('empresas')
      .select('id, nombre, plan_membresia, precio_membresia_mensual, estado_facturacion, fecha_proximo_pago')
      .order('nombre'),
    admin.from('perfiles_usuario').select('empresa_id, activo'),
    admin.from('colaboradores').select('empresa_id, estado'),
  ]);

  const usuariosActivosPorEmpresa = new Map<string, number>();
  for (const p of (perfiles ?? []) as any[]) {
    if (!p.activo) continue;
    usuariosActivosPorEmpresa.set(p.empresa_id, (usuariosActivosPorEmpresa.get(p.empresa_id) ?? 0) + 1);
  }

  const colaboradoresActivosPorEmpresa = new Map<string, number>();
  for (const c of (colaboradores ?? []) as any[]) {
    if (c.estado !== 'activo') continue;
    colaboradoresActivosPorEmpresa.set(c.empresa_id, (colaboradoresActivosPorEmpresa.get(c.empresa_id) ?? 0) + 1);
  }

  const filas: EmpresaMetaAdmin[] = ((empresas ?? []) as any[]).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    usuariosActivos: usuariosActivosPorEmpresa.get(e.id) ?? 0,
    colaboradoresActivos: colaboradoresActivosPorEmpresa.get(e.id) ?? 0,
    planMembresia: e.plan_membresia,
    precioMembresiaMensual: e.precio_membresia_mensual,
    estadoFacturacion: e.estado_facturacion,
    fechaProximoPago: e.fecha_proximo_pago,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Cuentas y membresías</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Panel interno de la alianza Flowando/Nexus/V&E — todas las empresas cliente, su plan de membresía
          y estado de facturación (Modelo de Negocio Espiral Evolutiva, secc. 5).
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Empresa</th>
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
    </div>
  );
}
