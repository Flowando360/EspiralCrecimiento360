'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { etiquetaRol } from '@/lib/utils';
import { LogOut, Bell, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { CentroAyudaBoton } from '@/components/ayuda/centro-ayuda-boton';

export function Header({
  nombre,
  rol,
  alertasPendientes = 0,
  notificacionesNoLeidas = 0,
  mensajesNoLeidos = 0,
}: {
  nombre: string;
  rol: string;
  alertasPendientes?: number;
  notificacionesNoLeidas?: number;
  mensajesNoLeidos?: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-marmol-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        <CentroAyudaBoton />
        <Link
          href="/alertas"
          className="relative rounded-lg p-2 text-marmol-500 hover:bg-marmol-100 transition"
          title="Alertas de fechas clave"
        >
          <Bell size={18} />
          {alertasPendientes > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-bajo text-white text-[10px] flex items-center justify-center px-1">
              {alertasPendientes}
            </span>
          )}
        </Link>
        <Link
          href="/notificaciones"
          className="relative rounded-lg p-2 text-marmol-500 hover:bg-marmol-100 transition"
          title="Notificaciones"
        >
          <Mail size={18} />
          {notificacionesNoLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-bajo text-white text-[10px] flex items-center justify-center px-1">
              {notificacionesNoLeidas}
            </span>
          )}
        </Link>
        <Link
          href="/mensajes"
          className="relative rounded-lg p-2 text-marmol-500 hover:bg-marmol-100 transition"
          title="Mensajes"
        >
          <MessageCircle size={18} />
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-bajo text-white text-[10px] flex items-center justify-center px-1">
              {mensajesNoLeidos}
            </span>
          )}
        </Link>
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-marmol-900">{nombre}</p>
          <p className="text-xs text-marmol-400">{etiquetaRol[rol] ?? rol}</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="rounded-lg p-2 text-marmol-500 hover:bg-marmol-100 transition"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
