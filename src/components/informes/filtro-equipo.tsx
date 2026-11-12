import Link from 'next/link';
import { Filter } from 'lucide-react';
import type { FiltrosEquipo } from '@/lib/informes/filtros-equipo';

/**
 * Selector de área y líder directo para los informes. Es un formulario GET
 * (sin JavaScript): al aplicar recarga el informe con ?area=…&liderId=…
 * `conservar` son otros parámetros de la URL que deben mantenerse (p. ej. colaboradorId).
 */
export function FiltroEquipo({
  rutaBase,
  areas,
  lideres,
  actuales,
  conservar = {},
  mostrarLider = true,
}: {
  rutaBase: string;
  areas: string[];
  lideres: { id: string; nombre: string }[];
  actuales: FiltrosEquipo;
  conservar?: Record<string, string | undefined>;
  mostrarLider?: boolean;
}) {
  if (areas.length === 0 && lideres.length === 0) return null;
  const activo = Boolean(actuales.area || actuales.liderId);
  return (
    <form action={rutaBase} method="get" className="card p-3 flex flex-wrap items-end gap-3">
      {Object.entries(conservar).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <div className="flex items-center gap-1.5 text-xs text-marmol-500 pb-2">
        <Filter size={13} /> Filtrar por
      </div>
      {areas.length > 0 && (
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Área o proceso
          <select name="area" defaultValue={actuales.area ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm min-w-[11rem]">
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      )}
      {mostrarLider && lideres.length > 0 && (
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Líder directo
          <select name="liderId" defaultValue={actuales.liderId ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm min-w-[11rem]">
            <option value="">Todos los líderes</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>
                Equipo de {l.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition">
        Aplicar
      </button>
      {activo && (
        <Link href={rutaBase} className="text-xs text-flow-600 hover:underline pb-2">
          Quitar filtros
        </Link>
      )}
    </form>
  );
}
