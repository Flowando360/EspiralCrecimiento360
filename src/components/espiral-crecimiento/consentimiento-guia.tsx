'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { guardarConsentimientoGuia } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/guia-flow/consentimiento-actions';
import { FINALIDAD_GUIA } from '@/lib/guia-flow/consentimiento';

/** Lo ve la propia persona: qué comparte de su Guía del Flow, para qué y quién lo puede ver. */
export function ConsentimientoGuia({ inicial }: { inicial: { decidido: boolean; comparteConLider: boolean } }) {
  const router = useRouter();
  const [comparte, setComparte] = useState(inicial.comparteConLider);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      const res = await guardarConsentimientoGuia({ comparteConLider: comparte });
      if (!res.ok) return setError(res.error);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
        <ShieldCheck size={18} className="text-ser" /> Tu decisión sobre tu Guía del Flow
      </h2>
      {!inicial.decidido && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Todavía no has decidido. Mientras tanto, tu líder directo puede ver el informe de lo que tiene relevancia laboral.
        </p>
      )}
      <ul className="list-disc pl-5 text-sm text-marmol-700 space-y-1">
        {FINALIDAD_GUIA.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-marmol-500 mb-1">¿Quién puede ver el informe de tu Guía (además de Talento Humano)?</legend>
        <label className="flex items-start gap-2 text-sm text-marmol-700">
          <input type="radio" name="comparte" checked={comparte} onChange={() => setComparte(true)} className="mt-1" />
          <span>Mi líder directo, para acompañar mi desarrollo.</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-marmol-700">
          <input type="radio" name="comparte" checked={!comparte} onChange={() => setComparte(false)} className="mt-1" />
          <span>Solo yo y Talento Humano.</span>
        </label>
      </fieldset>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={guardar} disabled={pending} className="btn-primary text-xs">
          {pending ? 'Guardando…' : 'Guardar mi decisión'}
        </button>
        {guardado && <span className="text-xs text-alto">Guardado. Puedes cambiarla cuando quieras.</span>}
      </div>
    </div>
  );
}
