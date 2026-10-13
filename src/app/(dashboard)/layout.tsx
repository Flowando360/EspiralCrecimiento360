import { redirect } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { css, variablesDeMarca } from '@/lib/marca/tema';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();
  if (!perfil) {
    await createClient().auth.signOut();
    redirect('/login?motivo=sin-acceso');
  }

  const supabase = createClient();
  const [{ count }, { count: countNotificaciones }, { count: countMensajes }, { data: empresa }] = await Promise.all([
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
    supabase
      .from('empresas')
      .select('nombre, logo_url, color_marca, color_secundario, color_acento')
      .eq('id', perfil.empresa_id)
      .maybeSingle(),
  ]);

  const tema = css(
    variablesDeMarca({
      colorMarca: empresa?.color_marca,
      colorSecundario: empresa?.color_secundario,
      colorAcento: empresa?.color_acento,
    })
  );

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: tema }} />
    <AppShell
      marca={{ nombre: empresa?.nombre ?? null, logoUrl: empresa?.logo_url ?? null }}
      permisos={perfil.permisos}
      rol={perfil.rol}
      nombre={perfil.nombre_preferido?.trim() || perfil.nombre_completo}
      alertasPendientes={count ?? 0}
      notificacionesNoLeidas={countNotificaciones ?? 0}
      mensajesNoLeidos={countMensajes ?? 0}
    >
      {children}
    </AppShell>
    </>
  );
}
