'use client';

import { useState, useTransition } from 'react';
import { revisarDatoExtraido } from '@/app/(dashboard)/reclutamiento/procesamiento-actions';
import { CAMPOS_CORREGIBLES, type TablaFicha } from '@/lib/reclutamiento/correcciones';
import { GraduationCap, Briefcase, Wrench, Languages, Award, Check, Ban, Pencil } from 'lucide-react';

export type FilaFicha = {
  id: string;
  requiere_revision: boolean;
  procedencia: string;
  evidencia: string | null;
  [campo: string]: unknown;
};

const PROCEDENCIA_TEXTO: Record<string, string> = {
  extraido: 'Extraído',
  inferido: 'Inferido',
  declarado: 'Declarado',
  verificado: 'Verificado',
  normalizado: 'Normalizado',
  no_informado: 'No informado',
  en_conflicto: 'En conflicto',
};

const NIVEL_TEXTO: Record<string, string> = {
  bachillerato: 'Bachillerato',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  universitario: 'Universitario',
  especializacion: 'Especialización',
  maestria: 'Maestría',
  doctorado: 'Doctorado',
  certificacion_corta: 'Certificación corta',
  otro: 'Otro',
};

const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v : '');
const fechas = (inicio: unknown, fin: unknown, enCurso?: unknown) => {
  const a = texto(inicio) || '—';
  const b = enCurso ? 'actualidad' : texto(fin) || '—';
  return `${a} → ${b}`;
};

