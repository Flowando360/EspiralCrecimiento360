import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { notFound } from 'next/navigation';
import { TableroPostulaciones } from '@/components/reclutamiento/tablero-postulaciones';
import { EnlacePostulacion } from '@/components/reclutamiento/enlace-postulacion';
import { SelectorEstadoVacante } from '@/components/reclutamiento/selector-estado-vacante';
import { EditarVacante } from '@/components/reclutamiento/editar-vacante';
import { EnviarALider } from '@/components/reclutamiento/enviar-a-lider';
import { PanelCriterios, type CriterioFila } from '@/components/reclutamiento/panel-criterios';
import { RankingMatch, type EvaluacionFila, type SinEvaluacion } from '@/components/reclutamiento/ranking-match';
import { ArrowLeft, Briefcase, Wallet, UserCog } from 'lucide-react';

const ESTADO_LABEL: Record<string, string> = { abierta: 'Abierta', pausada: 'En pausa', cancelada: 'Cancelada', cubierta: 'Cubierto', cerrada: 'Cerrada' };
const ETAPA_LABEL: Record<string, string> = {
  recibido: 'Recibido',
  preseleccionado: 'Preseleccionado',
  evaluacion_lider: 'Evaluación del líder',
  devuelto_th: 'Devuelto a Talento Humano',
  entrevista: 'Entrevista',
  prueba: 'Prueba',
  oferta: 'Oferta',
  contratado: 'Contratado',
  descartado: 'Descartado',
};
const ESTADO_CLASE: Record<string, string> = {
  abierta: 'bg-alto/10 text-alto',
  pausada: 'bg-medio/10 text-medio',
  cancelada: 'bg-bajo/10 text-bajo',
  cubierta: 'bg-flow-50 text-flow-700',
  cerrada: 'bg-marmol-200 text-marmol-500',
};

