import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ListaAspectosSer, type AspectoConDatos } from '@/components/espiral-crecimiento/lista-aspectos-ser';
import {
  BotonCrearGuiaFlow,
  BotonGenerarInformes,
  ComentarioGeneralSer,
  InvitacionGuiaFlow,
} from '@/components/espiral-crecimiento/panel-guia-flow';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles, Lock } from 'lucide-react';
import type { BloqueSer } from '@/types/colaborador';

const BLOQUES: { valor: BloqueSer; titulo: string }[] = [
  { valor: 'esencia', titulo: 'Esencia / Sello' },
  { valor: 'emociones', titulo: 'Emociones' },
  { valor: 'pertenencia_compromiso', titulo: 'Pertenencia y Compromiso' },
  { valor: 'desafios', titulo: 'Desafíos' },
];

export default async function GuiaDelFlowPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, empresa_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const esAdminTh = perfil.rol === 'admin_th';
  const esLider = perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id;
  const esElPropioColaborador = perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id;
  const puedeVer = esAdminTh || esLider || esElPropioColaborador;
  if (!puedeVer) notFound();

  // admin_th y el líder de este colaborador ven y hacen exactamente lo
  // mismo acá: invitar, cargar puntajes de los 18 aspectos seguros y
  // generar los informes. Ninguno de los dos gana acceso a los 12
  // aspectos sensibles ni al PDF — eso sigue bloqueado por RLS aparte.
  const puedeGestionar = esAdminTh || esLider;

  const { data: guia } = await supabase
    .from('guia_del_flow')
    .select(
      'id, fecha_aplicacion, informe_lider, informe_lider_generado_at, informe_colaborador, informe_colaborador_generado_at'
    )
    .eq('colaborador_id', params.id)
    .order('fecha_aplicacion', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // El desglose por aspecto (para cargar puntajes) solo lo necesita quien
  // gestiona (admin_th o el líder de este colaborador), y solo de los 18
  // aspectos con relevancia laboral — los 12 psicológicos/íntimos ni
  // siquiera se consultan aquí. El colaborador solo ve su informe
  // sintetizado (informe_colaborador).
  let bloques: { titulo: string; aspectos: AspectoConDatos[] }[] = [];
  let comentarioGeneral: string | null = null;

  if (guia && puedeGestionar) {
    const [{ data: aspectosRaw }, { data: puntajesRaw }] = await Promise.all([
      supabase
        .from('ser_aspectos')
        .select('id, bloque, nombre, orden')
        .eq('empresa_id', perfil.empresa_id)
        .eq('sensible', false)
        .order('orden'),
      supabase.from('ser_puntajes').select('aspecto_id, puntaje, nota').eq('guia_del_flow_id', guia.id),
    ]);

    const puntajePorAspecto = new Map(((puntajesRaw ?? []) as any[]).map((p) => [p.aspecto_id, p.puntaje as number]));
    const notaPorAspecto = new Map(((puntajesRaw ?? []) as any[]).map((p) => [p.aspecto_id, p.nota as string | null]));

    bloques = BLOQUES.map(({ valor, titulo }) => ({
      titulo,
      aspectos: ((aspectosRaw ?? []) as any[])
        .filter((a) => a.bloque === valor)
        .map((a) => ({
          id: a.id,
          nombre: a.nombre,
          puntaje: puntajePorAspecto.get(a.id) ?? null,
          nota: notaPorAspecto.get(a.id) ?? null,
          comentario: null,
        })),
    })).filter((b) => b.aspectos.length > 0);
  }

  if (guia && esElPropioColaborador) {
    const { data: comentariosRaw } = await supabase
      .from('ser_comentarios_colaborador')
      .select('comentario')
      .eq('guia_del_flow_id', guia.id)
      .is('aspecto_id', null)
      .maybeSingle();
    comentarioGeneral = comentariosRaw?.comentario ?? null;
  }

  let invitacionInicial: { link: string; creadaEl: string; usadaEl: string | null } | null = null;
  if (puedeGestionar) {
    const { data: ultimaInvitacion } = await supabase
      .from('guia_del_flow_invitaciones')
      .select('token, created_at, usado_at')
      .eq('colaborador_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimaInvitacion) {
      const baseUrl = process.env.GUIADELFLOW_URL ?? 'https://guia-del-flow.vercel.app';
      invitacionInicial = {
        link: `${baseUrl}/registro?invitacion=${ultimaInvitacion.token}`,
        creadaEl: ultimaInvitacion.created_at,
        usadaEl: ultimaInvitacion.usado_at,
      };
    }
  }

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
          <Sparkles size={22} className="text-ser" /> Guía del Flow
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        {!esElPropioColaborador && (
          <p className="text-xs text-marmol-400 mt-2 flex items-start gap-1.5 max-w-md">
            <Lock size={12} className="mt-0.5 shrink-0" />
            La Guía del Flow completa es un regalo íntimo de {esAdminTh ? 'cada colaborador' : 'tu colaborador'} —
            le llega por fuera de este sistema. Aquí solo se ve un informe con lo que tiene relevancia laboral.
          </p>
        )}
      </div>

      {puedeGestionar && <InvitacionGuiaFlow colaboradorId={params.id} invitacionInicial={invitacionInicial} />}

      {!guia ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles size={28} className="text-marmol-300" />
          <p className="text-sm font-medium text-marmol-700">Sin Guía del Flow registrada todavía</p>
          {puedeGestionar && (
            <>
              <p className="text-xs text-marmol-400 max-w-sm">
                Crea la primera aplicación para empezar a cargar los puntajes y generar los informes.
              </p>
              <BotonCrearGuiaFlow colaboradorId={params.id} />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card p-4 space-y-1">
            <p className="text-xs text-marmol-500">Aplicación del {guia.fecha_aplicacion}</p>
          </div>

          {puedeGestionar && (
            <>
              {bloques.map(({ titulo, aspectos }) => (
                <div key={titulo} className="card p-5">
                  <h2 className="font-display font-semibold text-secundario mb-3">{titulo}</h2>
                  <ListaAspectosSer
                    colaboradorId={params.id}
                    guiaDelFlowId={guia.id}
                    aspectos={aspectos}
                    puedeEditarPuntaje
                    puedeComentar={false}
                  />
                </div>
              ))}

              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-display font-semibold text-secundario">Informes generados por IA</h2>
                  <BotonGenerarInformes
                    colaboradorId={params.id}
                    guiaDelFlowId={guia.id}
                    yaTieneInforme={Boolean(guia.informe_lider)}
                  />
                </div>
                {guia.informe_lider ? (
                  <div className="rounded-lg border border-marmol-200 p-3 text-sm text-marmol-700 whitespace-pre-wrap">
                    {guia.informe_lider}
                  </div>
                ) : (
                  <p className="text-xs text-marmol-400">
                    Aún no se ha generado. Carga al menos un puntaje arriba y presiona &ldquo;Generar informes con IA&rdquo;.
                  </p>
                )}
              </div>
            </>
          )}

          {esElPropioColaborador && (
            <>
              <div className="card p-5 space-y-2">
                <h2 className="font-display font-semibold text-secundario">Tu informe de desarrollo</h2>
                {guia.informe_colaborador ? (
                  <p className="text-sm text-marmol-700 whitespace-pre-wrap">{guia.informe_colaborador}</p>
                ) : (
                  <p className="text-sm text-marmol-400">
                    Talento Humano todavía no ha generado este informe. Tu Guía del Flow completa te llega aparte.
                  </p>
                )}
              </div>

              <ComentarioGeneralSer
                colaboradorId={params.id}
                guiaDelFlowId={guia.id}
                comentarioInicial={comentarioGeneral}
                puedeComentar
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
