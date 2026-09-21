'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const RUTA = '/procesos-gestion/documentos';

async function requerirPerfil() {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) return null;
  return perfil;
}

async function requerirAdminTh() {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  return perfil;
}

/** Solicitar documento: admin_th y líder (el "Líder SIG" de la conversación con Nexus, hasta que se valide un rol separado). */
async function requerirSolicitante() {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider'].includes(perfil.rol)) return null;
  return perfil;
}

const TIPO_DOC_PREFIJO: Record<string, string> = {
  procedimiento: 'PO',
  politica: 'PL',
  formato: 'FO',
  instructivo: 'IN',
};

async function generarCodigoDocumento(
  supabase: ReturnType<typeof createClient>,
  procesoId: string,
  procesoCodigo: string | null,
  tipoDocumento: string
) {
  const { count } = await supabase
    .from('documentos_proceso')
    .select('id', { count: 'exact', head: true })
    .eq('proceso_id', procesoId)
    .eq('tipo_documento', tipoDocumento);
  const consecutivo = String((count ?? 0) + 1).padStart(3, '0');
  return `${procesoCodigo ?? 'DOC'}-${TIPO_DOC_PREFIJO[tipoDocumento] ?? 'DO'}-${consecutivo}`;
}

function siguienteVersion(versionActual: string) {
  const n = parseInt(versionActual.replace(/\D/g, ''), 10);
  const siguiente = Number.isFinite(n) ? n + 1 : 1;
  return `v${String(siguiente).padStart(3, '0')}`;
}

const SolicitudSchema = z.object({
  procesoId: z.string().uuid(),
  documentoId: z.string().uuid().optional(),
  tipoSolicitud: z.enum(['crear', 'actualizar', 'anular']),
  nombreDocumento: z.string().trim().optional(),
  tipoDocumento: z.enum(['procedimiento', 'politica', 'formato', 'instructivo']).optional(),
  archivoPropuestoUrl: z.string().trim().optional(),
  justificacion: z.string().trim().optional(),
});

export async function solicitarDocumento(input: z.infer<typeof SolicitudSchema>) {
  const perfil = await requerirSolicitante();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const parsed = SolicitudSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  if (d.tipoSolicitud === 'crear' && (!d.nombreDocumento || !d.tipoDocumento)) {
    return { ok: false as const, error: 'Nombre y tipo de documento son requeridos para crear' };
  }
  if (d.tipoSolicitud !== 'crear' && !d.documentoId) {
    return { ok: false as const, error: 'Selecciona el documento' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('solicitudes_documento')
    .insert({
      proceso_id: d.procesoId,
      documento_id: d.documentoId || null,
      tipo_solicitud: d.tipoSolicitud,
      nombre_documento: d.nombreDocumento || null,
      tipo_documento: d.tipoDocumento || null,
      archivo_propuesto_url: d.archivoPropuestoUrl || null,
      justificacion: d.justificacion || null,
      solicitante_id: perfil.colaborador_id,
    })
    .select('id')
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const, id: data.id as string };
}

export async function aprobarSolicitud(id: string, comentarios?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { data: solicitud, error: errSolicitud } = await supabase
    .from('solicitudes_documento')
    .select('id, proceso_id, documento_id, tipo_solicitud, nombre_documento, tipo_documento, archivo_propuesto_url, estado')
    .eq('id', id)
    .maybeSingle();

  if (errSolicitud || !solicitud) return { ok: false as const, error: 'Solicitud no encontrada' };
  if (solicitud.estado !== 'pendiente') return { ok: false as const, error: 'Esta solicitud ya fue resuelta' };

  if (solicitud.tipo_solicitud === 'crear') {
    const { data: proceso } = await supabase
      .from('procesos_gestion')
      .select('codigo')
      .eq('id', solicitud.proceso_id)
      .maybeSingle();

    const codigo = await generarCodigoDocumento(supabase, solicitud.proceso_id as string, (proceso?.codigo as string) ?? null, solicitud.tipo_documento as string);

    const { error: errCrear } = await supabase.from('documentos_proceso').insert({
      proceso_id: solicitud.proceso_id,
      codigo,
      nombre: solicitud.nombre_documento as string,
      tipo_documento: solicitud.tipo_documento as string,
      version_vigente: 'v001',
      estado: 'vigente',
      archivo_url: solicitud.archivo_propuesto_url,
      requiere_confirmacion: solicitud.tipo_documento === 'procedimiento' || solicitud.tipo_documento === 'politica',
    });
    if (errCrear) return { ok: false as const, error: errCrear.message };
  } else if (solicitud.tipo_solicitud === 'actualizar') {
    const { data: documento } = await supabase
      .from('documentos_proceso')
      .select('id, version_vigente, archivo_url')
      .eq('id', solicitud.documento_id as string)
      .maybeSingle();
    if (!documento) return { ok: false as const, error: 'El documento ya no existe' };

    if (documento.archivo_url) {
      await supabase.from('documentos_historial_version').insert({
        documento_id: documento.id,
        version: documento.version_vigente,
        archivo_url: documento.archivo_url,
        resumen_cambio: null,
      });
    }

    const nuevaVersion = siguienteVersion(documento.version_vigente as string);
    const { error: errActualizar } = await supabase
      .from('documentos_proceso')
      .update({ version_vigente: nuevaVersion, archivo_url: solicitud.archivo_propuesto_url, updated_at: new Date().toISOString() })
      .eq('id', documento.id);
    if (errActualizar) return { ok: false as const, error: errActualizar.message };

    // Nueva versión = nuevo ciclo de difusión: las confirmaciones de la versión anterior ya no aplican.
    await supabase.from('confirmaciones_lectura').delete().eq('documento_id', documento.id);
  } else {
    const { error: errAnular } = await supabase
      .from('documentos_proceso')
      .update({ estado: 'obsoleto' })
      .eq('id', solicitud.documento_id as string);
    if (errAnular) return { ok: false as const, error: errAnular.message };
  }

  const { error: errResolver } = await supabase
    .from('solicitudes_documento')
    .update({ estado: 'aprobado', aprobador_id: perfil.colaborador_id, fecha_resolucion: new Date().toISOString(), comentarios_aprobador: comentarios || null })
    .eq('id', id);
  if (errResolver) return { ok: false as const, error: errResolver.message };

  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function rechazarSolicitud(id: string, comentarios?: string) {
  const perfil = await requerirAdminTh();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_documento')
    .update({ estado: 'rechazado', aprobador_id: perfil.colaborador_id, fecha_resolucion: new Date().toISOString(), comentarios_aprobador: comentarios || null })
    .eq('id', id)
    .eq('estado', 'pendiente');
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}

export async function confirmarLectura(documentoId: string, comentario?: string) {
  const perfil = await requerirPerfil();
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  if (!perfil.colaborador_id) return { ok: false as const, error: 'Tu usuario no tiene una ficha de colaborador vinculada' };

  const supabase = createClient();
  const { error } = await supabase
    .from('confirmaciones_lectura')
    .upsert(
      { documento_id: documentoId, colaborador_id: perfil.colaborador_id, comentario: comentario || null, confirmado_at: new Date().toISOString() },
      { onConflict: 'documento_id,colaborador_id' }
    );
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(RUTA);
  return { ok: true as const };
}
