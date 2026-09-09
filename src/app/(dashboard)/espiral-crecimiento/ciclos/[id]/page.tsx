import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { GenerarEvaluacionesPanel } from '@/components/espiral-crecimiento/generar-evaluaciones-panel';
import { notFound } from 'next/navigation';
import { FileText, HandshakeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Etapa de cada evaluación dentro del ciclo, derivada de datos que ya
// existen (porcentaje_avance, si tiene brief guardado, si está publicada)
// — no requiere una columna de estado nueva en la base de datos.
type EtapaEvaluacion = 'en_evaluacion' | 'evaluacion_completa' | 'retroalimentada' | 'publicada';

const ETAPAS: { valor: EtapaEvaluacion; etiqueta: string; clase: string }[] = [
  { valor: 'en_evaluacion', etiqueta: 'En evaluación', clase: 'bg-marmol-100 text-marmol-500 border border-marmol-200' },
  { valor: 'evaluacion_completa', etiqueta: 'Evaluación completa', clase: 'badge-medio' },
  { valor: 'retroalimentada', etiqueta: 'Con retroalimentación', clase: 'bg-flow-50 text-flow-700 border border-flow-200' },
  { valor: 'publicada', etiqueta: 'Cerrada', clase: 'badge-alto' },
];

function calcularEtapa(avance: number, tieneBrief: boolean, publicado: boolean): EtapaEvaluacion {
  if (publicado) return 'publicada';
  if (tieneBrief) return 'retroalimentada';
  if (avance >= 100) return 'evaluacion_completa';
  return 'en_evaluacion';
}

export default async function CicloDetallePage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  const supabase = createClient();

  const { data: ciclo } = await supabase
    .from('ciclos_evaluacion')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!ciclo) notFound();

  const { data: evaluaciones } = await supabase
    .from('evaluaciones')
    .select(
      `id, porcentaje_avance, publicado,
       colaborador:colaborador_evaluado_id(id, nombre_completo, cargo:cargos(nombre)),
       resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber)`
    )
    .eq('ciclo_id', params.id);

  const idsEvaluaciones = (evaluaciones ?? []).map((e) => e.id);
  const { data: briefsGuardados } =
    idsEvaluaciones.length > 0
      ? await supabase.from('briefs_retroalimentacion').select('evaluacion_id').in('evaluacion_id', idsEvaluaciones)
      : { data: [] as { evaluacion_id: string }[] };
  const idsConBrief = new Set((briefsGuardados ?? []).map((b) => b.evaluacion_id));

  const evaluacionesConEtapa = (evaluaciones ?? []).map((e: any) => ({
    ...e,
    etapa: calcularEtapa(e.porcentaje_avance ?? 0, idsConBrief.has(e.id), e.publicado),
  }));

  const contadoresEtapa = ETAPAS.map((et) => ({
    ...et,
    total: evaluacionesConEtapa.filter((e) => e.etapa === et.valor).length,
  }));

  // Selectores del panel de generación: equipos = colaboradores que tienen gente reportándoles
  const { data: todosColaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id')
    .eq('empresa_id', perfil?.empresa_id ?? '')
    .eq('estado', 'activo');

  const idsConEquipo = new Set((todosColaboradores ?? []).filter((c) => c.lider_id).map((c) => c.lider_id));
  const lideres = (todosColaboradores ?? [])
    .filter((c) => idsConEquipo.has(c.id))
    .map((c) => ({ id: c.id, nombre: c.nombre_completo }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">{ciclo.nombre}</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Ponderación vigente: Líder {ciclo.peso_lider_con_equipo * 100}% / Pares{' '}
          {ciclo.peso_pares_con_equipo * 100}% / Colaboradores a cargo{' '}
          {ciclo.peso_colaboradores_con_equipo * 100}% (cargos con equipo)
        </p>
      </div>

      {perfil?.rol === 'admin_th' && (
        <GenerarEvaluacionesPanel
          cicloId={ciclo.id}
          lideres={lideres}
          colaboradores={(todosColaboradores ?? []).map((c) => ({ id: c.id, nombre: c.nombre_completo }))}
        />
      )}

      {evaluacionesConEtapa.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card p-4">
            <p className="text-xs text-marmol-500 mb-1">Total</p>
            <p className="font-display text-2xl font-semibold text-secundario">{evaluacionesConEtapa.length}</p>
          </div>
          {contadoresEtapa.map((c) => (
            <div key={c.valor} className="card p-4">
              <p className="text-xs text-marmol-500 mb-1">{c.etiqueta}</p>
              <p className="font-display text-2xl font-semibold text-secundario">{c.total}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Avance</th>
              <th className="px-4 py-3 font-medium">Etapa</th>
              <th className="px-4 py-3 font-medium">Hacer</th>
              <th className="px-4 py-3 font-medium">Deber</th>
              <th className="px-4 py-3 font-medium">Resultado</th>
              {(perfil?.rol === 'admin_th' || perfil?.rol === 'lider') && (
                <>
                  <th className="px-4 py-3 font-medium">Brief</th>
                  <th className="px-4 py-3 font-medium">Acuerdo</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {evaluacionesConEtapa.map((e) => (
              <tr key={e.id} className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
                <td className="px-4 py-3 font-medium text-marmol-900">{e.colaborador?.nombre_completo}</td>
                <td className="px-4 py-3 text-marmol-600">{e.colaborador?.cargo?.nombre}</td>
                <td className="px-4 py-3">
                  <div className="w-28 h-1.5 rounded-full bg-marmol-100 overflow-hidden">
                    <div
                      className="h-full bg-crecimiento"
                      style={{ width: `${e.porcentaje_avance ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-marmol-400">{e.porcentaje_avance ?? 0}%</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                      ETAPAS.find((et) => et.valor === e.etapa)?.clase
                    )}
                  >
                    {ETAPAS.find((et) => et.valor === e.etapa)?.etiqueta}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <SemaforoBadge nivel={e.resultado?.[0]?.semaforo_hacer} />
                </td>
                <td className="px-4 py-3">
                  <SemaforoBadge nivel={e.resultado?.[0]?.semaforo_deber} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/espiral-crecimiento/evaluaciones/${e.id}/resultado`}
                    className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700"
                  >
                    Ver ficha
                  </Link>
                </td>
                {(perfil?.rol === 'admin_th' || perfil?.rol === 'lider') && (
                  <>
                    <td className="px-4 py-3">
                      <Link
                        href={`/espiral-crecimiento/evaluaciones/${e.id}/brief`}
                        className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700"
                      >
                        <FileText size={12} /> Brief
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/espiral-crecimiento/evaluaciones/${e.id}/acuerdo`}
                        className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700"
                      >
                        <HandshakeIcon size={12} /> Acuerdo
                      </Link>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
