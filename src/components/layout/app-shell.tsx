import type { RolUsuario } from '@/types/colaborador';
import { BarraSuperior } from './barra-superior';

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
  children,
}: {
  rol: RolUsuario;
  esSuperadmin: boolean;
  nombre: string;
  alertasPendientes: number;
  notificacionesNoLeidas: number;
  mensajesNoLeidos: number;
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
      />
      <main className="p-4 sm:p-6 max-w-[1400px] w-full mx-auto min-w-0">{children}</main>
    </div>
  );
}
