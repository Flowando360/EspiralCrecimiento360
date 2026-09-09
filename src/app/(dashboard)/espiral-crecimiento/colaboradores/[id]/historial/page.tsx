import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUrlFirmadaDocumentoColaborador } from '@/lib/supabase/storage';
import { ListaHistorialMovimientos, type MovimientoItem } from '@/components/espiral-crecimiento/lista-historial-movimientos';
import { EntrevistaSalida } from '@/components/espiral-crecimiento/entrevista-salida';
import { notFound } from 'next/navigation';
import { ArrowLeft, History } from 'lucide-react';

export default async function HistorialColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, empresa_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Misma regla que RLS: admin_th todo, líder solo su equipo. El colaborador
  // no tiene ninguna policy en historial_movimientos ni en entrevistas_salida
  // (información de manejo exclusivo de Talento Humano/líder), así que no
  // entra aquí en absoluto.
  const esAdminTh = perfil.rol === 'admin_th';
  const puedeVer = esAdminTh || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!puedeVer) notFound();

  const [{ data: movimientosRaw }, { data: cargos }, { data: entrevista }] = await Promise.all([
    supabase
      .from('historial_movimientos')
      .select('id, tipo, fecha, descripcion, gravedad, soporte_url, cargo_anterior:cargo_anterior_id(nombre), cargo_nuevo:cargo_nuevo_id(nombre)')
      .eq('colaborador_id', params.id)
      .order('fecha', { ascending: false }),
    esAdminTh
      ? supabase.from('cargos').select('id, nombre').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('nombre')
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    esAdminTh
      ? supabase.from('entrevistas_salida').select('*').eq('colaborador_id', params.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const itemsConSoporte: MovimientoItem[] = await Promise.all(
    (movimientosRaw ?? []).map(async (m) => ({
      ...(m as unknown as MovimientoItem),
      soporteUrl: await obtenerUrlFirmadaDocumentoColaborador((m as any).soporte_url),
    }))
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <History size={22} className="text-flow-600" /> Historial
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Línea de tiempo</h2>
        <ListaHistorialMovimientos
          colaboradorId={params.id}
          itemsIniciales={itemsConSoporte}
          puedeEditar={esAdminTh}
          cargos={cargos ?? []}
        />
      </div>

      {esAdminTh && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-1">Entrevista de salida</h2>
          <p className="text-xs text-marmol-400 mb-3">Solo visible para Talento Humano.</p>
          <EntrevistaSalida colaboradorId={params.id} inicial={entrevista as any} />
        </div>
      )}
    </div>
  );
}
