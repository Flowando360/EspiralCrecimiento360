import { primero } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Sparkles, GraduationCap, Hammer, HeartHandshake } from 'lucide-react';
import { recopilarContextoBrief } from '@/lib/brief/contexto';
import { redactarBorrador } from '@/lib/brief/borrador';
import { IA_BRIEF_DISPONIBLE } from '@/lib/brief/ia';
import { BriefEditor, type CamposBriefUI } from '@/components/espiral-crecimiento/brief-editor';
import { formatearFecha } from '@/lib/utils';

// Generar con IA puede tardar: se declara el tope de 60 s del plan.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export default async function BriefPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select(
      `id, ciclo_id,
       colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id, lider_id),
       resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber)`
    )
    .eq('id', params.evaluacionId)
    .maybeSingle();

  if (!evaluacion) notFound();

  const colaborador = evaluacion.colaborador as any;
  const resultado = primero(evaluacion.resultado as any) as any;

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // El brief es material de preparación del líder; el colaborador evaluado
  // no tiene acceso, igual que en la política de RLS.
  const puedeEditar =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  if (!puedeEditar) notFound();

  const { data: brief } = await supabase
    .from('briefs_retroalimentacion')
    .select('*')
    .eq('evaluacion_id', params.evaluacionId)
    .maybeSingle();

  // Cruce de Ser, Saber, Hacer y Deber. Si todavía no hay Brief guardado, el borrador sale armado.
  const ctx = await recopilarContextoBrief(supabase, params.evaluacionId);
  const borrador = ctx ? redactarBorrador(ctx) : null;
  const campos: CamposBriefUI = {
    talento_central: brief?.talento_central ?? borrador?.talento_central ?? '',
    resumen_ser: brief?.resumen_ser ?? borrador?.resumen_ser ?? '',
    resumen_saber: brief?.resumen_saber ?? borrador?.resumen_saber ?? '',
    resumen_hacer: brief?.resumen_hacer ?? borrador?.resumen_hacer ?? '',
    resumen_deber: brief?.resumen_deber ?? borrador?.resumen_deber ?? '',
    sugerencias_enfoque: brief?.sugerencias_enfoque ?? borrador?.sugerencias_enfoque ?? '',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/espiral-crecimiento/ciclos/${evaluacion.ciclo_id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver al ciclo
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <FileText size={22} className="text-flow-600" /> Brief de retroalimentación
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Prepara la reunión con {colaborador.nombre_completo}. Solo lo ven quien lo escribe y Talento Humano.
        </p>
      </div>

      {ctx && (
        <section>
          <h2 className="font-display font-semibold text-secundario mb-2">Lo que dicen los datos</h2>
          <p className="text-xs text-marmol-400 mb-3">
            Se cruzan solos, con lo más reciente: la Guía del Flow (Ser), la hoja de vida, los cursos y el cargo (Saber) y la valoración de este ciclo (Hacer y Deber).
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-ser" /> SER · Guía del Flow
              </p>
              {ctx.ser.disponible ? (
                <>
                  <p className="text-sm text-marmol-700">Aplicada el {formatearFecha(ctx.ser.fecha as string)}</p>
                  {ctx.ser.fortalezas.length > 0 && (
                    <p className="text-xs text-marmol-500 mt-1">Fuertes: {ctx.ser.fortalezas.map((f) => `${f.nombre} (${f.puntaje})`).join(' · ')}</p>
                  )}
                  {ctx.ser.aAcompanar.length > 0 && (
                    <p className="text-xs text-marmol-500">A acompañar: {ctx.ser.aAcompanar.map((f) => `${f.nombre} (${f.puntaje})`).join(' · ')}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-marmol-400">Sin Guía del Flow todavía.</p>
              )}
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-1 flex items-center gap-1.5">
                <GraduationCap size={13} className="text-saber" /> SABER · cargo, hoja de vida y cursos
              </p>
              <p className="font-display text-lg font-semibold text-secundario">{ctx.saber.cumplimiento != null ? `${ctx.saber.cumplimiento}%` : '—'}</p>
              <p className="text-xs text-marmol-500">
                {ctx.saber.cumple} cumplen · {ctx.saber.parcial} parcial · {ctx.saber.pendiente} pendientes
              </p>
              <p className="text-xs text-marmol-500">
                Cursos: {ctx.saber.cursosCompletados.length} completados · {ctx.saber.cursosEnCurso.length} en curso
                {ctx.saber.certificaciones.length > 0 && ` · ${ctx.saber.certificaciones.length} certificación(es) por vencer o vencidas`}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-1 flex items-center gap-1.5">
                <Hammer size={13} className="text-hacer" /> HACER
              </p>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-semibold text-secundario">{resultado?.indice_hacer ?? '—'}</span>
                <SemaforoBadge nivel={resultado?.semaforo_hacer} />
              </div>
              {ctx.desempeno.brechaHacer != null && (
                <p className="text-xs text-marmol-500">Diferencia con su autoevaluación: {ctx.desempeno.brechaHacer > 0 ? '+' : ''}{ctx.desempeno.brechaHacer}</p>
              )}
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-1 flex items-center gap-1.5">
                <HeartHandshake size={13} className="text-deber" /> DEBER
              </p>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-semibold text-secundario">{resultado?.indice_deber ?? '—'}</span>
                <SemaforoBadge nivel={resultado?.semaforo_deber} />
              </div>
              {ctx.desempeno.brechaDeber != null && (
                <p className="text-xs text-marmol-500">Diferencia con su autoevaluación: {ctx.desempeno.brechaDeber > 0 ? '+' : ''}{ctx.desempeno.brechaDeber}</p>
              )}
            </div>
          </div>
        </section>
      )}

      <BriefEditor
        evaluacionId={params.evaluacionId}
        inicial={campos}
        fuenteInicial={(brief?.fuente_borrador as 'manual' | 'automatico' | 'ia' | null) ?? (brief ? 'manual' : 'automatico')}
        esBorradorAutomatico={!brief}
        faltaSerSaber={Boolean(brief && (!brief.resumen_ser || !brief.resumen_saber))}
        iaDisponible={IA_BRIEF_DISPONIBLE()}
      />
    </div>
  );
}
