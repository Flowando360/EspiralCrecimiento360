import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { AsistenteChat } from '@/components/espiral-crecimiento/asistente-chat';

export default async function AsistenteIaPage() {
  const perfil = await getPerfilActual();
  return <AsistenteChat esAdminTh={perfil?.rol === 'admin_th'} />;
}
