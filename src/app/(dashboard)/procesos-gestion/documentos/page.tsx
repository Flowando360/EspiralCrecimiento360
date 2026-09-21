import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ListaDocumentos, type Documento, type Solicitud } from '@/components/procesos-gestion/lista-documentos';

export default async function GestionDocumentalPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: documentosRaw }, { data: solicitudesRaw }, { data: procesos }, { data: confirmacionesRaw }] = await Promise.all([
    supabase
      .from('documentos_proceso')
      .select('id, proceso_id, codigo, nombre, tipo_documento, version_vigente, estado, requiere_confirmacion, proceso:proceso_id(nombre, codigo, empresa_id)')
      .order('codigo'),
    supabase
      .from('solicitudes_documento')
      .select(
        'id, proceso_id, documento_id, tipo_solicitud, nombre_documento, tipo_documento, justificacion, estado, fecha_solicitud, comentarios_aprobador, documento:documento_id(codigo, nombre), proceso:proceso_id(nombre, empresa_id)'
      )
      .order('fecha_solicitud', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
    supabase.from('confirmaciones_lectura').select('documento_id'),
  ]);

  const conteoConfirmaciones = new Map<string, number>();
  for (const c of confirmacionesRaw ?? []) {
    conteoConfirmaciones.set(c.documento_id as string, (conteoConfirmaciones.get(c.documento_id as string) ?? 0) + 1);
  }

  const documentos: Documento[] = (documentosRaw ?? [])
    .filter((d: any) => d.proceso?.empresa_id === perfil.empresa_id)
    .map((d: any) => ({
      id: d.id,
      proceso_id: d.proceso_id,
      codigo: d.codigo,
      nombre: d.nombre,
      tipo_documento: d.tipo_documento,
      version_vigente: d.version_vigente,
      estado: d.estado,
      requiere_confirmacion: d.requiere_confirmacion,
      proceso_nombre: d.proceso?.nombre ?? '—',
      proceso_codigo: d.proceso?.codigo ?? null,
      confirmaciones: conteoConfirmaciones.get(d.id) ?? 0,
    }));

  const solicitudes: Solicitud[] = (solicitudesRaw ?? [])
    .filter((s: any) => s.proceso?.empresa_id === perfil.empresa_id)
    .map((s: any) => ({
      id: s.id,
      proceso_id: s.proceso_id,
      documento_id: s.documento_id,
      tipo_solicitud: s.tipo_solicitud,
      nombre_documento: s.nombre_documento,
      tipo_documento: s.tipo_documento,
      justificacion: s.justificacion,
      estado: s.estado,
      fecha_solicitud: s.fecha_solicitud,
      comentarios_aprobador: s.comentarios_aprobador,
      documento_codigo: s.documento?.codigo ?? null,
      documento_nombre: s.documento?.nombre ?? null,
      proceso_nombre: s.proceso?.nombre ?? '—',
    }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Gestión documental</h1>
        <p className="text-sm text-marmol-500 mt-1">
          El GC-PO-001 digitalizado: solicita crear, actualizar o anular un documento, un líder lo aprueba, y la
          plataforma publica el código y la versión automáticamente. Difunde con confirmación de lectura para
          dejar evidencia auditable (ISO 9001 numeral 7.5.3).
        </p>
      </div>

      <ListaDocumentos
        documentosIniciales={documentos}
        solicitudesIniciales={solicitudes}
        procesos={(procesos ?? []) as any}
        empresaId={perfil.empresa_id}
        puedeAprobar={perfil.rol === 'admin_th'}
        puedeSolicitar={['admin_th', 'lider'].includes(perfil.rol)}
      />
    </div>
  );
}
