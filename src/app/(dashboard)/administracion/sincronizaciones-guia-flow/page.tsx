import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatearFecha } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckCircle2, HelpCircle, Copy, AlertTriangle, ShieldOff } from 'lucide-react';

const ETIQUETA_RESULTADO: Record<string, { texto: string; clase: string; icono: typeof CheckCircle2 }> = {
  vinculado: { texto: 'Vinculado', clase: 'badge-alto', icono: CheckCircle2 },
  sin_colaborador: { texto: 'Sin coincidencia', clase: 'bg-marmol-100 text-marmol-500 border border-marmol-200', icono: HelpCircle },
  correo_ambiguo: { texto: 'Correo ambiguo', clase: 'badge-medio', icono: Copy },
  sin_autorizacion: { texto: 'Sin autorización', clase: 'bg-marmol-100 text-marmol-500 border border-marmol-200', icono: ShieldOff },
  error: { texto: 'Error', clase: 'badge-bajo', icono: AlertTriangle },
};

function etiquetaResultado(resultado: string) {
  return ETIQUETA_RESULTADO[resultado] ?? { texto: resultado, clase: 'badge-bajo', icono: AlertTriangle };
}

export default async function SincronizacionesGuiaFlowPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  // La policy de RLS de esta tabla ya solo deja ver a admin_th las filas sin
  // empresa conocida (sin match) o las de su propia empresa (ver
  // 0053_sincronizaciones_guia_flow.sql) — pero mientras BYPASS_AUTH esté
  // activo (ver lib/supabase/server.ts), createClient() usa la service_role
  // y se salta esa RLS por completo. Se repite el mismo filtro acá a mano
  // para que, con o sin BYPASS_AUTH, nunca se vean intentos ya vinculados a
  // colaboradores de OTRA empresa.
  const { data: intentos } = await supabase
    .from('guia_del_flow_sincronizaciones')
    .select('id, intentado_at, correo, nombre_flow, resultado, detalle, colaborador:colaborador_id(id, nombre_completo)')
    .or(`empresa_id.is.null,empresa_id.eq.${perfil.empresa_id}`)
    .order('intentado_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Sincronizaciones de la Guía del Flow</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Cada vez que alguien genera su Guía del Flow en guiadelflow, el sistema intenta emparejarlo por
          correo con un colaborador de aquí. Esta es la bitácora de esos intentos, incluidos los que{' '}
          <strong>no</strong> encontraron a nadie — útil para detectar un correo mal cargado en la ficha
          de un colaborador.
        </p>
      </div>

      <div className="card overflow-x-auto">
        {!intentos || intentos.length === 0 ? (
          <p className="text-sm text-marmol-400 p-5">Todavía no hay intentos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-marmol-500 border-b border-marmol-100">
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium">Nombre (en guiadelflow)</th>
                <th className="p-3 font-medium">Correo usado</th>
                <th className="p-3 font-medium">Resultado</th>
                <th className="p-3 font-medium">Colaborador vinculado</th>
              </tr>
            </thead>
            <tbody>
              {(intentos as any[]).map((i) => {
                const cfg = etiquetaResultado(i.resultado);
                const Icono = cfg.icono;
                return (
                  <tr key={i.id} className="border-b border-marmol-50 last:border-0">
                    <td className="p-3 text-marmol-500 whitespace-nowrap">{formatearFecha(i.intentado_at)}</td>
                    <td className="p-3 text-marmol-700">{i.nombre_flow ?? '—'}</td>
                    <td className="p-3 text-marmol-700">{i.correo}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          cfg.clase
                        )}
                        title={i.detalle ?? undefined}
                      >
                        <Icono size={12} /> {cfg.texto}
                      </span>
                    </td>
                    <td className="p-3">
                      {i.colaborador ? (
                        <Link
                          href={`/espiral-crecimiento/colaboradores/${i.colaborador.id}/guia-flow`}
                          className="text-flow-600 hover:underline"
                        >
                          {i.colaborador.nombre_completo}
                        </Link>
                      ) : (
                        <span className="text-marmol-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
