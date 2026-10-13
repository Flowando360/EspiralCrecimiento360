import type { RolUsuario } from '@/types/colaborador';
import { BarraSuperior } from './barra-superior';
import type { PermisosModulo } from '@/lib/supabase/get-perfil-actual';

/**
 * Estructura del dashboard: una sola barra de navegación arriba (con
 * desplegables por módulo en escritorio, y un menú deslizable de acordeón
 * en celular/tablet, con su propio botón ☰).
 */
export function AppShell({
  rol,
  esSuperadmin,
  nombre,
  alertasPendientes,
  notificacionesNoLeidas,
  mensajesNoLeidos,
  marca,
  permisos,
  children,
}: {
  rol: RolUsuario;
  esSuperadmin: boolean;
  nombre: string;
  alertasPendientes: number;
  notificacionesNoLeidas: number;
  mensajesNoLeidos: number;
  marca?: { nombre: string | null; logoUrl: string | null };
  permisos?: PermisosModulo | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-marmol-50">
      <BarraSuperior
        rol={rol}
        esSuperadmin={esSuperadmin}
        nombre={nombre}
        alertasPendientes={alertasPendientes}
        notificacionesNoLeidas={notificacionesNoLeidas}
        mensajesNoLeidos={mensajesNoLeidos}
        marca={marca}
        permisos={permisos}
      />
      <main className="p-4 sm:p-6 max-w-[1400px] w-full mx-auto min-w-0">{children}</main>
    </div>
  );
}
