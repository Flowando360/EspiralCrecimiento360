'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { normalizarBusqueda } from '@/lib/utils';

/** Texto de una fila sin contar lo que hay dentro de selectores, botones o áreas de texto. */
function textoDeFila(tr: HTMLTableRowElement): string {
  const copia = tr.cloneNode(true) as HTMLElement;
  copia.querySelectorAll('select, option, textarea, button, script, style').forEach((n) => n.remove());
  return (copia.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function indiceColumna(tabla: HTMLTableElement, nombre: string): number {
  const ths = Array.from(tabla.querySelectorAll('thead th'));
  return ths.findIndex((th) => normalizarBusqueda(th.textContent ?? '') === normalizarBusqueda(nombre));
}

/**
 * Agrega búsqueda por texto y filtros por columna a una tabla que ya viene
 * pintada desde el servidor, sin tener que rehacer la pantalla.
 *   <FiltroTabla columnas={['Estado']}> <table>…</table> </FiltroTabla>
 * Cada nombre de `columnas` debe coincidir con el encabezado (<th>) de la
 * tabla; sus opciones salen solas de los valores que hay en esa columna.
 */
export function FiltroTabla({
  children,
  columnas = [],
  placeholder = 'Buscar…',
  plural = 'registros',
}: {
  children: React.ReactNode;
  columnas?: string[];
  placeholder?: string;
  plural?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [opciones, setOpciones] = useState<Record<string, string[]>>({});
  const [conteo, setConteo] = useState({ visibles: 0, total: 0 });

  const filasDe = useCallback(() => {
    const filas: { tr: HTMLTableRowElement; tabla: HTMLTableElement }[] = [];
    raiz.current?.querySelectorAll('table').forEach((tabla) => {
      tabla.querySelectorAll('tbody tr').forEach((tr) => {
        const primera = tr.firstElementChild as HTMLTableCellElement | null;
        // Se ignoran las filas de aviso («sin datos») que ocupan todo el ancho
        if (primera && primera.colSpan > 1) return;
        filas.push({ tr: tr as HTMLTableRowElement, tabla });
      });
    });
    return filas;
  }, []);

  const aplicar = useCallback(() => {
    const q = normalizarBusqueda(texto);
    const filas = filasDe();
    let visibles = 0;
    for (const { tr, tabla } of filas) {
      let ok = !q || normalizarBusqueda(textoDeFila(tr)).includes(q);
      if (ok) {
        for (const col of columnas) {
          const elegido = valores[col];
          if (!elegido) continue;
          const i = indiceColumna(tabla, col);
          if (i < 0) continue;
          const celda = tr.children[i] as HTMLElement | undefined;
          if (!celda || textoDeFila(celda as unknown as HTMLTableRowElement) !== elegido) {
            ok = false;
            break;
          }
        }
      }
      tr.style.display = ok ? '' : 'none';
      if (ok) visibles++;
    }
    setConteo((prev) => (prev.visibles === visibles && prev.total === filas.length ? prev : { visibles, total: filas.length }));
  }, [texto, valores, columnas, filasDe]);

  // Opciones de cada filtro: los valores distintos que aparecen en la columna
  const calcularOpciones = useCallback(() => {
    const nuevas: Record<string, string[]> = {};
    for (const col of columnas) {
      const set = new Set<string>();
      for (const { tr, tabla } of filasDe()) {
        const i = indiceColumna(tabla, col);
        const celda = i >= 0 ? (tr.children[i] as HTMLElement | undefined) : undefined;
        const v = celda ? textoDeFila(celda as unknown as HTMLTableRowElement) : '';
        if (v && v !== '—') set.add(v);
      }
      nuevas[col] = Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
    }
    setOpciones((prev) => (JSON.stringify(prev) === JSON.stringify(nuevas) ? prev : nuevas));
  }, [columnas, filasDe]);

  useEffect(() => {
    calcularOpciones();
    aplicar();
    // Si el servidor vuelve a pintar filas (por ejemplo tras guardar), se reaplica el filtro
    const el = raiz.current;
    if (!el) return;
    const obs = new MutationObserver(() => {
      calcularOpciones();
      aplicar();
    });
    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [aplicar, calcularOpciones]);

  const hayFiltro = Boolean(texto || Object.values(valores).some(Boolean));

  return (
    <div ref={raiz} className="space-y-3">
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            aria-label="Buscar"
            className="w-full rounded-lg border border-marmol-200 pl-8 pr-3 py-2 text-sm"
          />
        </div>
        {columnas.map((col) =>
          (opciones[col]?.length ?? 0) > 0 ? (
            <select
              key={col}
              value={valores[col] ?? ''}
              onChange={(e) => setValores((prev) => ({ ...prev, [col]: e.target.value }))}
              aria-label={`Filtrar por ${col}`}
              className="rounded-lg border border-marmol-200 px-3 py-2 text-sm min-w-[10rem]"
            >
              <option value="">{col}: todos</option>
              {(opciones[col] ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null
        )}
        {hayFiltro && (
          <button
            type="button"
            onClick={() => {
              setTexto('');
              setValores({});
            }}
            className="text-xs text-flow-600 hover:text-flow-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {conteo.total > 0 && (
        <p className="text-xs text-marmol-500">
          Mostrando {conteo.visibles} de {conteo.total} {plural}.
          {conteo.visibles === 0 && ' Ninguno coincide con estos filtros.'}
        </p>
      )}
      {children}
    </div>
  );
}
