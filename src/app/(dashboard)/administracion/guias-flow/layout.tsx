import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { TabsGuiasFlow } from './TabsGuiasFlow';

/**
 * Layout compartido de las 2 pantallas de "Guías del Flow" (antes solo
 * existía "Invitaciones" en /administracion/invitaciones-guia-flow — ver
 * migración de esa ruta a acá). El chequeo de rol vive acá una sola vez
 * para las dos pestañas; cada page.tsx hijo puede seguir asumiendo que
 * quien llega ya es admin_th.
 */
export default async function GuiasFlowLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Guías del Flow</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Invita a tu gente a hacer su cuestionario de la Guía del Flow y haz seguimiento de quiénes ya
          respondieron.
        </p>
      </div>

      <TabsGuiasFlow />

      {children}
    </div>
  );
}
