import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { EsquemaSer } from '@/components/espiral-crecimiento/esquema-ser';
import { ASPECTOS_DEL_ESQUEMA, type AspectoEsquema, type EnfoqueSer } from '@/lib/guia-flow/esquema';
import {
  BotonCrearGuiaFlow,
  BotonGenerarInformes,
  ComentarioGeneralSer,
  InvitacionGuiaFlow,
} from '@/components/espiral-crecimiento/panel-guia-flow';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles, Lock } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';
import { TextoInforme } from '@/components/ui/texto-informe';
import { SeguimientoSer } from '@/components/espiral-crecimiento/seguimiento-ser';

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

  // admin_th y el líder de este colaborador pueden invitar y regenerar la síntesis; solo admin_th completa o corrige el
  // esquema a mano (el líder únicamente lo lee). Nadie gana acceso a los aspectos sensibles ni a la Guía completa — eso
  // lo bloquea RLS aparte.
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

  // Esquema del Ser: solo los aspectos con relevancia laboral (los íntimos ni siquiera se consultan; además la base de
  // datos los bloquea). Lo ven Talento Humano, el líder directo y la propia persona. Nunca la Guía completa.
  let aspectosEsquema: AspectoEsquema[] = [];
  let comentarioGeneral: string | null = null;

  if (guia) {
    const [{ data: aspectosRaw }, { data: puntajesRaw }] = await Promise.all([
      supabase.from('ser_aspectos').select('id, nombre').eq('empresa_id', perfil.empresa_id).eq('sensible', false).in('nombre', ASPECTOS_DEL_ESQUEMA),
      supabase.from('ser_puntajes').select('aspecto_id, nota, descripcion, aprovechar, acompanar, enfoque').eq('guia_del_flow_id', guia.id),
    ]);
    const porAspecto = new Map(((puntajesRaw ?? []) as any[]).map((p) => [p.aspecto_id as string, p]));
    aspectosEsquema = ((aspectosRaw ?? []) as any[]).map((a) => {
      const p = porAspecto.get(a.id);
      return {
        aspectoId: a.id,
        nombre: a.nombre,
        titulo: p?.nota ?? null,
        descripcion: p?.descripcion ?? null,
        aprovechar: p?.aprovechar ?? null,
        acompanar: p?.acompanar ?? null,
        enfoque: (p?.enfoque ?? null) as EnfoqueSer | null,
      };
    });
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

  const { data: seguimientos } = await supabase
    .from('ser_seguimientos')
    .select('id, fecha, fortalezas_en_practica, motivadores, acuerdos, proxima_revision, registrado_por_nombre')
    .eq('colaborador_id', params.id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

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
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Sparkles size={22} className="text-ser" /> Ser · Esquema de la Guía del Flow
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        <details className="mt-3 rounded-lg border border-marmol-200 bg-marmol-50 px-3 py-2 text-xs text-marmol-600 max-w-xl">
          <summary className="cursor-pointer font-medium text-marmol-700">¿Qué es esto y qué se ve aquí?</summary>
          <p className="mt-2">
            La Guía del Flow es un ejercicio de autoconocimiento que la persona responde por su cuenta y que le llega solo a ella, con su carta.
            Esa Guía <strong>no llega a la empresa</strong>. Lo que sí llega es un <strong>esquema</strong>: aspecto por aspecto, lo que tiene relevancia
            laboral (talentos, motivación, liderazgo, trabajo con otros, manejo del cambio, inteligencias), con una descripción formal, cómo
            aprovecharlo y cómo acompañar. Los aspectos íntimos no entran. Es descriptivo: <strong>no lleva nota</strong> ni afecta la evaluación de
            desempeño. Sirve para conversar y acompañar.
          </p>
          <p className="mt-2">
            La persona autorizó compartir este esquema cuando se registró en la Guía del Flow y puede retirar esa autorización allí en cualquier momento.
          </p>
        </details>
        <p className="text-xs text-marmol-400 mt-2 flex items-start gap-1.5 max-w-xl">
          <Lock size={12} className="mt-0.5 shrink-0" />
          {esElPropioColaborador
            ? 'Esto es exactamente lo que tu empresa ve de ti: Talento Humano y tu líder directo. Tu Guía completa y tu carta son solo tuyas.'
            : 'Lo ven Talento Humano, el líder directo y la propia persona. La Guía completa y la carta son solo de la persona.'}
        </p>
      </div>

      {puedeGestionar && <InvitacionGuiaFlow colaboradorId={params.id} invitacionInicial={invitacionInicial} />}

      {!guia ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles size={28} className="text-marmol-300" />
          <p className="text-sm font-medium text-marmol-700">Aún no hay esquema del Ser para esta persona</p>
          {esAdminTh ? (
            <>
              <p className="text-xs text-marmol-400 max-w-sm">
                Lo normal es invitarla con el enlace de arriba: cuando responda y autorice, el esquema llega solo. Si prefieres, puedes crear uno vacío y completarlo a mano.
              </p>
              <BotonCrearGuiaFlow colaboradorId={params.id} />
            </>
          ) : (
            <p className="text-xs text-marmol-400 max-w-sm">Aparecerá aquí cuando la persona responda su Guía del Flow y autorice compartirlo.</p>
          )}
        </div>
      ) : (
        <>
          <div className="card p-4">
            <p className="text-xs text-marmol-500">Guía aplicada el {formatearFecha(guia.fecha_aplicacion)}</p>
          </div>

          {(puedeGestionar || esElPropioColaborador) && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-display font-semibold text-secundario">{esElPropioColaborador ? 'Tu síntesis' : 'Síntesis para acompañar a la persona'}</h2>
                {puedeGestionar && (
                  <BotonGenerarInformes colaboradorId={params.id} guiaDelFlowId={guia.id} yaTieneInforme={Boolean(guia.informe_lider)} />
                )}
              </div>
              {(esElPropioColaborador ? guia.informe_colaborador : guia.informe_lider) ? (
                <TextoInforme
                  texto={(esElPropioColaborador ? guia.informe_colaborador : guia.informe_lider) ?? ''}
                  className="rounded-lg border border-marmol-200 p-3 text-sm text-marmol-700"
                />
              ) : (
                <p className="text-xs text-marmol-400">
                  Aún no se ha generado. {puedeGestionar ? 'Presiona «Generar informes con IA» cuando el esquema esté completo.' : 'Talento Humano la generará.'}
                </p>
              )}
            </div>
          )}

          <EsquemaSer colaboradorId={params.id} guiaDelFlowId={guia.id} aspectos={aspectosEsquema} puedeEditar={esAdminTh} />

          {esElPropioColaborador && (
            <ComentarioGeneralSer colaboradorId={params.id} guiaDelFlowId={guia.id} comentarioInicial={comentarioGeneral} puedeComentar />
          )}
        </>
      )}

      <SeguimientoSer colaboradorId={params.id} seguimientos={(seguimientos ?? []) as any[]} puedeRegistrar={puedeGestionar} />
    </div>
  );
}
