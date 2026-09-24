'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { RolUsuario } from '@/types/colaborador';
import { Sidebar } from './sidebar';
import { Header } from './header';

/**
 * Estructura del dashboard. En escritorio (lg+) la barra lateral queda fija a
 * la izquierda; en celular/tablet se oculta y se abre como menú deslizable
 * desde el botón ☰ del encabezado.
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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al navegar.
  useEffect(() => setMenuAbierto(false), [pathname]);

  // Evita que la página de fondo se desplace mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  return (
    <div className="flex min-h-screen bg-marmol-50">
      <Sidebar rol={rol} esSuperadmin={esSuperadmin} abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          nombre={nombre}
          rol={rol}
          alertasPendientes={alertasPendientes}
          notificacionesNoLeidas={notificacionesNoLeidas}
          mensajesNoLeidos={mensajesNoLeidos}
          onAbrirMenu={() => setMenuAbierto(true)}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
