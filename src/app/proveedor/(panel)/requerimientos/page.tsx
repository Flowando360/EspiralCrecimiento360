import { createAdminClient } from '@/lib/supabase/server';
import { CambiarEstadoRequerimiento } from '@/components/proveedor/cambiar-estado-requerimiento';

const ETIQUETA_TIPO: Record<string, string> = {
  mejora: 'Mejora',
  nueva_funcion: 'Requerimiento',
  falla: 'Falla',
};

export default async function RequerimientosPage() {
  const admin = createAdminClient();
  const [{ data: requerimientos }, { data: empresas }] = await Promise.all([
    admin.from('requerimientos').select('id, empresa_id, nombre_usuario, correo_usuario, pagina, tipo, consulta, respuesta_mostrada, que_pasa, que_esperaba, solucion_imaginada, estado, correo_enviado, creado_en').order('creado_en', { ascending: false }).limit(200),
    admin.from('empresas').select('id, nombre'),
  ]);
  const nombreEmpresa = new Map((empresas ?? []).map((e) => [e.id, e.nombre]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Requerimientos</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Lo que los usuarios piden desde el Centro de Ayuda cuando el manual no responde. Cada uno trae qué pasa, qué esperaban y cómo imaginan la solución.
        </p>
      </div>

      {(requerimientos ?? []).length === 0 && <p className="text-sm text-marmol-500">Todavía no hay requerimientos.</p>}

      <div className="space-y-4">
        {(requerimientos ?? []).map((r) => (
          <div key={r.id} className="card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-marmol-900">
                  <span className="mr-2 text-xs rounded-full bg-flow-50 text-flow-700 px-2 py-0.5">{ETIQUETA_TIPO[r.tipo] ?? r.tipo}</span>
                  {r.nombre_usuario} · {nombreEmpresa.get(r.empresa_id) ?? 'Empresa'}
                </p>
                {(r.consulta || r.respuesta_mostrada) && (
                  <p className="text-xs text-marmol-500">
                    {r.consulta ? `Buscó: “${r.consulta}”` : ''}
                    {r.respuesta_mostrada ? ` · Vio: ${r.respuesta_mostrada}` : ''}
                  </p>
                )}
                <p className="text-xs text-marmol-500">
                  {new Date(r.creado_en).toLocaleString('es-CO')} · {r.correo_usuario}
                  {r.pagina ? ` · Pantalla: ${r.pagina}` : ''}
                  {r.correo_enviado ? ' · Enviado por correo' : ' · Solo en el panel'}
                </p>
              </div>
              <CambiarEstadoRequerimiento requerimientoId={r.id} estado={r.estado} />
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div><p className="text-xs font-medium text-marmol-500">¿Qué pasa?</p><p className="text-marmol-800 whitespace-pre-wrap">{r.que_pasa}</p></div>
              <div><p className="text-xs font-medium text-marmol-500">¿Qué esperabas que pasara?</p><p className="text-marmol-800 whitespace-pre-wrap">{r.que_esperaba}</p></div>
              <div><p className="text-xs font-medium text-marmol-500">¿Cómo imaginas la solución?</p><p className="text-marmol-800 whitespace-pre-wrap">{r.solucion_imaginada}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
