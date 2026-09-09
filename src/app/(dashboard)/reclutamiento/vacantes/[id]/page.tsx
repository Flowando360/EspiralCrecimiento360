import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { notFound } from 'next/navigation';
import { TableroPostulaciones } from '@/components/reclutamiento/tablero-postulaciones';
import { EnlacePostulacion } from '@/components/reclutamiento/enlace-postulacion';
import { SelectorEstadoVacante } from '@/components/reclutamiento/selector-estado-vacante';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default async function DetalleVacantePage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();

  const { data: vacante } = await supabase
    .from('vacantes')
    .select('id, empresa_id, titulo, descripcion, estado, fecha_apertura, fecha_cierre, cargo:cargos(id, nombre)')
    .eq('id', params.id)
    .maybeSingle();

  if (!vacante || vacante.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: postulaciones }, { data: colaboradores }, { data: candidatosEmpresa }] = await Promise.all([
    supabase
      .from('postulaciones')
      .select(
        `id, etapa, calificacion, notas, descartado_motivo, orden, created_at,
         candidato:candidatos(id, nombre_completo, correo, telefono, hoja_vida_url),
         entrevistas(id, fecha_hora, modalidad, estado, notas, entrevistador:colaboradores(id, nombre_completo))`
      )
      .eq('vacante_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .order('nombre_completo'),
    supabase
      .from('candidatos')
      .select('id, nombre_completo, correo')
      .eq('empresa_id', perfil.empresa_id)
      .order('nombre_completo'),
  ]);

  const idsYaPostulados = new Set((postulaciones ?? []).map((p: any) => p.candidato.id));
  const candidatosDisponibles = (candidatosEmpresa ?? []).filter((c) => !idsYaPostulados.has(c.id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reclutamiento" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Reclutamiento
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
              <Briefcase size={22} className="text-flow-600" /> {vacante.titulo}
            </h1>
            <p className="text-sm text-marmol-500 mt-1">
              Cargo: {(vacante.cargo as any)?.nombre ?? 'Sin cargo'} · Abierta el {vacante.fecha_apertura}
            </p>
            {vacante.descripcion && <p className="text-sm text-marmol-600 mt-2 max-w-2xl">{vacante.descripcion}</p>}
          </div>
          {perfil.rol === 'admin_th' && <SelectorEstadoVacante vacanteId={vacante.id} estadoActual={vacante.estado} />}
        </div>
      </div>

      {perfil.rol === 'admin_th' && <EnlacePostulacion vacanteId={vacante.id} />}

      <TableroPostulaciones
        vacanteId={vacante.id}
        cargoId={(vacante.cargo as any)?.id ?? ''}
        postulaciones={(postulaciones ?? []) as any}
        colaboradores={colaboradores ?? []}
        candidatosDisponibles={candidatosDisponibles}
        puedeAdministrar={perfil.rol === 'admin_th'}
        miColaboradorId={perfil.colaborador_id}
      />
    </div>
  );
}
