'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import {
  importarFormacionPropuesta,
  proponerFormacionDesdeHojaVida,
  type PropuestaFormacion,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/hoja-vida/actions';

const TIPO: Record<string, string> = {
  academica: 'Estudio',
  certificacion: 'Certificación',
  curso: 'Curso',
  experiencia_laboral: 'Experiencia',
};

/**
 * Lee con IA la hoja de vida que ya está en la ficha (la que viene de la selección) y propone los registros; Talento Humano
 * marca los que sirven y se agregan SIN verificar, para no digitar a mano lo que la persona ya entregó.
 */
export function ImportarDesdeHojaVida({ colaboradorId }: { colaboradorId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [propuestas, setPropuestas] = useState<PropuestaFormacion[] | null>(null);
  const [elegidas, setElegidas] = useState<Set<number>>(new Set());
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  function leer() {
    setMensaje(null);
    start(async () => {
      const res = await proponerFormacionDesdeHojaVida(colaboradorId);
      if (res.ok) {
        setPropuestas(res.propuestas);
        setElegidas(new Set(res.propuestas.map((_, i) => i)));
      } else setMensaje({ tipo: 'error', texto: res.error });
    });
  }

  function agregar() {
    if (!propuestas) return;
    setMensaje(null);
    start(async () => {
      const res = await importarFormacionPropuesta(colaboradorId, propuestas.filter((_, i) => elegidas.has(i)));
      if (res.ok) {
        setMensaje({ tipo: 'ok', texto: res.agregados === 0 ? 'Todo eso ya estaba registrado.' : `Se agregaron ${res.agregados} registros sin verificar.` });
        setPropuestas(null);
        router.refresh();
      } else setMensaje({ tipo: 'error', texto: res.error });
    });
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-marmol-800">Llenar desde la hoja de vida</p>
          <p className="text-xs text-marmol-500">
            Lee la hoja de vida cargada (la misma que viene de la selección) y propone los estudios, certificaciones, cursos y experiencia. No guarda nada hasta que tú confirmes.
          </p>
        </div>
        {!propuestas && (
          <button type="button" disabled={pending} onClick={leer} className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-700 text-sm font-medium px-3 py-1.5 disabled:opacity-40">
            <Sparkles size={14} /> {pending ? 'Leyendo…' : 'Leer con IA'}
          </button>
        )}
      </div>

      {propuestas && (
        <div className="space-y-2">
          <ul className="divide-y divide-marmol-100 text-sm">
            {propuestas.map((p, i) => (
              <li key={i} className="py-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={elegidas.has(i)}
                  onChange={() =>
                    setElegidas((prev) => {
                      const n = new Set(prev);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                />
                <span>
                  <span className="text-xs uppercase tracking-wide text-marmol-400 mr-2">{TIPO[p.tipo]}</span>
                  <span className="text-marmol-800">{p.titulo}</span>
                  {p.institucion && <span className="text-marmol-500"> — {p.institucion}</span>}
                  {(p.fecha_inicio || p.fecha_fin) && (
                    <span className="block text-xs text-marmol-400">
                      {p.fecha_inicio ?? '?'} → {p.fecha_fin ?? 'actual'}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-marmol-400">La IA puede equivocarse: revisa lo marcado antes de agregar. Quedan sin verificar hasta que cargues su soporte.</p>
          <div className="flex gap-2">
            <button type="button" disabled={pending || elegidas.size === 0} onClick={agregar} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2">
              Agregar {elegidas.size} seleccionados
            </button>
            <button type="button" onClick={() => setPropuestas(null)} className="rounded-lg border border-marmol-200 text-marmol-500 text-sm px-4 py-2">
              Descartar
            </button>
          </div>
        </div>
      )}
      {mensaje && <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-alto' : 'text-bajo'}`}>{mensaje.texto}</p>}
    </div>
  );
}
