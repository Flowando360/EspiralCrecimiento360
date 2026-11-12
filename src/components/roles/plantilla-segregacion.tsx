'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearRolTalentoHumanoOperativo } from '@/app/(dashboard)/administracion/roles/actions';
import { UserCog } from 'lucide-react';

/** Un clic para crear el rol «Talento Humano (operativo)»: todo menos Administración. */
export function PlantillaSegregacion() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearRolTalentoHumanoOperativo();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setListo(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-2">
      <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
        <UserCog size={16} /> Separar a Talento Humano del Administrador
      </h2>
      <p className="text-sm text-marmol-600">
        Quien opera Talento Humano día a día no debería poder cambiar permisos ni configuración (principio de segregación de funciones que piden ISO 9001, COSO y las auditorías del SG-SST).
        Con esta plantilla creas el rol <strong>Talento Humano (operativo)</strong>: acceso a todos los módulos de trabajo, sin Administración.
      </p>
      <ol className="text-xs text-marmol-500 list-decimal pl-5 space-y-0.5">
        <li>Crea la plantilla con el botón.</li>
        <li>En <strong>Usuarios y roles</strong>, deja a una persona como administrador con acceso completo (sin rol personalizado).</li>
        <li>A quien opera Talento Humano déjale el rol de sistema «admin_th» y asígnale el rol personalizado «Talento Humano (operativo)».</li>
      </ol>
      <button
        type="button"
        onClick={crear}
        disabled={pending || listo}
        className="rounded-lg border border-flow-300 text-flow-700 hover:bg-flow-50 disabled:opacity-40 text-sm font-medium px-3.5 py-1.5 transition"
      >
        {listo ? 'Plantilla creada' : pending ? 'Creando…' : 'Crear rol «Talento Humano (operativo)»'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
