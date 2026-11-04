import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';
import { FormularioExterno } from '@/components/espiral-crecimiento/formulario-externo';

export default async function EditarExternoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const [{ data: e }, { data: resp }] = await Promise.all([
    supabase.from('colaboradores').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('es_externo', false)
      .in('estado', ESTADOS_VIGENTES)
      .order('nombre_completo'),
  ]);
  if (!e || e.empresa_id !== perfil.empresa_id || !e.es_externo) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/espiral-crecimiento/externos/${params.id}`} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Editar externo</h1>
      </div>
      <FormularioExterno
        colaboradorId={params.id}
        responsables={(resp ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre_completo }))}
        datosIniciales={{
          nombreCompleto: e.nombre_completo,
          numeroDocumento: e.numero_documento ?? '',
          email: e.email ?? '',
          telefono: e.telefono ?? '',
          tipoExterno: (e.tipo_externo ?? 'otro') as any,
          entidad: e.entidad_externa ?? '',
          servicio: e.servicio ?? '',
          responsableId: e.lider_id ?? '',
          fechaInicio: e.fecha_ingreso,
          fechaFin: e.fecha_fin_vinculo ?? '',
          notas: e.notas_externo ?? '',
          estado: e.estado === 'inactivo' ? 'inactivo' : 'activo',
        }}
      />
    </div>
  );
}
