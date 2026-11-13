'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { guardarAspectoSer } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/guia-flow/actions';
import { ENFOQUES_SER, agruparEsquema, type AspectoEsquema, type EnfoqueSer } from '@/lib/guia-flow/esquema';

/**
 * Esquema del Ser: lo que la empresa ve de la persona, aspecto por aspecto y agrupado por la pregunta que se hace un
 * líder. Es descriptivo (sin nota). Talento Humano puede completar o corregir a mano; los demás solo leen.
 */
export function EsquemaSer({
  colaboradorId,
  guiaDelFlowId,
  aspectos,
  puedeEditar,
}: {
  colaboradorId: string;
  guiaDelFlowId: string;
  aspectos: AspectoEsquema[];
  puedeEditar: boolean;
}) {
  const grupos = agruparEsquema(aspectos);

  return (
    <div className="space-y-5">
      {grupos.map(({ grupo, aspectos: items }) => (
        <section key={grupo.clave} className="card p-5 space-y-3">
          <div>
            <h2 className="font-display font-semibold text-secundario">{grupo.titulo}</h2>
            <p className="text-xs text-marmol-500">{grupo.pregunta}</p>
          </div>
          <div className="space-y-3">
            {items.map((a) => (
              <TarjetaAspecto key={a.aspectoId} aspecto={a} colaboradorId={colaboradorId} guiaDelFlowId={guiaDelFlowId} puedeEditar={puedeEditar} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TarjetaAspecto({
  aspecto,
  colaboradorId,
  guiaDelFlowId,
  puedeEditar,
}: {
  aspecto: AspectoEsquema;
  colaboradorId: string;
  guiaDelFlowId: string;
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(aspecto.titulo ?? '');
  const [descripcion, setDescripcion] = useState(aspecto.descripcion ?? '');
  const [aprovechar, setAprovechar] = useState(aspecto.aprovechar ?? '');
  const [acompanar, setAcompanar] = useState(aspecto.acompanar ?? '');
  const [enfoque, setEnfoque] = useState<EnfoqueSer | ''>(aspecto.enfoque ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vacio = !aspecto.titulo && !aspecto.descripcion;

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await guardarAspectoSer({
        colaboradorId,
        guiaDelFlowId,
        aspectoId: aspecto.aspectoId,
        titulo,
        descripcion,
        aprovechar,
        acompanar,
        enfoque: enfoque || null,
      });
      if (!res.ok) return setError(res.error);
      setEditando(false);
      router.refresh();
    });
  }

  // Quien solo lee no ve los aspectos que la Guía no trajo.
  if (vacio && !puedeEditar) return null;

  if (editando) {
    return (
      <div className="rounded-lg border border-flow-200 bg-flow-50/40 p-3 space-y-2">
        <p className="text-sm font-medium text-marmol-800">{aspecto.nombre}</p>
        <Campo etiqueta="Título del resultado" valor={titulo} onChange={setTitulo} filas={1} />
        <Campo etiqueta="Descripción laboral (en tercera persona)" valor={descripcion} onChange={setDescripcion} filas={4} />
        <Campo etiqueta="Cómo aprovecharlo" valor={aprovechar} onChange={setAprovechar} filas={2} />
        <Campo etiqueta="Cómo acompañarle" valor={acompanar} onChange={setAcompanar} filas={2} />
        <label className="block text-xs text-marmol-500">
          Lectura
          <select value={enfoque} onChange={(e) => setEnfoque(e.target.value as EnfoqueSer | '')} className="mt-0.5 block rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Sin definir</option>
            {(Object.keys(ENFOQUES_SER) as EnfoqueSer[]).map((k) => (
              <option key={k} value={k}>
                {ENFOQUES_SER[k].etiqueta}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={guardar} disabled={pending} className="btn-primary text-xs">
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="text-xs text-marmol-500 hover:text-marmol-700">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (vacio) {
    return (
      <div className="rounded-lg border border-dashed border-marmol-200 p-3 flex items-center justify-between gap-3">
        <p className="text-sm text-marmol-400">{aspecto.nombre} · sin dato</p>
        <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-flow-700 hover:underline">
          <Plus size={12} /> Completar
        </button>
      </div>
    );
  }

  const enf = aspecto.enfoque ? ENFOQUES_SER[aspecto.enfoque] : null;

  return (
    <article className="rounded-lg border border-marmol-200 p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-marmol-400">{aspecto.nombre}</p>
          {aspecto.titulo && <h3 className="text-sm font-semibold text-marmol-800">{aspecto.titulo}</h3>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {enf && <span className={`text-[11px] rounded-full px-2 py-0.5 font-medium ${enf.clase}`}>{enf.etiqueta}</span>}
          {puedeEditar && (
            <button type="button" onClick={() => setEditando(true)} className="text-marmol-400 hover:text-marmol-700" aria-label={`Editar ${aspecto.nombre}`}>
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>
      {aspecto.descripcion && <p className="text-sm text-marmol-700">{aspecto.descripcion}</p>}
      {(aspecto.aprovechar || aspecto.acompanar) && (
        <dl className="grid gap-2 sm:grid-cols-2 pt-1">
          {aspecto.aprovechar && (
            <div className="rounded-md bg-marmol-50 px-2.5 py-2">
              <dt className="text-[11px] font-medium text-marmol-500">Cómo aprovecharlo</dt>
              <dd className="text-xs text-marmol-700 mt-0.5">{aspecto.aprovechar}</dd>
            </div>
          )}
          {aspecto.acompanar && (
            <div className="rounded-md bg-marmol-50 px-2.5 py-2">
              <dt className="text-[11px] font-medium text-marmol-500">Cómo acompañarle</dt>
              <dd className="text-xs text-marmol-700 mt-0.5">{aspecto.acompanar}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

function Campo({ etiqueta, valor, onChange, filas }: { etiqueta: string; valor: string; onChange: (v: string) => void; filas: number }) {
  return (
    <label className="block text-xs text-marmol-500">
      {etiqueta}
      <textarea value={valor} onChange={(e) => onChange(e.target.value)} rows={filas} className="mt-0.5 w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
    </label>
  );
}
