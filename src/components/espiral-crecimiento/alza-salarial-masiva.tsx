'use client';

import { useState, useTransition } from 'react';
import { previsualizarAlzaSalarial, aplicarAlzaSalarialMasiva } from '@/app/(dashboard)/administracion/salarios/actions';
import { formatearCOP } from '@/lib/utils';
import { AlertTriangle, ArrowRight, CheckCircle2, Search } from 'lucide-react';

type Comparador = 'igual' | 'menor_o_igual' | 'mayor_o_igual';
type Modo = 'fijo' | 'porcentaje';

type FilaPreview = { id: string; nombre: string; salarioActual: number; salarioNuevo: number };

const ETIQUETA_COMPARADOR: Record<Comparador, string> = {
  igual: 'igual a',
  menor_o_igual: 'menor o igual a',
  mayor_o_igual: 'mayor o igual a',
};

export function AlzaSalarialMasiva() {
  const [comparador, setComparador] = useState<Comparador>('igual');
  const [monto, setMonto] = useState('');
  const [modo, setModo] = useState<Modo>('fijo');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState('');

  const [preview, setPreview] = useState<FilaPreview[] | null>(null);
  const [resultado, setResultado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function filtroActual() {
    return {
      comparador,
      monto: Number(monto),
      modo,
      valor: Number(valor),
      fecha,
      nota: nota || undefined,
    };
  }

  function buscar() {
    setError(null);
    setResultado(null);
    setPreview(null);
    if (!monto || !valor) {
      setError('Completa el monto de referencia y el valor del alza');
      return;
    }
    startTransition(async () => {
      const res = await previsualizarAlzaSalarial(filtroActual());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview(res.colaboradores);
    });
  }

  function aplicar() {
    setError(null);
    startTransition(async () => {
      const res = await aplicarAlzaSalarialMasiva(filtroActual());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResultado(res.actualizados);
      setPreview(null);
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-secundario">Alza salarial masiva</h2>
        <p className="text-sm text-marmol-500 mt-1">
          Para registrar de una sola vez el alza anual del salario mínimo (legal o el que fije la empresa): filtra por
          el salario actual y define el nuevo valor o el porcentaje de aumento. Solo afecta el dato de salario
          registrado en el sistema — no calcula nómina ni prestaciones.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-marmol-500 mb-1">Colaboradores con salario actual…</label>
          <div className="flex gap-2">
            <select
              value={comparador}
              onChange={(e) => setComparador(e.target.value as Comparador)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              {(Object.keys(ETIQUETA_COMPARADOR) as Comparador[]).map((c) => (
                <option key={c} value={c}>
                  {ETIQUETA_COMPARADOR[c]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="1"
              placeholder="Ej: 1300000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-marmol-500 mb-1">Fecha de vigencia</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-marmol-500 mb-1">Acción</label>
          <select
            value={modo}
            onChange={(e) => setModo(e.target.value as Modo)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          >
            <option value="fijo">Fijar el salario en un nuevo valor</option>
            <option value="porcentaje">Subir un porcentaje sobre el salario actual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-marmol-500 mb-1">
            {modo === 'fijo' ? 'Nuevo salario' : 'Porcentaje de aumento'}
          </label>
          <input
            type="number"
            min={0}
            step={modo === 'fijo' ? '1' : '0.1'}
            placeholder={modo === 'fijo' ? 'Ej: 1423500' : 'Ej: 9.5'}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-marmol-500 mb-1">Nota (opcional, queda en el historial de cada persona)</label>
          <input
            type="text"
            placeholder="Ej: Ajuste salario mínimo legal 2027"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {resultado !== null && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          Listo — se actualizó el salario de {resultado} colaborador{resultado === 1 ? '' : 'es'} y quedó registrado en su historial.
        </div>
      )}

      {!preview && (
        <button
          type="button"
          onClick={buscar}
          disabled={pendiente}
          className="inline-flex items-center gap-1.5 rounded-lg bg-marmol-100 hover:bg-marmol-200 text-marmol-700 text-sm font-medium px-3.5 py-2 transition disabled:opacity-50"
        >
          <Search size={16} /> Ver a quiénes afecta
        </button>
      )}

      {preview && (
        <div className="space-y-3">
          {preview.length === 0 ? (
            <p className="text-sm text-marmol-500">Nadie cumple ese filtro — nada para actualizar.</p>
          ) : (
            <>
              <div className="rounded-lg border border-marmol-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400 bg-marmol-50">
                      <th className="px-3 py-2 font-medium">Colaborador</th>
                      <th className="px-3 py-2 font-medium">Salario actual</th>
                      <th className="px-3 py-2 font-medium"></th>
                      <th className="px-3 py-2 font-medium">Salario nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((f) => (
                      <tr key={f.id} className="border-b border-marmol-100 last:border-0">
                        <td className="px-3 py-2 text-marmol-900">{f.nombre}</td>
                        <td className="px-3 py-2 text-marmol-600">{formatearCOP(f.salarioActual)}</td>
                        <td className="px-3 py-2 text-marmol-300">
                          <ArrowRight size={14} />
                        </td>
                        <td className="px-3 py-2 font-medium text-flow-700">{formatearCOP(f.salarioNuevo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={pendiente}
                  className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition disabled:opacity-50"
                >
                  Aplicar a {preview.length} colaborador{preview.length === 1 ? '' : 'es'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  disabled={pendiente}
                  className="text-sm text-marmol-500 hover:text-marmol-700"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
