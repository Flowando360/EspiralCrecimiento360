import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProveedorActual } from '@/lib/proveedor/auth';
import { cerrarSesionProveedor } from '@/app/proveedor/login/actions';

export default async function PanelProveedorLayout({ children }: { children: React.ReactNode }) {
  const proveedor = await getProveedorActual();
  if (!proveedor) redirect('/proveedor/login');

  return (
    <div className="min-h-screen bg-marmol-50">
      <header className="bg-barra text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <span className="font-display font-semibold">Proveedor · Espiral de Crecimiento 360°</span>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/proveedor" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Empresas</Link>
            {proveedor.rol === 'propietario' && (
              <Link href="/proveedor/equipo" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Equipo</Link>
            )}
            <Link href="/proveedor/bitacora" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Bitácora</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-white/80">
            <span>{proveedor.nombre} ({proveedor.rol})</span>
            <form action={cerrarSesionProveedor}>
              <button type="submit" className="rounded-lg border border-white/20 px-2.5 py-1 hover:bg-white/10">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
