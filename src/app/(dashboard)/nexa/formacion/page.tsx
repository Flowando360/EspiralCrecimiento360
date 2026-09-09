import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioCrearCurso } from '@/components/espiral-crecimiento/formulario-crear-curso';
import { AsignarCurso } from '@/components/espiral-crecimiento/asignar-curso';
import { PanelAvanceCurso } from '@/components/espiral-crecimiento/panel-avance-curso';
import { QuizTomar } from '@/components/espiral-crecimiento/quiz-tomar';
import { GraduationCap, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const ESTADO_COLOR: Record<string, string> = {
  asignado: 'bg-marmol-100 text-marmol-600',
  en_curso: 'bg-flow-50 text-flow-700',
  completado: 'bg-green-100 text-alto',
  vencido: 'bg-red-100 text-bajo',
};

const CATEGORIA_LABEL: Record<string, string> = {
  induccion_sst: 'Inducción SST',
  alturas: 'Alturas',
  manejo_cargas: 'Manejo de cargas',
  epp: 'EPP',
  protocolos_emergencia: 'Protocolos de emergencia',
  cultura: 'Cultura',
  tecnico: 'Técnico',
  otro: 'Otro',
};

export default async function NexaFormacionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  if (perfil.rol === 'colaborador' && perfil.colaborador_id) {
    const { data: rutas } = await supabase
      .from('nexa_rutas_formacion')
      .select(
        `id, curso_id, estado, progreso_pct, fecha_limite, quiz_puntaje_pct, quiz_intentos, quiz_aprobado_en,
         curso:curso_id(titulo, categoria, duracion_minutos, puntos_otorgados, quiz_umbral_aprobacion, preguntas:nexa_curso_preguntas(id))`
      )
      .eq('colaborador_id', perfil.colaborador_id);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Mi formación</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Cursos asignados según tu cargo y las alertas de SST activas.
          </p>
        </div>

        {!rutas || rutas.length === 0 ? (
          <EmptyState icon={GraduationCap} titulo="Sin cursos asignados por ahora" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {rutas.map((r: any) => {
              const tieneQuiz = (r.curso?.preguntas?.length ?? 0) > 0;
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">
                      {CATEGORIA_LABEL[r.curso?.categoria] ?? r.curso?.categoria}
                    </span>
                    <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize', ESTADO_COLOR[r.estado])}>
                      {r.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-medium text-marmol-900">{r.curso?.titulo}</h3>
                  <p className="text-xs text-marmol-400 mt-1">
                    {r.curso?.duracion_minutos} min · {r.curso?.puntos_otorgados} pts
                    {tieneQuiz && ` · Quiz (mín. ${r.curso?.quiz_umbral_aprobacion}%)`}
                  </p>
                  {!tieneQuiz && (
                    <div className="w-full h-1.5 rounded-full bg-marmol-100 overflow-hidden mt-3">
                      <div className="h-full bg-crecimiento" style={{ width: `${r.progreso_pct}%` }} />
                    </div>
                  )}
                  {r.estado === 'completado' ? (
                    <p className="text-xs text-alto mt-2">
                      Completado{tieneQuiz && r.quiz_puntaje_pct != null ? ` · Quiz: ${r.quiz_puntaje_pct}%` : ''}
                    </p>
                  ) : tieneQuiz ? (
                    <QuizTomar
                      rutaId={r.id}
                      cursoId={r.curso_id}
                      ultimoPuntaje={r.quiz_puntaje_pct != null ? Number(r.quiz_puntaje_pct) : null}
                      intentos={r.quiz_intentos}
                      umbral={r.curso?.quiz_umbral_aprobacion ?? 70}
                    />
                  ) : (
                    <PanelAvanceCurso rutaId={r.id} progresoInicial={Number(r.progreso_pct)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Vista admin_th / lider: catálogo de cursos disponibles
  const { data: cursos } = await supabase
    .from('nexa_cursos')
    .select('id, titulo, categoria, duracion_minutos, puntos_otorgados, activo')
    .eq('empresa_id', perfil.empresa_id)
    .order('categoria');

  const esAdminTh = perfil.rol === 'admin_th';
  let cargos: { id: string; nombre: string }[] = [];
  let colaboradores: { id: string; nombre_completo: string }[] = [];

  if (esAdminTh) {
    const [{ data: cargosData }, { data: colaboradoresData }] = await Promise.all([
      supabase.from('cargos').select('id, nombre').eq('empresa_id', perfil.empresa_id).order('nombre'),
      supabase
        .from('colaboradores')
        .select('id, nombre_completo')
        .eq('empresa_id', perfil.empresa_id)
        .eq('es_externo', false)
        .order('nombre_completo'),
    ]);
    cargos = cargosData ?? [];
    colaboradores = colaboradoresData ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Formación y SST</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Catálogo de cursos gamificados. Se asignan automáticamente cuando una alerta de Saber o
            SST se activa (integración con el Espiral de Crecimiento).
          </p>
        </div>
        {esAdminTh && <FormularioCrearCurso />}
      </div>

      {!cursos || cursos.length === 0 ? (
        <EmptyState icon={GraduationCap} titulo="Sin cursos cargados todavía" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Duración</th>
                <th className="px-4 py-3 font-medium">Puntos</th>
                {esAdminTh && <th className="px-4 py-3 font-medium">Quiz</th>}
                {esAdminTh && <th className="px-4 py-3 font-medium">Asignación</th>}
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => (
                <tr key={c.id} className="border-b border-marmol-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-marmol-900">{c.titulo}</td>
                  <td className="px-4 py-3 text-marmol-600">{CATEGORIA_LABEL[c.categoria as string] ?? c.categoria}</td>
                  <td className="px-4 py-3 text-marmol-500">{c.duracion_minutos} min</td>
                  <td className="px-4 py-3 text-marmol-500">{c.puntos_otorgados} pts</td>
                  {esAdminTh && (
                    <td className="px-4 py-3">
                      <Link
                        href={`/nexa/formacion/${c.id}/quiz`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-flow-600 hover:text-flow-700"
                      >
                        <ListChecks size={13} /> Gestionar
                      </Link>
                    </td>
                  )}
                  {esAdminTh && (
                    <td className="px-4 py-3">
                      <AsignarCurso cursoId={c.id} cargos={cargos} colaboradores={colaboradores} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
