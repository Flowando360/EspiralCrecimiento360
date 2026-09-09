'use client';

import { useState, useTransition } from 'react';
import { agregarIncapacidad, eliminarIncapacidad } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/incapacidades/actions';
import { formatearFecha } from '@/lib/utils';
import { Plus, Trash2, Paperclip } from 'lucide-react';

const ETIQUETA_TIPO: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_laboral: 'Accidente laboral',
  enfermedad_laboral: 'Enfermedad laboral',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otra: 'Otra',
};

const TIPOS = Object.keys(ETIQUETA_TIPO);

export interface IncapacidadItem {
  id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  entidad_emisora: string | null;
  soporteUrl: string | null;
}

export function ListaIncapacidades({
  colaboradorId,
  itemsIniciales,
  puedeEditar,
}: {
  colaboradorId: string;
  itemsIniciales: IncapacidadItem[];
  puedeEditar: boolean;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function agregar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await agregarIncapacidad(formData);
      if (res.ok) {
        setItems((prev) =>
          [{ ...res.incapacidad, soporteUrl: null } as unknown as IncapacidadItem, ...prev].sort((a, b) =>
            b.fecha_inicio.localeCompare(a.fecha_inicio)
          )
        );
        setMostrarForm(false);
      } else {
        setError(res.error);
      }
    });
  }

  function eliminar(id: string) {
    if (!confirm('¿Eliminar este registro de incapacidad?')) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarIncapacidad(id, colaboradorId);
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-marmol-400">Sin incapacidades ni licencias registradas.</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between border-b border-marmol-100 pb-2 last:border-0">
              <div>
                <p className="text-sm font-medium text-marmol-800">{ETIQUETA_TIPO[i.tipo] ?? i.tipo}</p>
                <p className="text-xs text-marmol-500">
                  {formatearFecha(i.fecha_inicio)} — {formatearFecha(i.fecha_fin)} · {i.dias} día{i.dias === 1 ? '' : 's'}
                  {i.entidad_emisora ? ` · ${i.entidad_emisora}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {i.soporteUrl && (
                  <a href={i.soporteUrl} target="_blank" rel="noopener noreferrer" className="text-marmol-400 hover:text-flow-600" title="Ver soporte">
                    <Paperclip size={14} />
                  </a>
                )}
                {puedeEditar && (
                  <button type="button" onClick={() => eliminar(i.id)} disabled={pending} className="text-marmol-400 hover:text-bajo disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {puedeEditar && (
        <div>
          {!mostrarForm ? (
            <button type="button" onClick={() => setMostrarForm(true)} className="inline-flex items-center gap-1.5 text-sm text-flow-600 hover:text-flow-700">
              <Plus size={16} /> Registrar incapacidad
            </button>
          ) : (
            <form action={agregar} className="rounded-lg border border-marmol-200 p-3 space-y-2">
              <input type="hidden" name="colaboradorId" value={colaboradorId} />
              <select name="tipo" defaultValue="enfermedad_general" className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO[t]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="date" name="fechaInicio" required className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
                <input type="date" name="fechaFin" required className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
              </div>
              <input
                type="text"
                name="entidadEmisora"
                placeholder="EPS o ARL que la certifica (opcional)"
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <input type="file" name="archivo" accept=".pdf,.jpg,.jpeg,.png" className="text-sm w-full" />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition"
                >
                  {pending ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-3.5 py-1.5 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
