import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUrlFirmadaDocumentoColaborador } from '@/lib/supabase/storage';
import { ListaIncapacidades, type IncapacidadItem } from '@/components/espiral-crecimiento/lista-incapacidades';
import { notFound } from 'next/navigation';
import { ArrowLeft, HeartPulse } from 'lucide-react';

export default async function IncapacidadesColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, empresa_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Dato sensible de salud: mismo nivel de acceso que Documentos — solo
  // Talento Humano y el propio colaborador, ni siquiera el líder directo.
  const puedeVer = perfil.rol === 'admin_th' || (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const puedeEditar = perfil.rol === 'admin_th';

  const { data: incapacidadesRaw } = await supabase
    .from('incapacidades_colaborador')
    .select('id, tipo, fecha_inicio, fecha_fin, dias, entidad_emisora, soporte_url')
    .eq('colaborador_id', params.id)
    .order('fecha_inicio', { ascending: false });

  const items: IncapacidadItem[] = await Promise.all(
    (incapacidadesRaw ?? []).map(async (i) => ({
      id: i.id,
      tipo: i.tipo,
      fecha_inicio: i.fecha_inicio,
      fecha_fin: i.fecha_fin,
      dias: i.dias ?? 0,
      entidad_emisora: i.entidad_emisora,
      soporteUrl: await obtenerUrlFirmadaDocumentoColaborador(i.soporte_url),
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
          <HeartPulse size={22} className="text-flow-600" /> Incapacidades
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        <p className="text-xs text-marmol-400 mt-1">
          Sección de manejo exclusivo de Talento Humano y del propio colaborador.
        </p>
      </div>

      <div className="card p-5">
        <ListaIncapacidades colaboradorId={params.id} itemsIniciales={items} puedeEditar={puedeEditar} />
      </div>
    </div>
  );
}