export function DatosEstructurados({
  candidatoId,
  puedeRevisar,
  educacion,
  experiencia,
  competencias,
  idiomas,
  certificaciones,
}: {
  candidatoId: string;
  puedeRevisar: boolean;
  educacion: FilaFicha[];
  experiencia: FilaFicha[];
  competencias: FilaFicha[];
  idiomas: FilaFicha[];
  certificaciones: FilaFicha[];
}) {
  const vacio = educacion.length + experiencia.length + competencias.length + idiomas.length + certificaciones.length === 0;

  return (
    <div className="card p-5 space-y-5">
      <h2 className="font-display font-semibold text-secundario">Ficha estructurada</h2>
      {vacio && <p className="text-sm text-marmol-400">Todavía no hay datos estructurados. Aparecerán cuando se lea la hoja de vida.</p>}

      <Seccion titulo="Formación académica" icono={<GraduationCap size={14} />} vacia={educacion.length === 0}>
        {educacion.map((f) => (
          <FilaRevisable
            key={f.id}
            tabla="candidato_educacion"
            fila={f}
            candidatoId={candidatoId}
            puedeRevisar={puedeRevisar}
            principal="titulo"
            titulo={texto(f.titulo)}
            detalle={[NIVEL_TEXTO[texto(f.nivel)] ?? '', texto(f.institucion), texto(f.estado) === 'en_curso' ? 'En curso' : texto(f.estado) === 'no_determinado' ? 'Estado no determinado' : '', fechas(f.fecha_inicio, f.fecha_fin)].filter(Boolean).join(' · ')}
          />
        ))}
      </Seccion>

      <Seccion titulo="Experiencia laboral" icono={<Briefcase size={14} />} vacia={experiencia.length === 0}>
        {experiencia.map((f) => (
          <FilaRevisable
            key={f.id}
            tabla="candidato_experiencia"
            fila={f}
            candidatoId={candidatoId}
            puedeRevisar={puedeRevisar}
            principal="cargo"
            titulo={[texto(f.cargo), texto(f.organizacion)].filter(Boolean).join(' · ') || 'Sin cargo'}
            detalle={[fechas(f.fecha_inicio, f.fecha_fin, f.en_curso), (f.herramientas as string[] | undefined)?.join(', ')].filter(Boolean).join(' · ')}
            extra={texto(f.funciones)}
          />
        ))}
      </Seccion>

      <Seccion titulo="Competencias y herramientas" icono={<Wrench size={14} />} vacia={competencias.length === 0}>
        {competencias.map((f) => (
          <FilaRevisable
            key={f.id}
            tabla="candidato_competencias"
            fila={f}
            candidatoId={candidatoId}
            puedeRevisar={puedeRevisar}
            principal="nombre"
            titulo={texto(f.nombre)}
            detalle={[texto(f.tipo), texto(f.nivel)].filter(Boolean).join(' · ')}
          />
        ))}
      </Seccion>

      <Seccion titulo="Idiomas" icono={<Languages size={14} />} vacia={idiomas.length === 0}>
        {idiomas.map((f) => (
          <FilaRevisable
            key={f.id}
            tabla="candidato_idiomas"
            fila={f}
            candidatoId={candidatoId}
            puedeRevisar={puedeRevisar}
            principal="idioma"
            titulo={texto(f.idioma)}
            detalle={texto(f.nivel)}
          />
        ))}
      </Seccion>

      <Seccion titulo="Certificaciones" icono={<Award size={14} />} vacia={certificaciones.length === 0}>
        {certificaciones.map((f) => (
          <FilaRevisable
            key={f.id}
            tabla="candidato_certificaciones"
            fila={f}
            candidatoId={candidatoId}
            puedeRevisar={puedeRevisar}
            principal="nombre"
            titulo={texto(f.nombre)}
            detalle={[texto(f.entidad), texto(f.vigente_hasta) ? `vigente hasta ${texto(f.vigente_hasta)}` : ''].filter(Boolean).join(' · ')}
          />
        ))}
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, icono, vacia, children }: { titulo: string; icono: React.ReactNode; vacia: boolean; children: React.ReactNode }) {
  if (vacia) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-marmol-500 flex items-center gap-1.5">
        {icono} {titulo}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FilaRevisable({
  tabla,
  fila,
  candidatoId,
  puedeRevisar,
  principal,
  titulo,
  detalle,
  extra,
}: {
  tabla: TablaFicha;
  fila: FilaFicha;
  candidatoId: string;
  puedeRevisar: boolean;
  principal: string;
  titulo: string;
  detalle: string;
  extra?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(texto(fila[principal]));
  const [error, setError] = useState<string | null>(null);

  const revisar = (accion: 'aceptar' | 'no_verificable' | 'corregir') => {
    setError(null);
    startTransition(async () => {
      const r = await revisarDatoExtraido({
        candidatoId,
        tabla,
        registroId: fila.id,
        accion,
        campo: accion === 'corregir' ? principal : undefined,
        valorNuevo: accion === 'corregir' ? valor : undefined,
      });
      if (!r.ok) setError(r.error);
      else setEditando(false);
    });
  };

  const puedeCorregirPrincipal = !!CAMPOS_CORREGIBLES[tabla][principal];

  return (
    <li className="rounded-lg bg-marmol-50 px-3 py-2 text-sm space-y-1">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-medium text-marmol-800">
            {titulo}
            {fila.requiere_revision && <span className="ml-2 text-[11px] font-medium text-medio bg-medio/10 rounded-full px-2 py-0.5">Revisar</span>}
          </p>
          {detalle && <p className="text-xs text-marmol-500">{detalle}</p>}
          {extra && <p className="text-xs text-marmol-500 line-clamp-2">{extra}</p>}
          {fila.evidencia && <p className="text-[11px] text-marmol-400 italic mt-0.5">“{String(fila.evidencia).slice(0, 160)}”</p>}
          <p className="text-[11px] text-marmol-400 mt-0.5">{PROCEDENCIA_TEXTO[fila.procedencia] ?? fila.procedencia}</p>
        </div>

        {puedeRevisar && fila.requiere_revision && !editando && (
          <div className="flex items-center gap-3 text-xs font-medium">
            <button type="button" disabled={pending} onClick={() => revisar('aceptar')} className="inline-flex items-center gap-1 text-alto hover:underline disabled:opacity-50">
              <Check size={12} /> Aceptar
            </button>
            <button type="button" disabled={pending} onClick={() => revisar('no_verificable')} className="inline-flex items-center gap-1 text-marmol-500 hover:underline disabled:opacity-50">
              <Ban size={12} /> No verificable
            </button>
            {puedeCorregirPrincipal && (
              <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-flow-600 hover:underline">
                <Pencil size={12} /> Corregir
              </button>
            )}
          </div>
        )}
      </div>

      {editando && (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="flex-1 rounded-lg border border-marmol-200 px-2 py-1 text-sm"
            placeholder={principal.startsWith('fecha') || principal === 'fecha_fin' ? 'AAAA-MM o AAAA-MM-DD' : ''}
          />
          <button type="button" disabled={pending} onClick={() => revisar('corregir')} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50">
            Guardar
          </button>
          <button type="button" onClick={() => setEditando(false)} className="text-xs text-marmol-500 hover:underline">
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="text-xs text-bajo">{error}</p>}
    </li>
  );
}
