import { redirect } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();
  if (!perfil) redirect('/login');

  const supabase = createClient();
  const [{ count }, { count: countNotificaciones }, { count: countMensajes }] = await Promise.all([
    supabase
      .from('alertas')
      .select('*', { count: 'exact', head: true })
      .eq('colaborador_id', perfil.colaborador_id ?? '')
      .in('estado', ['pendiente', 'notificada']),
    supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('destinatario_usuario_id', perfil.usuario_id)
      .eq('leido', false),
    supabase
      .from('mensajes_directos')
      .select('*', { count: 'exact', head: true })
      .eq('destinatario_id', perfil.usuario_id)
      .eq('leido', false),
  ]);

  return (
    <AppShell
      rol={perfil.rol}
      esSuperadmin={perfil.es_superadmin}
      nombre={perfil.nombre_preferido?.trim() || perfil.nombre_completo}
      alertasPendientes={count ?? 0}
      notificacionesNoLeidas={countNotificaciones ?? 0}
      mensajesNoLeidos={countMensajes ?? 0}
    >
      {children}
    </AppShell>
  );
}
