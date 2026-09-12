import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { FormularioEditarColaborador } from '@/components/espiral-crecimiento/formulario-editar-colaborador';
import { ArrowLeft, Pencil } from 'lucide-react';

export default async function EditarColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const [{ data: colaborador }, { data: cargos }, { data: colaboradores }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select(
        'id, empresa_id, nombre_completo, numero_documento, email, telefono, cargo_id, lider_id, fecha_ingreso, tipo_contrato, estado, salario, eps, arl, afp, caja_compensacion'
      )
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('cargos').select('id, nombre, proceso_area').eq('empresa_id', perfil.empresa_id).order('proceso_area'),
    // Mismo criterio que en "Nuevo colaborador": activos o en período de
    // prueba pueden ser líder. Se excluye a la propia persona de su lista de
    // posibles líderes (no puede ser su propio jefe).
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ['activo', 'periodo_prueba'])
      .neq('id', params.id)
      .order('nombre_completo'),
  ]);

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Pencil size={20} className="text-flow-600" /> Editar {colaborador.nombre_completo}
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Corrige cualquier dato de su ficha — datos personales, cargo, líder, contrato y afiliaciones.
        </p>
      </div>

      <FormularioEditarColaborador
        cargos={cargos ?? []}
        posiblesLideres={colaboradores ?? []}
        datosIniciales={{
          id: colaborador.id,
          nombreCompleto: colaborador.nombre_completo,
          numeroDocumento: colaborador.numero_documento ?? '',
          email: colaborador.email ?? '',
          telefono: colaborador.telefono ?? '',
          cargoId: colaborador.cargo_id,
          liderId: colaborador.lider_id ?? '',
          fechaIngreso: colaborador.fecha_ingreso,
          tipoContrato: colaborador.tipo_contrato,
          estado: colaborador.estado,
          salario: colaborador.salario != null ? String(colaborador.salario) : '',
          eps: colaborador.eps ?? '',
          arl: colaborador.arl ?? '',
          afp: colaborador.afp ?? '',
          cajaCompensacion: colaborador.caja_compensacion ?? '',
        }}
      />
    </div>
  );
}