export default async function DetalleVacantePage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();

  const { data: vacante } = await supabase
    .from('vacantes')
    .select(
      'id, empresa_id, titulo, descripcion, estado, fecha_apertura, fecha_cierre, presupuesto_salarial, cargo:cargos(id, nombre), lider_solicitante:lider_solicitante_id(id, nombre_completo)'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!vacante || vacante.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: postulaciones }, { data: colaboradores }, { data: candidatosEmpresa }, { data: cargos }, { data: lideres }, { data: criterios }, { data: evaluaciones }] = await Promise.all([
    supabase
      .from('postulaciones')
      .select(
        `id, etapa, calificacion, notas, descartado_motivo, orden, created_at,
         evaluacion_lider, evaluacion_lider_en,
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
    supabase.from('cargos').select('id, nombre').eq('empresa_id', perfil.empresa_id).order('nombre'),
    supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ['activo', 'periodo_prueba'])
      .order('nombre_completo'),
    supabase
      .from('criterios_evaluacion')
      .select('id, origen, categoria, tipo, descripcion, valor_requerido, nivel_requerido, meses_requeridos, peso, activo')
      .eq('vacante_id', params.id)
      .order('created_at', { ascending: true }),
    // Solo las evaluaciones vigentes; las anteriores quedan como historial en la base.
    supabase
      .from('match_evaluaciones')
      .select(
        `id, postulacion_id, puntaje, cobertura, clasificacion, provisional, obligatorios_estado, fortalezas, brechas, version_reglas,
         detalles:match_evaluacion_detalles(descripcion_criterio, categoria, tipo, resultado, puntaje, evidencia, motivo)`
      )
      .eq('vacante_id', params.id)
      .eq('vigente', true),
  ]);

  const idsYaPostulados = new Set((postulaciones ?? []).map((p: any) => p.candidato.id));

  // Ranking: una fila por postulación con evaluación vigente; el resto queda pendiente de calcular.
  const postulacionesPorId = new Map((postulaciones ?? []).map((p: any) => [p.id, p]));
  const filasRanking: EvaluacionFila[] = (evaluaciones ?? []).flatMap((ev: any) => {
    const p: any = postulacionesPorId.get(ev.postulacion_id);
    if (!p) return [];
    return [
      {
        postulacion_id: ev.postulacion_id,
        candidato: p.candidato?.nombre_completo ?? 'Sin nombre',
        etapa: ETAPA_LABEL[p.etapa] ?? p.etapa,
        puntaje: ev.puntaje === null ? null : Number(ev.puntaje),
        cobertura: Number(ev.cobertura),
        clasificacion: ev.clasificacion,
        provisional: ev.provisional,
        obligatorios_estado: ev.obligatorios_estado,
        fortalezas: (ev.fortalezas as string[]) ?? [],
        brechas: (ev.brechas as string[]) ?? [],
        version_reglas: ev.version_reglas,
        detalles: (ev.detalles ?? []).map((d: any) => ({
          descripcion: d.descripcion_criterio,
          categoria: d.categoria,
          tipo: d.tipo,
          resultado: d.resultado,
          puntaje: d.puntaje === null ? null : Number(d.puntaje),
          evidencia: d.evidencia,
          motivo: d.motivo ?? '',
        })),
      },
    ];
  });
  const conEvaluacion = new Set(filasRanking.map((f) => f.postulacion_id));
  const sinEvaluacion: SinEvaluacion[] = (postulaciones ?? [])
    .filter((p: any) => !conEvaluacion.has(p.id))
    .map((p: any) => ({ postulacion_id: p.id, candidato: p.candidato?.nombre_completo ?? 'Sin nombre' }));
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
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-marmol-500">
              <span className="inline-flex items-center gap-1">
                <UserCog size={12} /> Líder solicitante: {(vacante.lider_solicitante as any)?.nombre_completo ?? 'Sin especificar'}
              </span>
              {vacante.presupuesto_salarial != null && (
                <span className="inline-flex items-center gap-1">
                  <Wallet size={12} /> Presupuesto: $ {Number(vacante.presupuesto_salarial).toLocaleString('es-CO')}
                </span>
              )}
            </div>
            {vacante.descripcion && <p className="text-sm text-marmol-600 mt-2 max-w-2xl">{vacante.descripcion}</p>}
            {perfil.rol === 'admin_th' && (
              <div className="mt-2">
                <EditarVacante
                  vacanteId={vacante.id}
                  cargos={cargos ?? []}
                  lideres={lideres ?? []}
                  datosIniciales={{
                    titulo: vacante.titulo,
                    descripcion: vacante.descripcion ?? '',
                    cargoId: (vacante.cargo as any)?.id ?? '',
                    liderSolicitanteId: (vacante.lider_solicitante as any)?.id ?? '',
                    presupuestoSalarial: vacante.presupuesto_salarial != null ? String(vacante.presupuesto_salarial) : '',
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${ESTADO_CLASE[vacante.estado]}`}>{ESTADO_LABEL[vacante.estado]}</span>
            {perfil.rol === 'admin_th' && <SelectorEstadoVacante vacanteId={vacante.id} estadoActual={vacante.estado} />}
          </div>
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

      <PanelCriterios vacanteId={vacante.id} criterios={(criterios ?? []) as CriterioFila[]} puedeAdministrar={perfil.rol === 'admin_th'} />

      <RankingMatch
        vacanteId={vacante.id}
        evaluaciones={filasRanking}
        sinEvaluacion={sinEvaluacion}
        puedeCalcular={perfil.rol === 'admin_th'}
      />

      {perfil.rol === 'admin_th' && (
        <section className="card p-4 space-y-3">
          <div>
            <h2 className="font-display font-semibold text-secundario text-sm">Evaluación por el líder</h2>
            <p className="text-xs text-marmol-400">
              Paso 2: envía a un líder los candidatos preseleccionados. El líder solo verá a quien le asignes y por el plazo que definas.
            </p>
          </div>
          {(postulaciones ?? []).filter((p: any) => p.etapa === 'preseleccionado' || p.etapa === 'devuelto_th').length === 0 ? (
            <p className="text-sm text-marmol-500">No hay candidatos preseleccionados para enviar.</p>
          ) : (
            (postulaciones ?? [])
              .filter((p: any) => p.etapa === 'preseleccionado' || p.etapa === 'devuelto_th')
              .map((p: any) => (
                <div key={p.id} className="border-b border-marmol-50 last:border-0 py-2 space-y-1.5">
                  <p className="text-sm font-medium text-marmol-800">{p.candidato?.nombre_completo}</p>
                  {p.etapa === 'devuelto_th' && p.evaluacion_lider && (
                    <p className="text-xs text-marmol-600 bg-marmol-50 rounded-lg p-2">Apreciaciones del líder: {p.evaluacion_lider}</p>
                  )}
                  <EnviarALider postulacionId={p.id} lideres={(lideres ?? []) as any} />
                </div>
              ))
          )}
        </section>
      )}
    </div>
  );
}
