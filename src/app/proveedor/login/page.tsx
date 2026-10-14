import Link from 'next/link';
import { ProveedorLoginForm } from '@/components/proveedor/login-form';

export default function ProveedorLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-marmol-50 p-4">
      <div className="card w-full max-w-sm p-6 space-y-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-secundario">Panel del proveedor</h1>
          <p className="text-xs text-marmol-500 mt-1">Acceso del equipo de Espiral de Crecimiento 360°. Separado de las cuentas de cada empresa.</p>
        </div>
        <ProveedorLoginForm />
        <p className="text-center text-xs text-marmol-500">
          <Link href="/recuperar-contrasena" className="text-flow-700 hover:underline">¿Olvidaste tu contraseña?</Link>
        </p>
      </div>
    </main>
  );
}
