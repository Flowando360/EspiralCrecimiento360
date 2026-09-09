'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buscarPaginaPorRuta } from '@/content/ayuda';
import { buscarEnAyuda, type ResultadoBusqueda } from '@/content/ayuda/buscador';
import { HelpCircle, X, Search, BookOpen, HelpingHand, SpellCheck, ClipboardList } from 'lucide-react';

const ETIQUETA_TIPO: Record<ResultadoBusqueda['tipo'], string> = {
  manual: 'Manual',
  faq: 'FAQ',
  glosario: 'Glosario',
};

export function CentroAyudaBoton() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState('');

  const contextual = buscarPaginaPorRuta(pathname);
  const resultados = consulta.trim() ? buscarEnAyuda(consulta) : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg p-2 text-marmol-500 hover:bg-marmol-100 transition"
        title="Centro de Ayuda"
      >
        <HelpCircle size={18} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setAbierto(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-marmol-100">
              <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
                <HelpCircle size={18} className="text-flow-500" /> Centro de Ayuda
              </h2>
              <button onClick={() => setAbierto(false)} className="text-marmol-400 hover:text-marmol-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-marmol-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
                <input
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  placeholder="Buscar en la ayuda…"
                  className="w-full rounded-lg border border-marmol-200 pl-8 pr-2.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {consulta.trim() ? (
                <div className="space-y-2">
                  {resultados.length === 0 ? (
                    <p className="text-sm text-marmol-400">Sin resultados para "{consulta}".</p>
                  ) : (
                    resultados.map((r, i) => (
                      <Link
                        key={i}
                        href={r.href}
                        onClick={() => setAbierto(false)}
                        className="block rounded-lg border border-marmol-200 p-3 hover:border-flow-300 transition"
                      >
                        <span className="text-[10px] uppercase tracking-wide text-flow-600 font-medium">
                          {ETIQUETA_TIPO[r.tipo]}
                        </span>
                        <p className="text-sm font-medium text-marmol-800">{r.titulo}</p>
                        <p className="text-xs text-marmol-500 line-clamp-2 mt-0.5">{r.texto}</p>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {contextual ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-flow-600 font-medium mb-1">
                        Esta pantalla · {contextual.modulo.titulo}
                      </p>
                      <h3 className="font-display font-semibold text-secundario">{contextual.pagina.titulo}</h3>
                      <p className="text-sm text-marmol-600 mt-1">{contextual.pagina.resumen}</p>

                      {contextual.pagina.camposYBotones && contextual.pagina.camposYBotones.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {contextual.pagina.camposYBotones.map((c) => (
                            <div key={c.nombre} className="text-sm">
                              <span className="font-medium text-marmol-800">{c.nombre}: </span>
                              <span className="text-marmol-600">{c.explicacion}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {contextual.pagina.proceso && contextual.pagina.proceso.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-marmol-500 mb-1">Proceso</p>
                          <ol className="list-decimal list-inside text-sm text-marmol-600 space-y-1">
                            {contextual.pagina.proceso.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {contextual.pagina.notas && contextual.pagina.notas.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {contextual.pagina.notas.map((n, i) => (
                            <p key={i} className="text-xs text-marmol-500 bg-marmol-50 rounded-lg px-2.5 py-2">
                              {n}
                            </p>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/ayuda/modulo/${contextual.modulo.slug}/${contextual.pagina.slug}`}
                        onClick={() => setAbierto(false)}
                        className="inline-block mt-4 text-sm text-flow-600 hover:text-flow-700 font-medium"
                      >
                        Ver en el manual completo →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-marmol-500">
                      Todavía no hay ayuda específica para esta pantalla. Explora el Centro de Ayuda completo abajo.
                    </p>
                  )}

                  <div className="border-t border-marmol-100 pt-4 space-y-1">
                    <Link
                      href="/ayuda"
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <BookOpen size={15} /> Centro de Ayuda completo
                    </Link>
                    <Link
                      href="/ayuda/faq"
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <HelpingHand size={15} /> Preguntas frecuentes
                    </Link>
                    <Link
                      href="/ayuda/glosario"
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <SpellCheck size={15} /> Glosario
                    </Link>
                    <Link
                      href="/ayuda/plan-pruebas"
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <ClipboardList size={15} /> Plan de pruebas
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
