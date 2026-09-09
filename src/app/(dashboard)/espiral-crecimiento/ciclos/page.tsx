import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioCrearCiclo } from '@/components/espiral-crecimiento/formulario-crear-ciclo';
import { formatearFecha } from '@/lib/utils';
import { CalendarClock } from 'lucide-react';

const ETIQUETA_ESTADO: Record<string, string> = {
  planeado: 'Planeado',
  abierto: 'Abierto',
  en_consolidacion: 'En consolidación',
  publicado: 'Publicado',
  cerrado: 'Cerrado',
};

export default async function CiclosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: ciclos } = await supabase
    .from('ciclos_evaluacion')
    .select('id, nombre, fecha_apertura, fecha_cierre_respuestas, estado')
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha_apertura', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Ciclos de Crecimiento</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Hacer + Deber, semestral. Ser y Saber se verifican de forma continua.
          </p>
        </div>
        {perfil.rol === 'admin_th' && <FormularioCrearCiclo />}
      </div>

      {!ciclos || ciclos.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          titulo="Aún no se ha creado ningún ciclo"
          descripcion={
            perfil.rol === 'admin_th'
              ? 'Usa "Abrir nuevo ciclo" arriba para crear el primero.'
              : 'Talento Humano todavía no ha creado ningún Ciclo de Crecimiento.'
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ciclos.map((c) => (
            <Link
              key={c.id}
              href={`/espiral-crecimiento/ciclos/${c.id}`}
              className="card p-5 hover:border-flow-300 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-secundario">{c.nombre}</h3>
                <span className="text-xs rounded-full bg-flow-50 text-flow-700 px-2.5 py-0.5 font-medium">
                  {ETIQUETA_ESTADO[c.estado] ?? c.estado}
                </span>
              </div>
              <p className="text-xs text-marmol-500">
                {formatearFecha(c.fecha_apertura)} → {formatearFecha(c.fecha_cierre_respuestas)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
