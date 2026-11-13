'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { eliminarExamenMedico, registrarExamenMedico } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/examenes/actions';
import { formatearFecha } from '@/lib/utils';

export interface ExamenItem {
  id: string;
  tipo: 'preingreso' | 'periodico' | 'egreso';
  fecha_realizado: string;
  proxima_fecha: string | null;
  concepto: 'apto' | 'apto_con_restricciones' | 'no_apto' | 'pendiente';
  entidad: string | null;
}

const TIPO: Record<string, string> = { preingreso: 'Preingreso', periodico: 'Periódico', egreso: 'Egreso' };
const CONCEPTO: Record<string, string> = { apto: 'Apto', apto_con_restricciones: 'Apto con restricciones', no_apto: 'No apto', pendiente: 'Pendiente' };

function estadoVigencia(proxima: string | null): { texto: string; clase: string } | null {
  if (!proxima) return null;
  const dias = Math.round((new Date(proxima).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86400000);
  if (dias < 0) return { texto: `Vencido hace ${-dias} días`, clase: 'text-bajo' };
  if (dias <= 30) return { texto: `Vence en ${dias} días`, clase: 'text-medio' };
  return { texto: `Vigente hasta ${formatearFecha(proxima)}`, clase: 'text-alto' };
}

export function ExamenesMedicos({ colaboradorId, items, puedeEditar }: { colaboradorId: string; items: ExamenItem[]; puedeEditar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<ExamenItem['tipo']>('periodico');
  const [fecha, setFecha] = useState('');
  const [proxima, setProxima] = useState('');
  const [concepto, setConcepto] = useState<ExamenItem['concepto']>('apto');
  const [entidad, setEntidad] = useState('');

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  function guardar() {
    setError(null);
    start(async () => {
      const res = await registrarExamenMedico({ colaboradorId, tipo, fechaRealizado: fecha, proximaFecha: tipo === 'periodico' ? proxima || undefined : undefined, concepto, entidad: entidad || undefined });
      if (res.ok) {
        setFecha('');
        setProxima('');
        setEntidad('');
        router.refresh();
      } else setError(res.error);
    });
  }

  function eliminar(id: string) {
    start(async () => {
      const res = await eliminarExamenMedico(colaboradorId, id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <p className="text-sm text-marmol-400">Aún no hay exámenes médicos registrados.</p>
      ) : (
        <ul className="divide-y divide-marmol-100">
          {items.map((e) => {
            const v = e.tipo === 'periodico' ? estadoVigencia(e.proxima_fecha) : null;
            return (
              <li key={e.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-marmol-900">
                    {TIPO[e.tipo]} · {CONCEPTO[e.concepto]}
                  </p>
                  <p className="text-xs text-marmol-500">
                    Realizado el {formatearFecha(e.fecha_realizado)}
                    {e.entidad ? ` · ${e.entidad}` : ''}
                  </p>
                  {v && <p className={`text-xs mt-0.5 ${v.clase}`}>{v.texto}</p>}
                </div>
                {puedeEditar && (
                  <button type="button" disabled={pending} onClick={() => eliminar(e.id)} className="text-marmol-300 hover:text-bajo shrink-0" aria-label="Eliminar examen">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {puedeEditar && (
        <div className="pt-4 border-t border-marmol-100 space-y-3">
          <p className="text-sm font-medium text-marmol-800">Registrar un examen</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-marmol-500 flex flex-col gap-1">
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as ExamenItem['tipo'])} className={campo}>
                <option value="preingreso">Preingreso</option>
                <option value="periodico">Periódico</option>
                <option value="egreso">Egreso</option>
              </select>
            </label>
            <label className="text-xs text-marmol-500 flex flex-col gap-1">
              Fecha del examen
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
            </label>
            {tipo === 'periodico' && (
              <label className="text-xs text-marmol-500 flex flex-col gap-1">
                Vence el (genera alerta de renovación)
                <input type="date" value={proxima} onChange={(e) => setProxima(e.target.value)} className={campo} />
              </label>
            )}
            <label className="text-xs text-marmol-500 flex flex-col gap-1">
              Concepto
              <select value={concepto} onChange={(e) => setConcepto(e.target.value as ExamenItem['concepto'])} className={campo}>
                {Object.entries(CONCEPTO).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-marmol-500 flex flex-col gap-1 sm:col-span-2">
              IPS o médico ocupacional (opcional)
              <input value={entidad} onChange={(e) => setEntidad(e.target.value)} className={campo} />
            </label>
          </div>
          {error && <p className="text-sm text-bajo">{error}</p>}
          <button type="button" disabled={pending || !fecha} onClick={guardar} className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2">
            {pending ? 'Guardando…' : 'Registrar examen'}
          </button>
        </div>
      )}
    </div>
  );
}
