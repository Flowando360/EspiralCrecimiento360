import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cn, formatearFecha } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, FileText, ShieldOff } from 'lucide-react';
import { BotonReintentar } from './BotonReintentar';

/**
 * Catálogo de estados manuales (colaboradores cuya Guía se resolvió por
 * fuera del sistema) — copiado a mano del mismo catálogo curado en
 * guiadelflow (src/lib/panel/estadosManuales.ts de ese repo, migración
 * 0009 de ese proyecto). La columna en la base es texto libre; si allá se
 * agrega un valor nuevo, esta tabla lo muestra igual (con el texto crudo)
 * aunque no esté en este catálogo.
 */
const ETIQUETA_ESTADO_MANUAL: Record<string, string> = {
  entregada_gestionada: 'Entregada y gestionada',
  no_aplica: 'No aplica',
};

const ETIQUETA_DOCUMENTO: Record<string, string> = {
  guia: 'Guía del Flow (PDF)',
  carta: 'Carta',
};

type CategoriaEstado = 'manual' | 'sin_terminar' | 'error' | 'generando' | 'enviado';

interface FilaSeguimiento {
  colaboradorId: string;
  nombre: string;
  correo: string | null;
  categoria: CategoriaEstado;
  estadoTexto: string;
  documentosEnviados: string[];
  fecha: string | null;
  /** id en flow_perfiles (guiadelflow) — solo presente si ya tiene cuenta
   * allá. Necesario para el botón "Reintentar". */
  usuarioFlowId: string | null;
  /** Solo true cuando reintentar de verdad puede ayudar: la Guía y/o la
   * Carta nunca se generaron o quedaron en error. Un correo que falló al
   * mandarse (documentos ya listos) es otro problema — reintentar no lo
   * arregla, así que ese caso no muestra el botón aunque la categoría sea
   * "error". */
  puedeReintentar: boolean;
}

const ESTILO_CATEGORIA: Record<CategoriaEstado, { clase: string; icono: typeof CheckCircle2 }> = {
  manual: { clase: 'badge-alto', icono: CheckCircle2 },
  sin_terminar: { clase: 'bg-marmol-100 text-marmol-500 border border-marmol-200', icono: Clock },
  error: { clase: 'badge-bajo', icono: AlertTriangle },
  generando: { clase: 'badge-medio', icono: Clock },
  enviado: { clase: 'badge-alto', icono: CheckCircle2 },
};

export default async function SeguimientoGuiaFlowPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, email')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .order('nombre_completo');

  const colaboradorIds = (colaboradores ?? []).map((c) => c.id);

  if (colaboradorIds.length === 0) {
    return <p className="text-sm text-marmol-400 p-5">No hay colaboradores cargados todavía en tu empresa.</p>;
  }

  // A partir de acá se consultan tablas de guiadelflow (mismo proyecto de
  // Supabase, ver Fase 21 / 29 del historial) — son de su dominio, no del
  // nuestro, y no tienen policy de RLS pensada para que admin_th de acá las
  // lea directo. Se usa el cliente con service_role (createAdminClient,
  // igual que ya se usa para crear cuentas de auth) y el filtro a la
  // empresa activa se hace acá mismo, a mano, en vez de confiar en RLS.
  const admin = createAdminClient();

  const [{ data: estadosManuales }, { data: perfilesFlow }] = await Promise.all([
    admin
      .from('flow_estados_manuales')
      .select('colaborador_id, estado, nota, actualizado_at, creado_at')
      .in('colaborador_id', colaboradorIds),
    admin
      .from('flow_perfiles')
      .select('id, colaborador_circulo_id, created_at')
      .in('colaborador_circulo_id', colaboradorIds),
  ]);

  const usuarioIds = (perfilesFlow ?? []).map((p) => p.id);

  const { data: cuestionarios } =
    usuarioIds.length > 0
      ? await admin
          .from('flow_cuestionarios')
          .select('id, usuario_id, completado_at, correo_documentos_enviado_at, correo_documentos_error, created_at')
          .in('usuario_id', usuarioIds)
          .order('created_at', { ascending: false })
      : { data: [] as { id: string; usuario_id: string; completado_at: string | null; correo_documentos_enviado_at: string | null; correo_documentos_error: string | null; created_at: string }[] };

  // Alguien puede tener más de un intento de cuestionario -- nos quedamos
  // con el más reciente de cada persona (ya vienen ordenados desc).
  const cuestionarioPorUsuario = new Map<string, NonNullable<typeof cuestionarios>[number]>();
  for (const c of cuestionarios ?? []) {
    if (!cuestionarioPorUsuario.has(c.usuario_id)) cuestionarioPorUsuario.set(c.usuario_id, c);
  }

  const cuestionarioIds = [...cuestionarioPorUsuario.values()].map((c) => c.id);
  const { data: documentos } =
    cuestionarioIds.length > 0
      ? await admin.from('flow_documentos').select('cuestionario_id, tipo, estado, generado_at').in('cuestionario_id', cuestionarioIds)
      : { data: [] as { cuestionario_id: string; tipo: string; estado: string; generado_at: string | null }[] };

  const documentosPorCuestionario = new Map<string, { tipo: string; estado: string; generado_at: string | null }[]>();
  for (const d of documentos ?? []) {
    const lista = documentosPorCuestionario.get(d.cuestionario_id) ?? [];
    lista.push(d);
    documentosPorCuestionario.set(d.cuestionario_id, lista);
  }

  const estadoManualPorColaborador = new Map((estadosManuales ?? []).map((e) => [e.colaborador_id, e]));
  const perfilFlowPorColaborador = new Map<string, NonNullable<typeof perfilesFlow>[number]>();
  for (const p of perfilesFlow ?? []) {
    if (p.colaborador_circulo_id) perfilFlowPorColaborador.set(p.colaborador_circulo_id, p);
  }

  // Esta pantalla es de seguimiento de quienes ya respondieron o se
  // registraron -- a quien todavía no tiene ni cuenta en guiadelflow ni un
  // estado manual se le hace seguimiento en la otra pestaña (Invitaciones).
  const filas: FilaSeguimiento[] = [];

  for (const colaborador of colaboradores ?? []) {
    const manual = estadoManualPorColaborador.get(colaborador.id);
    const perfilFlow = perfilFlowPorColaborador.get(colaborador.id);
    if (!manual && !perfilFlow) continue;

    if (manual) {
      filas.push({
        colaboradorId: colaborador.id,
        nombre: colaborador.nombre_completo,
        correo: colaborador.email,
        categoria: 'manual',
        estadoTexto: (ETIQUETA_ESTADO_MANUAL[manual.estado] ?? manual.estado) + (manual.nota ? ` — ${manual.nota}` : ''),
        documentosEnviados: [],
        fecha: manual.actualizado_at ?? manual.creado_at,
        usuarioFlowId: perfilFlow?.id ?? null,
        puedeReintentar: false,
      });
      continue;
    }

    const cuestionario = perfilFlow ? cuestionarioPorUsuario.get(perfilFlow.id) : undefined;
    const docs = cuestionario ? (documentosPorCuestionario.get(cuestionario.id) ?? []) : [];
    const docsListos = docs.filter((d) => d.estado === 'listo');
    const docsError = docs.filter((d) => d.estado === 'error');
    const correoEnviado = Boolean(cuestionario?.correo_documentos_enviado_at);

    let fila: FilaSeguimiento;

    if (!cuestionario || !cuestionario.completado_at) {
      fila = {
        colaboradorId: colaborador.id,
        nombre: colaborador.nombre_completo,
        correo: colaborador.email,
        categoria: 'sin_terminar',
        estadoTexto: 'Registrado, sin terminar el cuestionario',
        documentosEnviados: [],
        fecha: perfilFlow?.created_at ?? null,
        usuarioFlowId: perfilFlow?.id ?? null,
        puedeReintentar: false,
      };
    } else if (correoEnviado) {
      fila = {
        colaboradorId: colaborador.id,
        nombre: colaborador.nombre_completo,
        correo: colaborador.email,
        categoria: 'enviado',
        estadoTexto: 'Guía del Flow entregada por correo',
        documentosEnviados: docsListos.map((d) => ETIQUETA_DOCUMENTO[d.tipo] ?? d.tipo),
        fecha: cuestionario.correo_documentos_enviado_at,
        usuarioFlowId: perfilFlow?.id ?? null,
        puedeReintentar: false,
      };
    } else if (docsError.length > 0 || cuestionario.correo_documentos_error) {
      fila = {
        colaboradorId: colaborador.id,
        nombre: colaborador.nombre_completo,
        correo: colaborador.email,
        categoria: 'error',
        estadoTexto: cuestionario.correo_documentos_error
          ? `Documentos listos, error al enviar el correo`
          : 'Error generando sus documentos',
        documentosEnviados: docsListos.map((d) => ETIQUETA_DOCUMENTO[d.tipo] ?? d.tipo),
        fecha: docsError[0]?.generado_at ?? cuestionario.completado_at,
        usuarioFlowId: perfilFlow?.id ?? null,
        // Si el problema fue solo al mandar el correo (documentos ya
        // listos), reintentar acá no ayuda -- eso se resuelve con
        // "Reenviar correo" desde /panel de guiadelflow, no desde acá.
        puedeReintentar: docsError.length > 0,
      };
    } else {
      fila = {
        colaboradorId: colaborador.id,
        nombre: colaborador.nombre_completo,
        correo: colaborador.email,
        categoria: 'generando',
        // Sin ninguna fila en flow_documentos, la generación nunca llegó a
        // arrancar -- depende de que la persona deje su pestaña abierta un
        // par de minutos después de responder, sin reintento automático
        // (ver /panel de guiadelflow, "Reintentar"). Si ya hay filas mostrando
        // 'pendiente'/'generando', sí está en curso de verdad.
        estadoTexto:
          docs.length === 0
            ? 'Cuestionario respondido, sus documentos nunca se generaron'
            : 'Cuestionario respondido, generando sus documentos',
        documentosEnviados: [],
        fecha: cuestionario.completado_at,
        usuarioFlowId: perfilFlow?.id ?? null,
        // Si ya hay documentos en camino ('pendiente'/'generando' de
        // verdad, no simplemente ausentes), dejar que termine solo en vez
        // de ofrecer reintentar y arriesgar una segunda generación en
        // paralelo.
        puedeReintentar: docs.length === 0,
      };
    }

    filas.push(fila);
  }

  // Más reciente primero -- lo más útil para revisar quién acaba de responder.
  filas.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));

  if (filas.length === 0) {
    return (
      <p className="text-sm text-marmol-400 p-5">
        Todavía nadie de tu empresa ha respondido su Guía del Flow. Cuando alguien use su link de invitación
        y complete el cuestionario, aparecerá aquí.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-marmol-500">
        Solo aparece acá quien ya se registró o respondió su Guía del Flow (o cuya Guía se resolvió por fuera
        del sistema). A quien todavía no ha respondido lo encuentras en la pestaña Invitaciones.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-marmol-500 border-b border-marmol-100">
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Correo</th>
              <th className="p-3 font-medium">Documentos enviados</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const estilo = ESTILO_CATEGORIA[f.categoria];
              const Icono = estilo.icono;
              return (
                <tr key={f.colaboradorId} className="border-b border-marmol-50 last:border-0 align-top">
                  <td className="p-3 text-marmol-800 font-medium">{f.nombre}</td>
                  <td className="p-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', estilo.clase)}>
                      <Icono size={12} /> {f.estadoTexto}
                    </span>
                  </td>
                  <td className="p-3 text-marmol-600">{f.correo ?? <span className="text-marmol-400">Sin correo</span>}</td>
                  <td className="p-3 text-marmol-600">
                    {f.documentosEnviados.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {f.documentosEnviados.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1 rounded-md bg-marmol-100 border border-marmol-200 px-2 py-0.5 text-xs text-marmol-600"
                          >
                            <FileText size={11} /> {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-marmol-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-marmol-500 whitespace-nowrap">{f.fecha ? formatearFecha(f.fecha) : '—'}</td>
                  <td className="p-3">
                    {f.puedeReintentar && f.usuarioFlowId ? (
                      <BotonReintentar usuarioFlowId={f.usuarioFlowId} />
                    ) : (
                      <span className="text-marmol-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-marmol-400 max-w-2xl">
        <ShieldOff size={13} className="mt-0.5 shrink-0" />
        Acá solo se ve si un documento se mandó y cuándo — no se puede descargar desde esta pantalla. El PDF
        completo le llega a cada persona directo a su correo, por fuera de este sistema.
      </p>
    </div>
  );
}
