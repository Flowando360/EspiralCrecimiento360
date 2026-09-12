import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QuizEditor } from '@/components/espiral-crecimiento/quiz-editor';
import { EditarCurso } from '@/components/espiral-crecimiento/editar-curso';

export default async function QuizCursoPage({ params }: { params: { cursoId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/nexa/formacion');

  const supabase = createClient();

  const { data: curso } = await supabase
    .from('nexa_cursos')
    .select('id, titulo, descripcion, categoria, duracion_minutos, puntos_otorgados, quiz_umbral_aprobacion')
    .eq('id', params.cursoId)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!curso) notFound();

  const { data: preguntas } = await supabase
    .from('nexa_curso_preguntas')
    .select('id, enunciado, orden, opciones:nexa_curso_opciones(id, texto, correcta, orden)')
    .eq('curso_id', curso.id)
    .order('orden');

  const preguntasOrdenadas = (preguntas ?? []).map((p) => ({
    ...p,
    opciones: [...(p.opciones ?? [])].sort((a, b) => a.orden - b.orden),
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/nexa/formacion"
          className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600 mb-2"
        >
          <ArrowLeft size={13} /> Volver a Formación y SST
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Quiz de verificación</h1>
        <p className="text-sm text-marmol-500 mt-1">{curso.titulo}</p>
        <div className="mt-2">
          <EditarCurso
            cursoId={curso.id}
            datosIniciales={{
              titulo: curso.titulo,
              descripcion: curso.descripcion ?? '',
              categoria: curso.categoria ?? 'otro',
              duracionMinutos: curso.duracion_minutos != null ? String(curso.duracion_minutos) : '',
              puntosOtorgados: String(curso.puntos_otorgados),
            }}
          />
        </div>
      </div>

      <QuizEditor
        cursoId={curso.id}
        umbralInicial={curso.quiz_umbral_aprobacion}
        preguntasIniciales={preguntasOrdenadas as any}
      />
    </div>
  );
}
