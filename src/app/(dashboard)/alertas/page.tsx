import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertaSeveridadDot, AlertaTipoBadge } from '@/components/alertas/alerta-badge';
import { AccionesAlerta } from '@/components/alertas/acciones-alerta';
import { formatearFecha, diasHasta } from '@/lib/utils';
import { Bell } from 'lucide-react';

export default async function AlertasPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  let query = supabase
    .from('alertas')
    .select('id, tipo, severidad, titulo, descripcion, fecha_objetivo, estado, colaborador:colaborador_id(nombre_completo)')
    .in('estado', ['pendiente', 'notificada'])
    .order('fecha_objetivo', { ascending: true });

  if (perfil.rol === 'colaborador' && perfil.colaborador_id) {
    query = query.eq('colaborador_id', perfil.colaborador_id);
  }

  const { data: alertas } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Alertas y fechas clave</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Contratos, SST (exámenes, certificaciones, EPP), formación, Ciclos de Crecimiento y cultura
          (cumpleaños, aniversarios de ingreso y de bodas, baby showers).
        </p>
      </div>

      {!alertas || alertas.length === 0 ? (
        <EmptyState icon={Bell} titulo="No hay alertas pendientes" descripcion="Todo al día por ahora." />
      ) : (
        <div className="card divide-y divide-marmol-100">
          {alertas.map((a: any) => {
            const dias = diasHasta(a.fecha_objetivo);
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <AlertaSeveridadDot severidad={a.severidad} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-marmol-800">{a.titulo}</p>
                  <p className="text-xs text-marmol-400">
                    {a.colaborador?.nombre_completo}
                    {a.descripcion ? ` · ${a.descripcion}` : ''}
                  </p>
                </div>
                <AlertaTipoBadge tipo={a.tipo} />
                <div className="text-right w-32 shrink-0">
                  <p className="text-xs text-marmol-500">{formatearFecha(a.fecha_objetivo)}</p>
                  <p className="text-xs text-marmol-400">
                    {dias === 0 ? 'Hoy' : dias > 0 ? `En ${dias} días` : `Hace ${-dias} días`}
                  </p>
                </div>
                {perfil.rol === 'admin_th' && <AccionesAlerta id={a.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
