'use client';

import { useState, useTransition } from 'react';
import { crearReferencia, verificarReferencia } from '@/app/(dashboard)/reclutamiento/actions';
import { ShieldCheck, ShieldQuestion, Plus } from 'lucide-react';

type Referencia = {
  id: string;
  nombre_referencia: string;
  telefono_referencia: string | null;
  relacion: string | null;
  verificada: boolean;
  notas: string | null;
  verificado_en: string | null;
};

export function PanelReferencias({
  candidatoId,
  referencias,
  puedeAdministrar,
}: {
  candidatoId: string;
  referencias: Referencia[];
  puedeAdministrar: boolean;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-secundario flex items-center gap-1.5">
          <ShieldCheck size={16} /> Verificación de referencias
        </h2>
        {puedeAdministrar && !mostrarForm && (
          <button type="button" onClick={() => setMostrarForm(true)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700 font-medium">
            <Plus size={13} /> Agregar referencia
          </button>
        )}
      </div>

      {referencias.length === 0 && !mostrarForm && <p className="text-sm text-marmol-400">Sin referencias registradas.</p>}

      <ul className="space-y-2 mb-2">
        {referencias.map((r) => (
          <FilaReferencia key={r.id} referencia={r} candidatoId={candidatoId} puedeAdministrar={puedeAdministrar} />
        ))}
      </ul>

      {mostrarForm && <FormularioReferencia candidatoId={candidatoId} onListo={() => setMostrarForm(false)} />}
    </div>
  );
}

function FilaReferencia({ referencia, candidatoId, puedeAdministrar }: { referencia: Referencia; candidatoId: string; puedeAdministrar: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between text-sm bg-marmol-50 rounded-lg px-3 py-2">
      <div>
        <p className="font-medium text-marmol-800">{referencia.nombre_referencia}</p>
        <p className="text-xs text-marmol-400">{[referencia.relacion, referencia.telefono_referencia].filter(Boolean).join(' · ')}</p>
      </div>
      {referencia.verificada ? (
        <span className="inline-flex items-center gap-1 text-xs text-alto font-medium">
          <ShieldCheck size={13} /> Verificada
        </span>
      ) : puedeAdministrar ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => { verificarReferencia(referencia.id, candidatoId); })}
          className="inline-flex items-center gap-1 text-xs text-medio hover:text-medio/80 font-medium disabled:opacity-50"
        >
          <ShieldQuestion size={13} /> Marcar verificada
        </button>
      ) : (
        <span className="text-xs text-marmol-400">Pendiente</span>
      )}
    </li>
  );
}

function FormularioReferencia({ candidatoId, onListo }: { candidatoId: string; onListo: () => void }) {
  const [nombreReferencia, setNombreReferencia] = useState('');
  const [telefonoReferencia, setTelefonoReferencia] = useState('');
  const [relacion, setRelacion] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await crearReferencia({ candidatoId, nombreReferencia, telefonoReferencia, relacion });
      if (res.ok) onListo();
      else setError(res.error);
    });
  }

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-marmol-100">
      <input className={campo} placeholder="Nombre de la referencia" value={nombreReferencia} onChange={(e) => setNombreReferencia(e.target.value)} />
      <input className={campo} placeholder="Relación (jefe anterior…)" value={relacion} onChange={(e) => setRelacion(e.target.value)} />
      <input className={campo} placeholder="Teléfono" value={telefonoReferencia} onChange={(e) => setTelefonoReferencia(e.target.value)} />
      <button type="button" onClick={guardar} disabled={pending || !nombreReferencia.trim()} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5">
        Guardar
      </button>
      <button type="button" onClick={onListo} className="text-xs text-marmol-400 hover:text-marmol-600">
        Cancelar
      </button>
      {error && <p className="text-xs text-bajo w-full">{error}</p>}
    </div>
  );
}
