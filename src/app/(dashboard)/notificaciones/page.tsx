import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { ListaNotificaciones } from '@/components/espiral-crecimiento/lista-notificaciones';
import { Mail } from 'lucide-react';

export default async function NotificacionesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: notificaciones } = await supabase
    .from('notificaciones')
    .select('id, asunto, cuerpo, leido, created_at')
    .eq('destinatario_usuario_id', perfil.usuario_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Notificaciones</h1>
        <p className="text-sm text-marmol-500 mt-1">Recordatorios y avisos dirigidos a ti.</p>
      </div>

      {!notificaciones || notificaciones.length === 0 ? (
        <EmptyState icon={Mail} titulo="Sin notificaciones" descripcion="Aquí aparecerán tus recordatorios y avisos." />
      ) : (
        <ListaNotificaciones itemsIniciales={notificaciones} />
      )}
    </div>
  );
}
