import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioCrearSimulacro } from '@/components/espiral-crecimiento/formulario-crear-simulacro';
import { formatearFecha } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';

export default async function NexaSimulacrosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: simulacros } = await supabase
    .from('nexa_simulacros')
    .select('id, titulo, descripcion, fecha, participantes_esperados')
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha', { ascending: false, nullsFirst: false });

  const esAdminTh = perfil.rol === 'admin_th';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Simulacros y dinámicas en vivo</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Programación de simulacros de seguridad y dinámicas de cultura, con registro de asistencia y desempeño.
          </p>
        </div>
        {esAdminTh && <FormularioCrearSimulacro />}
      </div>

      {!simulacros || simulacros.length === 0 ? (
        <EmptyState icon={ShieldAlert} titulo="Sin simulacros programados todavía" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {simulacros.map((s) => (
            <Link
              key={s.id}
              href={`/nexa/simulacros/${s.id}`}
              className="card p-4 hover:border-flow-300 border border-transparent transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-medium text-marmol-900">{s.titulo}</h3>
                {s.fecha && <span className="text-xs text-marmol-400">{formatearFecha(s.fecha)}</span>}
              </div>
              {s.descripcion && <p className="text-sm text-marmol-600">{s.descripcion}</p>}
              {s.participantes_esperados !== null && (
                <p className="text-xs text-marmol-400 mt-2">{s.participantes_esperados} participantes esperados</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
