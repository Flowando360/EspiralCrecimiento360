'use client';

import { useState, useTransition } from 'react';
import { crearComunicacion, eliminarComunicacion } from '@/app/(dashboard)/procesos-gestion/comunicaciones/actions';
import { Plus, Trash2 } from 'lucide-react';

interface Fila {
  id: string;
  que_comunicar: string;
  a_quien: string;
  como: string;
  frecuencia: string | null;
  proceso_id: string | null;
  responsable_id: string | null;
}

const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function MatrizComunicaciones({
  filasIniciales,
  procesos,
  colaboradores,
  puedeEditar,
}: {
  filasIniciales: Fila[];
  procesos: { id: string; nombre: string }[];
  colaboradores: { id: string; nombre_completo: string }[];
  puedeEditar: boolean;
}) {
  const [filas, setFilas] = useState(filasIniciales);
  const [queComunicar, setQueComunicar] = useState('');
  const [aQuien, setAQuien] = useState('');
  const [como, setComo] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [procesoId, setProcesoId] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nombreProceso = new Map(procesos.map((p) => [p.id, p.nombre]));
  const nombreResponsable = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));

  function agregar() {
    setError(null);
    startTransition(async () => {
      const res = await crearComunicacion({ queComunicar, aQuien, como, frecuencia, procesoId: procesoId || undefined, responsableId: responsableId || undefined });
      if (res.ok) {
        setFilas((prev) => [...prev, { id: res.id, que_comunicar: queComunicar, a_quien: aQuien, como, frecuencia: frecuencia || null, proceso_id: procesoId || null, responsable_id: responsableId || null }]);
        setQueComunicar('');
        setAQuien('');
        setComo('');
        setFrecuencia('');
        setProcesoId('');
        setResponsableId('');
      } else {
        setError(res.error);
      }
    });
  }

  function quitar(id: string) {
    startTransition(async () => {
      const res = await eliminarComunicacion(id);
      if (res.ok) setFilas((prev) => prev.filter((f) => f.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-medium text-marmol-700">Agregar comunicación</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={campo} value={queComunicar} onChange={(e) => setQueComunicar(e.target.value)} placeholder="Qué se comunica (ej. Política de calidad)" />
            <input className={campo} value={aQuien} onChange={(e) => setAQuien(e.target.value)} placeholder="A quién (ej. Todo el personal, clientes)" />
            <input className={campo} value={como} onChange={(e) => setComo(e.target.value)} placeholder="Canal (correo, cartelera, reunión, WhatsApp…)" />
            <input className={campo} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} placeholder="Frecuencia (ej. Mensual)" />
            <select className={campo} value={procesoId} onChange={(e) => setProcesoId(e.target.value)}>
              <option value="">Proceso (opcional)</option>
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select className={campo} value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
              <option value="">Responsable (opcional)</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={agregar}
            disabled={pending || !queComunicar.trim() || !aQuien.trim() || !como.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5"
          >
            <Plus size={14} /> Agregar
          </button>
          {error && <p className="text-xs text-bajo">{error}</p>}
        </div>
      )}

      <div className="card overflow-x-auto">
        {filas.length === 0 ? (
          <p className="p-6 text-sm text-marmol-500">Todavía no hay comunicaciones registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-marmol-400 border-b border-marmol-100">
                <th className="font-medium px-4 py-2">Qué se comunica</th>
                <th className="font-medium px-4 py-2">A quién</th>
                <th className="font-medium px-4 py-2">Canal</th>
                <th className="font-medium px-4 py-2">Frecuencia</th>
                <th className="font-medium px-4 py-2">Proceso</th>
                <th className="font-medium px-4 py-2">Responsable</th>
                {puedeEditar && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-marmol-50 last:border-0">
                  <td className="px-4 py-2 text-marmol-800">{f.que_comunicar}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.a_quien}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.como}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.frecuencia ?? '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.proceso_id ? nombreProceso.get(f.proceso_id) : '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.responsable_id ? nombreResponsable.get(f.responsable_id) : '—'}</td>
                  {puedeEditar && (
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => quitar(f.id)} className="text-marmol-300 hover:text-bajo" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
