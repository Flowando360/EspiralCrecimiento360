'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  solicitarDocumento,
  enviarSolicitudARevision,
  cancelarBorrador,
  aprobarRevision,
  aprobarValidacion,
  rechazarSolicitud,
} from '@/app/(dashboard)/procesos-gestion/documentos/actions';
import { createClient } from '@/lib/supabase/client';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Check, X, Paperclip, FileText, Send, Ban } from 'lucide-react';

type TipoDocumento = 'procedimiento' | 'politica' | 'formato' | 'instructivo' | 'registro';
type TipoSolicitud = 'crear' | 'actualizar' | 'anular';
type EstadoSolicitud = 'borrador' | 'en_revision' | 'en_validacion' | 'aprobado' | 'rechazado' | 'cancelada';

export interface Documento {
  id: string;
  proceso_id: string;
  codigo: string;
  nombre: string;
  tipo_documento: TipoDocumento;
  version_vigente: string;
  estado: 'vigente' | 'obsoleto';
  requiere_confirmacion: boolean;
  proceso_nombre: string;
  proceso_codigo: string | null;
  confirmaciones: number;
}

export interface Solicitud {
  id: string;
  proceso_id: string;
  documento_id: string | null;
  tipo_solicitud: TipoSolicitud;
  nombre_documento: string | null;
  tipo_documento: TipoDocumento | null;
  justificacion: string | null;
  estado: EstadoSolicitud;
  fecha_solicitud: string;
  comentarios_aprobador: string | null;
  documento_codigo?: string | null;
  documento_nombre?: string | null;
  proceso_nombre: string;
  solicitante_id: string | null;
  solicitante_nombre: string | null;
  revisor_id: string | null;
  revisor_nombre: string | null;
  validador_id: string | null;
  validador_nombre: string | null;
  enviado_revision_at: string | null;
  revisado_at: string | null;
  comentarios_revisor: string | null;
  validado_at: string | null;
  comentarios_validador: string | null;
}

interface ProcesoOpcion {
  id: string;
  nombre: string;
  codigo: string | null;
}

interface ColaboradorOpcion {
  id: string;
  nombre_completo: string;
}

const ETIQUETA_TIPO_DOC: Record<TipoDocumento, string> = {
  procedimiento: 'Procedimiento',
  politica: 'Política',
  formato: 'Formato',
  instructivo: 'Instructivo',
  registro: 'Registro',
};

const ETIQUETA_TIPO_SOLICITUD: Record<TipoSolicitud, string> = {
  crear: 'Crear',
  actualizar: 'Actualizar',
  anular: 'Anular',
};

const ETIQUETA_ESTADO: Record<EstadoSolicitud, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'badge-marmol' },
  en_revision: { texto: 'En revisión', clase: 'badge-medio' },
  en_validacion: { texto: 'En validación', clase: 'badge-flow' },
  aprobado: { texto: 'Aprobada', clase: 'badge-alto' },
  rechazado: { texto: 'Rechazada', clase: 'badge-bajo' },
  cancelada: { texto: 'Cancelada', clase: 'badge-marmol' },
};

