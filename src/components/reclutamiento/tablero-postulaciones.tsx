'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  actualizarEtapaPostulacion,
  actualizarCalificacionPostulacion,
  crearEntrevista,
  actualizarEntrevista,
  crearCandidato,
  postularCandidatoExistente,
} from '@/app/(dashboard)/reclutamiento/actions';
import { UserPlus, CalendarPlus, ExternalLink, Star } from 'lucide-react';

type Entrevista = {
  id: string;
  fecha_hora: string;
  modalidad: string;
  estado: string;
  notas: string | null;
  entrevistador: { id: string; nombre_completo: string } | null;
};

type Postulacion = {
  id: string;
  etapa: string;
  calificacion: number | null;
  notas: string | null;
  descartado_motivo: string | null;
  candidato: { id: string; nombre_completo: string; correo: string | null; telefono: string | null; hoja_vida_url: string | null };
  entrevistas: Entrevista[];
};

const ETAPAS: { value: string; label: string }[] = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'entrevista', label: 'Entrevista' },
  { value: 'prueba', label: 'Prueba' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'contratado', label: 'Contratado' },
  { value: 'descartado', label: 'Descartado' },
];

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function TableroPostulaciones({
  vacanteId,
  cargoId,
  postulaciones,
  colaboradores,
  candidatosDisponibles,
  puedeAdministrar,
  miColaboradorId,
}: {
  vacanteId: string;
  cargoId: string;
  postulaciones: Postulacion[];
  colaboradores: { id: string; nombre_completo: string }[];
  candidatosDisponibles: { id: string; nombre_completo: string; correo: string | null }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
}) {
  return (
    <div className="space-y-4">
      {puedeAdministrar && (
        <AgregarCandidato vacanteId={vacanteId} candidatosDisponibles={candidatosDisponibles} />
      )}

      {postulaciones.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">
          Todavía no hay candidatos postulados a esta vacante. Comparte el enlace público de arriba o
          agrega uno manualmente.
        </div>
      ) : (
        <div className="space-y-3">
          {postulaciones.map((p) => (
            <TarjetaPostulacion
              key={p.id}
              postulacion={p}
              vacanteId={vacanteId}
              cargoId={cargoId}
              colaboradores={colaboradores}
              puedeAdministrar={puedeAdministrar}
              miColaboradorId={miColaboradorId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgregarCandidato({
  vacanteId,
  candidatosDisponibles,
}: {
  vacanteId: string;
  candidatosDisponibles: { id: string; nombre_completo: string; correo: string | null }[];
}) {
  const [modo, setModo] = useState<'existente' | 'nuevo'>(candidatosDisponibles.length > 0 ? 'existente' : 'nuevo');
  const [candidatoId, setCandidatoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res =
        modo === 'existente'
          ? await postularCandidatoExistente(candidatoId, vacanteId)
          : await crearCandidato({ nombreCompleto: nombre, correo, telefono }, vacanteId);
      if (res.ok) {
        setCandidatoId('');
        setNombre('');
        setCorreo('');
        setTelefono('');
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={16} className="text-flow-600" />
        <p className="text-sm font-medium text-marmol-700">Agregar candidato a esta vacante</p>
        <div className="ml-auto flex text-xs rounded-lg border border-marmol-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setModo('existente')}
            className={`px-2.5 py-1 ${modo === 'existente' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}
          >
            Del banco
          </button>
          <button
            type="button"
            onClick={() => setModo('nuevo')}
            className={`px-2.5 py-1 ${modo === 'nuevo' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}
          >
            Nuevo candidato
          </button>
        </div>
      </div>

      {modo === 'existente' ? (
        <div className="flex gap-2">
          <select className={campo} value={candidatoId} onChange={(e) => setCandidatoId(e.target.value)}>
            <option value="">Selecciona un candidato del banco…</option>
            {candidatosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo} {c.correo ? `— ${c.correo}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={agregar}
            disabled={pending || !candidatoId}
            className="shrink-0 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5"
          >
            Postular
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <input className={campo} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input className={campo} placeholder="Correo (opcional)" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <div className="flex gap-2">
            <input className={campo} placeholder="Teléfono (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <button
              type="button"
              onClick={agregar}
              disabled={pending || !nombre.trim()}
              className="shrink-0 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-bajo mt-2">{error}</p>}
    </div>
  );
}

function TarjetaPostulacion({
  postulacion,
  vacanteId,
  cargoId,
  colaboradores,
  puedeAdministrar,
  miColaboradorId,
}: {
  postulacion: Postulacion;
  vacanteId: string;
  cargoId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  puedeAdministrar: boolean;
  miColaboradorId: string | null;
}) {
  const { candidato } = postulacion;
  const [pending, startTransition] = useTransition();
  const [calificacion, setCalificacion] = useState(postulacion.calificacion?.toString() ?? '');
  const [mostrarEntrevista, setMostrarEntrevista] = useState(false);

  function cambiarEtapa(etapa: string) {
    let motivo: string | undefined;
    if (etapa === 'descartado') {
      motivo = window.prompt('Motivo del descarte (opcional):') ?? undefined;
    }
    startTransition(() => { actualizarEtapaPostulacion(postulacion.id, etapa as any, vacanteId, motivo); });
  }

  function guardarCalificacion() {
    const num = calificacion.trim() === '' ? null : Number(calificacion);
    startTransition(() => { actualizarCalificacionPostulacion(postulacion.id, num, vacanteId); });
  }

  const paramsColaborador = new URLSearchParams({
    nombre: candidato.nombre_completo,
    correo: candidato.correo ?? '',
    telefono: candidato.telefono ?? '',
    cargoId,
  }).toString();

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/reclutamiento/candidatos/${candidato.id}`} className="font-medium text-marmol-800 hover:text-flow-600 flex items-center gap-1">
            {candidato.nombre_completo} <ExternalLink size={12} />
          </Link>
          <p className="text-xs text-marmol-400">{[candidato.correo, candidato.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={13} className="text-medio" />
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              onBlur={guardarCalificacion}
              disabled={!puedeAdministrar}
              className="w-16 rounded-lg border border-marmol-200 px-2 py-1 text-sm"
              placeholder="—"
            />
          </div>

          {puedeAdministrar ? (
            <select
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm bg-white"
              value={postulacion.etapa}
              disabled={pending}
              onChange={(e) => cambiarEtapa(e.target.value)}
            >
              {ETAPAS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium rounded-full px-2.5 py-1 bg-marmol-100 text-marmol-600">
              {ETAPAS.find((e) => e.value === postulacion.etapa)?.label}
            </span>
          )}
        </div>
      </div>

      {postulacion.etapa === 'descartado' && postulacion.descartado_motivo && (
        <p className="text-xs text-bajo mt-2">Motivo: {postulacion.descartado_motivo}</p>
      )}

      {postulacion.etapa === 'contratado' && (
        <Link
          href={`/espiral-crecimiento/colaboradores/nuevo?${paramsColaborador}`}
          className="inline-flex items-center gap-1.5 mt-3 rounded-lg bg-alto/10 hover:bg-alto/20 text-alto text-xs font-medium px-3 py-1.5 transition"
        >
          <UserPlus size={13} /> Crear colaborador con estos datos
        </Link>
      )}

      {/* Entrevistas */}
      <div className="mt-3 pt-3 border-t border-marmol-100">
        {postulacion.entrevistas.length > 0 && (
          <ul className="space-y-1.5 mb-2">
            {postulacion.entrevistas.map((ent) => (
              <FilaEntrevista
                key={ent.id}
                entrevista={ent}
                vacanteId={vacanteId}
                puedeRegistrar={puedeAdministrar || ent.entrevistador?.id === miColaboradorId}
              />
            ))}
          </ul>
        )}

        {puedeAdministrar &&
          (mostrarEntrevista ? (
            <FormularioEntrevista
              postulacionId={postulacion.id}
              vacanteId={vacanteId}
              colaboradores={colaboradores}
              onListo={() => setMostrarEntrevista(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setMostrarEntrevista(true)}
              className="inline-flex items-center gap-1.5 text-xs text-flow-600 hover:text-flow-700 font-medium"
            >
              <CalendarPlus size={13} /> Agendar entrevista
            </button>
          ))}
      </div>
    </div>
  );
}

function FilaEntrevista({
  entrevista,
  vacanteId,
  puedeRegistrar,
}: {
  entrevista: Entrevista;
  vacanteId: string;
  puedeRegistrar: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [notas, setNotas] = useState(entrevista.notas ?? '');

  return (
    <li className="text-xs bg-marmol-50 rounded-lg px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-marmol-600">
          {new Date(entrevista.fecha_hora).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
          {entrevista.modalidad} {entrevista.entrevistador ? `· ${entrevista.entrevistador.nombre_completo}` : ''}
        </span>
        {puedeRegistrar ? (
          <select
            className="rounded border border-marmol-200 px-1.5 py-0.5 text-xs bg-white"
            defaultValue={entrevista.estado}
            disabled={pending}
            onChange={(e) => startTransition(() => { actualizarEntrevista(entrevista.id, e.target.value as any, notas, vacanteId); })}
          >
            <option value="programada">Programada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        ) : (
          <span className="font-medium text-marmol-500 capitalize">{entrevista.estado}</span>
        )}
      </div>
      {puedeRegistrar && (
        <textarea
          className="w-full mt-1.5 rounded border border-marmol-200 px-2 py-1 text-xs"
          rows={2}
          placeholder="Notas de la entrevista…"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          onBlur={() => startTransition(() => { actualizarEntrevista(entrevista.id, entrevista.estado as any, notas, vacanteId); })}
        />
      )}
    </li>
  );
}

function FormularioEntrevista({
  postulacionId,
  vacanteId,
  colaboradores,
  onListo,
}: {
  postulacionId: string;
  vacanteId: string;
  colaboradores: { id: string; nombre_completo: string }[];
  onListo: () => void;
}) {
  const [entrevistadorId, setEntrevistadorId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [modalidad, setModalidad] = useState<'presencial' | 'virtual' | 'telefonica'>('virtual');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agendar() {
    setError(null);
    startTransition(async () => {
      const res = await crearEntrevista({ postulacionId, entrevistadorId: entrevistadorId || undefined, fechaHora, modalidad }, vacanteId);
      if (res.ok) onListo();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <select className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs" value={entrevistadorId} onChange={(e) => setEntrevistadorId(e.target.value)}>
        <option value="">Entrevistador…</option>
        {colaboradores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre_completo}
          </option>
        ))}
      </select>
      <input type="datetime-local" className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
      <select className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs" value={modalidad} onChange={(e) => setModalidad(e.target.value as any)}>
        <option value="virtual">Virtual</option>
        <option value="presencial">Presencial</option>
        <option value="telefonica">Telefónica</option>
      </select>
      <button
        type="button"
        onClick={agendar}
        disabled={pending || !fechaHora}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5"
      >
        Agendar
      </button>
      <button type="button" onClick={onListo} className="text-xs text-marmol-400 hover:text-marmol-600">
        Cancelar
      </button>
      {error && <p className="text-xs text-bajo w-full">{error}</p>}
    </div>
  );
}
