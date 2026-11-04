import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FolderLock, Pencil, Sparkles } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { SeguimientoExterno } from '@/components/espiral-crecimiento/seguimiento-externo';
import { AccionesExterno } from '@/components/espiral-crecimiento/acciones-externo';
import { ETIQUETA_TIPO_EXTERNO, diasParaFecha } from '@/lib/colaboradores/externos';
import { formatearFecha, primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ExternoDetallePage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: e } = await supabase
    .from('colaboradores')
    .select('id, empresa_id, nombre_completo, numero_documento, email, telefono, estado, es_externo, lider_id, fecha_ingreso, tipo_externo, entidad_externa, servicio, fecha_fin_vinculo, notas_externo, lider:lider_id(nombre_completo)')
    .eq('id', params.id)
    .maybeSingle();
  if (!e || e.empresa_id !== perfil.empresa_id) notFound();
  if (!e.es_externo) {
    // Es un colaborador vinculado: su ficha es la de siempre
    const { redirect } = await import('next/navigation');
    redirect(`/espiral-crecimiento/colaboradores/${params.id}`);
  }

  const esAdmin = perfil.rol === 'admin_th';
  const esResponsable = perfil.rol === 'lider' && e.lider_id === perfil.colaborador_id;
  if (!esAdmin && !esResponsable && perfil.rol !== 'gerencia') notFound();

  const { data: seguimiento } = await supabase
    .from('externos_seguimiento')
    .select('id, fecha, calificacion, comentario')
    .eq('colaborador_id', params.id)
    .order('fecha', { ascending: false });

  const dias = diasParaFecha(e.fecha_fin_vinculo);
  const responsable = (primero(e.lider as any) as { nombre_completo?: string } | null)?.nombre_completo;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/espiral-crecimiento/externos" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Externos
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario">{e.nombre_completo}</h1>
            <p className="text-sm text-marmol-500">
              {ETIQUETA_TIPO_EXTERNO[e.tipo_externo ?? 'otro'] ?? 'Externo'}
              {e.servicio ? ` · ${e.servicio}` : ''}
              {e.entidad_externa ? ` · ${e.entidad_externa}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-marmol-100 px-3 py-1 text-xs font-medium text-marmol-600">{e.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
            {esAdmin && (
              <Link
                href={`/espiral-crecimiento/externos/${params.id}/editar`}
                className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 hover:text-flow-600 text-xs font-medium px-2.5 py-1.5"
              >
                <Pencil size={12} /> Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="card p-5 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Dato t="Responsable interno" v={responsable ?? 'Sin responsable'} />
        <Dato t="Documento" v={e.numero_documento ?? '—'} />
        <Dato t="Correo" v={e.email ?? '—'} />
        <Dato t="Teléfono" v={e.telefono ?? '—'} />
        <Dato t="Inicio del vínculo" v={formatearFecha(e.fecha_ingreso)} />
        <Dato
          t="Fin del contrato o servicio"
          v={
            e.fecha_fin_vinculo
              ? `${formatearFecha(e.fecha_fin_vinculo)}${e.estado === 'activo' && dias != null && dias <= 30 ? (dias < 0 ? ' · vencido' : ` · vence en ${dias} días`) : ''}`
              : 'Sin fecha'
          }
        />
        {e.notas_externo && (
          <div className="sm:col-span-2">
            <Dato t="Notas" v={e.notas_externo} />
          </div>
        )}
      </section>

      {esAdmin && (
        <div className="flex flex-wrap gap-3">
          <Link href={`/espiral-crecimiento/colaboradores/${params.id}/documentos`} className="inline-flex items-center gap-1.5 card px-3.5 py-2 text-sm text-marmol-700 hover:border-flow-300">
            <FolderLock size={14} className="text-flow-600" /> Documentos (contrato, RUT, ARL…)
          </Link>
          <Link href={`/espiral-crecimiento/colaboradores/${params.id}/guia-flow`} className="inline-flex items-center gap-1.5 card px-3.5 py-2 text-sm text-marmol-700 hover:border-flow-300">
            <Sparkles size={14} className="text-ser" /> Guía del Flow
          </Link>
        </div>
      )}

      <SeguimientoExterno
        colaboradorId={params.id}
        items={(seguimiento ?? []) as any}
        puedeRegistrar={esAdmin || esResponsable}
        puedeBorrar={esAdmin}
      />

      {esAdmin && <AccionesExterno colaboradorId={params.id} nombre={e.nombre_completo} />}
    </div>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-marmol-400">{t}</p>
      <p className="text-marmol-800">{v}</p>
    </div>
  );
}
