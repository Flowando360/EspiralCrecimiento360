import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Archive } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { formatearFecha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ETIQUETA_TIPO: Record<string, string> = {
  ingreso: 'Ingreso',
  promocion: 'Promoción',
  cambio_area: 'Cambio de área',
  cambio_lider: 'Cambio de líder',
  aumento_salarial: 'Aumento salarial',
  sancion: 'Sanción',
  reconocimiento: 'Reconocimiento',
  salida: 'Salida',
};

export default async function HistoricoColaboradoresPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('colaboradores_historico')
    .select('id, nombre_completo, numero_documento, cargo_nombre, lider_nombre, fecha_ingreso, fecha_salida, estado_al_eliminar, motivo, resumen, eliminado_en')
    .eq('empresa_id', perfil.empresa_id)
    .order('eliminado_en', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/espiral-crecimiento/colaboradores"
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a Colaboradores
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Archive size={22} className="text-flow-600" /> Histórico de colaboradores eliminados
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Cuando eliminas una ficha, aquí queda constancia de quién pasó por la empresa, con qué cargo y por qué se eliminó.
          Esta lista no se borra sola.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-bajo">
          No se pudo leer el histórico ({error.message}). Verifica que la migración 0110 esté aplicada en Supabase.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Archive}
          titulo="Todavía no se ha eliminado ninguna ficha"
          descripcion="Las personas que solo dejaron la empresa se marcan como inactivas con «Salida» y siguen en Colaboradores."
        />
      ) : (
        <FiltroTabla columnas={['Cargo']} plural="registros" placeholder="Buscar por nombre o documento…">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-4 py-3 font-medium">Persona</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Ingreso → salida</th>
                  <th className="px-4 py-3 font-medium">Eliminada</th>
                  <th className="px-4 py-3 font-medium">Motivo y trayectoria</th>
                </tr>
              </thead>
              <tbody>
                {data.map((h: any) => (
                  <tr key={h.id} className="border-b border-marmol-100 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-marmol-900">{h.nombre_completo}</p>
                      {h.numero_documento && <p className="text-xs text-marmol-400">Doc. {h.numero_documento}</p>}
                    </td>
                    <td className="px-4 py-3 text-marmol-600">
                      {h.cargo_nombre ?? '—'}
                      {h.lider_nombre && <p className="text-xs text-marmol-400">Líder: {h.lider_nombre}</p>}
                    </td>
                    <td className="px-4 py-3 text-marmol-600 whitespace-nowrap">
                      {h.fecha_ingreso ? formatearFecha(h.fecha_ingreso) : '—'} → {h.fecha_salida ? formatearFecha(h.fecha_salida) : '—'}
                    </td>
                    <td className="px-4 py-3 text-marmol-500 whitespace-nowrap">{formatearFecha(h.eliminado_en)}</td>
                    <td className="px-4 py-3 text-marmol-600">
                      {h.motivo ?? <span className="text-marmol-400">Sin motivo registrado</span>}
                      {Array.isArray(h.resumen?.movimientos) && h.resumen.movimientos.length > 0 && (
                        <ul className="mt-1 text-xs text-marmol-500 list-disc pl-4">
                          {h.resumen.movimientos.map((m: any, i: number) => (
                            <li key={i}>
                              {formatearFecha(m.fecha)} · {ETIQUETA_TIPO[m.tipo] ?? m.tipo}
                              {m.descripcion ? ` — ${m.descripcion}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FiltroTabla>
      )}
    </div>
  );
}
