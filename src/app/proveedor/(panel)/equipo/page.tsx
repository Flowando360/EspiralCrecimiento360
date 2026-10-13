import { redirect } from 'next/navigation';
import { requerirPropietario } from '@/lib/proveedor/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { GestorEquipo, type ProveedorFila } from '@/components/proveedor/gestor-equipo';

export default async function EquipoProveedorPage() {
  const propietario = await requerirPropietario();
  if (!propietario) redirect('/proveedor');

  const admin = createAdminClient();
  const { data } = await admin
    .from('proveedores')
    .select('id, nombre, email, rol, activo, ultimo_acceso_en')
    .order('nombre');

  const equipo: ProveedorFila[] = (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    rol: p.rol as ProveedorFila['rol'],
    activo: p.activo,
    ultimoAcceso: p.ultimo_acceso_en,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Equipo proveedor</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Quién puede entrar al panel del proveedor. Solo los propietarios gestionan el equipo.
        </p>
      </div>
      <GestorEquipo equipo={equipo} proveedorActualId={propietario.id} />
    </div>
  );
}
