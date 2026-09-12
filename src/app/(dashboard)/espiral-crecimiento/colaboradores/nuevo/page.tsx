import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FormularioNuevoColaborador } from '@/components/espiral-crecimiento/formulario-nuevo-colaborador';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default async function NuevoColaboradorPage({
  searchParams,
}: {
  searchParams?: { nombre?: string; correo?: string; telefono?: string; cargoId?: string };
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const [{ data: cargos }, { data: colaboradores }, { data: cuentas }, { data: vinculadas }] = await Promise.all([
    supabase
      .from('cargos')
      .select('id, nombre, proceso_area')
      .eq('empresa_id', perfil.empresa_id)
      .order('proceso_area'),
    // Líderes posibles: activos o en período de prueba (alguien puede ser
    // jefe de área desde el día uno, antes de que su período de prueba
    // termine) — antes solo se ofrecía 'activo' y por eso un líder recién
    // ingresado no aparecía aquí para asignarle su equipo. Se excluyen
    // inactivo/en_proceso_salida porque no tiene sentido asignar como líder
    // nuevo a alguien que ya se está yendo.
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ['activo', 'periodo_prueba'])
      .order('nombre_completo'),
    supabase
      .from('perfiles_usuario')
      .select('id, nombre_completo, email')
      .eq('empresa_id', perfil.empresa_id)
      .order('nombre_completo'),
    supabase.from('colaboradores').select('usuario_id').eq('empresa_id', perfil.empresa_id).not('usuario_id', 'is', null),
  ]);

  // Cuentas de acceso que alguien creó desde Usuarios y roles pero que
  // quedaron sin ficha propia -- es justo el hueco que causó que un
  // colaborador recién creado no apareciera en listados que sí dependen de
  // `colaboradores` (Guía del Flow, informes, evaluaciones). Se ofrecen acá
  // para vincularlas en vez de dejar la cuenta huérfana.
  const idsVinculados = new Set((vinculadas ?? []).map((v) => v.usuario_id as string));
  const cuentasSinFicha = (cuentas ?? []).filter((c) => !idsVinculados.has(c.id));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/espiral-crecimiento/colaboradores"
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a Colaboradores
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <UserPlus size={22} className="text-flow-600" /> Nuevo colaborador
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Crea la ficha con sus datos personales, cargo y contrato. Una vez creada, desde su ficha
          podrás cargar también hoja de vida y certificaciones, inducción, documentos, incapacidades y
          fechas especiales — y si necesita acceso a la app, crear su cuenta desde Usuarios y roles.
        </p>
        {cuentasSinFicha.length > 0 && (
          <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2 mt-3">
            Hay {cuentasSinFicha.length} cuenta{cuentasSinFicha.length > 1 ? 's' : ''} de acceso creada
            {cuentasSinFicha.length > 1 ? 's' : ''} en Usuarios y roles sin una ficha de colaborador —
            por eso no aparecen en la Guía del Flow ni en otros listados. Si vas a registrar a esa
            persona ahora, selecciónala abajo en &quot;Vincular a una cuenta de acceso existente&quot; en
            vez de crearla de cero.
          </p>
        )}
      </div>

      {!cargos || cargos.length === 0 ? (
        <div className="card p-5 text-sm text-marmol-500">
          Todavía no hay ningún cargo creado en Administración → Cargos. Crea al menos un cargo antes
          de registrar colaboradores, para poder asociarle su perfil.
        </div>
      ) : (
        <FormularioNuevoColaborador
          cargos={cargos}
          posiblesLideres={colaboradores ?? []}
          cuentasSinFicha={cuentasSinFicha}
          datosIniciales={
            searchParams?.nombre
              ? {
                  nombreCompleto: searchParams.nombre,
                  correo: searchParams.correo ?? '',
                  telefono: searchParams.telefono ?? '',
                  cargoId: searchParams.cargoId ?? '',
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
