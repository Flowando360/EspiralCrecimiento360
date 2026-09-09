import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { Briefcase, Plus, Users } from 'lucide-react';

const ESTADO_LABEL: Record<string, string> = { abierta: 'Abierta', pausada: 'Pausada', cerrada: 'Cerrada' };
const ESTADO_CLASE: Record<string, string> = {
  abierta: 'bg-alto/10 text-alto',
  pausada: 'bg-medio/10 text-medio',
  cerrada: 'bg-marmol-200 text-marmol-500',
};

export default async function ReclutamientoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();
  const { data: vacantes } = await supabase
    .from('vacantes')
    .select('id, titulo, estado, fecha_apertura, fecha_cierre, cargo:cargos(nombre), postulaciones(count)')
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <Briefcase size={22} className="text-flow-600" /> Reclutamiento y Selección
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Banco de candidatos, vacantes y el proceso de selección de cada una — desde la postulación hasta
            la contratación.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reclutamiento/candidatos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition"
          >
            <Users size={15} /> Banco de candidatos
          </Link>
          {perfil.rol === 'admin_th' && (
            <Link
              href="/reclutamiento/vacantes/nueva"
              className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-2 transition"
            >
              <Plus size={15} /> Nueva vacante
            </Link>
          )}
        </div>
      </div>

      {!vacantes || vacantes.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">
          Todavía no hay vacantes creadas.
          {perfil.rol === 'admin_th' && ' Crea la primera con el botón "Nueva vacante".'}
        </div>
      ) : (
        <div className="grid gap-3">
          {vacantes.map((v: any) => (
            <Link
              key={v.id}
              href={`/reclutamiento/vacantes/${v.id}`}
              className="card p-4 flex items-center justify-between hover:border-flow-300 transition"
            >
              <div>
                <p className="font-medium text-marmol-800">{v.titulo}</p>
                <p className="text-xs text-marmol-400 mt-0.5">
                  {v.cargo?.nombre ?? 'Sin cargo'} · Abierta el {v.fecha_apertura}
                  {v.fecha_cierre ? ` · Cerrada el ${v.fecha_cierre}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-marmol-400">
                  {v.postulaciones?.[0]?.count ?? 0} candidato{(v.postulaciones?.[0]?.count ?? 0) === 1 ? '' : 's'}
                </span>
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${ESTADO_CLASE[v.estado]}`}>
                  {ESTADO_LABEL[v.estado]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
