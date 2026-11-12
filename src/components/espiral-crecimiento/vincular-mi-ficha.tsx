'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { vincularMiFicha } from '@/app/(dashboard)/mi-perfil/actions';

/** Talento Humano elige su propia ficha y vincula su cuenta, sin pedirle a otro administrador. */
export function VincularMiFicha({ fichas }: { fichas: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [elegida, setElegida] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function vincular() {
    if (!elegida) return;
    setError(null);
    startTransition(async () => {
      const res = await vincularMiFicha(elegida);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario">Vincula tu cuenta a tu ficha</h2>
      <p className="text-sm text-marmol-500 max-w-xl">
        Tu usuario aún no está vinculado a una ficha de colaborador. Como eres de Talento Humano, puedes hacerlo tú misma desde aquí: elige tu ficha y listo.
        Si todavía no tienes ficha, créala primero en Espiral 360° → Colaboradores → Nuevo colaborador.
      </p>
      {fichas.length === 0 ? (
        <p className="text-sm text-marmol-400">No hay fichas libres (sin cuenta de acceso) para vincular.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select value={elegida} onChange={(e) => setElegida(e.target.value)} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm min-w-[16rem]">
            <option value="">Elige tu ficha…</option>
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
          <button type="button" onClick={vincular} disabled={pending || !elegida} className="btn-primary text-xs disabled:opacity-40">
            {pending ? 'Vinculando…' : 'Vincular mi ficha'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
