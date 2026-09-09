import { createClient } from '@/lib/supabase/server';
import { Compass } from 'lucide-react';

/**
 * Bloque de referencia (propósito, principios y valores de la empresa) para
 * mostrar en los informes — no interactivo, solo contexto. No se muestra
 * nada si la empresa aún no ha llenado su identidad organizacional.
 */
export async function IdentidadReferencia({ empresaId }: { empresaId: string }) {
  const supabase = createClient();

  const [{ data: identidad }, { data: elementos }] = await Promise.all([
    supabase.from('empresa_identidad').select('proposito_superior').eq('empresa_id', empresaId).maybeSingle(),
    supabase
      .from('empresa_identidad_elementos')
      .select('tipo, nombre')
      .eq('empresa_id', empresaId)
      .order('orden'),
  ]);

  const principios = (elementos ?? []).filter((e) => e.tipo === 'principio');
  const valores = (elementos ?? []).filter((e) => e.tipo === 'valor');

  if (!identidad?.proposito_superior && principios.length === 0 && valores.length === 0) return null;

  return (
    <div className="rounded-xl border border-secundario/15 bg-secundario/5 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-secundario">
        <Compass size={14} /> Referencia organizacional
      </div>
      {identidad?.proposito_superior && <p className="text-sm text-marmol-700">{identidad.proposito_superior}</p>}
      {(principios.length > 0 || valores.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {principios.map((p) => (
            <span
              key={`principio-${p.nombre}`}
              className="text-xs rounded-full border border-secundario/20 bg-white px-2 py-0.5 text-secundario"
            >
              {p.nombre}
            </span>
          ))}
          {valores.map((v) => (
            <span
              key={`valor-${v.nombre}`}
              className="text-xs rounded-full border border-flow-200 bg-white px-2 py-0.5 text-flow-700"
            >
              {v.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
