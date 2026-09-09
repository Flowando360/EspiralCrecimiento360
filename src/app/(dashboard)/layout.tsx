import { redirect } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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
    <div className="flex min-h-screen bg-marmol-50">
      <Sidebar rol={perfil.rol} esSuperadmin={perfil.es_superadmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          nombre={perfil.nombre_preferido?.trim() || perfil.nombre_completo}
          rol={perfil.rol}
          alertasPendientes={count ?? 0}
          notificacionesNoLeidas={countNotificaciones ?? 0}
          mensajesNoLeidos={countMensajes ?? 0}
        />
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
