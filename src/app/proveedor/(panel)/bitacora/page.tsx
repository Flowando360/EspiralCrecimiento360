import { createAdminClient } from '@/lib/supabase/server';

export default async function BitacoraProveedorPage() {
  const admin = createAdminClient();
  const [{ data: registros }, { data: proveedores }, { data: empresas }] = await Promise.all([
    admin.from('bitacora_proveedor').select('id, proveedor_id, accion, empresa_id, detalle, creado_en').order('creado_en', { ascending: false }).limit(200),
    admin.from('proveedores').select('id, nombre'),
    admin.from('empresas').select('id, nombre'),
  ]);

  const nombreProveedor = new Map((proveedores ?? []).map((p) => [p.id, p.nombre]));
  const nombreEmpresa = new Map((empresas ?? []).map((e) => [e.id, e.nombre]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Bitácora</h1>
        <p className="text-sm text-marmol-500 mt-1">Últimas 200 acciones del equipo proveedor sobre las empresas.</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Cuándo</th>
              <th className="px-4 py-3 font-medium">Quién</th>
              <th className="px-4 py-3 font-medium">Acción</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {(registros ?? []).map((r) => (
              <tr key={r.id} className="border-b border-marmol-100 last:border-0">
                <td className="px-4 py-2 text-marmol-600 whitespace-nowrap">{new Date(r.creado_en).toLocaleString('es-CO')}</td>
                <td className="px-4 py-2 text-marmol-800">{r.proveedor_id ? nombreProveedor.get(r.proveedor_id) ?? '—' : '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-marmol-700">{r.accion}</td>
                <td className="px-4 py-2 text-marmol-700">{r.empresa_id ? nombreEmpresa.get(r.empresa_id) ?? '—' : '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-marmol-500">{JSON.stringify(r.detalle)}</td>
              </tr>
            ))}
            {(registros ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-marmol-500">Todavía no hay acciones registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
