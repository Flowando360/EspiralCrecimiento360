import { notFound } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { PanelParticipantesSimulacro } from '@/components/espiral-crecimiento/panel-participantes-simulacro';
import { EditarSimulacro } from '@/components/espiral-crecimiento/editar-simulacro';
import { ActaSimulacro } from '@/components/espiral-crecimiento/acta-simulacro';
import { HallazgosSimulacro } from '@/components/espiral-crecimiento/hallazgos-simulacro';
import { AdjuntosSimulacro, type AdjuntoVista } from '@/components/espiral-crecimiento/adjuntos-simulacro';
import { formatearFecha } from '@/lib/utils';

export default async function DetalleSimulacroPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: simulacro } = await supabase
    .from('nexa_simulacros')
    .select('id, titulo, descripcion, fecha, participantes_esperados, tipo, sede, escenario, duracion_minutos, tiempo_evacuacion_esperado_min, tiempo_evacuacion_real_min, brigadistas_participantes, observaciones_brigada, adjuntos')
    .eq('id', params.id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!simulacro) notFound();

  const { data: participantes } = await supabase
    .from('nexa_simulacro_participantes')
    .select('colaborador_id, asistio, calificacion_desempeno, colaborador:colaborador_id(nombre_completo)')
    .eq('simulacro_id', simulacro.id);

  const { data: hallazgosRaw } = await supabase
    .from('nexa_simulacro_hallazgos')
    .select('id, descripcion, categoria, severidad, acpm_id, acpm:acpm_id(codigo)')
    .eq('simulacro_id', simulacro.id)
    .order('creado_en');

  const adjuntosRaw = (Array.isArray(simulacro.adjuntos) ? simulacro.adjuntos : []) as { nombre: string; ruta: string; tipo: string; tamano: number }[];
  const adjuntos: AdjuntoVista[] = await Promise.all(
    adjuntosRaw.map(async (a) => {
      const { data } = await supabase.storage.from('simulacros').createSignedUrl(a.ruta, 3600);
      return { ...a, url: data?.signedUrl ?? null };
    })
  );

  const esAdminTh = perfil.rol === 'admin_th';
  const texto = (v: unknown) => (v == null ? '' : String(v));
  let colaboradores: { id: string; nombre_completo: string }[] = [];
  if (esAdminTh) {
    const { data } = await supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('es_externo', false)
      .order('nombre_completo');
    colaboradores = data ?? [];
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">{simulacro.titulo}</h1>
        {simulacro.fecha && <p className="text-sm text-marmol-500 mt-1">{formatearFecha(simulacro.fecha)}</p>}
        {simulacro.descripcion && <p className="text-sm text-marmol-600 mt-2">{simulacro.descripcion}</p>}
        {esAdminTh && (
          <EditarSimulacro
            simulacroId={simulacro.id}
            datosIniciales={{
              titulo: simulacro.titulo,
              descripcion: simulacro.descripcion ?? '',
              fecha: simulacro.fecha ?? '',
              participantesEsperados: simulacro.participantes_esperados != null ? String(simulacro.participantes_esperados) : '',
            }}
          />
        )}
      </div>

      <ActaSimulacro
        simulacroId={simulacro.id}
        editable={esAdminTh}
        datos={{
          tipo: texto(simulacro.tipo),
          sede: texto(simulacro.sede),
          escenario: texto(simulacro.escenario),
          duracionMinutos: texto(simulacro.duracion_minutos),
          tiempoEvacuacionEsperadoMin: texto(simulacro.tiempo_evacuacion_esperado_min),
          tiempoEvacuacionRealMin: texto(simulacro.tiempo_evacuacion_real_min),
          brigadistasParticipantes: texto(simulacro.brigadistas_participantes),
          observacionesBrigada: texto(simulacro.observaciones_brigada),
        }}
      />

      <HallazgosSimulacro
        simulacroId={simulacro.id}
        editable={esAdminTh}
        hallazgos={(hallazgosRaw ?? []).map((h: any) => ({
          id: h.id,
          descripcion: h.descripcion,
          categoria: h.categoria,
          severidad: h.severidad,
          acpmId: h.acpm_id,
          acpmCodigo: h.acpm?.codigo ?? null,
        }))}
      />

      <AdjuntosSimulacro simulacroId={simulacro.id} adjuntos={adjuntos} editable={esAdminTh} />

      {esAdminTh ? (
        <PanelParticipantesSimulacro
          simulacroId={simulacro.id}
          colaboradores={colaboradores}
          participantesActuales={(participantes ?? []).map((p: any) => ({
            colaboradorId: p.colaborador_id,
            asistio: p.asistio,
            calificacionDesempeno: p.calificacion_desempeno,
          }))}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Colaborador</th>
                <th className="px-4 py-3 font-medium">Asistió</th>
                <th className="px-4 py-3 font-medium">Valoración</th>
              </tr>
            </thead>
            <tbody>
              {(participantes ?? []).map((p: any) => (
                <tr key={p.colaborador_id} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-3 text-marmol-800">{p.colaborador?.nombre_completo}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.asistio ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3 text-marmol-600">{p.calificacion_desempeno ?? '—'}</td>
                </tr>
              ))}
              {(!participantes || participantes.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-marmol-400">
                    Sin participantes registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
