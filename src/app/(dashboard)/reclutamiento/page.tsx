import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { Briefcase, Plus, Users } from 'lucide-react';
import { EvaluacionesLider } from '@/components/reclutamiento/evaluaciones-lider';
import { BotonProcesarPendientes } from '@/components/reclutamiento/boton-procesar-pendientes';

const ESTADO_LABEL: Record<string, string> = { abierta: 'Abierta', pausada: 'En pausa', cancelada: 'Cancelada', cubierta: 'Cubierto', cerrada: 'Cerrada' };
const ESTADO_CLASE: Record<string, string> = {
  abierta: 'bg-alto/10 text-alto',
  pausada: 'bg-medio/10 text-medio',
  cancelada: 'bg-bajo/10 text-bajo',
  cubierta: 'bg-flow-50 text-flow-700',
  cerrada: 'bg-marmol-200 text-marmol-500',
};

export default async function ReclutamientoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();
  const { data: vacantes } = await supabase
    .from('vacantes')
    .select(
      'id, titulo, estado, fecha_apertura, fecha_cierre, cargo:cargos(nombre), lider_solicitante:lider_solicitante_id(nombre_completo), postulaciones(count)'
    )
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  // Paso 2 del flujo, lado del líder: solo llegan los candidatos que Talento Humano le asignó y están vigentes (RLS).
  const { data: evaluacionesRaw } =
    perfil.rol === 'lider'
      ? await supabase
          .from('postulaciones')
          .select('id, candidato:candidatos(nombre_completo), vacante:vacantes(titulo)')
          .eq('etapa', 'evaluacion_lider')
      : { data: [] };
  const evaluaciones = (evaluacionesRaw ?? []).map((e: any) => ({ id: e.id, candidato: e.candidato?.nombre_completo ?? '', vacante: e.vacante?.titulo ?? '' }));

  // Panel de control (requerimiento §4): indicadores de Talento Humano. El líder no ve estas cifras.
  const indicadores = perfil.rol === 'admin_th' ? await cargarIndicadores(supabase, perfil.empresa_id, (vacantes ?? []) as { id: string; estado: string; fecha_cierre: string | null }[]) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <Briefcase size={22} className="text-flow-600" /> Reclutamiento y Selección
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Banco de candidatos, vacantes y el proceso de selección de cada una — desde la postulación hasta
            la contratación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reclutamiento/candidatos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition"
          >
            <Users size={15} /> Banco de candidatos
          </Link>
          {perfil.rol === 'admin_th' && (
            <Link
              href="/reclutamiento/vacantes/nueva"
              className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-2 transition"
            >
              <Plus size={15} /> Nueva vacante
            </Link>
          )}
        </div>
      </div>

      {indicadores && (
        <section className="space-y-3">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {indicadores.tarjetas.map((t) => (
              <div key={t.titulo} className="card p-4">
                <p className="text-xs text-marmol-400">{t.titulo}</p>
                <p className="font-display text-2xl font-semibold text-secundario mt-1">{t.valor}</p>
                {t.detalle && <p className="text-[11px] text-marmol-400 mt-0.5">{t.detalle}</p>}
              </div>
            ))}
          </div>
          <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-marmol-800">Hojas de vida por procesar</p>
              <p className="text-xs text-marmol-400">Lectura automática de los documentos que llegaron y aún no se han estructurado.</p>
            </div>
            <BotonProcesarPendientes pendientes={indicadores.porProcesar} />
          </div>
        </section>
      )}

      {!vacantes || vacantes.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">
          Todavía no hay vacantes creadas.
          {perfil.rol === 'admin_th' && ' Crea la primera con el botón "Nueva vacante".'}
        </div>
      ) : (
        <div className="grid gap-3">
          {vacantes.map((v: any) => (
            <Link
              key={v.id}
              href={`/reclutamiento/vacantes/${v.id}`}
              className="card p-4 flex items-center justify-between hover:border-flow-300 transition"
            >
              <div>
                <p className="font-medium text-marmol-800">{v.titulo}</p>
                <p className="text-xs text-marmol-400 mt-0.5">
                  {v.cargo?.nombre ?? 'Sin cargo'}
                  {v.lider_solicitante?.nombre_completo ? ` · Solicita: ${v.lider_solicitante.nombre_completo}` : ''} · Abierta el {v.fecha_apertura}
                  {v.fecha_cierre ? ` · Cerrada el ${v.fecha_cierre}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-marmol-400">
                  {v.postulaciones?.[0]?.count ?? 0} candidato{(v.postulaciones?.[0]?.count ?? 0) === 1 ? '' : 's'}
                </span>
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${ESTADO_CLASE[v.estado]}`}>
                  {ESTADO_LABEL[v.estado]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {perfil.rol === 'lider' && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display font-semibold text-secundario">Candidatos para evaluar</h2>
            <p className="text-sm text-marmol-500">Paso 2: deja tus apreciaciones sobre cada candidato asignado y devuélvelo a Talento Humano.</p>
          </div>
          <EvaluacionesLider items={evaluaciones} />
        </section>
      )}
    </div>
  );
}

type Supa = ReturnType<typeof createClient>;

async function cargarIndicadores(supabase: Supa, empresaId: string, vacantes: { id: string; estado: string; fecha_cierre: string | null }[]) {
  const hoy = new Date();
  const en7Dias = new Date(hoy.getTime() + 7 * 86400000).toISOString();
  const en14Dias = new Date(hoy.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const idsVacantes = vacantes.map((v) => v.id);
  const abiertas = vacantes.filter((v) => v.estado === 'abierta');
  const proximasACerrar = abiertas.filter((v) => v.fecha_cierre && v.fecha_cierre <= en14Dias && v.fecha_cierre >= hoy.toISOString().slice(0, 10));

  const contar = async (consulta: PromiseLike<{ count: number | null }>) => (await consulta).count ?? 0;
  const [candidatos, postulaciones, porProcesar, validaciones, recomendados, entrevistas] = await Promise.all([
    contar(supabase.from('candidatos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId)),
    idsVacantes.length
      ? contar(supabase.from('postulaciones').select('id', { count: 'exact', head: true }).in('vacante_id', idsVacantes))
      : Promise.resolve(0),
    contar(supabase.from('ai_processing_jobs').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).in('estado', ['pendiente', 'procesando'])),
    Promise.all(
      ['candidato_educacion', 'candidato_experiencia', 'candidato_competencias', 'candidato_idiomas', 'candidato_certificaciones'].map((t) =>
        contar(supabase.from(t as 'candidato_educacion').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('activo', true).eq('requiere_revision', true))
      )
    ).then((n) => n.reduce((a, b) => a + b, 0)),
    contar(supabase.from('match_evaluaciones').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('vigente', true).in('clasificacion', ['alta', 'buena'])),
    contar(
      supabase
        .from('entrevistas')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'programada')
        .gte('fecha_hora', hoy.toISOString())
        .lte('fecha_hora', en7Dias)
    ),
  ]);

  return {
    porProcesar,
    tarjetas: [
      { titulo: 'Vacantes abiertas', valor: abiertas.length, detalle: `${vacantes.length} en total` },
      { titulo: 'Candidatos registrados', valor: candidatos, detalle: 'Banco de la empresa' },
      { titulo: 'Postulaciones', valor: postulaciones, detalle: 'A todas las vacantes' },
      { titulo: 'Hojas por procesar', valor: porProcesar, detalle: 'En cola o leyendo' },
      { titulo: 'Validaciones pendientes', valor: validaciones, detalle: 'Datos extraídos por revisar' },
      { titulo: 'Candidatos recomendados', valor: recomendados, detalle: 'Correspondencia alta o buena' },
      { titulo: 'Entrevistas próximas', valor: entrevistas, detalle: 'Próximos 7 días' },
      { titulo: 'Próximas a cerrar', valor: proximasACerrar.length, detalle: 'Cierre en 14 días' },
    ],
  };
}
