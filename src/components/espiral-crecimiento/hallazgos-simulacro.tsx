'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crearHallazgoSimulacro, eliminarHallazgoSimulacro, crearAcpmDesdeHallazgo } from '@/app/(dashboard)/nexa/simulacros/acta-actions';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

export interface HallazgoVista {
  id: string;
  descripcion: string;
  categoria: string;
  severidad: string;
  acpmId: string | null;
  acpmCodigo: string | null;
}

const ETIQUETA_CATEGORIA: Record<string, string> = {
  no_conformidad: 'No conformidad',
  oportunidad_mejora: 'Oportunidad de mejora',
  observacion: 'Observación',
};
const CLASE_SEVERIDAD: Record<string, string> = {
  baja: 'badge-alto',
  media: 'badge-medio',
  alta: 'badge-bajo',
  critica: 'badge-bajo',
};

/** Hallazgos del simulacro, cada uno convertible en una acción ACPM con trazabilidad. */
export function HallazgosSimulacro({ simulacroId, hallazgos, editable }: { simulacroId: string; hallazgos: HallazgoVista[]; editable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('no_conformidad');
  const [severidad, setSeveridad] = useState('media');

  function correr(accion: () => Promise<{ ok: boolean; error?: string; codigo?: string }>, exito?: (codigo?: string) => void) {
    setError(null);
    setMensaje(null);
    startTransition(async () => {
      const res = await accion();
      if (!res.ok) {
        setError(res.error ?? 'No se pudo completar');
        return;
      }
      exito?.(res.codigo);
      router.refresh();
    });
  }

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
        <AlertTriangle size={16} /> Hallazgos
      </h2>
      <p className="text-xs text-marmol-500">
        Lo que el simulacro dejó en evidencia. Cada hallazgo se puede convertir en una acción de mejora (ACPM) con los datos del simulacro ya llenos,
        y queda vinculado: hallazgo → acción → cierre.
      </p>

      {hallazgos.length === 0 ? (
        <p className="text-sm text-marmol-400">Todavía no se han registrado hallazgos.</p>
      ) : (
        <ul className="divide-y divide-marmol-100">
          {hallazgos.map((h) => (
            <li key={h.id} className="py-3 flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[14rem] space-y-1">
                <p className="text-sm text-marmol-800">{h.descripcion}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-marmol-500">{ETIQUETA_CATEGORIA[h.categoria] ?? h.categoria}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${CLASE_SEVERIDAD[h.severidad] ?? ''}`}>Severidad {h.severidad}</span>
                </div>
              </div>
              {h.acpmId ? (
                <Link href="/procesos-gestion/acpm" className="inline-flex items-center gap-1 text-xs text-flow-600 hover:underline">
                  ACPM {h.acpmCodigo ?? ''} <ArrowRight size={12} />
                </Link>
              ) : (
                editable && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      correr(
                        () => crearAcpmDesdeHallazgo(h.id, simulacroId),
                        (codigo) => setMensaje(`Se creó la acción ${codigo ?? ''} en Procesos → ACPM.`)
                      )
                    }
                    className="rounded-lg border border-flow-300 text-flow-700 hover:bg-flow-50 disabled:opacity-40 text-xs font-medium px-2.5 py-1.5 transition"
                  >
                    Crear acción en ACPM
                  </button>
                )
              )}
              {editable && !h.acpmId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => correr(() => eliminarHallazgoSimulacro(h.id, simulacroId))}
                  aria-label="Eliminar hallazgo"
                  className="text-marmol-300 hover:text-bajo disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="space-y-2 pt-2 border-t border-marmol-100">
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el hallazgo (qué falló o qué se puede mejorar)"
            className={`${campo} w-full`}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoría" className={campo}>
              {Object.entries(ETIQUETA_CATEGORIA).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={severidad} onChange={(e) => setSeveridad(e.target.value)} aria-label="Severidad" className={campo}>
              <option value="baja">Severidad baja</option>
              <option value="media">Severidad media</option>
              <option value="alta">Severidad alta</option>
              <option value="critica">Severidad crítica</option>
            </select>
            <button
              type="button"
              disabled={pending || !descripcion.trim()}
              onClick={() =>
                correr(
                  () => crearHallazgoSimulacro({ simulacroId, descripcion, categoria: categoria as any, severidad: severidad as any }),
                  () => setDescripcion('')
                )
              }
              className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition"
            >
              Agregar hallazgo
            </button>
          </div>
        </div>
      )}
      {mensaje && <p className="text-sm text-alto">{mensaje}</p>}
      {error && <p className="text-sm text-bajo">{error}</p>}
    </div>
  );
}
