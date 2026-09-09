import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { AlzaSalarialMasiva } from '@/components/espiral-crecimiento/alza-salarial-masiva';

export default async function AdminSalariosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Salarios</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Actualiza el salario registrado de varios colaboradores a la vez — pensado para las alzas anuales de
          salario mínimo (legal o de empresa), no para gestión de nómina.
        </p>
      </div>

      <AlzaSalarialMasiva />
    </div>
  );
}