export function ListaDocumentos({
  documentosIniciales,
  solicitudesIniciales,
  procesos,
  colaboradores,
  empresaId,
  miColaboradorId,
  esAdminTh,
  puedeAprobar,
  puedeSolicitar,
}: {
  documentosIniciales: Documento[];
  solicitudesIniciales: Solicitud[];
  procesos: ProcesoOpcion[];
  colaboradores: ColaboradorOpcion[];
  empresaId: string;
  miColaboradorId: string | null;
  esAdminTh: boolean;
  puedeAprobar: boolean;
  puedeSolicitar: boolean;
}) {
  const [documentos] = useState(documentosIniciales);
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [, startTransition] = useTransition();

  const puedeActuarSobre = (asignadoId: string | null) => esAdminTh || (Boolean(asignadoId) && miColaboradorId === asignadoId);

  const borradores = solicitudes.filter((s) => s.estado === 'borrador');
  const enRevision = solicitudes.filter((s) => s.estado === 'en_revision');
  const enValidacion = solicitudes.filter((s) => s.estado === 'en_validacion');
  const resueltas = solicitudes.filter((s) => ['aprobado', 'rechazado', 'cancelada'].includes(s.estado));

  function actualizarLocal(id: string, cambios: Partial<Solicitud>) {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambios } : s)));
  }

  function enviarARevision(id: string) {
    actualizarLocal(id, { estado: 'en_revision', enviado_revision_at: new Date().toISOString() });
    startTransition(async () => {
      await enviarSolicitudARevision(id);
    });
  }

  function cancelar(id: string) {
    actualizarLocal(id, { estado: 'cancelada' });
    startTransition(async () => {
      await cancelarBorrador(id);
    });
  }

  function resolverRevision(id: string, aprobar: boolean, comentarios?: string) {
    actualizarLocal(id, {
      estado: aprobar ? 'en_validacion' : 'rechazado',
      comentarios_revisor: comentarios || null,
      revisado_at: new Date().toISOString(),
    });
    startTransition(async () => {
      if (aprobar) await aprobarRevision(id, comentarios);
      else await rechazarSolicitud(id, comentarios);
    });
  }

  function resolverValidacion(id: string, aprobar: boolean, comentarios?: string) {
    actualizarLocal(id, {
      estado: aprobar ? 'aprobado' : 'rechazado',
      comentarios_validador: comentarios || null,
      validado_at: new Date().toISOString(),
    });
    startTransition(async () => {
      if (aprobar) await aprobarValidacion(id, comentarios);
      else await rechazarSolicitud(id, comentarios);
      // El estado del documento/listado maestro se refresca por revalidatePath en el server action.
    });
  }

  return (
    <div className="space-y-6">
      {borradores.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">
            Borradores <span className="text-marmol-400 font-normal">({borradores.length})</span>
          </h2>
          <div className="space-y-2">
            {borradores.map((s) => (
              <SolicitudBorrador
                key={s.id}
                solicitud={s}
                puedeActuar={puedeActuarSobre(s.solicitante_id)}
                onEnviar={() => enviarARevision(s.id)}
                onCancelar={() => cancelar(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {enRevision.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">
            En revisión <span className="text-marmol-400 font-normal">({enRevision.length})</span>
          </h2>
          <div className="space-y-2">
            {enRevision.map((s) => (
              <SolicitudEnCurso
                key={s.id}
                solicitud={s}
                asignadoNombre={s.revisor_nombre}
                etiquetaAsignado="Revisor"
                puedeActuar={puedeActuarSobre(s.revisor_id)}
                textoAprobar="Aprobar revisión"
                onResolver={(aprobar, comentarios) => resolverRevision(s.id, aprobar, comentarios)}
              />
            ))}
          </div>
        </div>
      )}

      {enValidacion.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">
            En validación <span className="text-marmol-400 font-normal">({enValidacion.length})</span>
          </h2>
          <div className="space-y-2">
            {enValidacion.map((s) => (
              <SolicitudEnCurso
                key={s.id}
                solicitud={s}
                asignadoNombre={s.validador_nombre}
                etiquetaAsignado="Validador"
                puedeActuar={puedeActuarSobre(s.validador_id)}
                textoAprobar="Aprobar y publicar"
                onResolver={(aprobar, comentarios) => resolverValidacion(s.id, aprobar, comentarios)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-secundario">Listado Maestro</h2>
          {puedeSolicitar && (
            <button
              onClick={() => setMostrarForm((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5"
            >
              <Plus size={14} /> Nueva solicitud
            </button>
          )}
        </div>

        {mostrarForm && (
          <FormularioSolicitud
            procesos={procesos}
            documentos={documentos}
            colaboradores={colaboradores}
            empresaId={empresaId}
            onCreada={(s) => {
              setSolicitudes((prev) => [s, ...prev]);
              setMostrarForm(false);
            }}
          />
        )}

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-marmol-500">
                <th className="px-2 py-2 font-medium">Código</th>
                <th className="px-2 py-2 font-medium">Nombre</th>
                <th className="px-2 py-2 font-medium">Proceso</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Versión</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium">Difusión</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id} className={cn('border-b border-marmol-50 hover:bg-marmol-50/60', d.estado === 'obsoleto' && 'opacity-50')}>
                  <td className="px-2 py-2 font-medium text-marmol-700">{d.codigo}</td>
                  <td className="px-2 py-2">
                    <Link href={`/procesos-gestion/documentos/${d.id}`} className="text-marmol-800 hover:text-flow-600 inline-flex items-center gap-1">
                      <FileText size={13} /> {d.nombre}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-marmol-500 text-xs">
                    {d.proceso_codigo ? `${d.proceso_codigo} · ` : ''}
                    {d.proceso_nombre}
                  </td>
                  <td className="px-2 py-2 text-marmol-600 text-xs">{ETIQUETA_TIPO_DOC[d.tipo_documento]}</td>
                  <td className="px-2 py-2 text-marmol-600 text-xs">{d.version_vigente}</td>
                  <td className="px-2 py-2">
                    <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', d.estado === 'vigente' ? 'badge-alto' : 'badge-marmol')}>
                      {d.estado === 'vigente' ? 'Vigente' : 'Obsoleto'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-marmol-500">{d.requiere_confirmacion ? `${d.confirmaciones} confirmaron` : '—'}</td>
                </tr>
              ))}
              {documentos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-marmol-400 py-8">
                    Sin documentos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resueltas.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">Historial de solicitudes</h2>
          <div className="space-y-2">
            {resueltas.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b border-marmol-50 pb-1.5">
                <span>
                  <span className="text-marmol-400">{ETIQUETA_TIPO_SOLICITUD[s.tipo_solicitud]}</span>{' '}
                  {s.documento_codigo ?? s.nombre_documento} <span className="text-marmol-400">· {s.proceso_nombre}</span>
                </span>
                <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-medium', ETIQUETA_ESTADO[s.estado].clase)}>{ETIQUETA_ESTADO[s.estado].texto}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SolicitudBorrador({
  solicitud,
  puedeActuar,
  onEnviar,
  onCancelar,
}: {
  solicitud: Solicitud;
  puedeActuar: boolean;
  onEnviar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="rounded-lg border border-marmol-200 bg-marmol-50/60 p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium text-marmol-800">
            {ETIQUETA_TIPO_SOLICITUD[solicitud.tipo_solicitud]}: {solicitud.documento_codigo ?? solicitud.nombre_documento}
          </p>
          <p className="text-xs text-marmol-500">
            {solicitud.proceso_nombre} · {formatearFecha(solicitud.fecha_solicitud)}
            {solicitud.solicitante_nombre && ` · ${solicitud.solicitante_nombre}`}
          </p>
          {solicitud.justificacion && <p className="text-xs text-marmol-600 mt-1">{solicitud.justificacion}</p>}
          {(solicitud.revisor_nombre || solicitud.validador_nombre) && (
            <p className="text-xs text-marmol-400 mt-1">
              {solicitud.revisor_nombre && `Revisor: ${solicitud.revisor_nombre}`}
              {solicitud.revisor_nombre && solicitud.validador_nombre && ' · '}
              {solicitud.validador_nombre && `Validador: ${solicitud.validador_nombre}`}
            </p>
          )}
        </div>
      </div>
      {puedeActuar && (
        <div className="flex items-center gap-2 mt-2">
          <button onClick={onEnviar} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1.5">
            <Send size={12} /> Enviar a revisión
          </button>
          <button onClick={onCancelar} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
            <Ban size={12} /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function SolicitudEnCurso({
  solicitud,
  asignadoNombre,
  etiquetaAsignado,
  puedeActuar,
  textoAprobar,
  onResolver,
}: {
  solicitud: Solicitud;
  asignadoNombre: string | null;
  etiquetaAsignado: string;
  puedeActuar: boolean;
  textoAprobar: string;
  onResolver: (aprobar: boolean, comentarios?: string) => void;
}) {
  const [comentarios, setComentarios] = useState('');

  return (
    <div className="rounded-lg border border-medio/30 bg-amber-50/60 p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium text-marmol-800">
            {ETIQUETA_TIPO_SOLICITUD[solicitud.tipo_solicitud]}: {solicitud.documento_codigo ?? solicitud.nombre_documento}
          </p>
          <p className="text-xs text-marmol-500">
            {solicitud.proceso_nombre} · {formatearFecha(solicitud.fecha_solicitud)}
            {solicitud.solicitante_nombre && ` · Solicitó ${solicitud.solicitante_nombre}`}
          </p>
          <p className="text-xs text-marmol-400 mt-0.5">{etiquetaAsignado}: {asignadoNombre ?? 'sin asignar (cualquier admin_th puede resolver)'}</p>
          {solicitud.justificacion && <p className="text-xs text-marmol-600 mt-1">{solicitud.justificacion}</p>}
        </div>
      </div>
      {puedeActuar ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Comentario (opcional)"
            className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-xs"
          />
          <button onClick={() => onResolver(true, comentarios)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-2.5 py-1.5">
            <Check size={12} /> {textoAprobar}
          </button>
          <button onClick={() => onResolver(false, comentarios)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
            <X size={12} /> Rechazar
          </button>
        </div>
      ) : (
        <p className="text-xs text-marmol-400 mt-2 italic">Solo {asignadoNombre ?? 'la persona asignada'} (o admin_th) puede resolver esta etapa.</p>
      )}
    </div>
  );
}

function FormularioSolicitud({
  procesos,
  documentos,
  colaboradores,
  empresaId,
  onCreada,
}: {
  procesos: ProcesoOpcion[];
  documentos: Documento[];
  colaboradores: ColaboradorOpcion[];
  empresaId: string;
  onCreada: (s: Solicitud) => void;
}) {
  const [procesoId, setProcesoId] = useState(procesos[0]?.id ?? '');
  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud>('crear');
  const [documentoId, setDocumentoId] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('procedimiento');
  const [justificacion, setJustificacion] = useState('');
  const [revisorId, setRevisorId] = useState('');
  const [validadorId, setValidadorId] = useState('');
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const documentosDelProceso = documentos.filter((d) => d.proceso_id === procesoId && d.estado === 'vigente');

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    const ruta = `${empresaId}/borradores/${Date.now()}-${archivo.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from('documentos-procesos').upload(ruta, archivo);
    setSubiendo(false);
    if (uploadError) {
      setError(`Error subiendo el archivo: ${uploadError.message}`);
      return;
    }
    setArchivoUrl(ruta);
    setArchivoNombre(archivo.name);
  }

  function enviar() {
    setError(null);
    if (tipoSolicitud === 'crear' && !nombreDocumento.trim()) {
      setError('El nombre del documento es requerido');
      return;
    }
    if (tipoSolicitud !== 'crear' && !documentoId) {
      setError('Selecciona el documento');
      return;
    }
    startTransition(async () => {
      const res = await solicitarDocumento({
        procesoId,
        documentoId: documentoId || undefined,
        tipoSolicitud,
        nombreDocumento: tipoSolicitud === 'crear' ? nombreDocumento : undefined,
        tipoDocumento: tipoSolicitud === 'crear' ? tipoDocumento : undefined,
        archivoPropuestoUrl: archivoUrl || undefined,
        justificacion,
        revisorId: revisorId || undefined,
        validadorId: validadorId || undefined,
      });
      if (res.ok) {
        const proceso = procesos.find((p) => p.id === procesoId);
        const documento = documentosDelProceso.find((d) => d.id === documentoId);
        onCreada({
          id: res.id,
          proceso_id: procesoId,
          documento_id: documentoId || null,
          tipo_solicitud: tipoSolicitud,
          nombre_documento: tipoSolicitud === 'crear' ? nombreDocumento : null,
          tipo_documento: tipoSolicitud === 'crear' ? tipoDocumento : null,
          justificacion: justificacion || null,
          estado: 'borrador',
          fecha_solicitud: new Date().toISOString(),
          comentarios_aprobador: null,
          documento_codigo: documento?.codigo ?? null,
          documento_nombre: documento?.nombre ?? null,
          proceso_nombre: proceso?.nombre ?? '—',
          solicitante_id: null,
          solicitante_nombre: null,
          revisor_id: revisorId || null,
          revisor_nombre: colaboradores.find((c) => c.id === revisorId)?.nombre_completo ?? null,
          validador_id: validadorId || null,
          validador_nombre: colaboradores.find((c) => c.id === validadorId)?.nombre_completo ?? null,
          enviado_revision_at: null,
          revisado_at: null,
          comentarios_revisor: null,
          validado_at: null,
          comentarios_validador: null,
        });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-marmol-200 p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={procesoId} onChange={(e) => { setProcesoId(e.target.value); setDocumentoId(''); }} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo ? `${p.codigo} · ` : ''}
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value as TipoSolicitud)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="crear">Crear documento</option>
          <option value="actualizar">Actualizar documento</option>
          <option value="anular">Anular documento</option>
        </select>
      </div>

      {tipoSolicitud === 'crear' ? (
        <div className="grid grid-cols-2 gap-2">
          <input value={nombreDocumento} onChange={(e) => setNombreDocumento(e.target.value)} placeholder="Nombre del documento" className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
          <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            {(Object.entries(ETIQUETA_TIPO_DOC) as [TipoDocumento, string][]).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <select value={documentoId} onChange={(e) => setDocumentoId(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="">Selecciona el documento</option>
          {documentosDelProceso.map((d) => (
            <option key={d.id} value={d.id}>
              {d.codigo} · {d.nombre}
            </option>
          ))}
        </select>
      )}

      <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} placeholder="Justificación" rows={2} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <select value={revisorId} onChange={(e) => setRevisorId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="">Revisor (opcional)</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo}
            </option>
          ))}
        </select>
        <select value={validadorId} onChange={(e) => setValidadorId(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          <option value="">Validador (opcional)</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-marmol-400">Si no eliges revisor/validador, cualquier admin_th puede resolver cada etapa.</p>

      {tipoSolicitud !== 'anular' && (
        <div>
          <input type="file" onChange={subirArchivo} disabled={subiendo} className="text-xs text-marmol-500" />
          {subiendo && <p className="text-xs text-marmol-400 mt-1">Subiendo…</p>}
          {archivoNombre && (
            <p className="text-xs text-marmol-600 mt-1 inline-flex items-center gap-1">
              <Paperclip size={11} /> {archivoNombre}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-marmol-400">Se guarda como borrador — la envías a revisión cuando quieras desde la sección "Borradores".</p>

      <button onClick={enviar} disabled={pending || subiendo} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5">
        {pending ? 'Guardando…' : 'Guardar borrador'}
      </button>
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
